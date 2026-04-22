import logging
from typing import Dict, List
from pathlib import Path

from annotated_types import doc

from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_groq import ChatGroq

from langchain.chains.llm import LLMChain
from langchain.prompts import PromptTemplate

from config import settings
from utils import extract_page_numbers, format_context

logger = logging.getLogger(__name__)


# 🔥 Generic noise filter (works for ANY document)
def is_noise(text: str) -> bool:
    text = text.lower()
    return (
        len(text.strip()) < 50 or
        text.count("[") > 8 or
        text.count("http") > 3
    )


# 🔥 Smart scoring (generic relevance ranking)
def score_doc(doc, query: str) -> int:
    text = doc.page_content.lower()
    query_words = query.lower().split()

    score = sum(word in text for word in query_words)

    # Boost common important sections (generic)
    important_sections = ["introduction", "method", "approach", "summary", "conclusion"]
    if any(section in text for section in important_sections):
        score += 2

    return score


class RAGPipeline:
    def __init__(self):
        self._initialize_components()

    def _initialize_components(self):
        try:
            self.embeddings = HuggingFaceEmbeddings(
                model_name=settings.EMBEDDING_MODEL,
                model_kwargs={'device': 'cpu'}
            )

            self.vectorstore = Chroma(
                persist_directory=str(settings.CHROMA_DB_DIR),
                embedding_function=self.embeddings,
                collection_name="pdf_documents"
            )

            if not settings.GROQ_API_KEY:
                raise ValueError("GROQ_API_KEY missing in .env")

            self.llm = ChatGroq(
                model=settings.LLM_MODEL,
                api_key=settings.GROQ_API_KEY,
                temperature=0.1
            )

        except Exception as e:
            logger.error(f"Init error: {e}")
            raise

    def process_pdf(self, file_path: Path) -> Dict:
        try:
            loader = PyPDFLoader(str(file_path))
            documents = loader.load()

            splitter = RecursiveCharacterTextSplitter(
                chunk_size=settings.CHUNK_SIZE,
                chunk_overlap=settings.CHUNK_OVERLAP
            )

            chunks = splitter.split_documents(documents)

            self.vectorstore.add_documents(chunks)
            self.vectorstore.persist()

            return {
                "success": True,
                "pages": len(documents),
                "chunks": len(chunks),
                "message": "PDF processed successfully"
            }

        except Exception as e:
            return {"success": False, "error": str(e)}

    def query(self, question: str) -> Dict:
        try:
            if self.get_document_count() == 0:
                return {"answer": "No documents uploaded", "sources": []}

            # 🔥 STEP 1: Expand query (improves recall)
            expanded_queries = [
                question,
                f"Explain {question}",
                f"Detailed explanation of {question}"
            ]

            retriever = self.vectorstore.as_retriever(search_kwargs={"k": 10})

            all_docs = []

            # 🔥 STEP 2: Multi-query retrieval
            for q in expanded_queries:
                docs = retriever.get_relevant_documents(q)
                all_docs.extend(docs)

            # 🔥 STEP 3: Remove duplicates
            seen = set()
            unique_docs = []
            for d in all_docs:
                if d.page_content not in seen:
                    unique_docs.append(d)
                    seen.add(d.page_content)

            # 🔥 STEP 4: Smart scoring (better than before)
            def score_doc(doc):
                text = doc.page_content.lower()
                score = 0

                # keyword match
                for word in question.lower().split():
                    if word in text:
                        score += 2

                # semantic hints
                important_sections = [
                    "introduction", "method", "approach",
                    "architecture", "result", "conclusion", "summary"
                ]
                if any(sec in text for sec in important_sections):
                    score += 3

                # penalize noisy chunks
                if text.count("[") > 5 or len(text) < 50:
                    score -= 2

                return score

            # 🔥 STEP 5: Re-rank
            ranked_docs = sorted(unique_docs, key=score_doc, reverse=True)

            # 🔥 STEP 6: Take best context
            top_docs = ranked_docs[:5]

            if not top_docs:
                return {"answer": "Not found in document", "sources": []}

            context = format_context(top_docs)

            # 🔥 STEP 7: PRODUCTION PROMPT (VERY IMPORTANT)
            prompt = PromptTemplate(
                template="""
You are an expert AI assistant answering questions from documents.

Context:
{context}

Question: {question}

Instructions:
- Answer clearly and professionally
- Use structured explanation if possible
- If it's a concept (like methodology), break into steps
- If information is partial, combine relevant parts intelligently
- Do NOT mention "context" or "document"
- Do NOT guess beyond given information
- If not found, say "Not found in document"

Answer:
""",
                input_variables=["context", "question"]
            )

            chain = LLMChain(llm=self.llm, prompt=prompt)

            answer = chain.predict(context=context, question=question)

            sources = extract_page_numbers(top_docs)

            return {
                "answer": answer.strip(),
                "sources": sources
            }

        except Exception as e:
            return {"answer": str(e), "sources": []}

    def get_document_count(self):
        try:
            return self.vectorstore._collection.count()
        except:
            return 0
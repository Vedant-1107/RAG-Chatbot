"""
Utility functions for the RAG chatbot.
"""
import re
from typing import List, Dict
from pathlib import Path
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def is_summary_query(query: str) -> bool:
    """
    Detect if the query is asking for a summary or overview.
    
    Args:
        query: User's question
        
    Returns:
        True if it's a summary query, False otherwise
    """
    summary_keywords = [
        "summarize", "summary", "overview", "explain everything",
        "what is this about", "main points", "key points",
        "tell me about", "what does", "describe", "entire document",
        "whole document", "all about", "comprehensive"
    ]
    
    query_lower = query.lower()
    return any(keyword in query_lower for keyword in summary_keywords)

def extract_page_numbers(documents: List) -> List[str]:
    """
    Extract unique page numbers from retrieved documents.
    
    Args:
        documents: List of retrieved document chunks
        
    Returns:
        List of page references
    """
    pages = set()
    
    for doc in documents:
        if hasattr(doc, 'metadata') and 'page' in doc.metadata:
            page_num = doc.metadata['page']
            pages.add(f"Page {page_num + 1}")  # Convert 0-indexed to 1-indexed
        elif hasattr(doc, 'metadata') and 'source' in doc.metadata:
            # Extract page from source if available
            source = doc.metadata['source']
            pages.add(f"Source: {Path(source).name}")
    
    return sorted(list(pages)) if pages else ["Source not available"]

def validate_pdf(file_path: Path) -> Dict[str, any]:
    """
    Validate PDF file.
    
    Args:
        file_path: Path to PDF file
        
    Returns:
        Dictionary with validation result
    """
    if not file_path.exists():
        return {"valid": False, "error": "File does not exist"}
    
    if file_path.stat().st_size == 0:
        return {"valid": False, "error": "File is empty"}
    
    if file_path.stat().st_size > 50 * 1024 * 1024:  # 50MB limit
        return {"valid": False, "error": "File too large (max 50MB)"}
    
    return {"valid": True}

def sanitize_filename(filename: str) -> str:
    """
    Sanitize filename to prevent security issues.
    
    Args:
        filename: Original filename
        
    Returns:
        Sanitized filename
    """
    # Remove any directory path components
    filename = Path(filename).name
    
    # Replace special characters
    filename = re.sub(r'[^\w\s\-\.]', '_', filename)
    
    return filename

def format_context(documents: List) -> str:
    """
    Format retrieved documents into a context string.
    
    Args:
        documents: List of retrieved document chunks
        
    Returns:
        Formatted context string
    """
    context_parts = []
    
    for i, doc in enumerate(documents, 1):
        content = doc.page_content if hasattr(doc, 'page_content') else str(doc)
        page_info = ""
        
        if hasattr(doc, 'metadata') and 'page' in doc.metadata:
            page_info = f" [Page {doc.metadata['page'] + 1}]"
        
        context_parts.append(f"Chunk {i}{page_info}:\n{content}")
    
    return "\n\n".join(context_parts)
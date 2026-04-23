import React, { useState, useEffect } from 'react';
import ChatInterface from './components/ChatInterface';
import FileUpload from './components/FileUpload';
import { FileText, Trash2, AlertCircle } from 'lucide-react';
import axios from 'axios';

const API_BASE_URL = "https://ragchatbot-gpuf.onrender.com";

function App() {
  const [messages, setMessages] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load initial greeting message
  useEffect(() => {
    setMessages([
      {
        type: 'bot',
        content: 'Hello! I\'m your PDF assistant. Upload a PDF document to get started, and I\'ll help you find information within it.',
        timestamp: new Date(),
      },
    ]);
  }, []);

  /**
   * Handle file upload
   */
  const handleFileUpload = async (file) => {
    setError(null);
    setIsLoading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(`${API_BASE_URL}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        setUploadedFiles((prev) => [
          ...prev,
          {
            name: file.name,
            size: file.size,
            uploadedAt: new Date(),
          },
        ]);

        // Add success message
        setMessages((prev) => [
          ...prev,
          {
            type: 'system',
            content: `✅ Successfully uploaded "${file.name}". You can now ask questions about it!`,
            timestamp: new Date(),
          },
        ]);
      } else {
        throw new Error(response.data.error || 'Upload failed');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to upload file';
      setError(errorMessage);
      
      setMessages((prev) => [
        ...prev,
        {
          type: 'error',
          content: `❌ Upload failed: ${errorMessage}`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle sending a message/question
   */
  const handleSendMessage = async (messageText) => {
    if (!messageText.trim()) return;

    // Check if any files are uploaded
    if (uploadedFiles.length === 0) {
      setMessages((prev) => [
        ...prev,
        {
          type: 'user',
          content: messageText,
          timestamp: new Date(),
        },
        {
          type: 'error',
          content: '⚠️ Please upload a PDF document first before asking questions.',
          timestamp: new Date(),
        },
      ]);
      return;
    }

    // Add user message
    const userMessage = {
      type: 'user',
      content: messageText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.get(`${API_BASE_URL}/ask`, {
        params: { query: messageText },
      });

      const botMessage = {
        type: 'bot',
        content: response.data.answer,
        sources: response.data.sources || [],
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to get response';
      setError(errorMessage);

      setMessages((prev) => [
        ...prev,
        {
          type: 'error',
          content: `❌ Error: ${errorMessage}`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Clear chat history
   */
  const handleClearChat = async () => {
    try {
      await axios.post(`${API_BASE_URL}/clear`);
      
      setMessages([
        {
          type: 'system',
          content: '🔄 Chat history cleared. You can start a new conversation!',
          timestamp: new Date(),
        },
      ]);
    } catch (err) {
      console.error('Error clearing chat:', err);
      setMessages([
        {
          type: 'system',
          content: '🔄 Chat cleared locally.',
          timestamp: new Date(),
        },
      ]);
    }
  };

  /**
   * Format file size
   */
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-2 rounded-lg">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  RAG Chatbot
                </h1>
                <p className="text-sm text-gray-600">
                  Ask questions about your PDFs
                </p>
              </div>
            </div>

            {messages.length > 1 && (
              <button
                onClick={handleClearChat}
                className="flex items-center space-x-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg smooth-transition"
              >
                <Trash2 className="w-4 h-4" />
                <span className="font-medium">Clear Chat</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Upload Documents
              </h2>

              <FileUpload
                onFileUpload={handleFileUpload}
                isLoading={isLoading}
              />

              {/* Uploaded Files List */}
              {uploadedFiles.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">
                    Uploaded Files ({uploadedFiles.length})
                  </h3>
                  <div className="space-y-2">
                    {uploadedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-start space-x-2 p-3 bg-green-50 border border-green-200 rounded-lg"
                      >
                        <FileText className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {file.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatFileSize(file.size)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Info Box */}
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-blue-900 mb-1">
                      Tips
                    </h4>
                    <ul className="text-xs text-blue-700 space-y-1">
                      <li>• Upload PDF files (max 50MB)</li>
                      <li>• Ask specific questions</li>
                      <li>• Request summaries</li>
                      <li>• Follow-up questions work!</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Chat Interface */}
          <div className="lg:col-span-3">
            <ChatInterface
              messages={messages}
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
            />
          </div>
        </div>
      </main>

      {/* Global Error Toast */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2 animate-pulse">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

export default App;
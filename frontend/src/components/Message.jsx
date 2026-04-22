import React from 'react';
import { Bot, User, AlertTriangle, Info, FileText } from 'lucide-react';

const Message = ({ message }) => {
  const { type, content, sources, timestamp } = message;

  // Format timestamp
  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // User message
  if (type === 'user') {
    return (
      <div className="flex justify-end message-animate">
        <div className="flex items-start space-x-2 max-w-[80%]">
          <div className="flex-1">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 shadow-md">
              <p className="text-sm whitespace-pre-wrap break-words">{content}</p>
            </div>
            <p className="text-xs text-gray-400 mt-1 text-right">
              {formatTime(timestamp)}
            </p>
          </div>
          <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-md">
            <User className="w-5 h-5 text-white" />
          </div>
        </div>
      </div>
    );
  }

  // Bot message
  if (type === 'bot') {
    return (
      <div className="flex justify-start message-animate">
        <div className="flex items-start space-x-2 max-w-[80%]">
          <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center shadow-md">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
              <p className="text-sm text-gray-800 whitespace-pre-wrap break-words leading-relaxed">
                {content}
              </p>
              
              {/* Sources */}
              {sources && sources.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <FileText className="w-4 h-4 text-gray-500" />
                    <span className="text-xs font-medium text-gray-600">
                      Sources:
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {sources.map((source, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full border border-blue-200"
                      >
                        {source}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {formatTime(timestamp)}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Error message
  if (type === 'error') {
    return (
      <div className="flex justify-center message-animate">
        <div className="max-w-md bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-start space-x-2">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-red-800">{content}</p>
            <p className="text-xs text-red-600 mt-1">
              {formatTime(timestamp)}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // System message
  if (type === 'system') {
    return (
      <div className="flex justify-center message-animate">
        <div className="max-w-md bg-gray-100 border border-gray-300 rounded-lg px-4 py-3 flex items-start space-x-2">
          <Info className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-gray-700">{content}</p>
            <p className="text-xs text-gray-500 mt-1">
              {formatTime(timestamp)}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default Message;
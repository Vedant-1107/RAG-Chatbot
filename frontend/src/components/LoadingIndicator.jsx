import React from 'react';
import { Bot } from 'lucide-react';

const LoadingIndicator = () => {
  return (
    <div className="flex justify-start message-animate">
      <div className="flex items-start space-x-2 max-w-[80%]">
        {/* Bot Avatar */}
        <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center shadow-md">
          <Bot className="w-5 h-5 text-white" />
        </div>

        {/* Loading Content */}
        <div className="flex-1">
          <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
            {/* Typing Animation */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Thinking</span>
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot"></div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-3 w-full bg-gray-200 rounded-full h-1 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-pulse-slow" style={{ width: '60%' }}></div>
            </div>

            {/* Status Text */}
            <p className="text-xs text-gray-500 mt-2">
              Searching through documents...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingIndicator;
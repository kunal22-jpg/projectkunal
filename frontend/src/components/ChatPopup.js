import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

const ChatPopup = ({ onClose }) => {
  const iframeRef = useRef(null);

  useEffect(() => {
    // Initialize the Botpress webchat when component mounts
    const iframe = iframeRef.current;
    if (iframe) {
      iframe.onload = () => {
        // Optional: You can add any additional initialization here
        console.log('Botpress chat loaded successfully');
      };
    }
  }, []);

  return (
    <motion.div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-slate-900/95 backdrop-blur-md border border-purple-500/30 rounded-2xl w-full max-w-2xl h-[600px] flex flex-col overflow-hidden"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 border-b border-purple-500/30 p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-lg">🤖</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">TRACITY AI Assistant</h3>
              <p className="text-sm text-slate-400">Ready to help with your data</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-800/50 rounded-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Botpress Chat Widget */}
        <div className="flex-1 overflow-hidden">
          <iframe
            ref={iframeRef}
            src="https://cdn.botpress.cloud/webchat/v3.0/shareable.html?configUrl=https://files.bpcontent.cloud/2025/06/13/11/20250613110123-M8F9HM2R.json"
            width="100%"
            height="100%"
            style={{ 
              border: 'none',
              borderRadius: '0 0 1rem 1rem',
              backgroundColor: 'transparent'
            }}
            title="TRACITY AI Assistant"
            allow="microphone; camera"
          />
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ChatPopup;
import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ChatPopup = ({ onClose }) => {
  const iframeRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showIframe, setShowIframe] = useState(false);

  useEffect(() => {
    // Show TRACITY loading for 2 seconds, then load the chatbot
    const loadingTimer = setTimeout(() => {
      setShowIframe(true);
    }, 1500);

    return () => clearTimeout(loadingTimer);
  }, []);

  useEffect(() => {
    if (showIframe) {
      const iframe = iframeRef.current;
      if (iframe) {
        iframe.onload = () => {
          // Wait a bit more to ensure content is fully loaded
          setTimeout(() => {
            setIsLoading(false);
          }, 1000);
        };
      }
    }
  }, [showIframe]);

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

        {/* Chat Content Area */}
        <div className="flex-1 overflow-hidden relative">
          {/* TRACITY Loading Animation */}
          <AnimatePresence>
            {isLoading && (
              <motion.div
                className="absolute inset-0 bg-slate-900/95 flex flex-col items-center justify-center z-10"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
              >
                {/* TRACITY Cosmic Loading */}
                <div className="relative mb-6">
                  <motion.div
                    className="w-20 h-20 rounded-full border-4 border-purple-500/30"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    <motion.div
                      className="absolute inset-2 rounded-full bg-gradient-conic from-purple-600 via-blue-600 via-pink-600 to-purple-600"
                      animate={{ rotate: -360 }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    />
                    <div className="absolute inset-4 rounded-full bg-slate-900/90 backdrop-blur-sm flex items-center justify-center">
                      <span className="text-2xl">⚡</span>
                    </div>
                  </motion.div>
                  
                  {/* Orbiting particles */}
                  {[...Array(6)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-2 h-2 bg-gradient-to-br from-purple-400 to-blue-400 rounded-full"
                      style={{
                        top: '50%',
                        left: '50%',
                        originX: 0.5,
                        originY: 0.5,
                      }}
                      animate={{
                        rotate: 360,
                        x: Math.cos(i * 60 * Math.PI / 180) * 50,
                        y: Math.sin(i * 60 * Math.PI / 180) * 50,
                      }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "linear",
                        delay: i * 0.2,
                      }}
                    />
                  ))}
                </div>

                {/* Loading Text */}
                <motion.div
                  className="text-center"
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <h3 className="text-xl font-bold gradient-text mb-2">
                    TRACITY AI
                  </h3>
                  <p className="text-slate-400 text-sm">Initializing your AI companion...</p>
                </motion.div>

                {/* Animated dots */}
                <motion.div className="flex space-x-1 mt-4">
                  {[...Array(3)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 bg-purple-500 rounded-full"
                      animate={{ 
                        scale: [1, 1.5, 1],
                        opacity: [1, 0.5, 1]
                      }}
                      transition={{
                        duration: 0.8,
                        repeat: Infinity,
                        delay: i * 0.2,
                      }}
                    />
                  ))}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Botpress Chat Widget */}
          {showIframe && (
            <div className="relative w-full h-full overflow-hidden">
              <iframe
                ref={iframeRef}
                src={`https://cdn.botpress.cloud/webchat/v3.0/shareable.html?configUrl=https://files.bpcontent.cloud/2025/06/13/11/20250613110123-M8F9HM2R.json`}
                width="100%"
                height="100%"
                style={{ 
                  border: 'none',
                  borderRadius: '0 0 1rem 1rem',
                  backgroundColor: 'transparent',
                  opacity: isLoading ? 0 : 1,
                  transition: 'opacity 0.5s ease-in-out'
                }}
                title="TRACITY AI Assistant"
                allow="microphone; camera"
              />
              
              {/* Overlay to hide any potential branding at the bottom */}
              <div 
                className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-slate-900 to-transparent pointer-events-none z-10"
                style={{ borderRadius: '0 0 1rem 1rem' }}
              />
              
              {/* Side overlays to ensure no branding leaks through */}
              <div className="absolute bottom-0 left-0 w-full h-8 bg-slate-900 pointer-events-none z-10" style={{ borderRadius: '0 0 1rem 1rem' }} />
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ChatPopup;
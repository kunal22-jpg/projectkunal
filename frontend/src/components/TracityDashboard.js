import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import ChatPopup from './ChatPopup';
import ConveyorBeltScene from './ConveyorBeltScene';

const TracityDashboard = ({ stats }) => {
  const [showChat, setShowChat] = useState(false);

  const handleChatOpen = () => {
    setShowChat(true);
  };

  const handleCloseChat = () => {
    setShowChat(false);
  };

  return (
    <div className="min-h-screen">
      {/* 3D Conveyor Belt Scene */}
      <ConveyorBeltScene onChatOpen={handleChatOpen} />

      {/* Chat Popup */}
      <AnimatePresence>
        {showChat && (
          <ChatPopup onClose={handleCloseChat} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default TracityDashboard;
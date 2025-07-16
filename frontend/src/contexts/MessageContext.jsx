import React, { createContext, useState, useContext } from 'react';
import { FullScreenMessage } from '../components/FullScreenMEssage';

const MessageContext = createContext();

export const MessageProvider = ({ children }) => {
  const [message, setMessage] = useState(null);
  const [showMessage, setShowMessage] = useState(false);
  const [color, setColor] = useState(null);

  const showFullScreenMessage = (msg, color = "white", duration = 2000) => {
    setMessage(msg);
    setShowMessage(true);
    setColor(color);
    
    setTimeout(() => {
      setShowMessage(false);
    }, duration);
  };

  return (
    <MessageContext.Provider value={{ showFullScreenMessage }}>
      {children}
      {showMessage && (
        <FullScreenMessage 
          message={message} 
          duration={2000} 
          color={color}
          onClose={() => setShowMessage(false)} 
        />
      )}
    </MessageContext.Provider>
  );
};

export const useMessage = () => {
  return useContext(MessageContext);
};
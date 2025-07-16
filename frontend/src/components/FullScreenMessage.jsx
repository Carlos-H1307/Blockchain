// components/FullScreenMessage.jsx
import React from 'react';
import styled, { keyframes } from 'styled-components';

const slideIn = keyframes`
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
`;

const fadeOut = keyframes`
  from { opacity: 1; }
  to { opacity: 0; }
`;

const MessageContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  animation: ${props => props.exiting ? fadeOut : slideIn} 0.5s ease-out;
  color: ${props => props.color};
  font-size: 4rem;
  font-weight: bold;
  text-transform: uppercase;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
`;

export const FullScreenMessage = ({ message, color, duration = 2000, onClose }) => {
  const [exiting, setExiting] = React.useState(false);

  React.useEffect(() => {
    const exitTimer = setTimeout(() => setExiting(true), 1500);
    const closeTimer = setTimeout(onClose, duration);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(closeTimer);
    };
  }, [duration, onClose]);

  return <MessageContainer exiting={exiting} color={color}>{message}</MessageContainer>;
};
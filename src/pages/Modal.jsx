import React from 'react';
import Modal from 'react-modal';
import { animated, useSpring } from 'react-spring';

Modal.setAppElement('#root');

const AnimatedModal = ({ isOpen, onRequestClose, children }) => {
  const animation = useSpring({
    opacity: isOpen ? 1 : 0,
    transform: isOpen ? 'translateY(0)' : 'translateY(-200px)',
    config: {
      tension: 280,
      friction: 60,
    },
  });

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      style={{
        overlay: {
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
        },
        content: {
          position: 'relative',
          border: 'none',
          background: 'none',
          overflow: 'auto',
          WebkitOverflowScrolling: 'touch',
          borderRadius: '4px',
          outline: 'none',
          padding: '20px',
          maxWidth: '75vw', // Set the maximum width to 75% of the viewport width
        }
      }}
    >
      <animated.div style={animation}>
        <div
          style={{
            background: '#fff',
            borderRadius: '10px',
            padding: '20px',
            position: 'relative',
            width: '100%',
            maxHeight: '80vh', // Set the maximum height to 80% of the viewport height
            overflow: 'auto',
          }}
        >
          {children}
        </div>
      </animated.div>
    </Modal>
  );
};

export default AnimatedModal;
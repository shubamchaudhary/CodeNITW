import React from 'react';
import Modal from 'react-modal';
import { animated, useSpring } from 'react-spring';
 // import the CSS file

Modal.setAppElement('#root');

const AnimatedModal = ({ isOpen, onRequestClose, children }) => {
  const animation = useSpring({
    opacity: isOpen ? 1 : 0,
    transform: isOpen ? 'translateY(0)' : 'translateY(-200px)',
    config: {
      tension: 2660,
      friction: 60,
    },
  });

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      className="modal-content md:max-w-[90%] max-w-[100%]" // apply the class to the modal content
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
          //maxWidth: '100vw', // Set the maximum width to 75% of the viewport width
        }
      }}
    >
      <animated.div style={animation}>
        <div className='bg-blue-100 dark:bg-[#050b15] border-2 border-[#141a25] relative max-h-[700px] mt-[80px] overflow-auto p-20px'
          style={{
            borderRadius: '10px',
            padding: '10px',
            position: 'relative',
            width: '103%',
            // Set the maximum height to 80% of the viewport height
          }}
        >
          {children}
        </div>
      </animated.div>
    </Modal>
  );
};

export default AnimatedModal;
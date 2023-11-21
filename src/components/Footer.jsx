import React, { useState } from 'react';

const Footer = () => {
    const [showModal, setShowModal] = useState(false);

    const openModal = () => {
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
    };

    return (
        <footer style={{ textAlign: 'center' }}>
            <p onClick={openModal} style={{ cursor: 'pointer' }}>
                Contributors
            </p>
            {showModal && (
                <div>
                    <button onClick={closeModal}>Close</button>
                    <a href="https://www.example1.com" target="_blank" rel="noopener noreferrer">Link 1</a>
                    <a href="https://www.example2.com" target="_blank" rel="noopener noreferrer">Link 2</a>
                </div>
            )}
        </footer>
    );
};

export default Footer;
// Footer.jsx
import React from 'react';

const Footer = () => {
    const openLinks = (link1, link2) => {
        window.open(link1, '_blank');
        setTimeout(() => window.open(link2, '_blank'), 500);
    }

    return (
        <footer className="bg-blue-200 shadow-lg border-gray-200 px-4 lg:px-6 py-4 font-serif">
            <div className="flex flex-wrap justify-center items-center mx-auto max-w-screen-xl">
                <p>Made by 
                <a href="http://www.google.com" target="_blank"> Shubam Chaudhary</a>
                <span> & </span>
                <a href="http://www.CRICBUZZ.com" target="_blank" >Rohit Kumar</a>
                </p>
            </div>
        </footer>
    );
}

export default Footer;
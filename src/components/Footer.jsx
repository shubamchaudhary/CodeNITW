// Footer.jsx
import React from 'react';

const Footer = () => {
    return (
        <footer className="bg-blue-100 dark:bg-[#1C1C1EFF] p-3 text-center text-sm">
            <div className="max-w-screen-xl mx-auto flex justify-center items-center">
                <p className="text-gray-500 font-bold flex justify-center items-center">
                    Made by 
                    <a href="https://shubamchaudhary.vercel.app/" target="_blank" rel="noreferrer" className="text-red-800 dark:text-red-900 font-bold mx-2"> Shubam Chaudhary</a>
                    <span className="mx-2">&</span>
                    <a href="http://www.oracle.com" target="_blank" rel="noreferrer" className="text-red-800 dark:text-red-900 font-bold mx-2">Rohit Kumar</a>
                </p>
            </div>
        </footer>
    );
}

export default Footer;
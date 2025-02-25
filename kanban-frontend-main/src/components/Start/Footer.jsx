import React from 'react';
import { FaGithub, FaFacebook, FaTwitter } from 'react-icons/fa';

function Footer() {
  return (
    <footer className="footer">
      <p>&copy; Manageo 2024</p>
      <div className="social-icons">
        <a href="https://github.com" target="_blank" rel="noopener noreferrer">
          <FaGithub />
        </a>
        <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">
          <FaFacebook />
        </a>
        <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
          <FaTwitter />
        </a>
      </div>
    </footer>
  );
}

export default Footer;

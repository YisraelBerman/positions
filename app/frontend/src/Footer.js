import React from 'react';

const footerStyle = {
  backgroundColor: '#f8f9fa',
  padding: '10px',
  textAlign: 'center',
  position: 'fixed',
  left: 0,
  bottom: 0,
  width: '100%',
  borderTop: '1px solid #e7e7e7'
};

const Footer = ({ name, version }) => {
  return (
    <footer style={footerStyle}>
      <p>Created by {name} | App Version: {version}</p>
    </footer>
  );
};

export default Footer;
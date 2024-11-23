import React from 'react';
import { Link } from 'react-router-dom';

function Header() {
  const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '10px 20px',
    borderBottom: '2px solid #ddd',
    marginBottom: '20px',
    backgroundColor: '#A9A9A9',
  };

  const buttonStyle = {
    padding: '10px 20px',
    margin: '0 5px',
    border: '1px solid #ddd',
    backgroundColor: 'white',
    cursor: 'pointer',
  };

  return (
    <header style={headerStyle}>
      <Link to="/">
        <button style={buttonStyle}>Main Page</button>
      </Link>
      <Link to="/map">
        <button style={buttonStyle}>Map</button>
      </Link>
      <button style={buttonStyle}>Send Messages</button> {/* Placeholder button */}
    </header>
  );
}

export default Header;

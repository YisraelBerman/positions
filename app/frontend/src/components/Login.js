import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext'; // Make sure this path is correct

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { user, login, logout } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(username, password);
      setUsername('');
      setPassword('');
    } catch (error) {
      console.error('Login failed:', error);
      // Handle error (e.g., show error message to user)
    }
  };

  const handleLogout = () => {
    logout();
  };

  const loginStyle = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '10px',
    borderBottom: '1px solid #ddd',
  };

  if (user) {
    return (
      <div style={loginStyle}>
        <span>Logged in as {user.username}</span>
        <button onClick={handleLogout} style={{ marginLeft: '10px' }}>Logout</button>
      </div>
    );
  }

  return (
    <div style={loginStyle}>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
        />
        <button type="submit">Login</button>
      </form>
    </div>
  );
};

export default Login;
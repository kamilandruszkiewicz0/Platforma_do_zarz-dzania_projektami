import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import './Register.css';

function RegisterPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const emailFromLogin = params.get('email');
    if (emailFromLogin) {
      setEmail(emailFromLogin);
    }
  }, [location.search]);

  const handleRegister = async (e) => {
    e.preventDefault();
  
    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }
  
    const response = await fetch("https://yhuxfr4hde.execute-api.eu-central-1.amazonaws.com/dev/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password })
    });    
  
    if (!response.ok) {
      const error = await response.text();
      alert(error);
    } else {
      alert("Registration successful! You can now log in.");
    }
  };
  

  return (
    <div className="register-container">
      <div className="register-box">
        <h2 className="register-title">Zarejestruj</h2>
        <form onSubmit={handleRegister}>
          <div className="input-group">
            <label>Nazwa użytkownika</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <label>Hasło</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <label>Potwierdź hasło</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="register-button">Zarejestruj</button>
        </form>
      </div>
    </div>
  );
}

export default RegisterPage;

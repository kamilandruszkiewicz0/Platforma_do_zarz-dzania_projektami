import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Style.css'; 

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    const response = await fetch("https://yhuxfr4hde.execute-api.eu-central-1.amazonaws.com/dev/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }) 
    });
    
    if (response.ok) {
      const data = await response.json();
      localStorage.setItem("token", data.token); 
      alert("Login successful!");

      navigate("/projects"); 
    } else {
      const errorData = await response.json();
      alert(errorData.message || "Invalid credentials");
    }
  };

  const handleSignupRedirect = () => {
    navigate(`/register?email=${encodeURIComponent(email)}`);
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2 className="login-title">Zaloguj</h2>
        <form onSubmit={handleLogin}>
          <div className="input-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <label htmlFor="password">Hasło</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="login-button">Zaloguj</button>
        </form>
        <p className="signup-link">
          Nie posiadasz konta? <a href="#" onClick={handleSignupRedirect}>Zarejestruj się</a>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;

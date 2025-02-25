import React from 'react';
import { useNavigate } from 'react-router-dom';

function Header() {
  
  const navigate = useNavigate();

  return (
    <header className="header">
      <h1>Manageo </h1>
      <div>
        <button onClick={() => navigate('/login')}>Zaloguj</button>
        <button onClick={() => navigate('/register')}>Zarejestruj</button>
      </div>
    </header>
  );
}

export default Header;

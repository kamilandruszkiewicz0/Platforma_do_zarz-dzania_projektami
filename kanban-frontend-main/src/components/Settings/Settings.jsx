import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Settings.css';

function SettingsPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const navigate = useNavigate();

  const handleUsernameChange = async () => {
    try {
      const response = await fetch('https://yhuxfr4hde.execute-api.eu-central-1.amazonaws.com/dev/users/change-username', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(username),
      });
      if (!response.ok) {
        alert('Error while changing the username.');
      } else {
        alert('Username changed successfully!');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handlePasswordChange = async () => {
    if (password !== confirmPassword) {
        alert('Passwords do not match.');
        return;
    }

    try {
        const response = await fetch('https://yhuxfr4hde.execute-api.eu-central-1.amazonaws.com/dev/users/change-password', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(password),
        });
        if (response.ok) {
            alert('Password changed successfully!');
        } else {
            alert('Error while changing the password.');
        }
    } catch (error) {
        console.error(error);
    }
};


  return (
    <div className="settings-container">
      <h1>Ustawienia</h1>
      <div className="settings-form">
        <div>
          <label>Nowa nazwa użytkownika:</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <button onClick={handleUsernameChange}>Zmień nazwe użytkownika</button>
        </div>
        <div>
          <label>Nowe hasło:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <label>Potwierdź hasło:</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <button onClick={handlePasswordChange}>Zmień hasło</button>
        </div>
        <button className="back-button" onClick={() => navigate('/projects')}>
          Cofnij
        </button>
      </div>
    </div>
  );
}

export default SettingsPage;

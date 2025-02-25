import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import HomePage from './components/Start/HomePage';
import LoginPage from './components/Login/Login';
import RegisterPage from './components/Register/Register.jsx';
import ProjectsPage from './components/Projects/ProjectPage';
import ProjectDetailPage from './components/Project/ProjectDetailPage';
import SettingsPage from './components/Settings/settings';
import { UserProvider } from './UserContext';

function App() {
  const [projects, setProjects] = useState([]);

  return (
    <UserProvider>
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} /> {/* Nowa trasa */}
        <Route
          path="/projects"
          element={<ProjectsPage projects={projects} setProjects={setProjects} />}
        />
        <Route
          path="/project/:projectId"
          element={<ProjectDetailPage projects={projects} setProjects={setProjects} />}
        />
        <Route 
          path="/settings" 
          element={<SettingsPage />} 
        />

      </Routes>
    </Router>
    </UserProvider>
  );
}

export default App;

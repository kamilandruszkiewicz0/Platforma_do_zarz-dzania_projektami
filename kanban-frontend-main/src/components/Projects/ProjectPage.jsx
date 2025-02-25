import React, { useState, useEffect } from 'react';
import './ProjectPage.css';
import { useNavigate } from 'react-router-dom';

function ProjectsPage({ projects, setProjects }) {
  const [showModal, setShowModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [newProjectTeamMembers, setNewProjectTeamMembers] = useState([]);
  const [filterStatus, setFilterStatus] = useState('All');
  const [users, setUsers] = useState([]);
  const navigate = useNavigate();
  const [editingProject, setEditingProject] = useState(null);
  const [editStatus, setEditStatus] = useState('');
  const [editDeadline, setEditDeadline] = useState('');
  const [editTeamMembers, setEditTeamMembers] = useState([]);
  const [editProjectName, setEditProjectName] = useState('');
  const [editProjectDescription, setEditProjectDescription] = useState('');

  const token = localStorage.getItem('token');
  let currentUser = null;

  if (token) {
    try {
      const decodeToken = (token) => {
        try {
            const tokenParts = token.split('.');
            if (tokenParts.length !== 3) {
                throw new Error("❌ Token JWT ma niepoprawny format!");
            }
    
            const decodedPayload = JSON.parse(
                decodeURIComponent(
                    atob(tokenParts[1])
                        .split("")
                        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
                        .join("")
                )
            );
            return decodedPayload;
        } catch (error) {
            console.error("❌ Błąd dekodowania tokena:", error.message);
            localStorage.removeItem("token");
            return null;
        }
    };
    
    const token = localStorage.getItem("token");
    let currentUser = token ? decodeToken(token)?.unique_name : null;

        console.log("✅ Zalogowany użytkownik:", currentUser);
    } catch (error) {
        console.error("❌ Błąd dekodowania tokena:", error.message);
        localStorage.removeItem("token");
    }
}

  const fetchProjects = async () => {
    try {
      const response = await fetch("https://yhuxfr4hde.execute-api.eu-central-1.amazonaws.com/dev/projects", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
  
      if (!response.ok) {
        throw new Error(`Error fetching projects, status code: ${response.status}`);
      }
  
      const data = await response.json();
      const fetchedProjects = data.$values || [];

      const updatedProjects = fetchedProjects.map((project) => {
        const savedProgress = localStorage.getItem(`progress_${project.id}`);
        return {
          ...project,
          progress: savedProgress !== null ? JSON.parse(savedProgress) : project.progress || 0,
          deadline: project.deadline ? project.deadline.split("T")[0] : null
        };
      });          
  
      console.log("📤 Pobieranie projektów - zachowujemy progress:", updatedProjects);
      setProjects(updatedProjects);
    } catch (error) {
      console.error("Error fetching projects:", error.message);
    }
  };  

  

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const response = await fetch("https://yhuxfr4hde.execute-api.eu-central-1.amazonaws.com/dev/projects/my-projects", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
  
        if (!response.ok) {
          throw new Error(`Błąd pobierania projektów, status: ${response.status}`);
        }
  
        const data = await response.json();
        const fetchedProjects = data.$values || [];
  
        setProjects(fetchedProjects);
  
        fetchedProjects.forEach((project) => {
          fetchProjectProgress(project.id);
        });
  
      } catch (error) {
        console.error("Błąd pobierania projektów:", error);
      }
    };
  
    loadProjects();
  }, []);
  
  useEffect(() => {
    const savedProjects = localStorage.getItem("projects");
  
    if (savedProjects) {
      const parsedProjects = JSON.parse(savedProjects);
  
      const updatedProjects = parsedProjects.map((project) => {
        const savedProgress = localStorage.getItem(`progress_${project.id}`);
        return {
          ...project,
          progress: savedProgress !== null ? JSON.parse(savedProgress) : project.progress || 0,
        };
      });
  
      console.log("📤 Załadowane projekty z poprawnym progress:", updatedProjects);
      setProjects(updatedProjects);
    } else {
      console.log("📤 Pobieranie projektów z API");
      fetchProjects();
    }
  }, []);
   
  useEffect(() => {
    if (projects.length > 0) {
      console.log("📥 Zapisujemy projekty do localStorage (bez progress)");
  
      const projectsWithoutProgress = projects.map(({ progress, ...project }) => project);
  
      localStorage.setItem("projects", JSON.stringify(projectsWithoutProgress));
    }
  }, [projects]);  

const updateProjectProgress = (projectId, newProgress) => {
  const currentProgress = localStorage.getItem(`progress_${projectId}`);
  if (currentProgress !== null && JSON.parse(currentProgress) === newProgress) {
      return;
  }

  console.log(`🔄 Aktualizacja progress: ${newProgress} dla projektu ${projectId}`);
  localStorage.setItem(`progress_${projectId}`, JSON.stringify(newProgress));

  setProjects((prevProjects) =>
      prevProjects.map((project) =>
          project.id === projectId ? { ...project, progress: newProgress } : project
      )
  );
};

  useEffect(() => {
    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem('token');

            if (!token) {
                console.warn("❌ Brak tokena, nie można pobrać użytkowników.");
                return;
            }

            const response = await fetch('https://yhuxfr4hde.execute-api.eu-central-1.amazonaws.com/dev/api/users', {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });

            if (!response.ok) {
                throw new Error(`Błąd pobierania użytkowników: ${response.status}`);
            }

            const data = await response.json();

            const users = data.$values || [];
            console.log('API Response (users):', users);

            const filteredUsers = users.filter((user) => user.username !== currentUser);
            console.log('Filtered Users:', filteredUsers);

            setUsers(filteredUsers);
        } catch (error) {
            console.error('❌ Error fetching users:', error);
        }
    };

    fetchUsers();
}, [currentUser]); 

  const handleCreateNewProject = async () => {
    if (newProjectName.trim() === '') return;

    const newProject = {
      name: newProjectName,
      description: newProjectDescription,
      teamMembers: newProjectTeamMembers,
      status: 'In Progress',
      progress: 0,
      deadline: null,
    };

    try {
      const response = await fetch('https://yhuxfr4hde.execute-api.eu-central-1.amazonaws.com/dev/api/projects', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newProject),
      });

      if (response.ok) {
        const savedProject = await response.json();
        const updatedProjects = [...projects, savedProject];
        setProjects(updatedProjects);
        localStorage.setItem('projects', JSON.stringify(updatedProjects));
      } else {
        console.error('Error creating project, status code:', response.status);
      }
    } catch (error) {
      console.error('Error creating project:', error);
    }

    setNewProjectName('');
    setNewProjectDescription('');
    setNewProjectTeamMembers([]);
    setShowModal(false);
  };
  
  const handleDeleteProject = async (projectId) => {
    try {
        const response = await fetch(`https://yhuxfr4hde.execute-api.eu-central-1.amazonaws.com/dev/projects/${projectId}`, {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Error deleting project, status code: ${response.status}`);
        }

        console.log(`Project ${projectId} deleted successfully`);

        await fetchProjects();
    } catch (error) {
        console.error('Error deleting project:', error.message);
    }
};

  const filteredProjects = Array.isArray(projects)
    ? projects.filter((project) => filterStatus === 'All' || project.status === filterStatus)
    : [];

  const handleProjectClick = (projectId) => {
    navigate(`/project/${projectId}`);
  };

  const handleEditProject = (project) => {
    setEditingProject(project);
    setEditProjectName(project.name); 
    setEditProjectDescription(project.description || "");
    setEditStatus(project.status);
    setEditDeadline(project.deadline ? project.deadline.split('T')[0] : '');
    setEditTeamMembers(project.teamMembers?.$values || project.teamMembers || []);
};

  const addTeamMember = (member) => {
    if (!editTeamMembers.includes(member)) {
      setEditTeamMembers([...editTeamMembers, member]);
    }
  };

  const removeTeamMember = (member) => {
    setEditTeamMembers(editTeamMembers.filter((m) => m !== member));
  };

  const saveProjectChanges = async () => {
    if (!editingProject) return;

    const updatedProject = {
        id: editingProject.id,
        name: editProjectName,
        description: editProjectDescription || editingProject.description,
        status: editStatus,
        deadline: editDeadline ? new Date(editDeadline).toISOString().replace("Z", "") : null,
        teamMembers: editTeamMembers,
    };

    console.log("📤 Wysyłane dane do API:", JSON.stringify(updatedProject, null, 2));

    try {
        const response = await fetch(`https://yhuxfr4hde.execute-api.eu-central-1.amazonaws.com/dev/projects/${editingProject.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(updatedProject),
        });

        if (response.status === 204) {
            console.log("✅ Zmiana nazwy zakończona sukcesem (brak treści w odpowiedzi)");

            setProjects((prevProjects) =>
                prevProjects.map((p) =>
                    p.id === editingProject.id ? { ...p, name: editProjectName } : p
                )
            );

            setEditingProject(null);
            return;
        }

        const data = await response.json();
        console.log(`✅ Zaktualizowano projekt: ${data.project.name}`);

        setProjects((prevProjects) =>
            prevProjects.map((p) =>
                p.id === editingProject.id ? { ...p, name: data.project.name } : p
            )
        );
        setEditingProject(null);
    } catch (error) {
        console.error("❌ Błąd zapisu zmian projektu:", error);
    }
};

  const renameProject = async () => {
    if (!editingProject || editProjectName.trim() === '') return;

    try {
        const response = await fetch(`https://yhuxfr4hde.execute-api.eu-central-1.amazonaws.com/dev/projects/${editingProject.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                name: editProjectName,
                description: editProjectDescription || editingProject.description,
                status: editingProject.status,
                deadline: editingProject.deadline,
                teamMembers: editingProject.teamMembers,
            }),
        });

        if (response.status === 204) {
            console.log("✅ Zmiana nazwy zakończona sukcesem (brak treści w odpowiedzi)");

            setProjects((prevProjects) =>
                prevProjects.map((p) =>
                    p.id === editingProject.id ? { ...p, name: editProjectName } : p
                )
            );

            setEditingProject(null);
            return;
        }

        const data = await response.json();
        console.log(`✅ Projekt został zaktualizowany: ${data.project.name}`);

        setProjects((prevProjects) =>
            prevProjects.map((p) =>
                p.id === editingProject.id ? { ...p, name: data.project.name } : p
            )
        );
        setEditingProject(null);
    } catch (error) {
        console.error("❌ Błąd zmiany nazwy projektu:", error);
    }
  };

  const fetchProjectProgress = async (projectId) => {
    try {
      const response = await fetch(`https://yhuxfr4hde.execute-api.eu-central-1.amazonaws.com/dev/projects/${projectId}/progress`);
      
      if (!response.ok) {
        throw new Error(`Błąd pobierania progresu, status: ${response.status}`);
      }
  
      const data = await response.json();
      
      console.log(`📥 Otrzymano progress ${data.progress}% dla projektu ${projectId}`);
  
      setProjects((prevProjects) =>
        prevProjects.map((project) =>
          project.id === projectId ? { ...project, progress: data.progress } : project
        )
      );
  
      localStorage.setItem(`progress_${projectId}`, JSON.stringify(data.progress));
  
    } catch (error) {
      console.error("Błąd pobierania progresu projektu:", error);
    }
  };
  
useEffect(() => {
  projects.forEach((project) => {
      fetchProjectProgress(project.id);
  });
}, []);

console.log("🔍 Dane projektu:", filteredProjects);
  filteredProjects.forEach(proj => console.log("🔍 Team Members:", proj.name, proj.teamMembers));

return (
  <div className="projects-page">
    <header className="header">
      <h1>Twoje Projekty</h1>
    </header>
    <div className="projects-container">
    <aside className="sidebar">
      <ul>
        <li onClick={() => navigate('/dashboard')}>Dashboard</li>
        <li onClick={() => navigate('/settings')}>Ustawienia</li>
        <li onClick={() => {
          localStorage.removeItem('token');
          navigate('/login');
        }}>Wyloguj</li>

        <li>
          <label>Filtruj projekty:</label>
          <select onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="All">Wszystkie</option>
            <option value="In Progress">W trakcie</option>
            <option value="Completed">Wykonane</option>
          </select>
        </li>
      </ul>
    </aside>
      <main className="main-content">
        <div className="new-project-tile">
          <button onClick={() => setShowModal(true)}>Stwórz nowy projekt</button>
        </div>
        <div className="projects-list">
        {filteredProjects && filteredProjects.length > 0 ? (
          filteredProjects.map((project) => (
            <div
              className="project-tile"
              key={project.id}
              onClick={() => handleProjectClick(project.id)}
            >
              <h3>{project.name}</h3>
              <p>{project.description}</p>
              <p>Status: {project.status}</p>
              <p>Progress: {project.progress || 0}%</p>
              <p>Deadline: {project.deadline ? new Date(project.deadline).toLocaleDateString("pl-PL") : "None"}</p>
              <p>
                Użytkownicy: 
                {project.teamMembers && project.teamMembers.$values && project.teamMembers.$values.length > 0
                  ? project.teamMembers.$values.join(", ")
                  : "Brak członków zespołu"}
              </p>
              <button className="edit-button" onClick={(e) => {
                  e.stopPropagation();
                  handleEditProject(project);
                }}
              >
                Edytuj
              </button>
              <button
                className="delete-project"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteProject(project.id);
                }}
              >
                X
              </button>
            </div>
          ))
        ) : (
          <p>Brak projektów do wyświetlenia</p>
        )}
        </div>
      </main>
    </div>
    
    {editingProject && (
      <div className="modal-overlay">
        <div className="modal">
          <h2>Edytuj projekt</h2>
          <label>Nazwa:</label>
            <input type="text" value={editProjectName} onChange={(e) => setEditProjectName(e.target.value)} />

            <label>Status:</label>
            <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)}>
                <option value="In Progress">W trakcie</option>
                <option value="Completed">Wykonane</option>
            </select>

            <label>Deadline:</label>
            <input type="date" value={editDeadline} onChange={(e) => setEditDeadline(e.target.value)} />

            <label>Użytkownicy:</label>
            <ul className="team-members-list">
              {editTeamMembers.map((member) => (
                <li key={member}>
                  <span>{member}</span>
                  <button onClick={() => removeTeamMember(member)}>Usuń</button>
                </li>
              ))}
            </ul>
            <label>Przypisz użytkownika:</label>
              <select onChange={(e) => addTeamMember(e.target.value)}>
                <option value="">Przypisz użytkownika</option>
                {users.map((user) => (
                  <option key={user.id} value={user.username}>{user.username}</option>
                ))}
              </select>

              <div className="modal-buttons">
                <button onClick={saveProjectChanges}>Zapisz</button>
                <button onClick={() => setEditingProject(null)}>Anuluj</button>
              </div>
        </div>
      </div>
    )}
    
    {showModal && (
      <div className="modal-overlay">
        <div className="modal">
          <h2>Nowy Projekt</h2>
          <input
            type="text"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            placeholder="Podaj nazwe projektu"
          />
          <textarea
            value={newProjectDescription}
            onChange={(e) => setNewProjectDescription(e.target.value)}
            placeholder="Podaj opis projektu"
          />
          <label>Przypisz użytkownika:</label>
          <select
            multiple
            value={newProjectTeamMembers}
            onChange={(e) => {
              const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
              setNewProjectTeamMembers(selectedOptions);
            }}
          >
            {users.map(user => (
              <option key={user.id} value={user.username}>
                {user.username}
              </option>
            ))}
          </select>
          <div className="modal-buttons">
            <button onClick={handleCreateNewProject}>Zapisz</button>
            <button onClick={() => setShowModal(false)}>Anuluj</button>
          </div>
        </div>
      </div>
    )}
  </div>
);
}

export default ProjectsPage;
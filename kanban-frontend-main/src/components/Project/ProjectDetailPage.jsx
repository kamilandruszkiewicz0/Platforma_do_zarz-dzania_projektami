import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'; 
import './ProjectDetailPage.css';
import { format } from "date-fns";
import pl from "date-fns/locale/pl";

function ProjectDetailPage({ projects, setProjects }) {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem('token'); 
  
  let currentUser = null;

  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1])); 
      currentUser = payload.unique_name; 
    } catch (error) {
      console.error('Invalid token format:', error);
    }
  }

  const [newListName, setNewListName] = useState('');
  const [isAddingList, setIsAddingList] = useState(false);
  const [lists, setLists] = useState([]);
  const [editingListIndex, setEditingListIndex] = useState(null);
  const [newListNameForEdit, setNewListNameForEdit] = useState('');
  const [editingTask, setEditingTask] = useState({ listIndex: null, taskIndex: null, taskName: '', taskDescription: '' });
  const [selectedTask, setSelectedTask] = useState(null);
  const [editingDescription, setEditingDescription] = useState(null);
  const [expandedTask, setExpandedTask] = useState(null);
  const [editingTaskName, setEditingTaskName] = useState(null);
  const [taskLists, setTaskLists] = useState([]);
  const [projectUsers, setProjectUsers] = useState([]);
  const [openedMenuIndex, setOpenedMenuIndex] = useState(null);
  const [filterAssignedTo, setFilterAssignedTo] = useState(""); // Filtrowanie po Assigned To
  const [filterDeadline, setFilterDeadline] = useState(""); // Filtrowanie po Deadline
  const [showFilters, setShowFilters] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [filteredLists, setFilteredLists] = useState([]);
  const [, forceUpdate] = useState(0);
  const [forceRender, setForceRender] = useState(0);

  const listInputRef = useRef(null);
  const taskInputRef = useRef(null);
  const newTaskInputRefs = useRef([]);
  const descriptionInputRef = useRef(null);
  const taskNameInputRef = useRef(null);
  const [users, setUsers] = useState([]);


  useEffect(() => {
    const fetchProjectsFromLocalStorage = () => {
      const storedProjects = localStorage.getItem('projects');
      if (storedProjects) {
        const parsedProjects = JSON.parse(storedProjects);
        setProjects(parsedProjects);
        const currentProject = parsedProjects.find(p => p.id === parseInt(projectId));
        if (currentProject) {
          setLists(currentProject.lists || []);
        }
      }
    };

    if (!projects || projects.length === 0) {
      fetchProjectsFromLocalStorage();
    }
  }, [projects, setProjects, projectId]);

  const fetchTaskLists = async () => {
    try {
      const response = await fetch(`https://yhuxfr4hde.execute-api.eu-central-1.amazonaws.com/dev/tasklists?projectId=${projectId}`);
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Failed to fetch task lists:", errorText);
        return;
      }
  
      const data = await response.json();
  
      setTaskLists(data.$values || []);
    } catch (error) {
      console.error("Error fetching task lists:", error.message);
      alert("Failed to fetch task lists. Please try again later.");
    }
  };
  
  useEffect(() => {
    const fetchTaskLists = async () => {
      try {
        const response = await fetch(`https://yhuxfr4hde.execute-api.eu-central-1.amazonaws.com/dev/tasklists?projectId=${projectId}`);
        const data = await response.json();
  
        const sortedData = data.$values.map((list) => ({
          ...list,
          tasks: {
            ...list.tasks,
            $values: list.tasks.$values.sort((a, b) => a.order - b.order),
          },
        }));
  
        setTaskLists(sortedData);
      } catch (error) {
        console.error("Error fetching task lists:", error);
      }
    };
  
    fetchTaskLists();
  }, [projectId]);
  
  const fetchProjectUsers = async () => {
    const apiUrl = `https://yhuxfr4hde.execute-api.eu-central-1.amazonaws.com/dev/projects/${projectId}/users`;

    try {
        const response = await fetch(apiUrl);

        if (!response.ok) {
            const errorText = await response.text();
            console.error("❌ Błąd pobierania użytkowników:", errorText);
            alert("Failed to fetch users for project.");
            return;
        }

        const data = await response.json();

        const usersArray = data.values ? data.values : data;

        setProjectUsers(usersArray);
    } catch (error) {
        console.error("❌ Error fetching project users:", error);
        setProjectUsers([]);
    }
};

useEffect(() => {
  if (projectId) {
      fetchProjectUsers();
  }
}, [projectId]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch("https://yhuxfr4hde.execute-api.eu-central-1.amazonaws.com/dev/api/users");
        if (!response.ok) {
          const errorText = await response.text();
          console.error("Failed to fetch users:", errorText);
          return;
        }
        const data = await response.json();
        setUsers(data.$values || []);
      } catch (error) {
        console.error("Error fetching users:", error.message);
      }
    };
  
    fetchUsers();
  }, []);   

  useEffect(() => {
    if (taskLists && taskLists.length > 0) {
      const filteredLists = taskLists.filter(list => list.projectId === parseInt(projectId));
      setLists(filteredLists);
    }
  }, [taskLists, projectId]);
  
  useEffect(() => {
    setFilteredLists(filteredTasks); 
}, [filterAssignedTo, filterDeadline, lists]);  

  const updateProjectLists = (updatedLists) => {
    setLists(updatedLists);
  
    if (typeof setProjects === 'function') {
      const updatedProjects = projects.map(p =>
        p.id === parseInt(projectId) ? { ...p, lists: updatedLists } : p
      );
      setProjects(updatedProjects);
      localStorage.setItem('projects', JSON.stringify(updatedProjects));
    } else {
      console.error("setProjects is not a function");
    }
  };
  
  const handleAssignUser = async (listIndex, taskIndex, assignedTo) => {
    const taskId = lists[listIndex]?.tasks?.$values?.[taskIndex]?.id;
  
    if (!taskId) {
      console.error("Cannot assign user. Task ID is missing for taskIndex:", taskIndex);
      return;
    }
  
    try {
      const response = await fetch(`https://yhuxfr4hde.execute-api.eu-central-1.amazonaws.com/dev/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: taskId, assignedTo })
      });
  
      if (response.ok) {
        await fetchTaskLists();
      } else {
        const errorText = await response.text();
        console.error(`Failed to assign user: ${assignedTo}. Server response: ${errorText}`);
        alert(`Error assigning user: ${errorText}`);
      }
    } catch (error) {
      console.error("Error during user assignment:", error.message);
      alert('An error occurred while assigning the user. Please check the console for details.');
    }
  };
  
  
  const isUniqueTaskName = (listIndex, name) => !lists[listIndex]?.tasks?.some(task => task.name === name);

  const resetEditingState = () => {
    setEditingListIndex(null);
    setNewListNameForEdit('');
    setEditingTask({ listIndex: null, taskIndex: null, taskName: '', taskDescription: '' });
    setSelectedTask(null);
    setEditingDescription(null);
    setExpandedTask(null);
    setEditingTaskName(null);
  };

  const handleAddTaskList = async () => {
    if (newListName.trim() === '') {
        alert('The task list name cannot be empty.');
        return;
    }

    const newTaskList = {
        name: newListName,
        projectId: parseInt(projectId),
        tasks: [],
    };

    try {
        const response = await fetch('https://yhuxfr4hde.execute-api.eu-central-1.amazonaws.com/dev/tasklists', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newTaskList),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error response from API:', errorText);
            throw new Error(errorText);
        }

        const createdTaskList = await response.json();

        // Aktualizacja stanu
        setTaskLists((prevTaskLists) => [
            ...(prevTaskLists?.$values || prevTaskLists || []),
            createdTaskList,
        ]);

        setNewListName('');
        setIsAddingList(false);
    } catch (error) {
        console.error('Error creating task list:', error.message);
        alert('An error occurred while creating the task list. Please try again.');
    }
};


  const handleEditList = (index) => {
    const selectedList = lists[index];
  
    if (selectedList && selectedList.id) {
      setEditingListIndex(index);
      setNewListNameForEdit(selectedList.name);
    } else {
      console.error("Invalid list data or missing ID:", selectedList);
    }
  };  

  const handleSaveEditedList = async (listId, newListName, projectId) => {
  
    if (!listId || !newListName.trim() || !projectId) {
      console.error("Missing or invalid parameters in handleSaveEditedList!");
      return;
    }
  
    try {
      const response = await fetch(
        `https://yhuxfr4hde.execute-api.eu-central-1.amazonaws.com/dev/tasklists/${listId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: listId, name: newListName, projectId }),
        }
      );
  
      if (response.ok) {
        const updatedList = await response.json();
  
        // Aktualizuj stan
        const updatedLists = lists.map((list) =>
          list.id === listId ? { ...list, name: newListName } : list
        );
        setLists(updatedLists);
      } else {
        console.error("Failed to update TaskList:", response.statusText);
      }
    } catch (error) {
      console.error("Error in handleSaveEditedList:", error);
    }
  };

  const handleTaskNameChange = (listIndex, taskIndex, newName) => {
    const updatedLists = lists.map((list, i) => {
        if (i === listIndex) {
            return {
                ...list,
                tasks: list.tasks.map((task, j) =>
                    j === taskIndex ? { ...task, name: newName } : task
                ),
            };
        }
        return list;
    });
    setLists(updatedLists);
};

const handleTaskUpdate = async (updatedTask) => {
  try {
      const response = await fetch(`https://yhuxfr4hde.execute-api.eu-central-1.amazonaws.com/dev/tasks/${updatedTask.id}`, {
          method: "PUT",
          headers: {
              "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedTask),
      });

      if (!response.ok) {
          throw new Error("Failed to update task.");
      }

      fetchTaskLists();

      await fetchProjectUsers();

  } catch (error) {
      console.error("❌ Error updating task:", error);
  }
};

  const toggleMenu = (index) => {
    setOpenedMenuIndex(openedMenuIndex === index ? null : index);
  };
  
  const handleBlurListEdit = async () => {
    if (editingListIndex !== null) {
      const listId = lists[editingListIndex]?.id; 
      const trimmedName = newListNameForEdit?.trim(); 
      const numericProjectId = parseInt(projectId, 10); 
  
      if (listId && trimmedName && numericProjectId) {
        await handleSaveEditedList(listId, trimmedName, numericProjectId);
        setEditingListIndex(null); 
      } else {
        console.error("Missing or invalid data for TaskList update:", {
          listId,
          newListName: trimmedName,
          projectId: numericProjectId,
        });
      }
    }
  };

  const handleDeleteList = async (index) => {
    const listToDelete = lists[index];
    try {
      const response = await fetch(`https://yhuxfr4hde.execute-api.eu-central-1.amazonaws.com/dev/tasklists/${listToDelete.id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        const updatedLists = lists.filter((_, i) => i !== index);
        updateProjectLists(updatedLists);
        fetchTaskLists();
      }
    } catch (error) {
      console.error("Error deleting task list:", error);
    }
  };

  const handleSaveEditedTask = async (listIndex, taskIndex) => {
    const task = lists[listIndex]?.tasks?.$values?.[taskIndex];

    if (!task) {
        console.error("Task not found.");
        return;
    }

    let formattedDeadline = null;
    if (editingTask.deadline) {
        try {
            formattedDeadline = `${editingTask.deadline}T00:00:00.000Z`; 
        } catch (error) {
            console.error("Błąd konwersji daty:", error);
            formattedDeadline = null;
        }
    }

    const updatedTask = {
        id: task.id,
        name: editingTask.taskName || task.name,
        description: editingTask.taskDescription || task.description,
        assignedTo: editingTask.assignedTo || task.assignedTo,
        deadline: formattedDeadline, 
    };

    try {
        const response = await fetch(`https://yhuxfr4hde.execute-api.eu-central-1.amazonaws.com/dev/tasks/${task.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updatedTask),
        });

        if (response.ok) {
              setLists((prevLists) =>
                prevLists.map((list, i) =>
                    i === listIndex
                        ? {
                              ...list,
                              tasks: {
                                  ...list.tasks,
                                  $values: list.tasks.$values.map((t, j) =>
                                      j === taskIndex ? { ...t, ...updatedTask } : t
                                  ),
                              },
                          }
                        : list
                )
            );
            resetEditingState();
        } else {
            console.error("❌ Failed to update task:", response.statusText);
        }
    } catch (error) {
        console.error("❌ Error updating task:", error);
    }
};
  
  const handleDeleteTask = async (listIndex, taskIndex) => {
  
    const list = lists[listIndex];
    if (!list || !list.tasks?.$values) {
      console.error("🚨 Error: Task list not found.", { listIndex, taskIndex, list });
      alert("🚨 Error: Task list not found.");
      return;
    }
  
    const taskToDelete = list.tasks.$values[taskIndex];
  
    if (!taskToDelete || !taskToDelete.id) {
      console.error("🚨 Error: Task to delete not found or has no ID:", taskToDelete);
      alert("🚨 Error: Task not found.");
      return;
    }
    
    try {
      const response = await fetch(`https://yhuxfr4hde.execute-api.eu-central-1.amazonaws.com/dev/tasks/${taskToDelete.id}`, {
        method: "DELETE",
      });
  
      if (response.ok) {
  
        const updatedLists = lists.map((l, i) => {
          if (i === listIndex) {
            return {
              ...l,
              tasks: {
                ...l.tasks,
                $values: l.tasks.$values.filter((_, j) => j !== taskIndex),
              },
            };
          }
          return l;
        });
  
        setLists(updatedLists);
      } else {
        const errorText = await response.text();
        console.error("❌ Failed to delete task:", errorText);
        alert(`❌ Failed to delete task: ${errorText}`);
      }
    } catch (error) {
      console.error("❌ Error deleting task:", error);
      alert("❌ An error occurred while deleting the task.");
    }
  };  
  
  const handleAddTask = async (listIndex, taskName) => {
      const list = lists[listIndex];
      
      if (!list || !list.id) {
        console.error("TaskListId is undefined for the selected list:", list);
        alert('Failed to add task: TaskListId is undefined.');
        return;
      }
    
      if (!Array.isArray(list.tasks)) {
        list.tasks = [];
      }
    
      const newTask = {
        name: taskName,
        description: "",
        isCompleted: false,
        taskListId: list.id,
        assignedTo: currentUser,
      };
        
      try {
        const response = await fetch("https://yhuxfr4hde.execute-api.eu-central-1.amazonaws.com/dev/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newTask),
        });
    
        if (response.ok) {
          const data = await response.json();
    
          await fetchTaskLists();
        } else {
          const errorText = await response.text();
          console.error("Failed to create task:", errorText);
          alert(`Failed to create task: ${errorText}`);
        }
      } catch (error) {
        console.error("Error adding task:", error);
        alert('An error occurred while adding the task. Please check the console for details.');
      }
  };    

  const handleKeyDownAddTask = (e, listIndex) => {
    if (e.key === 'Enter' && e.target.value.trim() !== "") {
      handleAddTask(listIndex, e.target.value.trim());
      e.target.value = '';
      newTaskInputRefs.current[listIndex]?.focus();
    }
  };

  const handleProjectClick = (id) => {
    if (id !== parseInt(projectId)) {
      navigate(`/project/${id}`);
    }
  };

  const handleTaskClick = (listIndex, taskIndex) => {
    const task = lists[listIndex]?.tasks?.$values?.[taskIndex];
    if (!task) {
        console.error("Task not found");
        return;
    }

    setExpandedTask({ listIndex, taskIndex });
    setEditingTask({
        listIndex,
        taskIndex,
        taskName: task.name || "",
        taskDescription: task.description || "",
        assignedTo: task.assignedTo || "",
        deadline: task.deadline ? formatDateForInput(task.deadline) : "", 
    });
};
  
  const handleSaveDescription = async () => {
    if (expandedTask) {
      const { listIndex, taskIndex } = expandedTask;
      const taskId = lists[listIndex]?.tasks?.[taskIndex]?.id;
      const updatedDescription = descriptionInputRef.current?.value.trim();
  
      if (!taskId || updatedDescription === undefined) {
        console.error("Missing task ID or description");
        return;
      }
  
      try {
        const response = await fetch(`https://yhuxfr4hde.execute-api.eu-central-1.amazonaws.com/dev/tasks/${taskId}/description`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ description: updatedDescription }), 
        });
  
        if (response.ok) {
          const updatedLists = lists.map((list, i) => {
            if (i === listIndex) {
              return {
                ...list,
                tasks: list.tasks.map((task, j) =>
                  j === taskIndex ? { ...task, description: updatedDescription } : task
                ),
              };
            }
            return list;
          });
  
          setLists(updatedLists);
          setExpandedTask(null);
        } else {
          const errorText = await response.text();
          console.error("Failed to update task description:", errorText);
          alert(`Failed to update task description: ${errorText}`);
        }
      } catch (error) {
        console.error("Error updating task description:", error);
        alert('An error occurred while updating the task description. Please try again.');
      }
    }
  };
     
  const handleDragEnd = async (result) => {
    const { source, destination, type } = result;
  
    if (!destination) return;
  
    const sourceListIndex = parseInt(source.droppableId.replace("list-", ""), 10);
    const destinationListIndex = parseInt(destination.droppableId.replace("list-", ""), 10);
  
    const updatedLists = Array.from(lists);
  
    if (type === "task") {
      const sourceTasks = Array.from(updatedLists[sourceListIndex].tasks.$values || []);
      const [movedTask] = sourceTasks.splice(source.index, 1);
  
      if (sourceListIndex === destinationListIndex) {
        sourceTasks.splice(destination.index, 0, movedTask);
        updatedLists[sourceListIndex].tasks.$values = sourceTasks;
      } else {
        const destinationTasks = Array.from(updatedLists[destinationListIndex].tasks.$values || []);
        destinationTasks.splice(destination.index, 0, movedTask);
  
        updatedLists[sourceListIndex].tasks.$values = sourceTasks;
        updatedLists[destinationListIndex].tasks.$values = destinationTasks;
  
        try {
          await fetch("https://yhuxfr4hde.execute-api.eu-central-1.amazonaws.com/dev/tasks/move", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              TaskId: movedTask.id,
              DestinationListId: updatedLists[destinationListIndex].id,
              NewOrder: destination.index,
            }),
          });
        } catch (error) {
          console.error("Error moving task:", error);
          alert("Failed to move task to another list.");
        }
      }
  
      setLists(updatedLists);
    }
  };

  const handleClickOutside = (e) => {
    if (e.target.classList.contains("task-popup")) {
      resetEditingState();
    }
  };

  const handleCopyList = async (listIndex) => {
    const listToCopy = lists[listIndex];
  
    if (!listToCopy) {
      console.error("Nie znaleziono listy do skopiowania.");
      return;
    }
  
    try {
      const response = await fetch(`https://yhuxfr4hde.execute-api.eu-central-1.amazonaws.com/dev/tasklists/${listToCopy.id}/copy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
  
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Błąd podczas kopiowania listy:', errorText);
        return;
      }
  
      const newList = await response.json();
      setLists((prevLists) => [...prevLists, newList]); 
    } catch (error) {
      console.error("Błąd podczas kopiowania listy:", error);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return format(date, "dd.MM.yyyy");
};

  const formatDateForDisplay = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return format(date, "dd.MM.yyyy", { locale: pl });
  };

  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toISOString().split("T")[0];
};

  const handleDateChange = (e) => {
    setEditingTask((prev) => ({
        ...prev,
        deadline: e.target.value,
    }));
  };
  
  const toggleTaskCompletion = async (taskId, currentStatus) => {
    try {
        const response = await fetch(`https://yhuxfr4hde.execute-api.eu-central-1.amazonaws.com/dev/tasks/${taskId}/toggle-completion`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isCompleted: !currentStatus }),
        });

        if (!response.ok) throw new Error(`Błąd: ${response.status}`);

        console.log(`Zmieniono task ${taskId} na isCompleted=${!currentStatus}`);

        setTaskLists((prevTaskLists) =>
            prevTaskLists.map((list) => ({
                ...list,
                tasks: {
                    ...list.tasks,
                    $values: list.tasks.$values.map((task) =>
                        task.id === taskId ? { ...task, isCompleted: !currentStatus } : task
                    ),
                },
            }))
        );

        fetchTaskLists(); 

    } catch (error) {
        console.error("Błąd aktualizacji zadania:", error);
    }
};

  const filteredTasks = lists.map(list => {
      return {
          ...list,
          tasks: {
              ...list.tasks,
              $values: Array.isArray(list.tasks?.$values)  
                  ? list.tasks.$values.filter(task => {
                      const matchesAssignedTo = filterAssignedTo ? task.assignedTo === filterAssignedTo : true;
                      const taskDeadline = task.deadline ? formatDateForInput(task.deadline) : "";
                      const matchesDeadline = filterDeadline ? taskDeadline === filterDeadline : true;
  
                      return matchesAssignedTo && matchesDeadline;
                  })
                  : [] 
          }
      };
  });
  
  return (
    <div className="project-detail-page">
      
      <header className="header">
        <h1>{projects.find(p => p.id === parseInt(projectId))?.name || 'Ładowanie projektu...'}</h1>
        <button onClick={() => navigate('/projects')} className="back-button">
        ←
      </button>
      </header>
      <div className="project-detail-container">
        
        <aside className="sidebar">
          
          <ul>
            {projects.map(project => (
              <li key={project.id}>
                <button
                  className="project-tile"
                  onClick={() => handleProjectClick(project.id)}
                >
                  {project.name}
                </button>
              </li>
            ))}
          </ul>
        </aside>
        <main className="main-content">
          
          {isAddingList && (
            
            <div className="add-list-popup">
              <h3>Dodaj nową liste</h3>
              <input
                type="text"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                placeholder="Nazwa listy"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddTaskList();
                }}
              />
              <button onClick={handleAddTaskList}>Dodaj</button>
              <button onClick={() => setIsAddingList(false)}>Anuluj</button>
            </div>
          )}
          <button className="add-list-button" onClick={() => setIsAddingList(true)}>
            Dodaj
          </button>
          <div className="filters-wrapper">
        <button className="filters-toggle" onClick={() => setShowFilters(!showFilters)}>
            Filtry
        </button>

        {showFilters && (
            <div className="filters-container">
                <label className="filter-label">
                    Przypisane do:
                      <select
                      className="filter-select"
                      value={filterAssignedTo}
                      onChange={(e) => {
                        setFilterAssignedTo(e.target.value);
                      }}
                    >
                      {users.map(user => (
                        <option key={user.id} value={user.username}>{user.username}</option>
                      ))}
                    </select>
                </label>

                <label className="filter-label">
                    Deadline:
                    <input
                        type="date"
                        value={filterDeadline}
                        onChange={(e) => setFilterDeadline(e.target.value)}
                        className="filter-date"
                    />
                </label>

                <button className="filter-reset-button" onClick={() => { 
                    setFilterAssignedTo(""); 
                    setFilterDeadline(""); 
                }}>
                    Reset Filters
                </button>
            </div>
        )}
    </div>

          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="all-lists" type="list" direction="horizontal">
              {(provided) => (
                <div
                  className="task-lists"
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                >
                  {filteredTasks.map((list, listIndex) => (
                    <Draggable
                      draggableId={`list-${listIndex}`}
                      index={listIndex}
                      key={`list-${listIndex}`}
                    >
                      
                      {(provided) => (
                        <div
                          className="task-list"
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                        >
                          <div
                            {...provided.dragHandleProps}
                            className="task-list-header"
                          >
                            {editingListIndex === listIndex ? (
                              <input
                                type="text"
                                value={newListNameForEdit}
                                onChange={(e) => setNewListNameForEdit(e.target.value)}
                                onBlur={handleBlurListEdit}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    handleBlurListEdit();
                                  }
                                }}
                                autoFocus
                              />
                            ) : (
                              <>
                                <h3>{list.name}</h3>
                                <div className="options-menu">
                                  <button
                                    className="options-button"
                                    onClick={() => toggleMenu(listIndex)}
                                  >
                                    ...
                                  </button>
                                  {openedMenuIndex === listIndex && (
                                  <div className="options-dropdown">
                                    <button onClick={() => handleEditList(listIndex)}>Zmień nazwę</button>
                                    <button onClick={() => handleDeleteList(listIndex)}>Usuń</button>
                                    <button onClick={() => handleCopyList(listIndex)}>Kopiuj</button>
                                  </div>
                                  )}
                                </div>

                              </>
                            )}
                          </div>
                          <Droppable droppableId={`list-${listIndex}`} type="task">
                            {(provided) => (
                              <ul className="task-tiles" ref={provided.innerRef} {...provided.droppableProps}>
                              {(list.tasks?.$values || []).map((task, taskIndex) => (
                                <Draggable
                                  key={`task-${listIndex}-${taskIndex}`}
                                  draggableId={`task-${listIndex}-${taskIndex}`}
                                  index={taskIndex}
                                >
                                  {(provided) => (
                                    <li className="task-item" ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                                      <div className="task-tile" onClick={() => handleTaskClick(listIndex, taskIndex)}>
                                      <div className="task-card">
                                        
                                        <span>{task.name || "Task name is missing."}</span>
                                        <button
                                            className="delete-task"
                                            onClick={() => handleDeleteTask(listIndex, taskIndex)}
                                          >
                                            ×
                                        </button>
                                        {task.assignedTo && (
                                          <p>Przypisane do: {task.assignedTo}</p> 
                        
                                        )}
                                        {task.deadline && (
                                          <p>Deadline: {task.deadline ? formatDate(task.deadline) : "Brak"}</p>
                                        )}
                                        <button
                                          className={`task-status-icon ${task.isCompleted ? "completed" : "incomplete"}`}
                                          onClick={(e) => {
                                              e.stopPropagation();
                                              toggleTaskCompletion(task.id, task.isCompleted);
                                          }}
                                      >
                                          ✔
                                      </button>
                                        </div>
                                      </div>
                                    </li>
                                  )}
                                </Draggable>
                              ))}
                              {provided.placeholder}
                            </ul>                            
                            )}
                          </Droppable>
                          <div className="add-task">
                            <input
                              ref={(el) => (newTaskInputRefs.current[listIndex] = el)}
                              type="text"
                              placeholder="Add a new task..."
                              onKeyDown={(e) => handleKeyDownAddTask(e, listIndex)}
                            />
                            <button className="add-task-button" onClick={() => handleAddTask(listIndex, newTaskInputRefs.current[listIndex]?.value)}>
                              +
                            </button>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>

          {editingTask.listIndex !== null && editingTask.taskIndex !== null && (
            <div
              className="edit-task-popup"
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
              }}
            >
              <h3>Edytuj</h3>
              <input
                type="text"
                value={editingTask.taskName || ""}
                onChange={(e) =>
                  setEditingTask((prev) => ({
                    ...prev,
                    taskName: e.target.value,
                  }))
                }
                placeholder="Rename task"
              />
              <select
                value={editingTask.assignedTo || ""}
                onChange={(e) =>
                  setEditingTask((prev) => ({ ...prev, assignedTo: e.target.value }))
                }
              >
                <option value="">Nie przypisane</option>
                {Array.isArray(projectUsers) && projectUsers.map((user) => (
                      <option 
                      key={user.id} value={user.username}>{user.username}
                      </option>
                ))}
              </select>


              <button
                onClick={() => handleSaveEditedTask(editingTask.listIndex, editingTask.taskIndex)}
              >
                Zapisz
              </button>
              <button onClick={resetEditingState}>Anuluj</button>
            </div>
          )}
        </main>
      </div>
      {expandedTask !== null && (
        <div className="task-popup" onClick={handleClickOutside}>
        <div className="task-popup-content" onClick={(e) => e.stopPropagation()}>
          <h3>Edytuj</h3>
          <input
            type="text"
            value={editingTask.taskName || ""}
            onChange={(e) =>
              setEditingTask((prev) => ({ ...prev, taskName: e.target.value }))
            }
            placeholder="Zmień nazwe"
          />
          <textarea
            value={editingTask.taskDescription || ""}
            onChange={(e) =>
              setEditingTask((prev) => ({ ...prev, taskDescription: e.target.value }))
            }
            placeholder="Wpisz opis zadania"
          />
          <div className="deadline-container">
            <label>Deadline</label>
            <input
              type="date"
              className="deadline-input"
              value={editingTask.deadline ? editingTask.deadline : ""}
              onChange={(e) =>
                  setEditingTask((prev) => ({
                      ...prev,
                      deadline: e.target.value,
                  }))
              }
            />
          </div>
          <select
            value={editingTask.assignedTo || ""}
            onChange={(e) =>
              setEditingTask((prev) => ({ ...prev, assignedTo: e.target.value }))
            }
          >
            <option value="">Nie przypisane</option>
            {users.map((user) => (
              <option key={user.id} value={user.username}>
                {user.username}
              </option>
            ))}
          </select>
          <button onClick={() => handleSaveEditedTask(editingTask.listIndex, editingTask.taskIndex)}>
            Zapisz
          </button>
          <button onClick={resetEditingState}>Cancel</button>
        </div>
      </div>
      
    )}
    </div>
  );
};

export default ProjectDetailPage;

import logo from './logo.svg';
import React, { useState, useEffect, useRef } from 'react';
import './App.css';


const App = () => {
  const [tasks, setTasks] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [newTask, setNewTask] = useState({
    task_name: '',
    task_id: '',
    brownie_point_value: 0,
    max_interval: 0,
    min_interval: 0,
    priority: 0,
    description: ''
  });


  const fetchTasks = () => {
    const apiUrl = process.env.REACT_APP_BACKEND_URL;

    // Make a GET request to the API, returns a list of tasks. Then, log the tasks to the console
    const list_tasks_url = apiUrl + "/tasks/";
    fetch(list_tasks_url)
      .then((res) => res.json())
      .then((data) => {
        setTasks(data);
      });
  };

  // Fetch tasks at regular intervals
  useEffect(() => {
    const interval = setInterval(() => {
      fetchTasks();
    }, 1000);
    return () => clearInterval(interval);
  }
    , []);

  const handleCreateTask = () => {
    const apiUrl = process.env.REACT_APP_BACKEND_URL;
    const createTaskUrl = apiUrl + '/tasks/';

    // Fetch CSRF token from cookies
    const csrftoken = document.cookie.split('; ').find(row => row.startsWith('csrftoken=')).split('=')[1];

    fetch(createTaskUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Include CSRF token in the request header
        'X-CSRFToken': csrftoken
      },
      body: JSON.stringify(newTask),
    })
      .then(response => response.json())
      .then(data => {
        fetchTasks();
        setShowPopup(false);
      })
      .catch((error) => {
        console.error('Error:', error);
      });
  };

  const togglePopup = () => {
    setShowPopup(!showPopup);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewTask({
      ...newTask,
      [name]: value,
    });
  };

  const showTaskDetails = (task) => {
    setSelectedTask(task);
    setShowPopup(true);
  };

  const popupInnerRef = useRef(null);

  const handleOverlayClick = (e) => {
    if (popupInnerRef.current && !popupInnerRef.current.contains(e.target)) {
      setShowPopup(false);
      setSelectedTask(null);
      fetchTasks();
    }
  };

  const deleteTask = (taskId) => {
    const apiUrl = process.env.REACT_APP_BACKEND_URL;
    const deleteTaskUrl = `${apiUrl}/tasks/delete_task/`;
    console.log("deleteTaskUrl: ", deleteTaskUrl);
    console.log("taskId: ", taskId);

    // Fetch CSRF token from cookies
    const csrftoken = document.cookie.split('; ').find(row => row.startsWith('csrftoken=')).split('=')[1];

    // Make a POST request, with the task ID in the body
    fetch(deleteTaskUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrftoken
      },
      body: JSON.stringify({ task_id: taskId }),
    })
      .then((res) => res.json())
      .then(() => {
        setShowPopup(false);
        setSelectedTask(null);
        fetchTasks();
      });
  };

  return (
    <div className="App">
      <h1>Task Queue</h1>
      <button onClick={() => { setShowPopup(true); setSelectedTask(null); }}>Create Task</button>

      {showPopup ? (
        <div className="popup" onClick={handleOverlayClick}>
          <div className="popup-inner" ref={popupInnerRef}>
            {selectedTask ? (
              <div>
                <h2>{selectedTask.task_name}</h2>
                <p>ID: {selectedTask.task_id}</p>
                <p>Brownie Points: {selectedTask.brownie_point_value}</p>
                <p>Max Interval: {selectedTask.max_interval}</p>
                <p>Min Interval: {selectedTask.min_interval}</p>
                <p>Priority: {selectedTask.priority}</p>
                <p>Description: {selectedTask.description}</p>
                <button className="delete-button" onClick={() => deleteTask(selectedTask.task_id)}>Delete Task</button>
              </div>
            ) : (
              <div>
                <h2>Create a New Task</h2>
                <form>
                  <input type="text" name="task_name" placeholder="Task Name" onChange={handleInputChange} />
                  <input type="text" name="task_id" placeholder="Task ID" onChange={handleInputChange} />
                  <input type="number" name="brownie_point_value" placeholder="Brownie Point Value" onChange={handleInputChange} />
                  <input type="number" name="max_interval" placeholder="Max Interval" onChange={handleInputChange} />
                  <input type="number" name="min_interval" placeholder="Min Interval" onChange={handleInputChange} />
                  <input type="number" name="priority" placeholder="Priority" onChange={handleInputChange} />
                  <input type="text" name="description" placeholder="Description" onChange={handleInputChange} />
                  <button type="button" onClick={handleCreateTask}>Create Task</button>
                </form>
              </div>
            )}
            <button onClick={() => { setShowPopup(false); setSelectedTask(null); }}>Close</button>
          </div>
        </div>
      ) : null}

      <div className="task-container">
        {/* Sort tasks by priority and then map them to task cards */}
        {tasks.sort((a, b) => a.priority - b.priority).map((task) => (
          <div className="task-card" key={task.task_id} onClick={() => showTaskDetails(task)}>
            {task.task_name}
          </div>
        ))}
      </div>
    </div>
  );


};

export default App;

import logo from './logo.svg';
import React, { useState, useEffect, useRef } from 'react';
import './App.css';


const App = () => {
  const [tasks, setTasks] = useState([]);
  const [showTaskPopup, setShowTaskPopup] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [newTask, setNewTask] = useState({
    task_name: '',
    task_id: '',
    max_interval: '0:0',
    min_interval: '0:0',
    description: ''
  });

  // Task completion states
  const [showCompleteTaskPopup, setShowCompleteTaskPopup] = useState(false);
  const [completionUsers, setCompletionUsers] = useState([]);
  const [completionTime, setCompletionTime] = useState(0); // time in minutes
  const [grossness, setGrossness] = useState(0);
  const [users, setUsers] = useState([]); // Assuming you will populate this with your user data

  const updateSelectedTaskTimer = useRef(null);

  const apiUrl = process.env.REACT_APP_BACKEND_URL;

  const fetchTasks = () => {
    // Make a GET request to the API, returns a list of tasks. Then, log the tasks to the console
    const list_tasks_url = apiUrl + "/tasks/";
    fetch(list_tasks_url)
      .then((res) => res.json())
      .then((data) => {
        console.log(data);
        setTasks(data);
      });
  };

  const fetchUsers = () => {
    // Make a GET request to the API, returns a list of users. Then, log the users to the console
    const list_users_url = apiUrl + "/accounts/";

    const csrftoken = document.cookie.split('; ').find(row => row.startsWith('csrftoken=')).split('=')[1];

    fetch(list_users_url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrftoken
      }
    })
      .then((res) => res.json())
      .then((data) => {
        setUsers(data);
      });
  };

  const handleOpenCompleteTaskPopup = (task) => {
    setSelectedTask(task);
    setSelectedTaskId(task.task_id);
    setShowCompleteTaskPopup(true);
  };

  const handleCreateWorkLog = async (event) => {
    event.preventDefault();
    console.log("Completion users is: ", completionUsers);
    const csrftoken = document.cookie.split('; ').find(row => row.startsWith('csrftoken=')).split('=')[1];
    const completion_time = `0:0:${completionTime}`;

    // Fetch the brownie_points for the task from the backend, at /calculate_brownie_points/
    const calculate_brownie_points_url = apiUrl + "/calculate_brownie_points/";
    const payload = {
      task_id: selectedTaskId,
      completion_time,
      grossness
    };
    console.log("Payload: ", payload);

    // Get the value of this task's brownie_points from the server
    let brownie_points;
    try {
      const response = await fetch(calculate_brownie_points_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrftoken
        },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      brownie_points = data.brownie_points;
    } catch (error) {
      console.error('Error: ', error);
      return;
    }

    console.log("Brownie points: ", brownie_points);

    // pop each user off the list of completionUsers and create a worklog for each
    for (const completionUser of completionUsers) {
      const worklog = {
        task: selectedTaskId,
        user: completionUser,
        completion_time,
        grossness,
        brownie_points
      };

      console.log("Creating worklog: ", worklog);

      // Make a POST request to create a new WorkLog entry
      try {
        const response = await fetch(apiUrl + '/worklogs/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrftoken
          },
          body: JSON.stringify(worklog)
        });
        const data = await response.json();
        console.log('WorkLog created: ', data);
      } catch (error) {
        console.error('Error: ', error);
      }
    }

    // Clear the list of completionUsers and close the popup
    completionUsers.length = 0;
    
    closeCompleteTaskPopup();
    closeTaskPopup();
  };


  useEffect(() => {
    const interval = setInterval(() => {
      fetchUsers();
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch tasks at regular intervals
  useEffect(() => {
    const interval = setInterval(() => {
      fetchTasks();
    }, 1000);
    return () => clearInterval(interval);
  }
    , []);

  useEffect(() => {
    if (showTaskPopup && selectedTaskId) {
      const fetchSelectedTask = async () => {
        const taskUrl = apiUrl + '/tasks/' + selectedTaskId;
        const response = await fetch(taskUrl);
        const data = await response.json();
        setSelectedTask(data);
      };

      // Clear previous timer if it exists
      if (updateSelectedTaskTimer.current) {
        clearInterval(updateSelectedTaskTimer.current);
      }

      fetchSelectedTask();
      // Store the new timer in the ref
      updateSelectedTaskTimer.current = setInterval(fetchSelectedTask, 3000);
    }

    return () => {
      if (updateSelectedTaskTimer.current) {
        clearInterval(updateSelectedTaskTimer.current);
      }
    };
  }, [showTaskPopup, selectedTaskId, apiUrl]); // Notice that it listens to selectedTaskId


  const handleCreateTask = (event) => {
    event.preventDefault();
    const createTaskUrl = apiUrl + '/tasks/';

    // Fetch CSRF token from cookies
    const csrftoken = document.cookie.split('; ').find(row => row.startsWith('csrftoken=')).split('=')[1];

    // Convert max_interval and min_interval to Django DurationField format
    const max_interval = `${newTask.max_interval_days || 0} ${newTask.max_interval_hours || 0}:${newTask.max_interval_minutes || 0}`;
    const min_interval = `${newTask.min_interval_days || 0} ${newTask.min_interval_hours || 0}:${newTask.min_interval_minutes || 0}`;
    console.log("max_interval: ", max_interval);
    console.log("min_interval: ", min_interval);

    // Create a new object containing the formatted max_interval and min_interval
    const formattedNewTask = {
      ...newTask,
      max_interval,
      min_interval
    };

    console.log("formattedNewTask: ", formattedNewTask);

    fetch(createTaskUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrftoken
      },
      body: JSON.stringify(formattedNewTask),
    })
      .then(response => response.json())
      .then(data => {
        console.log(data);
        fetchTasks();
        setShowTaskPopup(false);
      })
      .catch((error) => {
        console.error('Error:', error);
      });
  };

  const togglePopup = () => {
    setShowTaskPopup(!showTaskPopup);
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
    setSelectedTaskId(task.task_id);
    setShowTaskPopup(true);
  };

  const popupInnerRef = useRef(null);

  const handleOverlayClick = (e) => {
    if (popupInnerRef.current && !popupInnerRef.current.contains(e.target)) {
      console.log("Clicked outside of popup");
      closeCompleteTaskPopup();
      closeTaskPopup();
    }
  };

  const closeTaskPopup = () => {
    setShowTaskPopup(false);
    setSelectedTask(null);
    setSelectedTaskId(null);
    fetchTasks();
  };

  const closeCompleteTaskPopup = () => {
    setShowCompleteTaskPopup(false);
    setCompletionUsers([]);
    setCompletionTime(0);
    setGrossness(0);
  };

  const deleteTask = (taskId) => {
    const apiUrl = process.env.REACT_APP_BACKEND_URL;
    const deleteTaskUrl = `${apiUrl}/tasks/${taskId}/`;
    console.log("deleteTaskUrl: ", deleteTaskUrl);
    console.log("taskId: ", taskId);

    // Fetch CSRF token from cookies
    const csrftoken = document.cookie.split('; ').find(row => row.startsWith('csrftoken=')).split('=')[1];

    fetch(deleteTaskUrl, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrftoken
      },
    })
      .then(() => {
        console.log("Deleted task with ID: ", taskId);
        closeTaskPopup();
      });
  };

  return (
    <div className="App">
      <h1>Task Queue</h1>
      <button className="button" onClick={() => { setShowTaskPopup(true); setSelectedTask(null); setSelectedTaskId(null); }}>Create Task</button>

      {showTaskPopup ? (
        <div className="popup" onClick={handleOverlayClick}>
          <div className="popup-inner" ref={popupInnerRef}>
            {selectedTask ? (
              <div>
                <h2>{selectedTask.task_name}</h2>
                {/* <p>ID: {selectedTask.task_id}</p> */}
                <p>Max Interval: {selectedTask.max_interval}</p>
                <p>Min Interval: {selectedTask.min_interval}</p>
                <p>Last Completed: {selectedTask.last_completed}</p>
                <p>Staleness: {selectedTask.staleness}</p>
                <p>Description: {selectedTask.description}</p>
                <button className="button delete-button" onClick={() => deleteTask(selectedTask.task_id)}>Delete Task</button>
              </div>
            ) : (
              <div>
                <h2>Create a New Task</h2>
                <form className="task-form">
                  <div className="input-group">
                    <input type="text" name="task_name" placeholder="Task Name" onChange={handleInputChange} />
                    <input type="text" name="task_id" placeholder="Task ID" onChange={handleInputChange} />
                  </div>
                  <div className="input-group">
                    <label>Max Interval: </label>
                    <input type="number" name="max_interval_days" placeholder="Days" onChange={handleInputChange} />
                    <input type="number" name="max_interval_hours" placeholder="Hours" onChange={handleInputChange} />
                    <input type="number" name="max_interval_minutes" placeholder="Minutes" onChange={handleInputChange} />
                  </div>
                  <div className="input-group">
                    <label>Min Interval: </label>
                    <input type="number" name="min_interval_days" placeholder="Days" onChange={handleInputChange} />
                    <input type="number" name="min_interval_hours" placeholder="Hours" onChange={handleInputChange} />
                    <input type="number" name="min_interval_minutes" placeholder="Minutes" onChange={handleInputChange} />
                  </div>
                  <div className="input-group">
                    <input type="text" name="description" placeholder="Description" onChange={handleInputChange} />
                    <button className="button create-button" onClick={handleCreateTask}>Create Task</button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div >
      ) : null}


      {showCompleteTaskPopup ? (
        <div className="popup" onClick={handleOverlayClick}>
          <div className="popup-inner" ref={popupInnerRef}>
            <h2>Complete Task: {selectedTask && selectedTask.task_name}</h2>
            <form onSubmit={handleCreateWorkLog}>
              <div>
                <label>Select Users:</label>
                {users.map(user => (
                  <button
                    type="button"
                    className={`button user-button ${completionUsers.includes(user.id) ? 'selected' : ''}`}
                    onClick={() => {
                      if (completionUsers.includes(user.id)) {
                        // Remove user from list
                        setCompletionUsers(completionUsers.filter(id => id !== user.id));
                      } else {
                        // Add user to list
                        setCompletionUsers([...completionUsers, user.id]);
                      }
                    }}
                  >
                    {user.username}
                  </button>
                ))}
              </div>
              <div>
                <label htmlFor="completionTime">Completion Time (in minutes):</label>
                <input
                  id="completionTime"
                  type="number"
                  value={completionTime}
                  onChange={e => setCompletionTime(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="grossness">Grossness:</label>
                <input
                  id="grossness"
                  type="number"
                  value={grossness}
                  onChange={e => setGrossness(e.target.value)}
                />
              </div>
              <button className="button" type="submit">Submit</button>
            </form>
          </div>
        </div>
      ) : null}

      <div className="task-container">
        {tasks.map((task) => (
          <div
            className="task-card"
            key={task.task_id}
            onClick={() => showTaskDetails(task)}
          >
            <div className="task-content">
              <span className="task-text">
                {task.task_name}
              </span>
              <span className="task-button">
                <button className="button complete-button" onClick={() => handleOpenCompleteTaskPopup(task)}>Complete Task</button>
              </span>
            </div>
          </div>
        ))}
      </div>

    </div >
  );


};

export default App;

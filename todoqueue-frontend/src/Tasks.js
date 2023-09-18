import axios from 'axios';
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './App.css';


const apiUrl = process.env.REACT_APP_BACKEND_URL;


const Tasks = () => {
    const [tasks, setTasks] = useState([]);
    const [users, setUsers] = useState([]);
    const [completionUsers, setCompletionUsers] = useState([]);
    const [prevUsersBP, setPrevUsersBP] = useState({});
    const [userBPChanged, setUserBPChanged] = useState({});

    const [selectedTask, setSelectedTask] = useState(null);
    const [selectedTaskId, setSelectedTaskId] = useState(null);

    const [showTaskPopup, setShowTaskPopup] = useState(false);
    const [showCompleteTaskPopup, setShowCompleteTaskPopup] = useState(false);
    const [showAllTasks, setShowAllTasks] = useState(false);

    const [grossness, setGrossness] = useState(0);
    const [completionTime, setCompletionTime] = useState(0);
    const [newTask, setNewTask] = useState({
        task_name: '',
        task_id: '',
        max_interval: '0:0',
        min_interval: '0:0',
        description: ''
    });

    const updateSelectedTaskTimer = useRef(null);

    const completionTimeLookup = [
        1, 2, 5, 10, 15, 20, 30, 45, 60, 90, 120
    ];

    // useEffects //


    // Generate a random task_id for the new task
    useEffect(() => {
        setNewTask({
            ...newTask,
            task_id: randomString()
        });
    }, []);


    // Redirect to login page if not logged in
    useEffect(() => {
        if (localStorage.getItem('access_token') === null) {
            window.location.href = '/login'
        }
        else {
            (
                async () => {
                    try {
                        const { data } = await axios.get(
                            apiUrl + '/auth/',
                            {
                                headers: {
                                    'Content-Type': 'application/json'
                                }
                            }
                        );
                        console.log("Logged in with message", data.message);
                    } catch (e) {
                        console.log('not auth')
                    }
                })()
        };
    }, []);


    // Update userBPChanged when users changes so we can bounce the table when a user's BP changes
    useEffect(() => {
        const newPrevUsersBP = {};
        const userBPChanged = {};

        users.forEach(user => {
            const bp = user.brownie_point_credit - user.brownie_point_debit;
            if (prevUsersBP[user.id] !== undefined && prevUsersBP[user.id] !== bp) {
                userBPChanged[user.id] = true;
            }
            newPrevUsersBP[user.id] = bp;
        });

        setPrevUsersBP(newPrevUsersBP);
        setUserBPChanged(userBPChanged);
    }, [users]);


    // Fetch users at regular intervals
    useEffect(() => {
        fetchUsers();
        const interval = setInterval(() => {
            fetchUsers();
        }, 1000);
        return () => clearInterval(interval);
    }, []);


    // Fetch tasks at regular intervals
    useEffect(() => {
        // run immediately, then start a timer that runs every 1000ms
        fetchTasks();
        const interval = setInterval(() => {
            fetchTasks();
        }, 1000);
        return () => clearInterval(interval);
    }
        , [showAllTasks]);


    // Fetch selected task at regular intervals
    useEffect(() => {
        if (showTaskPopup && selectedTaskId) {
            const fetchSelectedTask = async () => {
                const taskUrl = apiUrl + '/tasks/' + selectedTaskId;
                const response = await axios.get(
                    taskUrl,
                    {
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRFToken': getCSRFToken()
                        },
                    }
                );
                setSelectedTask(response.data);
            };

            // Clear previous timer if it exists
            if (updateSelectedTaskTimer.current) {
                clearInterval(updateSelectedTaskTimer.current);
            }

            fetchSelectedTask();
            // Store the new timer in the ref
            updateSelectedTaskTimer.current = setInterval(fetchSelectedTask, 1000);
        }

        return () => {
            if (updateSelectedTaskTimer.current) {
                clearInterval(updateSelectedTaskTimer.current);
            }
        };
    }, [showTaskPopup, selectedTaskId, apiUrl]);


    // Backend API functions //

    const fetchTasks = () => {
        const list_tasks_url = apiUrl + "/tasks/";
        axios.get(list_tasks_url, {
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCSRFToken()
            }
        })
            .then((res) => {
                // Filter tasks by non-zero staleness
                let data = res.data;
                if (!data) {
                    return;
                }
                if (!showAllTasks) {
                    data = data.filter(task => task.staleness > 0);
                }
                // Sort by mean completion time, which is just the number of seconds
                data.sort((a, b) => (a.mean_completion_time - b.mean_completion_time));
                setTasks(data);
            });
    };

    const fetchUsers = () => {
        const list_users_url = apiUrl + "/accounts/";

        axios.get(list_users_url, {
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCSRFToken()
            }
        })
            .then((res) => {
                setUsers(res.data);
            })
            .catch((error) => {
                console.error("An error occurred while fetching data:", error);
            });
    };

    const handleCreateWorkLog = async (event) => {
        event.preventDefault();
        const csrftoken = getCSRFToken();

        // Get completion time from the lookup table
        const completionTime_minutes = parseInt(completionTimeLookup[completionTime]);
        // "[-]DD HH:MM:SS" and completion time is in minutes
        const completionTime_str = `0 ${Math.floor(completionTime_minutes / 60)}:${completionTime_minutes % 60}:00`;

        const calculate_brownie_points_url = apiUrl + "/calculate_brownie_points/";
        const payload = {
            task_id: selectedTaskId,
            completion_time: completionTime_str,
            grossness
        };
        console.log("Payload: ", payload);

        // Get the value of this tasks' brownie_points from the server
        let brownie_points = 0;
        try {
            const response = await axios.post(
                calculate_brownie_points_url,
                JSON.stringify(payload),
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': csrftoken
                    }
                }
            );

            brownie_points = response.data.brownie_points;

        } catch (error) {
            console.error('Error:', error);
            return;
        }

        // Convert brownie points from a string of a float to an integer
        brownie_points = Math.round(parseFloat(brownie_points));
        console.log("Brownie points: ", brownie_points);

        // pop each user off the list of completionUsers and create a worklog for each
        for (const completionUser of completionUsers) {
            const worklog = {
                task: selectedTaskId,
                user: completionUser,
                completion_time: completionTime_str,
                grossness,
                brownie_points
            };

            console.log("Creating worklog: ", worklog);

            // Make a POST request to create a new WorkLog entry
            try {
                const response = await axios.post(
                    apiUrl + '/worklogs/',
                    JSON.stringify(worklog),
                    {
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRFToken': csrftoken
                        },
                    });
                console.log('WorkLog created: ', response.data);
            } catch (error) {
                console.error('Error: ', error);
            }
        }

        // Clear the list of completionUsers and close the popup
        completionUsers.length = 0;

        closeCompleteTaskPopup();
        closeTaskPopup();
    };

    const handleCreateTask = (event) => {
        event.preventDefault();
        const createTaskUrl = apiUrl + '/tasks/';

        // Fetch CSRF token from cookies
        const csrftoken = document.cookie.split('; ').find(row => row.startsWith('csrftoken=')).split('=')[1];

        // Convert max_interval and min_interval to Django DurationField format "[-]DD HH:MM:SS"
        const max_interval = `${newTask.max_interval_days || 0} ${newTask.max_interval_hours || 0}:${newTask.max_interval_minutes || 0}:00`;
        const min_interval = `${newTask.min_interval_days || 0} ${newTask.min_interval_hours || 0}:${newTask.min_interval_minutes || 0}:00`;

        // Create a new object containing the formatted max_interval and min_interval
        const formattedNewTask = {
            ...newTask,
            max_interval,
            min_interval
        };

        console.log("formattedNewTask: ", formattedNewTask);

        axios.post(
            createTaskUrl,
            JSON.stringify(formattedNewTask),
            {
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrftoken
                },
            })
            .then(res => {
                console.log(res.data);
                fetchTasks();
                setShowTaskPopup(false);
            })
            .catch((error) => {
                console.error('Error:', error);
            });

        // Reset the newTask state
        setNewTask({
            task_name: '',
            task_id: randomString(),
            max_interval: '0:0',
            min_interval: '0:0',
            description: ''
        });

        // Fetch task list again
        fetchTasks();
    };

    const deleteTask = (taskId) => {
        const apiUrl = process.env.REACT_APP_BACKEND_URL;
        const deleteTaskUrl = `${apiUrl}/tasks/${taskId}/`;
        console.log("deleteTaskUrl: ", deleteTaskUrl);
        console.log("taskId: ", taskId);

        // Fetch CSRF token from cookies
        const csrftoken = document.cookie.split('; ').find(row => row.startsWith('csrftoken=')).split('=')[1];

        axios.delete(
            deleteTaskUrl,
            {
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

    // Popup functions //

    const handleOpenCompleteTaskPopup = (task) => {
        setSelectedTask(task);
        setSelectedTaskId(task.task_id);
        setShowCompleteTaskPopup(true);
    };

    const popupInnerRef = useRef(null);

    const handleCreateInputChange = (e) => {
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

    // Helper functions //


    const randomString = () => {
        return Math.random().toString(36).substring(2, 15);
    };


    // Misc functions //

    const toggleShowAllTasks = () => {
        setShowAllTasks(!showAllTasks);
    };

    const getCSRFToken = () => {
        const cookieValue = document.cookie.split('; ').find(row => row.startsWith('csrftoken='))?.split('=')[1];

        if (!cookieValue) {
            console.error("CSRF token not found.");
            throw new Error("CSRF token not found.");
        }

        return cookieValue;
    };

    // =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=- //





    return (
        <div className="Tasks">
            {showTaskPopup ? (
                <div className="popup" onClick={handleOverlayClick}>
                    <div className="popup-inner" ref={popupInnerRef}>
                        {selectedTask ? (
                            <div>
                                <h2>{selectedTask.task_name}</h2>
                                <p>Mean completion time: {selectedTask.mean_completion_time / 60} minutes</p>
                                <p>Max Interval: {selectedTask.max_interval}</p>
                                <p>Min Interval: {selectedTask.min_interval}</p>
                                <p>Last Completed: {selectedTask.last_completed}</p>
                                <p>Staleness: {selectedTask.staleness}</p>
                                <p>Description: {selectedTask.description}</p>
                                <button className="button complete-button" onClick={() => handleOpenCompleteTaskPopup(selectedTask)}>Complete Task</button>
                                <button className="button delete-button" onClick={() => deleteTask(selectedTask.task_id)}>Delete Task</button>
                            </div>
                        ) : (
                            <div>
                                <h2>Create a New Task</h2>
                                <form className="task-form">
                                    <div className="input-group">
                                        <input type="text" name="task_name" placeholder="Task Name" onChange={handleCreateInputChange} />
                                    </div>
                                    <div className="input-group input-group-horizontal">
                                        <label>Max Interval: </label>
                                        <input type="number" name="max_interval_days" placeholder="Days" onChange={handleCreateInputChange} />
                                        <input type="number" name="max_interval_hours" placeholder="Hours" onChange={handleCreateInputChange} />
                                        <input type="number" name="max_interval_minutes" placeholder="Minutes" onChange={handleCreateInputChange} />
                                    </div>
                                    <div className="input-group input-group-horizontal">
                                        <label>Min Interval: </label>
                                        <input type="number" name="min_interval_days" placeholder="Days" onChange={handleCreateInputChange} />
                                        <input type="number" name="min_interval_hours" placeholder="Hours" onChange={handleCreateInputChange} />
                                        <input type="number" name="min_interval_minutes" placeholder="Minutes" onChange={handleCreateInputChange} />
                                    </div>
                                    <div className="input-group">
                                        <input type="text" name="description" placeholder="Description" onChange={handleCreateInputChange} />
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
                    <div className="popup-inner" style={{ textAlign: "left" }} ref={popupInnerRef}>
                        <h2>Complete Task: {selectedTask && selectedTask.task_name}</h2>
                        <form onSubmit={handleCreateWorkLog}>
                            <div className="form-section">
                                <div className="form-section">
                                    <label>Select Users:</label>
                                    <div className="user-button-container">
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
                                </div>
                            </div>
                            <div className="form-section label-and-input">
                                <label htmlFor="completionTime">Completion Time:</label>
                                <input
                                    id="completionTime"
                                    type="range"
                                    min="0"
                                    max={completionTimeLookup.length - 1}
                                    step="1"
                                    value={completionTime}
                                    onChange={e => setCompletionTime(e.target.value)}
                                />
                                <span>{completionTimeLookup[completionTime]} minutes</span>
                            </div>

                            <div className="form-section label-and-input">
                                <label>Grossness:</label>
                                <div className="grossness-scale">
                                    {Array.from({ length: 5 }, (_, index) => index + 1).map(num => (
                                        <span
                                            key={num}
                                            className={`poop-emoji ${grossness >= num ? 'selected' : ''}`}
                                            onClick={() => setGrossness(grossness === num ? 0 : num)}
                                        >
                                            💩
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <button className="button form-section" type="submit">Submit</button>
                        </form>
                    </div>
                </div>
            ) : null}

            <div className="task-container">
                {tasks.map((task, index) => (
                    <div
                        className={`task-card ${task.staleness === 1 ? 'stale' : ''} ${task.staleness === 0 ? 'fresh' : ''}`}
                        key={task.task_id}
                        onClick={() => showTaskDetails(task)}
                        style={{
                            bottom: `calc(${(task.staleness) * 100}% - ${task.staleness * 120}px)`,
                            left: `${index * 210}px`
                        }}
                    >
                        <div className="task-content">
                            <span className="task-text">
                                {task.task_name}
                            </span>
                            <span className="task-button">
                                <button className="button complete-button" onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenCompleteTaskPopup(task);
                                }}>Complete Task</button>
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            <button
                className="button"
                style={{ position: 'absolute', bottom: '20px', left: '20px' }}
                onClick={() => { setShowTaskPopup(true); setSelectedTask(null); setSelectedTaskId(null); }}
            >
                Create Task
            </button>

            <Link to="/user_statistics" style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="user-stats-container">
                    <div className="user-stats-flex">
                        {
                            users.sort((a, b) => (b.brownie_point_credit - b.brownie_point_debit) - (a.brownie_point_credit - a.brownie_point_debit)).slice(0, 5).map((user, index) => {
                                return (
                                    <div key={index} className={`${userBPChanged[user.id] ? 'bounce-bp' : ''} user-row`}>
                                        <span className="user-name">{user.username}</span>
                                        <span className="user-points">{user.brownie_point_credit - user.brownie_point_debit} BP</span>
                                    </div>
                                );
                            })
                        }
                    </div>
                </div>
            </Link>


            <button
                className="button"
                style={{ position: 'absolute', bottom: '20px', right: '20px' }}
                onClick={() => { toggleShowAllTasks(); }}
            >
                {showAllTasks ? 'Hide All Tasks' : 'Show All Tasks'}
            </button>


        </div >
    );


};

export default Tasks;

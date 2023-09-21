import axios from 'axios';
import moment from 'moment';
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './App.css';
import { SimpleFlipper } from './flipper';


const Tasks = ({ apiUrl, selectedHousehold, setShowHouseholdSelector, getCSRFToken }) => {
    const [tasks, setTasks] = useState([]);
    const [users, setUsers] = useState([]);
    const [completionUsers, setCompletionUsers] = useState([]);

    const [selectedTask, setSelectedTask] = useState(null);
    const [selectedTaskId, setSelectedTaskId] = useState(null);

    const [showTaskPopup, setShowTaskPopup] = useState(false);
    const [showCompleteTaskPopup, setShowCompleteTaskPopup] = useState(false);
    const [inputError, setInputError] = useState(false);
    const [showSidebar, setShowSidebar] = useState(false);

    const [grossness, setGrossness] = useState(0);
    const [completionTime, setCompletionTime] = useState(0);
    const [newTask, setNewTask] = useState({
        task_name: '',
        task_id: '',
        max_interval: '0:0',
        min_interval: '0:0',
        description: ''
    });

    const [browniePoints, setBrowniePoints] = useState(0);
    const [showAnimation, setShowAnimation] = useState(false);

    const updateSelectedTaskTimer = useRef(null);

    const completionTimeLookup = [
        1, 2, 5, 10, 15, 20, 30, 45, 60, 90, 120
    ];

    // useEffects //


    useEffect(() => {
        setShowHouseholdSelector(true);
    }, []);


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


    // Fetch tasks, and users at regular intervals
    useEffect(() => {
        // run immediately, then start a timer that runs every 1000ms
        try {
            fetchTasks();
            fetchUsers();
        } catch (error) {
            console.error("An error occurred while fetching data:", error);
        }
        const interval = setInterval(() => {
            fetchTasks();
            fetchUsers();
        }, 1000);
        return () => clearInterval(interval);
    }
        , [showSidebar, selectedHousehold, apiUrl]);


    // Fetch selected task at regular intervals
    useEffect(() => {
        if (showTaskPopup && selectedTaskId) {
            const fetchSelectedTask = async () => {
                let list_tasks_url = apiUrl + '/tasks/' + selectedTaskId;
                list_tasks_url += `?household=${selectedHousehold}`;

                const response = await axios.get(
                    list_tasks_url,
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


    // If the selectedHousehold is null, hide the sidebar
    useEffect(() => {
        if (!selectedHousehold) {
            setShowSidebar(false);
        }
    }, [selectedHousehold]);


    // Show brownie points animation when browniePoints changes
    useEffect(() => {
        if (showAnimation) {
            // Hide popup after it has been shown for 3 seconds (1 second fade-in + 2 seconds persist)
            const timeout = setTimeout(() => {
                setShowAnimation(false);
            }, 3000);

            // Clean up timeout when the component is unmounted
            return () => clearTimeout(timeout);
        }
    }, [showAnimation]);


    // Backend API functions //


    const fetchTasks = () => {
        if (!selectedHousehold) {
            setTasks([]);
            return;
        }
        let list_tasks_url = apiUrl + "/tasks/";
        list_tasks_url += `?household=${selectedHousehold}`;

        axios.get(list_tasks_url, {
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCSRFToken()
            }
        })
            .then((res) => {
                if (res.status !== 200) {
                    console.log("Failed to fetch tasks.");
                    return;
                }
                // Filter tasks by non-zero staleness
                let data = res.data;
                if (!data) {
                    console.log("No data fetched for tasks");
                    return;
                }
                // Sort by mean completion time, which is just the number of seconds
                data.sort((a, b) => (a.mean_completion_time - b.mean_completion_time));
                setTasks(data);
            });
    };

    const fetchUsers = () => {
        if (!selectedHousehold) {
            console.log("No household selected");
            return;
        }
        let list_users_url = apiUrl + `/households/${selectedHousehold}/users/`;

        axios.get(list_users_url, {
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCSRFToken()
            }
        })
            .then((res) => {
                if (res.status !== 200) {
                    console.log("Failed to fetch users.");
                    return;
                }
                setUsers(res.data);
            })
            .catch((error) => {
                console.error("An error occurred while fetching data:", error);
            });
    };

    const handleCreateWorkLog = async (event) => {
        event.preventDefault();

        if (!selectedHousehold) {
            console.log("No household selected");
            return;
        }

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

        setBrowniePoints(brownie_points);
        setShowAnimation(true);

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
                if (response.status !== 201) {
                    console.log("Failed to create worklog.");
                    return;
                }
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
        const createTaskUrl = `${apiUrl}/tasks/`;

        const max_interval_in_minutes = (newTask.max_interval_days || 0) * 24 * 60 + (newTask.max_interval_hours || 0) * 60 + (newTask.max_interval_minutes || 0);
        const min_interval_in_minutes = (newTask.min_interval_days || 0) * 24 * 60 + (newTask.min_interval_hours || 0) * 60 + (newTask.min_interval_minutes || 0);

        if (max_interval_in_minutes < min_interval_in_minutes) {
            setInputError(true);
            console.log("Max interval should be greater than or equal to Min interval");
            console.log("Max interval: ", max_interval_in_minutes);
            console.log("Min interval: ", min_interval_in_minutes);
            return;
        }

        setInputError(false);

        // Fetch CSRF token from cookies
        const csrftoken = getCSRFToken();

        // Convert max_interval and min_interval to Django DurationField format "[-]DD HH:MM:SS"
        const max_interval = `${newTask.max_interval_days || 0} ${newTask.max_interval_hours || 0}:${newTask.max_interval_minutes || 0}:00`;
        const min_interval = `${newTask.min_interval_days || 0} ${newTask.min_interval_hours || 0}:${newTask.min_interval_minutes || 0}:00`;

        // Create a new object containing the formatted max_interval and min_interval
        const formattedNewTask = {
            ...newTask,
            household: selectedHousehold,
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
                if (res.status !== 201) {
                    console.log("Failed to create task.");
                    return;
                }
                console.log("Created task. Response:", res.data);
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
        const deleteTaskUrl = `${apiUrl}/tasks/${taskId}?household=${selectedHousehold}`;
        console.log("deleteTaskUrl: ", deleteTaskUrl);
        console.log("taskId: ", taskId);

        // Fetch CSRF token from cookies
        const csrftoken = getCSRFToken();

        axios.delete(
            deleteTaskUrl,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrftoken
                },
            })
            .then((res) => {
                if (res.status !== 204) {
                    console.log("Failed to delete task.");
                    return;
                }
                console.log("Deleted task with ID: ", taskId);
                closeTaskPopup();
            });
    };


    const freezeTask = (taskId) => {
        const apiUrl = process.env.REACT_APP_BACKEND_URL;
        const freezeTaskUrl = `${apiUrl}/tasks/${taskId}/toggle_frozen/`;
        console.log("freezeTaskUrl: ", freezeTaskUrl);
        console.log("taskId: ", taskId);

        // Fetch CSRF token from cookies
        const csrftoken = getCSRFToken();

        axios.post(
            freezeTaskUrl,
            {},
            {
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrftoken
                },
            })
            .then((res) => {
                if (res.status !== 200) {
                    console.log("Failed to freeze task.");
                    return;
                }
                console.log("Freezed task with ID: ", taskId);
                closeTaskPopup();
            });
    }


    // Popup functions //


    const handleOpenCompleteTaskPopup = (task) => {
        setSelectedTask(task);
        setSelectedTaskId(task.task_id);
        setShowTaskPopup(false);
        setShowCompleteTaskPopup(true);
    };

    const popupInnerRef = useRef(null);

    const handleCreateInputChange = (e) => {
        const { name, value } = e.target;

        setNewTask((prevTask) => {
            const updatedTask = { ...prevTask, [name]: value };

            const max_interval_in_minutes =
                (updatedTask.max_interval_days || 0) * 24 * 60 +
                (updatedTask.max_interval_hours || 0) * 60 +
                (updatedTask.max_interval_minutes || 0);

            const min_interval_in_minutes =
                (updatedTask.min_interval_days || 0) * 24 * 60 +
                (updatedTask.min_interval_hours || 0) * 60 +
                (updatedTask.min_interval_minutes || 0);

            if (max_interval_in_minutes < min_interval_in_minutes) {
                setInputError(true);
                console.log("Max interval should be greater than or equal to Min interval");
            } else {
                setInputError(false);
            }

            return updatedTask;
        });
    };


    const handleShowPopup = () => {
        // Show the popup
        setShowAnimation(true);
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

    const formatDuration = (duration) => {
        // The day number may or may not exist, so handle that
        let days = "0";
        let time = duration;

        // Check if duration contains day information
        if (duration.includes(" ")) {
            const parts = duration.split(" ");
            days = parts[0];
            time = parts[1];
        }

        // Extract hours, minutes, and seconds
        const [hours, minutes, seconds] = time.split(":").map(Number);

        // Construct human-readable string
        const daysStr = days === "1" ? "1 day" : `${days} days`;
        const hoursStr = hours === 1 ? "1 hour" : `${hours} hours`;
        const minutesStr = minutes === 1 ? "1 minute" : `${minutes} minutes`;

        return `${daysStr} ${hoursStr} ${minutesStr}`;
    };

    const formatTimestamp = (timestamp) => {
        return moment(timestamp).format("MMM Do YYYY, h:mm:ss a");
    };


    const getTimeSince = (timestamp) => {
        const now = moment();
        const then = moment(timestamp);
        const duration = moment.duration(now.diff(then));

        // If the duration is less than a minute, return "Just now"
        if (duration.asMinutes() < 1) {
            return "Just now";
        }

        const days = duration.days();
        const hours = duration.hours();
        const minutes = duration.minutes();

        let output = ''
        if (days !== 0) {
            output += days === "1" ? "1 day" : `${days} days`;
        }
        if (hours !== 0) {
            output += hours === 1 ? " 1 hour" : ` ${hours} hours`;
        }
        if (minutes !== 0) {
            output += minutes === 1 ? " 1 minute" : ` ${minutes} minutes`;
        }

        if (output === '') {
            return "Just now";
        }

        // If there's a trailing or leading space, remove it
        output = output.trim();

        output += " ago";

        return output;
    };


    // =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=- //





    return (
        <div className="Tasks">

            <div className={`empty-state ${selectedHousehold ? 'hide' : 'show'}`}>
                <div className={`arrow-up ${selectedHousehold ? '' : 'bounce'}`}></div>
                <div className="text">Select a household</div>
            </div>

            {showTaskPopup ? (
                <div className="popup" onClick={handleOverlayClick}>
                    <div className="popup-inner" ref={popupInnerRef}>
                        {selectedTask ? (
                            <div>
                                <h2 className="task-popup-header">{selectedTask.task_name}</h2>
                                <table className="task-popup-table">
                                    <tbody>
                                        <tr>
                                            <td className="task-popup-label">This takes on average:</td>
                                            <td className="task-popup-content">{(selectedTask.mean_completion_time / 60).toFixed(1)} minutes</td>
                                        </tr>
                                        <tr>
                                            <td className="task-popup-label">Do this at most every:</td>
                                            <td className="task-popup-content">{formatDuration(selectedTask.max_interval)}</td>
                                        </tr>
                                        <tr>
                                            <td className="task-popup-label">and at least every:</td>
                                            <td className="task-popup-content">{formatDuration(selectedTask.min_interval)}</td>
                                        </tr>
                                        <tr>
                                            <td className="task-popup-label">Last done:</td>
                                            <td className="task-popup-content">{getTimeSince(selectedTask.last_completed)}</td>
                                        </tr>
                                        <tr>
                                            <td className="task-popup-label">Staleness:</td>
                                            <td className="task-popup-content">{parseFloat(selectedTask.staleness).toFixed(2)}</td>
                                        </tr>
                                    </tbody>
                                </table>
                                <div className="task-popup-description">
                                    <p><strong>Description:</strong> {selectedTask.description}</p>
                                    {selectedTask.frozen ? (
                                        <p style={{ color: "black" }}><strong>Task is frozen, and won't ever appear on the queue</strong></p>
                                    ) : null}
                                </div>
                                <div className="task-popup-actions">
                                    <button className="button complete-button" onClick={() => handleOpenCompleteTaskPopup(selectedTask)}>Complete Task</button>
                                    <button className="button freeze-button" onClick={() => freezeTask(selectedTask.task_id)}>{selectedTask.frozen ? "Unfreeze Task" : "Freeze Task"}</button>
                                    <button className="button delete-button" onClick={() => deleteTask(selectedTask.task_id)}>Delete Task</button>
                                </div>
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
                                        <input className={inputError ? "input-error" : ""} type="number" name="max_interval_days" placeholder="Days" onChange={handleCreateInputChange} />
                                        <input className={inputError ? "input-error" : ""} type="number" name="max_interval_hours" placeholder="Hours" onChange={handleCreateInputChange} />
                                        <input className={inputError ? "input-error" : ""} type="number" name="max_interval_minutes" placeholder="Minutes" onChange={handleCreateInputChange} />
                                    </div>
                                    <div className="input-group input-group-horizontal">
                                        <label>Min Interval: </label>
                                        <input className={inputError ? "input-error" : ""} type="number" name="min_interval_days" placeholder="Days" onChange={handleCreateInputChange} />
                                        <input className={inputError ? "input-error" : ""} type="number" name="min_interval_hours" placeholder="Hours" onChange={handleCreateInputChange} />
                                        <input className={inputError ? "input-error" : ""} type="number" name="min_interval_minutes" placeholder="Minutes" onChange={handleCreateInputChange} />
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
                        <h2 style={{ color: "black" }} >Complete Task: {selectedTask && selectedTask.task_name}</h2>
                        <form onSubmit={handleCreateWorkLog}>
                            <div className="form-section">
                                <div className="form-section">
                                    <label>Select Users:</label>
                                    <div className="user-button-container">
                                        {users
                                            .sort((a, b) => a.username.localeCompare(b.username))
                                            .map(user => (
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


            <div className={`brownie-points-popup ${showAnimation ? 'show' : ''}`}>
                <div className={`brownie-points-animation ${showAnimation ? 'show' : ''}`}>
                    {`You earned ${browniePoints} brownie points!`}
                </div>
            </div>


            <div className="task-container ">
                {tasks
                    .filter(task => task.staleness !== 0)
                    .map((task, index) => (
                        <div className="task-wrapper" key={task.task_id}>
                            <div
                                className={`task-card ${task.staleness === 1 ? 'stale' : ''}`}
                                onClick={() => showTaskDetails(task)}
                                style={{
                                    bottom: `calc(${(task.staleness) * 100}% - ${task.staleness * 120}px)`
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
                        </div>
                    ))}
            </div>


            <div className={`task-sidebar ${showSidebar ? 'show' : 'hide'}`}>
                <h2 style={{ marginTop: ".5em" }}>Fresh Tasks</h2>
                {tasks
                    .filter(task => task.staleness === 0)
                    .sort((a, b) => {
                        // Sort by 'frozen' in ascending order
                        if (b.frozen !== a.frozen) {
                            return a.frozen - b.frozen;
                        }
                        // If 'frozen' is equal, sort by 'task_name' in ascending order
                        return a.task_name.localeCompare(b.task_name);
                    })
                    .map((task, index) => (
                        <div className="task-wrapper sidebar-wrapper" key={task.task_id}>
                            <div
                                className={`task-card fresh ${task.frozen ? 'frozen' : ''}`}
                                onClick={() => showTaskDetails(task)}
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
                        </div>
                    ))}
            </div>


            {selectedHousehold ? (
                <button
                    className="button"
                    style={{ position: 'absolute', bottom: '20px', left: '50px' }}
                    onClick={() => { setShowTaskPopup(true); setSelectedTask(null); setSelectedTaskId(null); }}
                >
                    Create Task
                </button>
            ) : null}

            {selectedHousehold ? (
                // <Link to="/user_statistics" style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="user-stats-container">
                    <div className="user-stats-flex">
                        {
                            users.sort((a, b) =>
                                (b.brownie_point_credit[selectedHousehold] - b.brownie_point_debit[selectedHousehold])
                                - (a.brownie_point_credit[selectedHousehold] - a.brownie_point_debit[selectedHousehold])
                            )
                                .slice(0, 5)
                                .map((user, index) => {
                                    return (
                                        <div key={index} className="user-row">
                                            <span className="user-name">{user.username}</span>
                                            <SimpleFlipper
                                                value={user.brownie_point_credit[selectedHousehold] - user.brownie_point_debit[selectedHousehold]}
                                            />
                                        </div>
                                    );
                                })
                        }
                    </div>
                </div>
                // </Link>
            ) : null}


            {selectedHousehold ? (
                <button
                    className="button"
                    style={{ position: 'absolute', bottom: '20px', right: '50px' }}
                    onClick={() => setShowSidebar(!showSidebar)}
                >
                    Toggle Sidebar
                </button>
            ) : null}


        </div >
    );


};

export default Tasks;

import React, { useState, useEffect, useRef } from 'react';
// import { Link } from 'react-router-dom';
import './App.css';
import { SimpleFlipper } from './flipper';
import { fetchTasks, fetchSelectedTask, createWorkLog, createTask, deleteTask, freezeTask } from './api/tasks';
import { fetchUsers } from './api/users';
import { formatDuration, getTimeSince } from './utils';
import useAuthCheck from './hooks/authCheck';


const Tasks = ({ selectedHousehold, setShowHouseholdSelector }) => {
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
        max_interval: '0:0',
        min_interval: '0:0',
        description: ''
    });

    const [browniePoints, setBrowniePoints] = useState(0);
    const [showFlipAnimation, setShowFlipAnimation] = useState(false);

    const updateSelectedTaskTimer = useRef(null);

    const popupInnerRef = useRef(null);

    // Redirect to the login page if not logged in
    useAuthCheck();

    // useEffects //

    useEffect(() => {
        setShowHouseholdSelector(true);
    }, []);

    // Fetch tasks, and users at regular intervals
    useEffect(() => {
        // run immediately, then start a timer that runs every 1000ms
        try {
            fetchSetTasks();
            fetchSetUsers();
        } catch (error) {
            console.error("An error occurred while fetching data:", error);
        }
        const interval = setInterval(() => {
            fetchSetTasks();
            fetchSetUsers();
        }, 1000);
        return () => clearInterval(interval);
    }
        , [showSidebar, selectedHousehold]);


    // Fetch selected task at regular intervals
    useEffect(() => {
        if (showTaskPopup && selectedTaskId) {
            const fetchSetSelectedTask = async () => {
                const data = await fetchSelectedTask(selectedTaskId, selectedHousehold);
                setSelectedTask(data);
            };

            // Clear previous timer if it exists
            if (updateSelectedTaskTimer.current) {
                clearInterval(updateSelectedTaskTimer.current);
            }

            fetchSetSelectedTask();
            // Store the new timer in the ref
            updateSelectedTaskTimer.current = setInterval(fetchSetSelectedTask, 1000);
        }

        return () => {
            if (updateSelectedTaskTimer.current) {
                clearInterval(updateSelectedTaskTimer.current);
            }
        };
    }, [showTaskPopup, selectedTaskId]);


    // If the selectedHousehold is null, hide the sidebar
    useEffect(() => {
        if (!selectedHousehold) {
            setShowSidebar(false);
        }
    }, [selectedHousehold]);


    // Show brownie points animation when browniePoints changes
    useEffect(() => {
        if (showFlipAnimation) {
            // Hide popup after it has been shown for 3 seconds (1 second fade-in + 2 seconds persist)
            const timeout = setTimeout(() => {
                setShowFlipAnimation(false);
            }, 3000);

            // Clean up timeout when the component is unmounted
            return () => clearTimeout(timeout);
        }
    }, [showFlipAnimation]);


    // Backend API functions //


    const fetchSetTasks = async () => {
        if (!selectedHousehold) {
            setTasks([]);
            return;
        }

        console.log("Fetching Tasks...");
        setTasks(await fetchTasks(selectedHousehold));
    };


    // TODO: Fetch users in the App component, and pass them down as props
    const fetchSetUsers = async () => {
        const data = await fetchUsers(selectedHousehold);
        if (data === null) {
            setUsers([]);
            return;
        }
        console.log("Setting users: ", users);
        setUsers(data);
    };


    const completionTimeLookup = [
        0, 1, 2, 5, 10, 15, 20, 30, 45, 60, 90, 120
    ];

    const handleCreateWorkLog = async (event) => {
        event.preventDefault();

        // Get completion time from the lookup table
        const completionTime_minutes = parseInt(completionTimeLookup[completionTime]);
        // "[-]DD HH:MM:SS" and completion time is in minutes
        const completionTime_str = `0 ${Math.floor(completionTime_minutes / 60)}:${completionTime_minutes % 60}:00`;

        // Create the work log. 
        const browniePoints = await createWorkLog(
            selectedHousehold,
            selectedTaskId,
            completionTime_str,
            completionUsers,
            grossness,
        );

        // If the creation succeeded, the brownie points will not be null
        if (browniePoints === null) {
            console.log("Failed to create worklog");
            return;
        }

        setBrowniePoints(browniePoints);
        setShowFlipAnimation(true);

        closeCompleteTaskPopup();
        closeTaskPopup();
    };


    const handleCreateTask = async (event) => {
        event.preventDefault();

        // Convert max_interval and min_interval to minutes
        const max_interval_in_minutes =
            (newTask.max_interval_days || 0) * 24 * 60 +
            (newTask.max_interval_hours || 0) * 60 +
            (newTask.max_interval_minutes || 0);

        const min_interval_in_minutes =
            (newTask.min_interval_days || 0) * 24 * 60 +
            (newTask.min_interval_hours || 0) * 60 +
            (newTask.min_interval_minutes || 0);

        // Check for invalid inputs
        if (newTask.task_name === "") {
            setInputError(true);
            console.log("Task name may not be blank");
            return;
        }

        // integers only
        if (max_interval_in_minutes % 1 !== 0 || min_interval_in_minutes % 1 !== 0) {
            setInputError(true);
            console.log("Max and Min intervals must be integers");
            return;
        }

        if (max_interval_in_minutes < 0 || min_interval_in_minutes < 0) {
            setInputError(true);
            console.log("Max and Min intervals must be positive");
            return;
        }

        if (max_interval_in_minutes < min_interval_in_minutes) {
            setInputError(true);
            console.log("Max interval should be greater than or equal to Min interval");
            console.log("Max interval: ", max_interval_in_minutes);
            console.log("Min interval: ", min_interval_in_minutes);
            return;
        }

        setInputError(false);

        // Convert max_interval and min_interval to Django DurationField format "[-]DD HH:MM:SS"
        const max_interval = `${newTask.max_interval_days || 0} ${newTask.max_interval_hours || 0}:${newTask.max_interval_minutes || 0}:00`;
        const min_interval = `${newTask.min_interval_days || 0} ${newTask.min_interval_hours || 0}:${newTask.min_interval_minutes || 0}:00`;

        const response_data = await createTask(
            newTask.task_name,
            selectedHousehold,
            max_interval,
            min_interval,
            newTask.description,
        );

        console.log("Created task. Response:", response_data);
        await fetchSetTasks();
        setShowTaskPopup(false);

        // Reset the newTask state
        console.log("Resetting task")
        setNewTask({
            task_name: '',
            max_interval: '0:0',
            min_interval: '0:0',
            description: ''
        });
    };


    const handleDeleteTask = async (taskId) => {
        const succeeded = await deleteTask(taskId, selectedHousehold);
        if (succeeded) {
            closeTaskPopup();
        } else {
            console.log("Failed to delete task", succeeded);
        }
    };


    const handleFreezeTask = async (taskId) => {
        const succeeded = await freezeTask(taskId);
        if (succeeded) {
            closeTaskPopup();
        } else {
            console.log("Failed to freeze task", succeeded);
        }
    }


    // Popup functions //


    const handleOpenCompleteTaskPopup = (task) => {
        setSelectedTask(task);
        setSelectedTaskId(task.id);
        setShowTaskPopup(false);
        setShowCompleteTaskPopup(true);
    };


    const handleCreateInputChange = (e) => {
        const { name, value } = e.target;

        console.log("Setting new task in handleCreateInputChange");
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


    const showTaskDetails = (task) => {
        console.log("Setting selected task: ", task);
        setSelectedTask(task);
        setSelectedTaskId(task.id);
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
        fetchSetTasks();
    };

    const closeCompleteTaskPopup = () => {
        setShowCompleteTaskPopup(false);
        setCompletionUsers([]);
        setCompletionTime(0);
        setGrossness(0);
    };


    // =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=- //





    return (
        <div className="Tasks">

            <div className={`empty-state ${selectedHousehold ? 'hide' : 'show'}`}>
                <div className={`arrow-up ${selectedHousehold ? '' : 'bounce'}`}></div>
                <div className="text">Select a household</div>
            </div>

            {/* // TODO: Separate these two popups */}
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
                                    {selectedTask.description == "" ? "" :
                                        <p><strong>Description:</strong> {selectedTask.description}</p>
                                    }
                                    {selectedTask.frozen ? (
                                        <p style={{ color: "black" }}><strong>Task is frozen, and won't ever appear on the queue</strong></p>
                                    ) : null}
                                </div>
                                <div className="task-popup-actions">
                                    <button className="button complete-button" onClick={() => handleOpenCompleteTaskPopup(selectedTask)}>Complete Task</button>
                                    <button className="button freeze-button" onClick={() => handleFreezeTask(selectedTask.id)}>{selectedTask.frozen ? "Unfreeze Task" : "Freeze Task"}</button>
                                    <button className="button delete-button" onClick={() => handleDeleteTask(selectedTask.id)}>Delete Task</button>
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
                                        <input
                                            className={inputError ? "input-error" : ""}
                                            type="number"
                                            min="0"
                                            name="max_interval_days"
                                            placeholder="Days"
                                            onChange={handleCreateInputChange}
                                        />
                                        <input
                                            className={inputError ? "input-error" : ""}
                                            type="number"
                                            min="0"
                                            name="max_interval_hours"
                                            placeholder="Hours"
                                            onChange={handleCreateInputChange}
                                        />
                                        <input
                                            className={inputError ? "input-error" : ""}
                                            type="number"
                                            min="0"
                                            name="max_interval_minutes"
                                            placeholder="Minutes"
                                            onChange={handleCreateInputChange}
                                        />
                                    </div>
                                    <div className="input-group input-group-horizontal">
                                        <label>Min Interval: </label>
                                        <input
                                            className={inputError ? "input-error" : ""}
                                            type="number"
                                            min="0"
                                            name="min_interval_days"
                                            placeholder="Days"
                                            onChange={handleCreateInputChange}
                                        />
                                        <input
                                            className={inputError ? "input-error" : ""}
                                            type="number"
                                            min="0"
                                            name="min_interval_hours"
                                            placeholder="Hours"
                                            onChange={handleCreateInputChange}
                                        />
                                        <input
                                            className={inputError ? "input-error" : ""}
                                            type="number"
                                            min="0"
                                            name="min_interval_minutes"
                                            placeholder="Minutes"
                                            onChange={handleCreateInputChange}
                                        />
                                    </div>
                                    <div className="input-group">
                                        <input
                                            type="text"
                                            name="description"
                                            placeholder="Description"
                                            onChange={handleCreateInputChange}
                                        />
                                        <button
                                            className={`button create-button ${inputError ? "disabled" : "enabled"}`}
                                            onClick={handleCreateTask}
                                        >
                                            Create Task
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}
                    </div>
                </div >
            ) : null}


            {showCompleteTaskPopup ? (
                <div className="popup" onClick={handleOverlayClick}>
                    <div className="popup-inner" style={{ textAlign: "center" }} ref={popupInnerRef}>
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
                                                    // If no users are selected, add a red shadow to indicate that someone needs to be selected.
                                                    // If this user is selected, make their name button green
                                                    className={`button user-button ${completionUsers.length === 0 ? "input-error" : ""} ${completionUsers.includes(user.id) ? 'selected' : ''}`}
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
                            <div className={`form-section time-slider label-and-input ${completionTime == 0 ? "input-error" : ""}`}>
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
                                <span>{completionTimeLookup[completionTime]} minute{completionTimeLookup[completionTime] == 1 ? "" : "s"}</span>
                            </div>

                            <div className="form-section label-and-input" style={{ display: "block" }}>
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
                            <button
                                className={`button form-section ${completionUsers.length > 0 ? "enabled" : "disabled"}`}
                                type="submit"
                                disabled={completionUsers.length === 0}
                            >
                                Submit
                            </button>
                        </form>
                    </div>
                </div>
            ) : null}


            <div className={`brownie-points-popup ${showFlipAnimation ? 'show' : ''}`}>
                <div className={`brownie-points-animation ${showFlipAnimation ? 'show' : ''}`}>
                    {`You earned ${browniePoints} brownie points!`}
                </div>
            </div>


            <div className="task-container ">
                {tasks
                    .filter(task => task.staleness !== 0)
                    .map((task, index) => (
                        <div className="task-wrapper" key={task.id}>
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
                            return b.frozen - a.frozen;
                        }
                        // If 'frozen' is equal, sort by 'task_name' in ascending order
                        return a.task_name.localeCompare(b.task_name);
                    })
                    .map((task, index) => (
                        <div className="task-wrapper sidebar-wrapper" key={task.id}>
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

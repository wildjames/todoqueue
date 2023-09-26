import React, { useState, useEffect, useRef } from 'react';
// import { Link } from 'react-router-dom';
import '../App.css';
import { SimpleFlipper } from './flipper';
import ShowTaskPopup from './ShowTaskPopup';
import CompleteTaskPopup from './CompleteTaskPopup';
import CreateTaskPopup from './CreateTaskPopup';
import useAuthCheck from '../hooks/authCheck';

import { fetchTasks } from '../api/tasks';
import { fetchUsers } from '../api/users';


const Tasks = ({ selectedHousehold, setShowHouseholdSelector }) => {
    const [tasks, setTasks] = useState([]);
    const [users, setUsers] = useState([]);

    const [selectedTask, setSelectedTask] = useState(null);
    const [selectedTaskId, setSelectedTaskId] = useState(null);

    const [showTaskPopup, setShowTaskPopup] = useState(false);
    const [showCompleteTaskPopup, setShowCompleteTaskPopup] = useState(false);
    const [showCreateTaskPopup, setShowCreateTaskPopup] = useState(false);
    const [showSidebar, setShowSidebar] = useState(false);

    const [browniePoints, setBrowniePoints] = useState(0);
    const [showFlipAnimation, setShowFlipAnimation] = useState(false);

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


    // If the selectedHousehold is null, hide the sidebar
    useEffect(() => {
        if (!selectedHousehold) {
            setShowSidebar(false);
        }
    }, [selectedHousehold]);


    useEffect(() => {
        console.log("Brownie points changed");
        const timeout = setTimeout(() => {
            setShowFlipAnimation(true);
        }, 500);

        // Clean up timeout when the component is unmounted
        return () => clearTimeout(timeout);
    }, [browniePoints]);


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



    // Popup functions (TODO: Clean up the logic and names here) //


    const handleOpenCompleteTaskPopup = (task) => {
        setSelectedTask(task);
        setSelectedTaskId(task.id);
        setShowTaskPopup(false);
        setShowCompleteTaskPopup(true);
    };



    const showTaskDetails = (task) => {
        setSelectedTask(task);
        setSelectedTaskId(task.id);
        setShowTaskPopup(true);
    };


    const handleOpenCreateTaskPopup = () => {
        setShowTaskPopup(false);
        setSelectedTask(null);
        setSelectedTaskId(null);
        setShowCreateTaskPopup(true);
    };


    const handleOverlayClick = (e) => {
        console.log("Detected click!", popupInnerRef);
        if (popupInnerRef.current && !popupInnerRef.current.contains(e.target)) {
            console.log("Clicked outside of popup");
            closeCompleteTaskPopup();
            closeTaskPopup();
            closeCreateTaskPopup();
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
    };

    const closeCreateTaskPopup = () => {
        setShowCreateTaskPopup(false);
    };


    // =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=- //


    const propsForTaskDetails = {
        handleOpenCompleteTaskPopup: handleOpenCompleteTaskPopup,
        closeTaskPopup: closeTaskPopup,
        handleOverlayClick: handleOverlayClick,
        setSelectedTask: setSelectedTask,
        selectedHousehold: selectedHousehold,
        selectedTask: selectedTask,
        selectedTaskId: selectedTaskId,
    };


    const propsForCompleteTask = {
        handleOverlayClick: handleOverlayClick,
        selectedHousehold: selectedHousehold,
        selectedTask: selectedTask,
        users: users,
        setBrowniePoints: setBrowniePoints,
        closeCompleteTaskPopup: closeCompleteTaskPopup,
    };


    const propsForCreateTask = {
        setShowCreateTaskPopup: setShowCreateTaskPopup,
        handleOverlayClick: handleOverlayClick,
        selectedHousehold: selectedHousehold,
        fetchSetTasks: fetchSetTasks,
    };


    return (
        <div className="Tasks">

            <div className={`empty-state ${selectedHousehold ? 'hide' : 'show'}`}>
                <div className={`arrow-up ${selectedHousehold ? '' : 'bounce'}`}></div>
                <div className="text">Select a household</div>
            </div>

            {
                showTaskPopup && selectedTask ? (
                    <ShowTaskPopup ref={popupInnerRef} {...propsForTaskDetails} />
                ) : null
            }

            {
                showCompleteTaskPopup ? (
                    <CompleteTaskPopup ref={popupInnerRef} {...propsForCompleteTask} />
                ) : null
            }

            {
                showCreateTaskPopup ? (
                    <CreateTaskPopup ref={popupInnerRef} {...propsForCreateTask} />
                ) : null
            }


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
                    onClick={() => { handleOpenCreateTaskPopup(); }}
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

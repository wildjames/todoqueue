import React, { useState, useEffect, useRef } from 'react';
// import { Link } from 'react-router-dom';
import '../App.css';
import useAuthCheck from '../hooks/authCheck';

import { SimpleFlipper } from './flipper/flipper';

import TaskDetailsPopup from './popups/TaskDetailsPopup';
import CompleteTaskPopup from './popups/CompleteTaskPopup';
import AwardBrowniePointsPopup from './popups/AwardBrowniePoints';
import CreateFlexibleTaskPopup from './popups/CreateFlexibleTaskPopup';
import EditFlexibleTaskPopup from './popups/EditFlexibleTaskPopup';
import CreateScheduledTaskPopup from './popups/CreateScheduledTaskPopup';
import EditScheduledTaskPopup from './popups/EditScheduledTaskPopup';

import { fetchTasks } from '../api/tasks';
import { fetchUsers } from '../api/users';


const Tasks = ({ selectedHousehold, setShowHouseholdSelector }) => {
    const [tasks, setTasks] = useState([]);
    const [users, setUsers] = useState([]);

    const [selectedTask, setSelectedTask] = useState(null);
    const [selectedTaskId, setSelectedTaskId] = useState(null);

    const [showSidebar, setShowSidebar] = useState(false);

    const isInitialRender = useRef(true);
    const [browniePoints, setBrowniePoints] = useState(0);
    const [showFlipAnimation, setShowFlipAnimation] = useState(false);

    // Define an enumeration for the popups
    const PopupType = {
        NONE: 'NONE',
        TASK_DETAILS: 'TASK_DETAILS',
        COMPLETE_TASK: 'COMPLETE_TASK',
        AWARD_BP: 'AWARD_BP',
        CREATE_SCHEDULED_TASK: 'CREATE_SCHEDULED_TASK',
        CREATE_FLEXIBLE_TASK: 'CREATE_FLEXIBLE_TASK',
        EDIT_FLEXIBLE_TASK: 'EDIT_FLEXIBLE_TASK',
        EDIT_SCHEDULED_TASK: 'EDIT_SCHEDULED_TASK',
    };

    // State variable for the current popup
    const [currentPopup, setCurrentPopup] = useState(PopupType.NONE);
    // This reference is used to detect when a user clicks off a popup
    const popupInnerRef = useRef(null);

    // Redirect to the login page if not logged in
    useAuthCheck();


    // useEffects //


    // Show the household selector on first render
    useEffect(() => {
        setShowHouseholdSelector(true);
    }, []);


    // Fetch tasks, and users at regular intervals
    // TODO: Is it wise to make these requests so often? Can it be offloaded to the client?
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
    }, [showSidebar, selectedHousehold]);


    // If the selectedHousehold is null, hide the sidebar
    useEffect(() => {
        if (!selectedHousehold) {
            setShowSidebar(false);
        }
    }, [selectedHousehold]);


    useEffect(() => {
        // Prevent BP popup from showing on initial render
        if (isInitialRender.current) {
            isInitialRender.current = false;
            return;
        }

        console.log("Brownie points changed");
        setShowFlipAnimation(true);
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


    // Data getters //


    const fetchSetTasks = async () => {
        if (!selectedHousehold) {
            setTasks([]);
            return;
        }

        console.log("Fetching Tasks...");
        setTasks(await fetchTasks(selectedHousehold));
    };


    const fetchSetUsers = async () => {
        const data = await fetchUsers(selectedHousehold);
        if (data === null) {
            setUsers([]);
            return;
        }
        console.log("Setting users: ", users);
        setUsers(data);
    };



    // Popup functions //


    const handleOpenCompleteTaskPopup = (task) => {
        setSelectedTask(task);
        setSelectedTaskId(task.id);
        setCurrentPopup(PopupType.COMPLETE_TASK);
    };

    const handleOpenAwardBrowniePointsPopup = () => {
        setCurrentPopup(PopupType.AWARD_BP);
    };

    const handleOpenTaskDetails = (task) => {
        setSelectedTask(task);
        setSelectedTaskId(task.id);
        setCurrentPopup(PopupType.TASK_DETAILS);
    };

    const handleOpenCreateFlexibleTaskPopup = () => {
        setSelectedTask(null);
        setSelectedTaskId(null);
        setCurrentPopup(PopupType.CREATE_FLEXIBLE_TASK);
    };

    const handleOverlayClick = (e) => {
        if (popupInnerRef.current && !popupInnerRef.current.contains(e.target)) {
            closeCurrentPopup();
        }
    };

    // Close the current popup, whatever it may be
    const closeCurrentPopup = () => {
        setCurrentPopup(PopupType.NONE);

        // Reset selected task and ID
        setSelectedTask(null);
        setSelectedTaskId(null);
    };


    // =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=- //


    const propsForTaskDetails = {
        closeCurrentPopup: closeCurrentPopup,
        handleOverlayClick: handleOverlayClick,
        handleOpenCompleteTaskPopup: handleOpenCompleteTaskPopup,
        setSelectedTask: setSelectedTask,
        setCurrentPopup: setCurrentPopup,
        PopupType: PopupType,
        selectedHousehold: selectedHousehold,
        selectedTask: selectedTask,
        selectedTaskId: selectedTaskId,
    };


    const propsForCompleteTask = {
        closeCurrentPopup: closeCurrentPopup,
        handleOverlayClick: handleOverlayClick,
        setBrowniePoints: setBrowniePoints,
        selectedHousehold: selectedHousehold,
        selectedTask: selectedTask,
        users: users,
    };


    const propsForAwardBrowniePoints = {
        closeCurrentPopup,
        handleOverlayClick,
        setBrowniePoints,
        selectedHousehold,
        users,
    };


    const propsForCreateFlexibleTask = {
        closeCurrentPopup: closeCurrentPopup,
        handleOverlayClick: handleOverlayClick,
        fetchSetTasks: fetchSetTasks,
        selectedHousehold: selectedHousehold,
        PopupType: PopupType,
        setCurrentPopup: setCurrentPopup,
        currentPopup: currentPopup,
    };


    const propsForEditTask = {
        handleOverlayClick: handleOverlayClick,
        setCurrentPopup: setCurrentPopup,
        PopupType: PopupType,
        closeCurrentPopup: closeCurrentPopup,
        fetchSetTasks: fetchSetTasks,
        selectedHousehold: selectedHousehold,
        selectedTaskId: selectedTaskId,
    };


    const propsForCreateScheduledTask = {
        closeCurrentPopup: closeCurrentPopup,
        handleOverlayClick: handleOverlayClick,
        fetchSetTasks: fetchSetTasks,
        selectedHousehold: selectedHousehold,
        PopupType: PopupType,
        setCurrentPopup: setCurrentPopup,
        currentPopup: currentPopup,
    };


    return (
        <div className="Tasks">

            <div className={`empty-state ${selectedHousehold ? 'hide' : 'show'}`}>
                <div className="arrow-up bounce"></div>
                <div className="text">Select a household</div>
            </div>


            {
                // Popups
                (() => {
                    switch (currentPopup) {
                        case PopupType.TASK_DETAILS:
                            return <TaskDetailsPopup ref={popupInnerRef} {...propsForTaskDetails} />;

                        case PopupType.COMPLETE_TASK:
                            return <CompleteTaskPopup ref={popupInnerRef} {...propsForCompleteTask} />;

                        case PopupType.CREATE_FLEXIBLE_TASK:
                            return <CreateFlexibleTaskPopup ref={popupInnerRef} {...propsForCreateFlexibleTask} />;

                        case PopupType.AWARD_BP:
                            return <AwardBrowniePointsPopup ref={popupInnerRef} {...propsForAwardBrowniePoints} />;

                        case PopupType.CREATE_SCHEDULED_TASK:
                            return <CreateScheduledTaskPopup ref={popupInnerRef} {...propsForCreateScheduledTask} />;

                        case PopupType.EDIT_FLEXIBLE_TASK:
                            return <EditFlexibleTaskPopup ref={popupInnerRef} {...propsForEditTask} />;

                        case PopupType.EDIT_SCHEDULED_TASK:
                            return <EditScheduledTaskPopup ref={popupInnerRef} {...propsForEditTask} />;

                        default:
                            return null;
                    }
                })()
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
                                onClick={() => handleOpenTaskDetails(task)}
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
                                onClick={() => handleOpenTaskDetails(task)}
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
                    onClick={() => { handleOpenCreateFlexibleTaskPopup(); }}
                >
                    Create Task
                </button>
            ) : null}


            {selectedHousehold ? (
                <div
                    className="user-stats-container"
                    onClick={handleOpenAwardBrowniePointsPopup}
                >
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

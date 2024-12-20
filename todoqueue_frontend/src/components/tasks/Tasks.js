import { React, useState, useEffect, useRef } from 'react';
import useAuthCheck from '../../hooks/authCheck';

import './Tasks.css';

import UserStatsBox from '../user_stats_box/UserStatsBox';
import { HouseholdSelector } from '../navbar/HouseholdSelector';

import TaskDetailsPopup from '../popups/TaskDetailsPopup';
import CompleteTaskPopup from '../popups/CompleteTaskPopup';
import AwardBrowniePointsPopup from '../popups/AwardBrowniePoints';
import CreateFlexibleTaskPopup from '../popups/CreateFlexibleTaskPopup';
import EditFlexibleTaskPopup from '../popups/EditFlexibleTaskPopup';
import CreateScheduledTaskPopup from '../popups/CreateScheduledTaskPopup';
import EditScheduledTaskPopup from '../popups/EditScheduledTaskPopup';
import CreateOneShotTaskPopup from '../popups/CreateOneShotTaskPopup';
// import EditOneShotTaskPopup from '../popups/EditOneShotTask';

import { fetchTasks } from '../../api/tasks';
import { fetchHouseholdUsers } from '../../api/users';


const Tasks = ({ households, selectedHousehold, setSelectedHousehold, showSelectedHouseholdSelector, setShowHouseholdSelector }) => {
    const [tasks, setTasks] = useState([]);
    const [users, setUsers] = useState([]);

    const [noTasks, setNoTasks] = useState(true);
    const [noStaleTasks, setNoStaleTasks] = useState(true);

    const [selectedTask, setSelectedTask] = useState(null);
    const [selectedTaskId, setSelectedTaskId] = useState(null);

    const [showSidebar, setShowSidebar] = useState(false);

    const isInitialRender = useRef(true);
    const [browniePoints, setBrowniePoints] = useState(0);
    const [showFlipAnimation, setShowFlipAnimation] = useState(false);
    const [viewMode, setViewMode] = useState('total');  // Toggle scoreboard between 'total' or 'rolling'
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);

    // Define an enumeration for the popups
    const PopupType = {
        NONE: 'NONE',
        TASK_DETAILS: 'TASK_DETAILS',
        COMPLETE_TASK: 'COMPLETE_TASK',
        AWARD_BP: 'AWARD_BP',
        CREATE_SCHEDULED_TASK: 'CREATE_SCHEDULED_TASK',
        CREATE_FLEXIBLE_TASK: 'CREATE_FLEXIBLE_TASK',
        CREATE_ONESHOT_TASK: 'CREATE_ONESHOT_TASK',
        EDIT_FLEXIBLE_TASK: 'EDIT_FLEXIBLE_TASK',
        EDIT_SCHEDULED_TASK: 'EDIT_SCHEDULED_TASK',
        // EDIT_ONESHOT_TASK: 'EDIT_ONESHOT_TASK',
    };

    // State variable for the current popup
    const [currentPopup, setCurrentPopup] = useState(PopupType.NONE);
    // This reference is used to detect when a user clicks off a popup
    const popupInnerRef = useRef(null);

    // Redirect to the login page if not logged in
    useAuthCheck();


    // useEffects //


    // Track the number of tasks
    useEffect(() => {
        if (tasks.length === 0) {
            setNoTasks(true);
        } else {
            setNoTasks(false);
        }
    }, [tasks]);


    // Track the number of stale tasks (tasks with non-zero staleness)
    useEffect(() => {
        if (tasks.filter(task => task.staleness !== 0).length === 0) {
            setNoStaleTasks(true);
        } else {
            setNoStaleTasks(false);
        }
    }, [tasks]);


    // Show the household selector on first render
    useEffect(() => {
        setShowHouseholdSelector(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showSelectedHouseholdSelector]);


    // Fetch tasks, and users at regular intervals
    // TODO: Is it wise to make these requests so often? Can it be offloaded to the client?
    useEffect(() => {
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
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

        if (browniePoints === 0) {
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


    // Add and remove the event listener when the component mounts and unmounts
    useEffect(() => {
        const handleResize = () => {
            setWindowWidth(window.innerWidth);
        };
        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);


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
        const data = await fetchHouseholdUsers(selectedHousehold);
        if (data === null) {
            setUsers([]);
            return;
        }
        console.log("Setting users: ", data);
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


    const propsForCreateTask = {
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


    return (
        <div className="Tasks">

            {windowWidth > 992
                ?
                <div className={`empty-state ${selectedHousehold ? 'hide' : 'show'}`}>
                    <div className="arrow-up bounce"></div>
                    <div className="task-select-text">Select a household</div>
                </div>
                :
                <div className={`empty-state ${selectedHousehold ? 'hide' : 'show'}`}>
                    <HouseholdSelector
                        households={households}
                        selectedHousehold={selectedHousehold}
                        setSelectedHousehold={setSelectedHousehold}
                    />
                </div>
            }


            {
                // Popups
                (() => {
                    switch (currentPopup) {
                        case PopupType.TASK_DETAILS:
                            return <TaskDetailsPopup ref={popupInnerRef} {...propsForTaskDetails} />;

                        case PopupType.COMPLETE_TASK:
                            return <CompleteTaskPopup ref={popupInnerRef} {...propsForCompleteTask} />;

                        case PopupType.AWARD_BP:
                            return <AwardBrowniePointsPopup ref={popupInnerRef} {...propsForAwardBrowniePoints} />;

                        case PopupType.CREATE_FLEXIBLE_TASK:
                            return <CreateFlexibleTaskPopup ref={popupInnerRef} {...propsForCreateTask} />;

                        case PopupType.CREATE_SCHEDULED_TASK:
                            return <CreateScheduledTaskPopup ref={popupInnerRef} {...propsForCreateTask} />;

                        case PopupType.CREATE_ONESHOT_TASK:
                            return <CreateOneShotTaskPopup ref={popupInnerRef} {...propsForCreateTask} />;

                        case PopupType.EDIT_FLEXIBLE_TASK:
                            return <EditFlexibleTaskPopup ref={popupInnerRef} {...propsForEditTask} />;

                        case PopupType.EDIT_SCHEDULED_TASK:
                            return <EditScheduledTaskPopup ref={popupInnerRef} {...propsForEditTask} />;

                        // case PopupType.EDIT_ONESHOT_TASK:
                        //     return <EditOneShotTaskPopup ref={popupInnerRef} {...propsForEditTask} />;

                        default:
                            return null;
                    }
                })()
            }

            <div className={`brownie-points-popup ${showFlipAnimation ? 'show' : ''}`}>
                <div className={`brownie-points-animation ${showFlipAnimation ? 'show' : ''}`}>
                    {`You earned ${browniePoints} BP!`}
                </div>
            </div>

            <div className="task-container ">
                {tasks
                    .filter(task => task.staleness !== 0)
                    .sort((a, b) => {
                        if (a.staleness === b.staleness) {
                            // If staleness is the same, sort by averageTimeToComplete
                            return a.averageTimeToComplete - b.averageTimeToComplete;
                        } else if (a.staleness === 1) {
                            // a is stale (staleness === 1), so it comes before b
                            return -1;
                        } else if (b.staleness === 1) {
                            // b is stale, so a comes after b
                            return 1;
                        } else {
                            // Both have staleness between 0 and 1, sort by averageTimeToComplete
                            return a.averageTimeToComplete - b.averageTimeToComplete;
                        }
                    })
                    .map((task) => (
                        <div className="task-wrapper" key={task.id}>
                            <div
                                className={`task-card ${task.staleness === 1 ? 'stale' : ''}`}
                                onClick={() => handleOpenTaskDetails(task)}
                                style={
                                    windowWidth < 800
                                        ? { left: `calc(${task.staleness} * (100% - 200px))` }
                                        : {
                                            bottom: `calc(${(task.staleness) * 100}%)`,
                                            transform: `translateY(calc(${task.staleness * 100}% + ${task.staleness * 30}px))`
                                        }
                                }
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
                    ))
                }


                <div className={`empty-state ${noTasks && selectedHousehold ? "show" : "hide"}`} >
                    <h3>You have no tasks!</h3>
                    <h3>Try creating some using the button at the bottom of the screen.</h3>
                </div>

                <div className={`empty-state ${!noTasks && noStaleTasks && selectedHousehold ? "show" : "hide"}`}>
                    <h3>You&apos;ve completed all your tasks!</h3>
                </div>
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
                    .map((task) => (
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


            <UserStatsBox
                selectedHousehold={selectedHousehold}
                windowWidth={windowWidth}
                viewMode={viewMode}
                setViewMode={setViewMode}
                users={users}
                handleOpenAwardBrowniePointsPopup={handleOpenAwardBrowniePointsPopup}
            />


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

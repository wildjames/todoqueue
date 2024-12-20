import React, { useEffect, useRef } from 'react';
import BasePopup from './BasePopup';
import { formatDuration, getTimeSince } from '../../utils';
import { deleteTask, freezeTask, dismissTask, fetchSelectedTask } from '../../api/tasks';
import './popups.css';

const TaskDetailsPopup = React.forwardRef((props, ref) => {
    const updateSelectedTaskTimer = useRef(null);
    const innerClass = props.selectedTask && props.selectedTask.frozen ? 'frozen' : '';


    const fetchSetSelectedTask = async () => {
        const data = await fetchSelectedTask(props.selectedTaskId, props.selectedHousehold);
        props.setSelectedTask(data);
    };

    // Fetch selected task at regular intervals
    useEffect(() => {

        // Clear previous timer if it exists
        if (updateSelectedTaskTimer.current) {
            clearInterval(updateSelectedTaskTimer.current);
        }

        fetchSetSelectedTask();
        updateSelectedTaskTimer.current = setInterval(fetchSetSelectedTask, 1000);


        return () => {
            if (updateSelectedTaskTimer.current) {
                clearInterval(updateSelectedTaskTimer.current);
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.selectedTaskId]);

    const handleDeleteTask = async (taskId) => {
        const succeeded = await deleteTask(taskId, props.selectedHousehold);

        if (succeeded) {
            props.closeCurrentPopup();
        } else {
            console.log("Failed to delete task", succeeded);
        }
    };


    const handleFreezeTask = async (taskId) => {
        const succeeded = await freezeTask(taskId);
        if (succeeded) {
            fetchSetSelectedTask();
        } else {
            console.log("Failed to freeze task", succeeded);
        }
    }

    const handleDismissTask = async (taskId) => {
        console.log("Dismissing task - setting as done by no user.");
        const succeeded = dismissTask(taskId);
        if (succeeded) {
            fetchSelectedTask();
        } else {
            console.log("Failed to dismiss task", succeeded);
        }
    }

    function toHumanFriendlyDate(datetimeStr) {
        // Parse the datetime string into a Date object
        const dateObj = new Date(datetimeStr);

        // Extract date components
        const day = dateObj.getDate();
        const month = dateObj.getMonth() + 1; // Months are 0-based in JavaScript
        const year = dateObj.getFullYear();

        // Extract time components
        const hours = dateObj.getHours();
        const minutes = dateObj.getMinutes();

        // Convert to human-friendly format
        const humanFriendlyDate = `${day}/${month}/${year}`;
        const humanFriendlyTime = `${hours}:${minutes < 10 ? '0' + minutes : minutes}`;

        return `${humanFriendlyDate} at ${humanFriendlyTime}`;
    }


    const handleOpenEditTaskPopup = () => {
        let selectedType = props.PopupType.NONE;
        switch (props.selectedTask.type) {
            case "flexibletask":
                selectedType = props.PopupType.EDIT_FLEXIBLE_TASK;
                break;

            case "scheduledtask":
                selectedType = props.PopupType.EDIT_SCHEDULED_TASK;
                break;

            case "oneshottask":
                selectedType = props.PopupType.EDIT_ONESHOT_TASK;
                break;

            default:
                selectedType = props.PopupType.NONE;
                break;
        }
        props.setCurrentPopup(selectedType);
    };


    const renderFlexibleTaskDetails = () => {
        return (
            <>
                <tr>
                    <td className="task-popup-label">Overdue after:</td>
                    <td className="task-popup-content">{formatDuration(props.selectedTask.max_interval)}</td>
                </tr>
                <tr>
                    <td className="task-popup-label">Stale after:</td>
                    <td className="task-popup-content">{formatDuration(props.selectedTask.min_interval)}</td>
                </tr>
            </>
        );
    }


    const renderScheduledTaskDetails = () => {
        return (
            <>
                <tr>
                    <td className="task-popup-label">Due:</td>
                    <td className="task-popup-content">{toHumanFriendlyDate(props.selectedTask.next_due)}</td>
                </tr>
                <tr>
                    <td className="task-popup-label">Schedule expression:</td>
                    <td className="task-popup-content">{props.selectedTask.cron_schedule}</td>
                </tr>
                <tr>
                    <td className="task-popup-label">Stale after:</td>
                    <td className="task-popup-content">{formatDuration(props.selectedTask.max_interval)}</td>
                </tr>
            </>
        );
    }


    const renderOneShotTaskDetails = () => {
        return (
            <>
                <tr>
                    <td className="task-popup-label">Due date:</td>
                    <td className="task-popup-content">{toHumanFriendlyDate(props.selectedTask.due_date)}</td>
                </tr>
                <tr>
                    <td className="task-popup-label">Time to complete:</td>
                    <td className="task-popup-content">{formatDuration(props.selectedTask.time_to_complete)}</td>
                </tr>
                <tr>
                    <td className="task-popup-label">Completed:</td>
                    <td className="task-popup-content">{props.selectedTask.has_completed ? "Yes" : "No"}</td>
                </tr>
            </>
        );
    };


    return (
        <BasePopup onClick={props.handleOverlayClick} innerClass={innerClass} ref={ref}>
            <div>
                <h2 className="task-popup-header">{props.selectedTask.task_name}</h2>
                <table className="task-popup-table">
                    <tbody>
                        {
                            (() => {
                                switch (props.selectedTask.type) {
                                    case "flexibletask":
                                        return renderFlexibleTaskDetails();
                                    case "scheduledtask":
                                        return renderScheduledTaskDetails();
                                    case "oneshottask":
                                        return renderOneShotTaskDetails();
                                    default:
                                        return null;
                                }
                            })()
                        }
                        <tr>
                            <td className="task-popup-label">Last done:</td>
                            <td className="task-popup-content">{getTimeSince(props.selectedTask.last_completed)}</td>
                        </tr>
                        <tr>
                            <td className="task-popup-label">Takes on average:</td>
                            <td className="task-popup-content">{(props.selectedTask.mean_completion_time / 60).toFixed(1)} minutes</td>
                        </tr>
                        <tr>
                            <td className="task-popup-label">Staleness:</td>
                            <td className="task-popup-content">{parseFloat(props.selectedTask.staleness).toFixed(2)}</td>
                        </tr>
                    </tbody>
                </table>


                <div className="task-popup-description">
                    {props.selectedTask.description === "" ? "" :
                        <p><strong>Description:</strong> {props.selectedTask.description}</p>
                    }
                    {props.selectedTask.frozen ? (
                        <p style={{ color: "black" }}><strong>Task is frozen, and won&apos;t ever appear on the queue</strong></p>
                    ) : null}
                </div>

                <div className="task-popup-actions">
                    <button className="button complete-button" onClick={() => props.handleOpenCompleteTaskPopup(props.selectedTask)}>Complete Task</button>
                    <button className="button dismiss-button" onClick={() => handleDismissTask(props.selectedTask.id)}>Dismiss Task</button>
                </div>

                <div className="task-popup-actions">
                    <button className="button freeze-button" onClick={() => handleFreezeTask(props.selectedTask.id)}>{props.selectedTask.frozen ? "Unfreeze Task" : "Freeze Task"}</button>
                    <button className="button delete-button" onClick={() => handleDeleteTask(props.selectedTask.id)}>Delete Task</button>
                    {props.selectedTask.type !== 'oneshottask' ? (
                        <button className="button edit-button" onClick={() => handleOpenEditTaskPopup()}>Edit Task</button>
                    ) : null}
                </div>
            </div>
        </BasePopup>
    );
});

TaskDetailsPopup.displayName = 'TaskDetailsPopup';

export default TaskDetailsPopup;

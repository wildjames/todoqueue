import React, { useEffect, useRef } from 'react';
import moment from 'moment';
import BasePopup from './BasePopup';
import { formatDuration, getTimeSince } from '../../utils';
import { deleteTask, freezeTask, fetchSelectedTask } from '../../api/tasks';

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


    const calculateDueDate = (scheduledTask) => {
        const now = moment();
        const lastCompleted = moment(scheduledTask.last_completed);

        if (scheduledTask.recur_dayhour !== -1) {
            // Add the specified hours to the last completed date
            const dueDate = lastCompleted.add(scheduledTask.recur_dayhour, 'hours');
            return dueDate > now ? dueDate.format() : now.add(scheduledTask.recur_dayhour, 'hours').format();
        } else if (scheduledTask.recur_weekday !== -1) {
            // Find the next specified weekday after the last completed date
            const dueDate = lastCompleted.day(scheduledTask.recur_weekday + 7);
            return dueDate > now ? dueDate.format() : now.day(scheduledTask.recur_weekday + 7).format();
        } else if (scheduledTask.recur_monthday !== -1) {
            // Find the next specified day of the month after the last completed date
            const dueDate = lastCompleted.date(scheduledTask.recur_monthday);
            return dueDate > now ? dueDate.format() : now.add(1, 'months').date(scheduledTask.recur_monthday).format();
        } else if (scheduledTask.recur_yearmonth !== -1) {
            // Find the next specified month after the last completed date
            const dueDate = lastCompleted.month(scheduledTask.recur_yearmonth - 1);
            return dueDate > now ? dueDate.format() : now.add(1, 'years').month(scheduledTask.recur_yearmonth - 1).format();
        } else {
            // If none of the recurrence fields are set, return the current date and time
            return now.format();
        }
    }



    return (
        <BasePopup onClick={props.handleOverlayClick} innerClass={innerClass} ref={ref}>
            <div>
                <h2 className="task-popup-header">{props.selectedTask.task_name}</h2>
                <table className="task-popup-table">
                    <tbody>
                        <tr>
                            <td className="task-popup-label">This takes on average:</td>
                            <td className="task-popup-content">{(props.selectedTask.mean_completion_time / 60).toFixed(1)} minutes</td>
                        </tr>

                        {
                            (() => {
                                switch (props.selectedTask.type) {
                                    case "flexibletask":
                                        return (
                                            <>
                                                <tr>
                                                    <td className="task-popup-label">Do this at most every:</td>
                                                    <td className="task-popup-content">{formatDuration(props.selectedTask.max_interval)}</td>
                                                </tr>
                                                <tr>
                                                    <td className="task-popup-label">and at least every:</td>
                                                    <td className="task-popup-content">{formatDuration(props.selectedTask.min_interval)}</td>
                                                </tr>
                                            </>
                                        );
                                    case "scheduledtask":
                                        return (
                                            <>
                                                <tr>
                                                    <p><strong>{`Due in ${calculateDueDate(props.selectedTask)}`}</strong></p>
                                                </tr>
                                                <tr>
                                                    <td className="task-popup-label">And you have this long to do it:</td>
                                                    <td className="task-popup-content">{formatDuration(props.selectedTask.max_interval)}</td>
                                                </tr>
                                            </>
                                        );
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
                        <p style={{ color: "black" }}><strong>Task is frozen, and won't ever appear on the queue</strong></p>
                    ) : null}
                </div>
                <div className="task-popup-actions">
                    <button className="button complete-button" onClick={() => props.handleOpenCompleteTaskPopup(props.selectedTask)}>Complete Task</button>
                    <button className="button freeze-button" onClick={() => handleFreezeTask(props.selectedTask.id)}>{props.selectedTask.frozen ? "Unfreeze Task" : "Freeze Task"}</button>
                    <button className="button delete-button" onClick={() => handleDeleteTask(props.selectedTask.id)}>Delete Task</button>
                </div>
            </div>
        </BasePopup>
    );
});

export default TaskDetailsPopup;

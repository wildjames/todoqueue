import React, { useEffect, useRef } from 'react';
import BasePopup from './BasePopup';
import { formatDuration, getTimeSince } from '../utils';
import { deleteTask, freezeTask, fetchSelectedTask } from '../api/tasks';

const ShowTaskPopup = React.forwardRef((props, ref) => {
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
            props.closeTaskPopup();
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
                        <tr>
                            <td className="task-popup-label">Do this at most every:</td>
                            <td className="task-popup-content">{formatDuration(props.selectedTask.max_interval)}</td>
                        </tr>
                        <tr>
                            <td className="task-popup-label">and at least every:</td>
                            <td className="task-popup-content">{formatDuration(props.selectedTask.min_interval)}</td>
                        </tr>
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
                    {props.selectedTask.description == "" ? "" :
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

export default ShowTaskPopup;

import React from 'react';
import BasePopup from './BasePopup';
import { formatDuration, getTimeSince } from '../utils';

const ShowTaskPopup = React.forwardRef((props, ref) => {
    const innerClass = props.selectedTask && props.selectedTask.frozen ? 'frozen' : '';


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
                    <button className="button freeze-button" onClick={() => props.handleFreezeTask(props.selectedTask.id)}>{props.selectedTask.frozen ? "Unfreeze Task" : "Freeze Task"}</button>
                    <button className="button delete-button" onClick={() => props.handleDeleteTask(props.selectedTask.id)}>Delete Task</button>
                </div>
            </div>
        </BasePopup>
    );
});

export default ShowTaskPopup;

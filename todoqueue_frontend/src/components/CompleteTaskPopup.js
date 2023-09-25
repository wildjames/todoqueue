import React from 'react';
import BasePopup from './BasePopup';
import { formatDuration, getTimeSince } from '../utils';

const CompleteTaskPopup = React.forwardRef((props, ref) => {
    const innerClass = props.selectedTask && props.selectedTask.frozen ? 'frozen' : '';

    return (
        <BasePopup onClick={props.handleOverlayClick} innerClass={innerClass} ref={ref}>
            <div>
                <h2 style={{ color: "black" }} >Complete Task: {props.selectedTask && props.selectedTask.task_name}</h2>
                <form onSubmit={props.handleCreateWorkLog}>
                    <div className="form-section">
                        <div className="form-section">
                            <label>Select Users:</label>
                            <div className="user-button-container">
                                {props.users
                                    .sort((a, b) => a.username.localeCompare(b.username))
                                    .map(user => (
                                        <button
                                            type="button"
                                            // If no users are selected, add a red shadow to indicate that someone needs to be selected.
                                            // If this user is selected, make their name button green
                                            className={`button user-button ${props.completionUsers.length === 0 ? "input-error" : ""} ${props.completionUsers.includes(user.id) ? 'selected' : ''}`}
                                            onClick={() => {
                                                if (props.completionUsers.includes(user.id)) {
                                                    // Remove user from list
                                                    props.setCompletionUsers(props.completionUsers.filter(id => id !== user.id));
                                                } else {
                                                    // Add user to list
                                                    props.setCompletionUsers([...props.completionUsers, user.id]);
                                                }
                                            }}
                                        >
                                            {user.username}
                                        </button>
                                    ))}
                            </div>
                        </div>
                    </div>
                    <div className={`form-section time-slider label-and-input ${props.completionTime == 0 ? "input-error" : ""}`}>
                        <label htmlFor="completionTime">Completion Time:</label>
                        <input
                            id="completionTime"
                            type="range"
                            min="0"
                            max={props.completionTimeLookup.length - 1}
                            step="1"
                            value={props.completionTime}
                            onChange={e => props.setCompletionTime(e.target.value)}
                        />
                        <span>{props.completionTimeLookup[props.completionTime]} minute{props.completionTimeLookup[props.completionTime] == 1 ? "" : "s"}</span>
                    </div>

                    <div className="form-section label-and-input" style={{ display: "block" }}>
                        <label>Grossness:</label>
                        <div className="grossness-scale">
                            {Array.from({ length: 5 }, (_, index) => index + 1).map(num => (
                                <span
                                    key={num}
                                    className={`poop-emoji ${props.grossness >= num ? 'selected' : ''}`}
                                    onClick={() => props.setGrossness(props.grossness === num ? 0 : num)}
                                >
                                    💩
                                </span>
                            ))}
                        </div>
                    </div>
                    <button
                        className={`button form-section ${props.completionUsers.length > 0 ? "enabled" : "disabled"}`}
                        type="submit"
                        disabled={props.completionUsers.length === 0}
                    >
                        Submit
                    </button>
                </form>
            </div>
        </BasePopup>
    );
});

export default CompleteTaskPopup;
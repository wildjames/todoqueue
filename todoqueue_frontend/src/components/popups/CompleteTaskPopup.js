import React, { useState } from 'react';
import BasePopup from './BasePopup';
import { createWorkLog } from '../../api/tasks';
import './popups.css';

const CompleteTaskPopup = React.forwardRef((props, ref) => {
    const [completionUsers, setCompletionUsers] = useState([]);
    const [grossness, setGrossness] = useState(0);
    const [completionTime, setCompletionTime] = useState(0);

    const innerClass = props.selectedTask && props.selectedTask.frozen ? 'frozen' : '';

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
            props.selectedHousehold,
            props.selectedTask.id,
            completionTime_str,
            completionUsers,
            grossness,
        );

        // If the creation succeeded, the brownie points will not be null
        if (browniePoints === null) {
            console.log("Failed to create worklog");
            return;
        }

        props.setBrowniePoints(browniePoints);

        setCompletionUsers([]);

        props.closeCurrentPopup();
    };


    return (
        <BasePopup onClick={props.handleOverlayClick} innerClass={innerClass} ref={ref}>
            <div>
                <h2 style={{ color: "black" }} >Complete Task: {props.selectedTask && props.selectedTask.task_name}</h2>
                <form onSubmit={handleCreateWorkLog}>
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
        </BasePopup>
    );
});

export default CompleteTaskPopup;
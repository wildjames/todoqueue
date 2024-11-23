import React, { useState, useEffect } from 'react';
import BasePopup from './BasePopup';
import { updateFlexibleTask, fetchSelectedTask } from '../../api/tasks';
import './popups.css';

const EditFlexibleTaskPopup = React.forwardRef((props, ref) => {
    const [task, setTask] = useState({
        task_name: '',
        max_interval: '0:0',
        min_interval: '0:0',
        description: '',
        min_interval_days: 0,
        min_interval_hours: 0,
        min_interval_minutes: 0,
        max_interval_days: 0,
        max_interval_hours: 0,
        max_interval_minutes: 0,
    });
    const [inputError, setInputError] = useState(false);

    useEffect(() => {
        // Fetch the task details when the component mounts
        const fetchTaskDetails = async () => {
            const taskData = await fetchSelectedTask(props.selectedTaskId, props.selectedHousehold);

            // Helper function to parse intervals
            const parseInterval = (interval) => {
                console.log("Parsing interval: ", interval);
                const parts = interval.split(' ');
                let days = 0;
                let time = parts[0];
                console.log("Parts: ", parts);

                // If there are two parts, it means days are included
                if (parts.length === 2) {
                    console.log("There are two parts");
                    days = parseInt(parts[0]);
                    time = parts[1];
                }

                const [hours, minutes] = time.split(':').map(Number);
                console.log("Days: ", days);
                console.log("Hours: ", hours);
                console.log("Minutes: ", minutes);

                return { days, hours, minutes };
            };

            const maxInterval = parseInterval(taskData.max_interval);
            const minInterval = parseInterval(taskData.min_interval);

            console.log("[EditFlexibleTaskPopup] Task: ", taskData);
            console.log("Min interval: ", minInterval);
            console.log("Max interval: ", maxInterval);

            setTask({
                ...taskData,
                max_interval_days: maxInterval.days,
                max_interval_hours: maxInterval.hours,
                max_interval_minutes: maxInterval.minutes,
                min_interval_days: minInterval.days,
                min_interval_hours: minInterval.hours,
                min_interval_minutes: minInterval.minutes,
            });
        };

        fetchTaskDetails();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.selectedTaskId]);


    const handleUpdateTask = async (event) => {
        event.preventDefault();

        // Convert max_interval and min_interval to minutes
        const max_interval_in_minutes =
            (task.max_interval_days || 0) * 24 * 60 +
            (task.max_interval_hours || 0) * 60 +
            (task.max_interval_minutes || 0);

        const min_interval_in_minutes =
            (task.min_interval_days || 0) * 24 * 60 +
            (task.min_interval_hours || 0) * 60 +
            (task.min_interval_minutes || 0);

        // Check for invalid inputs
        if (task.task_name === "") {
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

        console.log("All inputs are OK");
        setInputError(false);

        // Convert max_interval and min_interval to Django DurationField format "[-]DD HH:MM:SS"
        const max_interval = `${task.max_interval_days || 0} ${task.max_interval_hours || 0}:${task.max_interval_minutes || 0}:00`;
        const min_interval = `${task.min_interval_days || 0} ${task.min_interval_hours || 0}:${task.min_interval_minutes || 0}:00`;

        const response_data = await updateFlexibleTask(
            props.selectedTaskId,
            task.task_name,
            props.selectedHousehold,
            max_interval,
            min_interval,
            task.description,
        );

        console.log("Updated task. Response:", response_data);
        await props.fetchSetTasks();
        // props.closeCurrentPopup();
        props.setCurrentPopup(props.PopupType.TASK_DETAILS);

        // Reset the state
        console.log("Resetting task")
        setTask({
            task_name: '',
            max_interval: '0:0',
            min_interval: '0:0',
            description: ''
        });
    };

    const handleUpdateInputChange = (e) => {
        const { name, value } = e.target;

        console.log("Setting new task in handleUpdateInputChange");
        setTask((prevTask) => {
            const updatedTask = { ...prevTask, [name]: value };

            let max_interval_in_minutes =
                (updatedTask.max_interval_days || 0) * 24 * 60 +
                (updatedTask.max_interval_hours || 0) * 60 +
                (updatedTask.max_interval_minutes || 0);
            max_interval_in_minutes = parseInt(max_interval_in_minutes);

            let min_interval_in_minutes =
                (updatedTask.min_interval_days || 0) * 24 * 60 +
                (updatedTask.min_interval_hours || 0) * 60 +
                (updatedTask.min_interval_minutes || 0);
            min_interval_in_minutes = parseInt(min_interval_in_minutes);

            if (max_interval_in_minutes < min_interval_in_minutes) {
                setInputError(true);
                console.log("Max interval should be greater than or equal to Min interval");
            } else {
                setInputError(false);
            }

            return updatedTask;
        });
    };


    // const handlePopupTypeChange = (e) => {
    //     const selectedType = e.target.value;
    //     props.setCurrentPopup(selectedType);
    // };


    return (
        <BasePopup onClick={props.handleOverlayClick} ref={ref}>
            <div>
                <h2>Edit Task</h2>
                <form className="task-form">
                    <div className="task-input-group">
                        <input
                            type="text"
                            name="task_name"
                            placeholder="Task Name"
                            onChange={handleUpdateInputChange}
                            value={task.task_name}
                        />
                    </div>

                    <div className="task-input-group task-input-group-horizontal">
                        <label style={{ marginTop: "1.5rem" }}>Overdue after: </label>
                        <div className="task-input-group-vertical">
                            <label>Days</label>
                            <input
                                className={inputError ? "input-error" : ""}
                                type="number"
                                min="0"
                                name="max_interval_days"
                                placeholder="Days"
                                onChange={handleUpdateInputChange}
                                value={task.max_interval_days}
                            />
                        </div>
                        <div className="task-input-group-vertical">
                            <label>Hours</label>
                            <input
                                className={inputError ? "input-error" : ""}
                                type="number"
                                min="0"
                                name="max_interval_hours"
                                placeholder="Hours"
                                onChange={handleUpdateInputChange}
                                value={task.max_interval_hours}
                            />
                        </div>
                        <div className="task-input-group-vertical">
                            <label>Minutes</label>
                            <input
                                className={inputError ? "input-error" : ""}
                                type="number"
                                min="0"
                                name="max_interval_minutes"
                                placeholder="Minutes"
                                onChange={handleUpdateInputChange}
                                value={task.max_interval_minutes}
                            />
                        </div>
                    </div>
                    <div className="task-input-group task-input-group-horizontal">
                        <label>Stale after: </label>
                        <div>
                            <input
                                className={inputError ? "input-error" : ""}
                                type="number"
                                min="0"
                                name="min_interval_days"
                                placeholder="Days"
                                onChange={handleUpdateInputChange}
                                value={task.min_interval_days}
                            />
                        </div>
                        <div>
                            <input
                                className={inputError ? "input-error" : ""}
                                type="number"
                                min="0"
                                name="min_interval_hours"
                                placeholder="Hours"
                                onChange={handleUpdateInputChange}
                                value={task.min_interval_hours}
                            />
                        </div>
                        <div>
                            <input
                                className={inputError ? "input-error" : ""}
                                type="number"
                                min="0"
                                name="min_interval_minutes"
                                placeholder="Minutes"
                                onChange={handleUpdateInputChange}
                                value={task.min_interval_minutes}
                            />
                        </div>
                    </div>
                    <div className="task-input-group">
                        <input
                            type="text"
                            name="description"
                            placeholder="Description"
                            onChange={handleUpdateInputChange}
                            value={task.description}
                        />
                    </div>
                    <div>
                        <button
                            className={`button update-button ${inputError ? "disabled" : "enabled"}`}
                            onClick={handleUpdateTask}
                        >
                            Update Task
                        </button>
                    </div>
                </form>
            </div>
        </BasePopup>
    );
});

EditFlexibleTaskPopup.displayName = "EditFlexibleTaskPopup";

export default EditFlexibleTaskPopup;

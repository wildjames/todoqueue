import React, { useState } from 'react';
import BasePopup from './BasePopup';
import { createFlexibleTask } from '../../api/tasks';

const CreateFlexibleTaskPopup = React.forwardRef((props, ref) => {
    const [newTask, setNewTask] = useState({
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


    const handleCreateTask = async (event) => {
        event.preventDefault();

        // Convert max_interval and min_interval to minutes
        const max_interval_in_minutes =
            (newTask.max_interval_days || 0) * 24 * 60 +
            (newTask.max_interval_hours || 0) * 60 +
            (newTask.max_interval_minutes || 0);

        const min_interval_in_minutes =
            (newTask.min_interval_days || 0) * 24 * 60 +
            (newTask.min_interval_hours || 0) * 60 +
            (newTask.min_interval_minutes || 0);

        // Check for invalid inputs
        if (newTask.task_name === "") {
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

        setInputError(false);

        // Convert max_interval and min_interval to Django DurationField format "[-]DD HH:MM:SS"
        const max_interval = `${newTask.max_interval_days || 0} ${newTask.max_interval_hours || 0}:${newTask.max_interval_minutes || 0}:00`;
        const min_interval = `${newTask.min_interval_days || 0} ${newTask.min_interval_hours || 0}:${newTask.min_interval_minutes || 0}:00`;

        const response_data = await createFlexibleTask(
            newTask.task_name,
            props.selectedHousehold,
            max_interval,
            min_interval,
            newTask.description,
        );

        console.log("Created task. Response:", response_data);
        await props.fetchSetTasks();
        props.closeCurrentPopup();

        // Reset the newTask state
        console.log("Resetting task")
        setNewTask({
            task_name: '',
            max_interval: '0:0',
            min_interval: '0:0',
            description: ''
        });
    };


    const handleCreateInputChange = (e) => {
        const { name, value } = e.target;

        console.log("Setting new task in handleCreateInputChange");
        setNewTask((prevTask) => {
            const updatedTask = { ...prevTask, [name]: value };

            const max_interval_in_minutes =
                (updatedTask.max_interval_days || 0) * 24 * 60 +
                (updatedTask.max_interval_hours || 0) * 60 +
                (updatedTask.max_interval_minutes || 0);

            const min_interval_in_minutes =
                (updatedTask.min_interval_days || 0) * 24 * 60 +
                (updatedTask.min_interval_hours || 0) * 60 +
                (updatedTask.min_interval_minutes || 0);

            if (max_interval_in_minutes < min_interval_in_minutes) {
                setInputError(true);
                console.log("Max interval should be greater than or equal to Min interval");
            } else {
                setInputError(false);
            }

            return updatedTask;
        });
    };


    const handlePopupTypeChange = (e) => {
        const selectedType = e.target.value;
        props.setCurrentPopup(selectedType);
    };


    return (
        <BasePopup onClick={props.handleOverlayClick} ref={ref}>
            <div>
                <div className="popup-type-selector">
                    <label>Task Type: </label>
                    <select value={props.currentPopup} onChange={handlePopupTypeChange}>
                        <option value={props.PopupType.CREATE_SCHEDULED_TASK}>Scheduled Task</option>
                        <option value={props.PopupType.CREATE_FLEXIBLE_TASK}>Flexible Task</option>
                    </select>
                </div>

                <h2>Create a New Task</h2>
                <form className="task-form">
                    <div className="input-group">
                        <input type="text" name="task_name" placeholder="Task Name" onChange={handleCreateInputChange} />
                    </div>

                    <div className="input-group input-group-horizontal">
                        <label>Max Interval: </label>
                        <input
                            className={inputError ? "input-error" : ""}
                            type="number"
                            min="0"
                            name="max_interval_days"
                            placeholder="Days"
                            onChange={handleCreateInputChange}
                        />
                        <input
                            className={inputError ? "input-error" : ""}
                            type="number"
                            min="0"
                            name="max_interval_hours"
                            placeholder="Hours"
                            onChange={handleCreateInputChange}
                        />
                        <input
                            className={inputError ? "input-error" : ""}
                            type="number"
                            min="0"
                            name="max_interval_minutes"
                            placeholder="Minutes"
                            onChange={handleCreateInputChange}
                        />
                    </div>
                    <div className="input-group input-group-horizontal">
                        <label>Min Interval: </label>
                        <input
                            className={inputError ? "input-error" : ""}
                            type="number"
                            min="0"
                            name="min_interval_days"
                            placeholder="Days"
                            onChange={handleCreateInputChange}
                        />
                        <input
                            className={inputError ? "input-error" : ""}
                            type="number"
                            min="0"
                            name="min_interval_hours"
                            placeholder="Hours"
                            onChange={handleCreateInputChange}
                        />
                        <input
                            className={inputError ? "input-error" : ""}
                            type="number"
                            min="0"
                            name="min_interval_minutes"
                            placeholder="Minutes"
                            onChange={handleCreateInputChange}
                        />
                    </div>
                    <div className="input-group">
                        <input
                            type="text"
                            name="description"
                            placeholder="Description"
                            onChange={handleCreateInputChange}
                        />
                        <button
                            className={`button create-button ${inputError ? "disabled" : "enabled"}`}
                            onClick={handleCreateTask}
                        >
                            Create Task
                        </button>
                    </div>
                </form>
            </div>
        </BasePopup>
    );
});

export default CreateFlexibleTaskPopup;

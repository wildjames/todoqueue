import React, { useState } from 'react';
import BasePopup from './BasePopup';
import { createOneShotTask } from '../../api/tasks';
import './popups.css';

const CreateOneShotTaskPopup = React.forwardRef((props, ref) => {
    const [newTask, setNewTask] = useState({
        task_name: '',
        due_date: '',
        due_time: '09:00',
        due_before: false,
        time_to_complete_days: 0,
        time_to_complete_hours: 0,
        time_to_complete_minutes: 0,
        description: '',
    });
    const [inputError, setInputError] = useState(false);


    const handleCreateTask = async (event) => {
        event.preventDefault();

        // Convert time_to_complete to minutes
        const time_to_complete_in_minutes =
            (newTask.time_to_complete_days || 0) * 24 * 60 +
            (newTask.time_to_complete_hours || 0) * 60 +
            (newTask.time_to_complete_minutes || 0);

        // Check for invalid inputs
        if (newTask.task_name === "") {
            setInputError(true);
            console.log("Task name may not be blank");
            return;
        }

        if (newTask.due_date === "" || newTask.due_time === "") {
            setInputError(true);
            console.log("Due date and time may not be blank");
            return;
        }

        // integers only
        if (time_to_complete_in_minutes % 1 !== 0) {
            setInputError(true);
            console.log("Time to complete must be an integer");
            return;
        }

        if (time_to_complete_in_minutes < 0) {
            setInputError(true);
            console.log("Time to complete must be positive");
            return;
        }

        console.log("All inputs are OK");
        setInputError(false);

        // Combine date and time inputs into a single datetime string
        const due_datetime = `${newTask.due_date}T${newTask.due_time}`;

        // Convert time_to_complete to Django DurationField format "[-]DD HH:MM:SS"
        const time_to_complete = `${newTask.time_to_complete_days || 0} ${newTask.time_to_complete_hours || 0}:${newTask.time_to_complete_minutes || 0}:00`;

        const response = await createOneShotTask(
            newTask.task_name,
            props.selectedHousehold,
            due_datetime,
            newTask.due_before,
            time_to_complete,
            newTask.description,
        );
        if (response.status !== 201) {
            console.error("Error creating one-shot task. Response:", response.data);
            setInputError(true);
            return;
        }

        console.log("Created one-shot task. Response:", response.data);
        await props.fetchSetTasks();
        props.closeCurrentPopup();

        // Reset the newTask state
        console.log("Resetting task")
        setNewTask({
            task_name: '',
            due_date: '',
            due_before: false,
            time_to_complete_days: 0,
            time_to_complete_hours: 0,
            time_to_complete_minutes: 0,
            description: '',
        });
    };


    const handleCreateInputChange = (e) => {
        const { name, value } = e.target;
        setNewTask((prevTask) => ({ ...prevTask, [name]: value }));
    };


    const handleDueBeforeChange = (e) => {
        setNewTask((prevTask) => ({ ...prevTask, due_before: e.target.checked }));
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
                    <select value={props.currentPopup} onChange={handlePopupTypeChange} style={{ margin: "1rem" }}>
                        <option value={props.PopupType.CREATE_SCHEDULED_TASK}>Scheduled Task</option>
                        <option value={props.PopupType.CREATE_FLEXIBLE_TASK}>Flexible Task</option>
                        <option value={props.PopupType.CREATE_ONESHOT_TASK}>One-Shot Task</option>
                    </select>
                </div>

                <h2>Create a New One-Shot Task</h2>
                <form className="task-form">
                    <div className="task-input-group">
                        <input
                            className={inputError ? "input-error" : ""}
                            type="text"
                            name="task_name"
                            placeholder="Task Name"
                            onChange={handleCreateInputChange}
                        />
                    </div>
                    <div className="task-input-group">
                        <input
                            className={inputError ? "input-error" : ""}
                            type="date"
                            name="due_date"
                            placeholder="Due Date"
                            onChange={handleCreateInputChange}
                        />
                        <input
                            className={inputError ? "input-error" : ""}
                            type="time"
                            name="due_time"
                            defaultValue="09:00"
                            onChange={handleCreateInputChange}
                        />
                    </div>
                    <div className="task-input-group">
                        <label>
                            <input
                                type="checkbox"
                                name="due_before"
                                onChange={handleDueBeforeChange}
                            />
                            Due Before
                        </label>
                    </div>
                    <div className="task-input-group task-input-group-horizontal">
                        <label>Time to complete: </label>
                        <input
                            className={inputError ? "input-error" : ""}
                            type="number"
                            min="0"
                            name="time_to_complete_days"
                            placeholder="Days"
                            onChange={handleCreateInputChange}
                        />
                        <input
                            className={inputError ? "input-error" : ""}
                            type="number"
                            min="0"
                            name="time_to_complete_hours"
                            placeholder="Hours"
                            onChange={handleCreateInputChange}
                        />
                        <input
                            className={inputError ? "input-error" : ""}
                            type="number"
                            min="0"
                            name="time_to_complete_minutes"
                            placeholder="Minutes"
                            onChange={handleCreateInputChange}
                        />
                    </div>
                    <div className="task-input-group">
                        <input
                            className={inputError ? "input-error" : ""}
                            type="text"
                            name="description"
                            placeholder="Description"
                            onChange={handleCreateInputChange}
                        />
                    </div>
                    <div>
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

export default CreateOneShotTaskPopup;

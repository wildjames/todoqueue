import React, { useState } from 'react';
import BasePopup from './BasePopup';
import { createScheduledTask } from '../../api/tasks'; // Make sure to implement this function in your API

const CreateScheduledTaskPopup = React.forwardRef((props, ref) => {
    const [newTask, setNewTask] = useState({
        task_name: '',
        description: '',
        max_interval: '0:0',
        recur_dayhour: -1,
        recur_weekday: -1,
        recur_monthday: -1,
        recur_yearmonth: -1,
    });
    const [inputError, setInputError] = useState(false);

    const handleCreateTask = async (event) => {
        event.preventDefault();

        // Check for invalid inputs
        if (newTask.task_name === "") {
            setInputError(true);
            console.log("Task name may not be blank");
            return;
        }

        setInputError(false);

        const response_data = await createScheduledTask(
            newTask.task_name,
            props.selectedHousehold,
            newTask.recur_dayhour,
            newTask.recur_weekday,
            newTask.recur_monthday,
            newTask.recur_yearmonth,
            newTask.max_interval,
            newTask.description,
        );

        console.log("Created scheduled task. Response:", response_data);
        await props.fetchSetTasks();
        props.closeCurrentPopup();

        // Reset the newTask state
        console.log("Resetting task")
        setNewTask({
            task_name: '',
            description: '',
            max_interval: '0:0',
            recur_dayhour: -1,
            recur_weekday: -1,
            recur_monthday: -1,
            recur_yearmonth: -1,
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

                <h2>Create a New Scheduled Task</h2>
                <form className="task-form">

                    <div className="input-group">
                        <input type="text" name="task_name" placeholder="Task Name" onChange={handleCreateInputChange} />
                    </div>


                    <div className="input-group">
                        <label>Recur Day Hour: </label>
                        <input type="number" name="recur_dayhour" placeholder="Day Hour" onChange={handleCreateInputChange} />
                    </div>
                    <div className="input-group">
                        <label>Recur Week Day: </label>
                        <input type="number" name="recur_weekday" placeholder="Week Day" onChange={handleCreateInputChange} />
                    </div>
                    <div className="input-group">
                        <label>Recur Month Day: </label>
                        <input type="number" name="recur_monthday" placeholder="Month Day" onChange={handleCreateInputChange} />
                    </div>
                    <div className="input-group">
                        <label>Recur Year Month: </label>
                        <input type="number" name="recur_yearmonth" placeholder="Year Month" onChange={handleCreateInputChange} />
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


                    <div className="input-group">
                        <input type="text" name="description" placeholder="Description" onChange={handleCreateInputChange} />
                        <button className="button create-button" onClick={handleCreateTask}>
                            Create Task
                        </button>
                    </div>


                </form>
            </div>
        </BasePopup>
    );
});

export default CreateScheduledTaskPopup;

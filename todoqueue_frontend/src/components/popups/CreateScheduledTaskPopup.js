import React, { useState, useCallback } from 'react';
import BasePopup from './BasePopup';
import { createScheduledTask } from '../../api/tasks'; // Make sure to implement this function in your API

const CreateScheduledTaskPopup = React.forwardRef((props, ref) => {
    const [newTask, setNewTask] = useState({
        task_name: '',
        description: '',
        max_interval: '0:0',
        minutes: "0",
        hours: "*",
        DoM: "*",
        DoW: "*",
        months: "*",
    });
    const [inputError, setInputError] = useState(false);

    const handleCreateTask = async (event) => {
        event.preventDefault();

        console.log("Checking inputs", newTask);

        // Check for invalid inputs
        if (newTask.task_name === "") {
            setInputError(true);
            console.log("Task name may not be blank");
            return;
        }

        // Convert max_interval to minutes
        const max_interval_in_minutes =
            (newTask.max_interval_days || 0) * 24 * 60 +
            (newTask.max_interval_hours || 0) * 60 +
            (newTask.max_interval_minutes || 0);

        // integers only
        if (max_interval_in_minutes % 1 !== 0) {
            setInputError(true);
            console.log("Max and Min intervals must be integers");
            return;
        }

        if (max_interval_in_minutes < 0) {
            setInputError(true);
            console.log("Max and Min intervals must be positive");
            return;
        }

        // Convert max_interval and min_interval to Django DurationField format "[-]DD HH:MM:SS"
        const max_interval = `${newTask.max_interval_days || 0} ${newTask.max_interval_hours || 0}:${newTask.max_interval_minutes || 0}:00`;

        const cronString = `${newTask.minutes} ${newTask.hours} ${newTask.DoM} ${newTask.months} ${newTask.DoW}`
        // TODO: Validate cron expression
        const regex = /^(\*|([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])|\*\/([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])) (\*|([0-9]|1[0-9]|2[0-3])|\*\/([0-9]|1[0-9]|2[0-3])) (\*|([1-9]|1[0-9]|2[0-9]|3[0-1])|\*\/([1-9]|1[0-9]|2[0-9]|3[0-1])) (\*|([1-9]|1[0-2])|\*\/([1-9]|1[0-2])) (\*|([0-6])|\*\/([0-6]))$/;
        if (!regex.test(cronString)) {
            console.error("The cron expression is not valid!", cronString);
            console.error("This is the task it was build from:", newTask);
            setInputError(true);
            return;
        }

        setInputError(false);

        const response_data = await createScheduledTask(
            newTask.task_name,
            props.selectedHousehold,
            cronString,
            max_interval,
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
            minutes: "*",
            hours: "*",
            DoM: "*",
            months: "*",
            DoW: "*",
        });
    };

    const handleCreateInputChange = (e) => {
        const { name, value } = e.target;

        console.log("Setting new task in handleCreateInputChange");
        setNewTask((prevTask) => {
            const updatedTask = { ...prevTask, [name]: value };

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
                    <select value={props.currentPopup} onChange={handlePopupTypeChange} style={{ margin: "1rem" }}>
                        <option value={props.PopupType.CREATE_SCHEDULED_TASK}>Scheduled Task</option>
                        <option value={props.PopupType.CREATE_FLEXIBLE_TASK}>Flexible Task</option>
                    </select>
                </div>

                <h2>Create a New Scheduled Task</h2>
                <form className="task-form">

                    <div className="input-group" >
                        <input type="text" name="task_name" placeholder="Task Name" onChange={handleCreateInputChange} />
                    </div>


                    <div className={inputError ? "input-group input-group-horizontal input-error" : "input-group input-group-horizontal"} >
                        <label>Minutes: </label>
                        <input
                            type="text"
                            name="minutes"
                            placeholder="e.g. 1,3 or 2-6 or *"
                            onChange={handleCreateInputChange}
                        />
                    </div>
                    <div className={inputError ? "input-group input-group-horizontal input-error" : "input-group input-group-horizontal"} >
                        <label>Hours: </label>
                        <input
                            type="text"
                            name="hours"
                            placeholder="e.g. 1,3 or 2-6 or *"
                            onChange={handleCreateInputChange}
                        />
                    </div>
                    <div className={inputError ? "input-group input-group-horizontal input-error" : "input-group input-group-horizontal"} >
                        <label>Day of the month: </label>
                        <input
                            type="text"
                            name="DoM"
                            placeholder="e.g. 1,3 or 2-6 or *"
                            onChange={handleCreateInputChange}
                        />
                    </div>
                    <div className={inputError ? "input-group input-group-horizontal input-error" : "input-group input-group-horizontal"} >
                        <label>Day of the week: </label>
                        <input
                            type="text"
                            name="DoW"
                            placeholder="e.g. 1,3 or 2-6 or *"
                            onChange={handleCreateInputChange}
                        />
                    </div>
                    <div className={inputError ? "input-group input-group-horizontal input-error" : "input-group input-group-horizontal"} >
                        <label>Months: </label>
                        <input
                            type="text"
                            name="months"
                            placeholder="e.g. 1,3 or 2-6 or *"
                            onChange={handleCreateInputChange}
                        />
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

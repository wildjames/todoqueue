import React, { useState, useEffect } from 'react';
import BasePopup from './BasePopup';
import { updateScheduledTask, fetchSelectedTask } from '../../api/tasks';
import './popups.css';

const EditScheduledTaskPopup = React.forwardRef((props, ref) => {
    const [task, setTask] = useState({
        task_name: '',
        description: '',
        max_interval: '0:0',
        max_interval_days: '0',
        max_interval_hours: '0',
        max_interval_minutes: '0',
        minutes: "0",
        hours: "*",
        DoM: "*",
        DoW: "*",
        months: "*",
    });
    const [inputError, setInputError] = useState(false);

    useEffect(() => {
        const fetchTaskDetails = async () => {
            const taskData = await fetchSelectedTask(props.selectedTaskId, props.selectedHousehold);
            setTask(taskData);

            // Helper function to parse intervals
            const parseInterval = (interval) => {
                const parts = interval.split(' ');
                let days = 0;
                let time = parts[0];

                // If there are two parts, it means days are included
                if (parts.length === 2) {
                    days = parseInt(parts[0]);
                    time = parts[1];
                }

                const [hours, minutes] = time.split(':').map(Number);
                return { days, hours, minutes };
            };


            const maxInterval = parseInterval(taskData.max_interval);

            // The cron_schedule needs to be split into the individual fields.
            // Replace any "*" with "All" so that it can be displayed in the input field.
            const cron_schedule = taskData.cron_schedule.split(' ').map((field) => {
                if (field === '*') {
                    return 'All';
                }
                return field;
            });
            setTask({
                ...taskData,
                minutes: cron_schedule[0],
                hours: cron_schedule[1],
                DoM: cron_schedule[2],
                months: cron_schedule[3],
                DoW: cron_schedule[4],
                max_interval_days: maxInterval.days,
                max_interval_hours: maxInterval.hours,
                max_interval_minutes: maxInterval.minutes,
            });
        };

        fetchTaskDetails();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.selectedTaskId]);

    const handleEditTask = async (event) => {
        event.preventDefault();

        // Check for invalid inputs
        if (task.task_name === "") {
            setInputError(true);
            console.log("Task name may not be blank");
            return;
        }

        // Convert max_interval to minutes
        const max_interval_in_minutes =
            (task.max_interval_days || 0) * 24 * 60 +
            (task.max_interval_hours || 0) * 60 +
            (task.max_interval_minutes || 0);

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
        const max_interval = `${task.max_interval_days || 0} ${task.max_interval_hours || 0}:${task.max_interval_minutes || 0}:00`;

        let cronString = `${task.minutes} ${task.hours} ${task.DoM} ${task.months} ${task.DoW}`
        // Replace any "All" with "*"
        cronString = cronString.toLowerCase().split(' ').map((field) => {
            if (field === 'all') {
                return '*';
            }
            return field;
        }).join(' ');

        // Validate cron expression
        const regex = /^(\*|([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])|\*\/([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])) (\*|([0-9]|1[0-9]|2[0-3])|\*\/([0-9]|1[0-9]|2[0-3])) (\*|([1-9]|1[0-9]|2[0-9]|3[0-1])|\*\/([1-9]|1[0-9]|2[0-9]|3[0-1])) (\*|([1-9]|1[0-2])|\*\/([1-9]|1[0-2])) (\*|([0-6])|\*\/([0-6]))$/;
        if (!regex.test(cronString)) {
            console.error("The cron expression is not valid!", cronString);
            console.error("This is the task it was build from:", task);
            setInputError(true);
            return;
        }

        setInputError(false);

        const response_data = await updateScheduledTask(
            props.selectedTaskId,
            task.task_name,
            props.selectedHousehold,
            cronString,
            max_interval,
            task.description,
        );

        console.log("Updated scheduled task. Response:", response_data);
        await props.fetchSetTasks();
        // props.closeCurrentPopup();
        props.setCurrentPopup(props.PopupType.TASK_DETAILS);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;

        setTask((prevTask) => {
            const updatedTask = { ...prevTask, [name]: value };

            return updatedTask;
        });
    };

    return (
        <BasePopup onClick={props.handleOverlayClick} ref={ref}>
            <div>
                <h2>Edit Scheduled Task</h2>
                <form className="task-form">

                    <div className="task-input-group" >
                        <input
                            type="text"
                            name="task_name"
                            placeholder="Task Name"
                            onChange={handleInputChange}
                            value={task.task_name}
                        />
                    </div>

                    <div className="input-pair-container">
                        <div className={`task-input-group no-max-width left-align ${inputError ? "input-error" : ""}`}>
                            <label>Minutes: </label>
                            <input
                                type="text"
                                name="minutes"
                                placeholder="'0', or '15,45', or '20-30'"
                                onChange={handleInputChange}
                                value={task.minutes}
                            />
                        </div>
                        <div className={`task-input-group no-max-width left-align ${inputError ? "input-error" : ""}`}>
                            <label>Hours: </label>
                            <input
                                type="text"
                                name="hours"
                                placeholder="'12', or '9,18', or '10-14'"
                                onChange={handleInputChange}
                                value={task.hours}
                            />
                        </div>
                    </div>

                    <div className="input-pair-container">
                        <div className={`task-input-group no-max-width left-align ${inputError ? "input-error" : ""}`}>
                            <label>Day of the month: </label>
                            <input
                                type="text"
                                name="DoM"
                                placeholder="'1', or '1,15' or '10-20'"
                                onChange={handleInputChange}
                                value={task.DoM}
                            />
                        </div>
                        <div className={`task-input-group no-max-width left-align ${inputError ? "input-error" : ""}`}>
                            <label>Day of the week: </label>
                            <input
                                type="text"
                                name="DoW"
                                placeholder="'7', or '6,7', or '1-5'"
                                onChange={handleInputChange}
                                value={task.DoW}
                            />
                        </div>
                    </div>

                    <div className="input-pair-container">
                        <div className={`task-input-group no-max-width left-align ${inputError ? "input-error" : ""}`}>
                            <label>Months: </label>
                            <input
                                type="text"
                                name="months"
                                placeholder="'6', or '1,3,6,9', or '3-9'"
                                onChange={handleInputChange}
                                value={task.months}
                            />
                        </div>
                    </div>

                    <div className="task-input-group task-input-group-horizontal">
                        <label>Overdue after: </label>
                        <input
                            className={inputError ? "input-error" : ""}
                            type="number"
                            min="0"
                            name="max_interval_days"
                            placeholder="Days"
                            onChange={handleInputChange}
                            value={task.max_interval_days}
                        />
                        <input
                            className={inputError ? "input-error" : ""}
                            type="number"
                            min="0"
                            name="max_interval_hours"
                            placeholder="Hours"
                            onChange={handleInputChange}
                            value={task.max_interval_hours}
                        />
                        <input
                            className={inputError ? "input-error" : ""}
                            type="number"
                            min="0"
                            name="max_interval_minutes"
                            placeholder="Minutes"
                            onChange={handleInputChange}
                            value={task.max_interval_minutes}
                        />
                    </div>

                    <div className="task-input-group">
                        <input
                            type="text"
                            name="description"
                            placeholder="Description"
                            onChange={handleInputChange}
                            value={task.description}
                        />

                    </div>

                    <div>
                        <button
                            className="button edit-button"
                            onClick={handleEditTask}
                        >
                            Update Task
                        </button>
                    </div>
                </form>
            </div>
        </BasePopup>
    );
});

EditScheduledTaskPopup.displayName = "EditScheduledTaskPopup";

export default EditScheduledTaskPopup;

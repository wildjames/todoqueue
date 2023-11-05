import axios from './axiosConfig';
import { backend_url } from './backend_url';


// Get all the tasks for this household
export const fetchTasks = async (selectedHousehold) => {
    if (!selectedHousehold) {
        return [];
    }

    const list_tasks_url = `${backend_url}/api/all-tasks/?household=${selectedHousehold}`;
    console.log("Fetching Tasks...");

    try {
        const response = await axios.get(list_tasks_url, {
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (response.status !== 200) {
            console.log("Failed to fetch tasks.");
            return [];
        }

        let data = response.data;
        if (!data) {
            console.log("No data fetched for tasks");
            return [];
        }

        console.log("Fetched tasks:", data);
        // Sort by mean completion time, which is just the number of seconds
        data.sort((a, b) => (a.mean_completion_time - b.mean_completion_time));
        console.log("Sorted tasks:", data);
        return data;

    } catch (error) {
        console.error("Error fetching tasks:", error);
        return [];
    }
};


// Get information about a specific task
export const fetchSelectedTask = async (selectedTaskId, selectedHousehold) => {
    const list_tasks_url = `${backend_url}/api/all-tasks/${selectedTaskId}/?household=${selectedHousehold}`;
    console.log("Fetching selected task...");

    const response = await axios.get(list_tasks_url, {
        headers: {
            'Content-Type': 'application/json',
        },
    });

    console.log("Selected task data: ", response);
    return response.data;
};


export const fetchBrowniePointValue = async (
    taskId,
    completionTimeString,
    grossness,
) => {
    const calculate_brownie_points_url = backend_url + "/api/calculate_brownie_points/";
    const payload = {
        task_id: taskId,
        completion_time: completionTimeString,
        grossness
    };
    console.log("Fetching brownie points from server");
    console.log("Payload: ", payload);

    // Get the value of this tasks' brownie_points from the server
    let brownie_points = 0;
    try {
        const response = await axios.post(
            calculate_brownie_points_url,
            JSON.stringify(payload),
            {
                headers: {
                    'Content-Type': 'application/json',
                }
            }
        );

        brownie_points = response.data.brownie_points;

    } catch (error) {
        console.error('Error:', error);
        return 0;
    }

    // Convert brownie points from a string of a float to an integer
    brownie_points = Math.round(parseFloat(brownie_points));
    console.log("Brownie points: ", brownie_points);

    return brownie_points
}


export const createWorkLog = async (
    selectedHousehold,
    selectedTaskId,
    completionTimeString,
    completionUsers,
    grossness,
) => {

    if (!selectedHousehold) {
        console.log("No household selected");
        return;
    }

    const brownie_points = await fetchBrowniePointValue(
        selectedTaskId,
        completionTimeString,
        grossness,
    );

    // pop each user off the list of completionUsers and create a worklog for each
    for (const completionUser of completionUsers) {
        const worklog = {
            task_id: selectedTaskId,
            user: completionUser,
            completion_time: completionTimeString,
            grossness,
            brownie_points
        };

        console.log("Creating worklog: ", worklog);

        // Make a POST request to create a new WorkLog entry
        try {
            const response = await axios.post(
                `${backend_url}/api/worklogs/`,
                JSON.stringify(worklog),
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });
            if (response.status !== 201) {
                console.log("Failed to create worklog.");
                return;
            }
            console.log('WorkLog created: ', response.data);
        } catch (error) {
            console.error('Error: ', error);
        }
    }

    // Clear the list of completionUsers and close the popup
    completionUsers.length = 0;

    return brownie_points;
};

export const awardBrowniePoints = async (
    householdId,
    browniePoints,
    completionUsers,
) => {
    let task_id = null;
    try {
        const response = await axios.get(
            `${backend_url}/api/households/${householdId}/get_dummy_task_id/`,
        );

        if (response.status === 200) {
            task_id = response.data.task_id;
        } else {
            throw new Error("Failed to get dummy task id");
        }
    } catch (error) {
        console.error("Error fetching :", error);
        return error.response ? error.response.data : error.message;
    }

    // pop each user off the list of completionUsers and create a worklog for each
    for (const completionUser of completionUsers) {
        const worklog = {
            task_id,
            user: completionUser,
            completion_time: "0:00:00",
            grossness: 0,
            brownie_points: browniePoints,
        };

        console.log("Creating dummy worklog: ", worklog);

        // Make a POST request to create a new WorkLog entry
        try {
            const response = await axios.post(
                `${backend_url}/api/worklogs/`,
                JSON.stringify(worklog),
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });
            if (response.status !== 201) {
                console.log("Failed to create dummy worklog.");
                return;
            }
            console.log('Dummy workLog created: ', response.data);
        } catch (error) {
            console.error('Error: ', error);
        }
    }

    // Clear the list of completionUsers and close the popup
    completionUsers.length = 0;

    return browniePoints;
};

export const createFlexibleTask = async (
    task_name,
    household,
    max_interval,
    min_interval,
    description,
) => {
    const createTaskUrl = `${backend_url}/api/flexible-tasks/`;

    const newTask = {
        task_name,
        household,
        max_interval,
        min_interval,
    };

    // Description is optional
    if (description) {
        newTask.description = description;
    }

    console.log("Creating a new task");
    console.log("newTask: ", newTask);

    const res = await axios.post(
        createTaskUrl,
        JSON.stringify(newTask),
        {
            headers: {
                'Content-Type': 'application/json',
            },
        });


    if (res.status !== 201) {
        console.log("Failed to create task.");
        return res;
    }

    return res;
};

export const updateFlexibleTask = async (
    taskId,
    task_name,
    household,
    max_interval,
    min_interval,
    description,
) => {
    const updateTaskUrl = `${backend_url}/api/flexible-tasks/${taskId}/?household=${household}`;

    const updatedTask = {
        task_name,
        household,
        max_interval,
        min_interval,
    };

    // Description is optional
    if (description) {
        updatedTask.description = description;
    }

    console.log("Updating the task");
    console.log("updatedTask: ", updatedTask);

    const res = await axios.put(
        updateTaskUrl,
        JSON.stringify(updatedTask),
        {
            headers: {
                'Content-Type': 'application/json',
            },
        });

    if (res.status !== 200) {
        console.log("Failed to update task.");
        return;
    }

    return res.data;
};

export const deleteFlexibleTask = async (
    taskId,
    selectedHousehold,
) => {
    const deleteTaskUrl = `${backend_url}/api/flexible-tasks/${taskId}/?household=${selectedHousehold}`;

    console.log("Deleting task");
    console.log("deleteTaskUrl: ", deleteTaskUrl);
    console.log("taskId: ", taskId);

    const res = await axios.delete(
        deleteTaskUrl,
        {
            headers: {
                'Content-Type': 'application/json',
            },
        });


    if (res.status !== 204) {
        console.log("Failed to delete task: ", res);
        return false;
    }
    console.log("Deleted task with ID: ", taskId);
    return true;
};


export const createScheduledTask = async (
    task_name,
    household,
    cronString,
    max_interval,
    description,
) => {
    const createTaskUrl = `${backend_url}/api/scheduled-tasks/`;

    const newTask = {
        task_name,
        household,
        cron_schedule: cronString,
        max_interval,
    };

    if (description) {
        newTask.description = description;
    }

    console.log("Creating a new task");
    console.log("newTask: ", newTask);

    const res = await axios.post(
        createTaskUrl,
        JSON.stringify(newTask),
        {
            headers: {
                'Content-Type': 'application/json',
            },
        });

    if (res.status !== 201) {
        console.log("Failed to create task.");
        return;
    }

    return res.data;
};


export const updateScheduledTask = async (
    taskId,
    task_name,
    household,
    cronString,
    max_interval,
    description,
) => {
    const updateTaskUrl = `${backend_url}/api/scheduled-tasks/${taskId}/?household=${household}`;

    const updatedTask = {
        task_name,
        household,
        cron_schedule: cronString,
        max_interval,
    };

    // Description is optional
    if (description) {
        updatedTask.description = description;
    }

    console.log("Updating the scheduled task");
    console.log("updatedTask: ", updatedTask);

    const res = await axios.put(
        updateTaskUrl,
        JSON.stringify(updatedTask),
        {
            headers: {
                'Content-Type': 'application/json',
            },
        });

    if (res.status !== 200) {
        console.log("Failed to update scheduled task.");
        return;
    }

    return res.data;
};


export const deleteScheduledTask = async (
    taskId,
    selectedHousehold,
) => {
    const deleteTaskUrl = `${backend_url}/api/scheduled-tasks/${taskId}/?household=${selectedHousehold}`;

    console.log("Deleting scheduled task");
    console.log("deleteTaskUrl: ", deleteTaskUrl);
    console.log("taskId: ", taskId);

    const res = await axios.delete(
        deleteTaskUrl,
        {
            headers: {
                'Content-Type': 'application/json',
            },
        }
    );

    if (res.status !== 204) {
        console.log("Failed to delete scheduled task: ", res);
        return false;
    }
    console.log("Deleted scheduled task with ID: ", taskId);
    return true;
};


export const freezeTask = async (taskId) => {
    const freezeTaskUrl = `${backend_url}/api/toggle_frozen/${taskId}/`;

    console.log("Freezing task");
    console.log("freezeTaskUrl: ", freezeTaskUrl);
    console.log("taskId: ", taskId);

    const res = await axios.post(
        freezeTaskUrl,
        {},
        {
            headers: {
                'Content-Type': 'application/json',
            },
        });

    if (res.status !== 200) {
        console.log("Failed to freeze task.");
        return false;
    }
    console.log("Froze task with ID: ", taskId);
    return true;
};


export const deleteTask = async (taskId, selectedHousehold) => {
    const deleteTaskUrl = `${backend_url}/api/all-tasks/${taskId}/?household=${selectedHousehold}`;

    console.log("Deleting task");
    console.log("deleteTaskUrl: ", deleteTaskUrl);
    console.log("taskId: ", taskId);

    const res = await axios.delete(
        deleteTaskUrl,
        {
            headers: {
                'Content-Type': 'application/json',
            },
        }
    );

    if (res.status !== 204) {
        console.log("Failed to delete task: ", res);
        return false;
    }
    console.log("Deleted task with ID: ", taskId);
    return true;
};

export const dismissTask = async (taskId, selectedHousehold) => {

    const dismissTaskUrl = `${backend_url}/api/dismiss_task/${taskId}/`;

    console.log("Dismissing task");
    console.log("dismissTaskUrl: ", dismissTaskUrl);
    console.log("taskId: ", taskId);

    const res = await axios.post(
        dismissTaskUrl,
        {},
        {
            headers: {
                'Content-Type': 'application/json',
            },
        });

    if (res.status !== 200) {
        console.log("Failed to dismiss task.");
        return false;
    }
    console.log("Freezed task with ID: ", taskId);
    return true;
}
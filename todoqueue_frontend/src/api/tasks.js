import axios from './axiosConfig';


// Get all the tasks for this household
export const fetchTasks = async (selectedHousehold) => {
    if (!selectedHousehold) {
        return [];
    }

    const list_tasks_url = `/api/tasks/?household=${selectedHousehold}`;
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
    const list_tasks_url = `/api/tasks/${selectedTaskId}/?household=${selectedHousehold}`;
    console.log("Fetching selected task...");

    const response = await axios.get(list_tasks_url, {
        headers: {
            'Content-Type': 'application/json',
        },
    });

    console.log("Selected task data: ", response);
    return response.data;
};



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


    const calculate_brownie_points_url = "/api/calculate_brownie_points/";
    const payload = {
        task_id: selectedTaskId,
        completion_time: completionTimeString,
        grossness
    };
    console.log("Creating work log");
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
        return;
    }

    // Convert brownie points from a string of a float to an integer
    brownie_points = Math.round(parseFloat(brownie_points));
    console.log("Brownie points: ", brownie_points);


    // pop each user off the list of completionUsers and create a worklog for each
    for (const completionUser of completionUsers) {
        const worklog = {
            task: selectedTaskId,
            user: completionUser,
            completion_time: completionTimeString,
            grossness,
            brownie_points
        };

        console.log("Creating worklog: ", worklog);

        // Make a POST request to create a new WorkLog entry
        try {
            const response = await axios.post(
                '/api/worklogs/',
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

export const createTask = async (
    task_name,
    household,
    max_interval,
    min_interval,
    description,
) => {
    const createTaskUrl = `/api/tasks/`;

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
        return;
    }

    return res.data;
};

export const deleteTask = async (
    taskId,
    selectedHousehold,
) => {
    const deleteTaskUrl = `/api/tasks/${taskId}/?household=${selectedHousehold}`;

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

export const freezeTask = async (taskId) => {
    const freezeTaskUrl = `/api/tasks/${taskId}/toggle_frozen/`;

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
    console.log("Freezed task with ID: ", taskId);
    return true;
};

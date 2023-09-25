import axios from './axiosConfig';


export const fetchUsers = async (selectedHousehold) => {
    if (!selectedHousehold) {
        console.log("No household selected - skipping get users.");
        return null;
    }
    const list_users_url = `/api/households/${selectedHousehold}/users/`;

    console.log("Fetching household users");
    const res = await axios.get(
        list_users_url,
        {
            headers: {
                'Content-Type': 'application/json',
            }
        })

    if (res.status !== 200) {
        console.log("Failed to fetch users.");
        return null;
    }
    console.log("Fetched users: ", res.data);

    return res.data;
};


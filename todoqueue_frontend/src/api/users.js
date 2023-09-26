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


export const resetPassword = async (email) => {

    console.log("Resetting password");

    const payload = {
        email: email
    };

    console.log("Sending reset password payload:", payload);

    try {
        const res = await axios.post(
            '/api/forgot_password/',
            payload,
            {
                headers:
                {
                    'Content-Type': 'application/json'
                },
                withCredentials: true
            },
        );
        if (res.status === 200) {
            console.log("Password reset email sent:", res.data);
            return { success: res.data.detail };
        } else {
            console.log("Error during password reset:", res);
            return { error: res.data.detail };
        }

    } catch (error) {
        console.log("Error during password reset:", error);
        return { error: "Error during password reset." };
    }
};
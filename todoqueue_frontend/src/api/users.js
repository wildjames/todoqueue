import axios from './axiosConfig';
import { backend_url } from './backend_url';


export const loginUser = async (email, password) => {
    console.log("Logging in");

    const user = {
        email: email,
        password: password
    };

    let data;
    try {
        const res = await axios.post(
            `${backend_url}/api/token/`,
            user,
            {
                headers:
                {
                    'Content-Type': 'application/json'
                },
                withCredentials: true
            },
        );
        console.log(res);
        data = res.data;
    } catch (error) {
        console.error("Error making the request:", error);
        return { error: "Error logging in, please try again or reset your password." };
    }


    try {
        if (data.access === undefined || data.refresh === undefined) {
            console.log("Error during login, no access or refresh token returned.");
            return { error: "Error logging in, please try again or reset your password." };
        }
        console.log("Login successful, setting access token.", data);
        // Initialize the access & refresh token in localstorage.      
        localStorage.clear();
        localStorage.setItem('access_token', data.access);
        localStorage.setItem('refresh_token', data.refresh);

        axios.defaults.headers.common['Authorization'] = `Bearer ${data['access']}`;
        return { success: "Login successful." };
    } catch (error) {
        console.log("Error during login:", error);
        return { error: "Error logging in, please try again or reset your password." };
    }
};


export const logOutUser = async () => {
    console.log("Logging out user");
    try {
      await axios.post(
        `${backend_url}/api/logout/`,
        {
          refresh_token: localStorage.getItem('refresh_token')
        },
        {
          headers: { 'Content-Type': 'application/json' },
          withCredentials: true
        }
      );

      console.log("Clearing local storage");
      localStorage.clear();
      axios.defaults.headers.common['Authorization'] = null;

      console.log("Redirecting to login page");
      window.location.href = '/login';
    } catch (e) {
      console.log('logout not working', e);
    }
  }


export const fetchHouseholdUsers = async (selectedHousehold) => {
    if (!selectedHousehold) {
        console.log("No household selected - skipping get users.");
        return null;
    }
    const list_users_url = `${backend_url}/api/households/${selectedHousehold}/users/`;

    console.log("Fetching household users");
    try {
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
    } catch (error) {
        console.error("An error occurred while fetching users:", error);
        return null;
    }
};


export const fetchUserData = async () => {
    const get_user_url = `${backend_url}/api/user_info/`;

    console.log("Getting my user data");
    try {
        const res = await axios.get(
            get_user_url,
            {
                headers: {
                    'Content-Type': 'application/json',
                }
            })
        if (res.status !== 200) {
            console.log("Failed to get my user data");
            return null;
        }
        console.log("I got my user data!", res.data);
        return res.data;
    } catch (error) {
        console.error("An error occurred while fetching my user data", error);
        return null;
    }
}


export const forgotPassword = async (email) => {

    console.log("Resetting password");

    const payload = {
        email: email
    };

    console.log("Sending reset password payload:", payload);

    try {
        const res = await axios.post(
            `${backend_url}/api/forgot_password/`,
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


export const resetPassword = async (uid, token, newPassword, confirmPassword) => {
    const payload = {
        new_password: newPassword,
        confirm_new_password: confirmPassword,
    };

    try {
        const res = await axios.post(
            `${backend_url}/api/complete_forgot_password/${uid}/${token}/`,
            payload,
            {
                headers: {
                    'Content-Type': 'application/json'
                },
                withCredentials: true
            },
        );
        return res.data;
    } catch (error) {
        throw error;
    }
};


export const signUp = async (email, username, password) => {
    console.log("Signing up");

    const newUser = {
        email: email,
        username: username,
        password: password
    };

    console.log("Sending new user payload:", newUser);

    try {
        const res = await axios.post(
            `${backend_url}/api/register/`,
            newUser,
            {
                headers:
                {
                    'Content-Type': 'application/json'
                },
                withCredentials: true
            },
        );
        if (res.status === 201) {
            console.log("New user created:", res.data);
            return { "success": "New user created. Please check your email for a verification link."};
        }
        else {
            console.log("The registration response contains an error:", res);
            return {"error": res.data};
        }

    } catch (error) {
        console.log("Error during registration:", error);
        return {"error": "Error during registration."};
    }
};
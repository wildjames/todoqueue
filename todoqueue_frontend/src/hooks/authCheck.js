import { useEffect } from 'react';
import axios from 'axios';
import jwtDecode from 'jwt-decode';

// Only checks when the page loads
const useAuthCheck = () => {
    useEffect(() => {
        console.log("Checking authentication");
        const token = localStorage.getItem('access_token');

        // Check if the token has expired
        if (token) {
            console.log("JWT detected");
            const decodedToken = jwtDecode(token);
            const currentTime = Date.now() / 1000; // Convert to seconds

            if (decodedToken.exp < currentTime) {
                console.log("Token has expired, logging out");
                handleLogout();
            }
        } else {
            console.log("No JWT detected");
            handleLogout();
        }

        console.log("Token is OK!");

        // Add an interceptor to axios to catch 401 responses
        const interceptor = axios.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response && error.response.status === 401) {
                    console.log("Tried to supply an access token. Got an error response: ", error);
                    handleLogout();
                }
                console.log("Got an error response: ", error);
                return Promise.reject(error);
            }
        );

        // Clean up the interceptor when the component is unmounted
        return () => {
            axios.interceptors.response.eject(interceptor);
        };
    }, []);

    const handleLogout = () => {
        console.log("Logging out");
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        // ... any other cleanup tasks
        window.location.href = '/login';
    };
};

export default useAuthCheck;

import axios from "axios";
import jwtDecode from 'jwt-decode';

let refresh = false;

const getCookie = (name) => {
  let value = "; " + document.cookie;
  let parts = value.split("; " + name + "=");
  if (parts.length === 2) return parts.pop().split(";").shift();
};

const getCSRFToken = () => {
  return getCookie("csrftoken");
};

axios.interceptors.request.use(
  config => {
    const csrfToken = getCSRFToken();
    if (csrfToken) {
      console.log("Setting CSRF token: ", csrfToken);
      config.headers['X-CSRFToken'] = csrfToken;
    }
    return config;
  },
  error => Promise.reject(error)
);

axios.interceptors.response.use(
  (resp) => resp,
  async (error) => {
    if (error.response.status === 401 && !refresh) {
      refresh = true;

      const token = localStorage.getItem('access_token');
      if (token) {
        const decodedToken = jwtDecode(token);
        const currentTime = Date.now() / 1000; // Convert to seconds

        if (decodedToken.exp < currentTime) {
          handleLogout();
          return;
        }
      }

      if (localStorage.getItem('refresh_token') === null) {
        handleLogout();
        return;
      }

      console.log("Token out of date. Refreshing using token: ", localStorage.getItem('refresh_token'));

      const response = await axios.post(
        '/api/token/refresh/',
        {
          refresh: localStorage.getItem('refresh_token')
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCSRFToken()
          },
          withCredentials: true
        }
      );

      if (response.status === 200) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${response.data['access']}`;
        localStorage.setItem('access_token', response.data.access);
        localStorage.setItem('refresh_token', response.data.refresh);

        return axios(error.config);
      } else {
        handleLogout();
      }
    }

    refresh = false;
    return Promise.reject(error);
  }
);

const handleLogout = () => {
  localStorage.clear();
  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
};

export default axios;

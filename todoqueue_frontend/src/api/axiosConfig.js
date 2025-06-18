import axios from "axios";
import { backend_url } from "./backend_url";

let refresh = false;

const getCookie = (name) => {
  let value = "; " + document.cookie;
  let parts = value.split("; " + name + "=");
  if (parts.length === 2) return parts.pop().split(";").shift();
};

const getCSRFToken = () => {
  return getCookie("csrftoken");
};

axios.defaults.withCredentials = true;

axios.interceptors.request.use(
  config => {
    const csrfToken = getCSRFToken();
    if (csrfToken) {
      console.log("Setting CSRF token");
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

      if (localStorage.getItem('refresh_token') === null) {
        handleLogout();
        return;
      }

      console.log("Token out of date. Refreshing using token: ", localStorage.getItem('refresh_token'));

      const response = await axios.post(
        backend_url + '/api/token/refresh/',
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

        refresh = false;
        return axios(error.config);
      } else {
        console.log("Failed to refresh token. Logging out.");
        handleLogout();
      }
    }

    refresh = false;
    console.log("Failed to refresh token.", error.response);
    return error.response;
  }
);

const handleLogout = () => {
  localStorage.clear();
  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
};

export default axios;

import axios from "axios";

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

      if (localStorage.getItem('refresh_token') === null) {
        console.log("No refresh token found. Redirecting to login page.");
        localStorage.clear();
        // Dont redirect to login page if already on login page
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
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

      console.log("Refresh response: ", response);

      // if refresh token is valid, update tokens and retry request. Otherwise, redirect to login page.
      if (response.status === 200) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${response.data['access']}`;
        localStorage.setItem('access_token', response.data.access);
        localStorage.setItem('refresh_token', response.data.refresh);

        return axios(error.config);
      } else {
        // redirect to login page
        console.log("Token refresh failed. Redirecting to login page.");
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('username');
        localStorage.removeItem('user_id');
        // window.location.href = '/login';
      }
    }

    refresh = false;
    return error;
  }
);

export default axios;
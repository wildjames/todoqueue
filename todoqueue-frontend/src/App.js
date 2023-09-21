import logo from './logo.svg';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';

import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Route, Routes, BrowserRouter } from 'react-router-dom';

import axios from 'axios';
import { Helmet } from 'react-helmet';

import UserStatistics from './UserStatistics';
import Tasks from './Tasks';
import { Navigation } from './navigation';
import { Login } from './Login';
import { Logout } from './logout';
import { SignUp } from './signup';
import { ForgotPassword } from './forgotPassword';
import { ResetPassword } from './resetPassword';


const apiUrl = process.env.REACT_APP_BACKEND_URL;

const App = () => {
  const [households, setHouseholds] = useState([]);
  const [selectedHousehold, setSelectedHousehold] = useState(null);

  // Try and prevent chrom from translating the page when there are few words on screen
  useEffect(() => {
    document.documentElement.lang = 'en';
    document.documentElement.setAttribute('xml:lang', 'en');
    document.documentElement.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');
  }, []);


  // Fetch households at regular intervals
  useEffect(() => {
    // run immediately, then start a timer that runs every 1000ms
    try {
      fetchHouseholds();
    } catch (error) {
      console.error("An error occurred while fetching data:", error);
    }
    const interval = setInterval(() => {
      fetchHouseholds();
    }, 1000);
    return () => clearInterval(interval);
  }
    , [selectedHousehold, apiUrl]);


  const getCSRFToken = () => {
    const cookieValue = document.cookie.split('; ').find(row => row.startsWith('csrftoken='))?.split('=')[1];

    // if (!cookieValue) {
    //   console.error("CSRF token not found.");
    //   // throw new Error("CSRF token not found.");
    // }

    return cookieValue;
  };


  const fetchHouseholds = () => {
    // Only do this if we are logged in
    if (localStorage.getItem('access_token') === null) {
      return;
    }

    const list_households_url = apiUrl + "/households/";
    axios.get(list_households_url, {
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCSRFToken()
      }
    })
      .then((res) => {
        if (res.status !== 200) {
          console.log("Failed to fetch households.");
          return;
        }
        setHouseholds(res.data);
        if (selectedHousehold === null && res.data.length === 1) {
          console.log("Setting selected household to: ", res.data[0].id);
          setSelectedHousehold(res.data[0].id);
        }
      })
      .catch((error) => {
        console.error("An error occurred while fetching households:", error);
      });
  };


  return (
    <BrowserRouter>
      <Helmet>
        <Helmet>
          <meta charset="UTF-8" />
          <meta name="google" content="notranslate" />
          <meta http-equiv="Content-Language" content="en" />
        </Helmet>
      </Helmet>

      <Navigation
        households={households}
        selectedHousehold={selectedHousehold}
        setSelectedHousehold={setSelectedHousehold}
      ></Navigation>

      <div className="App">
        <Routes>
          <Route path="/user_statistics" element={<UserStatistics selectedHousehold={selectedHousehold} />} />
          <Route path="/" element={<Tasks selectedHousehold={selectedHousehold} />} />
          <Route path="/login" element={<Login />} />
          <Route path="/logout" element={<Logout />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/forgot_password" element={<ForgotPassword />} />
          <Route path="/reset_password/:uid/:token" element={<ResetPassword />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
};

export default App;

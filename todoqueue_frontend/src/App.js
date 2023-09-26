import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';

import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Route, Routes, BrowserRouter } from 'react-router-dom';

import axios from 'axios';
import { Helmet } from 'react-helmet';

import Tasks from './components/Tasks';
import ConfirmRegistration from './components/ConfirmRegistration';
import FailedRegistration from './components/FailedRegistration';
import ForgotPassword from './components/forgotPassword';
import Login from './components/Login';
import { Logout } from './components/logout';

import { Navigation } from './components/navigation';
import { SignUp } from './signup';
import { ResetPassword } from './resetPassword';
import { ManageHouseholds } from './households';
import UserStatistics from './UserStatistics';


const App = () => {
  const [households, setHouseholds] = useState([]);
  const [selectedHousehold, setSelectedHousehold] = useState(null);
  const [showHouseholdSelector, setShowHouseholdSelector] = useState(false);

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
    , [selectedHousehold]);



  const fetchHouseholds = () => {
    // Only do this if we are logged in
    if (localStorage.getItem('access_token') === null) {
      return;
    }

    const list_households_url = "/api/households/";
    axios.get(list_households_url, {
      headers: {
        'Content-Type': 'application/json',
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
        <meta charset="UTF-8" />
        <meta name="google" content="notranslate" />
        <meta http-equiv="Content-Language" content="en" />
      </Helmet>

      <Navigation
        households={households}
        selectedHousehold={selectedHousehold}
        setSelectedHousehold={setSelectedHousehold}
        showHouseholdSelector={showHouseholdSelector}
      ></Navigation>

      <div className="App">
        <Routes>
          <Route path="/user_statistics" element={<UserStatistics selectedHousehold={selectedHousehold} setShowHouseholdSelector={setShowHouseholdSelector} />} />
          <Route path="/" element={<Tasks selectedHousehold={selectedHousehold} setShowHouseholdSelector={setShowHouseholdSelector} />} />
          <Route path="/login" element={<Login setShowHouseholdSelector={setShowHouseholdSelector} />} />
          <Route path="/logout" element={<Logout setShowHouseholdSelector={setShowHouseholdSelector} />} />
          <Route path="/signup" element={<SignUp setShowHouseholdSelector={setShowHouseholdSelector} />} />
          <Route path="/registration_confirmed" element={<ConfirmRegistration />} />
          <Route path="/registration_failed" element={<FailedRegistration />} />
          <Route path="/forgot_password" element={<ForgotPassword setShowHouseholdSelector={setShowHouseholdSelector} />} />
          <Route path="/reset_password/:uid/:token" element={<ResetPassword setShowHouseholdSelector={setShowHouseholdSelector} />} />
          <Route path="/manage_households" element={<ManageHouseholds households={households} setShowHouseholdSelector={setShowHouseholdSelector} />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
};

export default App;

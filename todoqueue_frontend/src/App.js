import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, BrowserRouter } from 'react-router-dom';

import { Helmet } from 'react-helmet';

import Tasks from './components/tasks/Tasks';
import ConfirmRegistration from './components/ConfirmRegistration';
import FailedRegistration from './components/FailedRegistration';
import ForgotPassword from './components/forgotPassword';
import Login from './components/login/Login';
import { Logout } from './components/logout';
import { fetchHouseholds } from './api/households';
import { Navigation } from './components/navbar/navigation';
import { ResetPassword } from './components/resetPassword';
import { SignUp } from './components/signup';
import { ManageHouseholds } from './components/households/households';
import { Help } from './components/help';


const App = () => {
  const [households, setHouseholds] = useState([]);
  const [selectedHousehold, setSelectedHousehold] = useState("");
  const [showHouseholdSelector, setShowHouseholdSelector] = useState(false);

  // Try and prevent chrome from translating the page when there are few words on screen
  useEffect(() => {
    document.documentElement.lang = 'en';
    document.documentElement.setAttribute('xml:lang', 'en');
    document.documentElement.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');
  }, []);


  // Fetch households at regular intervals
  const updateHouseholds = async () => {
    try {
      const fetchedHouseholds = await fetchHouseholds();

      console.log("Setting households:", fetchedHouseholds);
      setHouseholds(fetchedHouseholds);

      if (selectedHousehold === null && fetchedHouseholds.length === 1) {
        console.log("Setting selected household to: ", fetchedHouseholds[0].id);
        setSelectedHousehold(fetchedHouseholds[0].id);
      }

    } catch (error) {
      console.error("An error occurred while fetching data:", error);
    }
  };

  useEffect(() => {
    updateHouseholds();

    const interval = setInterval(updateHouseholds, 10000);
    return () => clearInterval(interval);
  }, [selectedHousehold]);


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
          <Route path="/" element={
            <Tasks selectedHousehold={selectedHousehold} showSelectedHouseholdSelector={showHouseholdSelector} setShowHouseholdSelector={setShowHouseholdSelector} />} />
          <Route path="/help" element={<Help />} />
          <Route path="/login" element={<Login setShowHouseholdSelector={setShowHouseholdSelector} />} />
          <Route path="/logout" element={<Logout setShowHouseholdSelector={setShowHouseholdSelector} />} />
          <Route path="/signup" element={<SignUp setShowHouseholdSelector={setShowHouseholdSelector} />} />
          <Route path="/registration_confirmed" element={<ConfirmRegistration />} />
          <Route path="/registration_failed" element={<FailedRegistration />} />
          <Route path="/forgot_password" element={<ForgotPassword setShowHouseholdSelector={setShowHouseholdSelector} />} />
          <Route path="/reset_password/:uid/:token" element={<ResetPassword setShowHouseholdSelector={setShowHouseholdSelector} />} />
          <Route path="/manage_households" element={<ManageHouseholds households={households} updateHouseholds={updateHouseholds} setShowHouseholdSelector={setShowHouseholdSelector} />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
};

export default App;

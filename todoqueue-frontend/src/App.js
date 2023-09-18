import logo from './logo.svg';
import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Route, Routes, BrowserRouter } from 'react-router-dom';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import UserStatistics from './UserStatistics';
import Tasks from './Tasks';
import { Navigation } from './navigation';
import { Login } from './Login';
import { Logout } from './logout';

const App = () => {
  return (
    <BrowserRouter>
      <Navigation></Navigation>

      <div className="App">
        <Routes>
          <Route path="/user_statistics" element={<UserStatistics />} />
          <Route path="/" element={<Tasks />} />
          <Route path="/login" element={<Login />} />
          <Route path="/logout" element={<Logout />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
};

export default App;

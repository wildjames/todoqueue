import logo from './logo.svg';
import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './App.css';
import UserStatistics from './UserStatistics';
import Tasks from './Tasks';  // homepage

const App = () => {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/user_statistics" element={<UserStatistics />} />
          <Route path="/" element={<Tasks />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;

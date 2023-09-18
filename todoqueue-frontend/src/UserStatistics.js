import React, { useState, useEffect } from 'react';
import axios from 'axios';  // Assuming you are using axios for HTTP requests

const UserStatistics = () => {
  const [statistics, setStatistics] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Replace with your API endpoint URL
    axios.get('/api/user_statistics/')
      .then(res => {
        setStatistics(res.data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Error fetching data:", err);
        setIsLoading(false);
      });
  }, []);

  return (
    <div>
      <h1>User Statistics</h1>
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <div>
          {statistics.map(user => (
            <div key={user.username}>
              <h2>{user.username}</h2>
              <p>Total Brownie Points: {user.brownie_points}</p>
              <h3>Completed Tasks</h3>
              <ul>
                {user.completed_tasks.map(task => (
                  <li key={task.timestamp}>
                    {task.task_name} at {task.timestamp} - {task.completion_time} seconds - Grossness: {task.grossness} - Brownie Points: {task.brownie_points}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserStatistics;

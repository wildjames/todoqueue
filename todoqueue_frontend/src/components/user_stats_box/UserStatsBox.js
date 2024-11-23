import React from 'react';
import { SimpleFlipper } from '../flipper/flipper';

import './UserStatsBox.css';


const UserStatsBox = ({ selectedHousehold, windowWidth, viewMode, setViewMode, users, handleOpenAwardBrowniePointsPopup }) => {
    if (!selectedHousehold || windowWidth <= 800 || users.length === 0) {
        return null;
    }

    const sortedUsers = viewMode === 'total'
        ? users.sort((a, b) =>
            (b.brownie_point_credit[selectedHousehold] - b.brownie_point_debit[selectedHousehold])
            - (a.brownie_point_credit[selectedHousehold] - a.brownie_point_debit[selectedHousehold])
        )
        : users.sort((a, b) => b.rolling_brownie_points - a.rolling_brownie_points);

    return (
        <div className="user-stats-container">
            <div className="toggle-switch">
                <input
                    type="checkbox"
                    id="viewModeSwitch"
                    checked={viewMode === 'rolling'}
                    onChange={() => setViewMode(prevMode => prevMode === 'total' ? 'rolling' : 'total')}
                />
                <label htmlFor="viewModeSwitch">
                    {viewMode === "total" ? "All Time" : "Last 7 days"}
                </label>
            </div>
            <div className="user-stats-flex" onClick={handleOpenAwardBrowniePointsPopup}>
                {sortedUsers.slice(0, 5).map((user) => (
                    <div key={user.id} className="user-row">
                        <span className="user-name">{user.username}</span>
                        <SimpleFlipper
                            value={viewMode === 'total'
                                ? user.brownie_point_credit[selectedHousehold] - user.brownie_point_debit[selectedHousehold]
                                : user.rolling_brownie_points}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default UserStatsBox;

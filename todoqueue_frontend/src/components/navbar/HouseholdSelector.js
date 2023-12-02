import React from 'react';

export function HouseholdSelector({ households, selectedHousehold, setSelectedHousehold }) {
    return (
        <div className="navbar-center-panel">
            <select
                id="household-select"
                className="household-select"
                onChange={e => setSelectedHousehold(e.target.value)}
                value={selectedHousehold}
                aria-label="Select a household"
            >
                <option value="" disabled hidden>Select a household</option>
                {households.map(household => (
                    <option key={household.id} value={household.id}>{household.name}</option>
                ))}
            </select>
        </div>
    );
}

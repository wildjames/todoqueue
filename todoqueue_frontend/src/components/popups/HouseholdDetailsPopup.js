import React, { useEffect, useState, useRef } from 'react';

import BasePopup from './BasePopup';
import { fetchUsers } from '../../api/users';
import { addUserToHousehold, removeUserFromHousehold, fetchSelectedHousehold } from '../../api/households';

import Spinner from '../spinner/Spinner';
import AlertMessage from "./AlertPopup";


const HouseholdDetailsPopup = React.forwardRef((props, ref) => {
    const [users, setUsers] = useState([]);
    const [userEmail, setUserEmail] = useState('');

    const [showSpinner, setShowSpinner] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");


    const updateUsers = async (id) => {
        try {
            const users = await fetchUsers(id);
            setUsers(users);
        } catch (error) {
            console.error("An error occurred while fetching data:", error);
        }
    }


    // Fetch users for the selected household at regular intervals
    useEffect(() => {
        if (props.selectedHousehold) {
            updateUsers(props.selectedHousehold.id);
        }
        const interval = setInterval(() => {
            if (props.selectedHousehold) {
                updateUsers(props.selectedHousehold.id);
            }
        }, 500);
        return () => clearInterval(interval);
    }, [props.selectedHousehold]);


    const handleAddUser = async () => {
        console.log("Adding user:", userEmail);

        const promise = addUserToHousehold(props.selectedHousehold.id, userEmail);

        setShowSpinner(true);
        setErrorMessage("");
        const data = await promise;
        setShowSpinner(false);

        if (data.error) {
            setErrorMessage(data.error);
        }
        else if (data.success) {
            console.log("Successfully added user to household");
        }

        setUserEmail('');
    };


    const handleRemoveUser = async (email) => {
        // Logic to remove user with userId from props.selectedHousehold
        console.log("Removing user:", email);

        const promise = removeUserFromHousehold(props.selectedHousehold.id, email);

        setShowSpinner(true);
        setErrorMessage("");
        const data = await promise;
        setShowSpinner(false);

        if (data.error) {
            setErrorMessage(data.error);
        }
        else if (data.success) {
            console.log("Successfully removed user from household");
        }
    };


    return (
        <BasePopup onClick={props.handleOverlayClick} ref={ref}>
            <div>
                <h2>{props.selectedHousehold.name}</h2>

                <div>
                    <input
                        type="text"
                        placeholder="Enter user email"
                        value={userEmail}
                        onChange={(e) => setUserEmail(e.target.value)}
                        style={{ border: "3px solid rgb(143, 143, 143)", borderRadius: "7px" }}
                    />
                    <button
                        className="button add-user-button"
                        onClick={handleAddUser}
                    >
                        Add User
                    </button>
                </div>

                {
                    errorMessage !== '' &&
                    <AlertMessage message={errorMessage} />
                }

                {showSpinner && <Spinner />}

                <ul className="users-list">
                    {users.map((user) => (
                        <li key={user.id}>
                            {user.username}
                            <button
                                className="button remove-user-button"
                                onClick={() => handleRemoveUser(user.email)}
                            >
                                Remove
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        </BasePopup>
    );
});

export default HouseholdDetailsPopup;

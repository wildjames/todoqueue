import React, { useEffect, useState } from 'react';

import BasePopup from './BasePopup';
import { fetchHouseholdUsers } from '../../api/users';
import { inviteUserToHousehold, removeUserFromHousehold } from '../../api/households';

import Spinner from '../spinner/Spinner';
import AlertMessage from "./AlertPopup";
import './popups.css';

const HouseholdDetailsPopup = React.forwardRef((props, ref) => {
    const [users, setUsers] = useState([]);
    const [userEmail, setUserEmail] = useState('');
    // const [invitations, setInvitations] = useState([]);

    const [showSpinner, setShowSpinner] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");


    // const updateInvitations = async (id) => {
    //     try {
    //         const pendingInvitations = await fetchPendingInvitations();
    //         setInvitations(pendingInvitations);
    //     } catch (error) {
    //         console.error("An error occurred while fetching data:", error);
    //         setErrorMessage("Failed to fetch data.");
    //     }
    // };


    const handleInviteUser = async () => {
        console.log("Inviting user:", userEmail);

        const data = await inviteUserToHousehold(props.selectedHousehold.id, userEmail);

        console.log("Tried to invite user. Got back: ", data);

        if (data.error) {
            setErrorMessage(data.error);
        } else if (data.success) {
            console.log("Successfully sent invitation to user");
            setUserEmail('');
            setErrorMessage("Invitation sent!");
            const interval = setInterval(() => {
                setErrorMessage("");
            }, 3000);
            return () => clearInterval(interval);
        }
    };


    const updateUsers = async (id) => {
        try {
            console.log("Fetching users");
            const users = await fetchHouseholdUsers(id);
            if (users === null) {
                console.log("Closing popup");
                props.closePopup();
            }
            setUsers(users);
        } catch (error) {
            console.error("An error occurred while fetching data:", error);
            props.closePopup();
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.selectedHousehold]);


    const handleRemoveUser = async (email) => {
        // Logic to remove user with userId from props.selectedHousehold
        console.log("Removing user:", email);

        const promise = removeUserFromHousehold(props.selectedHousehold.id, email);

        setShowSpinner(true);
        setErrorMessage("");
        const data = await promise;
        setShowSpinner(false);
        updateUsers(props.selectedHousehold.id);

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
                        placeholder="Enter user email to invite"
                        value={userEmail}
                        onChange={(e) => setUserEmail(e.target.value)}
                        style={{ border: "3px solid rgb(143, 143, 143)", borderRadius: "7px" }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                handleInviteUser();
                            }
                        }}
                    />
                    <button
                        className="button add-user-button"
                        onClick={handleInviteUser}
                    >
                        Invite User
                    </button>
                </div>

                {
                    errorMessage !== '' &&
                    <AlertMessage message={errorMessage} />
                }

                {showSpinner && <Spinner />}

                <ul className="household-users-list">
                    {users.map((user) => (
                        <li key={user.id} className="household-user-item">
                            <div className="household-user-content">
                                <span className='household-user-name'>{user.username}</span>
                                <button
                                    className="button remove-user-button"
                                    onClick={() => handleRemoveUser(user.email)}
                                >
                                    Remove
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </BasePopup>
    );
});

HouseholdDetailsPopup.displayName = 'HouseholdDetailsPopup';

export default HouseholdDetailsPopup;

import { useEffect, useState, useRef } from "react";
import useAuthCheck from './hooks/authCheck';

import Spinner from './components/spinner/Spinner';
import AlertMessage from "./components/popups/AlertPopup";

import { fetchUsers } from './api/users';
import { createHousehold, deleteHousehold, addUserToHousehold, removeUserFromHousehold } from './api/households';

export const ManageHouseholds = ({ households, setShowHouseholdSelector }) => {
    const [users, setUsers] = useState([]);
    const [name, setName] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [showUsersPopup, setShowUsersPopup] = useState(false);
    const [selectedHousehold, setSelectedHousehold] = useState(null);
    const [userEmail, setUserEmail] = useState('');
    const [showSpinner, setShowSpinner] = useState(false);

    const popupInnerRef = useRef(null);

    useAuthCheck();

    useEffect(() => {
        setShowHouseholdSelector(false);
    }, []);


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
        const interval = setInterval(() => {
            if (selectedHousehold) {
                updateUsers(selectedHousehold.id);
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [selectedHousehold]);


    // TODO: refactor to use popup framework
    const handleOpenUsersPopup = (household) => {
        console.log("Opening users popup for household:", household);
        setSelectedHousehold(household);
        updateUsers(household.id);
        setShowUsersPopup(true);
    };


    const handleOverlayClick = (e) => {
        if (popupInnerRef.current && !popupInnerRef.current.contains(e.target)) {
            console.log("Clicked outside of popup");
            setShowUsersPopup(false);
            setSelectedHousehold(null);
            setUserEmail('');
        }
        console.log("Clicked inside of popup");
    };


    const handleCreate = async () => {
        console.log("Creating household:", name);
        const promise = createHousehold(name);

        setShowSpinner(true);
        setErrorMessage("");
        const data = await promise;
        setShowSpinner(false);
        setName("");

        if (data.error) {
            setErrorMessage(data.error);
        } else if (data.success) {
            console.log("Successfully created household");
        }
    };


    const handleDelete = async (id) => {
        console.log("Deleting household:", id);
        const promise = deleteHousehold(id);

        setShowSpinner(true);
        setErrorMessage("");
        const data = await promise;
        setShowSpinner(false);

        if (data.error) {
            setErrorMessage(data.error);
        } else if (data.success) {
            console.log("Successfully deleted household");
        }
    };


    const handleAddUser = async () => {
        console.log("Adding user:", userEmail);

        const promise = addUserToHousehold(selectedHousehold.id, userEmail);

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
        // Logic to remove user with userId from selectedHousehold
        console.log("Removing user:", email);

        const promise = removeUserFromHousehold(selectedHousehold.id, email);

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
        <div className="Households">

            <div className="household-container">

                <h2>Manage Households</h2>

                <div className="input-group">
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter household name"
                        className="input-field"
                    />
                    <button className="button create-button" onClick={handleCreate}>Create</button>
                </div>

                <div>
                    {households.map((household) => (
                        <div className="household-wrapper" key={household.id}>
                            <span className="household-name">
                                {household.name}
                            </span>
                            <div>
                                <button className="button delete-button" onClick={() => handleDelete(household.id)}>Delete</button>
                                <button className="button manage-users-button" onClick={() => handleOpenUsersPopup(household)}>Manage Users</button>
                            </div>
                        </div>
                    ))}
                </div>

                {showUsersPopup && selectedHousehold && (
                    <div className="popup" style={{ width: "150%", }} onClick={handleOverlayClick}>
                        <div className="popup-inner" ref={popupInnerRef}>
                            <h2>Manage Users for {selectedHousehold.name}</h2>

                            <div className="input-group">
                                <input
                                    type="text"
                                    placeholder="Enter user's email"
                                    value={userEmail}
                                    onChange={(e) => setUserEmail(e.target.value)}
                                />
                                <button className="button add-user-button" onClick={handleAddUser}>Add User</button>
                            </div>

                            <ul className="users-list">
                                {users.map((user) => (
                                    <li key={user.id}>
                                        {user.username}
                                        <button className="button remove-user-button" onClick={() => handleRemoveUser(user.email)}>Remove</button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}

                {
                    errorMessage !== '' &&
                    <AlertMessage message={errorMessage} />
                }

                {showSpinner && <Spinner />}

            </div>
        </div>
    );

};

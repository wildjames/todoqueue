import axios from "axios";
import { useEffect, useState, useRef } from "react";


export const ManageHouseholds = ({ households, setShowHouseholdSelector }) => {
    const [users, setUsers] = useState([]);
    const [name, setName] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [showUsersPopup, setShowUsersPopup] = useState(false);
    const [selectedHousehold, setSelectedHousehold] = useState(null);
    const [userEmail, setUserEmail] = useState('');

    const popupInnerRef = useRef(null);

    useEffect(() => {
        setShowHouseholdSelector(false);
    }, []);


    // Fetch users at regular intervals
    useEffect(() => {
        // run immediately, then start a timer that runs every 1000ms
        try {
            fetchUsers();
        } catch (error) {
            console.error("An error occurred while fetching data:", error);
        }
        const interval = setInterval(() => {
            fetchUsers();
        }, 1000);
        return () => clearInterval(interval);
    }
    , [selectedHousehold]);
    
    
    const handleOpenUsersPopup = (household) => {
        console.log("Opening users popup for household:", household);
        setSelectedHousehold(household);
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
    
    
    // TODO: Fetch users from the App component and pass them down as props
    const fetchUsers = () => {
        if (!selectedHousehold) {
            console.log("No household selected");
            return;
        }

        axios.get(`/api/households/${selectedHousehold.id}/users/`,
            {
                headers: {
                    'Content-Type': 'application/json',
                }
            })
            .then((res) => {
                if (res.status !== 200) {
                    console.log("Failed to fetch users.");
                    return;
                }
                setUsers(res.data);
            })
            .catch((error) => {
                console.error("An error occurred while fetching data:", error);
            });
    };


    const handleCreate = async () => {
        try {
            // Get the logged in user
            const res = await axios.post("/api/create_household/",
                {
                    name: name
                },
                {
                    headers: { "Content-Type": "application/json" },
                    withCredentials: true
                }
            );
            console.log("Created household:", res);

            setName("");
        } catch (error) {
            console.error("Failed to create household:", error);
            setErrorMessage("Failed to create household.");
        }
    };


    const handleDelete = async (id) => {
        try {
            await axios.delete("/api/households/" + id + "/", {
                withCredentials: true
            });

        } catch (error) {
            console.error("Failed to delete household:", error);
            setErrorMessage("Failed to delete household.");
        }
    };


    // TODO: Fill in this request logic
    const handleAddUser = () => {
        // Logic to add user based on userEmail to selectedHousehold
        console.log("Adding user:", userEmail);
        setUserEmail('');
    };


    // TODO: Fill in this request logic
    const handleRemoveUser = (userId) => {
        // Logic to remove user with userId from selectedHousehold
        console.log("Removing user:", userId);
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
                            <button className="button delete-button" onClick={() => handleDelete(household.id)}>Delete</button>
                            <button className="button manage-users-button" onClick={() => handleOpenUsersPopup(household)}>Manage Users</button>
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


                {errorMessage && (
                    <div className="error-message">
                        <h3>{errorMessage}</h3>
                    </div>
                )}

            </div>
        </div>
    );

};

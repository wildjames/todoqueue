import { React, useEffect, useState, useRef } from "react";
import useAuthCheck from '../../hooks/authCheck';

import AlertMessage from "../popups/AlertPopup";

import { createHousehold, fetchPendingInvitations, acceptInvitation, declineInvitation } from '../../api/households';
import HouseholdDetailsPopup from "../popups/HouseholdDetailsPopup";

import './households.css';
import '../../utils/inputs.css';

export const ManageHouseholds = ({ households, updateHouseholds, setShowHouseholdSelector }) => {
    const [selectedHousehold, setSelectedHousehold] = useState("");
    const [invitations, setInvitations] = useState([]);

    const [name, setName] = useState("");

    const [errorMessage, setErrorMessage] = useState("");

    const PopupType = {
        NONE: "NONE",
        HOUSEHOLD_DETAILS: "HOUSEHOLD_DETAILS",
    };
    const [currentPopup, setCurrentPopup] = useState(PopupType.NONE);
    // This ref detects when the user clicks outside of the popup
    const popupInnerRef = useRef(null);


    useAuthCheck();

    useEffect(() => {
        setShowHouseholdSelector(false);
        loadPendingInvitations();

        const invitationCheckInterval = setInterval(() => {
            loadPendingInvitations();
        }, 2500);

        // Clear the interval when the component unmounts
        return () => clearInterval(invitationCheckInterval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);


    const loadPendingInvitations = async () => {
        console.log("Fetching invitations for this user");
        try {
            const pendingInvites = await fetchPendingInvitations();
            setInvitations(pendingInvites);
        } catch (error) {
            console.error("Error fetching pending invitations:", error);
            setErrorMessage("Failed to load pending invitations.");
        }
    };


    const handleCreate = async () => {
        console.log("Creating household:", name);
        const promise = createHousehold(name);

        setErrorMessage("");
        const data = await promise;
        setName("");

        if (data.error) {
            setErrorMessage(data.error);
        } else if (data.success) {
            console.log("Successfully created household");
        }

        console.log("Updating household list");
        updateHouseholds();
    };


    // const handleDelete = async (id) => {
    //     console.log("Deleting household:", id);
    //     const promise = deleteHousehold(id);

    //     setErrorMessage("");
    //     const data = await promise;


    //     if (data.error) {
    //         setErrorMessage(data.error);
    //     } else if (data.success) {
    //         console.log("Successfully deleted household");
    //     }

    //     console.log("Updating household list");
    //     updateHouseholds();
    // };


    const handleAcceptInvitation = async (invitationId) => {
        const response = await acceptInvitation(invitationId);
        if (response.error) {
            setErrorMessage(response.error);
        } else {
            loadPendingInvitations();
        }
        updateHouseholds();
    };


    const handleDeclineInvitation = async (invitationId) => {
        const response = await declineInvitation(invitationId);
        if (response.error) {
            setErrorMessage(response.error);
        } else {
            loadPendingInvitations();
        }
        updateHouseholds();
    };


    const handleOpenUsersPopup = (household) => {
        console.log("Opening users popup for household:", household);
        setSelectedHousehold(household);
        setCurrentPopup(PopupType.HOUSEHOLD_DETAILS);
    };


    const handleOverlayClick = (e) => {
        if (popupInnerRef.current && !popupInnerRef.current.contains(e.target)) {
            console.log("Clicked outside of popup");
            setCurrentPopup(PopupType.NONE);

            setSelectedHousehold("");

            console.log("Updating household list");
            updateHouseholds();
        }
        console.log("Clicked inside of popup");
    };


    const closePopup = () => {
        console.log("Closing popup");
        setCurrentPopup(PopupType.NONE);
        setSelectedHousehold("");
        updateHouseholds();
    };


    const propsForHouseholdDetails = {
        selectedHousehold,
        handleOverlayClick,
        closePopup,
    };


    return (
        <div className="Households">

            <h2>Manage Households</h2>

            {
                errorMessage !== '' &&
                <AlertMessage message={errorMessage} />
            }

            {
                (() => {
                    switch (currentPopup) {
                        case PopupType.HOUSEHOLD_DETAILS:
                            return <HouseholdDetailsPopup
                                ref={popupInnerRef}
                                {...propsForHouseholdDetails}
                            />;
                        default:
                            return null;
                    }
                }
                )()
            }

            <div>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter household name"
                    className="input-field"
                    style={{ border: "3px solid #fff" }}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            handleCreate();
                        }
                    }}
                />
                <button className="button create-button" onClick={handleCreate}>Create</button>
            </div>


            {
                (invitations.length > 0) &&
                <div className="invitations-section">
                    <h3>Pending Invitations</h3>
                    {invitations.map((invitation) => (
                        <div key={invitation.id} className="invitation-item">
                            <span>{invitation.household.name} invited by {invitation.sender.email}</span>
                            <button className="button complete-button" onClick={() => handleAcceptInvitation(invitation.id)}>
                                Accept
                            </button>
                            <button className="button unfreeze-button" onClick={() => handleDeclineInvitation(invitation.id)}>
                                Decline
                            </button>
                        </div>
                    ))}
                </div>
            }


            <div>
                {
                    households.map((household) => (
                        <div className="household-wrapper" key={household.id}>
                            <span className="household-name">
                                {household.name}
                            </span>
                            <div>
                                {/* <button className="button delete-button" onClick={() => handleDelete(household.id)}>Delete</button> */}
                                <button className="button manage-users-button" onClick={() => handleOpenUsersPopup(household)}>Manage Users</button>
                            </div>
                        </div>
                    ))
                }
            </div>

        </div>
    );

};

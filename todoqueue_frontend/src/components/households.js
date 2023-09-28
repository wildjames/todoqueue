import { useEffect, useState, useRef } from "react";
import useAuthCheck from '../hooks/authCheck';

import Spinner from './spinner/Spinner';
import AlertMessage from "./popups/AlertPopup";

import { createHousehold, deleteHousehold } from '../api/households';
import HouseholdDetailsPopup from "./popups/HouseholdDetailsPopup";

export const ManageHouseholds = ({ households, setShowHouseholdSelector }) => {
    const [selectedHousehold, setSelectedHousehold] = useState(null);

    const [name, setName] = useState("");

    const [showSpinner, setShowSpinner] = useState(false);
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
    }, []);


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


    const handleOpenUsersPopup = (household) => {
        console.log("Opening users popup for household:", household);
        setSelectedHousehold(household);
        setCurrentPopup(PopupType.HOUSEHOLD_DETAILS);
    };


    const handleOverlayClick = (e) => {
        if (popupInnerRef.current && !popupInnerRef.current.contains(e.target)) {
            console.log("Clicked outside of popup");
            setCurrentPopup(PopupType.NONE);

            setSelectedHousehold(null);
        }
        console.log("Clicked inside of popup");
    };


    const propsForHouseholdDetails = {
        selectedHousehold,
        handleOverlayClick,
    };


    return (
        <div className="Households">

            <h2>Manage Households</h2>

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

            {
                errorMessage !== '' &&
                <AlertMessage message={errorMessage} />
            }

            {showSpinner && <Spinner />}

        </div>
    );

};

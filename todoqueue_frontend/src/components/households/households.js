import { useEffect, useState, useRef } from "react";
import useAuthCheck from '../../hooks/authCheck';

import Spinner from '../spinner/Spinner';
import AlertMessage from "../popups/AlertPopup";

import { createHousehold, deleteHousehold, fetchHouseholds } from '../../api/households';
import HouseholdDetailsPopup from "../popups/HouseholdDetailsPopup";

import './households.css';
import '../../utils/inputs.css';

export const ManageHouseholds = ({ households, updateHouseholds, setShowHouseholdSelector }) => {
    const [selectedHousehold, setSelectedHousehold] = useState(null);

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
    }, []);


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


    const handleDelete = async (id) => {
        console.log("Deleting household:", id);
        const promise = deleteHousehold(id);

        setErrorMessage("");
        const data = await promise;


        if (data.error) {
            setErrorMessage(data.error);
        } else if (data.success) {
            console.log("Successfully deleted household");
        }

        console.log("Updating household list");
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

            setSelectedHousehold(null);

            console.log("Updating household list");
            updateHouseholds();
        }
        console.log("Clicked inside of popup");
    };


    const closePopup = () => {
        console.log("Closing popup");
        setCurrentPopup(PopupType.NONE);
        setSelectedHousehold(null);
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

        </div>
    );

};

import axios from "axios";
import { useEffect, useState } from "react";

const apiUrl = process.env.REACT_APP_BACKEND_URL;

export const ManageHouseholds = ({ households }) => {
    const [name, setName] = useState("");
    const [errorMessage, setErrorMessage] = useState("");


    const handleCreate = async () => {
        try {
            // Get the logged in user
            const res = await axios.post(apiUrl + "/create_household/",
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
            await axios.delete(apiUrl + "/households/" + id + "/", {
                withCredentials: true
            });

        } catch (error) {
            console.error("Failed to delete household:", error);
            setErrorMessage("Failed to delete household.");
        }
    };


    return (
        <div>
            <h2>Manage Households</h2>

            <div>
                <label>
                    Household Name:
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                </label>
                <button onClick={handleCreate}>Create</button>
            </div>

            <ul>
                {households.map((household) => (
                    <li key={household.id}>
                        {household.name}
                        <button onClick={() => handleDelete(household.id)}>Delete</button>
                    </li>
                ))}
            </ul>

            <div>
                <h3>{errorMessage}</h3>
            </div>
        </div>
    );
};

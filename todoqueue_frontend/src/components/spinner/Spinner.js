import React, { useEffect, useState } from 'react';
import './Spinner.css';

const Spinner = () => {
    const [showSpinner, setShowSpinner] = useState(false);

    // Delay 0.5s before rendering the spinner
    useEffect(() => {
        const timeout = setTimeout(() => {
            setShowSpinner(true);
        }, 500);
        return () => clearTimeout(timeout);
    }, []);

    return (
        <div>
            {
                showSpinner &&
                <div className="loader-container">
                    <div className="loader"></div>
                </div>
            }
        </div>
    );
}

export default Spinner;

import React from 'react';
import './popups.css';

const BasePopup = React.forwardRef((props, ref) => {
    return (
        <div className="popup" onClick={props.onClick}>
            <div className={`popup-inner ${props.innerClass}`} ref={ref}>
                {props.children}
            </div>
        </div>
    );
});

BasePopup.displayName = 'BasePopup';

export default BasePopup;

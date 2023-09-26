import React from 'react';

const BasePopup = React.forwardRef((props, ref) => {
    return (
        <div className="popup" onClick={props.onClick}>
            <div className={`popup-inner ${props.innerClass}`} ref={ref}>
                {props.children}
            </div>
        </div>
    );
});

export default BasePopup;

import React, { useState, useEffect, useRef } from 'react';
import './flipper.css';

const CountdownTracker = ({ value }) => {
    const [currentValue, setCurrentValue] = useState(value);
    const [previousValue, setPreviousValue] = useState(value);
    const elRef = useRef(null);

    useEffect(() => {
        if (value !== currentValue) {
            setCurrentValue(value);

            const el = elRef.current;
            const top = el.querySelector('.card__top');
            const bottom = el.querySelector('.card__bottom');
            const backBottom = el.querySelector('.card__back .card__bottom');
            const back = el.querySelector('.card__back');

            // top.innerText = value;
            backBottom.setAttribute('data-value', value);

            el.classList.remove('flip');
            void el.offsetWidth;
            el.classList.add('flip');

            // Set the old value to the bottom card immediately
            bottom.setAttribute('data-value', previousValue);

            // Set the new value to the back card which is revealed
            back.setAttribute('data-value', value);
            back.setAttribute('data-prev', previousValue);

            // Listen for the end of the flip animation
            const handleAnimationEnd = () => {
                setPreviousValue(value);
                el.removeEventListener('animationend', handleAnimationEnd);
            };
            
            el.addEventListener('animationend', handleAnimationEnd);
        }
    }, [value]);

    return (
        <span ref={elRef} className="flip-clock__piece">
            <b className="flip-clock__card card">
                <b className="card__top">{value}</b>
                <b className="card__bottom" data-value={previousValue}></b>
                <b className="card__back">
                    <b className="card__bottom" data-value={value}></b>
                </b>
            </b>
        </span>
    );
};



const SimpleFlipper = ({ value }) => {
    return (
        <div className="flip-clock">
            <CountdownTracker value={value} />
        </div>
    );
};

export { CountdownTracker, SimpleFlipper };

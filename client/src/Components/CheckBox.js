import React, { useEffect, useState } from 'react';

const Checkbox = (props) => {
    const [isChecked, setIsChecked] = useState(props.default);

    useEffect(() => {
        setIsChecked(props.default);
    }, [props.default]);

    const checkboxCheckHandler = () => {
        const nextChecked = !isChecked;
        setIsChecked(nextChecked);
        props.checkboxChangeHandler(props.id, nextChecked);
    };

    return (
        <button
            type="button"
            className={`column-toggle-card ${isChecked ? 'column-toggle-card-active' : ''}`}
            onClick={checkboxCheckHandler}
            aria-pressed={isChecked}
        >
            <span className="column-toggle-indicator" aria-hidden="true">
                <span className="column-toggle-indicator-dot" />
            </span>
            <span className="column-toggle-copy">
                <strong>{props.name}</strong>
                <small>{isChecked ? 'Visible in results' : 'Tap to include'}</small>
            </span>
        </button>
    );
};

export default Checkbox;

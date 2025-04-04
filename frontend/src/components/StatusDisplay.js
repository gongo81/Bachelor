import React from 'react';
import '../App.css';

function StatusDisplay({ statusMessage, userContext, feedback }) {
    return (
        <>
            {statusMessage && (
                <div className="status-container">
                    <p>{statusMessage}</p>
                </div>
            )}
            {userContext && (
                <div className="context-container">
                    <h3>User Progress Overview:</h3>
                    <pre>{userContext}</pre>
                </div>
            )}
        </>
    );
}

export default StatusDisplay;
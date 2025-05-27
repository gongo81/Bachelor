import React from "react";
import "../App.css";

function StatusDisplay({ statusMessage }) {
    return (
        <>
            {statusMessage && (
                <div className="status-container">
                    <p>{statusMessage}</p>
                </div>
            )}
        </>
    );
}

export default StatusDisplay;
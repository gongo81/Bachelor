import React from "react";
import "../App.css";

function UserContext({ userContext }) {
    return (
        <>
            {userContext && (
                <div className="context-container">
                    <h3>User Progress Overview:</h3>
                    <pre>{userContext}</pre>
                </div>
            )}
        </>
    );
}

export default UserContext;
import React from 'react';
import '../App.css';

function RoleSelection({ onRoleSelect }) {
    return (
        <div className="role-selection">
            <h1>Welcome to NoSQLconcepts with LLM</h1>
            <p>Please select your role:</p>
            <button onClick={() => onRoleSelect('student')}>Student</button>
            <button onClick={() => onRoleSelect('teacher')}>Teacher</button>
        </div>
    );
}

export default RoleSelection;
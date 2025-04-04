import React from 'react';
import '../App.css';

function InputSection({ 
    username, 
    setUsername, 
    dbType, 
    setDbType, 
    onBack, 
    onAction1, 
    onAction2, 
    action1Label, 
    action2Label, 
    action1Disabled = false, 
    action2Disabled = false 
}) {
    return (
        <div className="input-container">
            <button className="back-button" onClick={onBack}>Back</button>
            <label>
                {username && 'Username:' || 'Student Username:'} 
                <input 
                    type="text" 
                    value={username} 
                    onChange={(e) => setUsername(e.target.value)} 
                    placeholder="Enter your username" 
                />
            </label>
            {dbType && (
                <label>
                    Select Database: 
                    <select value={dbType} onChange={(e) => setDbType(e.target.value)}>
                        <option value="MongoDB">MongoDB</option>
                        <option value="Neo4J">Neo4J</option>
                        <option value="Cassandra">Cassandra</option>
                        <option value="PostgreSQL">PostgreSQL</option>
                    </select>
                </label>
            )}
            {action1Label && (
                <button onClick={onAction1} disabled={action1Disabled}>
                    {action1Disabled ? <span className="spinner"></span> : action1Label}
                </button>
            )}
            {action2Label && (
                <button onClick={onAction2} disabled={action2Disabled}>
                    {action2Label} {}
                </button>
            )}
        </div>
    );
}

export default InputSection;
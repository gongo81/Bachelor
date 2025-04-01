import React, { useState } from 'react';
import RoleSelection from './components/RoleSelection';
import StudentPage from './pages/StudentPage';
import TeacherPage from './pages/TeacherPage';
import './App.css';

function App() {
    const [role, setRole] = useState(null);

    const handleRoleSelect = (selectedRole) => setRole(selectedRole);
    const handleBack = () => setRole(null);

    return (
        <div className="App">
            <div className="top-bar">
                <h1 className="top-bar-title">NoSQLconcepts with LLM</h1>
            </div>
            {!role && <RoleSelection onRoleSelect={handleRoleSelect} />}
            {role === 'student' && <StudentPage onBack={handleBack} />}
            {role === 'teacher' && <TeacherPage onBack={handleBack} />}
        </div>
    );
}

export default App;
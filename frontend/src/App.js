import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

// Initial role selection screen with user creation
function RoleSelection({ onRoleSelect }) {
    const [newUsername, setNewUsername] = useState('');
    const [createUserStatus, setCreateUserStatus] = useState('');

    // Create a new student user
    const createUser = async () => {
        if (!newUsername) {
            setCreateUserStatus('Error: Please enter a username');
            return;
        }
        try {
            const response = await axios.post('http://localhost:5000/create-user', { username: newUsername });
            setCreateUserStatus(response.data.message);
            setNewUsername(''); 
        } catch (error) {
            if (error.response && error.response.status === 400) {
                setCreateUserStatus('Error: Username already exists');
            } else {
                console.error(error);
                setCreateUserStatus('Error creating user');
            }
        }
    };

    return (
        <div className="role-selection">
            <h1>Welcome to NoSQLconcepts with LLM</h1>
            <p>Please select your role:</p>
            <button onClick={() => onRoleSelect('student')}>Student</button>
            <button onClick={() => onRoleSelect('teacher')}>Teacher</button>
            <div className="user-creation-container">
                <h3>Create Student User:</h3>
                <label>
                    Username: 
                    <input 
                        type="text" 
                        value={newUsername} 
                        onChange={(e) => setNewUsername(e.target.value)} 
                        placeholder="Enter new student username" 
                    />
                </label>
                <button onClick={createUser}>Create Student</button>
                {createUserStatus && (
                    <div className="status-container">
                        <p>{createUserStatus}</p>
                    </div>
                )}
            </div>
        </div>
    );
}

// Student dashboard for exercises and submissions
function StudentPage({ onBack }) {
    const [dbType, setDbType] = useState('MongoDB');
    const [username, setUsername] = useState('');
    const [question, setQuestion] = useState('');
    const [answer, setAnswer] = useState('');
    const [userAnswer, setUserAnswer] = useState('');
    const [feedback, setFeedback] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isEvaluating, setIsEvaluating] = useState(false);
    const [teacherExercises, setTeacherExercises] = useState([]);
    const [selectedTeacherExercise, setSelectedTeacherExercise] = useState(null);
    const [showTeacherExercises, setShowTeacherExercises] = useState(false);

    // Generate a new exercise from the backend
    const generateExercise = async () => {
        if (!username) {
            alert('Please enter a username');
            return;
        }
        setIsGenerating(true);
        try {
            const response = await axios.post('http://localhost:5000/generate-exercise', { dbType, username });
            setQuestion(response.data.question);
            setAnswer(response.data.answer);
            setFeedback('');
            setUserAnswer('');
            setSelectedTeacherExercise(null);
            setShowTeacherExercises(false);
            setTeacherExercises([]);
        } catch (error) {
            if (error.response && error.response.status === 404) {
                setTeacherExercises('Error: User not found');
                setShowTeacherExercises(false);
            } else {
                console.error(error);
                setTeacherExercises('Error generating exercise');
                setShowTeacherExercises(false);
            }
        } finally {
            setIsGenerating(false);
        }
    };

    // Fetch teacher-created exercises for the student
    const fetchTeacherExercises = async () => {
        if (!username) {
            alert('Please enter a username');
            return;
        }
        try {
            const response = await axios.post('http://localhost:5000/get-teacher-exercises', { username });
            setTeacherExercises(response.data);
            setShowTeacherExercises(true);
            setQuestion('');
            setAnswer('');
            setFeedback('');
            setUserAnswer('');
            setSelectedTeacherExercise(null);
        } catch (error) {
            if (error.response && error.response.status === 404) {
                setTeacherExercises('Error: User not found');
                setShowTeacherExercises(false);
            } else {
                console.error(error);
                setTeacherExercises('Error fetching teacher exercises');
                setShowTeacherExercises(false);
            }
        }
    };

    const selectTeacherExercise = (exercise) => {
        setSelectedTeacherExercise(exercise);
        setQuestion(exercise.question);
        setAnswer(exercise.answer);
        setFeedback('');
        setUserAnswer('');
        setShowTeacherExercises(false);
    };

    const goBackToTeacherExercises = () => {
        setSelectedTeacherExercise(null);
        setQuestion('');
        setAnswer('');
        setFeedback('');
        setUserAnswer('');
        setShowTeacherExercises(true);
    };

    // Submit student answer for evaluation
    const evaluateAnswer = async () => {
        setIsEvaluating(true);
        try {
            const response = await axios.post('http://localhost:5000/evaluate-answer', {
                question,
                userAnswer,
                username,
                dbType
            });
            setFeedback(response.data.feedback);
        } catch (error) {
            if (error.response && error.response.status === 404) {
                setFeedback('Error: User not found');
            } else {
                console.error(error);
                setFeedback('Error evaluating answer');
            }
        } finally {
            setIsEvaluating(false);
        }
    };

    return (
        <div className="student-page">
            <h1>Student Dashboard</h1>
            <div className="input-container">
                <button className="back-button" onClick={onBack}>Back</button>
                <label>Username: <input type="text" value={username} onChange={(e) => 
                    setUsername(e.target.value)} placeholder="Enter your username" /></label>
                <label>Select Database: 
                    <select value={dbType} onChange={(e) => setDbType(e.target.value)}>
                        <option value="MongoDB">MongoDB</option>
                        <option value="Neo4J">Neo4J</option>
                        <option value="Cassandra">Cassandra</option>
                        <option value="PostgreSQL">PostgreSQL</option>
                    </select>
                </label>
                <button onClick={generateExercise} disabled={isGenerating}>
                    {isGenerating ? <span className="spinner"></span> : 'Generate Exercise'}
                </button>
                <button onClick={fetchTeacherExercises}>Exercise Queries</button>
            </div>

            <div className="main-layout">
                <div className="content-container">
                    {showTeacherExercises && Array.isArray(teacherExercises) && (
                        <div className="teacher-exercises-container">
                            <h3>Teacher-Created Exercises:</h3>
                            {teacherExercises.length > 0 && !selectedTeacherExercise ? (
                                <ul>
                                    {teacherExercises.map((exercise, index) => (
                                        <li key={index} onClick={() => selectTeacherExercise(exercise)}>
                                            Exercise {index + 1}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p>No teacher-created exercises found.</p>
                            )}
                        </div>
                    )}
                    {question && (
                        <div className="question-container">
                            {selectedTeacherExercise && (
                                <button className="back-arrow" onClick={goBackToTeacherExercises}>←</button>
                            )}
                            <h3>Question:</h3>
                            <p>{question}</p>
                            <textarea value={userAnswer} onChange={(e) => setUserAnswer(e.target.value)} placeholder="Type your answer here" />
                            <button onClick={evaluateAnswer} disabled={isEvaluating}>
                                {isEvaluating ? <span className="spinner"></span> : 'Submit Answer'}
                            </button>
                        </div>
                    )}
                    {feedback && (
                        <div className="feedback-container">
                            <h3>Feedback:</h3>
                            <p>{feedback}</p>
                        </div>
                    )}
                    {typeof teacherExercises === 'string' && (
                        <div className="context-container">
                            <h3>Status:</h3>
                            <pre>{teacherExercises}</pre>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// Teacher dashboard for creating exercises and viewing progress
function TeacherPage({ onBack }) {
    const [username, setUsername] = useState('');
    const [userContext, setUserContext] = useState('');
    const [teacherPrompt, setTeacherPrompt] = useState('');
    const [dbType, setDbType] = useState('MongoDB');
    const [difficulty, setDifficulty] = useState('Easy');
    const [isGenerating, setIsGenerating] = useState(false);

    // Fetch student progress overview
    const showUserContext = async () => {
        if (!username) {
            alert('Please enter a username');
            return;
        }
        try {
            const response = await axios.post('http://localhost:5000/user-context', { username });
            setUserContext(response.data.context);
        } catch (error) {
            if (error.response && error.response.status === 404) {
                setUserContext('Error: User not found');
            } else {
                console.error(error);
                setUserContext('Error fetching user context');
            }
        }
    };

    // Generate a teacher-created exercise with selected difficulty
    const generateTeacherExercise = async () => {
        if (!username || !teacherPrompt) {
            alert('Please enter a username and a prompt');
            return;
        }
        setIsGenerating(true);
        try {
            const response = await axios.post('http://localhost:5000/generate-teacher-exercise', {
                username,
                prompt: teacherPrompt,
                dbType,
                difficulty
            });
            alert(response.data.message);
            setTeacherPrompt('');
        } catch (error) {
            if (error.response && error.response.status === 404) {
                setUserContext('Error: User not found');
            } else {
                console.error(error);
                alert('Error generating exercise');
            }
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="teacher-page">
            <h1>Teacher Dashboard</h1>
            <div className="input-container">
                <button className="back-button" onClick={onBack}>Back</button>
                <label>Student Username: <input type="text" value={username} onChange={(e) => 
                    setUsername(e.target.value)} placeholder="Enter student username" /></label>
                <button onClick={showUserContext}>Show User Progress</button>
            </div>
            <div className="teacher-prompt-container">
                <h3>Create Exercise for Student:</h3>
                <label>Database: 
                    <select value={dbType} onChange={(e) => setDbType(e.target.value)}>
                        <option value="MongoDB">MongoDB</option>
                        <option value="Neo4J">Neo4J</option>
                        <option value="Cassandra">Cassandra</option>
                        <option value="PostgreSQL">PostgreSQL</option>
                    </select>
                </label>
                <label>Difficulty: 
                    <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                        <option value="Easy">Easy</option>
                        <option value="Medium">Medium</option>
                        <option value="Hard">Hard</option>
                    </select>
                </label>
                <textarea value={teacherPrompt} onChange={(e) => setTeacherPrompt(e.target.value)} placeholder=
                {"Enter your prompt for the exercise (e.g., 'Create a query to find all users over 30 from the customer collection/ table " +
                "- or - Create a query which involves the $group function on the collection/ table...')"}/>
                <button onClick={generateTeacherExercise} disabled={isGenerating}>
                    {isGenerating ? <span className="spinner"></span> : 'Generate Exercise'}
                </button>
            </div>
            {userContext && (
                <div className="context-container">
                    <h3>User Progress Overview:</h3>
                    <pre>{userContext}</pre>
                </div>
            )}
        </div>
    );
}

// Main app component managing role navigation
function App() {
    const [role, setRole] = useState(null);

    const handleRoleSelect = (selectedRole) => setRole(selectedRole);
    const handleBack = () => setRole(null);

    return (
        <div className="App">
            <div className="top-bar"></div>
            {!role && <RoleSelection onRoleSelect={handleRoleSelect} />}
            {role === 'student' && <StudentPage onBack={handleBack} />}
            {role === 'teacher' && <TeacherPage onBack={handleBack} />}
        </div>
    );
}

export default App;
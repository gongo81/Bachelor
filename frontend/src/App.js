import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

// Initial role selection screen 
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
    const [statusMessage, setStatusMessage] = useState('');

    const generateExercise = async () => {
        if (!username) {
            setStatusMessage('Please enter a username');
            return;
        }
        setIsGenerating(true);
        setStatusMessage('');
        try {
            const { data } = await axios.post('http://localhost:5000/generate-exercise', { dbType, username });
            setQuestion(data.question);
            setAnswer(data.answer);
            setFeedback('');
            setUserAnswer('');
            setSelectedTeacherExercise(null);
            setShowTeacherExercises(false);
            setTeacherExercises([]);
        } catch (error) {
            setTeacherExercises(error.response?.data || 'Error generating exercise');
            setShowTeacherExercises(false);
            if (error.response?.status === 404) {
                setStatusMessage('User not found');
            } else {
                setStatusMessage('Error generating exercise');
            }
            console.error(error);
        } finally {
            setIsGenerating(false);
        }
    };

    const fetchTeacherExercises = async () => {
        if (!username) {
            setStatusMessage('Please enter a username');
            return;
        }
        setStatusMessage('');
        try {
            const { data } = await axios.post('http://localhost:5000/get-teacher-exercises', { username });
            setTeacherExercises(data);
            setShowTeacherExercises(true);
            setQuestion('');
            setAnswer('');
            setFeedback('');
            setUserAnswer('');
            setSelectedTeacherExercise(null);
        } catch (error) {
            setTeacherExercises(error.response?.data || 'Error fetching teacher exercises');
            setShowTeacherExercises(false);
            if (error.response?.status === 404) {
                setStatusMessage('User not found');
            } else {
                setStatusMessage('Error fetching teacher exercises');
            }
            console.error(error);
        }
    };

    const selectTeacherExercise = (exercise) => {
        setSelectedTeacherExercise(exercise);
        setQuestion(exercise.question);
        setAnswer(exercise.answer);
        setFeedback('');
        setUserAnswer('');
        setShowTeacherExercises(false);
        setStatusMessage('');
    };

    const goBackToTeacherExercises = () => {
        setSelectedTeacherExercise(null);
        setQuestion('');
        setAnswer('');
        setFeedback('');
        setUserAnswer('');
        setShowTeacherExercises(true);
        setStatusMessage('');
    };

    const evaluateAnswer = async () => {
        if (!username) {
            setStatusMessage('Please enter a username');
            return;
        }
        setIsEvaluating(true);
        setStatusMessage('');
        try {
            const { data } = await axios.post('http://localhost:5000/evaluate-answer', { question, userAnswer, username, dbType });
            setFeedback(data.feedback);
        } catch (error) {
            setFeedback(error.response?.data.feedback || 'Error evaluating answer');
            if (error.response?.status === 404) {
                setStatusMessage('User not found');
            } else {
                setStatusMessage('Error evaluating answer');
            }
            console.error(error);
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
            {statusMessage && (
                <div className="status-container">
                    <p>{statusMessage}</p>
                </div>
            )}
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

// Teacher dashboard with simplified user creation
function TeacherPage({ onBack }) {
    const [username, setUsername] = useState('');
    const [userContext, setUserContext] = useState('');
    const [teacherPrompt, setTeacherPrompt] = useState('');
    const [dbType, setDbType] = useState('MongoDB');
    const [difficulty, setDifficulty] = useState('Easy');
    const [isGenerating, setIsGenerating] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');

    const showUserContext = async () => {
        if (!username) {
            setStatusMessage('Please enter a username');
            return;
        }
        setStatusMessage('');
        try {
            const { data } = await axios.post('http://localhost:5000/user-context', { username });
            setUserContext(data.context);
        } catch (error) {
            setUserContext(error.response?.data.context || 'Error fetching user context');
            if (error.response?.status === 404) {
                setStatusMessage('User not found');
            } else {
                setStatusMessage('Error fetching user context');
            }
            console.error(error);
        }
    };

    const checkUserExists = async () => {
        try {
            const { data } = await axios.post('http://localhost:5000/check-user', { username });
            return data.exists;
        } catch (error) {
            console.error(error);
            return false;
        }
    };

    const generateTeacherExercise = async () => {
        if (!username) {
            setStatusMessage('Please enter a username');
            return;
        }
        if (!teacherPrompt) {
            setStatusMessage('Please enter a prompt');
            return;
        }
        setStatusMessage('');

        const userExists = await checkUserExists();
        if (!userExists) {
            setStatusMessage('Cannot create exercise: User does not exist');
            return;
        }

        setIsGenerating(true);
        try {
            const { data } = await axios.post('http://localhost:5000/generate-teacher-exercise', {
                username,
                prompt: teacherPrompt,
                dbType,
                difficulty
            });
            setStatusMessage(data.message);
            setTeacherPrompt('');
        } catch (error) {
            if (error.response?.status === 404) {
                setStatusMessage('User not found');
            } else {
                setStatusMessage(error.response?.data.message || 'Error generating exercise');
            }
            console.error(error);
        } finally {
            setIsGenerating(false);
        }
    };

    const createUser = async () => {
        if (!username) {
            setStatusMessage('Please enter a username');
            return;
        }
        setStatusMessage('');
        try {
            const { data, status } = await axios.post('http://localhost:5000/create-user', { username });
            setStatusMessage(data.message);
            if (status === 201) {
                setUsername('');
                setUserContext('');
            }
        } catch (error) {
            setStatusMessage(error.response?.data.message || 'Error: Could not create user');
            console.error(error);
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
                <button onClick={createUser}>Create User</button>
            </div>
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
                <textarea 
                    value={teacherPrompt} 
                    onChange={(e) => setTeacherPrompt(e.target.value)} 
                    placeholder={"Enter your prompt for the exercise (e.g., 'Create a query to find all users over 30 from the customer" + 
                    "collection/ table - or - Create a query which involves the $group function on the collection/ table...')"} 
                />
                <button onClick={generateTeacherExercise} disabled={isGenerating}>
                    {isGenerating ? <span className="spinner"></span> : 'Generate Exercise'}
                </button>
            </div>
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
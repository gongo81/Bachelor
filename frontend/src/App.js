import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
    const [dbType, setDbType] = useState('MongoDB');
    const [username, setUsername] = useState('');
    const [question, setQuestion] = useState('');
    const [answer, setAnswer] = useState('');
    const [userAnswer, setUserAnswer] = useState('');
    const [feedback, setFeedback] = useState('');
    const [isGenerating, setIsGenerating] = useState(false); // Loading state for generate
    const [isEvaluating, setIsEvaluating] = useState(false); // Loading state for evaluate

    const generateExercise = async () => {
        if (!username) {
            alert('Please enter a username');
            return;
        }
        setIsGenerating(true); // Start loading
        try {
            const response = await axios.post('http://localhost:5000/generate-exercise', { dbType, username });
            setQuestion(response.data.question);
            setAnswer(response.data.answer);
            setFeedback('');
            setUserAnswer('');
        } catch (error) {
            console.error(error);
        } finally {
            setIsGenerating(false); // Stop loading
        }
    };

    const evaluateAnswer = async () => {
        setIsEvaluating(true); // Start loading
        try {
            const response = await axios.post('http://localhost:5000/evaluate-answer', {
                question,
                userAnswer,
                username,
                dbType
            });
            setFeedback(response.data.feedback);
        } catch (error) {
            console.error(error);
        } finally {
            setIsEvaluating(false); // Stop loading
        }
    };

    return (
        <div className="App">
            <h1>NoSQLconcepts with LLM</h1>
            <div className="input-container">
                <label>
                    Username:
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Enter your username"
                    />
                </label>
                <label>
                    Select Database:
                    <select value={dbType} onChange={(e) => setDbType(e.target.value)}>
                        <option value="MongoDB">MongoDB</option>
                        <option value="Neo4J">Neo4J</option>
                        <option value="Cassandra">Cassandra</option>
                        <option value="PostgreSQL">PostgreSQL</option>
                    </select>
                </label>
                <button onClick={generateExercise} disabled={isGenerating}>
                    {isGenerating ? (
                        <span className="spinner"></span>
                    ) : (
                        'Generate Exercise'
                    )}
                </button>
            </div>

            {question && (
                <div className="question-container">
                    <h3>Question:</h3>
                    <p>{question}</p>
                    <textarea
                        value={userAnswer}
                        onChange={(e) => setUserAnswer(e.target.value)}
                        placeholder="Type your answer here"
                    />
                    <button onClick={evaluateAnswer} disabled={isEvaluating}>
                        {isEvaluating ? (
                            <span className="spinner"></span>
                        ) : (
                            'Submit Answer'
                        )}
                    </button>
                </div>
            )}

            {feedback && (
                <div className="feedback-container">
                    <h3>Feedback:</h3>
                    <p>{feedback}</p>
                </div>
            )}
        </div>
    );
}

export default App;
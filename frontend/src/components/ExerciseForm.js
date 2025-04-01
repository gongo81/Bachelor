import React from 'react';
import '../App.css';

function ExerciseForm({ dbType, setDbType, difficulty, setDifficulty, teacherPrompt, setTeacherPrompt, onGenerate, isGenerating }) {
    return (
        <div className="teacher-prompt-container">
            <h3>Create Exercise for Student:</h3>
            <label>
                Database: 
                <select value={dbType} onChange={(e) => setDbType(e.target.value)}>
                    <option value="MongoDB">MongoDB</option>
                    <option value="Neo4J">Neo4J</option>
                    <option value="Cassandra">Cassandra</option>
                    <option value="PostgreSQL">PostgreSQL</option>
                </select>
            </label>
            <label>
                Difficulty: 
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
            <button onClick={onGenerate} disabled={isGenerating}>
                {isGenerating ? <span className="spinner"></span> : 'Generate Exercise'}
            </button>
        </div>
    );
}

export default ExerciseForm;
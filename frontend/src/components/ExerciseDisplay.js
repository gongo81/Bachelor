import React from 'react';
import '../App.css';

function ExerciseDisplay({ 
    question, 
    userAnswer, 
    setUserAnswer, 
    onEvaluate, 
    isEvaluating, 
    selectedTeacherExercise, 
    onBackToExercises,
    feedback 
}) {
    return (
        <div className="main-layout">
            <div className="content-container">
                {question && (
                    <>
                        <div className="question-container">
                            {selectedTeacherExercise && (
                                <button className="back-arrow" onClick={onBackToExercises}>←</button>
                            )}
                            <h3>Question:</h3>
                            <p>{question}</p>
                            <textarea 
                                value={userAnswer} 
                                onChange={(e) => setUserAnswer(e.target.value)} 
                                placeholder="Type your answer here" 
                            />
                            <button onClick={onEvaluate} disabled={isEvaluating}>
                                {isEvaluating ? <span className="spinner"></span> : 'Submit Answer'}
                            </button>
                        </div>
                        {feedback && (
                            <div className="feedback-container">
                                <h3>Feedback:</h3>
                                <p>{feedback}</p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

export default ExerciseDisplay;
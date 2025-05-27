import React from "react";
import "../App.css";

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

        // Parse feedback by numbered labels (format: "1. Sample Solution: ...\n2. Feedback: ...\n3. Hints: ...\n4. Correctness: ...\n5. ErrorType: ...")
        const parseFeedback = (feedback) => {
            if (!feedback) return null;
    
            // Split on newlines, filter out empty lines
            const lines = feedback.split("\n").filter(line => line.trim());
            
            let sampleSolution = "";
            let feedbackText = "";
            let hints = "";
            let correctness = "";
            let errorType = "";
    
            // Process each line, matching numbered labels
            lines.forEach(line => {
                if (line.startsWith("1. Sample Solution: ")) {
                    sampleSolution = line.replace("1. Sample Solution: ", "").trim();
                } else if (line.startsWith("2. Feedback: ")) {
                    feedbackText = line.replace("2. Feedback: ", "").trim();
                } else if (line.startsWith("3. Hints: ")) {
                    hints = line.replace("3. Hints: ", "").trim();
                } else if (line.startsWith("4. Correctness: ")) {
                    correctness = line.replace("4. Correctness: ", "").trim();
                } else if (line.startsWith("5. ErrorType: ")) {
                    errorType = line.replace("5. ErrorType: ", "").trim();
                }
            });
    
            // Return null if any section is missing
            if (!sampleSolution || !feedbackText || !hints || !correctness || !errorType) {
                return null;
            }
    
            return {
                sampleSolution,
                feedbackText,
                hints,
                correctness,
                errorType,
            };
        };
    
        const parsedFeedback = parseFeedback(feedback);
        
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
                                {isEvaluating ? <span className="spinner"></span> : "Submit Answer"}
                            </button>
                        </div>
                        {parsedFeedback && (
                            <div className="feedback-container">
                                <h3>Feedback:</h3>
                                <div className="feedback-section">
                                    <h4>Sample Solution</h4>
                                    <p className="code-block">{parsedFeedback.sampleSolution}</p>
                                </div>
                                <div className="feedback-section">
                                    <h4>Feedback</h4>
                                    <p>{parsedFeedback.feedbackText}</p>
                                </div>
                                <div className="feedback-section">
                                    <h4>Hints</h4>
                                    <p>{parsedFeedback.hints}</p>
                                </div>
                                <div className="feedback-section feedback-status">
                                    <h4>Results</h4>
                                    <p className={parsedFeedback.correctness === "correct" ? "status-correct" : "status-incorrect"}>
                                        Correctness: {parsedFeedback.correctness}</p>
                                    <p>Error Type: {parsedFeedback.errorType}</p>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

export default ExerciseDisplay;
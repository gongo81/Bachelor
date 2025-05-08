import React, { useState } from "react";
import axios from "axios";
import InputSection from "../components/InputSection";
import StatusDisplay from "../components/StatusDisplay";
import TeacherExercises from "../components/TeacherExercises";
import ExerciseDisplay from "../components/ExerciseDisplay";
import "../App.css";

function StudentPage({ onBack }) {
    const [dbType, setDbType] = useState("MongoDB");
    const [username, setUsername] = useState("");
    const [question, setQuestion] = useState("");
    const [answer, setAnswer] = useState("");
    const [userAnswer, setUserAnswer] = useState("");
    const [feedback, setFeedback] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [isEvaluating, setIsEvaluating] = useState(false);
    const [teacherExercises, setTeacherExercises] = useState([]);
    const [selectedTeacherExercise, setSelectedTeacherExercise] = useState(null);
    const [showTeacherExercises, setShowTeacherExercises] = useState(false);
    const [statusMessage, setStatusMessage] = useState("");

    // Exercise generation function
    const generateExercise = async () => {
        if (!username) {
            setStatusMessage("Please enter a username");
            return;
        }
        setIsGenerating(true);
        setStatusMessage("");
        setShowTeacherExercises(false);
        setSelectedTeacherExercise(null);
        try {
            const response = await axios.post("http://localhost:5000/api/exercises", { dbType, username });
            const data = response.data;
            setQuestion(data.question);
            setAnswer(data.answer);
            setFeedback("");
            setUserAnswer("");
        } catch (error) {
            setStatusMessage(error.response?.status === 404 ? "User not found" : error.response?.data || "Error generating exercise");
            console.error(error);
        } finally {
            setIsGenerating(false);
        }
    };

    // Teacher exercise fetch function
    const fetchTeacherExercises = async () => {
        if (!username) {
            setStatusMessage("Please enter a username");
            return;
        }
        if (isGenerating) {
            setStatusMessage("Please wait for the exercise to generate before viewing teacher exercises.");
            return;
        }
        if (question && !feedback && !selectedTeacherExercise) {
            setStatusMessage("Please complete the current exercise (submit and receive feedback) before viewing teacher exercises.");
            return;
        }
        setStatusMessage("");
        try {
            const response = await axios.get(`http://localhost:5000/api/users/${username}/teacher-exercises`);
            const data = response.data;
            setTeacherExercises(data);
            setShowTeacherExercises(true);
            setQuestion("");
            setAnswer("");
            setFeedback("");
            setUserAnswer("");
            setSelectedTeacherExercise(null);
        } catch (error) {
            setStatusMessage(error.response?.status === 404 ? "User not found" : error.response?.data || "Error fetching teacher exercises");
            setShowTeacherExercises(false);
            console.error(error);
        }
    };

    // Passing and setting needed useStates for selecting a techer exercise
    const selectTeacherExercise = (exercise) => {
        setSelectedTeacherExercise(exercise);
        setQuestion(exercise.question);
        setAnswer(exercise.answer);
        setUserAnswer("");
        setFeedback("");
        setShowTeacherExercises(false);
    };

    // Passing and setting needed useStates for going back to techer exercises overview
    const goBackToTeacherExercises = () => {
        setQuestion("");
        setAnswer("");
        setUserAnswer("");
        setFeedback("");
        setSelectedTeacherExercise(null);
        setShowTeacherExercises(true);
    };

    // Answer evaluation function
    const evaluateAnswer = async () => {
        if (!username) {
            setStatusMessage("Please enter a username");
            return;
        }
        setIsEvaluating(true);
        setStatusMessage("");
        try {
            const response = await axios.post("http://localhost:5000/api/exercises/evaluate", { question, userAnswer, username, dbType });
            const data = response.data;
            setFeedback(data.feedback);
        } catch (error) {
            setStatusMessage(error.response?.status === 404 ? "User not found" : error.response?.data.feedback || "Error evaluating answer");
            console.error(error);
        } finally {
            setIsEvaluating(false);
        }
    };

    return (
        <div className="student-page">
            <h1>Student Dashboard</h1>
            <InputSection
                username={username}
                setUsername={setUsername}
                dbType={dbType}
                setDbType={setDbType}
                showDbType={true}
                onBack={onBack}
                onAction1={generateExercise}
                onAction2={fetchTeacherExercises}
                action1Label="Generate Exercise"
                action2Label="Exercise Queries"
                action1Disabled={isGenerating}
                action2Disabled={isGenerating || (question && !feedback && !selectedTeacherExercise)}
            />
            <StatusDisplay statusMessage={statusMessage} feedback={feedback} />
            {showTeacherExercises && (
                <TeacherExercises
                    teacherExercises={teacherExercises}
                    onSelectExercise={selectTeacherExercise}
                />
            )}
            <ExerciseDisplay
                question={question}
                userAnswer={userAnswer}
                setUserAnswer={setUserAnswer}
                feedback={feedback}
                onEvaluate={evaluateAnswer}
                isEvaluating={isEvaluating}
                selectedTeacherExercise={selectedTeacherExercise}
                onBackToExercises={goBackToTeacherExercises}
            />
        </div>
    );
}

export default StudentPage;
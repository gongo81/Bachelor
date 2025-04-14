import React, { useState } from "react";
import axios from "axios";
import InputSection from "../components/InputSection";
import StatusDisplay from "../components/StatusDisplay";
import ExerciseForm from "../components/ExerciseForm";
import UserContext from "../components/UserContext"; 
import "../App.css";

function TeacherPage({ onBack }) {
    const [username, setUsername] = useState("");
    const [userContext, setUserContext] = useState("");
    const [teacherPrompt, setTeacherPrompt] = useState("");
    const [dbType, setDbType] = useState("MongoDB");
    const [difficulty, setDifficulty] = useState("Easy");
    const [isGenerating, setIsGenerating] = useState(false);
    const [statusMessage, setStatusMessage] = useState("");

    const showUserContext = async () => {
        if (!username) {
            setStatusMessage("Please enter a username");
            return;
        }
        setStatusMessage("");
        try {
            const response = await axios.post("http://localhost:5000/api/user-context", { username });
            const data = response.data;
            setUserContext(data.context);
        } catch (error) {
            setStatusMessage(error.response?.status === 404 ? "User not found" : error.response?.data.context || "Error fetching user context");
            console.error(error);
        }
    };

    const checkUserExists = async () => {
        try {
            const response = await axios.post("http://localhost:5000/api/check-user", { username });
            const data = response.data;
            return data.exists;
        } catch (error) {
            console.error(error);
            return false;
        }
    };

    const generateTeacherExercise = async () => {
        if (!username) {
            setStatusMessage("Please enter a username");
            return;
        }
        if (!teacherPrompt) {
            setStatusMessage("Please enter a prompt");
            return;
        }
        setStatusMessage("");
        const userExists = await checkUserExists();
        if (!userExists) {
            setStatusMessage("Cannot create exercise: User does not exist");
            return;
        }
        setIsGenerating(true);
        try {
            const response = await axios.post("http://localhost:5000/api/generate-teacher-exercise", {
                username,
                prompt: teacherPrompt,
                dbType,
                difficulty
            });
            const data = response.data;
            setStatusMessage(data.message);
            setTeacherPrompt("");
        } catch (error) {
            setStatusMessage(error.response?.status === 404 ? "User not found" : error.response?.data.message || "Error generating exercise");
            console.error(error);
        } finally {
            setIsGenerating(false);
        }
    };

    const createUser = async () => {
        if (!username) {
            setStatusMessage("Please enter a username");
            return;
        }
        setStatusMessage("");
        try {
            const response = await axios.post("http://localhost:5000/api/create-user", { username });
            const data = response.data;
            const status = response.status;
            setStatusMessage(data.message);
            if (status === 201) {
                setUsername("");
                setUserContext("");
            }
        } catch (error) {
            setStatusMessage(error.response?.data.message || "Error: Could not create user");
            console.error(error);
        }
    };

    return (
        <div className="teacher-page">
            <h1>Teacher Dashboard</h1>
            <InputSection 
                username={username} 
                setUsername={setUsername} 
                onBack={onBack} 
                onAction1={showUserContext} 
                onAction2={createUser} 
                action1Label="Show User Progress" 
                action2Label="Create User" 
            />
            <StatusDisplay statusMessage={statusMessage} />
            <UserContext userContext={userContext} /> 
            <ExerciseForm 
                dbType={dbType} 
                setDbType={setDbType} 
                difficulty={difficulty} 
                setDifficulty={setDifficulty} 
                teacherPrompt={teacherPrompt} 
                setTeacherPrompt={setTeacherPrompt} 
                onGenerate={generateTeacherExercise} 
                isGenerating={isGenerating} 
            />
        </div>
    );
}

export default TeacherPage;
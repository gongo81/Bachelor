import React, { useState } from 'react';
import axios from 'axios';
import InputSection from '../components/InputSection';
import StatusDisplay from '../components/StatusDisplay';
import TeacherExercises from '../components/TeacherExercises';
import ExerciseDisplay from '../components/ExerciseDisplay';
import '../App.css';

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
            const response = await axios.post('http://localhost:5000/api/generate-exercise', { dbType, username });
            const data = response.data;
            setQuestion(data.question);
            setAnswer(data.answer);
            setFeedback('');
            setUserAnswer('');
            setSelectedTeacherExercise(null);
            setShowTeacherExercises(false);
            setTeacherExercises([]);
        } catch (error) {
            setStatusMessage(error.response?.status === 404 ? 'User not found' : error.response?.data || 'Error generating exercise');
            setShowTeacherExercises(false);
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
        if (isGenerating) {
            setStatusMessage('Please wait for the exercise to generate before viewing teacher exercises.');
            return;
        }
        if (question && !feedback) {
            setStatusMessage('Please complete the current exercise (submit and receive feedback) before viewing teacher exercises.');
            return;
        }
        setStatusMessage('');
        try {
            const response = await axios.post('http://localhost:5000/api/get-teacher-exercises', { username });
            const data = response.data;
            setTeacherExercises(data);
            setShowTeacherExercises(true);
            setQuestion('');
            setAnswer('');
            setFeedback('');
            setUserAnswer('');
            setSelectedTeacherExercise(null);
        } catch (error) {
            setStatusMessage(error.response?.status === 404 ? 'User not found' : error.response?.data || 'Error fetching teacher exercises');
            setShowTeacherExercises(false);
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
            const response = await axios.post('http://localhost:5000/api/evaluate-answer', { question, userAnswer, username, dbType });
            const data = response.data;
            setFeedback(data.feedback);
        } catch (error) {
            setStatusMessage(error.response?.status === 404 ? 'User not found' : error.response?.data.feedback || 'Error evaluating answer');
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
                onBack={onBack} 
                onAction1={generateExercise} 
                onAction2={fetchTeacherExercises} 
                action1Label="Generate Exercise" 
                action2Label="Exercise Queries" 
                action1Disabled={isGenerating} 
                action2Disabled={isGenerating || (question && !feedback)} 
            />
            <StatusDisplay statusMessage={statusMessage} />
            {showTeacherExercises && Array.isArray(teacherExercises) && !selectedTeacherExercise && (
                <TeacherExercises teacherExercises={teacherExercises} onSelectExercise={selectTeacherExercise} />
            )}
            <ExerciseDisplay 
                question={question} 
                userAnswer={userAnswer} 
                setUserAnswer={setUserAnswer} 
                onEvaluate={evaluateAnswer} 
                isEvaluating={isEvaluating} 
                selectedTeacherExercise={selectedTeacherExercise} 
                onBackToExercises={goBackToTeacherExercises} 
                feedback={feedback} 
            />
        </div>
    );
}

export default StudentPage;
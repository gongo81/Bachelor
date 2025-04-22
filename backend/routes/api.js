const express = require("express");
const axios = require("axios");
const {
    createUser,
    deleteUser,
    checkUserExists,
    getOrCreateUser,
    getUserContext,
    insertExercise,
    getTeacherExercises,
    getCorrectAnswer,
    updateExerciseAnswer,
} = require("../db/db");

const router = express.Router();

// Create a new user
router.post("/users", async (req, res) => {
    const { username } = req.body;

    if (!username) {
        return res.status(400).json({ message: "Username is required" });
    }

    try {
        const result = await createUser(username);
        res.status(201).json(result);
    } catch (error) {
        if (error.message === "Username already exists") {
            return res.status(400).json({ message: "Username already exists" });
        }
        console.error(error);
        res.status(500).json({ message: "Error creating user" });
    }
});

// Delete a user
router.delete("/users/:username", async (req, res) => {
    const { username } = req.params;

    try {
        const result = await deleteUser(username);
        res.json(result);
    } catch (error) {
        if (error.message === "User not found") {
            return res.status(404).json({ message: "User not found" });
        }
        console.error(error);
        res.status(500).json({ message: "Error deleting user" });
    }
});

// Check if a user exists
router.get("/users/:username/exists", async (req, res) => {
    const { username } = req.params;

    try {
        const exists = await checkUserExists(username);
        res.json({ exists });
    } catch (error) {
        console.error(error);
        res.status(500).json({ exists: false, message: "Error checking user" });
    }
});

// Generate an LLM exercise
router.post("/exercises", async (req, res) => {
    const { dbType, username } = req.body;

    try {
        const userId = await getOrCreateUser(username, false);
        const { context, successRate } = await getUserContext(userId);
        const difficulty = successRate > 0.8 ? 3 : successRate > 0.5 ? 2 : 1;

        console.log(context);

        const response = await axios.post("http://127.0.0.1:11434/api/generate", {
            model: "llama3.1:latest",
            prompt: `Generate a ${difficulty === 1 ? "easy" : difficulty === 2 ? "medium" : "hard"} ${dbType} query exercise with a question and answer. 
            Format it as: "Question: [question text]\nAnswer: [answer text]" and please make sure that the actual answer is only given after "Answer:". 
            Take this as example: {Question: Find the total number of documents in the collection where the value in the "score" field is greater than 80.
            Answer: db.collection.aggregate([{$group: {_id: null, count: {$sum: 1}}}, {$match: {"$expr": "$score > 80"}}])}.
            Here is the users history context in order for you to give more tailored and personalized help: ${context}. (do not reveal this information)`,
            stream: false,
        });

        const result = response.data.response || "";
        console.log(result);
        const [questionPart, answer] = result.split("\nAnswer:");
        const question = questionPart.replace("Question:", "").trim();

        const trimmedQuestion = question || "No question generated";
        const trimmedAnswer = answer ? answer.trim() : "No answer provided";

        await insertExercise(userId, trimmedQuestion, trimmedAnswer, difficulty, 0);

        res.json({ question: trimmedQuestion, answer: trimmedAnswer });
    } catch (error) {
        if (error.message === "User not found") {
            res.status(404).send("User not found");
        } else {
            console.error(error);
            res.status(500).send("Error generating exercise");
        }
    }
});

// Generate a teacher exercise
router.post("/teacher-exercises", async (req, res) => {
    const { username, prompt, dbType, difficulty } = req.body;

    try {
        const userId = await getOrCreateUser(username, false);
        const difficultyNum = difficulty === "Easy" ? 1 : difficulty === "Medium" ? 2 : 3;
        const response = await axios.post("http://127.0.0.1:11434/api/generate", {
            model: "llama3.1:latest",
            prompt: `Based on the following teacher input: "${prompt}", generate a ${difficulty.toLowerCase()} ${dbType} query exercise with a question and answer. 
            Format it as: "Question: [question text]\nAnswer: [answer text]" and please make sure that just the actual answer is given after "Answer:".
            Take this as example: {Question: Find the total number of documents in the collection where the value in the "score" field is greater than 80.
            Answer: db.collection.aggregate([{$group: {_id: null, count: {$sum: 1}}}, {$match: {"$expr": "$score > 80"}}])}.`,
            stream: false,
        });

        const result = response.data.response || "";
        console.log(result);
        const [questionPart, answer] = result.split("\nAnswer:");
        const question = questionPart.replace("Question:", "").trim();

        const trimmedQuestion = question || "No question generated";
        const trimmedAnswer = answer ? answer.trim() : "No answer provided";

        await insertExercise(userId, trimmedQuestion, trimmedAnswer, difficultyNum, 1);

        res.json({ message: "Exercise generated successfully" });
    } catch (error) {
        if (error.message === "User not found") {
            res.status(404).send("User not found");
        } else {
            console.error(error);
            res.status(500).send("Error generating teacher exercise");
        }
    }
});

// Get teacher-created exercises
router.get("/users/:username/teacher-exercises", async (req, res) => {
    const { username } = req.params;

    try {
        const userId = await getOrCreateUser(username, false);
        const exercises = await getTeacherExercises(userId);
        res.json(exercises);
    } catch (error) {
        if (error.message === "User not found") {
            res.status(404).send("User not found");
        } else {
            console.error(error);
            res.status(500).send("Error fetching teacher exercises");
        }
    }
});

// Evaluate an answer
router.post("/exercises/evaluate", async (req, res) => {
    const { question, userAnswer, username, dbType } = req.body;

    try {
        const userId = await getOrCreateUser(username, false);
        const { context } = await getUserContext(userId);
        const correctAnswer = await getCorrectAnswer(userId, question);

        const prompt = `Evaluate this answer from the user: "${userAnswer}", for the question: "${question}". 
        The correct answer is "${correctAnswer}". 
        Here is the users history context in order for you to give more tailored and personalized help: ${context}. (do not reveal this information)
        Provide strict, detailed feedback (not mean) to help the user improve. 
        Also state the sample solution first to the user. 
        At the end, explicitly state: 
        - "Correctness: correct" if the answer is correct, or "Correctness: incorrect" if not 
        (keep this format 100% and do not add anything else, also no special characters). 
        Dont be too strict regarding the correctness of the userAnswer, as long as the general userAnswer would run correctly 
        and give the wanted output then count it as correct, it does not necessarily have to be the exact same code as the correctAnswer.
        - "ErrorType: [syntax, logic, concept, or none]" based on the error (use "none" if correct).`;

        const response = await axios.post("http://127.0.0.1:11434/api/generate", {
            model: "llama3.1:latest",
            prompt,
            stream: false,
        });

        const feedback = response.data.response || "No feedback generated";
        console.log(feedback);

        const isCorrectMatch = feedback.match(/Correctness: (correct|incorrect)/i);
        const isCorrect = isCorrectMatch && isCorrectMatch[1].toLowerCase() === "correct" ? 1 : 0;

        const errorTypeMatch = feedback.match(/ErrorType: (syntax|logic|concept|none)/i);
        const errorType = errorTypeMatch ? errorTypeMatch[1].toLowerCase() : "none";

        await updateExerciseAnswer(userId, question, userAnswer, feedback, isCorrect, errorType);

        res.json({ feedback });
    } catch (error) {
        if (error.message === "User not found") {
            res.status(404).send("User not found");
        } else {
            console.error(error);
            res.status(500).send("Error evaluating answer");
        }
    }
});

// Get user context
router.get("/users/:username/context", async (req, res) => {
    const { username } = req.params;

    try {
        const userId = await getOrCreateUser(username, false);
        const { context } = await getUserContext(userId);
        res.json({ context });
    } catch (error) {
        if (error.message === "User not found") {
            res.status(404).send("User not found");
        } else {
            console.error(error);
            res.status(500).send("Error fetching user context");
        }
    }
});

module.exports = router;
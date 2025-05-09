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

        const response = await axios.post("http://127.0.0.1:11434/api/generate", {
            model: "gemma3:4b",
            prompt: `Generate a ${difficulty === 1 ? "easy" : difficulty === 2 ? "medium" : "hard"} ${dbType} query exercise with 
            a question and answer, tailored to the user's learning level based on their history context: ${context} 
            (avoid repeating questions unnecessarily—rephrase or vary them when the same function is being tested and do not reveal the context information). 
            
            Format it strictly following exact structure, with no additional text, special characters, or deviations: 
            "Question: [question text]\nAnswer: [answer text]", 
            and ensure the actual answer appears only after "Answer:".

            Take these examples as reference:
            - Easy: Basic queries (e.g., simple filters or single-node searches).
            - Medium: Moderate queries (e.g., aggregations, multi-step queries, or basic relationships).
            - Hard: Complex queries (e.g., advanced aggregations, multi-node traversals, or optimization).

            Ensure the question is clear, concise, and educational, suitable for a student learning ${dbType}.`,
            stream: false,
        });

        // Deconstruct llm response to question and answer
        const result = response.data.response || "";
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
        const { context } = await getUserContext(userId);
        const difficultyNum = difficulty === "Easy" ? 1 : difficulty === "Medium" ? 2 : 3;
        const response = await axios.post("http://127.0.0.1:11434/api/generate", {
            model: "gemma3:4b",
            prompt: `Based on the teacher input: "${prompt}", generate a ${difficulty.toLowerCase()} ${dbType} 
            query exercise with a question and answer, tailored to the user's learning level using their history context: ${context} 
            (avoid repeating questions unnecessarily—rephrase or vary them when the same function is being tested and do not reveal the context information). 
            
            Format it strictly following exact structure, with no additional text, special characters, or deviations: 
            "Question: [question text]\nAnswer: [answer text]", 
            and ensure the actual answer appears only after "Answer:".

            Take these examples as reference:
            - Easy: Basic queries (e.g., simple filters or single-node searches).
            - Medium: Moderate queries (e.g., aggregations, multi-step queries, or basic relationships).
            - Hard: Complex queries (e.g., advanced aggregations, multi-node traversals, or optimization).

            Ensure the question is clear, concise, and educational, suitable for a student learning ${dbType}.
            Use the teacher input as a theme or direct inspiration for the question, ensuring it aligns with the specified difficulty.`,
            stream: false,
        });

        // Deconstruct llm response to question and answer
        const result = response.data.response || "";
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

        const prompt = `Evaluate the user's answer: "${userAnswer}" for the question: "${question}", with the correct answer: "${correctAnswer}".
            Use the user's history context: ${context} (do not reveal this information) to provide personalized, encouraging feedback, acting as a supportive learning assistant.
        
            Output the response in the following exact structure, with no additional text, special characters, or deviations:
            1. Sample Solution: [${correctAnswer}]
            2. Feedback: [Detailed, beginner-friendly explanation of the user's answer, including whether it is correct or incorrect, and why. Reference patterns from the user's history, e.g., "You've had syntax errors before."]
            3. Hints: [Specific, actionable steps to improve, e.g., "Check the syntax for ${dbType} function which where asked." Include a resource link, e.g., "Review ${dbType} documentation at [link]."]
            4. Correctness: [correct if the answer runs and produces the correct output; otherwise incorrect]
            5. ErrorType: [syntax, logic, concept, or none; use "none" if correct]

            Accept alternative correct answers that may differ from the sample in syntax or formatting, as long as they produce the same result when executed on a valid ${dbType} database.
            Ensure feedback is clear, educational, and supportive.`;

        const response = await axios.post("http://127.0.0.1:11434/api/generate", {
            model: "gemma3:4b",
            prompt,
            stream: false,
        });

        // Extract correctness and errortype form llm response
        const feedback = response.data.response || "No feedback generated";

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
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
            prompt: `Generate a ${difficulty === 1 ? "easy" : difficulty === 2 ? "medium" : "hard"} ${dbType} query exercise with 
            a question and answer, tailored to the user's learning level based on their history context: ${context} (do not reveal this information). 
            Format it strictly as: "Question: [question text]\nAnswer: [answer text]" with no additional text or special characters, 
            and ensure the answer appears only after "Answer:".
            - Easy: Basic queries (e.g., simple filters or single-node searches).
            - Medium: Moderate queries (e.g., aggregations, multi-step queries, or basic relationships).
            - Hard: Complex queries (e.g., advanced aggregations, multi-node traversals, or optimization).
            Do not repeat any questions from the user's history provided in the context: ${context} (do not reveal this information).
            Ensure the question is clear, concise, and educational, suitable for a student learning ${dbType}.
            Use these examples for guidance:
            - MongoDB: Question: List all products in the "products" collection with a price less than 50.
            Answer: db.products.find({ price: { $lt: 50 } })
            - Neo4J: Question: Find all nodes labeled "Movie" released after 2010.
            Answer: MATCH (m:Movie) WHERE m.released > 2010 RETURN m
            - Cassandra: Question: Retrieve all products from the "products" table where the price is less than 50.
            Answer: SELECT * FROM products WHERE price < 50 ALLOW FILTERING
            - PostgreSQL: Question: Select all products from the "products" table where the price is less than 50.
            Answer: SELECT * FROM products WHERE price < 50.`,
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
            prompt: `Based on the teacher input: "${prompt}", generate a ${difficulty.toLowerCase()} ${dbType} 
            query exercise with a question and answer, tailored to the user's learning level using their history context: ${context} (do not reveal this information).
            Format it strictly as: "Question: [question text]\nAnswer: [answer text]" with no additional text or special characters,
            and ensure the answer appears only after "Answer:".
            - Easy: Basic queries (e.g., simple filters or single-node searches).
            - Medium: Moderate queries (e.g., aggregations, multi-step queries, or basic relationships).
            - Hard: Complex queries (e.g., advanced aggregations, multi-node traversals, or optimization).
            Use the teacher input as a theme or direct inspiration for the question, ensuring it aligns with the specified difficulty.
            Do not repeat any questions from the user's history.
            Ensure the question is clear, concise, and educational, suitable for a student learning ${dbType}.
            Use these examples for guidance:
            - MongoDB: Question: List all products in the "products" collection with a price less than 50.
            Answer: db.products.find({ price: { $lt: 50 } })
            - Neo4J: Question: Find all nodes labeled "Movie" released after 2010.
            Answer: MATCH (m:Movie) WHERE m.released > 2010 RETURN m
            - Cassandra: Question: Retrieve all products from the "products" table where the price is less than 50.
            Answer: SELECT * FROM products WHERE price < 50 ALLOW FILTERING
            - PostgreSQL: Question: Select all products from the "products" table where the price is less than 50.
            Answer: SELECT * FROM products WHERE price < 50.`,
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

        const prompt = `Evaluate the user's answer: "${userAnswer}" for the question: "${question}", with the correct answer: "${correctAnswer}".
        Use the user's history context: ${context} (do not reveal this information) to provide personalized, encouraging feedback, acting as a supportive learning assistant.
        Also give the user some hints and direction what his mistake is and how to improve it in order to understand the correct solution (not mean).
        Format the response as follows:
        - First, state the sample solution: "Sample Solution: ${correctAnswer}"
        - Provide detailed, user-friendly feedback (strict but kind) to help the user improve.
        - Explain any errors, referencing patterns from the user's history (e.g., "You've had syntax errors before, like in...").
        - Offer specific hints (e.g., "Check the syntax for ${dbType} filters") and actionable steps (e.g., "Review ${dbType} documentation on aggregations at [link]").
        - End with:
        - Correctness: correct (no need to be too harsh on the correctness -> if the answer runs and produces the correct output thats good enough) or Correctness: incorrect
        - ErrorType: syntax, logic, concept, or none (based on the error; use "none" if correct)
        Ensure feedback is clear, educational, and avoids overly technical terms. Use these examples:
        - MongoDB: If the user wrote "db.users.find(age > 25)", suggest: "The syntax needs curly braces: { age: { $gt: 25 } }."
        - Neo4J: If the user wrote "MATCH p:Person WHERE p.age > 25", suggest: "Add parentheses around the node: (p:Person)."
        - Cassandra: If the user wrote "SELECT * FROM products WHERE price < 50", suggest: "You forgot ALLOW FILTERING, which is 
        needed for non-primary key filters in Cassandra: SELECT * FROM products WHERE price < 50 ALLOW FILTERING."
        - PostgreSQL: If the user wrote "SELECT * FROM products WHERE price < 50;", suggest: "Your query is correct but includes an 
        unnecessary semicolon for this context. Use: SELECT * FROM products WHERE price < 50."`

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
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
            a question and answer, tailored to the user's learning level based on their history context: ${context} (do not reveal this information). 
            Format it strictly as: "Question: [question text]\nAnswer: [answer text]" with no additional text or special characters, 
            and ensure the answer appears only after "Answer:".
            - Easy: Basic queries (e.g., simple filters or single-node searches).
            - Medium: Moderate queries (e.g., aggregations, multi-step queries, or basic relationships).
            - Hard: Complex queries (e.g., advanced aggregations, multi-node traversals, or optimization).
            Do not repeat any questions from the user's history provided in the context: ${context} (do not reveal this information).
            Ensure the question is clear, concise, and educational, suitable for a student learning ${dbType}.
            Use these examples for guidance and always state which DB language is used right now:
            - MongoDB: Question: Write a MongoDB query that lists all products in the "products" collection with a price less than 50. 
            Answer: db.products.find({ price: { $lt: 50 } })
            - Neo4J: Question: Write a Neo4J query that finds all nodes labeled "Movie" released after 2010.
            Answer: MATCH (m:Movie) WHERE m.released > 2010 RETURN m
            - Cassandra: Question: Write a Cassandra query that retrieves all products from the "products" table where the price is less than 50.
            Answer: SELECT * FROM products WHERE price < 50 ALLOW FILTERING
            - PostgreSQL: Question: Write a PostgreSQL query that selects all products from the "products" table where the price is less than 50.
            Answer: SELECT * FROM products WHERE price < 50.`,
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
        const difficultyNum = difficulty === "Easy" ? 1 : difficulty === "Medium" ? 2 : 3;
        const response = await axios.post("http://127.0.0.1:11434/api/generate", {
            model: "gemma3:4b",
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
            Use these examples for guidance and always state which DB language is used right now:
            - MongoDB: Question: Write a MongoDB query that lists all products in the "products" collection with a price less than 50. 
            Answer: db.products.find({ price: { $lt: 50 } })
            - Neo4J: Question: Write a Neo4J query that finds all nodes labeled "Movie" released after 2010.
            Answer: MATCH (m:Movie) WHERE m.released > 2010 RETURN m
            - Cassandra: Question: Write a Cassandra query that retrieves all products from the "products" table where the price is less than 50.
            Answer: SELECT * FROM products WHERE price < 50 ALLOW FILTERING
            - PostgreSQL: Question: Write a PostgreSQL query that selects all products from the "products" table where the price is less than 50.
            Answer: SELECT * FROM products WHERE price < 50.`,
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
            1. Sample Solution: [correct answer]
            2. Feedback: [Detailed, beginner-friendly explanation of the user's answer, including whether it is correct or incorrect, and why. Reference patterns from the user's history, e.g., "You've had syntax errors before."]
            3. Hints: [Specific, actionable steps to improve, e.g., "Check the syntax for ${dbType} filters." Include a resource link, e.g., "Review ${dbType} documentation at [link]."]
            4. Correctness: [correct if the answer runs and produces the correct output; otherwise incorrect]
            5. ErrorType: [syntax, logic, concept, or none; use "none" if correct]

            Accept alternative correct solutions that differ in syntax or style from the sample, as long as they would run correctly on the specified database and yield the intended result.
            Ensure each section is on a new line, labeled exactly as shown, and contains only the specified content. Use these examples for guidance:
            - MongoDB:
            1. Sample Solution: db.users.find({ age: { $gt: 25 } })
            2. Feedback: Your answer, db.users.find(age > 25), is incorrect because MongoDB requires curly braces and the $gt operator for comparisons. You've had similar syntax errors before.
            3. Hints: Use { $gt: value } for greater-than queries. Review MongoDB query operators at https://docs.mongodb.com/manual/reference/operator/query/.
            4. Correctness: incorrect
            5. ErrorType: syntax
            - Neo4J:
            1. Sample Solution: MATCH (p:Person) WHERE p.age > 25 RETURN p
            2. Feedback: Your answer, MATCH p:Person WHERE p.age > 25, is incorrect because Neo4J requires parentheses around the node label. This is a common syntax mistake in your history.
            3. Hints: Always use (p:Person) for nodes. Check Neo4J syntax at https://neo4j.com/docs/cypher-manual/current/.
            4. Correctness: incorrect
            5. ErrorType: syntax
            - Cassandra:
            1. Sample Solution: SELECT * FROM products WHERE price < 50 ALLOW FILTERING
            2. Feedback: Your answer, SELECT * FROM products WHERE price < 50, is incorrect because Cassandra requires ALLOW FILTERING for non-primary key filters. You've missed this in past exercises.
            3. Hints: Add ALLOW FILTERING for non-key filters. Review Cassandra CQL at https://cassandra.apache.org/doc/latest/cql/.
            4. Correctness: incorrect
            5. ErrorType: syntax
            - PostgreSQL:
            1. Sample Solution: SELECT * FROM products WHERE price < 50
            2. Feedback: Your answer, SELECT * FROM products WHERE price < 50;, is correct but includes an unnecessary semicolon for this context. Your history shows attention to detail, so this is minor.
            3. Hints: Omit the semicolon in this app's answer format. Review PostgreSQL SELECT at https://www.postgresql.org/docs/current/sql-select.html.
            4. Correctness: correct
            5. ErrorType: none
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
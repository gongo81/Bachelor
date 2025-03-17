const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const axios = require('axios');
const cors = require('cors');
const app = express();
const port = 5000;

app.use(express.json());
app.use(cors());

// SQLite Database Setup
const db = new sqlite3.Database('./exercises.db', (err) => {
    if (err) console.error(err.message);
    console.log('Connected to SQLite database.');
});

db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE
)`);

db.run(`CREATE TABLE IF NOT EXISTS exercises (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER,
    question TEXT,
    answer TEXT,
    userAnswer TEXT,
    feedback TEXT,
    difficulty INTEGER DEFAULT 1,
    isCorrect INTEGER DEFAULT 0,
    errorType TEXT,
    FOREIGN KEY (userId) REFERENCES users(id)
)`);

// Helper function to get or create user
const getOrCreateUser = (username) => {
    return new Promise((resolve, reject) => {
        db.get(`SELECT id FROM users WHERE username = ?`, [username], (err, row) => {
            if (err) return reject(err);
            if (row) return resolve(row.id);
            db.run(`INSERT INTO users (username) VALUES (?)`, [username], function(err) {
                if (err) return reject(err);
                resolve(this.lastID);
            });
        });
    });
};
 
// Helper function to get user context (includes performance, previous questions, and answers)
const getUserContext = (userId) => {
    return new Promise((resolve, reject) => {
        db.all(`SELECT difficulty, isCorrect, errorType, question, userAnswer FROM exercises WHERE userId = ?`, [userId], (err, rows) => {
            if (err) return reject(err);

            // Performance stats
            const total = rows.length;
            const correct = rows.filter(r => r.isCorrect === 1).length;
            const successRate = total ? correct / total : 0;
            const avgDifficulty = total ? rows.reduce((sum, r) => sum + r.difficulty, 0) / total : 1;

            const errorCounts = rows.reduce((acc, row) => {
                if (row.errorType && row.errorType !== 'none') {
                    acc[row.errorType] = (acc[row.errorType] || 0) + 1;
                }
                return acc;
            }, {});
            const frequentError = Object.entries(errorCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'none';

            // Previous questions and answers
            const previousInteractions = rows.map(row => 
                `${row.question} (User Answer: ${row.userAnswer || 'Not answered yet'})`
            );
            const previousInteractionsText = previousInteractions.length > 0 
                ? `Previous interactions (do not repeat these questions): ${previousInteractions.join('; ')}` 
                : 'No previous interactions yet';

            // Construct context string
            const context = `
                User Performance: ${successRate * 100}% correct, average difficulty: ${avgDifficulty.toFixed(1)}, frequent error: ${frequentError}.
                ${previousInteractionsText}.
            `.trim();

            resolve({ context, successRate });
        });
    });
};

// Endpoint to Generate Exercise
app.post('/generate-exercise', async (req, res) => {
    const { dbType, username } = req.body;

    try {
        const userId = await getOrCreateUser(username);
        const { context, successRate } = await getUserContext(userId);
        const difficulty = successRate > 0.8 ? 3 : successRate > 0.5 ? 2 : 1;

        console.log(context)

        const response = await axios.post('http://127.0.0.1:11434/api/generate', {
            model: 'llama3.1:latest',
            prompt: `Generate a ${difficulty === 1 ? 'easy' : difficulty === 2 ? 'medium' : 'hard'} ${dbType} query exercise with a question and answer. 
            Format it as: "Question: [question text]\nAnswer: [answer text]" and please make sure that just the actual answer is given after "Answer:". 
            Context: ${context} (do not reveal the context to the user)`,
            stream: false
        });

        const result = response.data.response || '';
        console.log(result);
        const [question, answer] = result.split('\nAnswer:');

        const trimmedQuestion = question ? question.trim() : 'No question generated';
        const trimmedAnswer = answer ? answer.trim() : 'No answer provided';

        db.run(`INSERT INTO exercises (userId, question, answer, difficulty) VALUES (?, ?, ?, ?)`, 
            [userId, trimmedQuestion, trimmedAnswer, difficulty], 
            (err) => { if (err) console.error(err); }
        );

        res.json({ question: trimmedQuestion, answer: trimmedAnswer });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error generating exercise');
    }
});

// Endpoint to Evaluate Answer
app.post('/evaluate-answer', async (req, res) => {
    const { question, userAnswer, username, dbType } = req.body;

    try {
        const userId = await getOrCreateUser(username);
        const { context } = await getUserContext(userId);

        db.get(`SELECT answer FROM exercises WHERE question = ? AND userId = ?`, [question, userId], async (err, row) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Error fetching correct answer');
            }
            const correctAnswer = row?.answer.trim() || '';

            const prompt = `Evaluate this answer from the user: "${userAnswer}", for the question: "${question}". 
            The correct answer is "${correctAnswer}". 
            Provide strict, detailed feedback (not mean) to help the user improve. 
            Also state the sample solution first to the user.
            At the end, explicitly state: 
            - "Correctness: correct" if the answer is correct, or "Correctness: incorrect" if not. 
            Dont be too strict regarding the correctness of the userAnswer, as long as the general userAnswer would run correctly 
            and give the wanted output then count it as correct, it does not necessarily have to be the exact same code as the correctAnswer.
            - "ErrorType: [syntax, logic, concept, or none]" based on the error (use "none" if correct).
            Context: ${context} (do not reveal the context to the user)`;

            const response = await axios.post('http://127.0.0.1:11434/api/generate', {
                model: 'llama3.1:latest',
                prompt,
                stream: false
            });

            const feedback = response.data.response || 'No feedback generated';
            console.log(feedback);

            const isCorrectMatch = feedback.match(/Correctness: (correct|incorrect)/i);
            const isCorrect = isCorrectMatch && isCorrectMatch[1].toLowerCase() === 'correct' ? 1 : 0;

            const errorTypeMatch = feedback.match(/ErrorType: (syntax|logic|concept|none)/i);
            const errorType = errorTypeMatch ? errorTypeMatch[1].toLowerCase() : 'none';

            db.run(`UPDATE exercises SET userAnswer = ?, feedback = ?, isCorrect = ?, errorType = ? WHERE question = ? AND userId = ?`, 
                [userAnswer, feedback, isCorrect, errorType, question, userId], 
                (err) => { if (err) console.error(err); }
            );

            res.json({ feedback });
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error evaluating answer');
    }
});

app.listen(port, () => {
    console.log(`Backend running on http://localhost:${port}`);
});
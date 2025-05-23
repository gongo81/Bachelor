const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./exercises.db", (err) => {
    if (err) console.error(err.message);
    console.log("Connected to SQLite database.");
});

db.configure("busyTimeout", 5000);

// Create tables
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
    isTeacherCreated INTEGER DEFAULT 0,
    FOREIGN KEY (userId) REFERENCES users(id)
)`);

// Create a user
const createUser = (username) => {
    return new Promise((resolve, reject) => {
        db.run(`INSERT INTO users (username) VALUES (?)`, [username], function (err) {
            if (err) {
                if (err.code === "SQLITE_CONSTRAINT") {
                    return reject(new Error("Username already exists"));
                }
                return reject(err);
            }
            resolve({ message: "Student user created successfully" });
        });
    });
};

// Delete a user
const deleteUser = (username) => {
    return new Promise((resolve, reject) => {
        db.run(`DELETE FROM users WHERE username = ?`, [username], function (err) {
            if (err) return reject(err);
            if (this.changes === 0) return reject(new Error("User not found"));
            resolve({ message: "User deleted successfully" });
        });
    });
};

// Check if a user exists
const checkUserExists = (username) => {
    return new Promise((resolve, reject) => {
        db.get(`SELECT id FROM users WHERE username = ?`, [username], (err, row) => {
            if (err) return reject(err);
            resolve(!!row);
        });
    });
};

// Get or create a user
const getOrCreateUser = (username, createIfNotFound = true) => {
    return new Promise((resolve, reject) => {
        db.get(`SELECT id FROM users WHERE username = ?`, [username], (err, row) => {
            if (err) return reject(err);
            if (row) return resolve(row.id);

            if (!createIfNotFound) return reject(new Error("User not found"));

            db.run(`INSERT INTO users (username) VALUES (?)`, [username], function (err) {
                if (err) return reject(err);
                resolve(this.lastID);
            });
        });
    });
};

// Get user context
const getUserContext = (userId) => {
    return new Promise((resolve, reject) => {
        db.all(`SELECT difficulty, isCorrect, errorType, question, userAnswer FROM exercises WHERE userId = ?`, [userId], (err, rows) => {
            if (err) return reject(err);

            // Calculate successrate and avgdifficulty
            const total = rows.length;
            const correct = rows.filter((r) => r.isCorrect === 1).length;
            const successRate = total ? correct / total : 0;
            const avgDifficulty = total ? rows.reduce((sum, r) => sum + r.difficulty, 0) / total : 1;

            // Calculate most frequent error type
            const errorCounts = {};
            let frequentError = "none";
            let maxCount = 0;

            for (const row of rows) {
                const error = row.errorType;
                if (error && error !== "none") {
                    errorCounts[error] = (errorCounts[error] || 0) + 1;

                    if (errorCounts[error] > maxCount) {
                        maxCount = errorCounts[error];
                        frequentError = error;
                    }
                }
            }

            // Construct user context 
            const previousInteractions = rows.map((row) => `${row.question} (User Answer: ${row.userAnswer || "Not answered yet"})`);

            const context = 
`User Performance Overview
-------------------------
- Success Rate: ${(successRate * 100).toFixed(1)}%
- Average Difficulty: ${avgDifficulty.toFixed(1)}
- Most Frequent Error: ${frequentError}

Previous Interactions
---------------------
${previousInteractions.map((entry, i) => `${i + 1}. ${entry}`).join("\n \n")}`;

            resolve({ context, successRate });
        });
    });
};

// Insert an exercise
const insertExercise = (userId, question, answer, difficulty, isTeacherCreated) => {
    return new Promise((resolve, reject) => {
        db.run(
            `INSERT INTO exercises (userId, question, answer, difficulty, isTeacherCreated) VALUES (?, ?, ?, ?, ?)`,
            [userId, question, answer, difficulty, isTeacherCreated],
            (err) => {
                if (err) return reject(err);
                resolve();
            }
        );
    });
};

// Get teacher-created exercises
const getTeacherExercises = (userId) => {
    return new Promise((resolve, reject) => {
        db.all(
            `SELECT question, answer FROM exercises WHERE userId = ? AND isTeacherCreated = 1 AND userAnswer IS NULL`,
            [userId],
            (err, rows) => {
                if (err) return reject(err);
                resolve(rows);
            }
        );
    });
};

// Get correct answer for a question
const getCorrectAnswer = (userId, question) => {
    return new Promise((resolve, reject) => {
        db.get(`SELECT answer FROM exercises WHERE question = ? AND userId = ?`, [question, userId], (err, row) => {
            if (err) return reject(err);
            resolve(row?.answer.trim() || "");
        });
    });
};

// Update exercise with user answer and feedback
const updateExerciseAnswer = (userId, question, userAnswer, feedback, isCorrect, errorType) => {
    return new Promise((resolve, reject) => {
        db.run(
            `UPDATE exercises SET userAnswer = ?, feedback = ?, isCorrect = ?, errorType = ? WHERE question = ? AND userId = ?`,
            [userAnswer, feedback, isCorrect, errorType, question, userId],
            (err) => {
                if (err) return reject(err);
                resolve();
            }
        );
    });
};

module.exports = {
    db,
    createUser,
    deleteUser,
    checkUserExists,
    getOrCreateUser,
    getUserContext,
    insertExercise,
    getTeacherExercises,
    getCorrectAnswer,
    updateExerciseAnswer,
};
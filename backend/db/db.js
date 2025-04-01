const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./exercises.db', (err) => {
    if (err) console.error(err.message);
    console.log('Connected to SQLite database.');
});

db.configure('busyTimeout', 5000);

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

const getOrCreateUser = (username, createIfNotFound = true) => {
    return new Promise((resolve, reject) => {
        db.get(`SELECT id FROM users WHERE username = ?`, [username], (err, row) => {
            if (err) return reject(err);
            if (row) return resolve(row.id);

            if (!createIfNotFound) return reject(new Error('User not found'));

            db.run(`INSERT INTO users (username) VALUES (?)`, [username], function(err) {
                if (err) return reject(err);
                resolve(this.lastID);
            });
        });
    });
};

const getUserContext = (userId) => {
    return new Promise((resolve, reject) => {
        db.all(`SELECT difficulty, isCorrect, errorType, question, userAnswer FROM exercises WHERE userId = ?`, [userId], (err, rows) => {
            if (err) return reject(err);

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

            const previousInteractions = rows.map(row => 
                `${row.question} (User Answer: ${row.userAnswer || 'Not answered yet'})`
            );
            const previousInteractionsText = previousInteractions.length > 0 
                ? `Previous interactions (do not repeat these questions): ${previousInteractions.join('; ')}` 
                : 'No previous interactions yet';

            const context = `
                User Performance: ${successRate * 100}% correct, average difficulty: ${avgDifficulty.toFixed(1)}, frequent error: ${frequentError}.
                Previous asked questions: ${previousInteractionsText}.
            `.trim();

            resolve({ context, successRate });
        });
    });
};

module.exports = { db, getOrCreateUser, getUserContext };
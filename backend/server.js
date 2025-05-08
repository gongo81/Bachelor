const express = require('express');
const cors = require('cors');
const apiRouter = require('./routes/api');

// Initializing backend setup
const app = express();
const port = 5000;

app.use(express.json());
app.use(cors());
app.use('/api', apiRouter);

app.listen(port, () => {
    console.log(`Backend running on http://localhost:${port}`);
});
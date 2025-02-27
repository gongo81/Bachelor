const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const axios = require("axios"); // For calling Ollama API

const app = express();
const PORT = 8000; // Backend server port

app.use(cors());
app.use(bodyParser.json());

// Route to communicate with Ollama
app.post("/chat", async (req, res) => {
    const { message } = req.body;

    try {
        const response = await axios.post("http://127.0.0.1:11434/api/generate", {
            model: "llama3.1:latest",
            prompt: message,
            stream: false,
        });

        res.json({ reply: response.data.response });
    } catch (error) {
        console.error("Error communicating with Ollama:", error);
        res.status(500).json({ error: "Failed to generate response" });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

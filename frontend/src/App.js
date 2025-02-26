import React, { useState } from "react";
import axios from "axios";
import "./App.css"; // Import custom CSS

function App() {
  const [input, setInput] = useState("");
  const [response, setResponse] = useState("");

  const handleSend = async () => {
    try {
      const res = await axios.post("http://localhost:8000/api/ask", {
        question: input,
      });

      setResponse(res.data.answer);
    } catch (error) {
      console.error("Error:", error);
      setResponse("Error retrieving response.");
    }
  };

  return (
    <div className="container">
      <h1>Ollama Chat</h1>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        className="input"
        placeholder="Enter your question..."
      />
      <button onClick={handleSend} className="button">Send</button>
      <div className="response-box">
        <strong>Response:</strong>
        <p>{response}</p>
      </div>
    </div>
  );
}

export default App;

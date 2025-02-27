import React, { useState } from "react";
import axios from "axios";
import "./App.css"; // Import the separate CSS file

function App() {
    const [message, setMessage] = useState("");
    const [chat, setChat] = useState([]);

    const sendMessage = async () => {
        if (!message.trim()) return;

        const newChat = [...chat, { sender: "User", text: message }];
        setChat(newChat);

        try {
            const response = await axios.post("http://localhost:8000/chat", { message });
            setChat([...newChat, { sender: "AI", text: response.data.reply }]);
        } catch (error) {
            console.error("Error:", error);
            setChat([...newChat, { sender: "AI", text: "Error communicating with AI." }]);
        }

        setMessage("");
    };

    return (
        <div className="chat-container">
            <h2>AI Chatbot</h2>
            <div className="chat-box">
                {chat.map((msg, index) => (
                    <div key={index} className="chat-message">
                        <strong>{msg.sender}:</strong> {msg.text}
                    </div>
                ))}
            </div>
            <div className="input-container">
                <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="chat-input"
                    placeholder="Type a message..."
                />
                <button onClick={sendMessage} className="send-button">Send</button>
            </div>
        </div>
    );
}

export default App;

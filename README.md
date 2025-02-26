# FastAPI + React + Ollama (DeepSeek) Chatbot

This project sets up a **React frontend**, a **FastAPI backend**, and an **Ollama-powered LLM (DeepSeek)** running **locally**.

---

## **Installation Steps**

### 1 **Clone the Repository**
sh
git clone <your-repo-url>
cd <your-repo-name>

### 2 **Setup Backend (FastAPI)**

# **Install Python dependencies**
cd backend
python -m venv venv  # Create a virtual environment (optional)
source venv/bin/activate  # Activate venv (Mac/Linux)
venv\Scripts\activate  # Activate venv (Windows)

pip install fastapi pydantic requests uvicorn

# **Start the Backend**
uvicorn main:app --reload --host 0.0.0.0 --port 8000

### 3 **Install Ollama (DeepSeek)**

# **Install Ollama**
curl -fsSL https://ollama.com/install.sh | sh  # Mac/Linux
# For Windows, follow Ollama's official installation guide

ollama pull deepseek-r1:14b

# **Start Ollama**
ollama serve

### 3 **Setup Frontend (React)**

# **Install frontend dependencies**
Install Node.js (if not installed)
Download & install Node.js from: https://nodejs.org

cd ../frontend
npm install axios

ollama pull deepseek-r1:14b

# **Start React frontend**
npm start

## Project Structure##
project-root/
│── backend/
│   │── main.py  # FastAPI backend
│   │── venv/  # Python virtual environment (optional)
│   │── requirements.txt  # Python dependencies (if using a requirements file)
│
│── frontend/
│   │── src/
│   │   │── App.js  # React app
│   │   │── App.css  # Styles
│   │   │── index.js  # React entry point
│   │── package.json  # Frontend dependencies
│
│── README.md  # This file



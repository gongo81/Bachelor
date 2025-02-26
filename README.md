# NoSQLconcepts + FastAPI + React + Ollama (DeepSeek) - An AI-Powered Learning Assistant for NoSQL Databases

This project enhances the **NoSQLconcepts** React Web Application by integrating a **Large Language Model (LLM)** to provide **personalized exercises and automated feedback** for learning NoSQL databases. It combines a **React frontend**, a **FastAPI backend**, and an **Ollama-powered LLM (DeepSeek)** running **locally**.

---

## **Project Goal**

The goal of this project is to **integrate an LLM into NoSQLconcepts** to generate **personalized database exercises** and **automatically evaluate user solutions**. The system will:

- Provide **interactive database exercises** using natural language input for **PostgreSQL (SQL), Cassandra (CQL), Neo4J (Cypher), and MongoDB (MQL)**.
- Automatically **evaluate user solutions** and generate **feedback** based on common mistakes and best practices.
- Support both **automated task generation** and **manual instructor-defined exercises**.

---

## **Installation Steps**

### 1. **Clone the Repository**
```sh
git clone https://github.com/gongo81/Bachelor.git
cd bachelor
```

### 2. **Setup Backend (FastAPI)**

#### **Install Python dependencies**
```sh
cd backend
python -m venv venv  # Create a virtual environment (optional)
source venv/bin/activate  # Activate venv (Mac/Linux)
venv\Scripts\activate  # Activate venv (Windows)

pip install -r requirements.txt  # Install dependencies
```

#### **Start the Backend**
```sh
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 3. **Install Ollama (DeepSeek)**

#### **Install Ollama**
```sh
curl -fsSL https://ollama.com/install.sh | sh  # Mac/Linux
```
For Windows, follow [Ollama's official installation guide](https://ollama.com/docs/installation).

#### **Download and Start Ollama**
```sh
ollama pull deepseek-r1:14b
ollama serve
```

### 4. **Setup Frontend (React)**

#### **Install Frontend Dependencies**
- Ensure **Node.js** is installed. If not, download and install it from [Node.js Official Website](https://nodejs.org).

```sh
cd ../frontend
npm install  # Install dependencies
```

#### **Start React Frontend**
```sh
npm start
```

---

## **Project Structure**
```
project-root/
│── backend/
│   │── main.py  # FastAPI backend
│   │── venv/  # Python virtual environment (optional)
│   │── requirements.txt  # Python dependencies
│
│── frontend/
│   │── src/
│   │   │── App.js  # React app
│   │   │── App.css  # Styles
│   │   │── index.js  # React entry point
│   │── package.json  # Frontend dependencies
│
│── README.md  # This file
```

## **License**
This project is open-source. Feel free to use and modify it as needed.

---

## **Contributions & Issues**
If you find any issues or want to contribute, feel free to submit a pull request or open an issue in the [GitHub Repository](https://github.com/gongo81/Bachelor).

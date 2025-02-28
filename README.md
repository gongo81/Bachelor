# NoSQLconcepts + Node.js + React + Ollama - An AI-Powered Learning Assistant for NoSQL Databases

This project enhances the **NoSQLconcepts** React Web Application by integrating a **Large Language Model (LLM)** to provide **personalized exercises and automated feedback** for learning NoSQL databases. It combines a **React frontend**, a **Node.js backend**, and an **Ollama-powered LLM** running **locally**.

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

### 2. **Setup Backend (Node.js)**

#### **Install Dependencies**
```sh
cd backend
npm install express cors axios body-parser dotenv
```

#### **Start the Backend**
```sh
node server.js
```

### 3. **Install Ollama**

#### **Install Ollama**
```sh
curl -fsSL https://ollama.com/install.sh | sh  # Mac/Linux
```
For Windows, follow [Ollama's official installation guide](https://ollama.com/docs/installation).

#### **Download and Start Ollama**
```sh
ollama pull llama3.1:latest # or other model
ollama serve
```

### 4. **Setup Frontend (React)**

#### **Install Frontend Dependencies**
- Ensure **Node.js** is installed. If not, download and install it from [Node.js Official Website](https://nodejs.org).

```sh
cd frontend
npm install axios 
```

#### **Start React Frontend**
```sh
npm start
```

---

### 5. **Setup MongoDB Database** 

#### **Install MongoDB Dependencies**
```sh
# Node.js
npm install mongoose dotenv
```

#### **Connect to MongoDB**

---

## **License**
This project is open-source. Feel free to use and modify it as needed.

---

## **Contributions & Issues**
If you find any issues or want to contribute, feel free to submit a pull request or open an issue in the [GitHub Repository](https://github.com/gongo81/Bachelor).

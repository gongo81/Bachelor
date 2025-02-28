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
npm install
```

#### **Create a `.env` File**
Create a `.env` file in the `backend` folder and add:
```sh
MONGO_URI=mongodb://localhost:27017/test
```

#### **Start the Backend**
```sh
npm start  # Or use `npm run dev` if nodemon is installed
```

### 3. **Install and Run Ollama**

#### **Install Ollama**
```sh
curl -fsSL https://ollama.com/install.sh | sh  # Mac/Linux
```
For Windows, follow [Ollama's official installation guide](https://ollama.com/docs/installation).

#### **Download and Start Ollama**
```sh
ollama pull llama3.1:latest  # Or another model
ollama serve
```

### 4. **Setup Frontend (React)**

#### **Install Frontend Dependencies**
Ensure **Node.js** is installed. If not, download and install it from [Node.js Official Website](https://nodejs.org).

```sh
cd frontend
npm install
```

#### **Start React Frontend**
```sh
npm start
```

---

### 5. **Setup MongoDB Database**

#### **Install MongoDB Locally (If Not Using Atlas)**
- **Windows:** Follow [MongoDB Installation Guide](https://www.mongodb.com/docs/manual/installation/).
- **Mac/Linux:**
```sh
brew install mongodb-community
brew services start mongodb-community
```

#### **Install MongoDB Dependencies**
```sh
cd backend
npm install mongoose dotenv
```

#### **Ensure MongoDB is Running**
```sh
mongod --dbpath="C:\data\db"  # Windows
sudo systemctl start mongod      # Mac/Linux
```

#### **Connect to MongoDB Atlas (Alternative)**
If using **MongoDB Atlas**, replace the local URI in `.env` with:
```sh
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/test?retryWrites=true&w=majority
```
Then restart the backend.

---

## **License**
This project is open-source. Feel free to use and modify it as needed.

---

## **Contributions & Issues**
If you find any issues or want to contribute, feel free to submit a pull request or open an issue in the [GitHub Repository](https://github.com/gongo81/Bachelor).

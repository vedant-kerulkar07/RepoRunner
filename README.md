# AI Code Analysis & Output Prediction

An AI-powered code analysis application that analyzes source code from a GitHub repository, explains program logic, predicts possible output, identifies potential compilation issues, and suggests fixes using Generative AI.

## 🚀 Features

- **GitHub Repository Analysis** — Analyze source files discovered in a connected repository.
- **Source Code Explorer** — Browse available source files and view their contents.
- **AI Code Analysis** — Understand program logic and receive a structured explanation of the code.
- **Compilation Assessment** — Predict whether code is likely to compile successfully or fail based on AI analysis.
- **Output Prediction** — Generate a possible program output without necessarily executing the program.
- **Compilation Issue Detection** — Identify potential syntax errors, missing declarations, and other compilation problems.
- **Suggested Fixes** — Receive AI-generated suggestions to help resolve potential issues.
- **Step-by-Step Logic** — Review the program's logic in an understandable sequence.
- **Interactive Input Support** — Provide input when the analysis identifies that a program may require it.
- **Warnings and Limitations** — View uncertainties and limitations associated with AI predictions.
- **Copy Analysis Results** — Copy the analysis report for future reference.

## 🛠️ Tech Stack

### Frontend
- React
- React Router
- Tailwind CSS
- Lucide React
- JavaScript

### Backend
- Node.js
- Express.js
- REST API

### AI Integration
- Groq API
- Large Language Model (LLM) for code analysis and output prediction

### Development Tools
- Git and GitHub
- Visual Studio Code
- npm

## ⚙️ How It Works

1. Select or connect a GitHub repository.
2. Retrieve and explore the available source files.
3. Select the file you want to analyze.
4. Send the source file to the backend for AI-powered analysis.
5. The backend processes the request and obtains a structured response from the AI model.
6. Review the predicted compilation status, potential output, explanation, issues, and suggested fixes.
7. If the program requires input, provide the input and request an updated prediction.

## 📊 Analysis Results

The application can present the following information:

| Result | Description |
|---|---|
| Compilation Assessment | AI's prediction of whether the code is likely to compile |
| Predicted Output | Possible output inferred from the source code |
| Explanation | A natural-language explanation of the program |
| Compilation Issues | Potential errors that may prevent compilation |
| Suggested Fix | Recommended changes to address detected issues |
| Logic Steps | Step-by-step explanation of the program's flow |
| Potential Issues | Other problems identified during analysis |
| Warnings | Important considerations about the code |
| Limitations | Uncertainties that may affect the prediction |

## 🖥️ Getting Started

### Prerequisites

Make sure you have installed:

- Node.js and npm
- Git
- A Groq API key

### 1. Clone the Repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd <YOUR_PROJECT_FOLDER>
```

Replace the placeholders with your actual GitHub repository URL and project folder name.

### 2. Install Dependencies

Install the frontend dependencies from the frontend directory:

```bash
cd frontend
npm install
```

Install the backend dependencies from the backend directory:

```bash
cd ../backend
npm install
```

> Adjust the directory names according to your actual project structure.

### 3. Configure Environment Variables

Create a `.env` file in the backend directory and add the variables required by your application.

For example:

```env
PORT=5000
GROQ_API_KEY=your_groq_api_key
```

Add any additional environment variables required by your repository configuration or API setup.

**Security:** Never commit your `.env` file or expose your API key in frontend code. Add `.env` to your `.gitignore` file.

### 4. Run the Backend

From the backend directory, run:

```bash
npm run dev
```

If your project does not define a `dev` script, use the start command configured in your `package.json`.

### 5. Run the Frontend

Open a separate terminal:

```bash
cd frontend
npm run dev
```

Open the local URL displayed by Vite in your terminal.

## 📁 Project Structure

The exact directory names may differ depending on your implementation.

```text
project-root/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   │   ├── WorkspacePage.jsx
│   │   │   └── AnalysisResultPage.jsx
│   │   ├── services/
│   │   └── ...
│   ├── package.json
│   └── ...
├── backend/
│   ├── controllers/
│   ├── routes/
│   ├── services/
│   ├── runners/
│   ├── package.json
│   └── ...
├── .gitignore
└── README.md
```

## 🔐 Environment Variables

| Variable | Purpose |
|---|---|
| `PORT` | Port on which the backend server runs |
| `GROQ_API_KEY` | API key used for Groq AI requests |

Your project may require additional variables, such as a frontend URL or GitHub integration configuration. Configure them according to your backend implementation.

## ⚠️ Important Notes

- **AI predictions are not compiler verification.** A predicted compilation failure does not prove that a compiler rejected the program.
- **Predicted output is not guaranteed to be correct.** Results may differ from actual execution, especially when code depends on user input, runtime state, external resources, or language-specific behavior.
- AI-generated fixes should be reviewed and tested before being used.
- Do not upload source code containing passwords, API keys, tokens, or other confidential information.
- Actual compilation and execution are available only if the appropriate language-specific compiler or execution service is integrated and enabled.

## 🔮 Future Improvements

- Integrate compiler services for verified compilation results.
- Add support for more programming languages.
- Improve input handling for interactive programs.
- Add downloadable analysis reports.
- Provide code quality and complexity analysis.
- Add automated tests for API endpoints and analysis workflows.
- Improve error handling and AI response validation.

## 🤝 Contributing

Contributions, suggestions, and bug reports are welcome.

1. Fork the repository.
2. Create a feature branch.
3. Commit your changes.
4. Push the branch to your fork.
5. Open a pull request.


---

**Built with React, Node.js, Express, and Groq AI.**

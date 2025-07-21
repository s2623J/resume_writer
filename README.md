
# 💼 Resume & Cover Letter Generator with LLM 🧠

A local TypeScript app that uses an LLM (via Ollama server) and langchain to create **personalized resumes and cover letters** from your base resume and a list of job listings.  

Everything runs privately on your machine — no data leaves your desktop! 🖥️🔒

---

## 📁 Project Structure

```
|   .gitignore
|   package-lock.json
|   package.json
|   README.md
|   tsconfig.json
|
+---data
|       base_resume.txt       📄 ← Your full resume in plain text
|       criteria.txt          📋 ← Writing & formatting rules
|       job_inputs.json       🌐 ← Job listings to process
|
+---generated
|   \---Insight Global        📂 ← Sample output folder per employer
|           cover_letter.docx
|           cover_letter.txt
|           resume.docx
|           resume.txt
|
+---src
|       index.ts              🧠 ← Main processing logic
|
\---test                     🧪 ← Unit tests
        fullGeneration.test.ts
        parseAgentOutput.test.ts
```

---

## 📝 `job_inputs.json` Format

```json
[
  {
    "job_number": "123456",
    "job_title": "XXXXXXXXXX",
    "job_posting_company": "XXXXXXXXXX",
    "job_posting_url": "XXXXXXXXXX"
  }
]
```

📌 Each job entry triggers a tailored resume + cover letter pair.

---

## 📎 `base_resume.txt` Format

Just paste in the **entire plain-text version** of your resume here.  
Make sure it's clean and easy to parse. No formatting required. 🧾

---

## 📜 `criteria.txt` Format

Use this to guide the LLM's writing style and formatting for the resume and cover letter.  
For example:

```
- Highlight relevant experience from base resume
- Use formal, concise language
- Do not skip or summarize any experience
- Resume: 2–4 pages max, single-line spacing
- Cover letter: 3–4 paragraphs
```

You can tweak this file anytime to influence output ✨

---

## 🚀 How to Run

1. 🛠️ Install dependencies:

   ```bash
   npm install
   ```

2. 🔁 Compile TypeScript:

   ```bash
   npm run build
   ```

3. 📂 Start generation (requires content be in both base_resume.txt and job_inputs.json):

   ```bash
   npm run start
   ```

4. 🧪 Run tests (takes up to 20min per job listing):

   ```bash
   npm run test
   ```

---

## 💡 Tech Stack

- 🟦 TypeScript
- 🧠 Ollama (LLM-powered text generation)
- 📝 Outputs in both `.txt` and `.docx` formats (Word-compatible)
- ⚙️ Everything runs locally — no cloud API keys required

---

## 🧪 Testing

All logic is covered by unit tests located in the `test/` folder.  
Run tests from the root with:

```bash
npm run test
```

---

## 🔒 Privacy Notice

This app runs entirely on your local machine. No job data or resume information is ever uploaded or shared externally.

---

## 👤 Author

**David Michael**  
GitHub: [@s2623J](https://github.com/s2623J)
Email: dm_oregon_developer@pm.me


**Happy applying!** 🎯📄💼

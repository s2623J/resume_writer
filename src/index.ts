import fs from "fs-extra";
import path from "path";
import 'dotenv/config';
import { ChatOllama } from "@langchain/community/chat_models/ollama";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { Document, Packer, Paragraph, TextRun } from "docx";

interface Job {
  job_number: string;
  job_title: string;
  job_posting_company: string;
  job_posting_url: string;
  job_posting_content: string;
}

const dataset: Job[] = JSON.parse(await fs.readFile("data/job_inputs.json", "utf-8"));
const criteria = await fs.readFile("data/criteria.txt", "utf-8");
const baseResume = await fs.readFile("data/base_resume.txt", "utf-8");

await fs.ensureDir("generated");

const chatA = new ChatOllama({ model: "llama3:latest" });
const chatB = new ChatOllama({ model: "llama3:latest" });

const initialPromptA = ChatPromptTemplate.fromMessages([
  ChatPromptTemplate.fromTemplate(
    `You are Agent A. Your task is to generate a customized Resume and Cover Letter based on the base resume, the job posting, and the criteria.

    Behavior and formatting instructions:
    - Provide your response ONLY with two sections: "Resume:" followed by resume text, and "Cover Letter:" followed by cover letter text.
    - Do NOT include analysis.
    - Do NOT leave ANY placeholders like [Company Name], [Job Title], or [Hiring Manager]; replace them with details from the job posting and base resume if available, or remove them entirely if missing.
    - Your resume must include ALL 11 listed job events in the "Professional Experience" section from the base resume and be grouped into:
      1. "Relevant Professional Experience" MUST include 3 most relevant job experiences
      2. "Additional Professional Experience" MUST include all remaining 8 job experiences

    Criteria to follow:
    {criteria}

    Base Resume:
    {baseResume}

    Job Posting:
    {jobPosting}`
  ),
]);

const editPromptA = ChatPromptTemplate.fromMessages([
  ChatPromptTemplate.fromTemplate(
    `You are Agent A. Your task is to EDIT the given Resume and Cover Letter according to the criteria and Agent B’s feedback.

    Behavior and formatting instructions:
    - Provide your response ONLY with two sections: "Resume:" followed by resume text, and "Cover Letter:" followed by cover letter text.
    - Do NOT include analysis.
    - Do NOT leave ANY placeholders like [Company Name], [Job Title], or [Hiring Manager]; replace them with details from the job posting and base resume if available, or remove them entirely if missing.
    - Your resume must include ALL 11 listed job events in the "Professional Experience" section from the base resume and be grouped into:
      1. "Relevant Professional Experience" MUST include 3 most relevant job experiences
      2. "Additional Professional Experience" MUST include all remaining 8 job experiences

    Criteria to follow:
    {criteria}

    Agent B's feedback:
    {feedback}

    Base Resume:
    {baseResume}

    Job Title:
    {jobTitle}

    Company Name:
    {companyName}

    Job Posting:
    {jobPosting}

    Job Posting URL:
    {jobUrl}

    Current Resume and Cover Letter:
    {generated}`
  ),
]);

const promptB = ChatPromptTemplate.fromMessages([
  ChatPromptTemplate.fromTemplate(
    `You are Agent B. Evaluate the generated Resume and Cover Letter below against the provided criteria.

    Behavior and formatting instructions:
    - Your resume must include ALL 11 listed job events in the "Professional Experience" section from the base resume and be grouped into:
      1. "Relevant Professional Experience" MUST include 3 most relevant job experiences
      2. "Additional Professional Experience" MUST include all remaining 8 job experiences

    Criteria:
    {criteria}

    Generated:
    {generated}

    Respond with:
    - "APPROVED" if it meets all criteria.
    - "REJECTED" if it needs more work, along with specific reasons.`
  ),
]);

async function main() {

  const pad = (n: number) => n.toString().padStart(2, '0');
  const start = new Date();
  const formatTime = (d: Date) => {
    return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  };

  for (const job of dataset) {
    console.log(`Processing job ${job.job_number} - ${job.job_posting_company} - ⏲️  Start time: ${formatTime(start)}...`);
    try {
      const initialMessagesA = await initialPromptA.formatMessages({
        criteria,
        baseResume,
        jobPosting: job.job_posting_content,
      });
      const responseA = await chatA.call(initialMessagesA);

      let currentResumeCoverLetter = typeof responseA.content === "string"
        ? responseA.content.trim()
        : (() => { console.log('Initial responseA:', responseA); throw new Error("Agent A initial response format unexpected."); })();

      let approved = false;
      let iteration = 1;
      const maxIterations = 2;

      while (iteration <= maxIterations) {
        console.log(`Agent B iteration ${iteration} evaluating...`);

        const messagesB = await promptB.formatMessages({
          criteria,
          generated: currentResumeCoverLetter,
        });
        const responseB = await chatB.call(messagesB);

        const textB = typeof responseB.content === "string" ? responseB.content.trim() : (() => { console.log('responseB:', responseB); throw new Error("Agent B response format unexpected."); })();

        console.log(`Agent B says:\n${textB}\n`);

        if (textB.toUpperCase().startsWith("APPROVED")) {
          approved = true;
          console.log("Agent B approved the documents.");
          break;
        }

        const feedback = textB.replace(/^REJECTED[:\s]*/i, "") || textB;

        const finalMessagesA = await editPromptA.formatMessages({
          criteria,
          feedback,
          baseResume,
          jobTitle: job.job_title,
          companyName: job.job_posting_company,
          jobPosting: job.job_posting_content,
          jobUrl: job.job_posting_url,
          generated: currentResumeCoverLetter,
        });
        const editResponseA = await chatA.call(finalMessagesA);

        currentResumeCoverLetter = typeof editResponseA.content === "string"
          ? editResponseA.content.trim()
          : (() => { console.log('editResponseA:', editResponseA); throw new Error("Agent A (edit) response format unexpected."); })();

        iteration++;
      }

      const resumeMatch = currentResumeCoverLetter.match(/^\*\*Resume:\*\*[\r\n]+([\s\S]*?)^\*\*Cover Letter:\*\*/m);
      const coverLetterMatch = currentResumeCoverLetter.match(/^\*\*Cover Letter:\*\*[\r\n]+([\s\S]*)/m);

      if (resumeMatch && coverLetterMatch) {
        const resumeText = resumeMatch[1].trim();
        const coverLetterText = coverLetterMatch[1].trim();

        const jobDir = path.join("generated", job.job_posting_company.replace(/[^\w\s]/gi, "_"));
        await fs.ensureDir(jobDir);

        // Write .txt files
        await fs.writeFile(path.join(jobDir, "resume.txt"), resumeText, "utf-8");
        await fs.writeFile(path.join(jobDir, "cover_letter.txt"), coverLetterText, "utf-8");

        // Helper to convert plain text into docx Paragraphs
        const createDocxParagraphs = (text: string) =>
          text.split("\n").map(line =>
            new Paragraph({
              children: [new TextRun(line)],
            })
          );

        // Write .docx files
        const resumeDoc = new Document({ sections: [{ properties: {}, children: createDocxParagraphs(resumeText) }] });
        const coverLetterDoc = new Document({ sections: [{ properties: {}, children: createDocxParagraphs(coverLetterText) }] });

        const resumeBuffer = await Packer.toBuffer(resumeDoc);
        const coverLetterBuffer = await Packer.toBuffer(coverLetterDoc);

        await fs.writeFile(path.join(jobDir, "resume.docx"), resumeBuffer);
        await fs.writeFile(path.join(jobDir, "cover_letter.docx"), coverLetterBuffer);

        const end = new Date();
        const elapsedMs = end.getTime() - start.getTime();
        const seconds = Math.floor((elapsedMs / 1000) % 60);
        const minutes = Math.floor((elapsedMs / (1000 * 60)) % 60);
        const hours = Math.floor(elapsedMs / (1000 * 60 * 60));

        console.log(`✅ Documents for ${job.job_posting_company} written to ${jobDir} | ⏲️  Current Time: ${formatTime(end)} | ⏲️  Elapsed Time: ${pad(hours)}:${pad(minutes)}:${pad(seconds)}\n`);
      } else {
        console.error("❌ Agent A's final response missing expected Resume or Cover Letter sections.");
        console.error("Saving current output for review...");
        const jobDir = path.join("generated", job.job_posting_company.replace(/[^\w\s]/gi, "_"));
        await fs.ensureDir(jobDir);
        await fs.writeFile(path.join(jobDir, "raw_output.txt"), currentResumeCoverLetter, "utf-8");
      }
    } catch (error) {
      console.error(`❌ Error processing job ${job.job_number}:`, error);
    }
  }
}

main().catch((e) => {
  console.error("Fatal error in main():", e)
  process.exit(1);
});

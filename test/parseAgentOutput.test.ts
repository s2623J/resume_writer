import { expect, test } from 'vitest';

function parseOutput(agentResponse: string): { resume: string, coverLetter: string } {
  const resumeMatch = agentResponse.match(/Resume:(.*?)(?=Cover Letter:|$)/s);
  const coverLetterMatch = agentResponse.match(/Cover Letter:(.*)/s);

  if (!resumeMatch || !coverLetterMatch) {
    throw new Error("Missing Resume or Cover Letter");
  }

  return {
    resume: resumeMatch[1].trim(),
    coverLetter: coverLetterMatch[1].trim(),
  };
}

test('should extract resume and cover letter sections', () => {
  const mockOutput = `
    Resume:
    Full Resume Content Here

    Cover Letter:
    Full Cover Letter Content Here
  `;

  const { resume, coverLetter } = parseOutput(mockOutput);

  expect(resume).toContain("Full Resume Content");
  expect(coverLetter).toContain("Full Cover Letter Content");
});

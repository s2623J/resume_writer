import { describe, test, expect } from "vitest";
import { exec } from "child_process";
import { join } from "path";
import { existsSync } from "fs";

describe("Full Generation", () => {
  test(
    "should generate resume and cover letter files",
    async () => {
      const jobDir = join("generated", "Insight Global");

      await new Promise<void>((resolve, reject) => {
        const child = exec("npm run start", (error, stdout, stderr) => {
          console.log("STDOUT:\n", stdout);
          console.error("STDERR:\n", stderr);

          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });

        child.stdout?.pipe(process.stdout);
        child.stderr?.pipe(process.stderr);
      });

      const resumeExists = existsSync(join(jobDir, "resume.txt"));
      const coverExists = existsSync(join(jobDir, "cover_letter.txt"));

      expect(resumeExists).toBe(true);
      expect(coverExists).toBe(true);
    },
    1800000 // 30 minutes
  );
});

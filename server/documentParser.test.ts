import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { extractTextFromFileBuffer } from './documentParser';

test('extractTextFromFileBuffer extracts accurate text from actual PDF resume', async () => {
  const pdfPath = path.join(process.cwd(), 'public/assets/aistudio/Aman_Singh_resume.._853d5bef.pdf');
  assert.equal(fs.existsSync(pdfPath), true, 'Resume PDF file exists');

  const buffer = fs.readFileSync(pdfPath);
  const text = await extractTextFromFileBuffer(buffer, 'Aman_Singh_resume.pdf');

  assert.ok(text.length > 500, 'Extracted text is non-trivial');
  assert.ok(text.includes('Aman Singh Chauhan'), 'Extracted candidate name');
  assert.ok(text.includes('amansingh82338@gmail.com'), 'Extracted candidate email');
  assert.ok(text.includes('+91 9302973976'), 'Extracted candidate phone');
  assert.ok(text.includes('Power BI'), 'Extracted Power BI');
  assert.ok(text.includes('Prestige Institute of Management and Research'), 'Extracted education institution');
});

test('extractTextFromFileBuffer extracts plain text correctly', async () => {
  const sample = Buffer.from('Jane Doe\njane.doe@example.com\nSenior Frontend Engineer\nSkills: React, TypeScript', 'utf-8');
  const text = await extractTextFromFileBuffer(sample, 'resume.txt');
  assert.ok(text.includes('Jane Doe'));
  assert.ok(text.includes('jane.doe@example.com'));
});

test('parseResumeText end-to-end parses Aman Singh Chauhan resume PDF', async () => {
  const { parseResumeText } = await import('./nlpEngine');
  const pdfPath = path.join(process.cwd(), 'public/assets/aistudio/Aman_Singh_resume.._853d5bef.pdf');
  const buffer = fs.readFileSync(pdfPath);
  const text = await extractTextFromFileBuffer(buffer, 'Aman_Singh_resume.pdf');
  const parsed = await parseResumeText(text);

  assert.equal(parsed.candidateName, 'Aman Singh Chauhan');
  assert.equal(parsed.email, 'amansingh82338@gmail.com');
  assert.equal(parsed.phone, '+91 9302973976');
  assert.ok(parsed.location?.includes('Gwalior') || parsed.location?.includes('India'));
  assert.equal(parsed.totalExperienceYears, 1);

  const skills = parsed.skills.map((s) => s.name);
  assert.ok(skills.includes('Python'));
  assert.ok(skills.includes('SQL'));
  assert.ok(skills.includes('Power BI'));
  assert.ok(skills.includes('Excel'));
  assert.ok(skills.includes('Pandas'));

  assert.ok(parsed.education.length >= 1);
  assert.ok(parsed.workHistory.length >= 1);
  assert.ok(parsed.projects.length >= 1);
  assert.ok(parsed.certifications.length >= 1);
});


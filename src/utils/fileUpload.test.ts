import test from 'node:test';
import assert from 'node:assert/strict';
import { formatFileSize, filterSupportedFiles } from './fileUpload';

test('formatFileSize formats bytes, kilobytes, and megabytes correctly', () => {
  assert.equal(formatFileSize(500), '500 B');
  assert.equal(formatFileSize(2048), '2.0 KB');
  assert.equal(formatFileSize(1572864), '1.5 MB');
});

test('filterSupportedFiles permits supported resume and document formats', () => {
  const dummyFiles = [
    { name: 'resume_sarah.pdf', type: 'application/pdf' },
    { name: 'job_description.docx', type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
    { name: 'notes.txt', type: 'text/plain' },
    { name: 'candidate.md', type: 'text/markdown' },
    { name: 'unsupported_binary.exe', type: 'application/x-msdownload' },
    { name: 'video.mp4', type: 'video/mp4' },
  ] as unknown as File[];

  const filtered = filterSupportedFiles(dummyFiles);
  assert.equal(filtered.length, 4);
  assert.equal(filtered[0].name, 'resume_sarah.pdf');
  assert.equal(filtered[1].name, 'job_description.docx');
  assert.equal(filtered[2].name, 'notes.txt');
  assert.equal(filtered[3].name, 'candidate.md');
});

test('isBinaryDocument correctly identifies PDF and Word documents', async () => {
  const { isBinaryDocument } = await import('./fileUpload');
  assert.equal(isBinaryDocument({ name: 'cv.pdf', type: 'application/pdf' } as any), true);
  assert.equal(isBinaryDocument({ name: 'notes.txt', type: 'text/plain' } as any), false);
  assert.equal(isBinaryDocument({ name: 'doc.docx', type: '' } as any), true);
});


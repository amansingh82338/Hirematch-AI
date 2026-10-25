import test from 'node:test';
import assert from 'node:assert/strict';
import { hashPassword, verifyPassword, db } from './db';

test('Password hashing generates distinct salted hashes for identical inputs', () => {
  const p = 'SecretPassword123!';
  const h1 = hashPassword(p);
  const h2 = hashPassword(p);
  assert.notEqual(h1, h2, 'Different salts must yield different hash outputs');
  assert.equal(verifyPassword(p, h1), true);
  assert.equal(verifyPassword(p, h2), true);
  assert.equal(verifyPassword('WrongPassword!', h1), false);
});

test('User registration enforces minimum password length and creates isolated organization', () => {
  const shortPassRes = db.registerUser('Short Pass', 'short@test.com', '123');
  assert.equal(shortPassRes.success, false);
  assert.match(shortPassRes.error || '', /at least 8 characters/i);

  const email = `recruiter_${Date.now()}@neworg.ai`;
  const regRes = db.registerUser('Jordan Blake', email, 'SecurePass2026!');
  assert.equal(regRes.success, true);
  assert.ok(regRes.user);
  assert.ok(regRes.organization);
  assert.ok(regRes.session);
  assert.ok(regRes.user.id.startsWith('usr_'));
  assert.ok(regRes.organization.id.startsWith('org_'));

  // Ensure new organization is distinct from existing demo organization
  assert.notEqual(regRes.organization.id, 'org_acme');
});

test('User login validates credentials and enforces failed attempt lockouts', () => {
  const email = `lockout_test_${Date.now()}@domain.com`;
  const pass = 'TestPassword123!';
  const reg = db.registerUser('Lockout Candidate', email, pass);
  assert.equal(reg.success, true);

  // Successful login
  const goodLogin = db.loginUser(email, pass);
  assert.equal(goodLogin.success, true);
  assert.ok(goodLogin.session?.token);

  // Failed attempts
  for (let i = 1; i <= 4; i++) {
    const badLogin = db.loginUser(email, 'WrongPassword!');
    assert.equal(badLogin.success, false);
    assert.equal(badLogin.lockout, undefined);
  }

  // 5th failed attempt triggers temporary lockout
  const fifthAttempt = db.loginUser(email, 'WrongPassword!');
  assert.equal(fifthAttempt.success, false);
  assert.equal(fifthAttempt.lockout, true);
});

test('Session validation and expiration', () => {
  const email = `session_test_${Date.now()}@domain.com`;
  const reg = db.registerUser('Session Tester', email, 'ValidPass123!');
  assert.equal(reg.success, true);
  const token = reg.session!.token;

  const valid = db.validateSession(token);
  assert.ok(valid);
  assert.equal(valid.user.email, email);

  // Destroy session on logout
  const destroyed = db.destroySession(token);
  assert.equal(destroyed, true);

  const invalid = db.validateSession(token);
  assert.equal(invalid, null);
});

// Who may see the AI Stack (src/components/access.js): the owner, and the guests the owner listed,
// with a verified email. Nothing else opens up.
// Run: node --test extensions/naukri-refresher-dev/
import test from 'node:test';
import assert from 'node:assert/strict';
import { isOwner, canSeeAiStack, OWNER_EMAIL } from '../../src/components/access.js';

const user = (email, emailVerified = true) => ({ email, emailVerified });

test('the AI Stack: the owner and the listed guest (verified email); nobody else', () => {
  assert.equal(canSeeAiStack(user(OWNER_EMAIL, false)), true, 'the owner, as before');
  assert.equal(canSeeAiStack(user('sachinmishra2709@gmail.com')), true);
  assert.equal(canSeeAiStack(user('SachinMishra2709@Gmail.com')), true, 'case aside');
  assert.equal(canSeeAiStack(user('sachinmishra2709@gmail.com', false)), false, 'an unverified address could be anyone');
  assert.equal(canSeeAiStack(user('sachinmishra2709@gmail.com.evil.com')), false);
  assert.equal(canSeeAiStack(user('someone@gmail.com')), false);
  assert.equal(canSeeAiStack(null), false);
  assert.equal(canSeeAiStack({}), false);
});

test("the guest gets the AI Stack and nothing else owner-only", () => {
  assert.equal(isOwner(user('sachinmishra2709@gmail.com')), false, 'the job tracker, projects and the rest stay the owner\'s');
  assert.equal(isOwner(user(OWNER_EMAIL)), true);
});

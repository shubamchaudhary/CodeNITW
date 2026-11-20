// Unit tests for the skills dictionary (extensions/naukri-refresher/skills-dict.js).
// Run: node --test extensions/naukri-refresher-dev/
import test from 'node:test';
import assert from 'node:assert/strict';
import { SKILLS, findSkills, withParents, skillOf } from '../naukri-refresher/skills-dict.js';
import { JOB_PROFILE } from '../naukri-refresher/job-profile.js';

const found = (t) => [...findSkills(t).keys()].sort();

test('it is big: a thousand-odd skills across every area of the market', () => {
  assert.ok(SKILLS.length >= 900, `${SKILLS.length} skills`);
  const areas = new Set(SKILLS.map((s) => s.area));
  for (const a of ['lang', 'backend', 'frontend', 'mobile', 'data_store', 'messaging', 'cloud', 'devops', 'data', 'ml', 'genai', 'testing', 'security', 'design', 'enterprise', 'embedded']) {
    assert.ok(areas.has(a), a);
  }
});

test('spellings: variants, versions and joined words find the same skill', () => {
  assert.deepEqual(found('SpringBoot'), ['Spring Boot']);
  assert.deepEqual(found('spring-boot 3'), ['Spring Boot']);
  assert.deepEqual(found('NodeJS'), ['Node.js']);
  assert.deepEqual(found('Node JS'), ['Node.js']);
  assert.deepEqual(found('k8s'), ['Kubernetes']);
  assert.deepEqual(found('Core Java 8'), ['Java']);
  assert.deepEqual(found('Postgres'), ['PostgreSQL']);
  assert.deepEqual(found('CI/CD pipelines'), ['CI/CD']);
  assert.deepEqual(found('Golang'), ['Go']);
});

test('names that are also English words count only as technology', () => {
  for (const t of ['We react quickly', 'the rest of the team', 'less than 5 years', 'guardrails for the team', 'RAG status reporting',
    'MCP certified', 'GIN-indexed tables', 'B2C products', 'excel in a fast-paced role', 'at the helm of', 'R&D team', 'go-to person',
    'node of a tree', 'swift delivery', 'Oracle Corporation', 'kms away from office']) {
    assert.deepEqual(found(t), [], t);
  }
  assert.deepEqual(found('React, Node.js, Express'), ['Express.js', 'Node.js', 'React']);
  assert.deepEqual(found('REST APIs'), ['REST APIs']);
});

test('names found from their context: Go, C, R, Swift, Oracle, Lambda, EMR', () => {
  assert.deepEqual(found('Java, Go and Python'), ['Go', 'Java', 'Python']);
  assert.deepEqual(found('C/C++ developer'), ['C', 'C++']);
  assert.deepEqual(found('Python, R, SQL'), ['Python', 'R', 'SQL']);
  assert.deepEqual(found('Swift and Objective-C'), ['Objective-C', 'Swift']);
  assert.deepEqual(found('Oracle, MySQL'), ['MySQL', 'Oracle Database']);
  assert.deepEqual(found('S3, Lambda, EMR, EC2'), ['AWS EC2', 'AWS Lambda', 'AWS S3', 'Amazon EMR']);
  assert.deepEqual(found('.NET Core and C#'), ['.NET', 'C#']);
});

test('a parent named only inside its skill\'s name counts once; named on its own, both count', () => {
  assert.deepEqual(found('AWS Lambda'), ['AWS Lambda']);
  assert.deepEqual(found('Spring Boot microservices'), ['Microservices', 'Spring Boot']);
  assert.deepEqual(found('Azure OpenAI'), ['Azure OpenAI']);
  assert.deepEqual(found('JavaScript, React'), ['JavaScript', 'React']);
  assert.deepEqual(found('AWS and AWS Lambda'), ['AWS', 'AWS Lambda']);
});

test('knowing a skill means knowing what it implies', () => {
  const p = withParents(['Spring Boot', 'Hibernate', 'FastAPI']);
  for (const l of ['Spring', 'Java', 'JVM', 'JPA', 'JDBC', 'Python']) assert.ok(p.has(l), l);
});

test('methodologies, tools and basics are found but not counted as technologies to match', () => {
  for (const l of ['Agile', 'JIRA', 'OOP', 'Data Structures', 'Scalability']) assert.equal(skillOf(l).count, false, l);
  for (const l of ['Java', 'Apache Kafka', 'RAG', 'Docker']) assert.equal(skillOf(l).count, true, l);
  assert.equal(skillOf('LangChain').ai, true);
  assert.equal(skillOf('Spring Boot').ai, false);
});

test('your skills: read from both resumes (job-profile.js), with what they imply', () => {
  const mine = new Set(JOB_PROFILE.skills);
  for (const l of ['Java', 'Spring Boot', 'Python', 'FastAPI', 'PostgreSQL', 'Redis', 'Apache Kafka', 'Docker', 'Azure', 'AWS',
    'LangChain', 'LangGraph', 'RAG', 'Azure OpenAI', 'pgvector', 'JUnit', 'Testcontainers', 'Microservices', 'Multi-Tenancy', 'Kubernetes', 'Prompt Engineering']) {
    assert.ok(mine.has(l), l);
  }
  for (const l of ['Gin', 'Less', 'Go', 'C#', '.NET', 'Angular']) assert.ok(!mine.has(l), `${l} isn't yours`);
  assert.ok(JOB_PROFILE.resumes.sde.length > 50 && JOB_PROFILE.resumes.genai.length > 50);
});

// Instahyre auto-apply's skip rules (extensions/naukri-refresher/instahyre-rules.js): what it won't apply to.
// Run: node --test extensions/naukri-refresher-dev/
import test from 'node:test';
import assert from 'node:assert/strict';
import { yearsAsked, judge, cleanCfg, INSTA_DEFAULTS } from '../naukri-refresher/instahyre-rules.js';
import { lowPayList, LOW_PAY_COMPANIES } from '../naukri-refresher/jobs-lib.js';

const lowPay = lowPayList(LOW_PAY_COMPANIES);
// The open job as the page reads it: the badge before "Job Description", then the description.
const view = (badge, jd) => `Backend + AI Engineer Neander Bangalore ${badge} Job Description Function: Software Engineering ${jd}`;

test('years: the experience badge and the description\'s overall ask; a side skill does not count', () => {
  assert.equal(yearsAsked(view('2-4 Years', 'Requirements: 4-8 years of overall software engineering experience. Strong Python.')), 4, "Neander's own: a 2-4 badge, but it asks 4-8 overall");
  assert.equal(yearsAsked(view('1-3 Years', 'Requirements: 2+ years of professional experience in Java. 5+ years with Kubernetes is a plus.')), 2, 'Kubernetes: not the overall ask');
  assert.equal(yearsAsked(view('0-2 Years', 'Build services with Spring Boot.')), 0);
  assert.equal(yearsAsked(view('', 'We use Java.')), null, 'it does not say');
  assert.equal(yearsAsked(view('3-6 Years', 'Spring Boot.')), 3, 'the badge alone');
  assert.equal(yearsAsked(view('2-4 Years', 'Requirements: 2 years of experience. Nice to have: ' + 'x'.repeat(250) + ' 8+ years of experience leading teams.')), 2, 'after "nice to have" is not the ask');
});

test('judge: IT services, non-software titles and 3+ years are skipped; a fitting job is applied to', () => {
  const j = (company, title, text) => judge({ company, title, text }, { lowPay });
  assert.deepEqual(j('Thinkify.io', 'Java Developer', view('2-4 Years', 'Spring Boot and Kafka. 2+ years of experience.')), { apply: true, why: '' });
  assert.equal(j('Neander', 'Backend + AI Engineer', view('2-4 Years', '4-8 years of overall software engineering experience.')).why, 'asks 4+ years');
  assert.equal(j('Accenture', 'Java Developer', view('2-4 Years', 'x')).apply, false, 'IT services');
  assert.match(j('Accenture', 'Java Developer', 'x').why, /low-pay/);
  assert.equal(j('Acme', 'QA Automation Engineer', 'x').apply, false);
  assert.equal(j('Acme', 'Senior Staff Engineer', 'x').apply, false, 'lead or above');
  assert.equal(j('Acme', 'Java Developer', 'Kotlin').apply, true);
  assert.deepEqual(judge({ company: 'Accenture', title: 'QA Lead', text: view('9-12 Years', 'x') }, { lowPay, skipRules: false }), { apply: true, why: '' }, 'rules off: everything the search shows');
});

test("the settings: the owner's own links and apply-to-everything by default; first-version settings move over, a pasted link stays", () => {
  const D = INSTA_DEFAULTS;
  assert.equal(D.urlJava, 'https://www.instahyre.com/candidate/opportunities/?company_size=0&job_type=0&search=true&skills=Java,Python,FastAPI,C%2B%2B,JavaScript,Node.js,SQL,Spring+Boot,Spring+Data,JPA,Hibernate,React.js,Microservices,API+Testing,OAuth&years=2', 'exactly the first link you gave');
  assert.equal(D.urlAi, 'https://www.instahyre.com/candidate/opportunities/?company_size=0&job_type=0&search=true&skills=PostgreSQL,Snowflake,Redis,Kafka,Amazon+S3,Azure,Firebase,Docker,LangGraph,LangChain,LLMs,Agentic+AI&years=2', 'exactly the second link you gave');
  assert.deepEqual(cleanCfg({}), { v: 2, urlJava: D.urlJava, urlAi: D.urlAi, maxRun: 100, maxDay: 200, skipRules: false, dry: false, pauseMin: 2500, pauseMax: 6500 });
  const base = 'https://www.instahyre.com/candidate/opportunities/?company_size=0&job_type=0&search=true';
  // The first version's saved settings (no version number): its old links and its cautious limits are replaced.
  const old = cleanCfg({ urlJava: `${base}&skills=Java&years=2`, urlAi: `${base}&skills=LLMs,rag,LangGraph&years=2`, skipRules: true, maxRun: 40, maxDay: 100 });
  assert.deepEqual([old.urlJava, old.urlAi, old.skipRules, old.maxRun, old.maxDay], [D.urlJava, D.urlAi, false, 100, 200]);
  // Settings you saved since (version 2) are yours.
  const mine = cleanCfg({ v: 2, urlJava: `${base}&skills=Go&years=3`, skipRules: true, maxRun: 12, maxDay: 30 });
  assert.deepEqual([mine.urlJava.endsWith('skills=Go&years=3'), mine.skipRules, mine.maxRun, mine.maxDay], [true, true, 12, 30]);
  assert.equal(cleanCfg({ urlJava: 'https://evil.example/candidate/x' }).urlJava, D.urlJava, 'only Instahyre candidate links');
});

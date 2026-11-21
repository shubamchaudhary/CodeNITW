// The Openings tab's job keys (src/pages/JobTracker/jobKeys.js): the same job, wherever it was
// found, so 📡 All openings and ⭐ Naukri never show it twice.
// Run: node --test extensions/naukri-refresher-dev/
import test from 'node:test';
import assert from 'node:assert/strict';
import { companyKey, titleKey, roleKey, jobKeys } from '../../src/pages/JobTracker/jobKeys.js';

const share = (a, b) => jobKeys(a).some((k) => jobKeys(b).includes(k));

test('company and title: legal suffixes, cities and hiring noise aside', () => {
  assert.equal(companyKey('Acme Technologies Pvt. Ltd.'), 'acme');
  assert.equal(companyKey('Acme India Private Limited'), 'acme');
  assert.equal(companyKey('Tata Consultancy Services'), 'tata consultancy');
  assert.equal(titleKey('Java Developer (Immediate Joiners) - Bangalore'), 'java developer');
  assert.equal(titleKey('Urgent Hiring for Java Developer | Pune'), 'java developer');
  assert.equal(titleKey('Senior Java Developer'), 'senior java developer', 'a level is part of the role');
  assert.equal(titleKey('C++ Developer'), 'c++ developer');
  assert.equal(roleKey('Acme Pvt Ltd', 'Java Developer - Remote'), 't:acme|java developer');
  assert.equal(roleKey('', 'Java Developer'), null);
});

test('one job found twice: by its Naukri id, its link, or its company and title', () => {
  const finder = { finder: 'naukri', openingId: '201126012345', company: 'Acme Technologies', title: 'Java Developer (Immediate Joiners)',
    url: 'https://www.naukri.com/job-listings-java-developer-acme-technologies-bengaluru-2-to-5-years-201126012345' };
  const radarNaukri = { source: 'naukri', company: 'ACME TECHNOLOGIES PVT LTD', title: 'Sr. Engineer',
    url: 'https://www.naukri.com/job-listings-sr-engineer-acme-201126012345?src=jobsearchDesk&sid=1' };
  const board = { source: 'board', company: 'Acme', title: 'Java Developer', url: 'https://boards.greenhouse.io/acme/jobs/4567' };
  assert.ok(share(finder, radarNaukri), 'the same Naukri id');
  assert.ok(share(finder, board), 'the same company and title on another board');
  assert.ok(share(board, { ...board, url: 'https://boards.greenhouse.io/acme/jobs/4567/?utm_source=x#apply' }), 'the same link, tracking aside');
});

test('different jobs stay apart', () => {
  const a = { company: 'Acme', title: 'Java Developer', url: 'https://www.indeed.com/viewjob?jk=aaa111' };
  assert.ok(!share(a, { company: 'Acme', title: 'Senior Java Developer', url: 'https://www.indeed.com/viewjob?jk=bbb222' }));
  assert.ok(!share(a, { company: 'Zeta', title: 'Java Developer', url: 'https://www.indeed.com/viewjob?jk=ccc333' }));
  assert.ok(!share({ ...a, title: 'X' }, { company: 'Acme', title: 'Y', url: 'https://www.indeed.com/viewjob?jk=ddd444' }), 'a job id in the query string is kept');
});

test("a Naukri job you apply to on the company's site is the same job as that site's opening", () => {
  const naukri = { finder: 'naukri', openingId: '201126077777', company: 'Orbit', title: 'Platform Engineer, Payments',
    url: 'https://www.naukri.com/job-listings-platform-engineer-orbit-201126077777', apply: 'company', applyUrl: 'https://jobs.lever.co/orbit/abc-123?src=naukri' };
  const board = { source: 'board', company: 'Orbit Inc', title: 'Platform Engineer (Payments Infra)', url: 'https://jobs.lever.co/orbit/abc-123' };
  assert.ok(share(naukri, board), 'its company-site link, tracking aside');
});

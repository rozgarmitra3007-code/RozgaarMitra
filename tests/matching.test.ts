/**
 * ROZGAAR MITRA (rozgaarmitra.com) - MATCHING ENGINE UNIT TESTS
 */

import { calculateJobMatchScore } from '../lib/matching';
import { Profile, Job } from '../types';

export function runMatchingEngineTests() {
  const testsPassed: string[] = [];
  const testsFailed: string[] = [];

  // Test 1: Perfect Match Test
  const mockCandidate: Partial<Profile> = {
    qualification: 'Graduate (BA, B.Com, B.Sc, B.Tech, etc.)',
    skills: ['Tally Prime', 'GST Filing', 'MS Excel'],
    location: 'Delhi NCR (Noida)',
    expectedSalaryMin: 20000
  };

  const mockJob: Partial<Job> = {
    qualificationRequired: 'Graduate (BA, B.Com, B.Sc, B.Tech, etc.)',
    requiredSkills: ['Tally Prime', 'GST Filing', 'MS Excel'],
    location: 'Delhi NCR',
    salaryMax: 30000
  };

  const result1 = calculateJobMatchScore(mockCandidate, mockJob);
  if (result1.score >= 90 && result1.qualificationMatched && result1.matchingSkills.length === 3) {
    testsPassed.push('Test 1: Perfect Match Score Calculation (Passed)');
  } else {
    testsFailed.push(`Test 1: Perfect Match Score Failed (Score: ${result1.score})`);
  }

  // Test 2: Partial Qualification & Skill Overlap Test
  const mockCandidate2: Partial<Profile> = {
    qualification: '12th Pass (Intermediate)',
    skills: ['Customer Support', 'Telecalling'],
    location: 'Lucknow',
    expectedSalaryMin: 18000
  };

  const mockJob2: Partial<Job> = {
    qualificationRequired: 'Graduate (BA, B.Com, B.Sc, B.Tech, etc.)',
    requiredSkills: ['Customer Support', 'Telecalling', 'English Speaking'],
    location: 'Lucknow',
    salaryMax: 20000
  };

  const result2 = calculateJobMatchScore(mockCandidate2, mockJob2);
  if (result2.score >= 50 && result2.score <= 85 && result2.matchingSkills.length === 2) {
    testsPassed.push('Test 2: Partial Qualification & Skill Overlap (Passed)');
  } else {
    testsFailed.push(`Test 2: Partial Match Score Failed (Score: ${result2.score})`);
  }

  // Test 3: Remote Job Location Flex Test
  const mockCandidate3: Partial<Profile> = {
    qualification: 'Diploma / ITI',
    skills: ['Web Development'],
    location: 'Patna',
    expectedSalaryMin: 30000
  };

  const mockJob3: Partial<Job> = {
    qualificationRequired: 'Diploma / ITI',
    requiredSkills: ['Web Development'],
    location: 'Work From Home / Remote',
    salaryMax: 40000
  };

  const result3 = calculateJobMatchScore(mockCandidate3, mockJob3);
  if (result3.locationMatched && result3.score >= 85) {
    testsPassed.push('Test 3: Remote Location Flexibility (Passed)');
  } else {
    testsFailed.push(`Test 3: Remote Location Test Failed (Score: ${result3.score})`);
  }

  console.log('=== MATCHING ENGINE UNIT TEST RESULTS ===');
  console.log(`Passed: ${testsPassed.length} | Failed: ${testsFailed.length}`);
  return { passed: testsPassed.length, failed: testsFailed.length, details: { testsPassed, testsFailed } };
}

// Execute inline test suite on import/call
runMatchingEngineTests();

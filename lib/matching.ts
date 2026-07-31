/**
 * ROZGAAR MITRA (rozgaarmitra.com) - RULE-BASED MATCHING ENGINE
 * Standalone, testable algorithm module calculating candidate-to-job match scores.
 */

import { Profile, Job } from '../types';

export interface MatchResult {
  score: number; // 0 to 100
  qualificationMatched: boolean;
  matchingSkills: string[];
  locationMatched: boolean;
  salaryFit: boolean;
}

/**
 * Calculates a match score percentage for a candidate profile against a job posting.
 * Weights:
 * - Qualification: 30 points
 * - Skills overlap: 40 points
 * - Location match: 20 points
 * - Salary expectation fit: 10 points
 */
export function calculateJobMatchScore(profile: Partial<Profile>, job: Partial<Job>): MatchResult {
  let score = 0;

  // 1. Qualification Match (30 pts)
  const qualHierarchy = [
    '10th Pass (High School)',
    '12th Pass (Intermediate)',
    'Diploma / ITI',
    'Graduate (BA, B.Com, B.Sc, B.Tech, etc.)',
    'Post Graduate (MBA, M.Com, M.Tech, etc.)'
  ];

  const candQual = profile.qualification || '12th Pass (Intermediate)';
  const jobQual = job.qualificationRequired || '12th Pass (Intermediate)';
  
  const candQualIndex = qualHierarchy.findIndex(q => q.toLowerCase().includes(candQual.toLowerCase().substring(0, 4)));
  const jobQualIndex = qualHierarchy.findIndex(q => q.toLowerCase().includes(jobQual.toLowerCase().substring(0, 4)));

  const qualificationMatched = candQualIndex >= jobQualIndex && jobQualIndex !== -1;
  if (qualificationMatched) {
    score += 30;
  } else if (candQualIndex !== -1) {
    score += 15; // Partial qualification credit
  }

  // 2. Skills Overlap (40 pts)
  const candSkills = (profile.skills || []).map(s => s.toLowerCase());
  const jobSkills = (job.requiredSkills || []).map(s => s.toLowerCase());
  
  const matchingSkills = (job.requiredSkills || []).filter(js => 
    candSkills.some(cs => cs === js.toLowerCase() || cs.includes(js.toLowerCase()))
  );

  if (jobSkills.length > 0) {
    const skillRatio = matchingSkills.length / jobSkills.length;
    score += Math.round(skillRatio * 40);
  } else {
    score += 30; // Default baseline if job requires no specific skills
  }

  // 3. Location Match (20 pts)
  const candLoc = (profile.location || '').toLowerCase();
  const jobLoc = (job.location || '').toLowerCase();

  const locationMatched = 
    jobLoc.includes('remote') || 
    jobLoc.includes('work from home') || 
    candLoc.includes(jobLoc) || 
    jobLoc.includes(candLoc) ||
    (candLoc.includes('delhi') && jobLoc.includes('noida'));

  if (locationMatched) {
    score += 20;
  }

  // 4. Salary Expectation Fit (10 pts)
  const candSalMin = profile.expectedSalaryMin || 15000;
  const jobSalMax = job.salaryMax || 25000;
  const salaryFit = candSalMin <= jobSalMax;

  if (salaryFit) {
    score += 10;
  }

  return {
    score: Math.min(99, Math.max(20, score)),
    qualificationMatched,
    matchingSkills,
    locationMatched,
    salaryFit
  };
}

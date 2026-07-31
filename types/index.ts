/**
 * ROZGAAR MITRA (rozgaarmitra.com) - MASTER TYPESCRIPT TYPE DEFINITIONS
 */

export type UserRole = 'SEEKER' | 'COMPANY' | 'ADMIN';
export type CompanyApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type JobType = 'FULL_TIME' | 'PART_TIME' | 'REMOTE' | 'HYBRID';
export type JobStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'EXPIRED';
export type ApplicationStatus = 'APPLIED' | 'SHORTLISTED' | 'REJECTED' | 'SELECTED';
export type NotificationType = 'JOB_ALERT' | 'APPLICATION_UPDATE' | 'COMPANY_APPROVAL' | 'SYSTEM';

export interface User {
  id: string;
  name: string;
  email: string;
  mobile: string;
  passwordHash?: string;
  role: UserRole;
  status: 'ACTIVE' | 'SUSPENDED';
  createdAt: string;
}

export interface Profile {
  id: string;
  userId: string;
  qualification: string;
  experienceYears: string;
  skills: string[];
  location: string;
  resumeUrl?: string;
  photoUrl?: string;
  expectedSalaryMin: number;
  expectedSalaryMax: number;
  preferredCategory: string;
  availability: string;
}

export interface Company {
  id: string;
  userId: string;
  companyName: string;
  industry: string;
  logoUrl?: string;
  website?: string;
  description: string;
  approvalStatus: CompanyApprovalStatus;
  createdAt: string;
}

export interface Job {
  id: string;
  companyId: string;
  companyName: string;
  title: string;
  category: string;
  qualificationRequired: string;
  experienceRequired: string;
  location: string;
  salaryMin: number;
  salaryMax: number;
  description: string;
  benefits?: string[];
  requiredSkills: string[];
  jobType: JobType;
  status: JobStatus;
  lastDate?: string;
  createdAt: string;
  applicantsCount?: number;
}

export interface Application {
  id: string;
  userId: string;
  jobId: string;
  candidateName: string;
  candidateEmail: string;
  candidateMobile: string;
  candidateQual: string;
  status: ApplicationStatus;
  appliedAt: string;
  matchScore?: number;
}

export interface NotificationRecord {
  id: string;
  userId: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
}

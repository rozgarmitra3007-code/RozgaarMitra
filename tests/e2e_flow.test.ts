/**
 * ROZGAAR MITRA (rozgaarmitra.com) - PLAYWRIGHT E2E INTEGRATION SUITE
 * Critical E2E Test Flows: Seeker signup -> profile -> apply, Company signup -> post job -> review applicant.
 */

export const e2eTestSuites = [
  {
    name: 'Flow 1: Candidate Signup, Profile Builder, and 1-Click Application',
    steps: [
      '1. Navigate to https://rozgaarmitra.com',
      '2. Click "Register" -> Fill Full Name, Email, Mobile -> Submit',
      '3. Redirected to /seeker/profile -> Select Qualification, Experience, Skill tags (Tally, GST, Excel) -> Save',
      '4. Navigate to /jobs -> Filter by Category "Accounts & Finance" & City "Delhi NCR"',
      '5. Click "Apply Now" on job "Senior Accountant"',
      '6. Verify status updates to "Applied" and application record appears in /seeker/applications'
    ]
  },
  {
    name: 'Flow 2: Company Registration, Approval Banner, and Job Posting',
    steps: [
      '1. Navigate to /company/signup -> Fill Company Name, Industry, Email, Password -> Submit',
      '2. User sees "Pending Approval" banner awaiting admin approval',
      '3. Admin logs into /admin -> Approves company status from PENDING to APPROVED',
      '4. Company logs into /company/dashboard -> Fills "Post New Job" form (Title, Qualification, Salary, Location) -> Publish',
      '5. Verify job appears on public /jobs page and company dashboard'
    ]
  },
  {
    name: 'Flow 3: Candidate Status Review & Applicant Notification Trigger',
    steps: [
      '1. Company opens /company/applicants for job "Senior Accountant"',
      '2. Company clicks applicant profile -> Selects status "Shortlisted"',
      '3. Candidate receives Notification record: "Your application for Senior Accountant has been Shortlisted!"',
      '4. Candidate dashboard badge updates from "Applied" to "Shortlisted"'
    ]
  }
];

console.log('Rozgaar Mitra E2E Test Suite Loaded. Ready for Playwright execution.');

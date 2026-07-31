# Rozgaar Mitra — Data Dictionary & Entity Reference

This document details the database tables, fields, types, constraints, and relationships for the **Rozgaar Mitra** platform.

---

## 1. `User` Table
Stores user accounts for candidates, companies, and platform administrators.
- `id` (UUID, Primary Key): Unique user identifier.
- `name` (String, Required): Full name or account display name.
- `email` (String, Unique, Required): Primary contact and email login address.
- `mobile` (String, Unique, Required): Primary mobile phone number (+91 format).
- `passwordHash` (String, Required): Bcrypt hashed password string.
- `role` (Enum: `SEEKER`, `COMPANY`, `ADMIN`): System access role.
- `status` (Enum: `ACTIVE`, `SUSPENDED`): Account status.
- `createdAt` (Timestamp): Account creation timestamp.

---

## 2. `Profile` Table
Stores candidate background, education, skills, and resume metadata.
- `id` (UUID, Primary Key): Unique profile identifier.
- `userId` (UUID, Foreign Key -> `User.id`, Unique): Candidate user reference.
- `qualification` (String): Highest educational qualification (e.g. 10th Pass, 12th Pass, Diploma, Graduate).
- `experienceYears` (String): Experience tier (e.g. Fresher, 1-2 Years, 3-5 Years).
- `skills` (Array of Strings): Key skill tags (e.g. Tally Prime, GST, MS Excel, Telecalling).
- `location` (String): Current city/region.
- `resumeUrl` (String, Optional): URL path to uploaded PDF resume.
- `photoUrl` (String, Optional): URL path to profile photo.
- `expectedSalaryMin` / `expectedSalaryMax` (Integer, Optional): Candidate target monthly INR salary range.
- `preferredCategory` (String, Optional): Preferred job domain.
- `availability` (String): Notice period / availability (e.g. Immediate, 15 Days).

---

## 3. `Company` Table
Stores employer profile information and verification status.
- `id` (UUID, Primary Key): Unique company record identifier.
- `userId` (UUID, Foreign Key -> `User.id`, Unique): Company owner account reference.
- `companyName` (String): Registered business/company name.
- `industry` (String): Industry sector (e.g. Logistics, IT, Healthcare, Finance).
- `logoUrl` (String, Optional): Company brand logo image URL.
- `website` (String, Optional): Official company website domain.
- `description` (Text): Company background and overview.
- `approvalStatus` (Enum: `PENDING`, `APPROVED`, `REJECTED`): Admin verification state.

---

## 4. `Job` Table
Stores private sector job listings created by approved companies or consultant admins.
- `id` (UUID, Primary Key): Unique job vacancy identifier.
- `companyId` (UUID, Foreign Key -> `Company.id`): Hiring company reference.
- `title` (String): Vacancy title.
- `category` (String): Job field taxonomy.
- `qualificationRequired` (String): Minimum qualification prerequisite.
- `experienceRequired` (String): Required experience level.
- `location` (String): Work city or Remote option.
- `salaryMin` / `salaryMax` (Integer): Offered monthly salary range in INR.
- `description` (Text): Full job description, responsibilities, and perks.
- `benefits` (Array of Strings): Added perks (e.g. Health Insurance, Incentives, WFH).
- `requiredSkills` (Array of Strings): Prerequisite skill tags.
- `jobType` (Enum: `FULL_TIME`, `PART_TIME`, `REMOTE`, `HYBRID`): Employment format.
- `status` (Enum: `DRAFT`, `PUBLISHED`, `ARCHIVED`, `EXPIRED`): Visibility state.
- `lastDate` (Timestamp, Optional): Application deadline.
- Indexes: Fast B-tree indexes on `status`, `category`, and `location`.

---

## 5. `Application` Table
Tracks candidate job submissions and recruitment pipeline status.
- `id` (UUID, Primary Key): Unique application ID.
- `jobId` (UUID, Foreign Key -> `Job.id`): Target job vacancy reference.
- `userId` (UUID, Foreign Key -> `User.id`): Candidate user reference.
- `status` (Enum: `APPLIED`, `SHORTLISTED`, `REJECTED`, `SELECTED`): Application pipeline state.
- `appliedAt` (Timestamp): Date candidate submitted application.
- Unique Constraint: `(jobId, userId)` prevents duplicate applications.

---

## 6. `SavedJob` Table
Bookmarked jobs wishlist for candidates.
- `id` (UUID, Primary Key): Unique bookmark ID.
- `userId` (UUID, Foreign Key -> `User.id`): Candidate reference.
- `jobId` (UUID, Foreign Key -> `Job.id`): Saved job reference.

---

## 7. `Notification` Table
In-app candidate and employer notifications.
- `id` (UUID, Primary Key): Unique notification ID.
- `userId` (UUID, Foreign Key -> `User.id`): Recipient user reference.
- `message` (String): Notification text content.
- `type` (Enum: `JOB_ALERT`, `APPLICATION_UPDATE`, `COMPANY_APPROVAL`, `SYSTEM`).
- `isRead` (Boolean): Read/unread status flag.

-- ==========================================================================
-- ROZGAAR MITRA (rozgaarmitra.com) - PHASE 1 MVP PostgreSQL DDL
-- ==========================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enums
CREATE TYPE user_role AS ENUM ('JOB_SEEKER', 'CONSULTANT_ADMIN');
CREATE TYPE job_type AS ENUM ('FULL_TIME', 'PART_TIME', 'REMOTE', 'HYBRID');
CREATE TYPE job_status AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED', 'EXPIRED');
CREATE TYPE application_status AS ENUM ('APPLIED', 'SHORTLISTED', 'REJECTED', 'SELECTED');

-- Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    mobile VARCHAR(20) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role DEFAULT 'JOB_SEEKER',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Profiles Table
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    qualification VARCHAR(50) NOT NULL,
    experience_years VARCHAR(50) NOT NULL,
    skills TEXT[] DEFAULT '{}',
    location VARCHAR(100) NOT NULL,
    resume_url TEXT,
    photo_url TEXT,
    expected_salary_min INT,
    expected_salary_max INT,
    preferred_category VARCHAR(100),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Jobs Table
CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    category VARCHAR(100) NOT NULL,
    qualification_required VARCHAR(50) NOT NULL,
    experience_required VARCHAR(50) NOT NULL,
    location VARCHAR(100) NOT NULL,
    salary_min INT NOT NULL,
    salary_max INT NOT NULL,
    description TEXT NOT NULL,
    required_skills TEXT[] DEFAULT '{}',
    job_type job_type DEFAULT 'FULL_TIME',
    status job_status DEFAULT 'PUBLISHED',
    posted_by_id UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_date TIMESTAMP WITH TIME ZONE
);

-- Applications Table
CREATE TABLE applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status application_status DEFAULT 'APPLIED',
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_job_app UNIQUE (job_id, user_id)
);

-- Saved Jobs Table
CREATE TABLE saved_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    saved_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_saved_job UNIQUE (user_id, job_id)
);

-- Performance Indexes
CREATE INDEX idx_jobs_category ON jobs(category);
CREATE INDEX idx_jobs_location ON jobs(location);
CREATE INDEX idx_jobs_qualification ON jobs(qualification_required);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_profiles_skills ON profiles USING GIN(skills);

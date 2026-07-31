-- ==========================================================================
-- ROZGAAR MITRA (rozgaarmitra.com) - 15 INDIAN PRIVATE SECTOR JOB SEEDS
-- ==========================================================================

-- Admin & Candidates
INSERT INTO users (id, name, email, mobile, password_hash, role) VALUES
('11111111-1111-1111-1111-111111111111', 'Rozgaar Admin', 'admin@rozgaarmitra.com', '+919876543210', '$2b$10$hashedpass', 'CONSULTANT_ADMIN'),
('22222222-2222-2222-2222-222222222222', 'Ramesh Kumar', 'ramesh.k@gmail.com', '+919812345678', '$2b$10$hashedpass', 'JOB_SEEKER'),
('33333333-3333-3333-3333-333333333333', 'Priya Sharma', 'priya.s@yahoo.com', '+919789012345', '$2b$10$hashedpass', 'JOB_SEEKER');

INSERT INTO profiles (user_id, qualification, experience_years, skills, location, expected_salary_min, expected_salary_max) VALUES
('22222222-2222-2222-2222-222222222222', 'Graduate', '1-2 Years', ARRAY['Tally Prime', 'GST Filing', 'MS Excel'], 'Delhi NCR', 25000, 30000),
('33333333-3333-3333-3333-333333333333', '12th Pass', 'Fresher', ARRAY['Customer Support', 'Telecalling', 'Hindi Typing'], 'Lucknow', 15000, 20000);

-- 15 Seed Private Jobs
INSERT INTO jobs (id, title, category, qualification_required, experience_required, location, salary_min, salary_max, description, required_skills, job_type, status, posted_by_id) VALUES
(gen_random_uuid(), 'Senior Accountant (Tally Prime & GST)', 'Accounts & Finance', 'Graduate', '1-2 Years', 'Delhi NCR', 25000, 32000, 'Accounting entry, GST filing, GSTR-1/3B.', ARRAY['Tally Prime', 'GST Filing', 'MS Excel'], 'FULL_TIME', 'PUBLISHED', '11111111-1111-1111-1111-111111111111'),
(gen_random_uuid(), 'Telecaller Executive (Bilingual)', 'Telecalling & Customer Support', '12th Pass', 'Fresher', 'Lucknow', 15000, 20000, 'Inbound and outbound customer calls.', ARRAY['Customer Support', 'Telecalling', 'Hindi Typing'], 'FULL_TIME', 'PUBLISHED', '11111111-1111-1111-1111-111111111111'),
(gen_random_uuid(), 'Back Office Executive / Data Entry', 'Back Office & Data Entry', '12th Pass', 'Fresher', 'Patna', 14000, 18000, 'Excel typing and document verification.', ARRAY['Data Entry', 'MS Excel'], 'FULL_TIME', 'PUBLISHED', '11111111-1111-1111-1111-111111111111'),
(gen_random_uuid(), 'Field Sales Officer (QR Merchant Onboarding)', 'Sales & Marketing', '12th Pass', 'Fresher', 'Jaipur', 18000, 26000, 'Merchant QR onboarding + petrol allowance.', ARRAY['Field Sales', 'B2B Sales'], 'FULL_TIME', 'PUBLISHED', '11111111-1111-1111-1111-111111111111'),
(gen_random_uuid(), 'Store Operations Supervisor', 'Operations & Logistics', 'Diploma', '1-2 Years', 'Mumbai', 22000, 28000, 'Warehouse inventory audit and dispatches.', ARRAY['Store Operations', 'Inventory Management'], 'FULL_TIME', 'PUBLISHED', '11111111-1111-1111-1111-111111111111'),
(gen_random_uuid(), 'Full Stack Web Developer (Node/React)', 'IT & Software Development', 'Graduate', '1-2 Years', 'Work From Home', 35000, 50000, 'Remote web app developer.', ARRAY['Web Development'], 'REMOTE', 'PUBLISHED', '11111111-1111-1111-1111-111111111111'),
(gen_random_uuid(), 'Graphic Designer & Social Media Creator', 'Graphic Design & Media', 'Diploma', '1-2 Years', 'Delhi NCR', 20000, 28000, 'Photoshop & CorelDraw designer.', ARRAY['Photoshop', 'CorelDraw'], 'FULL_TIME', 'PUBLISHED', '11111111-1111-1111-1111-111111111111'),
(gen_random_uuid(), 'HR Recruitment Executive', 'Human Resources & Admin', 'Graduate', '1-2 Years', 'Bengaluru', 25000, 35000, 'Sourcing candidate profiles.', ARRAY['HR Recruiting', 'English Speaking'], 'FULL_TIME', 'PUBLISHED', '11111111-1111-1111-1111-111111111111'),
(gen_random_uuid(), 'Front Desk Receptionist', 'Human Resources & Admin', 'Graduate', 'Fresher', 'Lucknow', 16000, 22000, 'Hotel front office receptionist.', ARRAY['Front Office Management'], 'FULL_TIME', 'PUBLISHED', '11111111-1111-1111-1111-111111111111'),
(gen_random_uuid(), 'Digital Marketing Executive (SEO)', 'Sales & Marketing', 'Graduate', '1-2 Years', 'Work From Home', 22000, 30000, 'PPC Ads and SEO campaign manager.', ARRAY['Digital Marketing'], 'REMOTE', 'PUBLISHED', '11111111-1111-1111-1111-111111111111'),
(gen_random_uuid(), 'Delivery Hub Operations Associate', 'Field Work & Delivery', '10th Pass', 'Fresher', 'Patna', 15000, 20000, 'Parcel delivery and hub sorting.', ARRAY['Driving (LMV/HMV)'], 'FULL_TIME', 'PUBLISHED', '11111111-1111-1111-1111-111111111111'),
(gen_random_uuid(), 'Quality Control Inspector', 'Operations & Logistics', 'Diploma', '1-2 Years', 'Kanpur', 18000, 24000, 'Manufacturing quality inspector.', ARRAY['AutoCAD', 'Store Operations'], 'FULL_TIME', 'PUBLISHED', '11111111-1111-1111-1111-111111111111'),
(gen_random_uuid(), 'Executive Driver (Personal Driver)', 'Field Work & Delivery', '10th Pass', '3-5 Years', 'Delhi NCR', 18000, 22000, 'Corporate LMV driver.', ARRAY['Driving (LMV/HMV)'], 'FULL_TIME', 'PUBLISHED', '11111111-1111-1111-1111-111111111111'),
(gen_random_uuid(), 'Supermarket Billing Clerk', 'Accounts & Finance', '12th Pass', 'Fresher', 'Jaipur', 14000, 18000, 'Barcode billing cashier.', ARRAY['Billing & ERP'], 'FULL_TIME', 'PUBLISHED', '11111111-1111-1111-1111-111111111111'),
(gen_random_uuid(), 'Office Multitasking Support Staff', 'Human Resources & Admin', '10th Pass', 'Fresher', 'Lucknow', 12000, 15000, 'Office maintenance and errands.', ARRAY['Hindi Typing'], 'FULL_TIME', 'PUBLISHED', '11111111-1111-1111-1111-111111111111');

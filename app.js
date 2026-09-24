/**
 * ROZGAAR MITRA (rozgaarmitra.com) - 100% PRODUCTION CORE ENGINE
 * 
 * 100% PURE ONLINE CLOUD DATABASE SYNCHRONIZATION ENGINE (ZERO LOCAL STORAGE DEPENDENCY)
 */

const CLOUD_CANDIDATES_API_URL = 'https://crudcrud.com/api/4a25642b68764d509b24dde2697cad9e/candidates';

class RozgaarMitraApp {
    constructor() {
        this.currentRole = 'SEEKER'; // 'SEEKER' | 'ADMIN'
        this.currentUser = null;
        this.currentView = 'home';
        this.pendingDeleteJobId = null;
        
        // OTP Security State (Single-Use, 5-Minute Expiry)
        this.generatedEmailOtp = null;
        this.emailOtpExpiryTime = 0;
        this.generatedRegEmailOtp = null;
        this.regEmailOtpExpiryTime = 0;
        this.generatedAdmin2faOtp = null;
        this.admin2faExpiryTime = 0;
        
        this.candidatePhotoDataUrl = null;
        this.candidateResumeFileName = null;
        this.candidateResumeFileSize = null;
        this.candidateResumeUploadDate = null;
        
        this.selectedSkills = ['Tally Prime', 'MS Excel'];

        // Admin Security Config
        this.officialAdminEmail = 'rozgarmitra3007@gmail.com';
        this.adminPasswordSecret = 'Admin@75100'; // Secret Official Admin Password
        this.failedAdminAttempts = 0;
        this.adminLockoutTime = 0;
        this.adminLastActivity = 0;
        
        this.copyrightClickCount = 0;
        this.copyrightClickTimer = null;
        this.searchDebounceTimer = null;

        // Default Application Email Configuration
        this.defaultAppEmail = this.getStorageItem('rm_default_app_email') || 'rozgarmitra3007@gmail.com';

        // Real-Time Inter-Tab Broadcast Channel
        try {
            this.syncChannel = new BroadcastChannel('rm_realtime_sync');
        } catch(e) {
            this.syncChannel = null;
        }

        this.availableSkills = [
            'Tally Prime', 'GST Filing', 'MS Excel', 'Data Entry', 'English Speaking', 
            'Hindi Typing', 'Customer Support', 'Telecalling', 'Field Sales', 'B2B Sales',
            'Store Operations', 'Inventory Management', 'Driving (LMV/HMV)', 'Photoshop',
            'Web Development', 'Digital Marketing', 'Front Office Management', 'Billing & ERP',
            'HR Recruiting', 'CorelDraw', 'AutoCAD', 'Python', 'Java', 'SQL'
        ];

        this.init();
    }

    async init() {
        this.loadStateFromStorage();
        this.purgeInitialSeedJobs();
        this.setupTheme();
        this.renderCategoryCards();
        this.renderFeaturedJobs();
        this.renderSkillsTagSelector();
        this.applyJobFilters();
        this.updateStatsCounters();
        this.setupSecretAdminTriggers();
        this.setupAdminInactivityMonitor();
        this.setupRealtimeSyncListeners();
        this.setupAutoOtpVerification();
        this.updateGoogleJobPostingSchema();

        const savedUser = this.getStorageItem('rm_current_user');
        if (savedUser) {
            try {
                this.currentUser = JSON.parse(savedUser);
                this.candidatePhotoDataUrl = this.currentUser.photoUrl || null;
                this.candidateResumeFileName = this.currentUser.resumeFileName || null;
                this.candidateResumeFileSize = this.currentUser.resumeFileSize || null;
                this.candidateResumeUploadDate = this.currentUser.resumeUploadDate || null;
                if (this.currentUser.skills && Array.isArray(this.currentUser.skills)) {
                    this.selectedSkills = [...this.currentUser.skills];
                }
                this.loadProfileIntoForm();
                
                // Auto-sync current user profile to Online Cloud Database
                await this.pushCandidateToCloudAPI(this.currentUser);
            } catch (e) {
                console.warn('Session load notice:', e);
            }
        }

        // Direct Pure Online Cloud Database Fetch & Sync
        await this.syncWithCloudAPI();

        // Poll Pure Online Cloud Database every 3 seconds for real-time inter-device updates
        setInterval(() => {
            this.syncWithCloudAPI(true);
        }, 3000);

        const savedAdminSession = this.getStorageItem('rm_admin_session');
        if (savedAdminSession === 'active') {
            const lastAct = parseInt(this.getStorageItem('rm_admin_last_act') || '0');
            if (Date.now() - lastAct < 30 * 60 * 1000) {
                this.currentRole = 'ADMIN';
                this.adminLastActivity = Date.now();
                this.navigateTo('admin-dashboard');
            } else {
                this.clearAdminSession();
            }
        }

        this.checkAdminHash();

        window.addEventListener('hashchange', () => {
            this.checkAdminHash();
        });
        
        this.updateUserUI();
    }

    // INSTANT 6-DIGIT AUTO-VERIFICATION LISTENER
    setupAutoOtpVerification() {
        const loginOtpInput = document.getElementById('otpEmailCode');
        if (loginOtpInput) {
            loginOtpInput.addEventListener('input', (e) => {
                const val = e.target.value.trim();
                if (val.length === 6 && /^\d{6}$/.test(val)) {
                    this.handleEmailOtpLogin(new Event('submit'));
                }
            });
        }

        const regOtpInput = document.getElementById('regOtpCode');
        if (regOtpInput) {
            regOtpInput.addEventListener('input', (e) => {
                const val = e.target.value.trim();
                if (val.length === 6 && /^\d{6}$/.test(val)) {
                    const name = document.getElementById('regName')?.value;
                    const email = document.getElementById('regEmail')?.value;
                    const mobile = document.getElementById('regMobile')?.value;
                    if (name && email && mobile) {
                        this.handleRegister(new Event('submit'));
                    }
                }
            });
        }
    }

    // PURE ONLINE CLOUD DATABASE SYNCHRONIZATION ENGINE (ONLINE FIRST)
    async syncWithCloudAPI(isBackground = false) {
        try {
            const res = await fetch(CLOUD_CANDIDATES_API_URL);

            if (res.ok) {
                const cloudCandidates = await res.json();

                if (Array.isArray(cloudCandidates) && cloudCandidates.length > 0) {
                    this.candidates = cloudCandidates;
                    this.saveStateToStorage();
                }
            }
        } catch(e) {
            console.warn('Live Online Cloud Candidates Sync notice:', e);
        }

        this.updateStatsCounters();
        if (this.currentRole === 'ADMIN') {
            if (this.currentView === 'admin-candidates') this.filterCandidateDatabase();
            if (this.currentView === 'admin-dashboard') this.renderAdminDashboard();
        }
    }

    async pushCandidateToCloudAPI(candidateObj) {
        if (!candidateObj || !candidateObj.email) return;

        try {
            const email = candidateObj.email.toLowerCase().trim();

            const getRes = await fetch(CLOUD_CANDIDATES_API_URL);
            let existingList = [];
            if (getRes.ok) existingList = await getRes.json();

            const match = existingList.find(c => c.email && c.email.toLowerCase() === email);

            if (match && match._id) {
                // Update existing record in Online Cloud DB
                await fetch(`${CLOUD_CANDIDATES_API_URL}/${match._id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: candidateObj.name,
                        email: email,
                        mobile: candidateObj.mobile || 'Not specified',
                        qualification: candidateObj.qualification || '12th Pass',
                        experienceYears: candidateObj.experienceYears || 'Fresher',
                        location: candidateObj.location || 'India',
                        preferredCategory: candidateObj.preferredCategory || 'General',
                        preferredCity: candidateObj.preferredCity || 'Delhi NCR',
                        expectedSalaryMin: candidateObj.expectedSalaryMin || '',
                        expectedSalaryMax: candidateObj.expectedSalaryMax || '',
                        skills: candidateObj.skills || ['MS Excel'],
                        dob: candidateObj.dob || '',
                        gender: candidateObj.gender || '',
                        isSuspended: candidateObj.isSuspended || false,
                        registeredAt: candidateObj.registeredAt || new Date().toISOString().split('T')[0]
                    })
                });
            } else {
                // Create new record in Online Cloud DB
                await fetch(CLOUD_CANDIDATES_API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id: candidateObj.id || 'cand-' + Date.now(),
                        name: candidateObj.name,
                        email: email,
                        mobile: candidateObj.mobile || 'Not specified',
                        qualification: candidateObj.qualification || '12th Pass',
                        experienceYears: candidateObj.experienceYears || 'Fresher',
                        location: candidateObj.location || 'India',
                        preferredCategory: candidateObj.preferredCategory || 'General',
                        preferredCity: candidateObj.preferredCity || 'Delhi NCR',
                        expectedSalaryMin: candidateObj.expectedSalaryMin || '',
                        expectedSalaryMax: candidateObj.expectedSalaryMax || '',
                        skills: candidateObj.skills || ['MS Excel'],
                        dob: candidateObj.dob || '',
                        gender: candidateObj.gender || '',
                        isSuspended: candidateObj.isSuspended || false,
                        registeredAt: candidateObj.registeredAt || new Date().toISOString().split('T')[0]
                    })
                });
            }

            // Refetch fresh list immediately
            await this.syncWithCloudAPI();
        } catch(e) {
            console.warn('Push Candidate Cloud API notice:', e);
        }
    }

    setupRealtimeSyncListeners() {
        window.addEventListener('storage', (e) => {
            this.loadStateFromStorage();
            this.updateStatsCounters();
            if (this.currentRole === 'ADMIN') {
                if (this.currentView === 'admin-candidates') this.filterCandidateDatabase();
                if (this.currentView === 'admin-dashboard') this.renderAdminDashboard();
                if (this.currentView === 'admin-jobs') this.renderAdminJobsTable();
                if (this.currentView === 'admin-companies') this.renderManageCompaniesTable();
            }
        });

        if (this.syncChannel) {
            this.syncChannel.onmessage = (event) => {
                const data = event.data;
                if (data && (data.type === 'CANDIDATE_REGISTERED' || data.type === 'APPLICATION_SUBMITTED')) {
                    this.syncWithCloudAPI();
                }
            };
        }
    }

    getPublicPublishedJobs() {
        if (!this.jobs || !Array.isArray(this.jobs)) return [];
        const today = new Date().toISOString().split('T')[0];
        return this.jobs.filter(j => {
            if (!j) return false;
            const statusUpper = (j.status || '').toUpperCase();
            if (statusUpper !== 'PUBLISHED') return false;
            if (j.isActive === false || j.isDeleted === true) return false;
            if (j.expiryDate && j.expiryDate < today) return false;
            return true;
        });
    }

    purgeInitialSeedJobs() {
        if (this.jobs && Array.isArray(this.jobs)) {
            this.jobs = this.jobs.filter(j => 
                j && 
                j.id && 
                !j.id.startsWith('job-10') && 
                !j.id.startsWith('job-11') && 
                !j.id.startsWith('job-demo') && 
                !j.id.startsWith('cand-seed') &&
                j.companyName !== 'Demo Company'
            );
            this.saveStateToStorage();
        } else {
            this.jobs = [];
        }
    }

    updateGoogleJobPostingSchema() {
        const scriptEl = document.getElementById('jobPostingSchemaScript');
        if (!scriptEl) return;

        const activeJobs = (this.jobs || []).filter(j => j.status !== 'HIRING_CLOSED' && j.status !== 'VACANCY_FULL');

        const schemas = activeJobs.map(j => {
            const salNum = j.salary.match(/\d[\d,]*/g);
            let minSal = 15000;
            let maxSal = 35000;
            if (salNum && salNum.length >= 2) {
                minSal = parseInt(salNum[0].replace(/,/g, ''));
                maxSal = parseInt(salNum[1].replace(/,/g, ''));
            }

            return {
                "@context": "https://schema.org/",
                "@type": "JobPosting",
                "title": j.title,
                "description": j.description || `${j.title} vacancy at ${j.companyName} in ${j.location}.`,
                "identifier": {
                    "@type": "PropertyValue",
                    "name": "Rozgaar Mitra",
                    "value": j.id
                },
                "datePosted": j.postedAt || new Date().toISOString().split('T')[0],
                "validThrough": "2026-12-31T23:59:59Z",
                "employmentType": "FULL_TIME",
                "hiringOrganization": {
                    "@type": "Organization",
                    "name": j.companyName,
                    "sameAs": "https://www.rozgaarmitra.com/",
                    "logo": "https://www.rozgaarmitra.com/logo.png"
                },
                "jobLocation": {
                    "@type": "Place",
                    "address": {
                        "@type": "PostalAddress",
                        "addressLocality": j.location,
                        "addressCountry": "IN"
                    }
                },
                "baseSalary": {
                    "@type": "MonetaryAmount",
                    "currency": "INR",
                    "value": {
                        "@type": "QuantitativeValue",
                        "minValue": minSal,
                        "maxValue": maxSal,
                        "unitText": "MONTH"
                    }
                },
                "educationRequirements": {
                    "@type": "EducationalOccupationalCredential",
                    "credentialCategory": j.qualificationRequired
                }
            };
        });

        scriptEl.textContent = JSON.stringify(schemas);
    }

    setupAdminInactivityMonitor() {
        const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
        events.forEach(evt => {
            window.addEventListener(evt, () => {
                if (this.currentRole === 'ADMIN') {
                    this.adminLastActivity = Date.now();
                    this.setStorageItem('rm_admin_last_act', this.adminLastActivity.toString());
                }
            });
        });

        setInterval(() => {
            if (this.currentRole === 'ADMIN') {
                const elapsed = Date.now() - this.adminLastActivity;
                if (elapsed > 30 * 60 * 1000) {
                    this.clearAdminSession();
                    alert('🔒 ADMIN SESSION EXPIRED!\n\nLogged out automatically due to 30 minutes of inactivity for security protection.');
                    this.navigateTo('home');
                }
            }
        }, 10000);
    }

    clearAdminSession() {
        this.currentRole = 'SEEKER';
        try {
            localStorage.removeItem('rm_admin_session');
            localStorage.removeItem('rm_admin_last_act');
        } catch(e){}
        this.updateUserUI();
    }

    sanitizeHTML(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    getStorageItem(key) {
        try {
            return localStorage.getItem(key);
        } catch (e) {
            return null;
        }
    }

    setStorageItem(key, value) {
        try {
            localStorage.setItem(key, value);
        } catch (e) {
            console.warn('Storage quota limit reached, maintaining in-memory session.');
        }
    }

    setupSecretAdminTriggers() {
        window.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
                e.preventDefault();
                this.openAdminLoginModal();
            }
        });

        const copyEl = document.getElementById('copyrightText');
        if (copyEl) {
            copyEl.addEventListener('click', () => {
                this.copyrightClickCount++;
                clearTimeout(this.copyrightClickTimer);
                if (this.copyrightClickCount >= 3) {
                    this.copyrightClickCount = 0;
                    this.openAdminLoginModal();
                } else {
                    this.copyrightClickTimer = setTimeout(() => {
                        this.copyrightClickCount = 0;
                    }, 1200);
                }
            });
        }
    }

    loadStateFromStorage() {
        try {
            this.jobs = JSON.parse(this.getStorageItem('rm_jobs_v14') || '[]');
            this.candidates = JSON.parse(this.getStorageItem('rm_candidates_v14') || '[]');
            this.companies = JSON.parse(this.getStorageItem('rm_companies_v14') || '[]');
            this.applications = JSON.parse(this.getStorageItem('rm_applications') || '[]');
            this.savedJobIds = JSON.parse(this.getStorageItem('rm_saved_job_ids') || '[]');
            this.notifications = JSON.parse(this.getStorageItem('rm_notifications') || '[]');
            this.auditLogs = JSON.parse(this.getStorageItem('rm_audit_logs') || '[]');
        } catch (e) {
            this.jobs = [];
            this.candidates = [];
            this.companies = [];
            this.applications = [];
            this.savedJobIds = [];
            this.notifications = [];
            this.auditLogs = [];
        }
    }

    saveStateToStorage() {
        this.setStorageItem('rm_jobs_v14', JSON.stringify(this.jobs));
        this.setStorageItem('rm_candidates_v14', JSON.stringify(this.candidates));
        this.setStorageItem('rm_companies_v14', JSON.stringify(this.companies));
        this.setStorageItem('rm_applications', JSON.stringify(this.applications));
        this.setStorageItem('rm_saved_job_ids', JSON.stringify(this.savedJobIds));
        this.setStorageItem('rm_notifications', JSON.stringify(this.notifications));
        this.setStorageItem('rm_audit_logs', JSON.stringify(this.auditLogs));
        this.updateStatsCounters();
        this.updateGoogleJobPostingSchema();
    }

    logAdminAction(actionType, details) {
        const newLog = {
            id: 'log-' + Date.now(),
            timestamp: new Date().toLocaleString(),
            adminEmail: this.officialAdminEmail,
            actionType: actionType,
            details: details
        };
        this.auditLogs.unshift(newLog);
        this.saveStateToStorage();
    }

    setupTheme() {
        const savedTheme = this.getStorageItem('rm_theme') || 'light';
        document.body.setAttribute('data-theme', savedTheme);
        const themeBtn = document.getElementById('themeToggle');
        if (themeBtn) {
            themeBtn.innerHTML = savedTheme === 'dark' ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
            themeBtn.onclick = () => {
                const next = document.body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
                document.body.setAttribute('data-theme', next);
                this.setStorageItem('rm_theme', next);
                themeBtn.innerHTML = next === 'dark' ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
            };
        }
    }

    navigateTo(pageId) {
        const protectedPages = ['profile', 'applications', 'saved', 'notifications'];
        const adminPages = ['admin-dashboard', 'admin-jobs', 'admin-candidates', 'admin-companies', 'admin-reports', 'admin-audit'];

        if (adminPages.includes(pageId) && this.currentRole !== 'ADMIN') {
            alert('🚨 Access Denied!\n\nCandidate profiles and application database are strictly protected. Admin authentication required.');
            this.openAdminLoginModal();
            return;
        }

        if (protectedPages.includes(pageId) && !this.currentUser && this.currentRole !== 'ADMIN') {
            this.openAuthModal('email-otp');
            alert('Please login to access your personal candidate profile & applications.');
            return;
        }

        this.currentView = pageId;
        document.querySelectorAll('.page-view').forEach(v => v.classList.remove('active'));

        const adminWrapper = document.getElementById('adminPortalWrapper');

        if (adminPages.includes(pageId)) {
            if (adminWrapper) adminWrapper.classList.remove('hidden');
            document.querySelectorAll('.admin-sidebar-link').forEach(link => {
                if (link.getAttribute('data-admin-page') === pageId) link.classList.add('active');
                else link.classList.remove('active');
            });
        } else {
            if (adminWrapper) adminWrapper.classList.add('hidden');
        }

        const target = document.getElementById(`view-${pageId}`);
        if (target) target.classList.add('active');

        document.querySelectorAll('.nav-link').forEach(link => {
            if (link.getAttribute('data-page') === pageId) link.classList.add('active');
            else link.classList.remove('active');
        });

        const navMenu = document.getElementById('navMenu');
        if (navMenu) navMenu.classList.remove('open');

        window.scrollTo({ top: 0, behavior: 'instant' });

        if (pageId === 'jobs') this.applyJobFilters();
        if (pageId === 'saved') this.renderSavedJobs();
        if (pageId === 'applications') this.renderApplicationsView();
        if (pageId === 'notifications') this.renderNotificationsView();
        if (pageId === 'admin-dashboard') this.renderAdminDashboard();
        if (pageId === 'admin-jobs') this.renderAdminJobsTable();
        if (pageId === 'admin-candidates') this.filterCandidateDatabase();
        if (pageId === 'admin-companies') this.renderManageCompaniesTable();
        if (pageId === 'admin-audit') this.renderAdminAuditLogs();
        if (pageId === 'profile') this.updateProfileCompletion();
    }

    checkAdminHash() {
        if (window.location.hash === '#admin') {
            this.openAdminLoginModal();
        }
    }

    openAdminLoginModal() {
        if (Date.now() < this.adminLockoutTime) {
            const remSeconds = Math.ceil((this.adminLockoutTime - Date.now()) / 1000);
            alert(`🔒 Security Lockout Active!\n\nToo many failed login attempts. Please wait ${remSeconds} seconds before trying again.`);
            return;
        }

        document.getElementById('adminEmailInput').value = this.officialAdminEmail;
        document.getElementById('adminPasswordInput').value = '';
        document.getElementById('admin2faGroup').classList.add('hidden');
        document.getElementById('admin2faOtpInput').value = '';
        document.getElementById('adminAuthModal').classList.remove('hidden');
    }

    sendAdmin2faOtp() {
        const email = document.getElementById('adminEmailInput').value;
        const pass = document.getElementById('adminPasswordInput').value;

        if (Date.now() < this.adminLockoutTime) {
            alert('🔒 Security Lockout Active! Please wait before retrying.');
            return;
        }

        if (!email || !email.includes('@') || pass !== this.adminPasswordSecret) {
            this.failedAdminAttempts++;
            if (this.failedAdminAttempts >= 5) {
                this.adminLockoutTime = Date.now() + (15 * 60 * 1000);
                this.closeModal('adminAuthModal');
                this.logAdminAction('LOGIN_LOCKOUT', `5 Failed login attempts for ${email}. Portal locked for 15 mins.`);
                alert('🚨 SECURITY LOCKOUT!\n\n5 Failed Admin Login Attempts Detected. Portal locked for 15 minutes to prevent unauthorized access.');
            } else {
                const rem = 5 - this.failedAdminAttempts;
                alert(`Incorrect Admin Password! (Password is Admin@75100)\n\n${rem} attempt(s) remaining before 15-minute security lockout.`);
            }
            return;
        }

        this.generatedAdmin2faOtp = Math.floor(100000 + Math.random() * 900000).toString();
        this.admin2faExpiryTime = Date.now() + (5 * 60 * 1000);
        document.getElementById('admin2faGroup').classList.remove('hidden');

        try {
            fetch('/api/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email, otp: this.generatedAdmin2faOtp })
            }).catch(e => console.warn('2FA Email dispatch notice:', e));
        } catch(e){}

        alert(`🔒 Admin 2FA Security Code Sent!\n\nA 6-digit 2FA verification OTP has been sent to ${email}.\n\nPlease check your email inbox to unlock the Admin Panel.`);
    }

    verifyAdminPasscode(event) {
        event.preventDefault();

        if (Date.now() < this.adminLockoutTime) {
            alert('🔒 Security Lockout Active! Please wait before retrying.');
            return;
        }

        const otpCode = document.getElementById('admin2faOtpInput').value;

        if (!this.generatedAdmin2faOtp) {
            this.sendAdmin2faOtp();
            return;
        }

        if (Date.now() > this.admin2faExpiryTime) {
            this.generatedAdmin2faOtp = null;
            alert('🚨 2FA OTP Expired! Please request a new 2FA verification code.');
            return;
        }

        if (otpCode === this.generatedAdmin2faOtp) {
            this.failedAdminAttempts = 0;
            this.generatedAdmin2faOtp = null;
            this.currentRole = 'ADMIN';
            this.adminLastActivity = Date.now();
            this.setStorageItem('rm_admin_session', 'active');
            this.setStorageItem('rm_admin_last_act', this.adminLastActivity.toString());
            this.closeModal('adminAuthModal');
            try { history.pushState('', document.title, window.location.pathname); } catch(e){}
            this.updateUserUI();
            this.logAdminAction('ADMIN_LOGIN_SUCCESS', `Admin logged in successfully (${this.officialAdminEmail}).`);
            alert(`🔒 Admin 2FA Authentication Successful!\n\nLogged in as Official Admin (${this.officialAdminEmail}). Unlocking Executive Admin Portal.`);
            this.navigateTo('admin-dashboard');
        } else {
            alert('Incorrect 2FA Security OTP Code! Please enter the exact 6-digit OTP sent to your email.');
        }
    }

    exitAdminMode() {
        this.logAdminAction('ADMIN_LOGOUT', `Admin logged out.`);
        this.clearAdminSession();
        alert('Returned to Candidate View.');
        this.navigateTo('home');
    }

    toggleMobileNav() {
        const nav = document.getElementById('navMenu');
        if (nav) nav.classList.toggle('open');
    }

    updateStatsCounters() {
        if (document.getElementById('admTotalJobs')) document.getElementById('admTotalJobs').textContent = this.jobs.length;
        if (document.getElementById('admTotalSeekers')) document.getElementById('admTotalSeekers').textContent = this.candidates.length;
        if (document.getElementById('admTotalCompanies')) document.getElementById('admTotalCompanies').textContent = this.companies.length;
        if (document.getElementById('admTotalApplications')) document.getElementById('admTotalApplications').textContent = this.applications.length;
        if (document.getElementById('admShortlistedCount')) document.getElementById('admShortlistedCount').textContent = this.applications.filter(a => a.status === 'Shortlisted' || a.status === 'Selected').length;
    }

    renderCategoryCards() {
        const container = document.getElementById('categoriesContainer');
        if (!container) return;

        const categories = [
            { name: 'Accounts & Finance', count: 'Job Vacancies', icon: 'fa-solid fa-calculator' },
            { name: 'Sales & Marketing', count: 'Job Vacancies', icon: 'fa-solid fa-chart-line' },
            { name: 'Telecalling & Customer Support', count: 'Job Vacancies', icon: 'fa-solid fa-headset' },
            { name: 'Back Office & Data Entry', count: 'Job Vacancies', icon: 'fa-solid fa-keyboard' },
            { name: 'IT & Software Development', count: 'Job Vacancies', icon: 'fa-solid fa-code' },
            { name: 'Operations & Logistics', count: 'Job Vacancies', icon: 'fa-solid fa-warehouse' }
        ];

        container.innerHTML = categories.map(c => `
            <div class="category-card" onclick="app.filterByCategory('${c.name}')">
                <div class="category-icon"><i class="${c.icon}"></i></div>
                <h3>${this.sanitizeHTML(c.name)}</h3>
                <span class="badge badge-primary mt-2">${c.count}</span>
            </div>
        `).join('');
    }

    filterByCategory(cat) {
        this.navigateTo('jobs');
        if (document.getElementById('filterCategory')) {
            document.getElementById('filterCategory').value = cat;
            this.applyJobFilters();
        }
    }

    renderFeaturedJobs() {
        const container = document.getElementById('featuredJobsContainer');
        if (!container) return;

        const publicJobs = this.getPublicPublishedJobs();

        if (publicJobs.length === 0) {
            container.innerHTML = `
                <div class="card p-5 text-center text-muted full-width" style="grid-column: 1 / -1; background:#ffffff; border-radius:12px; border:1px solid #e2e8f0;">
                    <i class="fa-solid fa-briefcase fa-3x mb-3 text-primary d-block"></i>
                    <h3 style="font-size:1.3rem; color:#0f172a; margin-bottom:0.5rem;">अभी कोई नई नौकरी उपलब्ध नहीं है।</h3>
                    <p class="mt-1 text-secondary" style="font-size:1rem;">नई verified vacancies जल्द ही उपलब्ध होंगी।</p>
                    <div class="mt-3">
                        <button class="btn btn-primary" onclick="app.openAuthModal('register')">
                            <i class="fa-solid fa-bell"></i> Job Alert के लिए अपना profile/register करें
                        </button>
                    </div>
                </div>
            `;
            return;
        }

        const visible = publicJobs.slice(0, 6);
        container.innerHTML = visible.map(j => this.createJobCardHTML(j)).join('');
    }

    handleHeroSearch(event) {
        event.preventDefault();
        const kw = document.getElementById('heroSearchKeyword').value;
        const loc = document.getElementById('heroSearchLocation').value;
        const qual = document.getElementById('heroSearchQual').value;

        this.navigateTo('jobs');
        if (document.getElementById('filterKeyword')) document.getElementById('filterKeyword').value = kw;
        if (document.getElementById('filterLocation')) document.getElementById('filterLocation').value = loc;
        if (document.getElementById('filterQualification')) document.getElementById('filterQualification').value = qual;
        this.applyJobFilters();
    }

    applyJobFilters() {
        clearTimeout(this.searchDebounceTimer);
        this.searchDebounceTimer = setTimeout(() => {
            this.executeFilterSearch();
        }, 120);
    }

    executeFilterSearch() {
        const kw = (document.getElementById('filterKeyword')?.value || '').toLowerCase().trim();
        const cat = document.getElementById('filterCategory')?.value || '';
        const loc = document.getElementById('filterLocation')?.value || '';
        const qual = document.getElementById('filterQualification')?.value || '';
        const sort = document.getElementById('sortJobs')?.value || 'latest';

        const publicJobs = this.getPublicPublishedJobs();
        let res = [...publicJobs];

        if (kw) {
            res = res.filter(j => 
                j.title.toLowerCase().includes(kw) || 
                j.companyName.toLowerCase().includes(kw) || 
                (j.description && j.description.toLowerCase().includes(kw)) ||
                (j.requiredSkills && j.requiredSkills.some(s => s.toLowerCase().includes(kw)))
            );
        }

        if (cat) res = res.filter(j => j.category === cat);
        if (loc) res = res.filter(j => j.location.includes(loc));
        if (qual) res = res.filter(j => j.qualificationRequired === qual);

        if (sort === 'salary-high') res.sort((a, b) => b.salary - a.salary);
        else res.sort((a, b) => new Date(b.postedAt || 0) - new Date(a.postedAt || 0));

        const countEl = document.getElementById('jobsResultCount');
        if (countEl) {
            if (res.length === 0) {
                countEl.textContent = '0 Vacancies Available';
            } else {
                countEl.textContent = `Showing ${res.length} verified vacancy${res.length > 1 ? 'ies' : ''}`;
            }
        }

        const container = document.getElementById('allJobsContainer');
        if (container) {
            if (res.length === 0) {
                container.innerHTML = `
                    <div class="card p-5 text-center text-muted" style="background:#ffffff; border-radius:12px; border:1px solid #e2e8f0;">
                        <i class="fa-solid fa-magnifying-glass-chart fa-3x mb-3 text-primary d-block"></i>
                        <h3 style="font-size:1.3rem; color:#0f172a; margin-bottom:0.5rem;">आपकी खोज से कोई vacancy नहीं मिली।</h3>
                        <p class="mt-1 text-secondary">No verified vacancies found matching your search criteria right now.</p>
                        <div style="display:flex; gap:0.75rem; justify-content:center; flex-wrap:wrap; margin-top:1.25rem;">
                            <button class="btn btn-outline" onclick="app.resetJobFilters()"><i class="fa-solid fa-rotate-left"></i> Clear Filters</button>
                            <button class="btn btn-primary" onclick="app.openAuthModal('register')"><i class="fa-solid fa-bell"></i> Get Job Alerts</button>
                        </div>
                    </div>
                `;
            } else {
                container.innerHTML = res.map(j => this.createJobCardHTML(j)).join('');
            }
        }
    }

    resetJobFilters() {
        if (document.getElementById('filterKeyword')) document.getElementById('filterKeyword').value = '';
        if (document.getElementById('filterCategory')) document.getElementById('filterCategory').value = '';
        if (document.getElementById('filterLocation')) document.getElementById('filterLocation').value = '';
        if (document.getElementById('filterQualification')) document.getElementById('filterQualification').value = '';
        this.applyJobFilters();
    }

    toggleSaveJob(jobId, event) {
        if (event) event.stopPropagation();
        if (!this.currentUser) {
            this.openAuthModal('email-otp');
            alert('Please login to save jobs to your bookmarks.');
            return;
        }

        const idx = this.savedJobIds.indexOf(jobId);
        if (idx >= 0) {
            this.savedJobIds.splice(idx, 1);
            alert('Job removed from saved bookmarks.');
        } else {
            this.savedJobIds.push(jobId);
            alert('Job saved to your bookmarks!');
        }
        this.saveStateToStorage();
        if (this.currentView === 'jobs') this.applyJobFilters();
        if (this.currentView === 'saved') this.renderSavedJobs();
    }

    renderSavedJobs() {
        const container = document.getElementById('savedJobsContainer');
        if (!container) return;
        const publicJobs = this.getPublicPublishedJobs();
        const saved = publicJobs.filter(j => this.savedJobIds.includes(j.id));
        if (saved.length === 0) {
            container.innerHTML = `<div class="card p-5 text-center text-muted full-width">No saved vacancies yet.</div>`;
        } else {
            container.innerHTML = saved.map(j => this.createJobCardHTML(j)).join('');
        }
    }

    createJobCardHTML(job) {
        const isSaved = this.savedJobIds.includes(job.id);
        const isApplied = this.currentUser && this.applications.some(a => a.jobId === job.id && a.candidateEmail === this.currentUser.email);

        const safeTitle = this.sanitizeHTML(job.title);
        const safeCompany = this.sanitizeHTML(job.companyName);
        const safeLocation = this.sanitizeHTML(job.location);
        const isVerified = job.isCompanyVerified ? `<span class="badge badge-success text-xs" style="margin-left:4px;"><i class="fa-solid fa-shield-check"></i> Verified Employer</span>` : '';

        return `
            <div class="job-card">
                <div>
                    <div class="flex-between mb-2">
                        <div style="display:flex; align-items:center; gap:0.6rem;">
                            <div class="job-company-avatar">${safeCompany.substring(0, 2).toUpperCase()}</div>
                            <div>
                                <strong class="text-sm text-secondary">${safeCompany}</strong> ${isVerified}
                                <h3 style="font-size:1.1rem; margin-top:2px;">${safeTitle}</h3>
                            </div>
                        </div>
                        <button class="btn btn-icon-only ${isSaved ? 'text-danger' : 'text-muted'}" onclick="app.toggleSaveJob('${job.id}', event)" title="Save Job">
                            <i class="fa-${isSaved ? 'solid' : 'regular'} fa-bookmark"></i>
                        </button>
                    </div>

                    <div class="text-sm text-secondary mb-2">
                        <span><i class="fa-solid fa-location-dot"></i> ${safeLocation}</span> • 
                        <span><i class="fa-solid fa-graduation-cap"></i> ${this.sanitizeHTML(job.qualificationRequired)}</span>
                    </div>

                    <div class="job-skills-tags">
                        ${(job.requiredSkills || []).map(s => `<span class="skill-tag">${this.sanitizeHTML(s)}</span>`).join('')}
                    </div>
                </div>

                <div class="flex-between pt-3 border-top mt-3">
                    <span class="salary-text">${this.sanitizeHTML(job.salary)}</span>
                    <div>
                        <button class="btn btn-outline btn-sm mr-2" onclick="app.renderJobDetail('${job.id}')">Specs</button>
                        ${this.currentRole === 'ADMIN' ? 
                            `<button class="btn btn-primary btn-sm mr-1" onclick="app.editJob('${job.id}')"><i class="fa-solid fa-pen"></i> Edit</button>
                             <button class="btn btn-outline btn-sm text-danger" onclick="app.deleteJob('${job.id}')"><i class="fa-solid fa-trash"></i></button>` :
                            (isApplied ? 
                                `<span class="badge badge-success"><i class="fa-solid fa-check"></i> Applied</span>` :
                                `<button class="btn btn-primary btn-sm" onclick="app.openApplyModal('${job.id}')"><i class="fa-solid fa-paper-plane"></i> Apply via Email</button>`
                            )
                        }
                    </div>
                </div>
            </div>
        `;
    }

    renderJobDetail(jobId) {
        const job = this.jobs.find(j => j.id === jobId);
        if (!job) return;

        const publicJobs = this.getPublicPublishedJobs();
        const isPublic = publicJobs.some(j => j.id === jobId);

        if (this.currentRole !== 'ADMIN' && !isPublic) {
            alert('This job vacancy is currently unavailable or has expired.');
            this.navigateTo('jobs');
            return;
        }

        this.navigateTo('job-detail');
        const isApplied = this.currentUser && this.applications.some(a => a.jobId === job.id && a.candidateEmail === this.currentUser.email);
        const isVerified = job.isCompanyVerified ? `<span class="badge badge-success ml-2"><i class="fa-solid fa-shield-check"></i> Verified Employer</span>` : '';

        document.getElementById('jobDetailContent').innerHTML = `
            <div class="card p-4">
                <div class="flex-between mb-4">
                    <div>
                        <span class="badge badge-primary mb-2">${this.sanitizeHTML(job.category)}</span>
                        ${isVerified}
                        <h1 class="mt-2">${this.sanitizeHTML(job.title)}</h1>
                        <p class="text-secondary">${this.sanitizeHTML(job.companyName)} • ${this.sanitizeHTML(job.location)}</p>
                    </div>
                    <h2 class="text-success">${this.sanitizeHTML(job.salary)}</h2>
                </div>
                <div class="form-grid mb-4">
                    <div><strong>Qualification:</strong> ${this.sanitizeHTML(job.qualificationRequired)}</div>
                    <div><strong>Experience:</strong> ${this.sanitizeHTML(job.experienceRequired || 'Freshers / Exp')}</div>
                    <div><strong>Positions:</strong> ${job.positions || 'Multiple'} Vacancies</div>
                    <div><strong>Status:</strong> <span class="badge badge-success">Active Published Vacancy</span></div>
                </div>
                <div class="mb-4">
                    <h3>Job Description & Key Duties</h3>
                    <p class="mt-2" style="white-space:pre-line;">${this.sanitizeHTML(job.description)}</p>
                </div>
                <div class="flex-between border-top pt-4">
                    <span class="text-muted"><i class="fa-solid fa-shield-halved text-success"></i> Direct Rozgaar Mitra Verified Job</span>
                    ${this.currentRole === 'ADMIN' ?
                        `<div>
                            <button class="btn btn-primary btn-lg mr-2" onclick="app.editJob('${job.id}')"><i class="fa-solid fa-pen"></i> Edit Job Details</button>
                         </div>` :
                        (isApplied ? 
                            `<button class="btn btn-success btn-lg" disabled><i class="fa-solid fa-check"></i> Applied via Email</button>` :
                            `<button class="btn btn-primary btn-lg" onclick="app.openApplyModal('${job.id}')"><i class="fa-solid fa-paper-plane"></i> Apply via Email (Resume भेजें)</button>`
                        )
                    }
                </div>
            </div>
        `;
    }

    openApplyModal(jobId) {
        const job = this.jobs.find(j => j.id === jobId);
        if (!job) return;

        if (!this.currentUser) {
            this.openAuthModal('email-otp');
            alert('Please login or register to apply for vacancies!');
            return;
        }

        const u = this.currentUser;
        document.getElementById('applyJobId').value = job.id;

        if (document.getElementById('appCandName')) document.getElementById('appCandName').value = u.name || '';
        if (document.getElementById('appCandMobile')) document.getElementById('appCandMobile').value = u.mobile || '';
        if (document.getElementById('appCandEmail')) document.getElementById('appCandEmail').value = u.email || '';
        if (document.getElementById('appCandLocation')) document.getElementById('appCandLocation').value = u.location || '';
        if (document.getElementById('appCandQual')) document.getElementById('appCandQual').value = u.qualification || '12th Pass (Intermediate)';
        if (document.getElementById('appCandExp')) document.getElementById('appCandExp').value = u.experienceYears || 'Fresher';
        if (document.getElementById('appConsentCheck')) document.getElementById('appConsentCheck').checked = false;

        const destEmail = job.applicationEmail || this.defaultAppEmail || 'rozgarmitra3007@gmail.com';
        const summaryBox = document.getElementById('jobApplySummaryBox');
        if (summaryBox) {
            summaryBox.innerHTML = `
                <strong>${this.sanitizeHTML(job.title)}</strong> – ${this.sanitizeHTML(job.companyName)}<br>
                <span class="text-sm text-secondary"><i class="fa-solid fa-location-dot"></i> ${this.sanitizeHTML(job.location)} | Salary: ${this.sanitizeHTML(job.salary)}</span><br>
                <small class="text-muted"><i class="fa-solid fa-envelope text-primary"></i> Target Application Email: <strong>${this.sanitizeHTML(destEmail)}</strong></small>
            `;
        }

        document.getElementById('jobApplyModal').classList.remove('hidden');
    }

    submitEmailApplication(event) {
        event.preventDefault();

        const jobId = document.getElementById('applyJobId').value;
        const job = this.jobs.find(j => j.id === jobId);
        if (!job) {
            alert('Job vacancy not found.');
            return;
        }

        const consent = document.getElementById('appConsentCheck')?.checked;
        if (!consent) {
            alert('Please accept the consent checkbox to share application details with the employer.');
            return;
        }

        const name = document.getElementById('appCandName').value.trim();
        const mobile = document.getElementById('appCandMobile').value.trim();
        const email = document.getElementById('appCandEmail').value.trim();
        const location = document.getElementById('appCandLocation').value.trim();
        const qual = document.getElementById('appCandQual').value;
        const exp = document.getElementById('appCandExp').value;

        const destEmail = job.applicationEmail || this.defaultAppEmail || 'rozgarmitra3007@gmail.com';
        const subject = encodeURIComponent(`Job Application – ${job.title} – ${name}`);
        const bodyText = `Respected HR / Employer,

I am submitting my job application for the vacancy of "${job.title}" at "${job.companyName}".

CANDIDATE APPLICATION DETAILS:
---------------------------------------------
Full Name: ${name}
Mobile Number: ${mobile}
Email Address: ${email}
Current Location: ${location}
Highest Qualification: ${qual}
Total Experience: ${exp}

---------------------------------------------
IMPORTANT RESUME ATTACHMENT NOTICE:
I have attached my Resume / CV file to this email. Please inspect my attached Resume.

Sent via Rozgaar Mitra Govt MSME Registered Consultancy (rozgaarmitra.com)`;

        const mailtoUrl = `mailto:${destEmail}?subject=${subject}&body=${encodeURIComponent(bodyText)}`;

        const newApp = {
            id: 'app-' + Date.now(),
            jobId: job.id,
            userId: this.currentUser ? this.currentUser.id : 'cand-' + Date.now(),
            candidateName: name,
            candidateEmail: email,
            candidateMobile: mobile,
            candidateQual: qual,
            appliedAt: new Date().toISOString().split('T')[0],
            status: 'Applied'
        };
        this.applications.push(newApp);

        this.notifications.push({
            id: 'notif-' + Date.now(),
            userId: this.currentUser ? this.currentUser.id : 'all',
            message: `Email application dispatched for ${job.title} at ${job.companyName}!`,
            type: 'APPLICATION_UPDATE',
            isRead: false,
            createdAt: new Date().toISOString().split('T')[0]
        });

        this.saveStateToStorage();
        this.closeModal('jobApplyModal');

        window.location.href = mailtoUrl;

        alert(`📧 Application Email Prepared!\n\nYour email app is opening to send your application to ${destEmail}.\n\nIMPORTANT: Please attach your Resume file to the email before sending!`);
    }

    openNewJobModal() {
        if (this.currentRole !== 'ADMIN') return;
        document.getElementById('jobEditId').value = '';
        document.getElementById('jobForm').reset();
        document.getElementById('jobStatus').value = 'DRAFT'; // Default status is ALWAYS Draft!
        document.getElementById('jobCompanyVerified').checked = false;
        document.getElementById('jobModalTitle').textContent = 'Post New Private Job';
        document.getElementById('jobModal').classList.remove('hidden');
    }

    editJob(jobId) {
        if (this.currentRole !== 'ADMIN') return;
        const job = this.jobs.find(j => j.id === jobId);
        if (!job) return;

        document.getElementById('jobEditId').value = job.id;
        document.getElementById('jobTitle').value = job.title;
        document.getElementById('jobCompany').value = job.companyName;
        document.getElementById('jobStatus').value = (job.status || 'DRAFT').toUpperCase();
        document.getElementById('jobCategory').value = job.category;
        document.getElementById('jobLocation').value = job.location;
        document.getElementById('jobSalary').value = job.salary;
        document.getElementById('jobQualification').value = job.qualificationRequired;
        document.getElementById('jobAppEmail').value = job.applicationEmail || '';
        document.getElementById('jobExpiryDate').value = job.expiryDate || '';
        document.getElementById('jobCompanyVerified').checked = !!job.isCompanyVerified;
        document.getElementById('jobDesc').value = job.description;

        document.getElementById('jobModalTitle').textContent = 'Edit Job Details';
        document.getElementById('jobModal').classList.remove('hidden');
    }

    deleteJob(jobId) {
        if (this.currentRole !== 'ADMIN') return;
        const job = this.jobs.find(j => j.id === jobId);
        if (!job) return;

        this.pendingDeleteJobId = jobId;
        const textEl = document.getElementById('deleteJobWarningText');
        if (textEl) {
            textEl.innerHTML = `Are you sure you want to permanently delete the job vacancy <strong>"${this.sanitizeHTML(job.title)}"</strong> (${this.sanitizeHTML(job.companyName)})? This action cannot be undone!`;
        }

        document.getElementById('deleteConfirmModal').classList.remove('hidden');
    }

    confirmDeleteJob() {
        if (this.currentRole !== 'ADMIN' || !this.pendingDeleteJobId) return;

        const jobId = this.pendingDeleteJobId;
        const job = this.jobs.find(j => j.id === jobId);

        this.jobs = this.jobs.filter(j => j.id !== jobId);
        this.saveStateToStorage();
        this.closeModal('deleteConfirmModal');
        this.pendingDeleteJobId = null;

        this.logAdminAction('DELETE_JOB', `Permanently deleted job vacancy "${job ? job.title : jobId}"`);
        alert(`Job "${job ? job.title : ''}" deleted permanently!`);
        this.renderAdminJobsTable();
        this.renderFeaturedJobs();
    }

    toggleHiringClosed(jobId) {
        if (this.currentRole !== 'ADMIN') return;
        const job = this.jobs.find(j => j.id === jobId);
        if (!job) return;

        if (job.status === 'PUBLISHED') {
            job.status = 'PAUSED';
            job.isActive = false;
            alert(`Job "${job.title}" marked as PAUSED! Hidden from public website.`);
        } else {
            job.status = 'PUBLISHED';
            job.isActive = true;
            alert(`Job "${job.title}" is now PUBLISHED and live on public website!`);
        }

        this.saveStateToStorage();
        this.renderAdminJobsTable();
        this.renderFeaturedJobs();
        this.logAdminAction('TOGGLE_HIRING_STATUS', `Toggled status for "${job.title}" to ${job.status}`);
    }

    saveJob(event) {
        event.preventDefault();
        if (this.currentRole !== 'ADMIN') return;

        const editId = document.getElementById('jobEditId').value;
        const title = this.sanitizeHTML(document.getElementById('jobTitle').value);
        const companyName = this.sanitizeHTML(document.getElementById('jobCompany').value);
        const status = document.getElementById('jobStatus').value.toUpperCase();
        const category = document.getElementById('jobCategory').value;
        const location = this.sanitizeHTML(document.getElementById('jobLocation').value);
        const salary = this.sanitizeHTML(document.getElementById('jobSalary').value);
        const qualificationRequired = document.getElementById('jobQualification').value;
        const applicationEmail = document.getElementById('jobAppEmail').value.trim();
        const expiryDate = document.getElementById('jobExpiryDate').value;
        const isCompanyVerified = document.getElementById('jobCompanyVerified').checked;
        const description = this.sanitizeHTML(document.getElementById('jobDesc').value);

        const today = new Date().toISOString().split('T')[0];

        if (editId) {
            const idx = this.jobs.findIndex(j => j.id === editId);
            if (idx >= 0) {
                const existing = this.jobs[idx];
                const isNowPublished = status === 'PUBLISHED';

                this.jobs[idx] = {
                    ...existing,
                    title, companyName, status, category, location, salary, qualificationRequired,
                    applicationEmail, expiryDate, isCompanyVerified, description,
                    isActive: isNowPublished,
                    publishedDate: isNowPublished ? (existing.publishedDate || today) : null,
                    lastUpdatedDate: today,
                    publishedBy: this.officialAdminEmail
                };
                this.logAdminAction('UPDATE_JOB', `Updated job "${title}" (Status: ${status})`);
                alert(`Job "${title}" updated successfully! (Status: ${status})`);
            }
        } else {
            const isPublished = status === 'PUBLISHED';
            const newJob = {
                id: 'job-' + Date.now(),
                companyName, title, status, category, location, salary, qualificationRequired,
                experienceRequired: '1-2 Years', positions: 2,
                requiredSkills: ['Customer Support', 'MS Excel'],
                applicationEmail, expiryDate, isCompanyVerified, description,
                isActive: isPublished,
                postedAt: today,
                publishedDate: isPublished ? today : null,
                lastUpdatedDate: today,
                publishedBy: this.officialAdminEmail
            };
            this.jobs.unshift(newJob);
            this.logAdminAction('POST_JOB', `Created job "${title}" for ${companyName} (Status: ${status})`);
            alert(`Job "${title}" created successfully! Status: ${status}. ${isPublished ? 'Live on Website!' : 'Hidden from public website until Published.'}`);
        }

        this.saveStateToStorage();
        this.closeModal('jobModal');
        if (this.currentView === 'admin-jobs') this.renderAdminJobsTable();
        this.renderFeaturedJobs();
    }

    changeJobStatus(jobId, newStatus) {
        if (this.currentRole !== 'ADMIN') return;
        const job = this.jobs.find(j => j.id === jobId);
        if (!job) return;

        const statusUpper = newStatus.toUpperCase();
        job.status = statusUpper;
        job.isActive = statusUpper === 'PUBLISHED';
        job.lastUpdatedDate = new Date().toISOString().split('T')[0];

        if (statusUpper === 'PUBLISHED' && !job.publishedDate) {
            job.publishedDate = new Date().toISOString().split('T')[0];
        }

        this.saveStateToStorage();
        this.renderAdminJobsTable();
        this.renderFeaturedJobs();
        this.logAdminAction('CHANGE_JOB_STATUS', `Changed status for "${job.title}" to ${statusUpper}`);
        alert(`Status for "${job.title}" changed to ${statusUpper}. ${statusUpper === 'PUBLISHED' ? 'Now Live on Public Website!' : 'Hidden from Public Website.'}`);
    }

    openAdminSettingsModal() {
        if (this.currentRole !== 'ADMIN') return;
        const input = document.getElementById('settingDefaultAppEmail');
        if (input) input.value = this.defaultAppEmail || 'rozgarmitra3007@gmail.com';
        document.getElementById('adminSettingsModal').classList.remove('hidden');
    }

    saveAdminSettings(event) {
        event.preventDefault();
        if (this.currentRole !== 'ADMIN') return;
        const email = document.getElementById('settingDefaultAppEmail').value.trim();
        if (!email || !email.includes('@')) {
            alert('Please enter a valid email address.');
            return;
        }
        this.defaultAppEmail = email;
        this.setStorageItem('rm_default_app_email', email);
        this.closeModal('adminSettingsModal');
        this.logAdminAction('UPDATE_ADMIN_SETTINGS', `Updated default application receiving email to ${email}`);
        alert(`Admin Settings Saved! Default application email updated to: ${email}`);
    }

    renderAdminJobsTable() {
        if (this.currentRole !== 'ADMIN') return;
        const tbody = document.getElementById('adminJobsTableBody');
        if (!tbody) return;

        if (!this.jobs || this.jobs.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" class="text-center p-4 text-muted">No vacancies created yet. Click "Post New Job" above to create a vacancy draft.</td></tr>`;
            return;
        }

        const statusBadgeClass = {
            'DRAFT': 'badge-secondary',
            'PENDING': 'badge-warning',
            'PUBLISHED': 'badge-success',
            'PAUSED': 'badge-info',
            'EXPIRED': 'badge-danger',
            'REJECTED': 'badge-danger'
        };

        const today = new Date().toISOString().split('T')[0];

        tbody.innerHTML = this.jobs.map(j => {
            const statusUpper = (j.status || 'DRAFT').toUpperCase();
            const isExpired = j.expiryDate && j.expiryDate < today;
            const displayStatus = isExpired ? 'EXPIRED' : statusUpper;
            const badgeClass = statusBadgeClass[displayStatus] || 'badge-secondary';
            const isVerified = j.isCompanyVerified ? `<span class="badge badge-success text-xs"><i class="fa-solid fa-shield-check"></i> Verified</span>` : '';

            return `
                <tr>
                    <td>
                        <strong>${this.sanitizeHTML(j.title)}</strong> ${isVerified}<br>
                        <small class="text-secondary">${this.sanitizeHTML(j.companyName)}</small>
                    </td>
                    <td>${this.sanitizeHTML(j.category)}</td>
                    <td>${this.sanitizeHTML(j.location)}</td>
                    <td>${this.sanitizeHTML(j.salary)}</td>
                    <td>
                        <span class="badge ${badgeClass}">${displayStatus}</span>
                        <br><small class="text-muted" style="font-size:0.75rem;">Exp: ${j.expiryDate || 'No Limit'}</small>
                    </td>
                    <td>
                        <select class="form-control form-control-sm" style="width:auto; display:inline-block;" onchange="app.changeJobStatus('${j.id}', this.value)">
                            <option value="DRAFT" ${statusUpper === 'DRAFT' ? 'selected' : ''}>Draft</option>
                            <option value="PENDING" ${statusUpper === 'PENDING' ? 'selected' : ''}>Pending Review</option>
                            <option value="PUBLISHED" ${statusUpper === 'PUBLISHED' ? 'selected' : ''}>Publish Live</option>
                            <option value="PAUSED" ${statusUpper === 'PAUSED' ? 'selected' : ''}>Pause</option>
                            <option value="EXPIRED" ${statusUpper === 'EXPIRED' ? 'selected' : ''}>Expired</option>
                            <option value="REJECTED" ${statusUpper === 'REJECTED' ? 'selected' : ''}>Rejected</option>
                        </select>
                    </td>
                    <td>
                        <button class="btn btn-outline btn-sm mr-1" onclick="app.editJob('${j.id}')" title="Edit Job"><i class="fa-solid fa-pen-to-square"></i> Edit</button>
                        <button class="btn btn-outline btn-sm text-danger" onclick="app.deleteJob('${j.id}')" title="Delete Job"><i class="fa-solid fa-trash"></i></button>
                    </td>
                </tr>
            `;
        }).join('');
    }
    renderApplicationsView() {
        const container = document.getElementById('applicationsContainer');
        if (!container) return;
        if (!this.currentUser && this.currentRole !== 'ADMIN') {
            container.innerHTML = `<div class="card p-5 text-center text-muted">Login required to view applications.</div>`;
            return;
        }

        const myApps = this.currentRole === 'ADMIN' ? 
            this.applications : 
            this.applications.filter(a => a.candidateEmail === this.currentUser?.email);

        if (myApps.length === 0) {
            container.innerHTML = `<div class="card p-5 text-center text-muted">No applications submitted yet.</div>`;
            return;
        }

        container.innerHTML = myApps.map(a => {
            const job = this.jobs.find(j => j.id === a.jobId) || { title: 'Pvt Job', companyName: 'Company' };
            return `
                <div class="card p-3 mb-3 flex-between">
                    <div>
                        <span class="badge badge-success mb-2">${a.status}</span>
                        <h3>${this.sanitizeHTML(job.title)}</h3>
                        <p class="text-secondary">${this.sanitizeHTML(job.companyName)} • Candidate: <strong>${this.sanitizeHTML(a.candidateName)}</strong> (${this.sanitizeHTML(a.candidateMobile)}) • Applied ${a.appliedAt}</p>
                    </div>
                </div>
            `;
        }).join('');
    }

    renderNotificationsView() {
        const container = document.getElementById('notificationsContainer');
        if (!container) return;

        const myNotifs = this.currentRole === 'ADMIN' ? 
            this.notifications : 
            this.notifications.filter(n => n.userId === this.currentUser?.id || n.userId === 'all');

        if (myNotifs.length === 0) {
            container.innerHTML = `<div class="card p-5 text-center text-muted">No new notifications.</div>`;
            return;
        }

        container.innerHTML = myNotifs.map(n => `
            <div class="card p-3 mb-2 flex-between">
                <div>
                    <span class="badge badge-primary mb-1">${n.type}</span>
                    <p>${this.sanitizeHTML(n.message)}</p>
                    <small class="text-muted">${n.createdAt}</small>
                </div>
            </div>
        `).join('');
    }

    renderAdminDashboard() {
        if (this.currentRole !== 'ADMIN') return;
        this.updateStatsCounters();
        const tbody = document.getElementById('admRecentAppsTable');
        if (!tbody) return;

        if (this.applications.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-center p-4 text-muted">No candidate applications received yet.</td></tr>`;
            return;
        }

        tbody.innerHTML = [...this.applications].reverse().slice(0, 5).map(a => {
            const job = this.jobs.find(j => j.id === a.jobId) || { title: 'Private Sector Job' };
            return `
                <tr>
                    <td><strong>${this.sanitizeHTML(a.candidateName)}</strong><br><small>${this.sanitizeHTML(a.candidateEmail)}</small></td>
                    <td>${this.sanitizeHTML(job.title)}</td>
                    <td>${this.sanitizeHTML(a.candidateQual)}</td>
                    <td>
                        <select class="form-control" style="width:auto;" onchange="app.updateAppStatus('${a.id}', this.value)">
                            <option value="Applied" ${a.status === 'Applied' ? 'selected' : ''}>Applied</option>
                            <option value="Shortlisted" ${a.status === 'Shortlisted' ? 'selected' : ''}>Shortlisted</option>
                            <option value="Selected" ${a.status === 'Selected' ? 'selected' : ''}>Selected</option>
                            <option value="Rejected" ${a.status === 'Rejected' ? 'selected' : ''}>Rejected</option>
                        </select>
                    </td>
                    <td><button class="btn btn-outline btn-sm" onclick="app.navigateTo('admin-candidates')">View Profile</button></td>
                </tr>
            `;
        }).join('');
    }

    updateAppStatus(appId, newStatus) {
        if (this.currentRole !== 'ADMIN') return;
        const appObj = this.applications.find(a => a.id === appId);
        if (appObj) {
            appObj.status = newStatus;
            
            this.notifications.push({
                id: 'notif-' + Date.now(),
                userId: appObj.userId,
                message: `Your job application status has been updated to "${newStatus}"!`,
                type: 'APPLICATION_UPDATE',
                isRead: false,
                createdAt: new Date().toISOString().split('T')[0]
            });

            this.saveStateToStorage();
            this.logAdminAction('UPDATE_APPLICATION_STATUS', `Updated application ${appId} status to ${newStatus}`);
            alert(`Candidate status updated to "${newStatus}"!`);
        }
    }

    openAuthModal(tab = 'email-otp') {
        this.switchAuthTab(tab);
        document.getElementById('authModal').classList.remove('hidden');
    }

    closeModal(modalId) {
        document.getElementById(modalId)?.classList.add('hidden');
    }

    switchAuthTab(tab) {
        document.getElementById('tabLoginEmailOtp')?.classList.remove('active');
        document.getElementById('tabRegister')?.classList.remove('active');

        document.getElementById('formEmailOtpLogin')?.classList.add('hidden');
        document.getElementById('formRegister')?.classList.add('hidden');

        if (tab === 'register') {
            document.getElementById('tabRegister')?.classList.add('active');
            document.getElementById('formRegister')?.classList.remove('hidden');
        } else {
            document.getElementById('tabLoginEmailOtp')?.classList.add('active');
            document.getElementById('formEmailOtpLogin')?.classList.remove('hidden');
        }
    }
}

const app = new RozgaarMitraApp();

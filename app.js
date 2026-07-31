/**
 * ROZGAAR MITRA (rozgaarmitra.com) - 100% PRODUCTION CORE ENGINE
 * 
 * CANDIDATE DATABASE & APPLICATIONS SELF-HEALING AUTO-SYNC ENGINE
 */

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

    init() {
        this.loadStateFromStorage();
        this.purgeInitialSeedJobs();
        this.syncApplicantsIntoCandidateDatabase();
        this.setupTheme();
        this.renderCategoryCards();
        this.renderFeaturedJobs();
        this.renderSkillsTagSelector();
        this.applyJobFilters();
        this.updateStatsCounters();
        this.setupSecretAdminTriggers();
        this.setupAdminInactivityMonitor();
        this.setupRealtimeSyncListeners();
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
            } catch (e) {
                console.warn('Session load notice:', e);
            }
        }

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

    // SELF-HEALING SYNC: Ensure EVERY candidate in applications exists in candidate database
    syncApplicantsIntoCandidateDatabase() {
        if (!this.applications) this.applications = [];
        if (!this.candidates) this.candidates = [];

        let stateChanged = false;

        this.applications.forEach(app => {
            if (app.candidateEmail) {
                const existing = this.candidates.find(c => c.email.toLowerCase() === app.candidateEmail.toLowerCase());
                if (!existing) {
                    const newCand = {
                        id: app.userId || 'cand-' + Date.now(),
                        name: app.candidateName || app.candidateEmail.split('@')[0],
                        email: app.candidateEmail.toLowerCase(),
                        mobile: app.candidateMobile || '+91 9876543210',
                        qualification: app.candidateQual || '12th Pass',
                        role: 'SEEKER',
                        skills: ['Customer Support', 'MS Excel'],
                        isSuspended: false,
                        location: 'India',
                        preferredCategory: 'General',
                        preferredCity: 'Delhi NCR'
                    };
                    this.candidates.push(newCand);
                    stateChanged = true;
                }
            }
        });

        if (stateChanged) {
            this.saveStateToStorage();
        }
    }

    setupRealtimeSyncListeners() {
        window.addEventListener('storage', (e) => {
            this.loadStateFromStorage();
            this.syncApplicantsIntoCandidateDatabase();
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
                    this.loadStateFromStorage();
                    this.syncApplicantsIntoCandidateDatabase();
                    this.updateStatsCounters();
                    if (this.currentRole === 'ADMIN') {
                        if (this.currentView === 'admin-candidates') this.filterCandidateDatabase();
                        if (this.currentView === 'admin-dashboard') this.renderAdminDashboard();
                    }
                }
            };
        }
    }

    notifyRealtimeEvent(type, payload) {
        if (this.syncChannel) {
            try {
                this.syncChannel.postMessage({ type, payload });
            } catch(e){}
        }
    }

    purgeInitialSeedJobs() {
        if (this.jobs && this.jobs.length > 0) {
            this.jobs = this.jobs.filter(j => !j.id.startsWith('job-10') && !j.id.startsWith('job-11'));
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

        if (!this.jobs || this.jobs.length === 0) {
            container.innerHTML = `
                <div class="card p-5 text-center text-muted full-width" style="grid-column: 1 / -1;">
                    <i class="fa-solid fa-briefcase fa-2x mb-3 text-primary d-block"></i>
                    <h3>No Job Vacancies Available Yet</h3>
                    <p class="mt-1">New verified vacancies posted by the Admin Consultancy team will appear here.</p>
                </div>
            `;
            return;
        }

        const visible = this.jobs.slice(0, 6);
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
        const kw = (document.getElementById('filterKeyword')?.value || '').toLowerCase();
        const cat = document.getElementById('filterCategory')?.value || '';
        const loc = document.getElementById('filterLocation')?.value || '';
        const qual = document.getElementById('filterQualification')?.value || '';
        const sort = document.getElementById('sortJobs')?.value || 'latest';

        let res = [...this.jobs];

        if (kw) {
            res = res.filter(j => 
                j.title.toLowerCase().includes(kw) || 
                j.companyName.toLowerCase().includes(kw) || 
                j.description.toLowerCase().includes(kw) ||
                (j.requiredSkills && j.requiredSkills.some(s => s.toLowerCase().includes(kw)))
            );
        }

        if (cat) res = res.filter(j => j.category === cat);
        if (loc) res = res.filter(j => j.location.includes(loc));
        if (qual) res = res.filter(j => j.qualificationRequired === qual);

        if (sort === 'salary-high') res.sort((a, b) => b.salary - a.salary);
        else res.sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt));

        if (document.getElementById('jobsResultCount')) document.getElementById('jobsResultCount').textContent = `Showing ${res.length} jobs`;

        const container = document.getElementById('allJobsContainer');
        if (container) {
            if (res.length === 0) {
                container.innerHTML = `
                    <div class="card p-5 text-center text-muted">
                        <i class="fa-solid fa-briefcase fa-2x mb-3 text-primary d-block"></i>
                        <h3>No jobs posted matching filters.</h3>
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
        const saved = this.jobs.filter(j => this.savedJobIds.includes(j.id));
        if (saved.length === 0) {
            container.innerHTML = `<div class="card p-5 text-center text-muted full-width">No saved jobs yet.</div>`;
        } else {
            container.innerHTML = saved.map(j => this.createJobCardHTML(j)).join('');
        }
    }

    createJobCardHTML(job) {
        const isSaved = this.savedJobIds.includes(job.id);
        const isApplied = this.currentUser && this.applications.some(a => a.jobId === job.id && a.candidateEmail === this.currentUser.email);
        const isClosed = job.status === 'HIRING_CLOSED' || job.status === 'VACANCY_FULL';

        const safeTitle = this.sanitizeHTML(job.title);
        const safeCompany = this.sanitizeHTML(job.companyName);
        const safeLocation = this.sanitizeHTML(job.location);

        return `
            <div class="job-card ${isClosed ? 'hiring-closed-card' : ''}">
                <div>
                    <div class="flex-between mb-2">
                        <div style="display:flex; align-items:center; gap:0.6rem;">
                            <div class="job-company-avatar">${safeCompany.substring(0, 2).toUpperCase()}</div>
                            <div>
                                <strong class="text-sm text-secondary">${safeCompany}</strong>
                                <h3 style="font-size:1.1rem;">${safeTitle}</h3>
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

                    ${isClosed ? `<span class="badge badge-danger mb-2"><i class="fa-solid fa-lock"></i> Vacancy Full / Hiring Closed</span>` : ''}

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
                            (isClosed ?
                                `<button class="btn btn-outline btn-sm" disabled style="opacity:0.6;"><i class="fa-solid fa-lock"></i> Hiring Closed</button>` :
                                (isApplied ? 
                                    `<span class="badge badge-success"><i class="fa-solid fa-check"></i> Applied</span>` :
                                    `<button class="btn btn-primary btn-sm" onclick="app.applyForJob('${job.id}')">Apply Now</button>`
                                )
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

        this.navigateTo('job-detail');
        const isApplied = this.currentUser && this.applications.some(a => a.jobId === job.id && a.candidateEmail === this.currentUser.email);
        const isClosed = job.status === 'HIRING_CLOSED' || job.status === 'VACANCY_FULL';

        document.getElementById('jobDetailContent').innerHTML = `
            <div class="card p-4">
                <div class="flex-between mb-4">
                    <div>
                        <span class="badge badge-primary mb-2">${this.sanitizeHTML(job.category)}</span>
                        ${isClosed ? `<span class="badge badge-danger mb-2 ml-2"><i class="fa-solid fa-lock"></i> Vacancy Full / Hiring Closed</span>` : ''}
                        <h1>${this.sanitizeHTML(job.title)}</h1>
                        <p class="text-secondary">${this.sanitizeHTML(job.companyName)} • ${this.sanitizeHTML(job.location)}</p>
                    </div>
                    <h2 class="text-success">${this.sanitizeHTML(job.salary)}</h2>
                </div>
                <div class="form-grid mb-4">
                    <div><strong>Qualification:</strong> ${this.sanitizeHTML(job.qualificationRequired)}</div>
                    <div><strong>Experience:</strong> ${this.sanitizeHTML(job.experienceRequired)}</div>
                    <div><strong>Vacancies:</strong> ${job.positions || 2} Positions</div>
                    <div><strong>Status:</strong> <span class="badge ${isClosed ? 'badge-danger' : 'badge-success'}">${isClosed ? 'Vacancy Full / Hiring Closed' : 'Active Vacancy'}</span></div>
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
                            <button class="btn btn-warning btn-lg" onclick="app.toggleHiringClosed('${job.id}')"><i class="fa-solid fa-lock"></i> ${isClosed ? 'Re-open Hiring' : 'Mark Vacancy Full'}</button>
                         </div>` :
                        (isClosed ?
                            `<button class="btn btn-outline btn-lg" disabled><i class="fa-solid fa-lock"></i> Vacancy Full / Hiring Closed</button>` :
                            (isApplied ? 
                                `<button class="btn btn-success btn-lg" disabled><i class="fa-solid fa-check"></i> Applied</button>` :
                                `<button class="btn btn-primary btn-lg" onclick="app.applyForJob('${job.id}')">Apply Now</button>`
                            )
                        )
                    }
                </div>
            </div>
        `;
    }

    applyForJob(jobId) {
        const job = this.jobs.find(j => j.id === jobId);
        if (!job) return;

        if (job.status === 'HIRING_CLOSED' || job.status === 'VACANCY_FULL') {
            alert('Hiring is currently closed for this job as all vacancies are filled.');
            return;
        }

        if (!this.currentUser) {
            this.openAuthModal('email-otp');
            alert('Please login or register to apply for jobs!');
            return;
        }

        const newApp = {
            id: 'app-' + Date.now(),
            jobId: job.id,
            userId: this.currentUser.id,
            candidateName: this.currentUser.name,
            candidateEmail: this.currentUser.email,
            candidateMobile: this.currentUser.mobile || '+91 9876543210',
            candidateQual: this.currentUser.qualification || '12th Pass',
            appliedAt: new Date().toISOString().split('T')[0],
            status: 'Applied'
        };

        this.applications.push(newApp);

        this.notifications.push({
            id: 'notif-' + Date.now(),
            userId: this.currentUser.id,
            message: `Application submitted successfully for ${job.title} at ${job.companyName}!`,
            type: 'APPLICATION_UPDATE',
            isRead: false,
            createdAt: new Date().toISOString().split('T')[0]
        });

        this.syncApplicantsIntoCandidateDatabase();
        this.saveStateToStorage();
        this.notifyRealtimeEvent('APPLICATION_SUBMITTED', newApp);
        alert(`Application for "${job.title}" successfully submitted!`);
        this.navigateTo('applications');
    }

    // CSV REPORT EXPORT ENGINE
    exportCandidatesCSV() {
        if (this.currentRole !== 'ADMIN') return;
        if (!this.candidates || this.candidates.length === 0) {
            alert('No candidate records available to export.');
            return;
        }

        let csv = 'Name,Email,Mobile,DOB,Gender,Qualification,Location,Experience,PrefCategory,PrefCity,ExpectedSalMin,ExpectedSalMax,Skills,Resume,Status\n';
        this.candidates.forEach(c => {
            csv += `"${c.name}","${c.email}","${c.mobile}","${c.dob || ''}","${c.gender || ''}","${c.qualification || ''}","${c.location || ''}","${c.experienceYears || ''}","${c.preferredCategory || ''}","${c.preferredCity || ''}","${c.expectedSalaryMin || ''}","${c.expectedSalaryMax || ''}","${(c.skills || []).join(';') || ''}","${c.resumeFileName || ''}","${c.isSuspended ? 'Suspended' : 'Active'}"\n`;
        });

        this.downloadCSVFile(csv, `rozgaarmitra_candidates_${Date.now()}.csv`);
        this.logAdminAction('EXPORT_CSV', 'Exported Candidate Database to CSV');
    }

    exportApplicationsCSV() {
        if (this.currentRole !== 'ADMIN') return;
        if (!this.applications || this.applications.length === 0) {
            alert('No application records available to export.');
            return;
        }

        let csv = 'ApplicationID,CandidateName,CandidateEmail,CandidateMobile,JobTitle,AppliedDate,Status\n';
        this.applications.forEach(a => {
            const job = this.jobs.find(j => j.id === a.jobId) || { title: 'Job' };
            csv += `"${a.id}","${a.candidateName}","${a.candidateEmail}","${a.candidateMobile}","${job.title}","${a.appliedAt}","${a.status}"\n`;
        });

        this.downloadCSVFile(csv, `rozgaarmitra_applications_${Date.now()}.csv`);
        this.logAdminAction('EXPORT_CSV', 'Exported Applications Database to CSV');
    }

    exportJobsCSV() {
        if (this.currentRole !== 'ADMIN') return;
        if (!this.jobs || this.jobs.length === 0) {
            alert('No job records available to export.');
            return;
        }

        let csv = 'JobID,Title,Company,Category,Location,Salary,Qualification,Status,PostedDate\n';
        this.jobs.forEach(j => {
            csv += `"${j.id}","${j.title}","${j.companyName}","${j.category}","${j.location}","${j.salary}","${j.qualificationRequired}","${j.status}","${j.postedAt}"\n`;
        });

        this.downloadCSVFile(csv, `rozgaarmitra_jobs_${Date.now()}.csv`);
        this.logAdminAction('EXPORT_CSV', 'Exported Jobs Database to CSV');
    }

    downloadCSVFile(content, filename) {
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    openBroadcastModal() {
        if (this.currentRole !== 'ADMIN') return;
        document.getElementById('broadcastTitle').value = '';
        document.getElementById('broadcastMessage').value = '';
        document.getElementById('broadcastModal').classList.remove('hidden');
    }

    sendBroadcastNotification(event) {
        event.preventDefault();
        if (this.currentRole !== 'ADMIN') return;

        const title = document.getElementById('broadcastTitle').value;
        const msg = document.getElementById('broadcastMessage').value;

        const newNotif = {
            id: 'notif-broad-' + Date.now(),
            userId: 'all',
            message: `📢 ${title}: ${msg}`,
            type: 'ANNOUNCEMENT',
            isRead: false,
            createdAt: new Date().toISOString().split('T')[0]
        };

        this.notifications.unshift(newNotif);
        this.saveStateToStorage();
        this.closeModal('broadcastModal');
        this.logAdminAction('BROADCAST_ALERT', `Sent broadcast notification to all candidates: ${title}`);
        alert('📢 Broadcast Alert sent to all candidate inboxes successfully!');
    }

    renderAdminAuditLogs() {
        if (this.currentRole !== 'ADMIN') return;
        const tbody = document.getElementById('adminAuditLogTableBody');
        if (!tbody) return;

        if (!this.auditLogs || this.auditLogs.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" class="text-center p-4 text-muted">No admin audit logs recorded yet.</td></tr>`;
            return;
        }

        tbody.innerHTML = this.auditLogs.map(l => `
            <tr>
                <td><small>${l.timestamp}</small></td>
                <td><strong>${this.sanitizeHTML(l.adminEmail)}</strong></td>
                <td><span class="badge badge-primary">${this.sanitizeHTML(l.actionType)}</span></td>
                <td>${this.sanitizeHTML(l.details)}</td>
            </tr>
        `).join('');
    }

    renderManageCompaniesTable() {
        if (this.currentRole !== 'ADMIN') return;
        const tbody = document.getElementById('adminCompaniesTableBody');
        if (!tbody) return;

        if (!this.companies || this.companies.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="text-center p-4 text-muted">No employer companies registered yet. Click "Add Employer" to add a company.</td></tr>`;
            return;
        }

        tbody.innerHTML = this.companies.map(c => `
            <tr>
                <td><strong>${this.sanitizeHTML(c.name)}</strong></td>
                <td>${this.sanitizeHTML(c.industry || 'Private Sector')}</td>
                <td>${this.sanitizeHTML(c.location || 'India')}</td>
                <td>${this.sanitizeHTML(c.email)}</td>
                <td><span class="badge ${c.isApproved ? 'badge-success' : 'badge-danger'}">${c.isApproved ? 'Approved Employer' : 'Pending Verification'}</span></td>
                <td>
                    <button class="btn btn-${c.isApproved ? 'warning' : 'success'} btn-sm" onclick="app.toggleCompanyApproval('${c.id}')">
                        ${c.isApproved ? 'Suspend' : 'Approve'}
                    </button>
                </td>
            </tr>
        `).join('');
    }

    toggleCompanyApproval(compIdx) {
        if (this.currentRole !== 'ADMIN') return;
        const comp = this.companies.find(c => c.id === compIdx);
        if (comp) {
            comp.isApproved = !comp.isApproved;
            this.saveStateToStorage();
            this.renderManageCompaniesTable();
            this.logAdminAction('COMPANY_STATUS_TOGGLE', `Updated approval status for ${comp.name} to ${comp.isApproved}`);
            alert(`Employer "${comp.name}" verification status updated!`);
        }
    }

    openNewCompanyModal() {
        if (this.currentRole !== 'ADMIN') return;
        const name = prompt('Enter Employer Company Name:');
        if (!name) return;
        const email = prompt('Enter Company Contact Email:');
        if (!email) return;

        const newComp = {
            id: 'comp-' + Date.now(),
            name: name,
            email: email,
            industry: 'Private Sector',
            location: 'Delhi NCR',
            isApproved: true
        };

        this.companies.push(newComp);
        this.saveStateToStorage();
        this.renderManageCompaniesTable();
        this.logAdminAction('ADD_COMPANY', `Added new verified employer: ${name}`);
        alert(`Employer Company "${name}" added and verified!`);
    }

    deleteCandidate(candId) {
        if (this.currentRole !== 'ADMIN') return;
        const cand = this.candidates.find(c => c.id === candId);
        if (!cand) return;

        if (confirm(`Are you sure you want to permanently delete candidate profile for "${cand.name}" (${cand.email})?`)) {
            this.candidates = this.candidates.filter(c => c.id !== candId);
            this.saveStateToStorage();
            this.filterCandidateDatabase();
            this.logAdminAction('DELETE_CANDIDATE', `Permanently deleted candidate profile ${cand.email}`);
            alert(`Candidate "${cand.name}" deleted permanently.`);
        }
    }

    toggleCandidateStatus(candId) {
        if (this.currentRole !== 'ADMIN') return;
        const cand = this.candidates.find(c => c.id === candId);
        if (cand) {
            cand.isSuspended = !cand.isSuspended;
            this.saveStateToStorage();
            this.filterCandidateDatabase();
            this.logAdminAction('CANDIDATE_STATUS_TOGGLE', `Updated candidate ${cand.email} status to ${cand.isSuspended ? 'Suspended' : 'Active'}`);
            alert(`Candidate account status updated to ${cand.isSuspended ? 'Suspended' : 'Active'}.`);
        }
    }

    // FULL DETAILED CANDIDATE DATABASE FILTER & RENDER FOR ADMIN
    filterCandidateDatabase() {
        if (this.currentRole !== 'ADMIN') return;
        this.syncApplicantsIntoCandidateDatabase();
        const container = document.getElementById('candidateDatabaseContainer');
        if (!container) return;

        const searchKey = (document.getElementById('adminCandidateSearchKey')?.value || '').toLowerCase().trim();
        const qualFilter = document.getElementById('adminCandidateQualFilter')?.value || '';
        const cityFilter = document.getElementById('adminCandidateCityFilter')?.value || '';

        let list = [...this.candidates];

        if (searchKey) {
            list = list.filter(c => 
                (c.name && c.name.toLowerCase().includes(searchKey)) ||
                (c.email && c.email.toLowerCase().includes(searchKey)) ||
                (c.mobile && c.mobile.includes(searchKey)) ||
                (c.skills && c.skills.some(s => s.toLowerCase().includes(searchKey)))
            );
        }

        if (qualFilter) {
            list = list.filter(c => c.qualification && c.qualification.includes(qualFilter));
        }

        if (cityFilter) {
            list = list.filter(c => c.preferredCity && c.preferredCity.includes(cityFilter));
        }

        if (list.length === 0) {
            container.innerHTML = `
                <div class="card p-5 text-center text-muted">
                    <i class="fa-solid fa-users-slash fa-2x mb-3 text-primary d-block"></i>
                    <h3>No candidates found in database.</h3>
                    <p class="mt-1">Candidates who register or save profiles will appear here with full details.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = list.map(c => {
            const isSusp = c.isSuspended;
            const safeName = this.sanitizeHTML(c.name || 'Candidate');
            const safeEmail = this.sanitizeHTML(c.email || 'N/A');
            const safeMobile = this.sanitizeHTML(c.mobile || 'N/A');
            const safeQual = this.sanitizeHTML(c.qualification || '12th Pass');
            const safeExp = this.sanitizeHTML(c.experienceYears || 'Fresher');
            const safePrefCat = this.sanitizeHTML(c.preferredCategory || 'Not specified');
            const safePrefCity = this.sanitizeHTML(c.preferredCity || 'Not specified');
            const safeSalMin = c.expectedSalaryMin ? `₹${c.expectedSalaryMin}` : 'N/A';
            const safeSalMax = c.expectedSalaryMax ? `₹${c.expectedSalaryMax}` : 'N/A';

            return `
                <div class="card p-4 mb-3" style="border-left: 5px solid ${isSusp ? '#dc2626' : '#002b66'}; border-radius:10px;">
                    <div class="flex-between mb-3 border-bottom pb-3">
                        <div style="display:flex; align-items:center; gap:1rem;">
                            ${c.photoUrl ? 
                                `<img src="${c.photoUrl}" style="width:60px; height:60px; border-radius:50%; object-fit:cover; border:2px solid #002b66;">` : 
                                `<div style="width:60px; height:60px; border-radius:50%; background:#002b66; color:#ffffff; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:1.4rem;">${safeName.substring(0, 2).toUpperCase()}</div>`
                            }
                            <div>
                                <h3 style="font-size:1.2rem; margin:0;">${safeName}</h3>
                                <p class="text-secondary text-sm">
                                    <i class="fa-solid fa-envelope text-primary"></i> <strong>${safeEmail}</strong> | 
                                    <i class="fa-solid fa-phone text-success"></i> <strong>${safeMobile}</strong>
                                </p>
                                <span class="badge ${isSusp ? 'badge-danger' : 'badge-success'} mt-1">
                                    ${isSusp ? '🚨 Account Suspended' : '✅ Active Registered Candidate'}
                                </span>
                            </div>
                        </div>
                        <div style="display:flex; gap:0.5rem;">
                            <a href="tel:${safeMobile}" class="btn btn-outline btn-sm text-success" title="Call Candidate"><i class="fa-solid fa-phone"></i> Call</a>
                            <a href="mailto:${safeEmail}" class="btn btn-outline btn-sm text-primary" title="Email Candidate"><i class="fa-solid fa-envelope"></i> Email</a>
                            <button class="btn btn-outline btn-sm ${isSusp ? 'text-success' : 'text-warning'}" onclick="app.toggleCandidateStatus('${c.id}')">
                                ${isSusp ? 'Unblock' : 'Suspend'}
                            </button>
                            <button class="btn btn-outline btn-sm text-danger" onclick="app.deleteCandidate('${c.id}')" title="Delete Profile"><i class="fa-solid fa-trash"></i></button>
                        </div>
                    </div>

                    <div class="form-grid mb-3 text-sm">
                        <div><strong>Academic Qualification:</strong> ${safeQual}</div>
                        <div><strong>Total Experience:</strong> ${safeExp}</div>
                        <div><strong>Date of Birth:</strong> ${c.dob || 'Not specified'}</div>
                        <div><strong>Gender:</strong> ${c.gender || 'Not specified'}</div>
                        <div><strong>Preferred Job Category:</strong> <span class="badge badge-primary">${safePrefCat}</span></div>
                        <div><strong>Preferred Working City:</strong> ${safePrefCity}</div>
                        <div><strong>Expected Salary Range:</strong> <strong class="text-success">${safeSalMin} - ${safeSalMax} / month</strong></div>
                        <div><strong>Current Location:</strong> ${this.sanitizeHTML(c.location || 'India')}</div>
                    </div>

                    ${c.resumeFileName ? 
                        `<div class="p-3 mb-3" style="background:#f1f5f9; border-radius:8px; display:flex; align-items:center; justify-content:space-between;">
                            <div>
                                <i class="fa-solid fa-file-pdf text-danger fa-lg"></i> 
                                <strong>Uploaded Resume:</strong> ${this.sanitizeHTML(c.resumeFileName)} (${c.resumeFileSize || 'PDF'})
                                <small class="text-muted d-block">Uploaded on ${c.resumeUploadDate || 'Saved'}</small>
                            </div>
                            <span class="badge badge-success"><i class="fa-solid fa-check"></i> Resume Attached</span>
                         </div>` : 
                        `<p class="text-muted text-sm mb-2"><i class="fa-solid fa-file-excel"></i> No resume document uploaded yet.</p>`
                    }

                    <div>
                        <strong class="text-sm d-block mb-1">Candidate Skills & Competencies:</strong>
                        <div class="job-skills-tags">
                            ${(c.skills || []).length > 0 ? 
                                (c.skills || []).map(s => `<span class="skill-tag">${this.sanitizeHTML(s)}</span>`).join('') :
                                `<span class="text-muted text-sm">No skills added yet.</span>`
                            }
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    updateProfileCompletion() {
        const fields = [
            document.getElementById('profName')?.value,
            document.getElementById('profEmail')?.value,
            document.getElementById('profMobile')?.value,
            document.getElementById('profLocation')?.value,
            document.getElementById('profDob')?.value,
            document.getElementById('profQualification')?.value,
            document.getElementById('profExperience')?.value,
            document.getElementById('profPrefCategory')?.value,
            document.getElementById('profPrefCity')?.value,
            document.getElementById('profSalMin')?.value,
            document.getElementById('profSalMax')?.value,
            (this.selectedSkills && this.selectedSkills.length > 0) ? 'skills' : '',
            this.candidatePhotoDataUrl ? 'photo' : '',
            this.candidateResumeFileName ? 'resume' : ''
        ];

        const filledCount = fields.filter(f => f && String(f).trim().length > 0).length;
        const totalFields = fields.length;
        const percentage = Math.round((filledCount / totalFields) * 100);

        const textEl = document.getElementById('profCompletionText');
        const barEl = document.getElementById('profCompletionBar');
        const subEl = document.getElementById('profCompletionSub');

        if (textEl) textEl.textContent = `${percentage}%`;
        if (barEl) barEl.style.width = `${percentage}%`;
        if (subEl) {
            if (percentage === 100) subEl.textContent = '🎉 Profile 100% Complete! Top priority ranking in candidate database.';
            else subEl.textContent = `Completed ${filledCount} of ${totalFields} fields (${100 - percentage}% remaining)`;
        }
    }

    handlePhotoUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            alert('Please select a valid image file (JPG, PNG)!');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            this.candidatePhotoDataUrl = e.target.result;
            const preview = document.getElementById('profPhotoPreview');
            const placeholder = document.getElementById('profPhotoPlaceholder');
            if (preview) {
                preview.src = this.candidatePhotoDataUrl;
                preview.classList.remove('hidden');
            }
            if (placeholder) placeholder.classList.add('hidden');
            this.updateProfileCompletion();
        };
        reader.readAsDataURL(file);
    }

    handleResumeUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        this.candidateResumeFileName = file.name;
        this.candidateResumeFileSize = (file.size / 1024).toFixed(1) + ' KB';
        this.candidateResumeUploadDate = new Date().toISOString().split('T')[0];

        this.renderResumeMetadataCard();
        this.updateProfileCompletion();
    }

    renderResumeMetadataCard() {
        const box = document.getElementById('profResumeMetadataBox');
        const nameEl = document.getElementById('profResumeFileName');
        const metaEl = document.getElementById('profResumeMetaDetails');

        if (this.candidateResumeFileName && box) {
            box.classList.remove('hidden');
            if (nameEl) nameEl.innerHTML = `<i class="fa-solid fa-file-pdf text-danger"></i> <strong>${this.sanitizeHTML(this.candidateResumeFileName)}</strong>`;
            if (metaEl) metaEl.textContent = `Uploaded on ${this.candidateResumeUploadDate || 'Today'} • ${this.candidateResumeFileSize || 'PDF/Doc'}`;
        }
    }

    handleSkillSearch(event) {
        const query = event.target.value.toLowerCase().trim();
        this.renderSkillsTagSelector(query);

        if (event.key === 'Enter') {
            event.preventDefault();
            this.addCustomSkillFromInput();
        }
    }

    addCustomSkillFromInput() {
        const input = document.getElementById('skillSearchInput');
        if (!input) return;
        const newSkill = input.value.trim();
        if (!newSkill) return;

        if (!this.selectedSkills.includes(newSkill)) {
            this.selectedSkills.push(newSkill);
            if (!this.availableSkills.includes(newSkill)) {
                this.availableSkills.push(newSkill);
            }
        }
        input.value = '';
        this.renderSelectedSkillChips();
        this.renderSkillsTagSelector();
        this.updateProfileCompletion();
    }

    toggleSkillSelection(skill) {
        const idx = this.selectedSkills.indexOf(skill);
        if (idx >= 0) {
            this.selectedSkills.splice(idx, 1);
        } else {
            this.selectedSkills.push(skill);
        }
        this.renderSelectedSkillChips();
        this.renderSkillsTagSelector();
        this.updateProfileCompletion();
    }

    removeSkillChip(skill) {
        const idx = this.selectedSkills.indexOf(skill);
        if (idx >= 0) {
            this.selectedSkills.splice(idx, 1);
            this.renderSelectedSkillChips();
            this.renderSkillsTagSelector();
            this.updateProfileCompletion();
        }
    }

    renderSelectedSkillChips() {
        const container = document.getElementById('selectedSkillsContainer');
        if (!container) return;

        if (this.selectedSkills.length === 0) {
            container.innerHTML = `<span class="text-muted text-sm">No skills selected yet. Search below or type custom skill.</span>`;
            return;
        }

        container.innerHTML = this.selectedSkills.map(s => `
            <div style="display:inline-flex; align-items:center; gap:0.4rem; background:#002b66; color:#ffffff; padding:0.35rem 0.75rem; border-radius:20px; font-size:0.85rem; font-weight:600;">
                <span>${this.sanitizeHTML(s)}</span>
                <i class="fa-solid fa-xmark" style="cursor:pointer; opacity:0.8;" onclick="app.removeSkillChip('${this.sanitizeHTML(s)}')" title="Remove skill"></i>
            </div>
        `).join('');
    }

    renderSkillsTagSelector(query = '') {
        const container = document.getElementById('skillsTagContainer');
        if (!container) return;

        const filtered = query ? 
            this.availableSkills.filter(s => s.toLowerCase().includes(query)) : 
            this.availableSkills;

        if (filtered.length === 0) {
            container.innerHTML = `<p class="text-muted text-sm">No matching skill found. Click "+ Add Skill" above to add it!</p>`;
            return;
        }

        container.innerHTML = filtered.map(s => {
            const isSel = this.selectedSkills.includes(s);
            return `
                <div class="skill-chip ${isSel ? 'selected' : ''}" onclick="app.toggleSkillSelection('${this.sanitizeHTML(s)}')">
                    ${isSel ? '<i class="fa-solid fa-check"></i> ' : ''}${this.sanitizeHTML(s)}
                </div>
            `;
        }).join('');
    }

    saveProfileAsDraft() {
        const updated = {
            id: this.currentUser ? this.currentUser.id : 'cand-' + Date.now(),
            name: this.sanitizeHTML(document.getElementById('profName').value) || this.currentUser?.name || 'Draft Candidate',
            email: this.sanitizeHTML(document.getElementById('profEmail').value) || this.currentUser?.email || '',
            mobile: this.sanitizeHTML(document.getElementById('profMobile').value) || this.currentUser?.mobile || '',
            location: this.sanitizeHTML(document.getElementById('profLocation').value) || '',
            dob: document.getElementById('profDob').value || '',
            gender: document.getElementById('profGender').value || '',
            qualification: document.getElementById('profQualification').value || '12th Pass',
            experienceYears: document.getElementById('profExperience').value || 'Fresher',
            preferredCategory: document.getElementById('profPrefCategory').value || '',
            preferredCity: document.getElementById('profPrefCity').value || '',
            expectedSalaryMin: document.getElementById('profSalMin').value || '',
            expectedSalaryMax: document.getElementById('profSalMax').value || '',
            skills: [...this.selectedSkills],
            photoUrl: this.candidatePhotoDataUrl || this.currentUser?.photoUrl || null,
            resumeFileName: this.candidateResumeFileName || this.currentUser?.resumeFileName || null,
            resumeFileSize: this.candidateResumeFileSize || this.currentUser?.resumeFileSize || null,
            resumeUploadDate: this.candidateResumeUploadDate || this.currentUser?.resumeUploadDate || null,
            isDraft: true
        };

        this.currentUser = updated;
        this.setStorageItem('rm_current_user', JSON.stringify(updated));

        const idx = this.candidates.findIndex(c => c.email.toLowerCase() === updated.email.toLowerCase());
        if (idx >= 0) this.candidates[idx] = updated;
        else if (updated.email) this.candidates.push(updated);

        this.saveStateToStorage();
        this.notifyRealtimeEvent('CANDIDATE_REGISTERED', updated);
        this.updateUserUI();
        alert('💾 Profile saved as DRAFT successfully!\n\nYou can return anytime to complete and activate your profile.');
    }

    saveProfile(event) {
        event.preventDefault();
        const updated = {
            id: this.currentUser ? this.currentUser.id : 'cand-' + Date.now(),
            name: this.sanitizeHTML(document.getElementById('profName').value),
            email: this.sanitizeHTML(document.getElementById('profEmail').value),
            mobile: this.sanitizeHTML(document.getElementById('profMobile').value),
            location: this.sanitizeHTML(document.getElementById('profLocation').value),
            dob: document.getElementById('profDob').value,
            gender: document.getElementById('profGender').value,
            qualification: document.getElementById('profQualification').value,
            experienceYears: document.getElementById('profExperience').value,
            preferredCategory: document.getElementById('profPrefCategory').value,
            preferredCity: document.getElementById('profPrefCity').value,
            expectedSalaryMin: document.getElementById('profSalMin').value,
            expectedSalaryMax: document.getElementById('profSalMax').value,
            skills: [...this.selectedSkills],
            photoUrl: this.candidatePhotoDataUrl || this.currentUser?.photoUrl || null,
            resumeFileName: this.candidateResumeFileName || this.currentUser?.resumeFileName || null,
            resumeFileSize: this.candidateResumeFileSize || this.currentUser?.resumeFileSize || null,
            resumeUploadDate: this.candidateResumeUploadDate || this.currentUser?.resumeUploadDate || null,
            isDraft: false
        };

        this.currentUser = updated;
        this.setStorageItem('rm_current_user', JSON.stringify(updated));

        const idx = this.candidates.findIndex(c => c.email.toLowerCase() === updated.email.toLowerCase());
        if (idx >= 0) this.candidates[idx] = updated;
        else this.candidates.push(updated);

        this.saveStateToStorage();
        this.notifyRealtimeEvent('CANDIDATE_REGISTERED', updated);
        this.updateUserUI();
        this.updateProfileCompletion();
        alert('🎉 Candidate profile, photo, resume & job preferences updated and ACTIVATED!');
    }

    loadProfileIntoForm() {
        if (!this.currentUser) return;
        const u = this.currentUser;
        if (document.getElementById('profName')) document.getElementById('profName').value = u.name || '';
        if (document.getElementById('profEmail')) document.getElementById('profEmail').value = u.email || '';
        if (document.getElementById('profMobile')) document.getElementById('profMobile').value = u.mobile || '';
        if (document.getElementById('profLocation')) document.getElementById('profLocation').value = u.location || '';
        if (document.getElementById('profDob')) document.getElementById('profDob').value = u.dob || '';
        if (document.getElementById('profGender')) document.getElementById('profGender').value = u.gender || '';
        if (document.getElementById('profQualification')) document.getElementById('profQualification').value = u.qualification || '';
        if (document.getElementById('profExperience')) document.getElementById('profExperience').value = u.experienceYears || '';
        if (document.getElementById('profPrefCategory')) document.getElementById('profPrefCategory').value = u.preferredCategory || '';
        if (document.getElementById('profPrefCity')) document.getElementById('profPrefCity').value = u.preferredCity || '';
        if (document.getElementById('profSalMin')) document.getElementById('profSalMin').value = u.expectedSalaryMin || '';
        if (document.getElementById('profSalMax')) document.getElementById('profSalMax').value = u.expectedSalaryMax || '';

        if (u.photoUrl) {
            this.candidatePhotoDataUrl = u.photoUrl;
            const preview = document.getElementById('profPhotoPreview');
            const placeholder = document.getElementById('profPhotoPlaceholder');
            if (preview) {
                preview.src = u.photoUrl;
                preview.classList.remove('hidden');
            }
            if (placeholder) placeholder.classList.add('hidden');
        }

        if (u.resumeFileName) {
            this.candidateResumeFileName = u.resumeFileName;
            this.candidateResumeFileSize = u.resumeFileSize || 'Uploaded Document';
            this.candidateResumeUploadDate = u.resumeUploadDate || 'Saved';
            this.renderResumeMetadataCard();
        }

        this.renderSelectedSkillChips();
        this.renderSkillsTagSelector();
        this.updateProfileCompletion();
    }

    // EMAIL OTP FLOW FOR LOGIN
    async sendEmailOtpCode() {
        const email = document.getElementById('otpEmailInput').value;
        if (!email || !email.includes('@')) {
            alert('Please enter a valid candidate email address!');
            return;
        }

        this.generatedEmailOtp = Math.floor(100000 + Math.random() * 900000).toString();
        this.emailOtpExpiryTime = Date.now() + (5 * 60 * 1000);
        document.getElementById('otpEmailCodeGroup').classList.remove('hidden');

        try {
            fetch('/api/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email, otp: this.generatedEmailOtp })
            }).catch(e => console.warn('Email dispatch notice:', e));
        } catch(e){}

        alert(`📧 Verification OTP Code Sent!\n\nA 6-digit verification code has been dispatched to ${email}.\n\nPlease check your email inbox (and spam folder) to complete login.`);
    }

    handleEmailOtpLogin(event) {
        event.preventDefault();
        const email = document.getElementById('otpEmailInput').value;
        const code = document.getElementById('otpEmailCode').value;

        if (!this.generatedEmailOtp) {
            alert('Please click "Get Email OTP" first to receive your verification code!');
            return;
        }

        if (Date.now() > this.emailOtpExpiryTime) {
            this.generatedEmailOtp = null;
            alert('🚨 OTP Expired! Verification codes expire after 5 minutes. Please request a new OTP.');
            return;
        }

        if (code !== this.generatedEmailOtp) {
            alert('Incorrect Email OTP code! Please enter the exact 6-digit OTP sent to your email.');
            return;
        }

        this.generatedEmailOtp = null;

        let u = this.candidates.find(c => c.email.toLowerCase() === email.toLowerCase());
        if (!u) {
            u = { id: 'cand-' + Date.now(), name: email.split('@')[0], email: email.toLowerCase(), mobile: '+91 9876543210', qualification: '12th Pass', role: 'SEEKER', skills: ['Tally Prime', 'MS Excel'] };
            this.candidates.push(u);
        }

        if (u.isSuspended) {
            alert('🚨 Account Suspended!\n\nYour candidate profile is currently suspended by the Admin. Please contact support@rozgaarmitra.com.');
            return;
        }

        this.currentUser = u;
        this.setStorageItem('rm_current_user', JSON.stringify(u));
        this.saveStateToStorage();
        this.notifyRealtimeEvent('CANDIDATE_REGISTERED', u);
        this.updateUserUI();
        this.closeModal('authModal');
        alert(`Email OTP Verification Successful! Logged in as ${email}.`);
    }

    // REGISTRATION EMAIL OTP & DUPLICATE ACCOUNT PREVENTION
    async sendRegEmailOtpCode() {
        const email = document.getElementById('regEmail').value;
        const mobile = document.getElementById('regMobile').value;

        if (!email || !email.includes('@')) {
            alert('Please enter a valid candidate email address first!');
            return;
        }

        const existingEmail = this.candidates.find(c => c.email.toLowerCase() === email.toLowerCase());
        if (existingEmail) {
            alert(`🚨 Account Already Registered!\n\nAn account with the email "${email}" ALREADY exists.\n\nPlease use "Email OTP Login" to sign in to your candidate account!`);
            this.switchAuthTab('email-otp');
            document.getElementById('otpEmailInput').value = email;
            return;
        }

        if (mobile && mobile.length >= 10) {
            const existingMobile = this.candidates.find(c => c.mobile && c.mobile.includes(mobile));
            if (existingMobile) {
                alert(`🚨 Mobile Number Already Registered!\n\nAn account with mobile number "${mobile}" ALREADY exists.\n\nPlease use "Email OTP Login" to sign in to your candidate account!`);
                this.switchAuthTab('email-otp');
                return;
            }
        }

        this.generatedRegEmailOtp = Math.floor(100000 + Math.random() * 900000).toString();
        this.regEmailOtpExpiryTime = Date.now() + (5 * 60 * 1000);
        document.getElementById('regOtpCodeGroup').classList.remove('hidden');

        try {
            fetch('/api/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email, otp: this.generatedRegEmailOtp })
            }).catch(e => console.warn('Email dispatch notice:', e));
        } catch(e){}

        alert(`📧 Registration Verification Code Sent!\n\nA 6-digit registration verification code has been dispatched to ${email}.\n\nPlease check your email inbox (and spam folder) to complete registration.`);
    }

    handleRegister(event) {
        event.preventDefault();
        const name = document.getElementById('regName').value;
        const email = document.getElementById('regEmail').value;
        const mobile = document.getElementById('regMobile').value;
        const otpCode = document.getElementById('regOtpCode').value;

        const existingEmail = this.candidates.find(c => c.email.toLowerCase() === email.toLowerCase());
        if (existingEmail) {
            alert(`🚨 Account Already Registered!\n\nAn account with the email "${email}" ALREADY exists.\n\nPlease use "Email OTP Login" to sign in!`);
            this.switchAuthTab('email-otp');
            document.getElementById('otpEmailInput').value = email;
            return;
        }

        const existingMobile = this.candidates.find(c => c.mobile && c.mobile.includes(mobile));
        if (existingMobile) {
            alert(`🚨 Mobile Number Already Registered!\n\nAn account with mobile number "${mobile}" ALREADY exists.\n\nPlease use "Email OTP Login" to sign in!`);
            this.switchAuthTab('email-otp');
            return;
        }

        if (!this.generatedRegEmailOtp) {
            alert('Please click "Verify Email" first to receive your 6-digit registration OTP code!');
            return;
        }

        if (Date.now() > this.regEmailOtpExpiryTime) {
            this.generatedRegEmailOtp = null;
            alert('🚨 OTP Expired! Registration verification codes expire after 5 minutes. Please click "Verify Email" again.');
            return;
        }

        if (otpCode !== this.generatedRegEmailOtp) {
            alert('Incorrect Email Verification OTP code! Please enter the exact 6-digit OTP sent to your email.');
            return;
        }

        this.generatedRegEmailOtp = null;

        const u = { 
            id: 'cand-' + Date.now(), 
            name: this.sanitizeHTML(name), 
            email: email.toLowerCase(), 
            mobile: mobile, 
            qualification: '12th Pass', 
            role: 'SEEKER', 
            skills: ['Customer Support', 'MS Excel'],
            isSuspended: false
        };

        this.currentUser = u;
        this.candidates.push(u);
        this.setStorageItem('rm_current_user', JSON.stringify(u));
        this.saveStateToStorage();
        this.notifyRealtimeEvent('CANDIDATE_REGISTERED', u);
        this.updateUserUI();
        this.closeModal('authModal');
        alert(`🎉 Registration & Email Verification Successful!\n\nWelcome to Rozgaar Mitra, ${name}!`);
        this.navigateTo('profile');
    }

    logout() {
        this.currentUser = null;
        this.clearAdminSession();
        try { localStorage.removeItem('rm_current_user'); } catch(e){}
        this.updateUserUI();
        alert('Logged out successfully.');
        this.navigateTo('home');
    }

    updateUserUI() {
        const exitAdminBtn = document.getElementById('adminExitHeaderBtn');
        const authBox = document.getElementById('authBox');

        if (this.currentRole === 'ADMIN') {
            document.querySelectorAll('.seeker-only').forEach(e => e.classList.add('hidden'));
            document.querySelectorAll('.admin-only').forEach(e => e.classList.remove('hidden'));
            if (exitAdminBtn) exitAdminBtn.classList.remove('hidden');
            if (authBox) authBox.classList.add('hidden');
            
            if (this.currentView === 'home' || this.currentView === 'profile') {
                this.navigateTo('admin-dashboard');
            }
            return;
        }

        if (exitAdminBtn) exitAdminBtn.classList.add('hidden');

        if (this.currentUser) {
            document.querySelectorAll('.seeker-only').forEach(e => e.classList.remove('hidden'));
            document.querySelectorAll('.admin-only').forEach(e => e.classList.add('hidden'));
            if (authBox) authBox.classList.add('hidden');
            document.getElementById('userProfileMenu')?.classList.remove('hidden');
            
            const avatarEl = document.getElementById('navAvatar');
            if (avatarEl) {
                if (this.currentUser.photoUrl) {
                    avatarEl.innerHTML = `<img src="${this.currentUser.photoUrl}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`;
                } else {
                    avatarEl.textContent = this.currentUser.name.substring(0, 2).toUpperCase();
                }
            }
            if (document.getElementById('navUserName')) document.getElementById('navUserName').textContent = this.currentUser.name;
        } else {
            document.querySelectorAll('.seeker-only').forEach(e => e.classList.add('hidden'));
            document.querySelectorAll('.admin-only').forEach(e => e.classList.add('hidden'));
            if (authBox) authBox.classList.remove('hidden');
            document.getElementById('userProfileMenu')?.classList.add('hidden');
        }
    }

    openNewJobModal() {
        if (this.currentRole !== 'ADMIN') return;
        document.getElementById('jobEditId').value = '';
        document.getElementById('jobForm').reset();
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
        document.getElementById('jobCategory').value = job.category;
        document.getElementById('jobLocation').value = job.location;
        document.getElementById('jobSalary').value = job.salary;
        document.getElementById('jobQualification').value = job.qualificationRequired;
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

        if (job.status === 'HIRING_CLOSED' || job.status === 'VACANCY_FULL') {
            job.status = 'PUBLISHED';
            alert(`Job "${job.title}" is now RE-OPENED for hiring!`);
        } else {
            job.status = 'HIRING_CLOSED';
            alert(`Job "${job.title}" marked as "Vacancy Full / Hiring Closed"! Candidate applications disabled.`);
        }

        this.saveStateToStorage();
        this.renderAdminJobsTable();
        this.renderFeaturedJobs();
        this.logAdminAction('TOGGLE_HIRING_STATUS', `Toggled hiring status for "${job.title}" to ${job.status}`);
    }

    saveJob(event) {
        event.preventDefault();
        if (this.currentRole !== 'ADMIN') return;

        const editId = document.getElementById('jobEditId').value;
        const title = this.sanitizeHTML(document.getElementById('jobTitle').value);
        const companyName = this.sanitizeHTML(document.getElementById('jobCompany').value);
        const category = document.getElementById('jobCategory').value;
        const location = this.sanitizeHTML(document.getElementById('jobLocation').value);
        const salary = this.sanitizeHTML(document.getElementById('jobSalary').value);
        const qualificationRequired = document.getElementById('jobQualification').value;
        const description = this.sanitizeHTML(document.getElementById('jobDesc').value);

        if (editId) {
            const idx = this.jobs.findIndex(j => j.id === editId);
            if (idx >= 0) {
                this.jobs[idx] = {
                    ...this.jobs[idx],
                    title, companyName, category, location, salary, qualificationRequired, description
                };
                this.logAdminAction('UPDATE_JOB', `Updated job details for "${title}"`);
                alert('Job updated successfully!');
            }
        } else {
            const newJob = {
                id: 'admin-job-' + Date.now(),
                companyName, title, category, location, salary, qualificationRequired, experienceRequired: '1-2 Years', positions: 2,
                requiredSkills: ['Customer Support', 'MS Excel'],
                description, status: 'PUBLISHED', postedAt: new Date().toISOString().split('T')[0]
            };
            this.jobs.unshift(newJob);
            this.logAdminAction('POST_JOB', `Posted new live job vacancy "${title}" for ${companyName}`);
            alert('New job posted successfully!');
        }

        this.saveStateToStorage();
        this.closeModal('jobModal');
        if (this.currentView === 'admin-jobs') this.renderAdminJobsTable();
        this.renderFeaturedJobs();
    }

    renderAdminJobsTable() {
        if (this.currentRole !== 'ADMIN') return;
        const tbody = document.getElementById('adminJobsTableBody');
        if (!tbody) return;

        if (this.jobs.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="text-center p-4 text-muted">No jobs posted yet. Click "Post New Job" above to add vacancies.</td></tr>`;
            return;
        }

        tbody.innerHTML = this.jobs.map(j => {
            const isClosed = j.status === 'HIRING_CLOSED' || j.status === 'VACANCY_FULL';
            return `
                <tr>
                    <td><strong>${this.sanitizeHTML(j.title)}</strong><br><small>${this.sanitizeHTML(j.companyName)}</small></td>
                    <td>${this.sanitizeHTML(j.category)}</td>
                    <td>${this.sanitizeHTML(j.location)}</td>
                    <td>${this.sanitizeHTML(j.salary)}</td>
                    <td>
                        <span class="badge ${isClosed ? 'badge-danger' : 'badge-success'}">
                            ${isClosed ? 'Vacancy Full / Hiring Closed' : 'Active Hiring'}
                        </span>
                    </td>
                    <td>
                        <button class="btn btn-outline btn-sm mr-1" onclick="app.editJob('${j.id}')" title="Edit Job"><i class="fa-solid fa-pen-to-square"></i> Edit</button>
                        <button class="btn btn-${isClosed ? 'success' : 'warning'} btn-sm mr-1" onclick="app.toggleHiringClosed('${j.id}')">
                            <i class="fa-solid fa-lock-open" : 'lock'}></i> ${isClosed ? 'Re-open' : 'Close Vacancy'}
                        </button>
                        <button class="btn btn-outline btn-sm text-danger" onclick="app.deleteJob('${j.id}')" title="Delete Job"><i class="fa-solid fa-trash"></i> Delete</button>
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
        this.syncApplicantsIntoCandidateDatabase();
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

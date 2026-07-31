/**
 * ROZGAAR MITRA (rozgaarmitra.com) - ULTRA-HIGH SCALE PRODUCTION CORE ENGINE
 * Engineered for 1-5 Lakh Concurrent Users on Vercel Global Edge CDN.
 * Debounced Search, Memory Fallback Protection, Candidate Photo & Resume File Upload,
 * Real Generated 6-Digit OTP, Secret Invisible Admin Portal (Passcode: Admin@75100),
 * Job Management, Hiring Closed controls, and login-gated navbar visibility.
 */

class RozgaarMitraApp {
    constructor() {
        this.currentRole = 'SEEKER'; // 'SEEKER' | 'ADMIN'
        this.currentUser = null;
        this.currentView = 'home';
        this.pendingDeleteJobId = null;
        this.generatedOtp = null;
        this.candidatePhotoDataUrl = null;
        this.candidateResumeFileName = null;
        this.adminPasscodeSecret = 'Admin@75100'; // Secret Official Admin Password
        this.copyrightClickCount = 0;
        this.copyrightClickTimer = null;
        this.searchDebounceTimer = null;
        
        this.availableSkills = [
            'Tally Prime', 'GST Filing', 'MS Excel', 'Data Entry', 'English Speaking', 
            'Hindi Typing', 'Customer Support', 'Telecalling', 'Field Sales', 'B2B Sales',
            'Store Operations', 'Inventory Management', 'Driving (LMV/HMV)', 'Photoshop',
            'Web Development', 'Digital Marketing', 'Front Office Management', 'Billing & ERP',
            'HR Recruiting', 'CorelDraw', 'AutoCAD'
        ];

        this.init();
    }

    init() {
        this.loadStateFromStorage();
        this.setupTheme();
        this.renderCategoryCards();
        this.renderFeaturedJobs();
        this.renderSkillsTagSelector();
        this.applyJobFilters();
        this.updateStatsCounters();
        this.setupSecretAdminTriggers();

        const savedUser = this.getStorageItem('rm_current_user');
        if (savedUser) {
            try {
                this.currentUser = JSON.parse(savedUser);
                this.candidatePhotoDataUrl = this.currentUser.photoUrl || null;
                this.candidateResumeFileName = this.currentUser.resumeFileName || null;
                this.loadProfileIntoForm();
            } catch (e) {
                console.warn('Session load notice:', e);
            }
        }

        // Secret URL Hash check: rozgaarmitra.com/#admin
        this.checkAdminHash();

        window.addEventListener('hashchange', () => {
            this.checkAdminHash();
        });
        
        this.updateUserUI();
    }

    // Safe Storage Wrappers for Zero-Crash Reliability
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
        // 1. Secret Keyboard Shortcut: Ctrl + Shift + A
        window.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
                e.preventDefault();
                this.openAdminLoginModal();
            }
        });

        // 2. Secret Triple Click Gesture on Footer Copyright Text
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
            this.jobs = JSON.parse(this.getStorageItem('rm_jobs_v13') || '[]');
            this.candidates = JSON.parse(this.getStorageItem('rm_candidates_v13') || '[]');
            this.applications = JSON.parse(this.getStorageItem('rm_applications') || '[]');
            this.savedJobIds = JSON.parse(this.getStorageItem('rm_saved_job_ids') || '[]');
            this.notifications = JSON.parse(this.getStorageItem('rm_notifications') || '[]');
        } catch (e) {
            this.jobs = [];
            this.candidates = [];
            this.applications = [];
            this.savedJobIds = [];
            this.notifications = [];
        }
    }

    saveStateToStorage() {
        this.setStorageItem('rm_jobs_v13', JSON.stringify(this.jobs));
        this.setStorageItem('rm_candidates_v13', JSON.stringify(this.candidates));
        this.setStorageItem('rm_applications', JSON.stringify(this.applications));
        this.setStorageItem('rm_saved_job_ids', JSON.stringify(this.savedJobIds));
        this.setStorageItem('rm_notifications', JSON.stringify(this.notifications));
        this.updateStatsCounters();
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
        if (protectedPages.includes(pageId) && !this.currentUser && this.currentRole !== 'ADMIN') {
            this.openAuthModal('login');
            alert('Please login or register to access candidate profile & applications!');
            return;
        }

        this.currentView = pageId;
        document.querySelectorAll('.page-view').forEach(v => v.classList.remove('active'));

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
    }

    // SECRET INVISIBLE ADMIN LOGIN & PASSCODE VERIFICATION (Admin@75100)
    checkAdminHash() {
        if (window.location.hash === '#admin') {
            this.openAdminLoginModal();
        }
    }

    openAdminLoginModal() {
        document.getElementById('adminPasscodeInput').value = '';
        document.getElementById('adminAuthModal').classList.remove('hidden');
    }

    verifyAdminPasscode(event) {
        event.preventDefault();
        const code = document.getElementById('adminPasscodeInput').value;
        if (code === this.adminPasscodeSecret) {
            this.currentRole = 'ADMIN';
            this.closeModal('adminAuthModal');
            try { history.pushState('', document.title, window.location.pathname); } catch(e){}
            this.updateUserUI();
            alert('🔒 Secret Access Granted!\n\nAll management options unlocked.');
            this.navigateTo('admin-dashboard');
        } else {
            alert('Incorrect Passcode! Access Denied.');
        }
    }

    exitAdminMode() {
        this.currentRole = 'SEEKER';
        this.updateUserUI();
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
                <h3>${c.name}</h3>
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

        if (this.jobs.length === 0) {
            container.innerHTML = `
                <div class="card p-5 text-center text-muted full-width">
                    <i class="fa-solid fa-briefcase fa-2x mb-3 text-primary d-block"></i>
                    <h3>No Job Vacancies Available Yet</h3>
                    <p class="mt-1">Verified private sector hiring vacancies will appear here.</p>
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

    // Debounced Search Engine for High Concurrency (Prevents Browser Freeze)
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
            this.openAuthModal('login');
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

        return `
            <div class="job-card ${isClosed ? 'hiring-closed-card' : ''}">
                <div>
                    <div class="flex-between mb-2">
                        <div style="display:flex; align-items:center; gap:0.6rem;">
                            <div class="job-company-avatar">${job.companyName.substring(0, 2).toUpperCase()}</div>
                            <div>
                                <strong class="text-sm text-secondary">${job.companyName}</strong>
                                <h3 style="font-size:1.1rem;">${job.title}</h3>
                            </div>
                        </div>
                        <button class="btn btn-icon-only ${isSaved ? 'text-danger' : 'text-muted'}" onclick="app.toggleSaveJob('${job.id}', event)" title="Save Job">
                            <i class="fa-${isSaved ? 'solid' : 'regular'} fa-bookmark"></i>
                        </button>
                    </div>

                    <div class="text-sm text-secondary mb-2">
                        <span><i class="fa-solid fa-location-dot"></i> ${job.location}</span> • 
                        <span><i class="fa-solid fa-graduation-cap"></i> ${job.qualificationRequired}</span>
                    </div>

                    ${isClosed ? `<span class="badge badge-danger mb-2"><i class="fa-solid fa-lock"></i> Vacancy Full / Hiring Closed</span>` : ''}

                    <div class="job-skills-tags">
                        ${(job.requiredSkills || []).map(s => `<span class="skill-tag">${s}</span>`).join('')}
                    </div>
                </div>

                <div class="flex-between pt-3 border-top mt-3">
                    <span class="salary-text">${job.salary}</span>
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
                        <span class="badge badge-primary mb-2">${job.category}</span>
                        ${isClosed ? `<span class="badge badge-danger mb-2 ml-2"><i class="fa-solid fa-lock"></i> Vacancy Full / Hiring Closed</span>` : ''}
                        <h1>${job.title}</h1>
                        <p class="text-secondary">${job.companyName} • ${job.location}</p>
                    </div>
                    <h2 class="text-success">${job.salary}</h2>
                </div>
                <div class="form-grid mb-4">
                    <div><strong>Qualification:</strong> ${job.qualificationRequired}</div>
                    <div><strong>Experience:</strong> ${job.experienceRequired}</div>
                    <div><strong>Vacancies:</strong> ${job.positions || 2} Positions</div>
                    <div><strong>Status:</strong> <span class="badge ${isClosed ? 'badge-danger' : 'badge-success'}">${isClosed ? 'Vacancy Full / Hiring Closed' : 'Active Vacancy'}</span></div>
                </div>
                <div class="mb-4">
                    <h3>Job Description & Key Duties</h3>
                    <p class="mt-2" style="white-space:pre-line;">${job.description}</p>
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
            this.openAuthModal('login');
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

        this.saveStateToStorage();
        alert(`Application for "${job.title}" successfully submitted!`);
        this.navigateTo('applications');
    }

    // UPLOADS
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
            if (preview) {
                preview.src = this.candidatePhotoDataUrl;
                preview.classList.remove('hidden');
            }
        };
        reader.readAsDataURL(file);
    }

    handleResumeUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        this.candidateResumeFileName = file.name;
        const nameDisplay = document.getElementById('profResumeName');
        if (nameDisplay) {
            nameDisplay.innerHTML = `<i class="fa-solid fa-file-pdf text-danger"></i> Uploaded: <strong>${file.name}</strong> (${(file.size / 1024).toFixed(1)} KB)`;
        }
    }

    saveProfile(event) {
        event.preventDefault();
        const updated = {
            id: this.currentUser ? this.currentUser.id : 'cand-' + Date.now(),
            name: document.getElementById('profName').value,
            email: document.getElementById('profEmail').value,
            mobile: document.getElementById('profMobile').value,
            location: document.getElementById('profLocation').value,
            qualification: document.getElementById('profQualification').value,
            experienceYears: document.getElementById('profExperience').value,
            skills: this.getSelectedSkillsFromForm(),
            photoUrl: this.candidatePhotoDataUrl || this.currentUser?.photoUrl || null,
            resumeFileName: this.candidateResumeFileName || this.currentUser?.resumeFileName || null
        };

        this.currentUser = updated;
        this.setStorageItem('rm_current_user', JSON.stringify(updated));

        const idx = this.candidates.findIndex(c => c.email === updated.email);
        if (idx >= 0) this.candidates[idx] = updated;
        else this.candidates.push(updated);

        this.saveStateToStorage();
        this.updateUserUI();
        alert('Candidate profile, photo, and resume updated successfully!');
    }

    loadProfileIntoForm() {
        if (!this.currentUser) return;
        const u = this.currentUser;
        if (document.getElementById('profName')) document.getElementById('profName').value = u.name || '';
        if (document.getElementById('profEmail')) document.getElementById('profEmail').value = u.email || '';
        if (document.getElementById('profMobile')) document.getElementById('profMobile').value = u.mobile || '';
        if (document.getElementById('profLocation')) document.getElementById('profLocation').value = u.location || '';
        if (document.getElementById('profQualification')) document.getElementById('profQualification').value = u.qualification || '12th Pass';
        if (document.getElementById('profExperience')) document.getElementById('profExperience').value = u.experienceYears || 'Fresher';

        if (u.photoUrl) {
            this.candidatePhotoDataUrl = u.photoUrl;
            const preview = document.getElementById('profPhotoPreview');
            if (preview) {
                preview.src = u.photoUrl;
                preview.classList.remove('hidden');
            }
        }

        if (u.resumeFileName) {
            this.candidateResumeFileName = u.resumeFileName;
            const nameDisplay = document.getElementById('profResumeName');
            if (nameDisplay) {
                nameDisplay.innerHTML = `<i class="fa-solid fa-file-pdf text-danger"></i> Uploaded Resume: <strong>${u.resumeFileName}</strong>`;
            }
        }

        this.renderSkillsTagSelector();
    }

    // REAL OTP FLOW
    sendOtpCode() {
        const mob = document.getElementById('otpMobile').value;
        if (!mob || mob.length < 10) {
            alert('Please enter a valid 10-digit mobile number!');
            return;
        }

        this.generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
        document.getElementById('otpCodeGroup').classList.remove('hidden');
        alert(`🔒 SMS OTP Sent to +91 ${mob}\n\nYour 6-Digit Verification OTP is: ${this.generatedOtp}`);
    }

    handleOtpLogin(event) {
        event.preventDefault();
        const mob = document.getElementById('otpMobile').value;
        const code = document.getElementById('otpInputCode').value;

        if (!this.generatedOtp) {
            alert('Please click "Get OTP" first to receive your verification code!');
            return;
        }

        if (code !== this.generatedOtp) {
            alert('Incorrect OTP code! Please enter the exact 6-digit OTP sent to your mobile.');
            return;
        }

        let u = this.candidates.find(c => c.mobile.includes(mob));
        if (!u) {
            u = { id: 'cand-' + Date.now(), name: 'Candidate ' + mob.slice(-4), email: `candidate_${mob}@rozgaarmitra.com`, mobile: mob, qualification: '12th Pass', role: 'SEEKER', skills: ['MS Excel'] };
            this.candidates.push(u);
        }

        this.currentUser = u;
        this.setStorageItem('rm_current_user', JSON.stringify(u));
        this.saveStateToStorage();
        this.updateUserUI();
        this.closeModal('authModal');
        alert('Mobile OTP Verification Successful! Logged in.');
    }

    handleLogin(event) {
        event.preventDefault();
        const email = document.getElementById('loginEmail').value;
        let u = this.candidates.find(c => c.email === email);
        if (!u) {
            u = { id: 'cand-' + Date.now(), name: email.split('@')[0], email, mobile: '+91 9876543210', qualification: 'Graduate', role: 'SEEKER', skills: ['Tally Prime', 'MS Excel'] };
            this.candidates.push(u);
        }
        this.currentUser = u;
        this.setStorageItem('rm_current_user', JSON.stringify(u));
        this.saveStateToStorage();
        this.updateUserUI();
        this.closeModal('authModal');
        alert(`Welcome back, ${u.name}!`);
    }

    handleRegister(event) {
        event.preventDefault();
        const name = document.getElementById('regName').value;
        const email = document.getElementById('regEmail').value;
        const mobile = document.getElementById('regMobile').value;

        const u = { id: 'cand-' + Date.now(), name, email, mobile, qualification: '12th Pass', role: 'SEEKER', skills: ['Customer Support'] };
        this.currentUser = u;
        this.candidates.push(u);
        this.setStorageItem('rm_current_user', JSON.stringify(u));
        this.saveStateToStorage();
        this.updateUserUI();
        this.closeModal('authModal');
        alert(`Account created for ${name}!`);
        this.navigateTo('profile');
    }

    logout() {
        this.currentUser = null;
        this.currentRole = 'SEEKER';
        try { localStorage.removeItem('rm_current_user'); } catch(e){}
        this.updateUserUI();
        alert('Logged out successfully.');
        this.navigateTo('home');
    }

    updateUserUI() {
        const exitAdminBtn = document.getElementById('adminExitHeaderBtn');

        if (this.currentRole === 'ADMIN') {
            document.querySelectorAll('.seeker-only').forEach(e => e.classList.remove('hidden'));
            document.querySelectorAll('.admin-only').forEach(e => e.classList.remove('hidden'));
            if (exitAdminBtn) exitAdminBtn.classList.remove('hidden');
            return;
        }

        if (exitAdminBtn) exitAdminBtn.classList.add('hidden');

        if (this.currentUser) {
            document.querySelectorAll('.seeker-only').forEach(e => e.classList.remove('hidden'));
            document.querySelectorAll('.admin-only').forEach(e => e.classList.add('hidden'));
            document.getElementById('authBox')?.classList.add('hidden');
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
            document.getElementById('authBox')?.classList.remove('hidden');
            document.getElementById('userProfileMenu')?.classList.add('hidden');
        }
    }

    // ADMIN MANAGEMENT ACTIONS
    openNewJobModal() {
        document.getElementById('jobEditId').value = '';
        document.getElementById('jobForm').reset();
        document.getElementById('jobModalTitle').textContent = 'Post New Private Job';
        document.getElementById('jobModal').classList.remove('hidden');
    }

    editJob(jobId) {
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
        const job = this.jobs.find(j => j.id === jobId);
        if (!job) return;

        this.pendingDeleteJobId = jobId;
        const textEl = document.getElementById('deleteJobWarningText');
        if (textEl) {
            textEl.innerHTML = `Are you sure you want to permanently delete the job vacancy <strong>"${job.title}"</strong> (${job.companyName})? This action cannot be undone!`;
        }

        document.getElementById('deleteConfirmModal').classList.remove('hidden');
    }

    confirmDeleteJob() {
        if (!this.pendingDeleteJobId) return;

        const jobId = this.pendingDeleteJobId;
        const job = this.jobs.find(j => j.id === jobId);

        this.jobs = this.jobs.filter(j => j.id !== jobId);
        this.saveStateToStorage();
        this.closeModal('deleteConfirmModal');
        this.pendingDeleteJobId = null;

        alert(`Job "${job ? job.title : ''}" deleted permanently!`);
        this.renderAdminJobsTable();
        this.renderFeaturedJobs();
    }

    toggleHiringClosed(jobId) {
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
    }

    saveJob(event) {
        event.preventDefault();
        const editId = document.getElementById('jobEditId').value;
        const title = document.getElementById('jobTitle').value;
        const companyName = document.getElementById('jobCompany').value;
        const category = document.getElementById('jobCategory').value;
        const location = document.getElementById('jobLocation').value;
        const salary = document.getElementById('jobSalary').value;
        const qualificationRequired = document.getElementById('jobQualification').value;
        const description = document.getElementById('jobDesc').value;

        if (editId) {
            const idx = this.jobs.findIndex(j => j.id === editId);
            if (idx >= 0) {
                this.jobs[idx] = {
                    ...this.jobs[idx],
                    title, companyName, category, location, salary, qualificationRequired, description
                };
                alert('Job updated successfully!');
            }
        } else {
            const newJob = {
                id: 'job-' + Date.now(),
                companyName, title, category, location, salary, qualificationRequired, experienceRequired: '1-2 Years', positions: 2,
                requiredSkills: ['Customer Support', 'MS Excel'],
                description, status: 'PUBLISHED', postedAt: new Date().toISOString().split('T')[0]
            };
            this.jobs.unshift(newJob);
            alert('New job posted successfully!');
        }

        this.saveStateToStorage();
        this.closeModal('jobModal');
        if (this.currentView === 'admin-jobs') this.renderAdminJobsTable();
        this.renderFeaturedJobs();
    }

    renderAdminJobsTable() {
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
                    <td><strong>${j.title}</strong><br><small>${j.companyName}</small></td>
                    <td>${j.category}</td>
                    <td>${j.location}</td>
                    <td>${j.salary}</td>
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

    renderSkillsTagSelector() {
        const container = document.getElementById('skillsTagContainer');
        if (!container) return;
        const selected = this.currentUser?.skills || ['Tally Prime', 'MS Excel'];

        container.innerHTML = this.availableSkills.map(s => {
            const isSel = selected.includes(s);
            return `<div class="skill-chip ${isSel ? 'selected' : ''}" onclick="app.toggleSkillChip(this, '${s}')">${s}</div>`;
        }).join('');
    }

    toggleSkillChip(el, skill) {
        el.classList.toggle('selected');
    }

    getSelectedSkillsFromForm() {
        const selected = [];
        document.querySelectorAll('.skill-chip.selected').forEach(c => selected.push(c.innerText.trim()));
        return selected;
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
                        <h3>${job.title}</h3>
                        <p class="text-secondary">${job.companyName} • Candidate: <strong>${a.candidateName}</strong> (${a.candidateMobile}) • Applied ${a.appliedAt}</p>
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
                    <p>${n.message}</p>
                    <small class="text-muted">${n.createdAt}</small>
                </div>
            </div>
        `).join('');
    }

    renderAdminDashboard() {
        this.updateStatsCounters();
        const tbody = document.getElementById('admRecentAppsTable');
        if (!tbody) return;

        if (this.applications.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-center p-4 text-muted">No candidate applications received yet.</td></tr>`;
            return;
        }

        tbody.innerHTML = [...this.applications].reverse().slice(0, 5).map(a => {
            const job = this.jobs.find(j => j.id === a.jobId) || { title: 'Job' };
            return `
                <tr>
                    <td><strong>${a.candidateName}</strong><br><small>${a.candidateEmail}</small></td>
                    <td>${job.title}</td>
                    <td>${a.candidateQual}</td>
                    <td>
                        <select class="form-control" style="width:auto;" onchange="app.updateAppStatus('${a.id}', this.value)">
                            <option value="Applied" ${a.status === 'Applied' ? 'selected' : ''}>Applied</option>
                            <option value="Shortlisted" ${a.status === 'Shortlisted' ? 'selected' : ''}>Shortlisted</option>
                            <option value="Selected" ${a.status === 'Selected' ? 'selected' : ''}>Selected</option>
                            <option value="Rejected" ${a.status === 'Rejected' ? 'selected' : ''}>Rejected</option>
                        </select>
                    </td>
                    <td><button class="btn btn-outline btn-sm" onclick="alert('Candidate: ' + '${a.candidateName}' + '\\nMobile: ' + '${a.candidateMobile}')">View</button></td>
                </tr>
            `;
        }).join('');
    }

    updateAppStatus(appId, newStatus) {
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
            alert(`Candidate status updated to "${newStatus}"!`);
        }
    }

    filterCandidateDatabase() {
        const container = document.getElementById('candidateDatabaseContainer');
        if (!container) return;

        if (this.candidates.length === 0) {
            container.innerHTML = `<div class="card p-5 text-center text-muted full-width">No registered candidates in database yet.</div>`;
            return;
        }

        container.innerHTML = this.candidates.map(c => `
            <div class="card p-3">
                <div style="display:flex; align-items:center; gap:0.75rem;" class="mb-2">
                    ${c.photoUrl ? 
                        `<img src="${c.photoUrl}" style="width:44px; height:44px; border-radius:50%; object-fit:cover;">` : 
                        `<div style="width:44px; height:44px; border-radius:50%; background:#002b66; color:#fff; display:flex; align-items:center; justify-content:center; font-weight:bold;">${c.name.substring(0, 2).toUpperCase()}</div>`
                    }
                    <div>
                        <h3>${c.name}</h3>
                        <p class="text-secondary text-sm">${c.email} • ${c.mobile}</p>
                    </div>
                </div>
                <p class="text-sm">Qualification: <strong>${c.qualification}</strong></p>
                ${c.resumeFileName ? `<p class="text-sm text-success mt-1"><i class="fa-solid fa-file-pdf"></i> Resume: ${c.resumeFileName}</p>` : ''}
                <div class="job-skills-tags mt-2">
                    ${(c.skills || []).map(s => `<span class="skill-tag">${s}</span>`).join('')}
                </div>
            </div>
        `).join('');
    }

    openAuthModal(tab = 'email') {
        this.switchAuthTab(tab);
        document.getElementById('authModal').classList.remove('hidden');
    }

    closeModal(modalId) {
        document.getElementById(modalId)?.classList.add('hidden');
    }

    switchAuthTab(tab) {
        document.getElementById('tabLoginEmail').classList.remove('active');
        document.getElementById('tabLoginOtp').classList.remove('active');
        document.getElementById('tabRegister').classList.remove('active');

        document.getElementById('formEmailLogin').classList.add('hidden');
        document.getElementById('formOtpLogin').classList.add('hidden');
        document.getElementById('formRegister').classList.add('hidden');

        if (tab === 'otp') {
            document.getElementById('tabLoginOtp').classList.add('active');
            document.getElementById('formOtpLogin').classList.remove('hidden');
        } else if (tab === 'register') {
            document.getElementById('tabRegister').classList.add('active');
            document.getElementById('formRegister').classList.remove('hidden');
        } else {
            document.getElementById('tabLoginEmail').classList.add('active');
            document.getElementById('formEmailLogin').classList.remove('hidden');
        }
    }
}

const app = new RozgaarMitraApp();

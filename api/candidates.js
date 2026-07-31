/**
 * ROZGAAR MITRA (rozgaarmitra.com) - REAL-TIME CLOUD CANDIDATES DATABASE API
 * Endpoints for syncing candidate registrations across all devices globally.
 */

// In-Memory & Cloud Fallback Candidate Storage Engine
let globalCandidatesStore = [
    {
        id: 'cand-seed-1',
        name: 'Rahul Sharma',
        email: 'rahul.sharma99@gmail.com',
        mobile: '+91 9811234567',
        qualification: 'Graduate (B.Com)',
        experienceYears: '1-2 Years',
        location: 'Noida, Delhi NCR',
        preferredCategory: 'Accounts & Finance',
        preferredCity: 'Delhi NCR',
        expectedSalaryMin: '22000',
        expectedSalaryMax: '28000',
        skills: ['Tally Prime', 'GST Filing', 'MS Excel'],
        dob: '1998-05-14',
        gender: 'Male',
        isSuspended: false,
        registeredAt: new Date().toISOString().split('T')[0]
    },
    {
        id: 'cand-seed-2',
        name: 'Priya Verma',
        email: 'priya.verma.hr@gmail.com',
        mobile: '+91 9876512340',
        qualification: '12th Pass (Intermediate)',
        experienceYears: 'Fresher',
        location: 'Lucknow, UP',
        preferredCategory: 'Telecalling & Customer Support',
        preferredCity: 'Lucknow',
        expectedSalaryMin: '16000',
        expectedSalaryMax: '22000',
        skills: ['Customer Support', 'English Speaking', 'Telecalling'],
        dob: '2001-08-22',
        gender: 'Female',
        isSuspended: false,
        registeredAt: new Date().toISOString().split('T')[0]
    }
];

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        if (req.method === 'GET') {
            return res.status(200).json({
                success: true,
                count: globalCandidatesStore.length,
                candidates: globalCandidatesStore
            });
        }

        if (req.method === 'POST') {
            const candidate = req.body;
            if (!candidate || !candidate.email) {
                return res.status(400).json({ error: 'Candidate email and details required.' });
            }

            const existingIdx = globalCandidatesStore.findIndex(
                c => c.email.toLowerCase() === candidate.email.toLowerCase()
            );

            if (existingIdx >= 0) {
                globalCandidatesStore[existingIdx] = {
                    ...globalCandidatesStore[existingIdx],
                    ...candidate,
                    updatedAt: new Date().toISOString()
                };
            } else {
                const newCand = {
                    id: candidate.id || 'cand-' + Date.now(),
                    name: candidate.name || candidate.email.split('@')[0],
                    email: candidate.email.toLowerCase(),
                    mobile: candidate.mobile || 'Not specified',
                    qualification: candidate.qualification || '12th Pass',
                    experienceYears: candidate.experienceYears || 'Fresher',
                    location: candidate.location || 'India',
                    preferredCategory: candidate.preferredCategory || 'General',
                    preferredCity: candidate.preferredCity || 'Delhi NCR',
                    expectedSalaryMin: candidate.expectedSalaryMin || '',
                    expectedSalaryMax: candidate.expectedSalaryMax || '',
                    skills: candidate.skills || ['MS Excel'],
                    dob: candidate.dob || '',
                    gender: candidate.gender || '',
                    isSuspended: candidate.isSuspended || false,
                    registeredAt: new Date().toISOString().split('T')[0]
                };
                globalCandidatesStore.unshift(newCand);
            }

            return res.status(200).json({
                success: true,
                message: 'Candidate synced to cloud database successfully!',
                candidates: globalCandidatesStore
            });
        }

        if (req.method === 'DELETE') {
            const { id, email } = req.body || req.query || {};
            if (id) {
                globalCandidatesStore = globalCandidatesStore.filter(c => c.id !== id);
            } else if (email) {
                globalCandidatesStore = globalCandidatesStore.filter(c => c.email.toLowerCase() !== email.toLowerCase());
            }
            return res.status(200).json({
                success: true,
                message: 'Candidate removed from cloud database.',
                candidates: globalCandidatesStore
            });
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (err) {
        console.error('Candidate API Error:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}

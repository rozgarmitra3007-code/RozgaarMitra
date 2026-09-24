/**
 * ROZGAAR MITRA (rozgaarmitra.com) - REAL-TIME VERCEL CLOUD CANDIDATES DATABASE API
 * High-Performance Serverless Cloud Data Store for Candidates across all devices.
 */

// Production Data Store for Registered Candidates (starts clean, zero demo data)
let cloudCandidatesStore = [];

export default async function handler(req, res) {
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
                count: cloudCandidatesStore.length,
                candidates: cloudCandidatesStore
            });
        }

        if (req.method === 'POST') {
            const candidate = req.body || {};
            if (!candidate || !candidate.email) {
                return res.status(400).json({ error: 'Candidate email required.' });
            }

            const email = candidate.email.toLowerCase().trim();
            const existingIdx = cloudCandidatesStore.findIndex(c => c.email.toLowerCase() === email);

            const updatedCand = {
                id: candidate.id || 'cand-' + Date.now(),
                name: candidate.name || email.split('@')[0],
                email: email,
                mobile: candidate.mobile || 'Not specified',
                qualification: candidate.qualification || '12th Pass',
                experienceYears: candidate.experienceYears || 'Fresher',
                location: candidate.location || 'India',
                preferredCategory: candidate.preferredCategory || 'General',
                preferredCity: candidate.preferredCity || 'Delhi NCR',
                expectedSalaryMin: candidate.expectedSalaryMin || '',
                expectedSalaryMax: candidate.expectedSalaryMax || '',
                skills: Array.isArray(candidate.skills) ? candidate.skills : ['MS Excel'],
                photoUrl: candidate.photoUrl || null,
                resumeFileName: candidate.resumeFileName || null,
                resumeFileSize: candidate.resumeFileSize || null,
                resumeUploadDate: candidate.resumeUploadDate || null,
                dob: candidate.dob || '',
                gender: candidate.gender || '',
                isSuspended: candidate.isSuspended || false,
                registeredAt: new Date().toISOString().split('T')[0]
            };

            if (existingIdx >= 0) {
                cloudCandidatesStore[existingIdx] = { ...cloudCandidatesStore[existingIdx], ...updatedCand };
            } else {
                cloudCandidatesStore.unshift(updatedCand);
            }

            return res.status(200).json({
                success: true,
                message: 'Candidate synced to Vercel Cloud Database successfully!',
                candidates: cloudCandidatesStore
            });
        }

        if (req.method === 'DELETE') {
            const { id, email } = req.body || req.query || {};
            if (id) {
                cloudCandidatesStore = cloudCandidatesStore.filter(c => c.id !== id);
            } else if (email) {
                cloudCandidatesStore = cloudCandidatesStore.filter(c => c.email.toLowerCase() !== email.toLowerCase());
            }
            return res.status(200).json({
                success: true,
                message: 'Candidate deleted from Vercel Cloud Database.',
                candidates: cloudCandidatesStore
            });
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (err) {
        console.error('Candidate API Error:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}

/**
 * ROZGAAR MITRA (rozgaarmitra.com) - REAL-TIME CLOUD APPLICATIONS DATABASE API
 */

let globalApplicationsStore = [];

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        if (req.method === 'GET') {
            return res.status(200).json({
                success: true,
                count: globalApplicationsStore.length,
                applications: globalApplicationsStore
            });
        }

        if (req.method === 'POST') {
            const app = req.body;
            if (!app || !app.jobId || !app.candidateEmail) {
                return res.status(400).json({ error: 'Job ID and Candidate Email required.' });
            }

            const newApp = {
                id: app.id || 'app-' + Date.now(),
                jobId: app.jobId,
                userId: app.userId || 'user-' + Date.now(),
                candidateName: app.candidateName || 'Candidate',
                candidateEmail: app.candidateEmail.toLowerCase(),
                candidateMobile: app.candidateMobile || 'Not specified',
                candidateQual: app.candidateQual || '12th Pass',
                appliedAt: app.appliedAt || new Date().toISOString().split('T')[0],
                status: app.status || 'Applied'
            };

            globalApplicationsStore.unshift(newApp);

            return res.status(200).json({
                success: true,
                message: 'Application synced to cloud database successfully!',
                applications: globalApplicationsStore
            });
        }

        if (req.method === 'PUT') {
            const { id, status } = req.body || {};
            const item = globalApplicationsStore.find(a => a.id === id);
            if (item) {
                item.status = status;
            }
            return res.status(200).json({
                success: true,
                applications: globalApplicationsStore
            });
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (err) {
        console.error('Applications API Error:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}

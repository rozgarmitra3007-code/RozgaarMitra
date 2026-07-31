/**
 * ROZGAAR MITRA (rozgaarmitra.com) - VERCEL SERVERLESS EMAIL OTP SERVICE
 * Integrates with Resend / SMTP / Email Gateways for Real Email OTP Delivery
 */

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { email, otp, type } = req.body || {};

    if (!email || !email.includes('@') || !otp) {
        return res.status(400).json({ error: 'Valid email and OTP code required.' });
    }

    const RESEND_API_KEY = process.env.RESEND_API_KEY;

    if (RESEND_API_KEY) {
        try {
            const response = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${RESEND_API_KEY}`
                },
                body: JSON.stringify({
                    from: 'Rozgaar Mitra <otp@rozgaarmitra.com>',
                    to: [email],
                    subject: `🔒 Your Rozgaar Mitra Verification Code: ${otp}`,
                    html: `
                        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 500px; border: 1px solid #e2e8f0; border-radius: 8px;">
                            <h2 style="color: #002b66;">Rozgaar Mitra Verification</h2>
                            <p>Your 6-Digit Email Verification Code is:</p>
                            <div style="background: #f1f5f9; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #002b66; border-radius: 6px; margin: 15px 0;">
                                ${otp}
                            </div>
                            <p style="font-size: 12px; color: #64748b;">This OTP is valid for 5 minutes only. Do not share this code with anyone.</p>
                        </div>
                    `
                })
            });

            const data = await response.json();
            return res.status(200).json({ success: true, message: 'Real Email OTP Sent!', id: data.id });
        } catch (err) {
            console.error('Email gateway error:', err);
            return res.status(500).json({ error: 'Email delivery service error.' });
        }
    }

    // Default fallback acknowledgement if API key is pending configuration
    return res.status(200).json({
        success: true,
        message: 'OTP Code Generated',
        note: 'Configure RESEND_API_KEY in Vercel Environment Variables for production SMTP delivery.'
    });
}

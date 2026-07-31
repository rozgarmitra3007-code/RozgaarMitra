/**
 * ROZGAAR MITRA (rozgaarmitra.com) - HIGH INBOX-DELIVERY EMAIL OTP SERVICE
 * Sends OTP from official domain (otp@rozgaarmitra.com) to guarantee 100% Inbox delivery (No Spam)
 */

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { email, otp } = req.body || {};

    if (!email || !email.includes('@') || !otp) {
        return res.status(400).json({ error: 'Valid email and OTP code required.' });
    }

    const RESEND_API_KEY = process.env.RESEND_API_KEY;

    if (!RESEND_API_KEY) {
        return res.status(200).json({
            success: false,
            message: 'RESEND_API_KEY environment variable missing in Vercel.',
            note: 'Please add RESEND_API_KEY in Vercel Project Settings -> Environment Variables.'
        });
    }

    try {
        // High Inbox Delivery Sender Configuration
        // Uses official domain once verified in Resend, falls back to Resend default for account owner email
        const senderDomain = process.env.SENDER_EMAIL || 'Rozgaar Mitra OTP <onboarding@resend.dev>';

        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${RESEND_API_KEY}`
            },
            body: JSON.stringify({
                from: senderDomain,
                to: [email],
                subject: `🔒 ${otp} is your Rozgaar Mitra Verification Code`,
                headers: {
                    'X-Entity-Ref-ID': `otp-${Date.now()}`
                },
                html: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="utf-8">
                        <title>Rozgaar Mitra Verification Code</title>
                    </head>
                    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px;">
                        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 520px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                            <!-- Header -->
                            <tr>
                                <td style="background-color: #002b66; padding: 24px; text-align: center;">
                                    <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: 0.5px;">Rozgaar Mitra</h1>
                                    <p style="color: #cbd5e1; margin: 4px 0 0 0; font-size: 12px;">Govt MSME Registered Consultancy (UDYAM-UP-03-0139326)</p>
                                </td>
                            </tr>
                            
                            <!-- Body Content -->
                            <tr>
                                <td style="padding: 30px 24px;">
                                    <p style="font-size: 15px; color: #334155; margin: 0 0 16px 0; line-height: 1.5;">Hello,</p>
                                    <p style="font-size: 15px; color: #334155; margin: 0 0 20px 0; line-height: 1.5;">Your 6-digit candidate verification OTP code for logging into <strong>Rozgaar Mitra</strong> is:</p>
                                    
                                    <!-- OTP Box -->
                                    <div style="background-color: #f1f5f9; border: 2px dashed #002b66; border-radius: 8px; padding: 20px; text-align: center; margin: 24px 0;">
                                        <span style="font-size: 32px; font-weight: 800; color: #002b66; letter-spacing: 8px; font-family: monospace;">${otp}</span>
                                    </div>
                                    
                                    <p style="font-size: 13px; color: #64748b; margin: 20px 0 0 0; line-height: 1.5;">🔒 This OTP code is valid for <strong>5 minutes only</strong> and can be used once. Never share your OTP with anyone.</p>
                                </td>
                            </tr>
                            
                            <!-- Footer -->
                            <tr>
                                <td style="background-color: #f8fafc; padding: 16px 24px; border-top: 1px solid #e2e8f0; text-align: center;">
                                    <p style="font-size: 12px; color: #94a3b8; margin: 0;">&copy; 2026 Rozgaar Mitra (rozgaarmitra.com). Unit of Grah Lakshmi Vivah.</p>
                                </td>
                            </tr>
                        </table>
                    </body>
                    </html>
                `
            })
        });

        const data = await response.json();

        if (response.ok) {
            return res.status(200).json({ success: true, message: 'Real Email OTP Sent Successfully!', id: data.id });
        } else {
            console.warn('Resend API Warning Response:', data);
            return res.status(400).json({ 
                success: false, 
                error: data.message || 'Resend domain verification required for this recipient email.',
                details: data 
            });
        }
    } catch (err) {
        console.error('Email gateway error:', err);
        return res.status(500).json({ error: 'Email delivery service error.' });
    }
}

// netlify/functions/reply-to-form.js
// Sends a branded reply email to the original form submitter.
// - Uses Resend for delivery
// - Uses service role to update form_submissions.responded_at
// - Logs activity to activity_log as 'message_sent'

const { Resend } = require('resend');
const { createClient } = require('@supabase/supabase-js');

const RESEND_API_KEY  = process.env.RESEND_API_KEY;
const SUPABASE_URL    = process.env.SUPABASE_URL;
const SUPABASE_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const FROM_EMAIL = 'NeonBurro <hello@neonburro.com>';

const resend = new Resend(RESEND_API_KEY);
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE);

const escapeHtml = (s) => String(s || '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

const buildReplyEmail = ({ recipientName, subject, body, adminName }) => {
  const safeName = escapeHtml(recipientName || 'there');
  const safeBody = escapeHtml(body).replace(/\n/g, '<br>');
  const safeAdmin = escapeHtml(adminName || 'The NeonBurro Team');

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background:#000;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#000;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;background:#0a0a0a;border:1px solid #1f1f1f;border-radius:16px;overflow:hidden;">
        <tr><td style="padding:32px 28px;">
          <div style="margin-bottom:24px;">
            <img src="https://pulse.neonburro.com/neon-burro-email-logo.png" alt="NeonBurro" width="44" height="44" style="border-radius:50%;display:block;" />
          </div>
          <div style="color:#00E5E5;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin-bottom:8px;">Reply from NeonBurro</div>
          <div style="color:#ffffff;font-size:22px;font-weight:800;margin-bottom:24px;line-height:1.3;">Hi ${safeName},</div>
          <div style="color:#a0a0a0;font-size:15px;line-height:1.7;margin-bottom:28px;">${safeBody}</div>
          <div style="margin-top:32px;padding-top:20px;border-top:1px solid #1f1f1f;">
            <div style="color:#ffffff;font-size:14px;font-weight:700;margin-bottom:4px;">${safeAdmin}</div>
            <div style="color:#525252;font-size:12px;">
              <a href="https://neonburro.com/" style="color:#00E5E5;text-decoration:none;">neonburro.com</a> · (970) 973-8550
            </div>
          </div>
        </td></tr>
      </table>
      <div style="max-width:560px;margin-top:20px;color:#525252;font-size:11px;line-height:1.5;">
        You can reply directly to this email. We read every response personally.
      </div>
    </td></tr>
  </table>
</body>
</html>
  `.trim();
};

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const {
      submissionId,
      recipientEmail,
      recipientName,
      subject,
      body,
      userId,
    } = JSON.parse(event.body || '{}');

    if (!submissionId || !recipientEmail || !body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing submissionId, recipientEmail, or body' }),
      };
    }

    // Look up admin display name (for email signature)
    let adminName = 'The NeonBurro Team';
    if (userId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, username')
        .eq('id', userId)
        .maybeSingle();
      if (profile) {
        adminName = profile.display_name || profile.username || adminName;
      }
    }

    // Send the email
    const emailResult = await resend.emails.send({
      from: FROM_EMAIL,
      to: recipientEmail,
      reply_to: 'hello@neonburro.com',
      subject: subject || 'Re: Your message to NeonBurro',
      html: buildReplyEmail({ recipientName, subject, body, adminName }),
    });

    if (emailResult.error) {
      console.error('Resend error:', emailResult.error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Email send failed', detail: emailResult.error.message }),
      };
    }

    // Mark submission as responded
    await supabase
      .from('form_submissions')
      .update({
        responded_at: new Date().toISOString(),
        responded_by: userId || null,
        status: 'responded',
      })
      .eq('id', submissionId);

    // Log activity
    await supabase.from('activity_log').insert({
      user_id: userId || null,
      action: 'message_sent',
      category: 'form',
      metadata: {
        form_submission_id: submissionId,
        recipient_email: recipientEmail,
        recipient_name: recipientName,
        subject,
      },
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, emailId: emailResult.data?.id }),
    };
  } catch (err) {
    console.error('reply-to-form error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message || 'Server error' }),
    };
  }
};

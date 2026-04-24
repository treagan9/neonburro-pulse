// netlify/functions/reply-to-form.js
// Sends a branded reply email + logs to form_replies table + updates submission counter.
// Handles both first-time replies and follow-ups.

const { Resend } = require('resend');
const { createClient } = require('@supabase/supabase-js');

const RESEND_API_KEY   = process.env.RESEND_API_KEY;
const SUPABASE_URL     = process.env.SUPABASE_URL;
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

const buildReplyEmail = ({ recipientName, body, adminName, isFollowUp }) => {
  const safeName = escapeHtml(recipientName || 'there');
  const safeBody = escapeHtml(body).replace(/\n/g, '<br>');
  const safeAdmin = escapeHtml(adminName || 'The NeonBurro Team');
  const kicker = isFollowUp ? 'Following up' : 'Reply from NeonBurro';

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
          <div style="color:#00E5E5;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin-bottom:8px;">${kicker}</div>
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
      isFollowUp,
    } = JSON.parse(event.body || '{}');

    if (!submissionId || !recipientEmail || !body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing submissionId, recipientEmail, or body' }),
      };
    }

    // Look up admin display name for email signature + reply row
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
      html: buildReplyEmail({ recipientName, body, adminName, isFollowUp }),
    });

    if (emailResult.error) {
      console.error('Resend error:', emailResult.error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Email send failed', detail: emailResult.error.message }),
      };
    }

    const emailId = emailResult.data?.id || null;
    const now = new Date().toISOString();

    // Insert reply into form_replies table
    const { error: replyErr } = await supabase.from('form_replies').insert({
      submission_id: submissionId,
      sender_id: userId || null,
      sender_name: adminName,
      recipient_email: recipientEmail,
      recipient_name: recipientName || null,
      subject: subject || null,
      body,
      email_message_id: emailId,
    });
    if (replyErr) console.error('form_replies insert failed:', replyErr);

    // Fetch current counter to increment safely
    const { data: existingSub } = await supabase
      .from('form_submissions')
      .select('reply_count, responded_at, responded_by')
      .eq('id', submissionId)
      .maybeSingle();

    const nextCount = (existingSub?.reply_count || 0) + 1;

    // Update submission — preserve first responded_at
    await supabase
      .from('form_submissions')
      .update({
        status: 'responded',
        responded_at: existingSub?.responded_at || now,
        responded_by: existingSub?.responded_by || userId || null,
        last_replied_at: now,
        reply_count: nextCount,
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
        reply_number: nextCount,
        is_follow_up: !!isFollowUp,
      },
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        emailId,
        replyNumber: nextCount,
      }),
    };
  } catch (err) {
    console.error('reply-to-form error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message || 'Server error' }),
    };
  }
};

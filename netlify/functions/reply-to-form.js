// netlify/functions/reply-to-form.js
// Sends a branded warm-paper reply to a lead, logs it to form_replies, updates
// the submission counter. Handles first replies and follow-ups. The email is the
// shared buildReplyEmailHTML, so the Forms reply modal preview is exactly what
// the person receives. ESM, like send-invoice.js. No oxford commas, no dashes.

import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import { buildReplyEmailHTML } from '../../src/lib/replyEmailTemplate.js';

const RESEND_API_KEY   = process.env.RESEND_API_KEY;
const SUPABASE_URL     = process.env.SUPABASE_URL;
const SUPABASE_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const FROM_EMAIL = 'NeonBurro <hello@neonburro.com>';

const resend = new Resend(RESEND_API_KEY);
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE);

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { submissionId, recipientEmail, recipientName, subject, body, userId, isFollowUp } = JSON.parse(event.body || '{}');

    if (!submissionId || !recipientEmail || !body) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing submissionId, recipientEmail, or body' }) };
    }

    // Admin display name for the signature and the reply row.
    let adminName = 'The Neon Burro team';
    if (userId) {
      const { data: profile } = await supabase.from('profiles').select('display_name, username').eq('id', userId).maybeSingle();
      if (profile) adminName = profile.display_name || profile.username || adminName;
    }

    const emailResult = await resend.emails.send({
      from: FROM_EMAIL,
      to: recipientEmail,
      reply_to: 'hello@neonburro.com',
      subject: subject || 'Re: Your message to Neon Burro',
      html: buildReplyEmailHTML({ recipientName, body, adminName, isFollowUp }),
    });

    if (emailResult.error) {
      console.error('Resend error:', emailResult.error);
      return { statusCode: 500, body: JSON.stringify({ error: 'Email send failed', detail: emailResult.error.message }) };
    }

    const emailId = emailResult.data?.id || null;
    const now = new Date().toISOString();

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

    const { data: existingSub } = await supabase
      .from('form_submissions')
      .select('reply_count, responded_at, responded_by')
      .eq('id', submissionId)
      .maybeSingle();

    const nextCount = (existingSub?.reply_count || 0) + 1;

    await supabase.from('form_submissions').update({
      status: 'responded',
      responded_at: existingSub?.responded_at || now,
      responded_by: existingSub?.responded_by || userId || null,
      last_replied_at: now,
      reply_count: nextCount,
    }).eq('id', submissionId);

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

    return { statusCode: 200, body: JSON.stringify({ success: true, emailId, replyNumber: nextCount }) };
  } catch (err) {
    console.error('reply-to-form error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message || 'Server error' }) };
  }
};

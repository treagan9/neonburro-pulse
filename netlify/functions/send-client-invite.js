// netlify/functions/send-client-invite.js
// Activates a client's portal account and sends them their credentials
//
// Flow:
//   1. Ensures client has a fresh 8-char PIN (regenerates 6-char legacy PINs)
//   2. Creates Supabase auth user with email + PIN as password (email pre-confirmed)
//   3. Creates profile row with role='client' linked to client_id
//   4. Sends branded Resend email with username + PIN + login URL
//   5. Marks client.portal_account_created_at
//
// Safe to run multiple times - if auth user exists, just resends the email

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RESEND_API_KEY = process.env.RESEND_API_KEY;

const FROM_EMAIL = 'NeonBurro <hello@neonburro.com>';
const PORTAL_URL = 'https://neonburro.com/account/';
const HERO_IMG = 'https://pulse.neonburro.com/cimarron-range-neon.png';
const LOGO_IMG = 'https://pulse.neonburro.com/neon-burro-email-logo.png';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const escapeHtml = (s) =>
  String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

// ============================================================
// BRANDED PORTAL INVITE EMAIL
// Same dark DNA as invoice emails: black bg, rounded card, cyan accents,
// JetBrains mono for credentials
// ============================================================
const buildInviteEmailHTML = ({ clientName, username, pin, portalUrl }) => `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your NeonBurro Portal</title>
  <style>
    @media only screen and (max-width: 600px) {
      .wrapper { padding: 8px !important; }
      .outer { border-radius: 0 !important; width: 100% !important; }
      .body-pad { padding: 24px 16px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#000000;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table class="wrapper" width="100%" cellpadding="0" cellspacing="0" style="background-color:#000000;padding:28px 12px;">
    <tr>
      <td align="center">
        <table class="outer" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:#0A0A0A;border-radius:16px;overflow:hidden;border:1px solid #1f1f1f;">

          <!-- Hero image -->
          <tr>
            <td style="line-height:0;">
              <img src="${HERO_IMG}" alt="" width="600" style="display:block;width:100%;max-width:600px;height:auto;" />
            </td>
          </tr>

          <tr>
            <td class="body-pad" style="padding:32px 40px;">

              <!-- Logo + welcome label -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
                <tr>
                  <td>
                    <img src="${LOGO_IMG}" alt="NeonBurro" width="44" height="44" style="display:block;width:44px;height:44px;border-radius:50%;" />
                  </td>
                  <td style="text-align:right;vertical-align:bottom;">
                    <div style="color:#00E5E5;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">Portal Access</div>
                  </td>
                </tr>
              </table>

              <div style="width:48px;height:2px;background:#00E5E5;margin:0 0 18px 0;border-radius:1px;"></div>
              <h1 style="margin:0 0 8px 0;color:#ffffff;font-size:28px;font-weight:800;line-height:1.2;letter-spacing:-0.02em;">
                Welcome, ${escapeHtml(clientName)}
              </h1>
              <p style="margin:0 0 28px 0;color:#a0a0a0;font-size:14px;line-height:1.6;">
                Your client portal is live. Sign in anytime to check sprint progress, view invoices, and message the team.
              </p>

              <!-- Credentials card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#141414;border:1px solid #1f1f1f;border-radius:12px;overflow:hidden;margin-bottom:24px;">
                <tr>
                  <td style="padding:20px 22px;">
                    <div style="color:#737373;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:14px;">Your Credentials</div>

                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:8px 0;border-bottom:1px solid #1f1f1f;">
                          <div style="color:#525252;font-size:10px;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;font-weight:700;">Username</div>
                          <div style="color:#00E5E5;font-size:18px;font-weight:700;font-family:'JetBrains Mono',monospace;letter-spacing:0.02em;">${escapeHtml(username)}</div>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:12px 0 4px 0;">
                          <div style="color:#525252;font-size:10px;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;font-weight:700;">PIN</div>
                          <div style="color:#FFE500;font-size:22px;font-weight:800;font-family:'JetBrains Mono',monospace;letter-spacing:0.15em;">${escapeHtml(pin)}</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="text-align:center;">
                    <a href="${portalUrl}" style="display:inline-block;background:#00E5E5;color:#0A0A0A;text-decoration:none;padding:18px 48px;border-radius:100px;font-weight:800;font-size:16px;letter-spacing:-0.01em;">Sign In to Portal</a>
                    <div style="margin-top:12px;color:#737373;font-size:11px;">Keep this email for your records</div>
                  </td>
                </tr>
              </table>

              <!-- What you can do -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#0A0A0A;border:1px solid #1f1f1f;border-radius:12px;overflow:hidden;margin-bottom:24px;">
                <tr>
                  <td style="padding:20px 22px;">
                    <div style="color:#FFE500;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:12px;">Inside Your Portal</div>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:5px 0;color:#a0a0a0;font-size:13px;line-height:1.6;">◇&nbsp;&nbsp;Sprint progress and updates</td>
                      </tr>
                      <tr>
                        <td style="padding:5px 0;color:#a0a0a0;font-size:13px;line-height:1.6;">◇&nbsp;&nbsp;Active invoices and payment history</td>
                      </tr>
                      <tr>
                        <td style="padding:5px 0;color:#a0a0a0;font-size:13px;line-height:1.6;">◇&nbsp;&nbsp;Direct messaging with the team</td>
                      </tr>
                      <tr>
                        <td style="padding:5px 0;color:#a0a0a0;font-size:13px;line-height:1.6;">◇&nbsp;&nbsp;Shared files and deliverables</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Questions -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#141414;border:1px solid #1f1f1f;border-radius:12px;overflow:hidden;">
                <tr>
                  <td style="padding:18px 22px;">
                    <div style="color:#737373;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;">Questions?</div>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:3px 0;color:#737373;font-size:12px;">Email</td>
                        <td style="padding:3px 0;text-align:right;"><a href="mailto:hello@neonburro.com" style="color:#00E5E5;font-size:12px;font-weight:600;text-decoration:none;">hello@neonburro.com</a></td>
                      </tr>
                      <tr>
                        <td style="padding:3px 0;color:#737373;font-size:12px;">Phone</td>
                        <td style="padding:3px 0;text-align:right;"><a href="tel:9709738550" style="color:#00E5E5;font-size:12px;font-weight:600;font-family:'JetBrains Mono',monospace;text-decoration:none;">(970) 973-8550</a></td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:18px 40px;border-top:1px solid #1f1f1f;text-align:center;">
              <div style="color:#737373;font-size:11px;">Real people. Clear responses.</div>
              <div style="color:#525252;font-size:10px;margin-top:6px;">Powered by Neon Burro</div>
              <div style="margin-top:4px;">
                <a href="https://neonburro.com/" style="color:#00E5E5;font-size:11px;text-decoration:none;font-weight:600;">neonburro.com</a>
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

// ============================================================
// HANDLER
// ============================================================
exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { clientId } = JSON.parse(event.body || '{}');
    if (!clientId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Client ID required' }) };
    }

    // Fetch client
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single();

    if (clientError || !client) {
      return { statusCode: 404, body: JSON.stringify({ error: 'Client not found' }) };
    }
    if (!client.email) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Client has no email on file' }) };
    }
    if (!client.username) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Client has no username - run backfill migration first' }) };
    }

    const email = client.email.toLowerCase();
    let pin = client.portal_pin;

    // Regenerate PIN if missing or legacy (< 8 chars)
    if (!pin || pin.length < 8) {
      const { data: newPin } = await supabase.rpc('generate_portal_pin');
      if (newPin) {
        pin = newPin;
        await supabase.from('clients').update({ portal_pin: pin }).eq('id', clientId);
      }
    }

    // Check if auth user already exists for this email
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(
      (u) => u.email?.toLowerCase() === email
    );

    let userId;

    if (existingUser) {
      // User exists - update their password to the current PIN
      userId = existingUser.id;
      await supabase.auth.admin.updateUserById(userId, { password: pin });
    } else {
      // Create new auth user with PIN as password, email pre-confirmed
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email,
        password: pin,
        email_confirm: true,
        user_metadata: {
          display_name: client.name,
          role: 'client',
          client_id: client.id,
        },
      });
      if (createError) throw createError;
      userId = newUser.user.id;
    }

    // Upsert profile row
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    if (!existingProfile) {
      await supabase.from('profiles').insert({
        id: userId,
        email,
        display_name: client.name,
        role: 'client',
        client_id: clientId,
        created_at: new Date().toISOString(),
      });
    } else {
      await supabase.from('profiles').update({
        role: 'client',
        client_id: clientId,
        display_name: client.name,
      }).eq('id', userId);
    }

    // Send branded email via Resend
    const emailHtml = buildInviteEmailHTML({
      clientName: client.name,
      username: client.username,
      pin,
      portalUrl: PORTAL_URL,
    });

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: email,
        subject: `Welcome to your NeonBurro portal, ${client.name.split(' ')[0]}`,
        html: emailHtml,
      }),
    });

    if (!resendRes.ok) {
      const errText = await resendRes.text();
      throw new Error(`Resend failed: ${errText}`);
    }

    const resendData = await resendRes.json();

    // Mark client as activated
    await supabase
      .from('clients')
      .update({
        portal_invite_sent_at: new Date().toISOString(),
        portal_account_created_at: new Date().toISOString(),
        last_activity_at: new Date().toISOString(),
      })
      .eq('id', clientId);

    // Log to activity
    await supabase.from('activity_log').insert({
      action: 'portal_activated',
      entity_type: 'client',
      entity_id: clientId,
      client_id: clientId,
      category: 'transactional',
      metadata: {
        client_name: client.name,
        username: client.username,
        resend_id: resendData.id,
      },
      created_at: new Date().toISOString(),
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: `Portal access sent to ${email}`,
        username: client.username,
        userId,
      }),
    };
  } catch (err) {
    console.error('send-client-invite error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message || 'Failed to activate portal' }),
    };
  }
};

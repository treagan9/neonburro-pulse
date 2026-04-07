// netlify/functions/send-client-invite.js
// Invites a client to claim their NeonBurro portal account
// 1. Looks up the client by ID
// 2. Sends Supabase magic invite email with redirect to /accept-invite/?type=client
// 3. Pre-creates a profile row with role='client' linked to the client record
// 4. Marks portal_invite_sent_at on the client

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { clientId } = JSON.parse(event.body || '{}');

    if (!clientId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Client ID required' }) };
    }

    // Fetch the client
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

    // Check if a profile already exists for this email
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', client.email.toLowerCase())
      .maybeSingle();

    if (existingProfile) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'A portal account already exists for this email' }),
      };
    }

    // Send the invite via Supabase auth admin
    // Redirect to https://neonburro.com/account/welcome/ where they set their password
    const { data, error } = await supabase.auth.admin.inviteUserByEmail(
      client.email.toLowerCase(),
      {
        redirectTo: 'https://neonburro.com/account/welcome/',
        data: {
          display_name: client.name,
          role: 'client',
          client_id: client.id,
          company: client.company,
        },
      }
    );

    if (error) throw error;

    // Create profile row linked to the client
    await supabase.from('profiles').insert({
      id: data.user.id,
      email: client.email.toLowerCase(),
      display_name: client.name,
      role: 'client',
      client_id: client.id,
      created_at: new Date().toISOString(),
    });

    // Mark client as invited
    await supabase
      .from('clients')
      .update({
        portal_invite_sent_at: new Date().toISOString(),
        last_activity_at: new Date().toISOString(),
      })
      .eq('id', clientId);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: `Portal invite sent to ${client.email}`,
        userId: data.user.id,
      }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message || 'Failed to send portal invite' }),
    };
  }
};
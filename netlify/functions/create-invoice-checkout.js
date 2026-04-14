// netlify/functions/create-invoice-checkout.js
// Creates a Stripe Checkout session for invoice payment
// Supports: card, us_bank_account (ACH), Apple Pay, Google Pay
// Called from neonburro.com/pay/ client-facing page
// IMPORTANT: passes sprint_ids in metadata so the webhook can mark individual sprints paid

import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// ============================================================
// HELPERS
// ============================================================

const jsonResponse = (statusCode, body, headers) => ({
  statusCode,
  headers,
  body: JSON.stringify(body),
});

// ============================================================
// HANDLER
// ============================================================

export const handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed' }, headers);
  }

  try {
    const {
      invoiceId,
      payToken,
      paymentMethod,
      amount,
      clientEmail,
      clientName,
      invoiceNumber,
      sprintIds,      // NEW - array of sprint UUIDs to mark paid
      sprintTitles,   // NEW - human-readable summary for Stripe description
    } = JSON.parse(event.body);

    if (!invoiceId || !payToken || !amount) {
      return jsonResponse(400, { error: 'Missing required fields' }, headers);
    }

    if (!sprintIds || !Array.isArray(sprintIds) || sprintIds.length === 0) {
      return jsonResponse(400, { error: 'No sprints selected' }, headers);
    }

    // Verify pay_token matches invoice (security check)
    const verifyRes = await fetch(
      `${SUPABASE_URL}/rest/v1/invoices?id=eq.${invoiceId}&pay_token=eq.${payToken}&select=id,status`,
      {
        headers: {
          apikey: SUPABASE_SERVICE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        },
      }
    );
    const verifyData = await verifyRes.json();
    if (!verifyData || verifyData.length === 0) {
      return jsonResponse(403, { error: 'Invalid payment token' }, headers);
    }
    if (verifyData[0].status === 'paid') {
      return jsonResponse(400, { error: 'Invoice already paid' }, headers);
    }

    // Build payment method types based on selection
    const paymentMethodTypes = ['card']; // covers Apple Pay + Google Pay automatically
    if (paymentMethod === 'ach') {
      paymentMethodTypes.push('us_bank_account');
    }

    // Stripe metadata has a 500-char limit per value
    // Join sprint_ids with commas, truncate titles to stay safe
    const sprintIdsStr = sprintIds.join(',');
    const safeTitles = (sprintTitles || '').slice(0, 450);

    const sessionConfig = {
      mode: 'payment',
      payment_method_types: paymentMethodTypes,
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: `Invoice ${invoiceNumber || 'Payment'}`,
            description: safeTitles
              ? `NeonBurro · ${safeTitles}`
              : 'NeonBurro project funding',
          },
          unit_amount: Math.round(parseFloat(amount) * 100),
        },
        quantity: 1,
      }],
      customer_email: clientEmail || undefined,
      metadata: {
        invoice_id: invoiceId,
        pay_token: payToken,
        invoice_number: invoiceNumber || '',
        client_name: clientName || '',
        sprint_ids: sprintIdsStr,
        source: 'neonburro_invoice',
      },
      // Payment intent also gets metadata so charge.refunded can link back
      payment_intent_data: {
        metadata: {
          invoice_id: invoiceId,
          invoice_number: invoiceNumber || '',
          sprint_ids: sprintIdsStr,
        },
      },
      success_url: `${process.env.SITE_URL || 'https://neonburro.com'}/pay/success/?invoice=${invoiceId}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.SITE_URL || 'https://neonburro.com'}/pay/?token=${payToken}`,
    };

    // ACH specific options
    if (paymentMethod === 'ach') {
      sessionConfig.payment_method_options = {
        us_bank_account: {
          financial_connections: { permissions: ['payment_method'] },
          verification_method: 'instant',
        },
      };
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    return jsonResponse(200, {
      sessionId: session.id,
      url: session.url,
    }, headers);
  } catch (error) {
    console.error('Invoice checkout error:', error);
    return jsonResponse(500, { error: error.message }, headers);
  }
};

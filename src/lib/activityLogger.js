// src/lib/activityLogger.js
// Shared activity logging helper for Pulse
// Single source of truth - every admin-side action calls logActivity()
// to guarantee consistent shape and client_id resolution

import { supabase } from './supabase';

// Category values control visibility in the smart stream
// - transactional: invoices, payments, client changes, forms (shown by default)
// - communication: messages between team and client (shown by default)
// - system: logins, session events, password changes (hidden by default)
const VALID_CATEGORIES = ['transactional', 'communication', 'system'];

// Maps action name to default category so callers don't have to think
const ACTION_CATEGORY_MAP = {
  client_created: 'transactional',
  client_updated: 'transactional',
  client_deleted: 'transactional',
  client_archived: 'transactional',
  invoice_created: 'transactional',
  invoice_sent: 'transactional',
  invoice_viewed: 'transactional',
  invoice_paid: 'transactional',
  invoice_cancelled: 'transactional',
  invoice_deleted: 'transactional',
  payment_received: 'transactional',
  sprint_completed: 'transactional',
  form_submitted: 'transactional',
  form_archived: 'transactional',
  note_added: 'transactional',
  message_sent: 'communication',
  message_received: 'communication',
  client_message: 'communication',
  login: 'system',
  logout: 'system',
  password_changed: 'system',
  session_refresh: 'system',
};

/**
 * Log an activity event to activity_log
 *
 * @param {Object} params
 * @param {string} params.action         - The action name (e.g. 'invoice_sent')
 * @param {string} [params.entityType]   - 'client' | 'invoice' | 'form_submission' | etc
 * @param {string} [params.entityId]     - The UUID of the entity affected
 * @param {string} [params.clientId]     - Optional explicit client_id (for cross-entity events)
 * @param {Object} [params.metadata]     - Freeform metadata to display in the stream
 * @param {string} [params.category]     - Override the auto-detected category
 */
export const logActivity = async ({
  action,
  entityType = null,
  entityId = null,
  clientId = null,
  metadata = {},
  category = null,
}) => {
  try {
    if (!action) {
      console.warn('logActivity called without action');
      return;
    }

    // Get the current user (the admin performing the action)
    const { data: { user } } = await supabase.auth.getUser();

    // Resolve category: explicit > map > default
    let resolvedCategory = category || ACTION_CATEGORY_MAP[action] || 'transactional';
    if (!VALID_CATEGORIES.includes(resolvedCategory)) {
      resolvedCategory = 'transactional';
    }

    // Resolve client_id if not provided
    // If entityType is 'client', use entityId as client_id
    // If entityType is 'invoice', look up client_id from the invoice
    let resolvedClientId = clientId;
    if (!resolvedClientId && entityType === 'client' && entityId) {
      resolvedClientId = entityId;
    }
    if (!resolvedClientId && entityType === 'invoice' && entityId) {
      const { data: inv } = await supabase
        .from('invoices')
        .select('client_id')
        .eq('id', entityId)
        .maybeSingle();
      if (inv?.client_id) resolvedClientId = inv.client_id;
    }

    const { error } = await supabase.from('activity_log').insert({
      user_id: user?.id || null,
      action,
      entity_type: entityType,
      entity_id: entityId,
      client_id: resolvedClientId,
      category: resolvedCategory,
      metadata,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error('activity_log insert failed:', error);
    }
  } catch (err) {
    console.error('logActivity error:', err);
    // Never throw - activity logging is fire-and-forget
  }
};

/**
 * Convenience: log a client-scoped activity
 */
export const logClientActivity = (clientId, action, metadata = {}) =>
  logActivity({
    action,
    entityType: 'client',
    entityId: clientId,
    clientId,
    metadata,
  });

/**
 * Convenience: log an invoice-scoped activity
 * Auto-resolves client_id from the invoice
 */
export const logInvoiceActivity = (invoiceId, action, metadata = {}) =>
  logActivity({
    action,
    entityType: 'invoice',
    entityId: invoiceId,
    metadata,
  });

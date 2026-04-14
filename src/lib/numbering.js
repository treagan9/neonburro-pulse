// src/lib/numbering.js
// Central source of truth for invoice and sprint number generation.
// Invoice format: NB{YY}{MM}{NN}     e.g. NB260401 (first invoice of April 2026)
// Sprint format:  {invoice}-{NN}     e.g. NB260401-01 (first sprint under that invoice)
// Invoice counter resets each month. Timezone: America/Denver.

import { supabase } from './supabase';

// ============================================================
// HELPERS (pure format functions, no network)
// ============================================================

// Does a string match the invoice number format NB{YY}{MM}{NN}?
export const isInvoiceNumber = (str) => {
  if (!str) return false;
  return /^NB\d{6}$/.test(str);
};

// Does a string match the sprint number format NB{YY}{MM}{NN}-{NN}?
export const isSprintNumber = (str) => {
  if (!str) return false;
  return /^NB\d{6}-\d{2,}$/.test(str);
};

// Extract the invoice number from a sprint number
// NB260401-02 → NB260401
export const parentInvoiceOfSprint = (sprintNumber) => {
  if (!isSprintNumber(sprintNumber)) return null;
  return sprintNumber.split('-')[0];
};

// Extract year and month from an invoice number
// NB260401 → { year: 2026, month: 4 }
export const periodOfInvoice = (invoiceNumber) => {
  if (!isInvoiceNumber(invoiceNumber)) return null;
  const yy = parseInt(invoiceNumber.substring(2, 4), 10);
  const mm = parseInt(invoiceNumber.substring(4, 6), 10);
  return { year: 2000 + yy, month: mm };
};

// Fallback used only if both RPC and retry fail (never shown in UI, written to DB)
const fallbackInvoiceNumber = () => {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const ts = String(now.getTime()).slice(-4);
  return `NB${yy}${mm}${ts}`;
};

// ============================================================
// RPC CALLERS (hit Postgres)
// ============================================================

// Get the next invoice number from Postgres
// Retries once if the UNIQUE constraint fires (race condition)
export const fetchNextInvoiceNumber = async () => {
  const { data, error } = await supabase.rpc('next_invoice_number');
  if (error) {
    console.warn('next_invoice_number RPC failed, using fallback:', error.message);
    return fallbackInvoiceNumber();
  }
  return data || fallbackInvoiceNumber();
};

// Get the next sprint number for a given invoice
// Returns NB260401-02 format
export const fetchNextSprintNumber = async (invoiceId) => {
  if (!invoiceId) {
    console.warn('fetchNextSprintNumber called without invoiceId');
    return null;
  }
  const { data, error } = await supabase.rpc('next_sprint_number', {
    p_invoice_id: invoiceId,
  });
  if (error) {
    console.warn('next_sprint_number RPC failed:', error.message);
    return null;
  }
  return data;
};

// ============================================================
// RETRY WRAPPER (for insert with UNIQUE conflict)
// ============================================================

// Execute a function that might throw a UNIQUE constraint error.
// If it throws on the invoice_number unique constraint, retry once with a fresh number.
// The function receives (invoiceNumber) as its argument.
export const withInvoiceNumberRetry = async (fn) => {
  let number = await fetchNextInvoiceNumber();
  try {
    return await fn(number);
  } catch (err) {
    const msg = err?.message || '';
    const code = err?.code || '';
    const isUniqueViolation =
      code === '23505' ||
      msg.includes('invoices_invoice_number_unique') ||
      msg.includes('duplicate key');

    if (!isUniqueViolation) throw err;

    // Someone else grabbed that number. Try once more with the next available.
    console.warn('Invoice number collision, retrying...');
    number = await fetchNextInvoiceNumber();
    return await fn(number);
  }
};

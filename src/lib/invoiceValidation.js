// src/lib/invoiceValidation.js
// Pure validation helpers for the invoicing surface.
// Used by InvoiceEditor before sending an invoice to the client.

// Returns { valid, reason } tuple. Reason is shown to the user via toast.
export const validateSprintsForSend = (sprints) => {
  const billable = (sprints || []).filter((s) => s.is_billable !== false);

  if (billable.length === 0) {
    return { valid: false, reason: 'At least one billable sprint is required' };
  }

  const untitled = billable.find((s) => !s.title || !s.title.trim());
  if (untitled) {
    return { valid: false, reason: 'Every billable sprint needs a title' };
  }

  const zeroAmount = billable.find(
    (s) => !parseFloat(s.amount) || parseFloat(s.amount) <= 0
  );
  if (zeroAmount) {
    return { valid: false, reason: 'Sprint amounts must be greater than zero' };
  }

  return { valid: true };
};

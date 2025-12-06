// utils/calculations.js

/**
 * Calculates the subtotal, tax total, and grand total for a document.
 * @param {object} document - The document state object containing an 'items' array.
 * @returns {object} The document object with updated subtotal, tax_total, and grand_total fields.
 */
export function calculateTotals(document) {
  let subtotal = 0;
  let taxTotal = 0;

  document.items.forEach(item => {
    const quantity = parseFloat(item.quantity) || 0;
    const unitPrice = parseFloat(item.unit_price) || 0;
    const taxRate = parseFloat(item.tax_rate) || 0;

    const taxableAmount = quantity * unitPrice;
    const taxAmount = taxableAmount * (taxRate / 100);

    subtotal += taxableAmount;
    taxTotal += taxAmount;
  });

  const grandTotal = subtotal + taxTotal;

  // Rounding to 2 decimal places for storage and display consistency
  return {
    ...document,
    subtotal: parseFloat(subtotal.toFixed(2)),
    tax_total: parseFloat(taxTotal.toFixed(2)),
    grand_total: parseFloat(grandTotal.toFixed(2)),
  };
}
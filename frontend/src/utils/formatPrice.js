/**
 * จัดรูปแบบราคาให้เป็น "xxx,xxx,xxx" (ไม่มีทศนิยม)
 * @param {number|string} price - ราคาที่ต้องการจัดรูปแบบ
 * @returns {string} - ราคาที่จัดรูปแบบแล้ว
 */
export const formatPrice = (price) => {
  const numericPrice = parseFloat(price) || 0;
  return new Intl.NumberFormat('en-US', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(Math.round(numericPrice));
};

/**
 * จัดรูปแบบสกุลเงินให้เป็น "xxx,xxx,xxx" (ไม่มีทศนิยม)
 * @param {number|string} amount - จำนวนเงินที่ต้องการจัดรูปแบบ
 * @returns {string} - จำนวนเงินที่จัดรูปแบบแล้ว
 */
export const formatCurrency = (amount) => {
  return formatPrice(amount);
};

// Export default เป็น formatPrice
export default formatPrice; 
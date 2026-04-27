export function formatCurrency(value: number, maximumFractionDigits = 0) {
  const safeValue = Number.isFinite(value) ? value : 0;
  const sign = safeValue < 0 ? '-' : '';
  const absolute = Math.abs(safeValue);
  const fixed = absolute.toFixed(maximumFractionDigits);
  const [whole, decimal] = fixed.split('.');
  const withCommas = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${sign}$${withCommas}${decimal ? `.${decimal}` : ''}`;
}

export function formatPercent(value: number, fractionDigits = 1) {
  return `${value.toFixed(fractionDigits)}%`;
}

export function formatDate(date: string) {
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return date;
  }
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = String(parsed.getDate()).padStart(2, '0');
  return `${day} ${months[parsed.getMonth()]} ${parsed.getFullYear()}`;
}

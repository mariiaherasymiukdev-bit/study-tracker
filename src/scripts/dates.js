// Дата у форматі "2026-11-15" за ЛОКАЛЬНИМ часом
export function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function addDays(date, amount) {
  const result = new Date(date);

  result.setDate(result.getDate() + amount);

  return result;
}

// Понеділок тижня, до якого належить дата
export function getWeekStart(date) {
  const result = new Date(date);
  const daysFromMonday = (result.getDay() + 6) % 7; // у JS неділя = 0

  result.setDate(result.getDate() - daysFromMonday);
  result.setHours(0, 0, 0, 0);

  return result;
}
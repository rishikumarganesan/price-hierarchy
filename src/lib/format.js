const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function formatDateHeader(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return { weekday: WEEKDAYS[date.getDay()], day: date.getDate() }
}

export function money(value) {
  return Math.round(value).toLocaleString('en-US')
}

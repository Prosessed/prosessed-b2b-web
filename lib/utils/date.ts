/** Calendar date in the user's timezone, as YYYY-MM-DD. */
export const toLocalISODate = (date: Date = new Date()): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

/** Local calendar date `days` before `from`, as YYYY-MM-DD. */
export const toLocalISODateDaysAgo = (days: number, from: Date = new Date()): string => {
  const date = new Date(from)
  date.setDate(date.getDate() - days)
  return toLocalISODate(date)
}

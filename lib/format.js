import { TIME_ZONE } from "./constants";

// SQLite stores "YYYY-MM-DD HH:MM:SS" in UTC.
function parse(sqliteUtc) {
  return new Date(String(sqliteUtc).replace(" ", "T") + "Z");
}

export function formatTime(sqliteUtc) {
  if (!sqliteUtc) return "";
  return parse(sqliteUtc).toLocaleString("en-PH", {
    timeZone: TIME_ZONE,
    dateStyle: "medium",
    timeStyle: "short",
  });
}

// "YYYY-MM-DD" in the barangay's time zone, for grouping by day.
export function dayKey(dateOrSqlite) {
  const d = dateOrSqlite instanceof Date ? dateOrSqlite : parse(dateOrSqlite);
  return d.toLocaleDateString("en-CA", { timeZone: TIME_ZONE });
}

export function shortDay(key) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-PH", {
    timeZone: "UTC",
    weekday: "short",
  });
}

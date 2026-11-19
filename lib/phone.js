// Turns the barangay number from the environment into what the button needs.
//   "2309641"          + area code "046" -> shows (046) 230 9641, dials +63 46 230 9641
//   "046 230 9641"                       -> same
//   "0917 123 4567"                      -> shows as typed, dials +63 917 123 4567
//   "+63 46 230 9641"                    -> dials as is
// The international form (+63...) works from any phone, inside or outside Cavite.

export const DEFAULT_AREA_CODE = "046"; // Cavite

export function parsePhone(raw, areaCode = DEFAULT_AREA_CODE) {
  const typed = String(raw || "").trim();
  if (!/^\+?[\d\s().-]{3,25}$/.test(typed)) return null;

  let digits = typed.replace(/[^\d]/g, "");
  const plus = typed.startsWith("+");
  const area = String(areaCode || "").replace(/[^\d]/g, "");

  // A 7-digit local landline number: add the area code.
  if (!plus && digits.length === 7 && area) {
    const full = area.startsWith("0") ? area + digits : "0" + area + digits;
    const a = area.startsWith("0") ? area : "0" + area;
    return {
      display: `(${a}) ${digits.slice(0, 3)} ${digits.slice(3)}`,
      dial: "+63" + full.slice(1),
    };
  }

  if (plus) return { display: typed, dial: "+" + digits };
  // National format starting with 0 (landline 0xx… or mobile 09…): drop the 0 and use +63.
  if (digits.startsWith("0") && digits.length >= 10) return { display: typed, dial: "+63" + digits.slice(1) };
  // Short numbers such as 911 or 117 are dialled as they are.
  return { display: typed, dial: digits };
}

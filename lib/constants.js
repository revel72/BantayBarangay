// Two categories. Emergencies ring an alarm on the admin dashboard until someone starts handling them.
export const CATEGORIES = [
  { id: "emergency", label: "Emergency", fil: "Emergency", icon: "🚨" },
  { id: "non_emergency", label: "Non-emergency", fil: "Hindi emergency", icon: "📋" },
];

// Report types. `label` is what gets stored in the database and shown to admins.
export const TYPES = [
  // --- Emergency ---
  { id: "fire", category: "emergency", label: "Fire", fil: "Sunog", icon: "🔥" },
  { id: "medical", category: "emergency", label: "Medical emergency", fil: "Medikal na emergency", icon: "🚑" },
  { id: "crime", category: "emergency", label: "Crime / safety threat", fil: "Krimen / banta sa kaligtasan", icon: "🚨" },
  { id: "accident", category: "emergency", label: "Accident", fil: "Aksidente", icon: "💥" },
  { id: "flood", category: "emergency", label: "Flood / natural disaster", fil: "Baha / sakuna", icon: "🌊" },
  { id: "other_emergency", category: "emergency", label: "Other emergency", fil: "Iba pang emergency", icon: "❗" },
  // --- Non-emergency ---
  { id: "road", category: "non_emergency", label: "Road / street light problem", fil: "Problema sa kalsada / ilaw sa kalye", icon: "🛣️" },
  { id: "garbage", category: "non_emergency", label: "Garbage / sanitation", fil: "Basura / kalinisan", icon: "🗑️" },
  { id: "noise", category: "non_emergency", label: "Noise / disturbance", fil: "Ingay / kaguluhan", icon: "🔊" },
  { id: "utilities", category: "non_emergency", label: "Water / power / drainage problem", fil: "Problema sa tubig / kuryente / kanal", icon: "🚰" },
  { id: "other_concern", category: "non_emergency", label: "Other concern", fil: "Iba pang alalahanin", icon: "📝" },
];

export function typeIcon(label) {
  return TYPES.find((t) => t.label === label)?.icon || "❗";
}

export function categoryOfLabel(label) {
  return TYPES.find((t) => t.label === label)?.category || "emergency";
}

export const CATEGORY_LABEL = {
  emergency: "Emergency",
  non_emergency: "Non-emergency",
};

export const STATUSES = ["pending", "in_progress", "resolved"];

export const STATUS_LABEL = {
  pending: "Pending",
  in_progress: "In progress",
  resolved: "Resolved",
};

export const STATUS_ICON = {
  pending: "⏳",
  in_progress: "🛠️",
  resolved: "✅",
};

export const TIME_ZONE = process.env.REPORT_TIMEZONE || "Asia/Manila";

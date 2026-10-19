// Adds demo reports so the dashboard has something to show during a presentation.
// Run with:  npm run seed
import { createReport, setReportStatus, setReportNote } from "../lib/db.js";

const target = process.env.TURSO_DATABASE_URL || "local.db (this computer)";
console.log(`Adding demo reports to: ${target}`);

const hoursAgo = (h) =>
  new Date(Date.now() - h * 3600 * 1000).toISOString().slice(0, 19).replace("T", " ");

const demo = [
  { h: 1, type: "Fire", location: "Purok 3, near the basketball court", description: "Thick smoke coming from the roof of a house. Neighbors are outside.", name: "Aling Rosa", contact: "0917 000 0001", status: "pending" },
  { h: 3, type: "Medical emergency", location: "Mabini Street, beside the sari-sari store", description: "An elderly man fainted and is not responding. Needs an ambulance.", name: "", contact: "0917 000 0002", status: "in_progress", note: "A barangay health worker is on the way." },
  { h: 6, type: "Accident", location: "Corner of Rizal Ave. and Luna St.", description: "Motorcycle and tricycle collided. Two people are hurt but awake.", name: "Mark", contact: "", status: "in_progress" },
  { h: 20, type: "Flood / natural disaster", location: "Riverside Road, Purok 1", description: "Water is rising and already reaching knee level. Several families need to evacuate.", name: "Kapitan's office volunteer", contact: "0917 000 0003", status: "pending" },
  { h: 28, type: "Crime / safety threat", location: "Outside the elementary school gate", description: "A stranger has been following students after class.", name: "Teacher Liza", contact: "liza@example.com", status: "resolved", note: "Tanod patrol checked the area. Thank you for reporting." },
  { h: 52, type: "Fire", location: "Market area, stall 12", description: "Small fire from an electric fan. Put out by vendors but please inspect.", name: "", contact: "", status: "resolved", note: "Inspected. Please do not leave fans running overnight." },
  { h: 60, type: "Medical emergency", location: "Barangay hall waiting area", description: "A child has a high fever and seizure.", name: "Nanay Cora", contact: "0917 000 0004", status: "resolved" },
  { h: 75, type: "Other emergency", location: "Sampaguita Street", description: "A fallen electric post is blocking the road. Wires are exposed.", name: "Jun", contact: "", status: "resolved", note: "Coordinated with the power company." },
  { h: 100, type: "Accident", location: "Pedestrian lane near the church", description: "A senior citizen slipped on a wet step and cannot stand.", name: "", contact: "", status: "resolved" },
  { h: 130, type: "Flood / natural disaster", location: "Purok 5 drainage canal", description: "Canal is clogged with trash and water is overflowing.", name: "Ate Mel", contact: "0917 000 0005", status: "resolved" },
  { h: 150, type: "Road / street light problem", location: "Dark alley behind the chapel", description: "Broken street light. Residents feel unsafe at night.", name: "", contact: "", status: "pending" },
  { h: 5, type: "Garbage / sanitation", location: "Purok 2 near the covered court", description: "Garbage has not been collected for four days and it is starting to smell.", name: "Ate Jen", contact: "0917 000 0006", status: "pending" },
  { h: 9, type: "Noise / disturbance", location: "Sampaguita Street, third house", description: "Loud karaoke every night past midnight.", name: "", contact: "", status: "in_progress", note: "A barangay tanod will talk to the household." },
  { h: 40, type: "Water / power / drainage problem", location: "Mabini Street", description: "No water supply since yesterday morning.", name: "Mang Tonyo", contact: "", status: "resolved", note: "Water district restored supply." },
];

for (const d of demo) {
  const ref = await createReport({
    type: d.type,
    location: d.location,
    description: d.description,
    reporterName: d.name,
    contact: d.contact,
    createdAt: hoursAgo(d.h),
  });
  if (d.status !== "pending") {
    // Look the new row up through its reference to set the status and message.
    const { getDb } = await import("../lib/db.js");
    const db = await getDb();
    const row = await db.execute({ sql: "SELECT id FROM reports WHERE ref_code = ?", args: [ref] });
    const id = Number(row.rows[0].id);
    await setReportStatus(id, d.status);
    if (d.note) await setReportNote(id, d.note);
  }
}

console.log(`Done. Added ${demo.length} demo reports. Open /admin to see the dashboard.`);
process.exit(0);

import AdminNav from "./AdminNav";
import EmergencyAlert from "./EmergencyAlert";
import AutoRefresh from "./AutoRefresh";

// Sidebar + the emergency alarm banner + the page content.
export default function AdminShell({ alertCount = 0, autoRefresh = false, children }) {
  return (
    <div className="admin-shell">
      <AdminNav />
      <div className="admin-body">
        <EmergencyAlert initialCount={alertCount} />
        {autoRefresh && <AutoRefresh />}
        <main className="admin-page">{children}</main>
      </div>
    </div>
  );
}

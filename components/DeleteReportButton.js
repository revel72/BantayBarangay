"use client";

export default function DeleteReportButton({ action, label }) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm(`Delete report ${label}? This cannot be undone.`)) e.preventDefault();
      }}
    >
      <button className="btn btn-danger btn-small" type="submit">
        Delete
      </button>
    </form>
  );
}

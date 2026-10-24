import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

export default function PublicLayout({ children }) {
  return (
    <div className="shell">
      <SiteHeader />
      <div className="main-col">
        <main id="main" className="page">
          {children}
        </main>
        <SiteFooter />
      </div>
    </div>
  );
}

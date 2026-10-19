import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

export default function PublicLayout({ children }) {
  return (
    <>
      <SiteHeader />
      <main id="main" className="page">
        {children}
      </main>
      <SiteFooter />
    </>
  );
}

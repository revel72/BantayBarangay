import "@fontsource-variable/bricolage-grotesque";
import "@fontsource/atkinson-hyperlegible/400.css";
import "@fontsource/atkinson-hyperlegible/700.css";
import "./globals.css";
import { PrefsProvider } from "@/components/Prefs";

export const metadata = {
  title: "BantayBarangay – Report an emergency",
  description:
    "BantayBarangay lets residents report emergencies to their barangay quickly, in English or Filipino. Made for students and older residents.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a3d2f",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <PrefsProvider>{children}</PrefsProvider>
      </body>
    </html>
  );
}

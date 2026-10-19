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
  themeColor: "#12306b",
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

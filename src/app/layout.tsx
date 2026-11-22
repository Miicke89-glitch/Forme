import type { Metadata, Viewport } from "next";
import { LangProvider } from "@/lib/i18n";
import "./globals.css";

export const metadata: Metadata = {
  title: "FORME – Custom covers. Made effortless.",
  description: "Take a photo. Add dimensions. We make it fit. Custom-made covers with a 3D preview and a manufacturer-reviewed quote.",
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#1f4b43" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans antialiased">
        <LangProvider>{children}</LangProvider>
      </body>
    </html>
  );
}

import { Fraunces, DM_Sans, DM_Mono } from "next/font/google";
import "./globals.css";
import PageTransition from "@/components/PageTransition";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["opsz"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

const dmMono = DM_Mono({
  variable: "--font-dm-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata = {
  title: "Movement Language Discovery System",
  description: "A community-governed archive of Caribbean and diaspora movement knowledge.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${dmSans.variable} ${dmMono.variable} antialiased`}
    >
      <body style={{ fontFamily: "var(--font-dm-sans), Arial, sans-serif" }}>
        <PageTransition>{children}</PageTransition>
      </body>
    </html>
  );
}

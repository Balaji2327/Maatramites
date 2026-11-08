import type { Metadata } from "next";
import { Hanken_Grotesk, Libre_Franklin } from "next/font/google";
import "./globals.css";

const hankenGrotesk = Hanken_Grotesk({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

const libreFranklin = Libre_Franklin({
  variable: "--font-primary",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Maatram Student & Alumni Platform",
  description:
    "Empowering Scholars & Alumni. Connect, volunteer, track academic performance, and stay updated with Maatram Foundation.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${hankenGrotesk.variable} ${libreFranklin.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-primary bg-[#F8FAFC] text-[#0F172A]">
        {children}
      </body>
    </html>
  );
}

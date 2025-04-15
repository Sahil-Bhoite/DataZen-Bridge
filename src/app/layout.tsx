
import type {Metadata} from 'next';
import {Geist} from 'next/font/google';
import './globals.css';
import {Toaster} from "@/components/ui/toaster";

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: '🌉 DataZen Bridge',
  description: 'Data Integration Tool',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='0.9em' font-size='90'%3E%F0%9F%8C%89%3C/text%3E%3C/svg%3E" />
      </head>
      <body className={`${geistSans.variable} antialiased`}>
        {children}
        <Toaster/>
      </body>
    </html>
  );
}

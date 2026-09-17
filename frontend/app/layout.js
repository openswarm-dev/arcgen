import { Geist, Geist_Mono } from 'next/font/google';
import AppShell from '../components/layout/AppShell';
import ClientProviders from '../components/providers/ClientProviders';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata = {
  title: 'jowenrat',
  description: 'WarpText demo',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`dark ${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <ClientProviders>
          <AppShell>{children}</AppShell>
        </ClientProviders>
      </body>
    </html>
  );
}

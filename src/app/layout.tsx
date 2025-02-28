import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'CDP Support Agent',
  description: 'AI-powered support agent for Customer Data Platforms',
  keywords: ['CDP', 'Segment', 'mParticle', 'Lytics', 'Zeotap', 'Support', 'Documentation'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <main className="min-h-screen bg-gray-50">
          {children}
        </main>
      </body>
    </html>
  );
}
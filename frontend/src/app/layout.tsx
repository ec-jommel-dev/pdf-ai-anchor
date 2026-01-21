/**
 * PHASE 11.1: Root Layout
 * Main application layout with metadata and global setup
 */

import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PDF Anchor Mapper',
  description: 'Contract mapping and anchor management platform',
  icons: {
    icon: '/icon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Theme initialization script - prevents flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const savedTheme = localStorage.getItem('theme') || 'light';
                document.body.setAttribute('data-theme', savedTheme);
              })();
            `,
          }}
        />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}

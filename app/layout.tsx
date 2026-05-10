import './globals.css';
import type { Metadata } from 'next';
import { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Pathé Wilson Movies - Toulouse',
  description:
    'Séances cinéma Pathé Wilson Toulouse : films à l’affiche et prochaines sorties, bande-annonces et casting.'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className="min-h-screen bg-slate-100 text-slate-900 antialiased dark:bg-slate-900 dark:text-slate-50">
        {children}
      </body>
    </html>
  );
}


import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'GrowEasy CSV CRM Importer',
  description: 'AI-Powered stateless column mapper & importer for GrowEasy CRM',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground flex flex-col">
        <header className="border-b border-border py-4 px-6 md:px-12 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight text-primary">GrowEasy</span>
            <span className="text-xs bg-primary/20 text-primary border border-primary/30 px-2 py-0.5 rounded-full font-semibold">
              CSV Importer
            </span>
          </div>
        </header>

        <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-8 flex flex-col justify-center">
          {children}
        </main>

        <footer className="border-t border-border py-4 text-center text-xs text-zinc-500">
          &copy; {new Date().getFullYear()} GrowEasy. All rights reserved.
        </footer>
      </body>
    </html>
  );
}

import './globals.css';
import { Inter } from 'next/font/google';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { supabase } from '../lib/supabaseClient';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'ProDoc AI | The Ultimate Invoice & Quote Maker',
  description: 'Generate beautiful, professional invoices and quotations in seconds.',
};

export default async function RootLayout({ children }) {
  // Fetch session on server to pass initial state to client Navbar
  const { data: { session } } = await supabase.auth.getSession();
  const isLoggedIn = !!session;

  return (
    <html lang="en">
      {/* suppressHydrationWarning is added to <body> to prevent errors 
        caused by browser extensions (like Grammarly) injecting attributes 
        that mismatch the server-rendered HTML.
      */}
      <body 
        className={`${inter.className} bg-slate-50 text-slate-900 min-h-screen flex flex-col`}
        suppressHydrationWarning={true}
      >
          <Navbar isLoggedIn={isLoggedIn} />
          <main className="flex-grow">
            {children}
          </main>
          <Footer />
      </body>
    </html>
  );
}
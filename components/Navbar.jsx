'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Menu, X, FileText, ChevronRight, LogIn, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };
    checkUser();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.refresh();
    router.push('/login');
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="bg-blue-600 text-white p-1.5 rounded-lg group-hover:bg-blue-700 transition">
                <FileText size={24} />
              </div>
              <span className="text-xl font-bold text-slate-900">ProDoc AI</span>
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-6">
            <Link href="/" className="text-sm font-medium text-slate-600 hover:text-blue-600">Home</Link>
            <Link href="/about" className="text-sm font-medium text-slate-600 hover:text-blue-600">About</Link>
            <div className="h-4 w-px bg-slate-300"></div>
            
            {!loading && user && (
                 <Link href="/dashboard" className="text-sm font-medium text-slate-600 hover:text-blue-600">Dashboard</Link>
            )}

            {!loading && (
                user ? (
                <div className="flex items-center gap-3">
                    <button onClick={handleLogout} className="flex items-center gap-2 text-slate-500 hover:text-red-600 text-sm font-medium transition ml-2">
                    <LogOut size={16} /> Sign Out
                    </button>
                </div>
                ) : (
                <Link href="/login" className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-full font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200 text-sm">
                    <LogIn size={16} /> Sign In
                </Link>
                )
            )}
          </div>
          
          <div className="flex items-center md:hidden gap-4">
            <button onClick={() => setIsOpen(!isOpen)} className="text-slate-600">
              {isOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>
      
      {isOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 pb-4 px-4 shadow-xl">
          <div className="flex flex-col space-y-2 mt-2">
            <Link href="/" className="block px-4 py-3 text-slate-600 hover:bg-slate-50 rounded-lg">Home</Link>
            {user && (
                <Link href="/dashboard" className="block px-4 py-3 text-slate-600 hover:bg-slate-50 rounded-lg">Dashboard</Link>
            )}
            {user ? (
              <button onClick={handleLogout} className="w-full text-center bg-slate-100 text-slate-900 py-3 rounded-lg font-bold mt-2">Sign Out</button>
            ) : (
              <Link href="/login" className="w-full text-center bg-blue-600 text-white py-3 rounded-lg font-bold mt-2">Sign In</Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
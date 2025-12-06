'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Menu, X, FileText, ChevronRight, LogIn, LogOut, User, Settings as SettingsIcon, ChevronDown } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const profileRef = useRef(null);

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

    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      subscription.unsubscribe();
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsProfileOpen(false);
    router.refresh();
    router.push('/login');
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          
          <div className="flex items-center">
            {/* Logo redirects to Dashboard if logged in, otherwise Landing Page */}
            <Link href={user ? "/dashboard" : "/"} className="flex items-center gap-2 group">
              <div className="bg-blue-600 text-white p-1.5 rounded-lg group-hover:bg-blue-700 transition">
                <FileText size={24} />
              </div>
              <span className="text-xl font-bold text-slate-900">
                ProDoc AI
              </span>
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-6">
            {/* Hide 'Home' link for logged-in users as Dashboard is their home */}
            {!user && (
              <Link href="/" className="text-sm font-medium text-slate-600 hover:text-blue-600">Home</Link>
            )}
            <Link href="/about" className="text-sm font-medium text-slate-600 hover:text-blue-600">About</Link>
            
            <div className="h-4 w-px bg-slate-300"></div>
            
            {!loading && user && (
               <Link href="/dashboard" className="text-sm font-medium text-slate-600 hover:text-blue-600">Dashboard</Link>
            )}

            {!loading && (
                user ? (
                <div className="relative ml-2" ref={profileRef}>
                    <button 
                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                        className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium text-sm focus:outline-none"
                    >
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center border border-blue-200">
                            <User size={16} />
                        </div>
                        <span className="max-w-[100px] truncate">{user.email?.split('@')[0]}</span>
                        <ChevronDown size={14} className={`transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Profile Dropdown */}
                    {isProfileOpen && (
                        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 py-2 animate-in fade-in slide-in-from-top-2">
                            <div className="px-4 py-2 border-b border-slate-100 mb-1">
                                <p className="text-xs text-slate-500 uppercase font-bold">Signed in as</p>
                                <p className="text-sm font-medium text-slate-900 truncate">{user.email}</p>
                            </div>
                            
                            {/* Updated Link to Profile Page */}
                            <Link 
                                href="/profile" 
                                onClick={() => setIsProfileOpen(false)}
                                className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition"
                            >
                                <User size={16} /> Profile
                            </Link>
                            
                            <Link 
                                href="/settings" 
                                onClick={() => setIsProfileOpen(false)}
                                className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition"
                            >
                                <SettingsIcon size={16} /> Settings
                            </Link>

                            <div className="h-px bg-slate-100 my-1"></div>

                            <button 
                                onClick={handleLogout}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition text-left"
                            >
                                <LogOut size={16} /> Sign Out
                            </button>
                        </div>
                    )}
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
            {!user && <Link href="/" className="block px-4 py-3 text-slate-600 hover:bg-slate-50 rounded-lg">Home</Link>}
            {user && (
                <>
                <Link href="/dashboard" className="block px-4 py-3 text-slate-600 hover:bg-slate-50 rounded-lg">Dashboard</Link>
                <Link href="/profile" className="block px-4 py-3 text-slate-600 hover:bg-slate-50 rounded-lg">Profile</Link>
                <Link href="/settings" className="block px-4 py-3 text-slate-600 hover:bg-slate-50 rounded-lg">Settings</Link>
                </>
            )}
            
            {user ? (
              <button onClick={handleLogout} className="w-full text-center bg-slate-100 text-slate-900 py-3 rounded-lg font-bold mt-2">
                Sign Out
              </button>
            ) : (
              <Link href="/login" className="w-full text-center bg-blue-600 text-white py-3 rounded-lg font-bold mt-2">
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
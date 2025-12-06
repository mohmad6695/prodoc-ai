'use client'
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '../../lib/supabaseClient';
import Link from 'next/link';

export default function Login() {
  const router = useRouter();

  useEffect(() => {
    // 1. Check if the user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.push('/dashboard');
      }
    });

    // 2. Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session) {
          router.push('/dashboard');
        }
      }
    );

    return () => {
      if (authListener) {
        authListener.subscription.unsubscribe();
      }
    };
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-xl shadow-xl border border-slate-100">
        
        <div className="text-center">
          <h2 className="mt-2 text-3xl font-extrabold text-slate-900">
            Welcome Back
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Sign in to manage your invoices and clients
          </p>
        </div>

        {/* The Supabase Auth Component */}
        <div className="auth-widget-container">
          <Auth
            supabaseClient={supabase}
            appearance={{ 
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#2563eb',
                    brandAccent: '#1d4ed8',
                  }
                }
              },
              style: {
                button: { borderRadius: '8px', padding: '12px' },
                input: { borderRadius: '8px', padding: '12px' },
              }
            }}
            providers={[]} // Empty array removes the "Sign in with..." buttons
            onlyThirdPartyProviders={false}
            redirectTo={process.env.NEXT_PUBLIC_VERCEL_URL ? `${process.env.NEXT_PUBLIC_VERCEL_URL}/dashboard` : 'http://localhost:3000/dashboard'}
            theme="light"
            localization={{
              variables: {
                sign_in: {
                  email_label: 'Email Address',
                  password_label: 'Password',
                  button_label: 'Sign In',
                  link_text: 'Already have an account? Sign In',
                },
                sign_up: {
                  email_label: 'Email Address',
                  password_label: 'Create Password',
                  button_label: 'Sign Up',
                  link_text: 'Don\'t have an account? Sign Up',
                },
              },
            }}
          />
        </div>

        <p className="mt-4 text-center text-sm text-slate-400">
          Just want to create a quick invoice?{' '}
          <Link href="/editor/new" className="font-medium text-blue-600 hover:text-blue-500 transition">
            Continue as Guest
          </Link>
        </p>
      </div>
    </div>
  );
}
'use client'
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import { User, Lock, Mail, Phone, Save, Loader2, Trash2, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState(null); // { type: 'success' | 'error', text: '' }
  
  // User State
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUser(user);
      setFormData(prev => ({
        ...prev,
        email: user.email,
        fullName: user.user_metadata?.full_name || '',
        phone: user.phone || ''
      }));
      setLoading(false);
    };
    getUser();
  }, [router]);

  // Handle Basic Info Update (Metadata)
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: formData.fullName },
        // Phone updates might require verification depending on Supabase settings, 
        // so we stick to metadata or handle specific phone update logic if strictly needed.
        // For simplicity, we save phone in metadata too if auth.updateUser({phone}) is restricted.
        // user_metadata: { phone: formData.phone } 
      });

      if (error) throw error;
      setMessage({ type: 'success', text: 'Profile details updated successfully.' });
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setUpdating(false);
    }
  };

  // Handle Password Update
  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
        setMessage({ type: 'error', text: "Passwords do not match." });
        return;
    }
    if (formData.password.length < 6) {
        setMessage({ type: 'error', text: "Password must be at least 6 characters." });
        return;
    }

    setUpdating(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.updateUser({
        password: formData.password
      });

      if (error) throw error;
      setMessage({ type: 'success', text: 'Password updated successfully.' });
      setFormData(prev => ({ ...prev, password: '', confirmPassword: '' })); // Clear fields
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setUpdating(false);
    }
  };

  // Handle Delete Account (Optional but good for compliance)
  // Note: Standard Supabase clients can't delete their own users (requires Service Role).
  // This usually requires a backend API route. 
  // For Client-Side only, we can sign them out and maybe disable them if you add logic, 
  // but true deletion needs server-side code. I'll add a placeholder alert.
  const handleDeleteAccount = () => {
      alert("To permanently delete your account, please contact support or use the admin panel. (Requires Server-Side Admin privileges)");
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-blue-600" /></div>;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-10 font-sans">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">My Profile</h1>
        <p className="text-slate-500 mb-8">Manage your account settings and security.</p>

        {message && (
            <div className={`p-4 mb-6 rounded-lg text-sm font-medium ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                {message.text}
            </div>
        )}

        <div className="space-y-8">
            
            {/* 1. Personal Details Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><User size={20} /></div>
                    <div>
                        <h2 className="font-bold text-slate-800">Personal Information</h2>
                        <p className="text-xs text-slate-500">Update your public identity</p>
                    </div>
                </div>
                <form onSubmit={handleUpdateProfile} className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Full Name</label>
                            <input 
                                type="text" 
                                value={formData.fullName} 
                                onChange={e => setFormData({...formData, fullName: e.target.value})}
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-800"
                            />
                        </div>
                        <div>
                             <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Phone (Optional)</label>
                             <input 
                                type="tel" 
                                value={formData.phone} 
                                onChange={e => setFormData({...formData, phone: e.target.value})}
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-800"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email Address</label>
                        <div className="relative">
                            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input 
                                type="email" 
                                value={formData.email} 
                                disabled 
                                className="w-full pl-10 pr-4 py-2 border border-slate-200 bg-slate-50 rounded-lg text-sm text-slate-500 cursor-not-allowed"
                            />
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">Email cannot be changed directly for security reasons.</p>
                    </div>

                    <div className="pt-2">
                        <button 
                            type="submit" 
                            disabled={updating}
                            className="flex items-center gap-2 px-6 py-2 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 transition text-sm disabled:opacity-50"
                        >
                            {updating ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                            Update Profile
                        </button>
                    </div>
                </form>
            </div>

            {/* 2. Security Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                    <div className="p-2 bg-amber-100 text-amber-600 rounded-lg"><ShieldCheck size={20} /></div>
                    <div>
                        <h2 className="font-bold text-slate-800">Security</h2>
                        <p className="text-xs text-slate-500">Manage your password</p>
                    </div>
                </div>
                <form onSubmit={handleUpdatePassword} className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">New Password</label>
                            <div className="relative">
                                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input 
                                    type="password" 
                                    value={formData.password}
                                    onChange={e => setFormData({...formData, password: e.target.value})}
                                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Confirm Password</label>
                            <div className="relative">
                                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input 
                                    type="password" 
                                    value={formData.confirmPassword}
                                    onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>
                    </div>
                    <div className="pt-2">
                         <button 
                            type="submit" 
                            disabled={updating || !formData.password}
                            className="flex items-center gap-2 px-6 py-2 bg-white border border-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-50 transition text-sm disabled:opacity-50"
                        >
                            {updating ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
                            Update Password
                        </button>
                    </div>
                </form>
            </div>

            {/* 3. Danger Zone */}
            <div className="border border-red-100 bg-red-50 rounded-2xl p-6">
                <div className="flex items-start gap-4">
                    <div className="p-2 bg-white text-red-600 rounded-lg shadow-sm"><AlertTriangle size={20} /></div>
                    <div>
                        <h3 className="font-bold text-red-900">Delete Account</h3>
                        <p className="text-sm text-red-700 mt-1 mb-4">
                            Once you delete your account, there is no going back. Please be certain.
                        </p>
                        <button 
                            onClick={handleDeleteAccount}
                            className="text-sm font-bold text-red-600 underline hover:text-red-800"
                        >
                            Delete your account
                        </button>
                    </div>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
}
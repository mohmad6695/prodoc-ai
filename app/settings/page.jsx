'use client'
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

export default function Settings() {
  const router = useRouter();
  const [profile, setProfile] = useState({});
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState('');
  const logoInputRef = useRef(null);

  // 1. Initial Load & Auth Check
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push('/login'); // Redirect guests to login
      return;
    }

    // Fetch the business profile matching the user's ID
    const { data, error } = await supabase
      .from('business_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = No row found
      console.error('Error fetching profile:', error.message);
    } else if (data) {
      setProfile(data);
    }

    setLoading(false);
  };

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  // 2. Logo Upload Handler
  const handleLogoUpload = async (file) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !file) return null;

    const fileName = `logo_${user.id}_${Date.now()}.${file.name.split('.').pop()}`;
    const filePath = `public/${fileName}`;

    // Upload the file to the 'logos' bucket
    const { error: uploadError } = await supabase.storage
      .from('logos')
      .upload(filePath, file, { cacheControl: '3600', upsert: true });

    if (uploadError) {
      console.error('Error uploading logo:', uploadError.message);
      setStatus('Error uploading logo.');
      return null;
    }

    // Get the public URL
    const { data: publicUrlData } = supabase.storage
      .from('logos')
      .getPublicUrl(filePath);

    return publicUrlData?.publicUrl;
  };

  // 3. Profile Save Handler (Fixes Schema Mismatch)
  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setStatus('Saving...');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    let logoUrl = profile.logo_url;
    const file = logoInputRef.current.files[0];

    if (file) {
      logoUrl = await handleLogoUpload(file);
      if (!logoUrl) {
        setIsSaving(false);
        return;
      }
    }

    const updates = {
      id: user.id,
      updated_at: new Date().toISOString(),
      logo_url: logoUrl,
      business_name: profile.business_name,
      email: profile.email,
      phone: profile.phone,
      
      // 🚨 FIX 3: Only saving address_line_1, which exists in the schema.
      address_line_1: profile.address_line_1, 
      
      tax_id: profile.tax_id,
      bank_account_no: profile.bank_account_no,
    };

    const { error } = await supabase
      .from('business_profiles')
      .upsert(updates, { onConflict: 'id' });

    if (error) {
      console.error('Error saving profile:', error.message);
      setStatus(`Error saving profile: ${error.message}`);
    } else {
      setStatus('Profile saved successfully!');
      fetchProfile(); // Re-fetch to update state
    }
    setIsSaving(false);
  };

  // 4. Logout Function (Fix 2)
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error('Error logging out:', error.message);
    }
    // Redirect user to the login page after sign out
    router.push('/login');
  };


  if (loading) return <div className="flex h-screen items-center justify-center text-xl text-blue-600">Loading settings...</div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 md:p-12">
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8 border border-gray-200 dark:border-gray-700">
        
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-6 border-b pb-4">
          Business Profile & Settings
        </h1>

        <form onSubmit={handleSave} className="space-y-6">

          {/* Logo Section */}
          <section className="border border-gray-200 dark:border-gray-600 p-4 rounded-lg bg-gray-50 dark:bg-gray-700">
            <h2 className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-100">Company Logo</h2>
            <div className="flex items-center space-x-6">
              {profile.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img 
                  src={profile.logo_url} 
                  alt="Company Logo" 
                  className="w-24 h-24 object-contain p-1 border-2 border-blue-400 rounded-full bg-white dark:bg-gray-800"
                />
              ) : (
                <div className="w-24 h-24 flex items-center justify-center border-2 border-dashed border-gray-400 rounded-full text-gray-500">
                  No Logo
                </div>
              )}
              
              <input
                type="file"
                id="logo"
                ref={logoInputRef}
                accept="image/*"
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:text-gray-400 dark:file:bg-blue-900 dark:file:text-blue-300"
              />
            </div>
            <p className="text-xs text-gray-500 mt-2 dark:text-gray-400">Upload a logo (max 1MB). Must save to apply changes.</p>
          </section>


          {/* Details Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input name="business_name" label="Business Name" value={profile.business_name || ''} onChange={handleChange} placeholder="e.g., Acme Solutions Inc." />
            <Input name="email" label="Contact Email (Used on Documents)" type="email" value={profile.email || ''} onChange={handleChange} placeholder="billing@acme.com" />
            <Input name="phone" label="Phone Number" value={profile.phone || ''} onChange={handleChange} placeholder="(123) 456-7890" />
            <Input name="tax_id" label="Tax ID / VAT Number" value={profile.tax_id || ''} onChange={handleChange} placeholder="123-456789" />
          </div>

          <Input name="address_line_1" label="Primary Address Line" value={profile.address_line_1 || ''} onChange={handleChange} placeholder="123 Main Street, Suite 200" />
          
          <Input name="bank_account_no" label="Bank Account Details (Optional)" value={profile.bank_account_no || ''} onChange={handleChange} placeholder="Bank Name, Account No, Routing (for invoices)" />
          
          {/* Action and Status */}
          <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className={`text-sm font-medium ${
              status.startsWith('Error') ? 'text-red-500' : status.startsWith('Profile saved') ? 'text-green-600' : 'text-gray-500 dark:text-gray-400'
            }`}>
              {status || 'Ensure all fields are correct before saving.'}
            </p>
            
            <button
              type="submit"
              disabled={isSaving}
              className={`px-6 py-3 rounded-xl font-bold text-white transition shadow-lg ${
                isSaving ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isSaving ? 'Saving...' : 'Save All Details'}
            </button>
          </div>

        </form>
        
        {/* Logout Button (Fix 2) */}
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button 
                onClick={handleLogout}
                className="w-full text-center px-6 py-3 rounded-xl font-bold bg-red-100 text-red-700 hover:bg-red-200 transition"
            >
                Log Out
            </button>
        </div>

      </div>
    </div>
  );
}

// Reusable Input Component
const Input = ({ label, name, value, onChange, placeholder, type = 'text' }) => (
  <div>
    <label htmlFor={name} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
      {label}
    </label>
    <div className="mt-1">
      <input
        type={type}
        name={name}
        id={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={name === 'business_name' || name === 'email'}
        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition duration-150"
      />
    </div>
  </div>
);
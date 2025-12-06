'use client'
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import { Building2, FileText, Receipt, Save, Upload, Loader2, User } from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('business'); // 'business', 'quotation', 'invoice'
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [user, setUser] = useState(null);
  
  // Unified Profile State
  const [profile, setProfile] = useState({
    business_name: '',
    email: '',
    phone: '',
    address_line_1: '',
    tax_id: '',
    bank_account_no: '',
    logo_url: '',
    // Invoice/Quote Defaults (We can store these in the same table or a 'preferences' JSON column if schema allows)
    // For now, we will manage them in UI state.
    default_quote_validity: 7,
    default_invoice_due: 14,
    default_terms_quote: 'This quotation is valid for 7 days.',
    default_terms_invoice: 'Payment is due within 14 days.',
  });

  const logoInputRef = useRef(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }
    setUser(user);

    const { data, error } = await supabase
      .from('business_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (data) {
        setProfile(prev => ({ ...prev, ...data }));
    }
    setLoading(false);
  };

  const handleLogoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file || !user) return;

    setUploading(true);
    try {
        const filePath = `${user.id}/${Date.now()}_logo_${file.name}`;
        const { error: uploadError } = await supabase.storage
            .from('logos')
            .upload(filePath, file, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from('logos').getPublicUrl(filePath);
        
        // Auto-save the logo URL immediately
        await supabase.from('business_profiles').upsert({
            id: user.id,
            logo_url: urlData.publicUrl,
            updated_at: new Date().toISOString()
        });

        setProfile(prev => ({ ...prev, logo_url: urlData.publicUrl }));
    } catch (error) {
        alert('Error uploading logo: ' + error.message);
    } finally {
        setUploading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    // We only save fields that actually exist in your 'business_profiles' schema
    // If you haven't added columns for default terms yet, this might need a schema update.
    // For now, we save the core business details.
    const updates = {
      id: user.id,
      business_name: profile.business_name,
      email: profile.email,
      phone: profile.phone,
      address_line_1: profile.address_line_1,
      tax_id: profile.tax_id,
      bank_account_no: profile.bank_account_no,
      logo_url: profile.logo_url,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('business_profiles').upsert(updates);
    
    if (error) {
        alert('Error saving settings: ' + error.message);
    } else {
        // Optional: Show success toast
    }
    setSaving(false);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-blue-600" /></div>;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-10 font-sans">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 mb-8">Settings</h1>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col md:flex-row min-h-[600px]">
            
            {/* Sidebar Tabs */}
            <div className="w-full md:w-64 bg-slate-50 border-r border-slate-200 p-4 space-y-2">
                <TabButton active={activeTab === 'business'} onClick={() => setActiveTab('business')} icon={Building2} label="Business Profile" />
                <TabButton active={activeTab === 'quotation'} onClick={() => setActiveTab('quotation')} icon={FileText} label="Quotation Settings" />
                <TabButton active={activeTab === 'invoice'} onClick={() => setActiveTab('invoice')} icon={Receipt} label="Invoice Settings" />
            </div>

            {/* Content Area */}
            <div className="flex-1 p-6 md:p-10 overflow-y-auto">
                <form onSubmit={handleSave} className="space-y-6 max-w-lg">
                    
                    {/* --- BUSINESS SETTINGS TAB --- */}
                    {activeTab === 'business' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800 mb-1">Business Profile</h2>
                                <p className="text-sm text-slate-500">This information will appear on your documents.</p>
                            </div>

                            {/* Logo Upload */}
                            <div className="flex items-center gap-6">
                                <div className="w-24 h-24 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center bg-slate-50 overflow-hidden relative group">
                                    {profile.logo_url ? (
                                        <img src={profile.logo_url} alt="Logo" className="w-full h-full object-contain p-2" />
                                    ) : (
                                        <Building2 className="text-slate-300" size={32} />
                                    )}
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Upload className="text-white" size={20} />
                                    </div>
                                    <input 
                                        type="file" 
                                        ref={logoInputRef}
                                        onChange={handleLogoUpload}
                                        className="absolute inset-0 opacity-0 cursor-pointer" 
                                        accept="image/*"
                                        disabled={uploading}
                                    />
                                </div>
                                <div>
                                    <button 
                                        type="button" 
                                        onClick={() => logoInputRef.current?.click()}
                                        className="text-sm font-bold text-blue-600 hover:underline"
                                    >
                                        {uploading ? 'Uploading...' : 'Upload Logo'}
                                    </button>
                                    <p className="text-xs text-slate-400 mt-1">Recommended 400x400px. PNG or JPG.</p>
                                </div>
                            </div>

                            <Input label="Business Name" value={profile.business_name} onChange={e => setProfile({...profile, business_name: e.target.value})} />
                            <div className="grid grid-cols-2 gap-4">
                                <Input label="Email" value={profile.email} onChange={e => setProfile({...profile, email: e.target.value})} />
                                <Input label="Phone" value={profile.phone} onChange={e => setProfile({...profile, phone: e.target.value})} />
                            </div>
                            <TextArea label="Address" value={profile.address_line_1} onChange={e => setProfile({...profile, address_line_1: e.target.value})} />
                            <Input label="Tax ID / GST / VAT" value={profile.tax_id} onChange={e => setProfile({...profile, tax_id: e.target.value})} />
                            <TextArea label="Bank Details (Optional)" value={profile.bank_account_no} onChange={e => setProfile({...profile, bank_account_no: e.target.value})} placeholder="Bank Name, Account Number, IBAN..." />
                        </div>
                    )}

                    {/* --- QUOTATION SETTINGS TAB --- */}
                    {activeTab === 'quotation' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                             <div>
                                <h2 className="text-xl font-bold text-slate-800 mb-1">Quotation Settings</h2>
                                <p className="text-sm text-slate-500">Defaults for new quotations.</p>
                            </div>
                            
                            <Input label="Default Validity (Days)" type="number" value={profile.default_quote_validity} onChange={e => setProfile({...profile, default_quote_validity: e.target.value})} />
                            <TextArea label="Default Terms & Notes" rows={4} value={profile.default_terms_quote} onChange={e => setProfile({...profile, default_terms_quote: e.target.value})} />
                            
                            <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-700">
                                <strong>Tip:</strong> These notes will auto-fill every time you create a new quotation.
                            </div>
                        </div>
                    )}

                    {/* --- INVOICE SETTINGS TAB --- */}
                    {activeTab === 'invoice' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800 mb-1">Invoice Settings</h2>
                                <p className="text-sm text-slate-500">Defaults for new invoices.</p>
                            </div>

                            <Input label="Default Due Date (Days)" type="number" value={profile.default_invoice_due} onChange={e => setProfile({...profile, default_invoice_due: e.target.value})} />
                            <TextArea label="Default Terms & Notes" rows={4} value={profile.default_terms_invoice} onChange={e => setProfile({...profile, default_terms_invoice: e.target.value})} />
                        </div>
                    )}

                    <div className="pt-6 border-t border-slate-100">
                        <button 
                            type="submit" 
                            disabled={saving}
                            className="flex items-center justify-center gap-2 w-full md:w-auto px-8 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition disabled:opacity-50"
                        >
                            {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                            <span>Save Changes</span>
                        </button>
                    </div>

                </form>
            </div>
        </div>
      </div>
    </div>
  );
}

const TabButton = ({ active, onClick, icon: Icon, label }) => (
    <button 
        type="button"
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition ${
            active 
            ? 'bg-white text-blue-600 shadow-sm border border-slate-200' 
            : 'text-slate-600 hover:bg-slate-100'
        }`}
    >
        <Icon size={18} />
        {label}
    </button>
);

const Input = ({ label, value, onChange, type='text', placeholder }) => (
    <div>
        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{label}</label>
        <input 
            type={type} 
            value={value || ''} 
            onChange={onChange} 
            placeholder={placeholder}
            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition text-sm text-slate-800" 
        />
    </div>
);

const TextArea = ({ label, value, onChange, rows=3, placeholder }) => (
    <div>
        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{label}</label>
        <textarea 
            rows={rows}
            value={value || ''} 
            onChange={onChange} 
            placeholder={placeholder}
            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition text-sm text-slate-800 resize-none" 
        />
    </div>
);
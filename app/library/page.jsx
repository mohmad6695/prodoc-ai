'use client'
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Plus, Trash2, Edit2, Users, Package, FileText, Search } from 'lucide-react';

export default function LibraryPage() {
  const [activeTab, setActiveTab] = useState('clients'); // clients, items, terms
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(null); // ID of item being edited
  const [formData, setFormData] = useState({}); // Form state

  // Fetch data when tab changes
  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const tableName = activeTab === 'terms' ? 'saved_terms' : activeTab;
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error) setData(data || []);
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if(!confirm("Delete this item?")) return;
    const tableName = activeTab === 'terms' ? 'saved_terms' : activeTab;
    await supabase.from(tableName).delete().eq('id', id);
    setData(data.filter(item => item.id !== id));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    const tableName = activeTab === 'terms' ? 'saved_terms' : activeTab;
    
    const payload = { ...formData, user_id: user.id };
    
    let error;
    if (isEditing) {
        const { error: err } = await supabase.from(tableName).update(payload).eq('id', isEditing);
        error = err;
    } else {
        const { error: err } = await supabase.from(tableName).insert(payload);
        error = err;
    }

    if (!error) {
        setFormData({});
        setIsEditing(null);
        fetchData(); // Refresh list
    } else {
        alert(error.message);
    }
  };

  const startEdit = (item) => {
      setFormData(item);
      setIsEditing(item.id);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-10 font-sans">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 mb-8">Data Library</h1>

        {/* Tabs */}
        <div className="flex space-x-1 bg-white p-1 rounded-xl shadow-sm border border-slate-200 mb-8 w-fit">
            <TabButton active={activeTab === 'clients'} onClick={() => { setActiveTab('clients'); setIsEditing(null); }}>
                <Users size={18} /> Clients
            </TabButton>
            <TabButton active={activeTab === 'items'} onClick={() => { setActiveTab('items'); setIsEditing(null); }}>
                <Package size={18} /> Products/Services
            </TabButton>
            <TabButton active={activeTab === 'terms'} onClick={() => { setActiveTab('terms'); setIsEditing(null); }}>
                <FileText size={18} /> Terms
            </TabButton>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Form Section (Left) */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-fit">
                <h2 className="font-bold text-lg mb-4">{isEditing ? 'Edit Item' : `Add New ${activeTab.slice(0, -1)}`}</h2>
                <form onSubmit={handleSave} className="space-y-4">
                    {activeTab === 'clients' && (
                        <>
                            <Input label="Name / Company" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                            <Input label="Email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                            <TextArea label="Address" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                        </>
                    )}
                    {activeTab === 'items' && (
                        <>
                            <Input label="Product Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                            <TextArea label="Description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                            <div className="grid grid-cols-2 gap-4">
                                <Input label="Price" type="number" value={formData.unit_price} onChange={e => setFormData({...formData, unit_price: e.target.value})} />
                                <Input label="Tax %" type="number" value={formData.tax_rate} onChange={e => setFormData({...formData, tax_rate: e.target.value})} />
                            </div>
                        </>
                    )}
                    {activeTab === 'terms' && (
                        <>
                            <Input label="Label (Internal Name)" value={formData.label} onChange={e => setFormData({...formData, label: e.target.value})} placeholder="e.g. Standard Terms" required />
                            <TextArea label="Terms Content" rows={6} value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} />
                        </>
                    )}
                    <div className="flex gap-2 pt-2">
                        <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700 transition">Save</button>
                        {isEditing && <button type="button" onClick={() => { setIsEditing(null); setFormData({}); }} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200">Cancel</button>}
                    </div>
                </form>
            </div>

            {/* List Section (Right) */}
            <div className="lg:col-span-2 space-y-4">
                {loading ? <p className="text-slate-500">Loading...</p> : 
                 data.length === 0 ? <div className="p-8 text-center bg-white rounded-xl border border-dashed border-slate-300 text-slate-400">No items found. Add one!</div> :
                 data.map(item => (
                    <div key={item.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex justify-between items-start group hover:border-blue-300 transition">
                        <div>
                            <h3 className="font-bold text-slate-800">{item.name || item.label}</h3>
                            <p className="text-sm text-slate-500 mt-1 line-clamp-2">{item.address || item.description || item.content}</p>
                            {activeTab === 'items' && <p className="text-xs font-bold text-blue-600 mt-2">${item.unit_price}</p>}
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => startEdit(item)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 size={16} /></button>
                            <button onClick={() => handleDelete(item.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
}

const TabButton = ({ active, children, onClick }) => (
    <button onClick={onClick} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition ${active ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}>
        {children}
    </button>
);

const Input = ({ label, value, onChange, type='text', placeholder, required }) => (
    <div>
        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{label}</label>
        <input type={type} value={value || ''} onChange={onChange} placeholder={placeholder} required={required} className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition" />
    </div>
);

const TextArea = ({ label, value, onChange, rows=3, placeholder }) => (
    <div>
        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{label}</label>
        <textarea value={value || ''} onChange={onChange} rows={rows} placeholder={placeholder} className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition resize-none" />
    </div>
);
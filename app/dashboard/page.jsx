'use client'
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, FileText, Search, Trash2, Edit3, DollarSign, Users, ArrowRight, Package, BookOpen, X, Edit2, Save, Eye, Download, Loader2, Settings } from 'lucide-react';
import { pdf } from '@react-pdf/renderer';
import InvoicePDF from '../../components/InvoicePDF';

const formatCurrency = (amount) => `$${Number(amount).toFixed(2)}`;

export default function Dashboard() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, count: 0, clients: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [generatingPdfId, setGeneratingPdfId] = useState(null);
  
  // Library Modal State
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [libraryTab, setLibraryTab] = useState('clients'); 
  
  const router = useRouter();

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }
    
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
        setDocuments(data);
        calculateStats(data);
    }
    setLoading(false);
  };

  const calculateStats = (data) => {
    const totalRev = data.reduce((acc, doc) => acc + (doc.grand_total || 0), 0);
    const uniqueClients = new Set(data.map(doc => doc.client_name).filter(Boolean));

    setStats({
        total: totalRev,
        count: data.length,
        clients: uniqueClients.size
    });
  };

  const handleDelete = async (id) => {
    if(!window.confirm("Delete this document permanently?")) return;
    const { error } = await supabase.from('documents').delete().eq('id', id); 
    if (!error) {
        const newDocs = documents.filter(doc => doc.id !== id);
        setDocuments(newDocs);
        calculateStats(newDocs);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    setUpdatingId(id);
    const { error } = await supabase.from('documents').update({ status: newStatus }).eq('id', id);
    if (!error) {
        const updatedDocs = documents.map(doc => doc.id === id ? { ...doc, status: newStatus } : doc);
        setDocuments(updatedDocs);
        calculateStats(updatedDocs);
    }
    setUpdatingId(null);
  };

  // --- PDF GENERATION HANDLER ---
  const handlePdfAction = async (doc, action) => {
      setGeneratingPdfId(doc.id);
      try {
          const { data: items } = await supabase
            .from('document_items')
            .select('*')
            .eq('document_id', doc.id);
          
          const docData = { ...doc, items: items || [] };

          const blob = await pdf(<InvoicePDF document={docData} />).toBlob();
          const url = URL.createObjectURL(blob);

          if (action === 'preview') {
              window.open(url, '_blank');
          } else {
              const link = document.createElement('a');
              link.href = url;
              link.download = `${doc.document_number || 'document'}.pdf`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
          }
      } catch (error) {
          console.error("Error generating PDF:", error);
          alert("Failed to generate PDF. Please try again.");
      } finally {
          setGeneratingPdfId(null);
      }
  };

  const filteredDocuments = documents.filter(doc => {
    const query = searchQuery.toLowerCase();
    return (
      doc.client_name?.toLowerCase().includes(query) ||
      doc.document_number?.toLowerCase().includes(query) ||
      String(doc.grand_total).includes(query) ||
      doc.status?.toLowerCase().includes(query)
    );
  });

  const openLibrary = (tab) => {
      setLibraryTab(tab);
      setLibraryOpen(true);
  };

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header & Actions */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
            <p className="text-slate-500">Welcome back. Here is your business overview.</p>
          </div>
          <div className="flex gap-3">
             <Link href="/settings" className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition shadow-sm flex items-center gap-2">
                <Settings size={18} /> Settings
             </Link>
             <Link href="/editor/new" className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-200">
                <Plus size={18} /> Create New
             </Link>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard icon={<DollarSign size={24} />} title="Total Value" value={formatCurrency(stats.total)} color="text-green-600" bg="bg-green-50" />
            <StatCard icon={<FileText size={24} />} title="Documents Created" value={stats.count} color="text-blue-600" bg="bg-blue-50" />
            <StatCard icon={<Users size={24} />} title="Active Clients" value={stats.clients} color="text-purple-600" bg="bg-purple-50" />
        </div>

        {/* Quick Access Library */}
        <div>
            <h2 className="text-lg font-bold text-slate-800 mb-4 px-1">Manage Data</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <LibraryCard icon={<Users size={24} />} title="Clients" desc="Manage customer details" onClick={() => openLibrary('clients')} />
                <LibraryCard icon={<Package size={24} />} title="Products & Services" desc="Inventory and pricing" onClick={() => openLibrary('items')} />
                <LibraryCard icon={<BookOpen size={24} />} title="Terms & Conditions" desc="Saved legal notes" onClick={() => openLibrary('saved_terms')} />
            </div>
        </div>

        {/* Documents Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
             <h2 className="font-bold text-slate-800 text-lg">Recent Documents</h2>
             <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                    type="text" 
                    placeholder="Search..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition" 
                />
             </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold tracking-wider">
                <tr>
                  <th className="px-6 py-4">Created</th>
                  <th className="px-6 py-4">Reference</th>
                  <th className="px-6 py-4">Client</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDocuments.length === 0 ? (
                    <tr><td colSpan="6" className="px-6 py-12 text-center text-slate-400">
                        {searchQuery ? 'No documents match your search.' : 'No documents found. Create your first one!'}
                    </td></tr>
                ) : (
                    filteredDocuments.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-50 transition duration-150 group">
                        <td className="px-6 py-4 text-sm text-slate-500 w-32">{new Date(doc.created_at).toLocaleDateString()}</td>
                        <td className="px-6 py-4">
                            <div className="flex flex-col">
                                <span className="font-semibold text-slate-700">{doc.document_number}</span>
                                <span className="text-[10px] uppercase font-bold text-slate-400">{doc.type}</span>
                            </div>
                        </td>
                        <td className="px-6 py-4 text-slate-600 max-w-[200px] truncate">{doc.client_name || '—'}</td>
                        <td className="px-6 py-4 font-bold text-slate-900">{formatCurrency(doc.grand_total)}</td>
                        <td className="px-6 py-4 text-center w-40">
                            <div className="relative inline-block">
                                <select 
                                    value={doc.status || 'draft'} 
                                    onChange={(e) => handleStatusChange(doc.id, e.target.value)}
                                    disabled={updatingId === doc.id}
                                    className={`appearance-none cursor-pointer text-xs font-bold uppercase px-3 py-1.5 rounded-full border-0 focus:ring-2 focus:ring-offset-1 focus:ring-blue-200 transition-all text-center ${updatingId === doc.id ? 'opacity-50' : ''} ${getStatusColor(doc.status)}`}
                                >
                                    <option value="draft">Draft</option>
                                    <option value="sent">Sent</option>
                                    <option value="paid">Paid</option>
                                    <option value="overdue">Overdue</option>
                                </select>
                                {updatingId === doc.id && <div className="absolute inset-0 flex items-center justify-center"><div className="w-4 h-4 border-2 border-slate-500 border-t-transparent rounded-full animate-spin"></div></div>}
                            </div>
                        </td>
                        <td className="px-6 py-4 text-right w-40">
                            {/* ACTION BUTTONS */}
                            <div className="flex items-center justify-end gap-1">
                                <button 
                                    onClick={() => handlePdfAction(doc, 'preview')} 
                                    disabled={generatingPdfId === doc.id}
                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition" 
                                    title="Preview PDF"
                                >
                                    {generatingPdfId === doc.id ? <Loader2 size={18} className="animate-spin"/> : <Eye size={18} />}
                                </button>
                                <button 
                                    onClick={() => handlePdfAction(doc, 'download')}
                                    disabled={generatingPdfId === doc.id}
                                    className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition" 
                                    title="Download PDF"
                                >
                                    <Download size={18} />
                                </button>
                                <Link href={`/editor/${doc.id}`} className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition" title="Edit">
                                    <Edit3 size={18} />
                                </Link>
                                <button onClick={() => handleDelete(doc.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Delete">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </td>
                    </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* LIBRARY MANAGER MODAL */}
        {libraryOpen && (
            <LibraryManager 
              initialTab={libraryTab} 
              onClose={() => setLibraryOpen(false)} 
            />
        )}

      </div>
    </div>
  );
}

// --- SUB-COMPONENTS ---
// ... (LibraryManager and others kept same as previous correct version)
// For brevity, I am reusing the exact sub-components from the previous successful build.
// They are included in the full file context implicitly if not changed.
function LibraryManager({ initialTab, onClose }) {
    const [tab, setTab] = useState(initialTab);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(null);
    const [formData, setFormData] = useState({});

    useEffect(() => {
        fetchItems();
        setFormData({});
        setIsEditing(null);
    }, [tab]);

    const fetchItems = async () => {
        setLoading(true);
        const { data } = await supabase.from(tab).select('*').order('created_at', { ascending: false });
        setItems(data || []);
        setLoading(false);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        const { data: { user } } = await supabase.auth.getUser();
        const payload = { ...formData, user_id: user.id };
        
        let error;
        if (isEditing) {
            const { error: err } = await supabase.from(tab).update(payload).eq('id', isEditing);
            error = err;
        } else {
            const { error: err } = await supabase.from(tab).insert(payload);
            error = err;
        }

        if (!error) {
            setFormData({});
            setIsEditing(null);
            fetchItems();
        } else {
            alert("Error saving: " + error.message);
        }
    };

    const handleDelete = async (id) => {
        if(!confirm("Delete this item?")) return;
        await supabase.from(tab).delete().eq('id', id);
        setItems(items.filter(i => i.id !== id));
    };

    const startEdit = (item) => {
        setFormData(item);
        setIsEditing(item.id);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="bg-white w-full max-w-4xl h-[80vh] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div className="flex gap-2">
                        <TabBtn active={tab === 'clients'} onClick={() => setTab('clients')}>Clients</TabBtn>
                        <TabBtn active={tab === 'items'} onClick={() => setTab('items')}>Products</TabBtn>
                        <TabBtn active={tab === 'saved_terms'} onClick={() => setTab('saved_terms')}>Terms</TabBtn>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full"><X size={20} /></button>
                </div>

                <div className="flex flex-col lg:flex-row h-full overflow-hidden">
                    {/* Form Panel */}
                    <div className="w-full lg:w-1/3 p-6 border-b lg:border-b-0 lg:border-r border-slate-100 bg-slate-50 overflow-y-auto">
                        <h3 className="font-bold text-slate-800 mb-4 uppercase text-xs tracking-wider">
                            {isEditing ? 'Edit' : 'Add New'} {tab === 'saved_terms' ? 'Term' : tab === 'items' ? 'Product' : 'Client'}
                        </h3>
                        <form onSubmit={handleSave} className="space-y-4">
                            {tab === 'clients' && (
                                <>
                                    <Input label="Name / Company" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                                    <Input label="Email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                                    <TextArea label="Address" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                                </>
                            )}
                            {tab === 'items' && (
                                <>
                                    <Input label="Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                                    <TextArea label="Description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                                    <div className="grid grid-cols-2 gap-2">
                                        <Input label="Price" type="number" value={formData.unit_price} onChange={e => setFormData({...formData, unit_price: e.target.value})} />
                                        <Input label="Tax %" type="number" value={formData.tax_rate} onChange={e => setFormData({...formData, tax_rate: e.target.value})} />
                                    </div>
                                </>
                            )}
                            {tab === 'saved_terms' && (
                                <>
                                    <Input label="Label" value={formData.label} onChange={e => setFormData({...formData, label: e.target.value})} placeholder="e.g. Standard Terms" required />
                                    <TextArea label="Content" rows={5} value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} />
                                </>
                            )}
                            <div className="flex gap-2 pt-2">
                                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700 transition shadow-sm">
                                    {isEditing ? 'Update Item' : 'Save Item'}
                                </button>
                                {isEditing && (
                                    <button type="button" onClick={() => { setIsEditing(null); setFormData({}); }} className="px-4 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300 font-medium">
                                        Cancel
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>

                    {/* List Panel */}
                    <div className="flex-1 p-6 overflow-y-auto bg-white">
                        {loading ? <p className="text-slate-400 text-center">Loading...</p> : 
                        items.length === 0 ? <p className="text-slate-400 text-center py-10">No items found. Add one on the left!</p> :
                        <div className="space-y-3">
                            {items.map(item => (
                                <div key={item.id} className={`p-4 border rounded-xl transition flex justify-between items-start group ${isEditing === item.id ? 'border-blue-500 bg-blue-50' : 'border-slate-100 hover:border-blue-200 hover:shadow-sm'}`}>
                                    <div>
                                        <div className="font-bold text-slate-800">{item.name || item.label}</div>
                                        <div className="text-xs text-slate-500 mt-1 line-clamp-2">{item.email || item.description || item.content}</div>
                                        {item.unit_price && <div className="text-xs font-bold text-blue-600 mt-1">${item.unit_price}</div>}
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => startEdit(item)} className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded transition" title="Edit"><Edit2 size={16} /></button>
                                        <button onClick={() => handleDelete(item.id)} className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded transition" title="Delete"><Trash2 size={16} /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        }
                    </div>
                </div>
            </div>
        </div>
    );
}

function TabBtn({ active, children, onClick }) {
    return (
        <button onClick={onClick} className={`px-4 py-2 rounded-lg text-sm font-bold transition ${active ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-200'}`}>
            {children}
        </button>
    );
}

function Input({ label, value, onChange, type='text', placeholder, required }) {
    return (
        <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{label}</label>
            <input type={type} value={value || ''} onChange={onChange} placeholder={placeholder} required={required} className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition text-sm" />
        </div>
    );
}

function TextArea({ label, value, onChange, rows=3, placeholder }) {
    return (
        <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{label}</label>
            <textarea value={value || ''} onChange={onChange} rows={rows} placeholder={placeholder} className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition resize-none text-sm" />
        </div>
    );
}

function getStatusColor(status) {
    switch (status) {
        case 'paid': return 'bg-green-100 text-green-700 hover:bg-green-200';
        case 'sent': return 'bg-blue-100 text-blue-700 hover:bg-blue-200';
        case 'overdue': return 'bg-red-100 text-red-700 hover:bg-red-200';
        default: return 'bg-slate-100 text-slate-600 hover:bg-slate-200';
    }
}

function StatCard({ icon, title, value, color, bg }) {
    return (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 transition hover:shadow-md h-full">
            <div className={`p-3 rounded-xl ${bg} ${color}`}>{icon}</div>
            <div>
                <p className="text-slate-500 text-sm font-medium">{title}</p>
                <p className="text-2xl font-bold text-slate-900">{value}</p>
            </div>
        </div>
    );
}

function LibraryCard({ icon, title, desc, onClick }) {
    return (
        <div onClick={onClick} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 transition hover:shadow-md hover:border-blue-300 group cursor-pointer">
            <div className="p-3 rounded-xl bg-slate-100 text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                {icon}
            </div>
            <div className="flex-grow">
                <div className="flex items-center justify-between">
                    <p className="text-slate-900 font-bold group-hover:text-blue-700 transition-colors">{title}</p>
                    <ArrowRight size={16} className="text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                </div>
                <p className="text-slate-500 text-xs mt-1">{desc}</p>
            </div>
        </div>
    );
}

function DashboardSkeleton() {
    return (
        <div className="min-h-screen bg-slate-50 p-6 lg:p-10 font-sans">
            <div className="max-w-7xl mx-auto space-y-8">
                <div className="flex justify-between items-center"><div className="h-8 w-48 bg-slate-200 rounded animate-pulse"></div><div className="h-10 w-32 bg-slate-200 rounded animate-pulse"></div></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">{[1, 2, 3].map(i => (<div key={i} className="h-32 bg-white rounded-2xl border border-slate-200 shadow-sm animate-pulse"></div>))}</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">{[1, 2, 3].map(i => (<div key={i} className="h-24 bg-white rounded-2xl border border-slate-200 shadow-sm animate-pulse"></div>))}</div>
                <div className="h-96 bg-white rounded-2xl border border-slate-200 shadow-sm animate-pulse"></div>
            </div>
        </div>
    );
}
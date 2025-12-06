'use client'
import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { calculateTotals } from '../../../utils/calculations';
import { supabase } from '../../../lib/supabaseClient';
import { PDFViewer, PDFDownloadLink } from '@react-pdf/renderer';
import InvoicePDF from '../../../components/InvoicePDF';
import { ChevronLeft, Save, Download, Plus, Trash2, Upload, X, Loader2, Users, Package, FileText, Edit2 } from 'lucide-react';
import Link from 'next/link';

const initialDocumentState = {
  document_number: 'QT-0001',
  type: 'quotation',
  issue_date: new Date().toISOString().substring(0, 10),
  due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10),
  subtotal: 0,
  tax_total: 0,
  grand_total: 0,
  client_name: '',
  client_address: '',
  client_email: '',
  notes: 'Payment is due within 7 days. Thank you for your business!',
  sender_name: '',
  sender_address: '',
  sender_email: '',
  logo_url: null,
  items: [
    { id: 1, description: 'Professional Services', quantity: 1, unit_price: 0, tax_rate: 0, amount: 0 },
  ],
};

export default function EditorPage() {
  const router = useRouter();
  const params = useParams();
  const documentId = params.id === 'new' ? null : params.id;
  
  const [document, setDocument] = useState(initialDocumentState);
  const [profile, setProfile] = useState({});
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [user, setUser] = useState(null);
  
  // MODAL STATES
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState(null); // 'clients', 'items', 'terms', 'save_prompt'
  const [libraryData, setLibraryData] = useState([]);
  
  // Library Management State
  const [libraryView, setLibraryView] = useState('list'); 
  const [libraryForm, setLibraryForm] = useState({});
  const [libraryEditingId, setLibraryEditingId] = useState(null);

  // Smart Save State
  const [newClientData, setNewClientData] = useState(null);
  const [newItemsData, setNewItemsData] = useState([]);
  
  const [activeTab, setActiveTab] = useState('edit');
  const nextNumberRef = useRef(1);

  // --- Initial Data Fetch ---
  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);

    let fetchedProfile = {};
    // 1. Fetch User Profile
    if (user) {
      const { data: profileData } = await supabase.from('business_profiles').select('*').eq('id', user.id).single();
      if (profileData) {
        fetchedProfile = profileData;
        setProfile(profileData);
      }
    }
    
    // 2. Determine Next Document Number
    let nextNumber = 1;
    if (user) {
        const { data: latestDoc } = await supabase.from('documents').select('document_number').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).single();
        if (latestDoc) {
            const numPart = latestDoc.document_number.match(/\d+$/);
            if (numPart) nextNumber = parseInt(numPart[0], 10) + 1;
        }
    }
    nextNumberRef.current = nextNumber;

    if (documentId) {
      // Load Existing
      const { data: docData } = await supabase.from('documents').select(`*, document_items(*)`).eq('id', documentId).single();
      if (docData) {
        setDocument(calculateTotals({ ...docData, items: docData.document_items.map(item => ({...item, id: item.id})) }));
      }
    } else {
        // Create New - Pre-fill with Profile Data
        const initial = { ...initialDocumentState };
        initial.sender_name = fetchedProfile.business_name || '';
        initial.sender_address = fetchedProfile.address_line_1 || '';
        initial.sender_email = fetchedProfile.email || '';
        initial.logo_url = fetchedProfile.logo_url;
        // Default number format
        initial.document_number = `${initial.type === 'invoice' ? 'INV' : 'QT'}-${String(nextNumber).padStart(4, '0')}`;
        setDocument(calculateTotals(initial));
    }
    setLoading(false);
  }, [documentId]);
  
  useEffect(() => { fetchInitialData(); }, [fetchInitialData]);
  useEffect(() => { setDocument((prev) => calculateTotals(prev)); }, [document.items, document.type]);

  // --- Library Logic ---
  const fetchLibraryData = async (type) => {
      const tableName = type === 'terms' ? 'saved_terms' : type;
      const { data } = await supabase.from(tableName).select('*').order('created_at', { ascending: false });
      setLibraryData(data || []);
  };

  const openLibrary = async (type) => {
      if (!user) return alert("Please log in to use the library.");
      setModalType(type);
      setLibraryView('list');
      setModalOpen(true);
      await fetchLibraryData(type);
  };

  // CRUD for Library inside Modal
  const handleLibrarySave = async (e) => {
      e.preventDefault();
      if (!user) return alert("Session expired. Please log in.");

      const tableName = modalType === 'terms' ? 'saved_terms' : modalType;
      const payload = { ...libraryForm, user_id: user.id };
      
      let error;
      if (libraryEditingId) {
          const { error: err } = await supabase.from(tableName).update(payload).eq('id', libraryEditingId);
          error = err;
      } else {
          const { error: err } = await supabase.from(tableName).insert(payload);
          error = err;
      }

      if (!error) {
          setLibraryForm({});
          setLibraryEditingId(null);
          setLibraryView('list');
          fetchLibraryData(modalType);
      } else {
          alert("Error saving: " + error.message);
      }
  };

  const handleLibraryDelete = async (id, e) => {
      e.stopPropagation();
      if(!confirm("Delete this item permanently?")) return;
      const tableName = modalType === 'terms' ? 'saved_terms' : modalType;
      await supabase.from(tableName).delete().eq('id', id);
      setLibraryData(libraryData.filter(i => i.id !== id));
  };

  const handleLibraryEdit = (item, e) => {
      e.stopPropagation();
      setLibraryForm(item);
      setLibraryEditingId(item.id);
      setLibraryView('form');
  };

  const handleSelectFromLibrary = (item) => {
      if (modalType === 'clients') {
          setDocument(prev => ({
              ...prev,
              client_name: item.name,
              client_email: item.email,
              client_address: item.address
          }));
      } else if (modalType === 'items') {
          const newItem = {
              id: Date.now(),
              description: item.name + (item.description ? ` - ${item.description}` : ''),
              quantity: 1,
              unit_price: item.unit_price,
              tax_rate: item.tax_rate,
              amount: 0 
          };
          setDocument(prev => ({ ...prev, items: [...prev.items, newItem] }));
      } else if (modalType === 'terms') {
          setDocument(prev => ({ ...prev, notes: item.content }));
      }
      setModalOpen(false);
  };

  // --- Handlers ---
  const handleChange = (e) => setDocument(prev => ({ ...prev, [e.target.name]: e.target.value }));
  
  const handleTypeChange = (e) => {
    const newType = e.target.value;
    setDocument(prev => {
        const newDoc = { ...prev, type: newType, document_number: `${newType === 'invoice' ? 'INV' : 'QT'}-${String(nextNumberRef.current).padStart(4, '0')}` };
        return calculateTotals(newDoc);
    });
  }

  const handleItemChange = (id, field, value) => {
    const newItems = document.items.map((item) => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        if (['quantity', 'unit_price', 'tax_rate'].includes(field)) {
             const q = parseFloat(updatedItem.quantity || 0);
             const p = parseFloat(updatedItem.unit_price || 0);
             const t = parseFloat(updatedItem.tax_rate || 0);
             updatedItem.amount = (q * p) + ((q * p) * (t / 100));
        }
        return updatedItem;
      }
      return item;
    });
    setDocument(prev => ({ ...prev, items: newItems }));
  };

  const addItem = () => setDocument(prev => ({ ...prev, items: [...prev.items, { id: Date.now(), description: '', quantity: 1, unit_price: 0, tax_rate: 0, amount: 0 }] }));
  const removeItem = (id) => setDocument(prev => ({ ...prev, items: prev.items.filter(i => i.id !== id) }));

  // --- SMART SAVE LOGIC ---
  const handleSaveClick = async () => {
      if (!user) return router.push('/login');
      setIsSaving(true);

      let potentialNewClient = null;
      let potentialNewItems = [];

      if (document.client_name) {
          const { data: existingClients } = await supabase.from('clients').select('id').eq('name', document.client_name).limit(1);
          if (!existingClients || existingClients.length === 0) {
              potentialNewClient = {
                  name: document.client_name,
                  email: document.client_email,
                  address: document.client_address
              };
          }
      }

      for (const item of document.items) {
          if (item.description && item.description.length > 3) {
             const namePart = item.description.split(' - ')[0]; 
             const { data: existingItems } = await supabase.from('items').select('id').ilike('name', namePart).limit(1);
             if (!existingItems || existingItems.length === 0) {
                 potentialNewItems.push({
                     name: namePart,
                     description: item.description,
                     unit_price: item.unit_price,
                     tax_rate: item.tax_rate
                 });
             }
          }
      }

      potentialNewItems = potentialNewItems.filter((v,i,a)=>a.findIndex(v2=>(v2.name===v.name))===i);

      if (potentialNewClient || potentialNewItems.length > 0) {
          setNewClientData(potentialNewClient);
          setNewItemsData(potentialNewItems);
          setModalType('save_prompt');
          setModalOpen(true);
          setIsSaving(false); 
      } else {
          finalizeSave();
      }
  };

  const handleSmartSaveConfirm = async (saveClient, saveItems) => {
      if (!user) return; // Guard against null user
      if (saveClient && newClientData) {
          await supabase.from('clients').insert({ ...newClientData, user_id: user.id });
      }
      if (saveItems && newItemsData.length > 0) {
          const itemsToSave = newItemsData.map(i => ({ ...i, user_id: user.id }));
          await supabase.from('items').insert(itemsToSave);
      }
      setModalOpen(false);
      setIsSaving(true);
      finalizeSave();
  };

  const finalizeSave = async () => {
    if (!user) {
        setIsSaving(false);
        return alert("User session lost. Please login again.");
    }

    const docData = {
      user_id: user.id,
      document_number: document.document_number,
      type: document.type,
      issue_date: document.issue_date,
      due_date: document.due_date,
      subtotal: document.subtotal,
      tax_total: document.tax_total,
      grand_total: document.grand_total,
      client_name: document.client_name,
      client_address: document.client_address,
      client_email: document.client_email,
      notes: document.notes,
      sender_name: document.sender_name,
      sender_address: document.sender_address,
      sender_email: document.sender_email,
      logo_url: document.logo_url || profile.logo_url,
    };

    let savedId = documentId;
    let errorMsg = null;

    if (documentId) {
      const { error } = await supabase.from('documents').update(docData).eq('id', documentId);
      if (error) errorMsg = error.message;
      else {
          await supabase.from('document_items').delete().eq('document_id', documentId);
      }
    } else {
      const { data, error } = await supabase.from('documents').insert(docData).select().single();
      if (error) errorMsg = error.message;
      else if (data) {
          savedId = data.id; 
      } else {
          errorMsg = "No data returned from insert. Check RLS policies.";
      }
    }

    if (errorMsg) {
        setIsSaving(false);
        return alert(`Error saving document: ${errorMsg}`);
    }

    const itemsData = document.items.map(i => ({
        document_id: savedId, description: i.description, quantity: i.quantity, unit_price: i.unit_price, tax_rate: i.tax_rate, amount: i.amount
    }));
    await supabase.from('document_items').insert(itemsData);
    
    setIsSaving(false);
    if (!documentId) router.push(`/editor/${savedId}`);
    else alert('Document saved successfully!');
  };

  const handleLogoUpload = async (event) => { /* Reuse logic from before */ }; 
  const removeLogo = async () => { /* Reuse logic from before */ };

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-50 text-slate-500">Loading workspace...</div>;

  const currentLogoUrl = document.logo_url || profile.logo_url;
  const documentForPDF = { ...document, logo_url: currentLogoUrl };

  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-900 font-sans relative">
      
      {/* 1. Header */}
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 shrink-0 sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-4">
            <Link href="/dashboard" className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition"><ChevronLeft size={20} /></Link>
            <h1 className="font-bold text-lg hidden sm:block">{documentId ? 'Edit Document' : 'New Document'}</h1>
        </div>
        <div className="flex gap-2">
            <button onClick={handleSaveClick} disabled={isSaving} className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-800 transition shadow-md">
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} 
                <span className="hidden sm:inline">{isSaving ? 'Saving...' : 'Save'}</span>
            </button>
        </div>
      </header>

      {/* 2. Main Content */}
      <div className="flex flex-grow overflow-hidden">
        
        {/* LEFT PANEL */}
        <div className={`w-full lg:w-1/2 overflow-y-auto p-4 lg:p-8 space-y-6 ${activeTab === 'edit' ? 'block' : 'hidden lg:block'}`}>
            
            {/* RESTORED: Document Info Card (Type, Ref, Dates) */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-2">Document Info</h2>
                <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 sm:col-span-1">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Type</label>
                        <select name="type" value={document.type} onChange={handleTypeChange} className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none text-sm">
                            <option value="quotation">Quotation</option>
                            <option value="invoice">Invoice</option>
                        </select>
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Ref #</label>
                        <input name="document_number" value={document.document_number} onChange={handleChange} className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-mono" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Issue Date</label>
                        <input type="date" name="issue_date" value={document.issue_date} onChange={handleChange} className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{document.type === 'invoice' ? 'Due Date' : 'Valid Until'}</label>
                        <input type="date" name="due_date" value={document.due_date} onChange={handleChange} className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                    </div>
                </div>
            </div>

            {/* Parties */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
                     <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-2">From (You)</h2>
                     <input name="sender_name" placeholder="Business Name" value={document.sender_name} onChange={handleChange} className="w-full p-2 border-b border-slate-100 focus:border-blue-500 outline-none text-sm" />
                     <input name="sender_email" placeholder="Email" value={document.sender_email} onChange={handleChange} className="w-full p-2 border-b border-slate-100 focus:border-blue-500 outline-none text-sm" />
                     <textarea name="sender_address" placeholder="Address" value={document.sender_address} onChange={handleChange} rows={2} className="w-full p-2 border-b border-slate-100 focus:border-blue-500 outline-none text-sm resize-none" />
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
                     <div className="flex justify-between items-center mb-2">
                        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Bill To</h2>
                        {user && <button onClick={() => openLibrary('clients')} className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1"><Users size={12}/> Select Saved</button>}
                     </div>
                     <input name="client_name" placeholder="Client Name" value={document.client_name} onChange={handleChange} className="w-full p-2 border-b border-slate-100 focus:border-blue-500 outline-none text-sm" />
                     <input name="client_email" placeholder="Client Email" value={document.client_email} onChange={handleChange} className="w-full p-2 border-b border-slate-100 focus:border-blue-500 outline-none text-sm" />
                     <textarea name="client_address" placeholder="Client Address" value={document.client_address} onChange={handleChange} rows={2} className="w-full p-2 border-b border-slate-100 focus:border-blue-500 outline-none text-sm resize-none" />
                </div>
            </div>

            {/* Items */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Line Items</h2>
                    {user && <button onClick={() => openLibrary('items')} className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1"><Package size={12}/> Add Saved Item</button>}
                </div>
                <div className="space-y-3">
                    {document.items.map((item) => (
                        <div key={item.id} className="flex gap-3 items-start p-3 bg-slate-50 rounded-lg border border-slate-100">
                             <div className="flex-grow space-y-2">
                                <input name="description" placeholder="Description" value={item.description} onChange={(e) => handleItemChange(item.id, 'description', e.target.value)} className="w-full bg-transparent border-b border-slate-200 focus:border-blue-500 outline-none text-sm font-medium" />
                                <div className="flex gap-2">
                                    <div className="w-20"><input type="number" name="quantity" value={item.quantity} onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)} className="w-full bg-white p-1 rounded border border-slate-200 text-xs" /></div>
                                    <div className="w-24"><input type="number" name="unit_price" value={item.unit_price} onChange={(e) => handleItemChange(item.id, 'unit_price', e.target.value)} className="w-full bg-white p-1 rounded border border-slate-200 text-xs" /></div>
                                    <div className="w-20"><input type="number" name="tax_rate" value={item.tax_rate} onChange={(e) => handleItemChange(item.id, 'tax_rate', e.target.value)} className="w-full bg-white p-1 rounded border border-slate-200 text-xs" /></div>
                                </div>
                             </div>
                             <div className="text-right pt-6">
                                <div className="text-sm font-bold">${item.amount.toFixed(2)}</div>
                                <button onClick={() => removeItem(item.id)} className="text-red-400 hover:text-red-600 mt-2"><Trash2 size={14} /></button>
                             </div>
                        </div>
                    ))}
                </div>
                <button onClick={addItem} className="flex items-center gap-2 text-blue-600 text-sm font-bold hover:underline mt-2"><Plus size={16} /> Add Line Item</button>
            </div>

            {/* Notes */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-center mb-2">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Terms & Notes</h2>
                    {user && <button onClick={() => openLibrary('terms')} className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1"><FileText size={12}/> Insert Saved Terms</button>}
                </div>
                <textarea name="notes" value={document.notes} onChange={handleChange} rows={3} className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none" />
            </div>
        </div>

        {/* RIGHT PANEL */}
        <div className={`w-full lg:w-1/2 bg-slate-100 overflow-y-auto flex flex-col items-center p-8 lg:p-12 ${activeTab === 'preview' ? 'block' : 'hidden lg:flex'}`}>
            <div className="w-full max-w-md mb-6 flex justify-between items-center">
                 <h2 className="text-slate-500 font-bold uppercase text-sm tracking-wider">Live Preview</h2>
                 <PDFDownloadLink document={<InvoicePDF document={documentForPDF} />} fileName={`${document.document_number}.pdf`}>
                    {({ loading }) => (
                         <button className="flex items-center gap-2 text-blue-600 font-bold text-sm hover:underline">
                            <Download size={16} /> {loading ? 'Preparing...' : 'Download PDF'}
                         </button>
                    )}
                 </PDFDownloadLink>
            </div>
            <div className="bg-white w-full max-w-[210mm] aspect-[1/1.414] shadow-2xl rounded-sm overflow-hidden border border-slate-200 transition-transform duration-300">
                 <PDFViewer width="100%" height="100%" showToolbar={false} className="w-full h-full">
                     <InvoicePDF document={documentForPDF} />
                 </PDFViewer>
            </div>
        </div>

      </div>

      {/* --- MODALS --- */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden max-h-[80vh] flex flex-col">
                
                {/* SELECT/MANAGE FROM LIBRARY MODE */}
                {modalType !== 'save_prompt' && (
                    <>
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-slate-800 capitalize">
                                    {libraryView === 'form' ? (libraryEditingId ? 'Edit ' : 'Add New ') : 'Select '} 
                                    {modalType === 'items' ? 'Product' : modalType === 'terms' ? 'Terms' : modalType.slice(0, -1)}
                                </h3>
                            </div>
                            <div className="flex gap-2">
                                {libraryView === 'list' && (
                                    <button onClick={() => { setLibraryForm({}); setLibraryEditingId(null); setLibraryView('form'); }} className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 font-bold flex items-center gap-1">
                                        <Plus size={12} /> New
                                    </button>
                                )}
                                <button onClick={() => setModalOpen(false)}><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
                            </div>
                        </div>

                        <div className="p-4 overflow-y-auto space-y-2 flex-grow">
                            {libraryView === 'list' ? (
                                libraryData.length === 0 ? (
                                    <div className="text-center py-8">
                                        <p className="text-slate-400 text-sm mb-2">No items found.</p>
                                        <button onClick={() => { setLibraryForm({}); setLibraryView('form'); }} className="text-blue-600 font-bold text-xs hover:underline">Create One</button>
                                    </div>
                                ) : (
                                    libraryData.map(item => (
                                        <div key={item.id} onClick={() => handleSelectFromLibrary(item)} className="p-3 border border-slate-100 rounded-lg hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition flex justify-between items-center group">
                                            <div className="flex-grow">
                                                <div className="font-bold text-slate-800 text-sm">{item.name || item.label}</div>
                                                <div className="text-xs text-slate-500 truncate w-48">{item.email || item.description || item.content}</div>
                                                {item.unit_price && <div className="text-xs font-bold text-blue-600 mt-1">${item.unit_price}</div>}
                                            </div>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={(e) => handleLibraryEdit(item, e)} className="p-1.5 text-blue-500 hover:bg-blue-100 rounded"><Edit2 size={14}/></button>
                                                <button onClick={(e) => handleLibraryDelete(item.id, e)} className="p-1.5 text-red-500 hover:bg-red-100 rounded"><Trash2 size={14}/></button>
                                            </div>
                                        </div>
                                    ))
                                )
                            ) : (
                                // FORM VIEW
                                <form onSubmit={handleLibrarySave} className="space-y-3">
                                    {modalType === 'clients' && (
                                        <>
                                            <Input label="Name" value={libraryForm.name} onChange={e => setLibraryForm({...libraryForm, name: e.target.value})} required />
                                            <Input label="Email" value={libraryForm.email} onChange={e => setLibraryForm({...libraryForm, email: e.target.value})} />
                                            <TextArea label="Address" value={libraryForm.address} onChange={e => setLibraryForm({...libraryForm, address: e.target.value})} />
                                        </>
                                    )}
                                    {modalType === 'items' && (
                                        <>
                                            <Input label="Name" value={libraryForm.name} onChange={e => setLibraryForm({...libraryForm, name: e.target.value})} required />
                                            <TextArea label="Description" value={libraryForm.description} onChange={e => setLibraryForm({...libraryForm, description: e.target.value})} />
                                            <div className="grid grid-cols-2 gap-2">
                                                <Input label="Price" type="number" value={libraryForm.unit_price} onChange={e => setLibraryForm({...libraryForm, unit_price: e.target.value})} />
                                                <Input label="Tax %" type="number" value={libraryForm.tax_rate} onChange={e => setLibraryForm({...libraryForm, tax_rate: e.target.value})} />
                                            </div>
                                        </>
                                    )}
                                    {modalType === 'terms' && (
                                        <>
                                            <Input label="Label (e.g. Standard)" value={libraryForm.label} onChange={e => setLibraryForm({...libraryForm, label: e.target.value})} required />
                                            <TextArea label="Content" rows={5} value={libraryForm.content} onChange={e => setLibraryForm({...libraryForm, content: e.target.value})} />
                                        </>
                                    )}
                                    <div className="flex gap-2 pt-2">
                                        <button type="button" onClick={() => setLibraryView('list')} className="flex-1 py-2 text-slate-500 hover:bg-slate-100 rounded text-sm font-bold">Cancel</button>
                                        <button type="submit" className="flex-1 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-bold">Save</button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </>
                )}

                {/* SAVE PROMPT MODE */}
                {modalType === 'save_prompt' && (
                    <SavePrompt 
                        newClient={newClientData} 
                        newItems={newItemsData}
                        onConfirm={handleSmartSaveConfirm}
                        onCancel={() => { setModalOpen(false); finalizeSave(); }} 
                    />
                )}
            </div>
        </div>
      )}

    </div>
  );
}

// Reusable Inputs for Modal
const Input = ({ label, value, onChange, type='text', placeholder, required }) => (
    <div>
        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">{label}</label>
        <input type={type} value={value || ''} onChange={onChange} placeholder={placeholder} required={required} className="w-full p-2 border border-slate-200 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
    </div>
);

const TextArea = ({ label, value, onChange, rows=2, placeholder }) => (
    <div>
        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">{label}</label>
        <textarea value={value || ''} onChange={onChange} rows={rows} placeholder={placeholder} className="w-full p-2 border border-slate-200 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none" />
    </div>
);

const SavePrompt = ({ newClient, newItems, onConfirm, onCancel }) => {
    const [saveClient, setSaveClient] = useState(!!newClient);
    const [saveItems, setSaveItems] = useState(!!newItems.length);

    return (
        <div className="p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-2">New Data Detected</h3>
            <p className="text-sm text-slate-500 mb-6">Would you like to save these new details to your library?</p>
            
            <div className="space-y-3 mb-6">
                {newClient && (
                    <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                        <input type="checkbox" checked={saveClient} onChange={e => setSaveClient(e.target.checked)} className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500" />
                        <div>
                            <div className="font-bold text-sm text-slate-800">Save Client: {newClient.name}</div>
                        </div>
                    </label>
                )}
                {newItems.length > 0 && (
                    <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                        <input type="checkbox" checked={saveItems} onChange={e => setSaveItems(e.target.checked)} className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500" />
                        <div>
                            <div className="font-bold text-sm text-slate-800">Save {newItems.length} New Item{newItems.length > 1 ? 's' : ''}</div>
                            <div className="text-xs text-slate-500">{newItems.map(i => i.name).join(', ')}</div>
                        </div>
                    </label>
                )}
            </div>

            <div className="flex gap-3">
                <button onClick={onCancel} className="flex-1 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-lg transition">No, Skip</button>
                <button onClick={() => onConfirm(saveClient, saveItems)} className="flex-1 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition">Yes, Save & Continue</button>
            </div>
        </div>
    );
};
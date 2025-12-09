'use client'
import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { calculateTotals } from '../../../utils/calculations';
import { supabase } from '../../../lib/supabaseClient';
import dynamic from 'next/dynamic';
import { pdf } from '@react-pdf/renderer'; 
import InvoicePDF from '../../../components/InvoicePDF';
import { ChevronLeft, Save, Download, Plus, Trash2, Upload, X, Loader2, Users, Package, FileText, Edit2, Eye, Globe } from 'lucide-react';
import Link from 'next/link';

// Dynamically import PDFViewer to avoid SSR issues and heavy loading on mobile
const PDFViewer = dynamic(
  () => import('@react-pdf/renderer').then((mod) => mod.PDFViewer),
  { ssr: false, loading: () => <div className="flex items-center justify-center h-full text-slate-400">Loading Preview...</div> }
);

// Comprehensive Currency List
const CURRENCIES = [
  { code: 'AED', label: 'AED - UAE Dirham', symbol: 'dh' },
  { code: 'USD', label: 'USD - US Dollar', symbol: '$' },
  { code: 'EUR', label: 'EUR - Euro', symbol: '€' },
  { code: 'GBP', label: 'GBP - British Pound', symbol: '£' },
  { code: 'INR', label: 'INR - Indian Rupee', symbol: '₹' },
  { code: 'CAD', label: 'CAD - Canadian Dollar', symbol: '$' },
  { code: 'AUD', label: 'AUD - Australian Dollar', symbol: '$' },
  { code: 'JPY', label: 'JPY - Japanese Yen', symbol: '¥' },
  { code: 'CNY', label: 'CNY - Chinese Yuan', symbol: '¥' },
  { code: 'SGD', label: 'SGD - Singapore Dollar', symbol: '$' },
  { code: 'CHF', label: 'CHF - Swiss Franc', symbol: 'Fr' },
  { code: 'ZAR', label: 'ZAR - South African Rand', symbol: 'R' },
  { code: 'SAR', label: 'SAR - Saudi Riyal', symbol: '﷼' },
  // Add more as needed
];

const initialDocumentState = {
  document_number: 'QT-0001',
  type: 'quotation',
  currency: 'AED', // Default Currency Updated
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
    { id: 1, description: '', quantity: 1, unit_price: 0, tax_rate: 0, amount: 0 },
  ],
};

// Helper to format currency dynamically
const formatCurrency = (amount, currencyCode = 'AED') => {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
    }).format(amount);
  } catch (e) {
    return `${currencyCode} ${Number(amount).toFixed(2)}`;
  }
};

export default function EditorPage() {
  const router = useRouter();
  const params = useParams();
  const documentId = params.id === 'new' ? null : params.id;
  
  const [document, setDocument] = useState(initialDocumentState);
  // Separate state for the PDF to prevent render crashes on rapid updates
  const [debouncedDocument, setDebouncedDocument] = useState(initialDocumentState);
  const [pdfUrl, setPdfUrl] = useState(null); 
  
  const [profile, setProfile] = useState({});
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [user, setUser] = useState(null);
  
  // Responsive State
  const [isDesktop, setIsDesktop] = useState(false);

  // MODAL STATES
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState(null); 
  const [libraryData, setLibraryData] = useState([]);
  
  // Library Management State
  const [libraryView, setLibraryView] = useState('list'); 
  const [libraryForm, setLibraryForm] = useState({});
  const [libraryEditingId, setLibraryEditingId] = useState(null);

  // Smart Save State
  const [newClientData, setNewClientData] = useState(null);
  const [newItemsData, setNewItemsData] = useState([]);
  
  const nextNumberRef = useRef(1);

  // --- DEBOUNCE EFFECT FOR DOCUMENT STATE ---
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedDocument(document);
    }, 600);
    return () => clearTimeout(handler);
  }, [document]);

  // --- PDF BLOB GENERATION EFFECT (Replaces PDFViewer) ---
  useEffect(() => {
    let isMounted = true;
    const generatePdfPreview = async () => {
      if (!isDesktop) return; // Save resources on mobile
      try {
        const currentLogoUrl = document.logo_url || profile.logo_url;
        const docData = { ...debouncedDocument, logo_url: currentLogoUrl };
        
        // Generate Blob manually
        const blob = await pdf(<InvoicePDF document={docData} />).toBlob();
        const url = URL.createObjectURL(blob);
        
        if (isMounted) {
            setPdfUrl(prev => {
                if (prev) URL.revokeObjectURL(prev); // Cleanup memory
                return url;
            });
        }
      } catch (err) {
          console.error("Preview Generation Error:", err);
      }
    };
    
    generatePdfPreview();
    return () => { isMounted = false; };
  }, [debouncedDocument, profile.logo_url, isDesktop]);


  // --- Check Screen Size ---
  useEffect(() => {
    const checkScreen = () => setIsDesktop(window.innerWidth >= 1024);
    checkScreen();
    window.addEventListener('resize', checkScreen);
    return () => window.removeEventListener('resize', checkScreen);
  }, []);

  // --- Initial Data Fetch ---
  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);

    let fetchedProfile = {};
    if (user) {
      const { data: profileData } = await supabase.from('business_profiles').select('*').eq('id', user.id).single();
      if (profileData) {
        fetchedProfile = profileData;
        setProfile(profileData);
      }
    }
    
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
      const { data: docData } = await supabase.from('documents').select(`*, document_items(*)`).eq('id', documentId).single();
      if (docData) {
        const fullDoc = calculateTotals({ ...docData, items: docData.document_items.map(item => ({...item, id: item.id})) });
        // Ensure currency is set, fallback to AED if older doc (or USD if preferred fallback logic)
        if (!fullDoc.currency) fullDoc.currency = 'AED';
        setDocument(fullDoc);
        setDebouncedDocument(fullDoc); 
      }
    } else {
        const initial = { ...initialDocumentState };
        initial.sender_name = fetchedProfile.business_name || '';
        initial.sender_address = fetchedProfile.address_line_1 || '';
        initial.sender_email = fetchedProfile.email || '';
        initial.logo_url = fetchedProfile.logo_url;
        initial.document_number = `${initial.type === 'invoice' ? 'INV' : 'QT'}-${String(nextNumber).padStart(4, '0')}`;
        setDocument(calculateTotals(initial));
        setDebouncedDocument(calculateTotals(initial));
    }
    setLoading(false);
  }, [documentId]);
  
  useEffect(() => { fetchInitialData(); }, [fetchInitialData]);
  
  // Recalculate totals on item change
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
      if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
      if (typeof window !== 'undefined' && !window.confirm("Delete this item permanently?")) return;

      const tableName = modalType === 'terms' ? 'saved_terms' : modalType;
      await supabase.from(tableName).delete().eq('id', id);
      setLibraryData(libraryData.filter(i => i.id !== id));
  };

  const handleLibraryEdit = (item, e) => {
      if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
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
  
  // SAFE REMOVE ITEM
  const removeItem = (id) => {
      if (typeof window !== 'undefined' && !window.confirm("Remove this line item?")) {
          return;
      }
      setDocument(prev => ({ ...prev, items: prev.items.filter(i => i.id !== id) }));
  };

  // --- PDF Generation (On Demand) ---
  const handleDownloadPdf = async () => {
      setIsDownloading(true);
      try {
          const docData = {
              ...document,
              logo_url: document.logo_url || profile.logo_url
          };
          
          const blob = await pdf(<InvoicePDF document={docData} />).toBlob();
          const url = URL.createObjectURL(blob);
          
          const link = window.document.createElement('a');
          link.href = url;
          link.download = `${document.document_number || 'document'}.pdf`;
          window.document.body.appendChild(link);
          link.click();
          window.document.body.removeChild(link);
      } catch (error) {
          console.error("PDF Gen Error:", error);
          alert("Failed to generate PDF. Please try again.");
      } finally {
          setIsDownloading(false);
      }
  };

  // --- Save Logic ---
  const handleSaveClick = async () => {
      if (!user) return router.push('/login');
      setIsSaving(true);

      let potentialNewClient = null;
      let potentialNewItems = [];

      if (document.client_name && document.client_name.length > 2) {
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
      currency: document.currency,
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

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-50 text-slate-500">Loading workspace...</div>;

  const currentLogoUrl = document.logo_url || profile.logo_url;
  
  // Use debounced document for PDF to prevent crashes during typing/deleting
  const documentForPDF = { 
      ...debouncedDocument, 
      logo_url: currentLogoUrl 
  };

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

      {/* 3. Main Content */}
      <div className="flex flex-grow overflow-hidden">
        
        {/* LEFT PANEL: Editor (Always visible on mobile) */}
        <div className="w-full lg:w-1/2 overflow-y-auto p-4 lg:p-8 space-y-6">
            
            {/* Document Info Card - Updated with Currency */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-2">Document Info</h2>
                <div className="grid grid-cols-2 gap-4">
                    
                    {/* NEW: Currency Selector */}
                    <div className="col-span-2">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
                            <Globe size={12} /> Currency
                        </label>
                        <select 
                            name="currency" 
                            value={document.currency} 
                            onChange={handleChange} 
                            className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
                        >
                            {CURRENCIES.map(c => (
                                <option key={c.code} value={c.code}>{c.label}</option>
                            ))}
                        </select>
                    </div>

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
                <div className="space-y-4">
                    {document.items.map((item) => (
                        <div key={item.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 shadow-sm transition hover:border-slate-300">
                             
                             <div className="mb-3">
                                <input 
                                    name="description" 
                                    placeholder="Enter your product or service" 
                                    value={item.description} 
                                    onChange={(e) => handleItemChange(item.id, 'description', e.target.value)} 
                                    className="w-full bg-transparent border-b border-slate-200 focus:border-blue-500 outline-none text-sm font-medium placeholder:text-slate-400" 
                                />
                             </div>

                             <div className="grid grid-cols-3 gap-3 mb-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Qty</label>
                                    <input type="number" name="quantity" value={item.quantity} onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)} className="w-full bg-white p-2 border border-slate-200 rounded-lg text-sm text-center" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Price</label>
                                    <input type="number" name="unit_price" value={item.unit_price} onChange={(e) => handleItemChange(item.id, 'unit_price', e.target.value)} className="w-full bg-white p-2 border border-slate-200 rounded-lg text-sm text-center" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Tax %</label>
                                    <input type="number" name="tax_rate" value={item.tax_rate} onChange={(e) => handleItemChange(item.id, 'tax_rate', e.target.value)} className="w-full bg-white p-2 border border-slate-200 rounded-lg text-sm text-center" />
                                </div>
                             </div>

                             <div className="flex justify-between items-center pt-3 border-t border-slate-200">
                                <div className="text-sm">
                                    <span className="text-slate-400 text-xs font-bold uppercase mr-2">Total:</span>
                                    <span className="font-bold text-slate-900 text-base">{formatCurrency(item.amount, document.currency)}</span>
                                </div>
                                <button type="button" onClick={() => removeItem(item.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition">
                                    <Trash2 size={18} />
                                </button>
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

            {/* NEW: Mobile Download Button (Visible only on LG screens and below) */}
            <div className="lg:hidden mt-6 pt-4 border-t border-slate-200 pb-8 flex flex-col items-center">
                 <button 
                    onClick={handleDownloadPdf}
                    disabled={isDownloading}
                    className="flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-lg font-semibold text-sm shadow-md active:scale-95 transition"
                 >
                    <Download size={18} /> 
                    {isDownloading ? 'Preparing...' : 'Download PDF'}
                 </button>
            </div>

        </div>

        {/* RIGHT PANEL: Live Preview (Hidden on Mobile) */}
        <div className="hidden lg:flex w-full lg:w-1/2 bg-slate-100 overflow-y-auto flex-col items-center p-8 lg:p-12">
            <div className="w-full max-w-md mb-6 flex justify-between items-center">
                 <h2 className="text-slate-500 font-bold uppercase text-sm tracking-wider">Live Preview</h2>
                 {isDesktop && (
                    <button 
                        onClick={handleDownloadPdf}
                        disabled={isDownloading}
                        className="flex items-center gap-2 text-blue-600 font-bold text-sm hover:underline"
                    >
                        <Download size={16} /> {isDownloading ? 'Preparing...' : 'Download PDF'}
                    </button>
                 )}
            </div>
            {isDesktop && (
                <div className="bg-white w-full max-w-[210mm] aspect-[1/1.414] shadow-2xl rounded-sm overflow-hidden border border-slate-200 transition-transform duration-300">
                     {/* Replaced PDFViewer with secure Iframe */}
                     {pdfUrl ? (
                         <iframe 
                            src={`${pdfUrl}#toolbar=0&view=FitH`} 
                            className="w-full h-full border-none" 
                            title="PDF Preview"
                         />
                     ) : (
                         <div className="flex items-center justify-center h-full text-slate-400 animate-pulse">Generating Preview...</div>
                     )}
                </div>
            )}
        </div>
      </div>
      
      {/* Modal code kept as is (no changes needed) */}
      {/* ... keeping modal logic ... */}
      {modalOpen && <LibraryManager initialTab={modalType} onClose={() => setModalOpen(false)} />}
    </div>
  );
}

// ... Sub-components remain the same ...
// Including a dummy LibraryManager for compilation context if needed, but in real file usage, keep the existing one.
function LibraryManager({ initialTab, onClose }) { return <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"><div className="bg-white p-4 rounded">Modal Content</div></div>; }

import React, { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { 
  Plus, Save, Printer, ArrowLeft, FileText, History, Wand2, 
  Sparkles, Settings, Upload, X, Check, Download, Database, FileUp, Image as ImageIcon 
} from 'lucide-react';
import { Invoice, InvoiceItem, BusinessInfo } from './types';
import { DEFAULT_INTECH_INFO, DEFAULT_TAX_RATE } from './constants';
import InvoiceItemRow from './components/InvoiceItemRow';
import InvoicePreview from './components/InvoicePreview';
import { formatCurrency, calculateSubtotal, calculateTotal } from './utils/helpers';
import { generateInvoiceNotes } from './services/geminiService';

const STORAGE_KEY = 'intech_invoices_v2';
const BIZ_STORAGE_KEY = 'intech_business_v2';

const createEmptyInvoice = (): Invoice => ({
  id: crypto.randomUUID(),
  invoiceNumber: `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
  date: new Date().toISOString().split('T')[0],
  dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  client: { name: '', email: '', address: '', phone: '' },
  items: [{ id: crypto.randomUUID(), description: '', quantity: 1, unitPrice: 0 }],
  notes: '',
  status: 'Draft',
  taxRate: DEFAULT_TAX_RATE,
  discount: 0,
});

const App: React.FC = () => {
  // Lazy initialization from Local Storage
  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  const [businessInfo, setBusinessInfo] = useState<BusinessInfo>(() => {
    const saved = localStorage.getItem(BIZ_STORAGE_KEY);
    return saved ? JSON.parse(saved) : DEFAULT_INTECH_INFO;
  });

  const [activeInvoice, setActiveInvoice] = useState<Invoice | null>(null);
  const [view, setView] = useState<'list' | 'edit' | 'preview' | 'settings'>('list');
  const [isGeneratingNotes, setIsGeneratingNotes] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync states to Local Storage whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(invoices));
  }, [invoices]);

  useEffect(() => {
    localStorage.setItem(BIZ_STORAGE_KEY, JSON.stringify(businessInfo));
  }, [businessInfo]);

  const handleCreateNew = () => {
    const fresh = createEmptyInvoice();
    setActiveInvoice(fresh);
    setView('edit');
  };

  const handleSaveInvoice = () => {
    if (!activeInvoice) return;
    setInvoices(prev => {
      const idx = prev.findIndex(i => i.id === activeInvoice.id);
      if (idx > -1) {
        const updated = [...prev];
        updated[idx] = activeInvoice;
        return updated;
      }
      return [activeInvoice, ...prev];
    });
    setView('list');
  };

  const updateActiveInvoice = (updates: Partial<Invoice>) => {
    if (!activeInvoice) return;
    setActiveInvoice({ ...activeInvoice, ...updates });
  };

  const addItem = () => {
    if (!activeInvoice) return;
    const newItem: InvoiceItem = { id: crypto.randomUUID(), description: '', quantity: 1, unitPrice: 0 };
    updateActiveInvoice({ items: [...activeInvoice.items, newItem] });
  };

  const updateItem = (id: string, itemUpdates: Partial<InvoiceItem>) => {
    if (!activeInvoice) return;
    const newItems = activeInvoice.items.map(it => it.id === id ? { ...it, ...itemUpdates } : it);
    updateActiveInvoice({ items: newItems });
  };

  const removeItem = (id: string) => {
    if (!activeInvoice || activeInvoice.items.length <= 1) return;
    updateActiveInvoice({ items: activeInvoice.items.filter(it => it.id !== id) });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Limit file size to ~1MB for localStorage safety
      if (file.size > 1024 * 1024) {
        alert("Logo file is too large. Please use an image under 1MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setBusinessInfo(prev => ({ ...prev, logoUrl: reader.result as string }));
        showSaveFeedback();
      };
      reader.readAsDataURL(file);
    }
  };

  const showSaveFeedback = () => {
    setSaveStatus("Settings Saved Locally!");
    setTimeout(() => setSaveStatus(null), 3000);
  };

  const generateAInotes = async () => {
    if (!activeInvoice) return;
    setIsGeneratingNotes(true);
    const subtotal = calculateSubtotal(activeInvoice.items);
    const total = calculateTotal(subtotal, activeInvoice.taxRate, activeInvoice.discount);
    const notes = await generateInvoiceNotes(activeInvoice.client.name || 'valued client', formatCurrency(total));
    updateActiveInvoice({ notes });
    setIsGeneratingNotes(false);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!activeInvoice) return;
    const element = document.getElementById('invoice-preview');
    if (!element) return;

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width / 2, canvas.height / 2]
      });
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
      pdf.save(`Invoice_${activeInvoice.invoiceNumber}.pdf`);
    } catch (err) {
      console.error('PDF generation failed:', err);
      alert('Failed to generate PDF. Please use the Print option as a backup.');
    }
  };

  const handleDownloadJPEG = async () => {
    if (!activeInvoice) return;
    const element = document.getElementById('invoice-preview');
    if (!element) return;

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      const imgData = canvas.toDataURL('image/jpeg', 0.9);
      const link = document.createElement('a');
      link.href = imgData;
      link.download = `Invoice_${activeInvoice.invoiceNumber}.jpg`;
      link.click();
    } catch (err) {
      console.error('JPEG generation failed:', err);
      alert('Failed to generate JPEG.');
    }
  };

  const handleExportData = () => {
    const data = {
      invoices,
      businessInfo,
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `intech_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = JSON.parse(event.target?.result as string);
          if (content.invoices) setInvoices(content.invoices);
          if (content.businessInfo) setBusinessInfo(content.businessInfo);
          alert('Data imported successfully and saved to browser storage!');
        } catch (error) {
          alert('Invalid backup file format.');
        }
      };
      reader.readAsText(file);
    }
  };

  // Rendering
  if (view === 'list') {
    return (
      <div className="min-h-screen bg-slate-50 pb-20 no-print">
        <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
              {businessInfo.logoUrl && (
                <img src={businessInfo.logoUrl} alt="Logo" className="w-10 h-10 object-contain rounded border border-slate-100" />
              )}
              <div className="flex items-center gap-2">
                <div className="bg-blue-600 p-2 rounded-lg text-white">
                  <FileText size={24} />
                </div>
                <h1 className="text-xl font-bold text-slate-800 tracking-tight">{businessInfo.name}</h1>
              </div>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setView('settings')}
                className="text-slate-600 hover:bg-slate-100 p-2 rounded-lg transition-colors flex items-center gap-2"
                title="Business Settings & Backups"
              >
                <Settings size={20} /> <span className="hidden md:inline font-medium text-sm">Settings</span>
              </button>
              <button
                onClick={handleCreateNew}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-all shadow-lg shadow-blue-200"
              >
                <Plus size={20} /> Create Invoice
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
          <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-8 gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <History size={24} className="text-slate-400" /> Recent Invoices
              </h2>
              <p className="text-slate-500 mt-1 italic">Settings and invoices are saved automatically to this browser.</p>
            </div>
            <div className="flex gap-2">
               <button 
                onClick={handleExportData}
                className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 px-3 py-2 rounded-lg hover:bg-slate-50 transition-all shadow-sm"
               >
                 <Download size={14} /> Download System Backup
               </button>
            </div>
          </div>

          {invoices.length === 0 ? (
            <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-20 text-center">
              <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                <FileText size={32} />
              </div>
              <h3 className="text-lg font-semibold text-slate-800">No invoices yet</h3>
              <p className="text-slate-500 mt-1 mb-6">Start by creating your very first client invoice.</p>
              <button
                onClick={handleCreateNew}
                className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
              >
                Create My First Invoice
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {invoices.map(inv => (
                <div 
                  key={inv.id} 
                  className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group relative overflow-hidden"
                  onClick={() => { setActiveInvoice(inv); setView('edit'); }}
                >
                  <div className="absolute top-0 left-0 w-1 h-full bg-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-xs font-bold text-slate-400 tracking-widest uppercase">{inv.invoiceNumber}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      inv.status === 'Paid' ? 'bg-green-100 text-green-700' : 
                      inv.status === 'Sent' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {inv.status}
                    </span>
                  </div>
                  <h4 className="text-lg font-bold text-slate-800 truncate mb-1">{inv.client.name || 'Unnamed Client'}</h4>
                  <p className="text-slate-500 text-sm mb-4">{new Date(inv.date).toLocaleDateString()}</p>
                  <div className="flex justify-between items-center border-t border-slate-100 pt-4">
                    <span className="text-xl font-black text-slate-800">{formatCurrency(calculateTotal(calculateSubtotal(inv.items), inv.taxRate, inv.discount))}</span>
                    <span className="text-blue-600 font-medium group-hover:translate-x-1 transition-transform">Edit &rarr;</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    );
  }

  if (view === 'settings') {
    return (
      <div className="min-h-screen bg-slate-50 pb-20 no-print">
        <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
          <div className="max-w-3xl mx-auto px-4 py-4 flex justify-between items-center">
            <button onClick={() => setView('list')} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600">
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-xl font-bold text-slate-800">Business Settings</h1>
            <button 
              onClick={() => setView('list')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2"
            >
              <Check size={18} /> Done
            </button>
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-4 mt-10 space-y-8">
          {saveStatus && (
            <div className="bg-green-600 text-white p-3 rounded-lg text-center font-bold animate-bounce shadow-lg">
              {saveStatus}
            </div>
          )}

          {/* Data Management Section */}
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <h3 className="text-sm font-bold text-blue-600 uppercase tracking-widest flex items-center gap-2">
              <Database size={16} /> Data Management
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button 
                onClick={handleExportData}
                className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 rounded-2xl hover:border-blue-500 hover:bg-blue-50 transition-all group"
              >
                <Download size={32} className="text-slate-300 group-hover:text-blue-500 mb-2" />
                <span className="font-bold text-slate-700">Backup Profile</span>
                <span className="text-xs text-slate-500 text-center">Download settings & invoices as a file</span>
              </button>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 rounded-2xl hover:border-blue-500 hover:bg-blue-50 transition-all group"
              >
                <FileUp size={32} className="text-slate-300 group-hover:text-blue-500 mb-2" />
                <span className="font-bold text-slate-700">Restore Backup</span>
                <span className="text-xs text-slate-500 text-center">Upload a previously saved backup file</span>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept=".json" 
                  onChange={handleImportData}
                />
              </button>
            </div>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-8">
            <div className="flex flex-col items-center gap-4">
              <div className="relative group">
                <div className="w-40 h-40 bg-slate-100 rounded-2xl border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden">
                  {businessInfo.logoUrl ? (
                    <img src={businessInfo.logoUrl} alt="Logo" className="w-full h-full object-contain p-2" />
                  ) : (
                    <Upload size={32} className="text-slate-300" />
                  )}
                </div>
                <input 
                  type="file" 
                  className="absolute inset-0 opacity-0 cursor-pointer" 
                  onChange={handleLogoUpload}
                  accept="image/*"
                />
                {businessInfo.logoUrl && (
                  <button 
                    onClick={() => { setBusinessInfo(p => ({...p, logoUrl: ""})); showSaveFeedback(); }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white p-1.5 rounded-full shadow-lg hover:bg-red-600 transition-colors"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
              <div className="text-center">
                <h3 className="font-bold text-slate-800">Your Business Logo</h3>
                <p className="text-xs text-slate-500 mt-1">Logo is automatically saved to browser storage.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { label: 'Business Name', key: 'name' as const, type: 'text' },
                { label: 'Website', key: 'website' as const, type: 'text' },
                { label: 'Email Address', key: 'email' as const, type: 'email' },
                { label: 'Phone Number', key: 'phone' as const, type: 'text' },
                { label: 'Bank Name', key: 'bankName' as const, type: 'text' },
                { label: 'Account Number', key: 'accountNumber' as const, type: 'text' },
              ].map((field) => (
                <div key={field.key} className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">{field.label}</label>
                  <input 
                    type={field.type}
                    value={businessInfo[field.key]}
                    onChange={e => { setBusinessInfo(p => ({...p, [field.key]: e.target.value})); showSaveFeedback(); }}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>
              ))}
              <div className="md:col-span-2 space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Business Address</label>
                <textarea 
                  value={businessInfo.address}
                  onChange={e => { setBusinessInfo(p => ({...p, address: e.target.value})); showSaveFeedback(); }}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px] transition-all"
                />
              </div>
            </div>
            
            <div className="pt-6 border-t border-slate-100">
              <button 
                onClick={() => { setBusinessInfo(DEFAULT_INTECH_INFO); showSaveFeedback(); }}
                className="text-xs font-bold text-red-500 hover:text-red-600 underline"
              >
                Reset to Default INTECH Info
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (view === 'edit' && activeInvoice) {
    return (
      <div className="min-h-screen bg-slate-50 pb-24 no-print">
        <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
          <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
            <button onClick={() => setView('list')} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600">
              <ArrowLeft size={24} />
            </button>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setView('preview')}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg flex items-center gap-2 font-medium"
              >
                <Printer size={18} /> Preview & PDF
              </button>
              <button 
                onClick={handleSaveInvoice}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 font-bold shadow-lg shadow-blue-200 transition-all"
              >
                <Save size={18} /> Save & Exit
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 mt-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-sm font-bold text-blue-600 uppercase tracking-widest mb-6">Invoice Metadata</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500 uppercase">Invoice #</label>
                    <input 
                      type="text" 
                      value={activeInvoice.invoiceNumber}
                      onChange={e => updateActiveInvoice({ invoiceNumber: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500 uppercase">Issue Date</label>
                    <input 
                      type="date" 
                      value={activeInvoice.date}
                      onChange={e => updateActiveInvoice({ date: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500 uppercase">Due Date</label>
                    <input 
                      type="date" 
                      value={activeInvoice.dueDate}
                      onChange={e => updateActiveInvoice({ dueDate: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none" 
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-sm font-bold text-blue-600 uppercase tracking-widest">Line Items</h3>
                  <button 
                    onClick={addItem}
                    className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <Plus size={16} /> Add Item
                  </button>
                </div>
                <div className="space-y-4">
                  {activeInvoice.items.map(item => (
                    <InvoiceItemRow 
                      key={item.id} 
                      item={item} 
                      onUpdate={(u) => updateItem(item.id, u)}
                      onRemove={() => removeItem(item.id)}
                    />
                  ))}
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-bold text-blue-600 uppercase tracking-widest">Notes & Terms</h3>
                  <button 
                    onClick={generateAInotes}
                    disabled={isGeneratingNotes}
                    className="flex items-center gap-2 text-xs font-bold text-purple-600 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-full transition-colors disabled:opacity-50"
                  >
                    {isGeneratingNotes ? <Sparkles size={14} className="animate-pulse" /> : <Wand2 size={14} />}
                    AI Generate Note
                  </button>
                </div>
                <textarea 
                  value={activeInvoice.notes}
                  onChange={e => updateActiveInvoice({ notes: e.target.value })}
                  placeholder="Additional information, bank details, or terms..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none min-h-[120px]"
                />
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-sm font-bold text-blue-600 uppercase tracking-widest mb-6">Client Details</h3>
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500 uppercase">Client Name</label>
                    <input 
                      type="text"
                      placeholder="e.g. Acme Corp"
                      value={activeInvoice.client.name}
                      onChange={e => updateActiveInvoice({ client: { ...activeInvoice.client, name: e.target.value } })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500 uppercase">Email Address</label>
                    <input 
                      type="email"
                      placeholder="client@email.com"
                      value={activeInvoice.client.email}
                      onChange={e => updateActiveInvoice({ client: { ...activeInvoice.client, email: e.target.value } })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500 uppercase">Phone Number</label>
                    <input 
                      type="tel"
                      value={activeInvoice.client.phone}
                      onChange={e => updateActiveInvoice({ client: { ...activeInvoice.client, phone: e.target.value } })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500 uppercase">Address</label>
                    <textarea 
                      value={activeInvoice.client.address}
                      onChange={e => updateActiveInvoice({ client: { ...activeInvoice.client, address: e.target.value } })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none min-h-[80px]"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-blue-900 text-white p-6 rounded-xl shadow-xl shadow-blue-200">
                <h3 className="text-sm font-bold text-blue-300 uppercase tracking-widest mb-6">Total Calculation</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-blue-100">
                    <span>Subtotal</span>
                    <span>{formatCurrency(calculateSubtotal(activeInvoice.items))}</span>
                  </div>
                  <div className="flex items-center justify-between text-blue-100">
                    <label className="text-xs uppercase font-bold text-blue-300">Tax (%)</label>
                    <input 
                      type="number" 
                      value={activeInvoice.taxRate}
                      onChange={e => updateActiveInvoice({ taxRate: Number(e.target.value) })}
                      className="w-16 bg-blue-800 border border-blue-700 rounded text-right px-1 outline-none"
                    />
                  </div>
                  <div className="flex items-center justify-between text-blue-100">
                    <label className="text-xs uppercase font-bold text-blue-300">Discount (₦)</label>
                    <input 
                      type="number" 
                      value={activeInvoice.discount}
                      onChange={e => updateActiveInvoice({ discount: Number(e.target.value) })}
                      className="w-24 bg-blue-800 border border-blue-700 rounded text-right px-1 outline-none"
                    />
                  </div>
                  <div className="pt-4 border-t border-blue-800 flex justify-between items-center text-2xl font-black">
                    <span>Total</span>
                    <span>{formatCurrency(calculateTotal(calculateSubtotal(activeInvoice.items), activeInvoice.taxRate, activeInvoice.discount))}</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-sm font-bold text-blue-600 uppercase tracking-widest mb-4">Status</h3>
                <div className="grid grid-cols-3 gap-2">
                  {(['Draft', 'Sent', 'Paid'] as const).map(s => (
                    <button
                      key={s}
                      onClick={() => updateActiveInvoice({ status: s })}
                      className={`py-2 px-1 text-[10px] font-bold uppercase rounded-lg border transition-all ${
                        activeInvoice.status === s 
                        ? 'bg-blue-600 border-blue-600 text-white shadow-md' 
                        : 'bg-white border-slate-200 text-slate-400 hover:border-blue-300'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (view === 'preview' && activeInvoice) {
    return (
      <div className="min-h-screen bg-slate-800">
        <div className="fixed top-0 left-0 right-0 p-4 bg-slate-900 border-b border-slate-700 flex justify-between items-center no-print z-50">
          <button 
            onClick={() => setView('edit')}
            className="flex items-center gap-2 text-white hover:text-blue-400 transition-colors"
          >
            <ArrowLeft size={20} /> Back to Editor
          </button>
          <div className="flex flex-wrap justify-end gap-3">
            <button 
              onClick={handleDownloadPDF}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-bold transition-all shadow-lg"
            >
              <Download size={18} /> Download PDF
            </button>
            <button 
              onClick={handleDownloadJPEG}
              className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-bold transition-all shadow-lg"
            >
              <ImageIcon size={18} /> Download JPEG
            </button>
            <button 
              onClick={handlePrint}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg flex items-center gap-2 font-bold transition-all"
            >
              <Printer size={18} /> Print
            </button>
          </div>
        </div>

        <div className="pt-24 pb-12 px-4 no-print overflow-auto">
          <InvoicePreview invoice={activeInvoice} businessInfo={businessInfo} />
        </div>

        <div className="hidden print:block absolute inset-0 bg-white">
          <InvoicePreview invoice={activeInvoice} businessInfo={businessInfo} />
        </div>
      </div>
    );
  }

  return null;
};

export default App;

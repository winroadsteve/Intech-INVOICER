
import React from 'react';
import { Invoice, BusinessInfo } from '../types';
import { formatCurrency, formatDate, calculateSubtotal, calculateTotal } from '../utils/helpers';
import { Globe, Mail, Phone, MapPin } from 'lucide-react';

interface Props {
  invoice: Invoice;
  businessInfo: BusinessInfo;
}

const InvoicePreview: React.FC<Props> = ({ invoice, businessInfo }) => {
  const subtotal = calculateSubtotal(invoice.items);
  const total = calculateTotal(subtotal, invoice.taxRate, invoice.discount);

  return (
    <div id="invoice-preview" className="bg-white p-8 md:p-12 shadow-xl border border-slate-200 max-w-4xl mx-auto min-h-[1000px] flex flex-col print:shadow-none print:border-none print:m-0 print:p-8">
      {/* Header */}
      <div className="flex justify-between items-start border-b-2 border-slate-100 pb-8 mb-8">
        <div className="flex gap-6 items-start">
          {businessInfo.logoUrl && (
            <div className="w-20 h-20 flex-shrink-0 bg-slate-50 rounded-lg overflow-hidden border border-slate-100 flex items-center justify-center">
              <img src={businessInfo.logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
            </div>
          )}
          <div>
            <h1 className="text-4xl font-black text-blue-900 tracking-tighter mb-2">{businessInfo.name}</h1>
            <div className="space-y-1 text-slate-500 text-sm">
              {businessInfo.address && <div className="flex items-center gap-2"><MapPin size={14} /> {businessInfo.address}</div>}
              {businessInfo.phone && <div className="flex items-center gap-2"><Phone size={14} /> {businessInfo.phone}</div>}
              {businessInfo.email && <div className="flex items-center gap-2"><Mail size={14} /> {businessInfo.email}</div>}
              {businessInfo.website && <div className="flex items-center gap-2 font-medium text-blue-600"><Globe size={14} /> {businessInfo.website}</div>}
            </div>
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-5xl font-bold text-slate-300 mb-4 uppercase">Invoice</h2>
          <div className="text-slate-600 font-bold text-lg">#{invoice.invoiceNumber}</div>
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-2 gap-12 mb-12">
        <div>
          <h3 className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-4">Bill To:</h3>
          <div className="font-bold text-xl text-slate-800">{invoice.client.name || 'N/A'}</div>
          <div className="text-slate-600 mt-1 whitespace-pre-line">{invoice.client.address || 'Address Not Provided'}</div>
          <div className="text-slate-600 mt-1">{invoice.client.email}</div>
          <div className="text-slate-600 mt-1">{invoice.client.phone}</div>
        </div>
        <div className="flex flex-col items-end">
          <div className="grid grid-cols-2 gap-x-8 gap-y-2">
            <span className="text-slate-400 font-medium">Issue Date:</span>
            <span className="text-slate-800 font-semibold">{formatDate(invoice.date)}</span>
            <span className="text-slate-400 font-medium">Due Date:</span>
            <span className="text-slate-800 font-semibold">{formatDate(invoice.dueDate)}</span>
            <span className="text-slate-400 font-medium">Status:</span>
            <span className={`font-bold px-2 py-0.5 rounded text-xs uppercase text-center ${
              invoice.status === 'Paid' ? 'bg-green-100 text-green-700' : 
              invoice.status === 'Sent' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'
            }`}>
              {invoice.status}
            </span>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="flex-grow">
        <table className="w-full mb-8">
          <thead>
            <tr className="bg-slate-50 border-y border-slate-200">
              <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Description</th>
              <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-widest">Qty</th>
              <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-widest">Unit Price</th>
              <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-widest">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {invoice.items.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-4 text-slate-800 font-medium">{item.description}</td>
                <td className="px-4 py-4 text-center text-slate-600">{item.quantity}</td>
                <td className="px-4 py-4 text-right text-slate-600">{formatCurrency(item.unitPrice)}</td>
                <td className="px-4 py-4 text-right text-slate-800 font-bold">{formatCurrency(item.quantity * item.unitPrice)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer / Totals */}
      <div className="border-t-2 border-slate-100 pt-8 mt-auto">
        <div className="flex justify-between items-start gap-12">
          <div className="max-w-md">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Notes & Terms</h3>
            <p className="text-sm text-slate-600 leading-relaxed italic">{invoice.notes || 'No specific notes for this invoice.'}</p>
          </div>
          <div className="w-64 space-y-3">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {invoice.taxRate > 0 && (
              <div className="flex justify-between text-slate-500">
                <span>Tax ({invoice.taxRate}%)</span>
                <span>{formatCurrency(subtotal * (invoice.taxRate / 100))}</span>
              </div>
            )}
            {invoice.discount > 0 && (
              <div className="flex justify-between text-red-500">
                <span>Discount</span>
                <span>-{formatCurrency(invoice.discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-xl font-black text-blue-900 border-t border-slate-200 pt-3">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="text-center mt-12 pt-8 border-t border-slate-50 text-[10px] text-slate-400 uppercase tracking-[0.2em]">
        Generated by Intech Invoicer • {businessInfo.website}
      </div>
    </div>
  );
};

export default InvoicePreview;

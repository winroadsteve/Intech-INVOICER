
import React, { useState } from 'react';
import { Trash2, Sparkles, Loader2 } from 'lucide-react';
import { InvoiceItem } from '../types';
import { getProfessionalDescription } from '../services/geminiService';

interface Props {
  item: InvoiceItem;
  onUpdate: (updates: Partial<InvoiceItem>) => void;
  onRemove: () => void;
}

const InvoiceItemRow: React.FC<Props> = ({ item, onUpdate, onRemove }) => {
  const [isEnhancing, setIsEnhancing] = useState(false);

  const handleEnhance = async () => {
    if (!item.description) return;
    setIsEnhancing(true);
    const enhanced = await getProfessionalDescription(item.description);
    onUpdate({ description: enhanced });
    setIsEnhancing(false);
  };

  return (
    <div className="grid grid-cols-12 gap-4 items-end bg-white p-4 rounded-lg border border-slate-200 shadow-sm transition-all hover:border-blue-300">
      <div className="col-span-12 md:col-span-6 space-y-1">
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Description</label>
        <div className="relative">
          <input
            type="text"
            value={item.description}
            onChange={(e) => onUpdate({ description: e.target.value })}
            className="w-full pl-3 pr-10 py-2 rounded-md border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            placeholder="e.g., Computer Repair Service"
          />
          <button
            onClick={handleEnhance}
            disabled={isEnhancing || !item.description}
            title="Enhance with AI"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-blue-50 text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isEnhancing ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
          </button>
        </div>
      </div>
      
      <div className="col-span-4 md:col-span-2 space-y-1">
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Qty</label>
        <input
          type="number"
          min="1"
          value={item.quantity}
          onChange={(e) => onUpdate({ quantity: Number(e.target.value) })}
          className="w-full px-3 py-2 rounded-md border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
      </div>

      <div className="col-span-4 md:col-span-3 space-y-1">
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Price (₦)</label>
        <input
          type="number"
          min="0"
          value={item.unitPrice}
          onChange={(e) => onUpdate({ unitPrice: Number(e.target.value) })}
          className="w-full px-3 py-2 rounded-md border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
      </div>

      <div className="col-span-4 md:col-span-1 flex justify-center">
        <button
          onClick={onRemove}
          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
        >
          <Trash2 size={20} />
        </button>
      </div>
    </div>
  );
};

export default InvoiceItemRow;

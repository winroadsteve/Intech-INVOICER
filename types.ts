
export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface ClientInfo {
  name: string;
  email: string;
  address: string;
  phone: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  dueDate: string;
  client: ClientInfo;
  items: InvoiceItem[];
  notes: string;
  status: 'Draft' | 'Sent' | 'Paid';
  taxRate: number;
  discount: number;
}

export interface BusinessInfo {
  name: string;
  website: string;
  email: string;
  phone: string;
  address: string;
  logoUrl?: string;
}


export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
  }).format(amount);
};

export const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export const calculateSubtotal = (items: any[]): number => {
  return items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
};

export const calculateTotal = (subtotal: number, taxRate: number, discount: number): number => {
  const taxAmount = subtotal * (taxRate / 100);
  return subtotal + taxAmount - discount;
};

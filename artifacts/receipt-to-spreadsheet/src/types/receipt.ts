export type EditableItem = {
  description: string;
  qty: string;
  unit_price: string;
  total: string;
};

export type EditableReceipt = {
  vendor: string;
  date: string;
  currency: string;
  items: EditableItem[];
  subtotal: string;
  tax: string;
  total: string;
};

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CartItem {
  _id: string;
  name: string;
  price: number; // Base price in NGN
  image: string;
  quantity: number;
  size: string;
}

interface StoreState {
  cart: CartItem[];
  currency: 'NGN' | 'USD' | 'GBP' | 'EUR';
  exchangeRates: Record<string, number>;
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  setCurrency: (cur: 'NGN' | 'USD' | 'GBP' | 'EUR') => void;
}

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      cart: [],
      currency: 'NGN',
      exchangeRates: { NGN: 1, USD: 0.00065, GBP: 0.00052, EUR: 0.00060 }, // Example rates
      addItem: (item) => set((state) => ({ cart: [...state.cart, item] })),
      removeItem: (id) => set((state) => ({ cart: state.cart.filter((i) => i._id !== id) })),
      setCurrency: (cur) => set({ currency: cur }),
    }),
    { name: 'dahriola-storage' }
  )
);
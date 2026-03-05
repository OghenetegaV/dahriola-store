import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CartItem {
  _id: string;
  name: string;
  price: number; 
  image: string;
  quantity: number;
  size: string;
  notes?: string;
}

interface StoreState {
  cart: CartItem[];
  currency: 'NGN' | 'USD' | 'GBP' | 'EUR';
  exchangeRates: Record<string, number>;
  addItem: (item: CartItem) => void;
  removeItem: (id: string, size: string) => void; // Added size to removal logic
  updateQuantity: (id: string, size: string, quantity: number) => void;
  setCurrency: (cur: 'NGN' | 'USD' | 'GBP' | 'EUR') => void;
  clearCart: () => void;
}

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      cart: [],
      currency: 'NGN',
      exchangeRates: { NGN: 1, USD: 0.00065, GBP: 0.00052, EUR: 0.00060 },
      
      addItem: (newItem) => set((state) => {
        // Check if the exact same item (ID + Size) already exists
        const existingItemIndex = state.cart.findIndex(
          (item) => item._id === newItem._id && item.size === newItem.size
        );

        if (existingItemIndex !== -1) {
          // If it exists, just update the quantity of that specific item
          const updatedCart = [...state.cart];
          updatedCart[existingItemIndex].quantity += newItem.quantity;
          return { cart: updatedCart };
        }

        // If it's a new size or new product, add it as a new entry
        return { cart: [...state.cart, newItem] };
      }),

      removeItem: (id, size) => set((state) => ({
        // Filter by both ID and Size so we don't delete other sizes of the same dress
        cart: state.cart.filter((i) => !(i._id === id && i.size === size))
      })),

      updateQuantity: (id, size, quantity) => set((state) => ({
        cart: state.cart.map((item) => 
          (item._id === id && item.size === size) 
            ? { ...item, quantity: Math.max(1, quantity) } 
            : item
        )
      })),

      setCurrency: (cur) => set({ currency: cur }),
      
      clearCart: () => set({ cart: [] }),
    }),
    { name: 'dahriola-storage' }
  )
);
import { create } from "zustand";
import { persist } from "zustand/middleware";

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

  currency: "NGN" | "USD" | "GBP" | "EUR" | "CAD";

  exchangeRates: Record<string, number>;

  addItem: (item: CartItem) => void;
  removeItem: (id: string, size: string) => void;
  updateQuantity: (id: string, size: string, quantity: number) => void;

  updateItemOptions: (
    id: string,
    currentSize: string,
    updates: {
      size?: string;
      quantity?: number;
      notes?: string;
    }
  ) => void;

  setCurrency: (cur: "NGN" | "USD" | "GBP" | "EUR" | "CAD") => void;

  clearCart: () => void;
}

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      cart: [],

      currency: "NGN",

      exchangeRates: {
        NGN: 1,
        USD: 0.00065,
        GBP: 0.00052,
        EUR: 0.0006,
        CAD: 0.00088, // adjust if needed
      },

      addItem: (newItem) =>
        set((state) => {
          const existingItemIndex = state.cart.findIndex(
            (item) =>
              item._id === newItem._id &&
              item.size === newItem.size &&
              (item.notes || "") === (newItem.notes || "")
          );

          if (existingItemIndex !== -1) {
            const updatedCart = [...state.cart];

            updatedCart[existingItemIndex] = {
              ...updatedCart[existingItemIndex],
              quantity:
                updatedCart[existingItemIndex].quantity + newItem.quantity,
            };

            return { cart: updatedCart };
          }

          return {
            cart: [...state.cart, newItem],
          };
        }),

      removeItem: (id, size) =>
        set((state) => ({
          cart: state.cart.filter(
            (item) => !(item._id === id && item.size === size)
          ),
        })),

      updateQuantity: (id, size, quantity) =>
        set((state) => ({
          cart: state.cart.map((item) =>
            item._id === id && item.size === size
              ? { ...item, quantity: Math.max(1, quantity) }
              : item
          ),
        })),

      updateItemOptions: (id, currentSize, updates) =>
        set((state) => {
          const targetItem = state.cart.find(
            (item) => item._id === id && item.size === currentSize
          );

          if (!targetItem) return { cart: state.cart };

          const updatedItem: CartItem = {
            ...targetItem,
            size: updates.size || targetItem.size,
            quantity:
              updates.quantity !== undefined
                ? Math.max(1, updates.quantity)
                : targetItem.quantity,
            notes:
              updates.notes !== undefined ? updates.notes : targetItem.notes,
          };

          const cartWithoutTarget = state.cart.filter(
            (item) => !(item._id === id && item.size === currentSize)
          );

          const duplicateIndex = cartWithoutTarget.findIndex(
            (item) =>
              item._id === updatedItem._id &&
              item.size === updatedItem.size &&
              (item.notes || "") === (updatedItem.notes || "")
          );

          if (duplicateIndex !== -1) {
            const mergedCart = [...cartWithoutTarget];

            mergedCart[duplicateIndex] = {
              ...mergedCart[duplicateIndex],
              quantity:
                mergedCart[duplicateIndex].quantity + updatedItem.quantity,
            };

            return { cart: mergedCart };
          }

          return {
            cart: [...cartWithoutTarget, updatedItem],
          };
        }),

      setCurrency: (cur) => set({ currency: cur }),

      clearCart: () => set({ cart: [] }),
    }),
    {
      name: "dahriola-storage",
    }
  )
);
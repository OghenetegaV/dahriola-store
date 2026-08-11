import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Currency = "NGN" | "USD" | "GBP" | "EUR" | "CAD";

export interface CartItem {
  _id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  size: string;
  notes?: string;

  heightLength?: string;
  gender?: string;

  selectedPrintId?: string;
  selectedPrintName?: string;
}

interface StoreState {
  cart: CartItem[];
  currency: Currency;
  exchangeRates: Record<Currency, number>;

  addItem: (item: CartItem) => void;
  removeItem: (id: string, size: string, selectedPrintId?: string) => void;
  updateQuantity: (
    id: string,
    size: string,
    quantity: number,
    selectedPrintId?: string
  ) => void;

  updateItemOptions: (
    id: string,
    currentSize: string,
    updates: {
      size?: string;
      quantity?: number;
      notes?: string;
      heightLength?: string;
      gender?: string;
      selectedPrintId?: string;
      selectedPrintName?: string;
    },
    currentSelectedPrintId?: string
  ) => void;

  setCurrency: (cur: Currency) => void;
  clearCart: () => void;
}

const DEFAULT_EXCHANGE_RATES: Record<Currency, number> = {
  NGN: 1,
  USD: 0.0007519,
  GBP: 0.0005562,
  EUR: 0.0006386,
  CAD: 0.0010197,
};

function sameCartItem(a: CartItem, b: CartItem) {
  return (
    a._id === b._id &&
    a.size === b.size &&
    (a.notes || "") === (b.notes || "") &&
    (a.selectedPrintId || "") === (b.selectedPrintId || "")
  );
}

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      cart: [],
      currency: "NGN",
      exchangeRates: DEFAULT_EXCHANGE_RATES,

      addItem: (newItem) =>
        set((state) => {
          const existingItemIndex = state.cart.findIndex((item) =>
            sameCartItem(item, newItem)
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

          return { cart: [...state.cart, newItem] };
        }),

      removeItem: (id, size, selectedPrintId) =>
        set((state) => ({
          cart: state.cart.filter(
            (item) =>
              !(
                item._id === id &&
                item.size === size &&
                (selectedPrintId === undefined ||
                  (item.selectedPrintId || "") === (selectedPrintId || ""))
              )
          ),
        })),

      updateQuantity: (id, size, quantity, selectedPrintId) =>
        set((state) => ({
          cart: state.cart.map((item) =>
            item._id === id &&
            item.size === size &&
            (selectedPrintId === undefined ||
              (item.selectedPrintId || "") === (selectedPrintId || ""))
              ? { ...item, quantity: Math.max(1, quantity) }
              : item
          ),
        })),

      updateItemOptions: (id, currentSize, updates, currentSelectedPrintId) =>
        set((state) => {
          const targetItem = state.cart.find(
            (item) =>
              item._id === id &&
              item.size === currentSize &&
              (currentSelectedPrintId === undefined ||
                (item.selectedPrintId || "") ===
                  (currentSelectedPrintId || ""))
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
            heightLength:
              updates.heightLength !== undefined
                ? updates.heightLength
                : targetItem.heightLength,
            gender:
              updates.gender !== undefined ? updates.gender : targetItem.gender,
            selectedPrintId:
              updates.selectedPrintId !== undefined
                ? updates.selectedPrintId
                : targetItem.selectedPrintId,
            selectedPrintName:
              updates.selectedPrintName !== undefined
                ? updates.selectedPrintName
                : targetItem.selectedPrintName,
          };

          const cartWithoutTarget = state.cart.filter(
            (item) =>
              !(
                item._id === id &&
                item.size === currentSize &&
                (currentSelectedPrintId === undefined ||
                  (item.selectedPrintId || "") ===
                    (currentSelectedPrintId || ""))
              )
          );

          const duplicateIndex = cartWithoutTarget.findIndex((item) =>
            sameCartItem(item, updatedItem)
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

          return { cart: [...cartWithoutTarget, updatedItem] };
        }),

      setCurrency: (cur) => set({ currency: cur }),

      clearCart: () => set({ cart: [] }),
    }),
    {
      name: "dahriola-storage",

      merge: (persistedState: any, currentState) => ({
        ...currentState,
        ...persistedState,
        exchangeRates: DEFAULT_EXCHANGE_RATES,
      }),
    }
  )
);

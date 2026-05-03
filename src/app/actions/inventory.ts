"use server";

import { client } from "@/src/lib/sanity";
import { sendLowStockNotification } from "@/src/app/actions/email";

type CartItem = {
  selectedPrintId?: string;
  selectedPrintName?: string;
  quantity: number;
};

type PrintStock = {
  _id: string;
  name: string;
  stockQuantity?: number;
  lowStockThreshold?: number;
};

export async function reducePrintStockAfterOrder(cart: CartItem[]) {
  try {
    const printItems = cart.filter((item) => item.selectedPrintId);

    if (!printItems.length) {
      return { success: true };
    }

    for (const item of printItems) {
      const printId = item.selectedPrintId;
      const quantityOrdered = Number(item.quantity || 1);

      if (!printId) continue;

      const currentPrint: PrintStock | null = await client.fetch(
        `*[_type == "print" && _id == $printId][0]{
          _id,
          name,
          stockQuantity,
          lowStockThreshold
        }`,
        { printId }
      );

      if (!currentPrint) continue;

      const currentStock = Number(currentPrint.stockQuantity || 0);
      const threshold = Number(currentPrint.lowStockThreshold || 2);
      const newStock = Math.max(0, currentStock - quantityOrdered);

      await client
        .patch(printId)
        .set({
          stockQuantity: newStock,
        })
        .commit();

      if (newStock <= threshold) {
        await sendLowStockNotification({
          printName: currentPrint.name || item.selectedPrintName || "Unknown print",
          remainingStock: newStock,
          threshold,
        });
      }
    }

    return { success: true };
  } catch (error: any) {
    console.error("Inventory stock reduction failed:", error?.message || error);

    return {
      success: false,
      message: "Inventory stock reduction failed.",
    };
  }
}
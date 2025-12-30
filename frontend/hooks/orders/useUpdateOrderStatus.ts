import { useState } from "react";
import { apiFetch } from "@/lib/api";
import { OrderStatus, PaymentMethod } from "@/lib/types";

interface UpdateOrderStatusArgs {
  orderId: number | string;
  newStatus: OrderStatus;
  paymentMethod?: PaymentMethod;
  onSuccess?: () => void;
}

export function useUpdateOrderStatus() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = async ({ orderId, newStatus, paymentMethod, onSuccess }: UpdateOrderStatusArgs) => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ new_status: newStatus });
      if (paymentMethod) {
        params.append("payment_method", paymentMethod);
      }

      await apiFetch(`/orders/${orderId}/status?${params.toString()}`, {
        method: "PUT",
      });
      
      if (onSuccess) {
        onSuccess();
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Ocurrió un error desconocido";
      console.error(`Error updating order #${orderId}:`, errorMessage);
      setError(err instanceof Error ? err : new Error(errorMessage));
    } finally {
      setIsLoading(false);
    }
  };

  return { mutate, isLoading, error };
}
import React, { useState, useEffect } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
// Eliminadas importaciones de AlertDialog y Select ya que no se usarán
import { Button } from "@/components/ui/button";
import { Order, OrderStatus } from "@/lib/types";
import { useUpdateOrderStatus } from "@/hooks/orders/useUpdateOrderStatus";
import { Loader2, ChevronDown } from "lucide-react";

interface OrderStatusSelectorProps {
  order: Order;
  onStatusUpdate: () => void;
}

const orderStatusLabels: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: "Pendiente",
  [OrderStatus.PAID]: "Pagado",
  [OrderStatus.COMPLETED]: "Completado",
  [OrderStatus.SHIPPED]: "Enviado",
  [OrderStatus.REJECTED]: "Rechazado",
};

const getStatusColor = (status: OrderStatus) => {
  switch (status) {
    case OrderStatus.PENDING: return "bg-yellow-500/10 text-yellow-600";
    case OrderStatus.PAID: return "bg-green-500/10 text-green-600";
    case OrderStatus.COMPLETED: return "bg-blue-500/10 text-blue-600";
    case OrderStatus.REJECTED: return "bg-red-500/10 text-red-600";
    default: return "bg-gray-500/10 text-gray-600";
  }
}

export function OrderStatusSelector({ order, onStatusUpdate }: OrderStatusSelectorProps) {
  const [currentStatus, setCurrentStatus] = useState<OrderStatus>(order.order_status || OrderStatus.PENDING);

  // Sincronizar el estado interno si la prop cambia
  useEffect(() => {
    if (order.order_status) {
      setCurrentStatus(order.order_status);
    }
  }, [order.order_status]);

  const { mutate, isLoading } = useUpdateOrderStatus();

  const isMenuDisabled = isLoading || [OrderStatus.COMPLETED, OrderStatus.REJECTED].includes(currentStatus);

  const handleStatusSelect = (newStatus: OrderStatus) => {
    if (newStatus === currentStatus) return;

    mutate({
      orderId: order.id,
      newStatus: newStatus,
      // El paymentMethod ya no es necesario aquí, el backend lo manejará si es necesario
      onSuccess: () => {
        // No es necesario llamar a setCurrentStatus aquí, el useEffect lo manejará
        onStatusUpdate();
      },
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            disabled={isMenuDisabled}
            className={`w-[150px] justify-between font-normal ${getStatusColor(currentStatus)}`}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                {orderStatusLabels[currentStatus]}
                <ChevronDown className="h-4 w-4 opacity-50" />
              </>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-[150px] bg-white shadow-lg border">
          {Object.values(OrderStatus).map((status) => (
            <DropdownMenuItem
              key={status}
              disabled={status === currentStatus || status === OrderStatus.SHIPPED}
              onSelect={() => handleStatusSelect(status)}
            >
              {orderStatusLabels[status]}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}

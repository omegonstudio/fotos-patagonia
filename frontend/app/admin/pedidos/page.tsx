"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Search, ExternalLink } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useOrders } from "@/hooks/orders/useOrders";
import { Order, OrderStatus } from "@/lib/types";
import { OrderStatusSelector } from "@/components/molecules/OrderStatusSelector";

export default function PedidosPage() {
  const { data: ordersData, loading, error, refetch } = useOrders();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [channelFilter, setChannelFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");

  useEffect(() => {
    if (ordersData) {
      // Ensure data is always an array
      const loadedOrders = Array.isArray(ordersData) ? ordersData : [ordersData];
      setOrders(loadedOrders);
    }
  }, [ordersData]);

  useEffect(() => {
    let filtered = orders;

    if (searchTerm) {
      filtered = filtered.filter(
        (order) =>
          (order.id && order.id.toString().toLowerCase().includes(searchTerm.toLowerCase())) ||
          (order.user?.email && order.user.email.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((order) => order.order_status === statusFilter);
    }

    if (paymentFilter !== "all") {
      filtered = filtered.filter((order) => order.payment_method === paymentFilter);
    }

    // NOTE: Channel filtering is not directly available in the model, skipping for now.
    // if (channelFilter !== "all") {
    //   filtered = filtered.filter((order) => order.channel === channelFilter);
    // }

    setFilteredOrders(filtered);
  }, [searchTerm, statusFilter, channelFilter, paymentFilter, orders]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div>Cargando pedidos...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen text-red-500">
        <div>Error al cargar los pedidos: {error}</div>
      </div>
    );
  }

  // Mapeo de valores del enum a etiquetas legibles por humanos para el filtro
  const orderStatusLabels: Record<OrderStatus, string> = {
    [OrderStatus.PENDING]: "Pendiente",
    [OrderStatus.PAID]: "Pagado",
    [OrderStatus.COMPLETED]: "Completado",
    [OrderStatus.SHIPPED]: "Enviado",
    [OrderStatus.REJECTED]: "Rechazado",
  };

  const formatOrderDate = (order: Order) => {
    const dateValue = order.created_at ?? order.createdAt;
    if (!dateValue) return "Sin fecha";

    const parsed = new Date(dateValue);
    return Number.isNaN(parsed.getTime())
      ? "Fecha inválida"
      : parsed.toLocaleDateString("es-AR", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-4xl font-heading">Gestión de Pedidos</h1>
        <p className="text-muted-foreground">Administra y actualiza el estado de los pedidos</p>
      </div>

      <Card className="mb-6 rounded-2xl border-gray-200">
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por ID o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="rounded-xl pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="rounded-xl bg-[#f2f2e4]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent className="bg-[#f2f2e4] text-[#1c2e4d] border border-neutral-300 shadow-lg">
              <SelectItem value="all">Todos los estados</SelectItem>
                {Object.values(OrderStatus).map((statusValue) => (
                  <SelectItem key={statusValue} value={statusValue} className="capitalize">
                    {orderStatusLabels[statusValue]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={channelFilter} onValueChange={setChannelFilter}>
              <SelectTrigger className="rounded-xl bg-[#f2f2e4]">
                <SelectValue placeholder="Canal" />
              </SelectTrigger>
                <SelectContent className="bg-[#f2f2e4] text-[#1c2e4d] border border-neutral-300 shadow-lg">

                <SelectItem value="all">Todos los canales</SelectItem>
                <SelectItem value="web">Web</SelectItem>
                <SelectItem value="local">Local</SelectItem>
              </SelectContent>
            </Select>
            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger className="rounded-xl bg-[#f2f2e4]">
                <SelectValue placeholder="Pago" />
              </SelectTrigger>
                <SelectContent className="bg-[#f2f2e4] text-[#1c2e4d] border border-neutral-300 shadow-lg">

                <SelectItem value="all">Todos los métodos</SelectItem>
                <SelectItem value="efectivo">Efectivo</SelectItem>
                <SelectItem value="transferencia">Transferencia</SelectItem>
                <SelectItem value="posnet">Tarjeta</SelectItem>
                <SelectItem value="mp">Mercado Pago</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-gray-200">
        <CardContent className="p-0">
          {filteredOrders.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">No se encontraron pedidos</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nº Orden</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Forma de Pago</TableHead>
                    <TableHead>Total</TableHead>
                     <TableHead>Fecha</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => {
                    // const statusInfo = getStatusBadge(order.order_status);
                    return (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono font-medium">{order.id}</TableCell>
                        <TableCell>
                          <OrderStatusSelector order={order} onStatusUpdate={refetch} />
                        </TableCell>
                        <TableCell>{order.user?.email || 'N/A'}</TableCell>
                        <TableCell>
                          <span className="capitalize">{order.payment_method}</span>
                        </TableCell>
                        <TableCell className="font-semibold">${order.total}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatOrderDate(order)}
                        </TableCell> 
                        <TableCell className="text-right">
                          <Link href={`/admin/pedidos/${order.id}`}>
                            <Button variant="ghost" size="sm" className="gap-2">
                              <ExternalLink className="h-4 w-4" />
                              Ver
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Search, ExternalLink, MoreHorizontal, Trash2, Edit } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { useOrders } from "@/hooks/orders/useOrders"
import { useToast } from "@/hooks/use-toast"
import { Order, OrderStatus, PaymentMethod } from "@/lib/types"
import { OrderStatusSelector } from "@/components/molecules/OrderStatusSelector"
import { formatDateTime, parseUtcNaiveDate } from "@/lib/datetime"
import { FilterBar } from "@/components/molecules/filter-bar"
import { photoHourKey } from "@/lib/datetime"
import { useAuthStore } from "@/lib/store"
import { getUserRoleName, isAdmin } from "@/lib/types"

export default function PedidosPage() {
  const { data: ordersData, loading, error, refetch, updateOrder, deleteOrder } = useOrders()
  const { toast } = useToast()
  const [orders, setOrders] = useState<Order[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [paymentFilter, setPaymentFilter] = useState<string>("all")

  // Estados para el modal de edición
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [editedPaymentMethod, setEditedPaymentMethod] = useState<string>("")
  const [editedTotal, setEditedTotal] = useState<number>(0)

  // Estados para el diálogo de borrado
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null)

  const user = useAuthStore((state) => state.user)
  const roleName = getUserRoleName(user)?.toLowerCase()
  const userIsAdmin = isAdmin(user)
  const isPhotographer = roleName === "fotógrafo" || roleName === "vendedor"

  const isTodayInArgentina = (dateValue?: string | null) => {
    if (!dateValue) return false
    const date = parseUtcNaiveDate(dateValue)
    if (!date) return false
    const formatter = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Argentina/Buenos_Aires", year: "numeric", month: "2-digit", day: "2-digit" })
    const orderDate = formatter.format(date)
    const today = formatter.format(new Date())
    return orderDate === today
  }
  
  const toMillis = (value?: string | null) => parseUtcNaiveDate(value)?.getTime() ?? 0

  const PAGE_SIZE = 10
  const [currentPage, setCurrentPage] = useState(1)
  const [dateFilter, setDateFilter] = useState<string | undefined>()
  const [timeFilter, setTimeFilter] = useState<string | undefined>()

  useEffect(() => {
    let filtered = [...orders]
    if (searchTerm) {
      filtered = filtered.filter((order) => order.id?.toString().includes(searchTerm) || order.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()))
    }
    if (statusFilter !== "all") {
      filtered = filtered.filter((order) => order.order_status === statusFilter)
    }
    if (isPhotographer && !userIsAdmin) {
      filtered = filtered.filter((order) => isTodayInArgentina(order.created_at ?? order.createdAt))
    }
    if (paymentFilter !== "all") {
      filtered = filtered.filter((order) => order.payment_method === paymentFilter)
    }
    if (dateFilter) {
      filtered = filtered.filter((order) => {
        const rawDate = order.created_at ?? order.createdAt
        const date = parseUtcNaiveDate(rawDate)
        if (!date) return false
        const localDate = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Argentina/Buenos_Aires", year: "numeric", month: "2-digit", day: "2-digit" }).format(date)
        return localDate === dateFilter
      })
    }
    if (timeFilter) {
      filtered = filtered.filter((order) => photoHourKey({ timeSlot: undefined, takenAt: order.created_at ?? order.createdAt } as any) === timeFilter)
    }
    filtered.sort((a, b) => {
      const da = toMillis(a.created_at ?? a.createdAt)
      const db = toMillis(b.created_at ?? b.createdAt)
      return db - da
    })
    setFilteredOrders(filtered)
    setCurrentPage(1)
  }, [orders, searchTerm, statusFilter, paymentFilter, dateFilter, timeFilter])
  
  const totalPages = Math.ceil(filteredOrders.length / PAGE_SIZE)
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  useEffect(() => {
    if (ordersData) {
      const loadedOrders = Array.isArray(ordersData) ? ordersData : [ordersData]
      setOrders(loadedOrders)
    }
  }, [ordersData])

  const handleEdit = (order: Order) => {
    setSelectedOrder(order)
    setEditedPaymentMethod(order.payment_method)
    setEditedTotal(order.total)
    setIsEditDialogOpen(true)
  }

  const handleSave = async () => {
    if (!selectedOrder) return;
    try {
      await updateOrder(selectedOrder.id!.toString(), {
        payment_method: editedPaymentMethod as PaymentMethod,
        total: editedTotal,
      });
      toast({ title: "Pedido actualizado", description: "El pedido se ha actualizado correctamente." });
      refetch();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setIsEditDialogOpen(false);
      setSelectedOrder(null);
    }
  }

  const handleDelete = (order: Order) => {
    setOrderToDelete(order)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!orderToDelete) return;
    try {
      await deleteOrder(orderToDelete.id!.toString());
      toast({ title: "Pedido eliminado", description: "El pedido se ha eliminado correctamente." });
      refetch();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setIsDeleteDialogOpen(false);
      setOrderToDelete(null);
    }
  }

  if (loading) return <div>Cargando pedidos...</div>
  if (error) return <div className="text-red-500">Error al cargar los pedidos: {error}</div>

  const orderStatusLabels: Record<OrderStatus, string> = {
    [OrderStatus.PENDING]: "Pendiente",
    [OrderStatus.PAID]: "Pagado",
    [OrderStatus.COMPLETED]: "Completado",
    [OrderStatus.SHIPPED]: "Enviado",
    [OrderStatus.REJECTED]: "Rechazado",
  }

  const formatOrderDate = (order: Order) => {
    const dateValue = order.created_at ?? order.createdAt
    if (!dateValue) return "Sin fecha"
    const formatted = formatDateTime(dateValue, { month: "short", includeYear: false })
    return formatted || "Fecha inválida"
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-4xl font-heading">Gestión de Pedidos</h1>
        <p className="text-muted-foreground">Administra y actualiza el estado de los pedidos</p>
      </div>

      {(dateFilter || timeFilter) && (
        <div className="mb-2 flex gap-2">
          {dateFilter && <Badge>Fecha: {dateFilter}</Badge>}
          {timeFilter && <Badge>Hora: {timeFilter}:00</Badge>}
        </div>
      )}

      <Card className="mb-6 rounded-2xl border-gray-200">
        <FilterBar onFilterChange={({ date, time }) => { setDateFilter(date); setTimeFilter(time) }} />
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar por ID o email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="rounded-xl pl-10" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="rounded-xl bg-[#f2f2e4]"><SelectValue placeholder="Estado" /></SelectTrigger>
              <SelectContent className="bg-[#f2f2e4] text-[#1c2e4d] border border-neutral-300 shadow-lg">
                <SelectItem value="all">Todos los estados</SelectItem>
                {Object.values(OrderStatus).map((statusValue) => (
                  <SelectItem key={statusValue} value={statusValue} className="capitalize">{orderStatusLabels[statusValue]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger className="rounded-xl bg-[#f2f2e4]"><SelectValue placeholder="Pago" /></SelectTrigger>
              <SelectContent className="bg-[#f2f2e4] text-[#1c2e4d] border border-neutral-300 shadow-lg">
                <SelectItem value="all">Todos los métodos</SelectItem>
                {Object.values(PaymentMethod).map((method) => (
                  <SelectItem key={method} value={method}>{method}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-gray-200">
        <CardContent className="p-0">
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
                {paginatedOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono font-medium">{order.id}</TableCell>
                    <TableCell><OrderStatusSelector order={order} onStatusUpdate={refetch} /></TableCell>
                    <TableCell>{order.customer_email || 'N/A'}</TableCell>
                    <TableCell><span className="capitalize">{order.payment_method}</span></TableCell>
                    <TableCell className="font-semibold">${order.total}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatOrderDate(order)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0"><span className="sr-only">Abrir menú</span><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-background">
                          <DropdownMenuItem asChild><Link href={`/admin/pedidos/${order.id}`} className="flex items-center gap-2"><ExternalLink className="h-4 w-4" /> Ver</Link></DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(order)} className="flex items-center gap-2"><Edit className="h-4 w-4" /> Editar</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(order)} className="flex items-center gap-2 text-destructive"><Trash2 className="h-4 w-4" /> Borrar</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-4">
          <span className="text-sm text-muted-foreground">Página {currentPage} de {totalPages}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)}>Anterior</Button>
            <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => p + 1)}>Siguiente</Button>
          </div>
        </div>
      )}

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Pedido #{selectedOrder?.id}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="paymentMethod" className="text-right">Forma de Pago</Label>
              <Select value={editedPaymentMethod} onValueChange={setEditedPaymentMethod}>
                <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-background">
                  {Object.values(PaymentMethod).map((method) => (
                    <SelectItem key={method} value={method}>{method}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="total" className="text-right">Total</Label>
              <Input id="total" type="number" value={editedTotal} onChange={(e) => setEditedTotal(Number(e.target.value))} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Estado</Label>
              <div className="col-span-3">
                {selectedOrder && <OrderStatusSelector order={selectedOrder} onStatusUpdate={() => { refetch(); setIsEditDialogOpen(false); }} />}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Guardar Cambios</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente el pedido #{orderToDelete?.id} y todas sus ganancias asociadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Continuar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
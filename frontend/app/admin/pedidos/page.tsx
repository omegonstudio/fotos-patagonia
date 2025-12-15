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
import type { Order } from "@/lib/types"

export default function PedidosPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [channelFilter, setChannelFilter] = useState<string>("all")
  const [paymentFilter, setPaymentFilter] = useState<string>("all")

  // Load orders from localStorage
  useEffect(() => {
    const existingOrders = localStorage.getItem("orders")
    if (existingOrders) {
      const loadedOrders: Order[] = JSON.parse(existingOrders)
      setOrders(loadedOrders)
    }
  }, [])

  useEffect(() => {
    let filtered = orders

    if (searchTerm) {
      filtered = filtered.filter(
        (order) =>
          order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.email.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((order) => order.status === statusFilter)
    }

    if (channelFilter !== "all") {
      filtered = filtered.filter((order) => order.channel === channelFilter)
    }

    if (paymentFilter !== "all") {
      filtered = filtered.filter((order) => order.paymentMethod === paymentFilter)
    }

    setFilteredOrders(filtered)
  }, [searchTerm, statusFilter, channelFilter, paymentFilter, orders])

  const getStatusBadge = (status: Order["status"] | undefined) => {
    const statusConfig = {
      enviado: { label: "Enviado", className: "bg-blue-500/10 text-blue-600" },
      rechazado: { label: "Rechazado", className: "bg-red-500/10 text-red-600" },
      en_espera: { label: "En Espera", className: "bg-yellow-500/10 text-yellow-600" },
      pagado: { label: "Pagado", className: "bg-green-500/10 text-green-600" },
      entregado: { label: "Entregado", className: "bg-green-600/10 text-green-700" },
    } as const
  
    if (!status || !(status in statusConfig)) {
      return {
        label: "Desconocido",
        className: "bg-gray-500/10 text-gray-600",
      }
    }
  
    return statusConfig[status]
  }
  

  const handleStatusChange = (orderId: string, newStatus: Order["status"]) => {
    const order = orders.find((o) => o.id === orderId)
    if (!order) return

    const now = new Date()
    const editableUntil = new Date(order.editableUntil)

    if (now > editableUntil) {
      alert("No se puede editar este pedido. Han pasado más de 24 horas desde su creación.")
      return
    }

    const updatedOrders = orders.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    setOrders(updatedOrders)
  }

  const handlePaymentMethodChange = (orderId: string, newMethod: Order["paymentMethod"]) => {
    const order = orders.find((o) => o.id === orderId)
    if (!order) return

    const now = new Date()
    const editableUntil = new Date(order.editableUntil)

    if (now > editableUntil) {
      alert("No se puede editar este pedido. Han pasado más de 24 horas desde su creación.")
      return
    }

    const updatedOrders = orders.map((o) => (o.id === orderId ? { ...o, paymentMethod: newMethod } : o))
    setOrders(updatedOrders)
  }

  const isEditable = (order: Order) => {
    const now = new Date()
    const editableUntil = new Date(order.editableUntil)
    return now <= editableUntil
  }

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
                <SelectItem value="en_espera">En Espera</SelectItem>
                <SelectItem value="enviado">Enviado</SelectItem>
                <SelectItem value="pagado">Pagado</SelectItem>
                <SelectItem value="entregado">Entregado</SelectItem>
                <SelectItem value="rechazado">Rechazado</SelectItem>
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
                    const statusInfo = getStatusBadge(order.status)
                    const editable = isEditable(order)
                    return (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono font-medium">{order.id}</TableCell>
                        <TableCell>
                          {editable ? (
                            <Select
                              value={order.status}
                              onValueChange={(value) => handleStatusChange(order.id, value as Order["status"])}
                            >
                              <SelectTrigger className="h-8 w-[140px] rounded-lg border-gray-200 bg-[#f2f2e4] p-0">
                                <Badge className={statusInfo.className}>{statusInfo.label}</Badge>
                              </SelectTrigger>
                                <SelectContent className="bg-[#f2f2e4] text-[#1c2e4d] border border-neutral-300 shadow-lg">

                                <SelectItem value="en_espera">En Espera</SelectItem>
                                <SelectItem value="enviado">Enviado</SelectItem>
                                <SelectItem value="pagado">Pagado</SelectItem>
                                <SelectItem value="entregado">Entregado</SelectItem>
                                <SelectItem value="rechazado">Rechazado</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <Badge className={statusInfo.className}>{statusInfo.label}</Badge>
                          )}
                        </TableCell>
                        <TableCell>{order.email}</TableCell>
                        <TableCell>
                          {editable ? (
                            <Select
                              value={order.paymentMethod}
                              onValueChange={(value) =>
                                handlePaymentMethodChange(order.id, value as Order["paymentMethod"])
                              }
                            >
                              <SelectTrigger className="h-8 w-[160px] rounded-lg bg-[#f2f2e4]">
                                <SelectValue />
                              </SelectTrigger>
                                <SelectContent className="bg-[#f2f2e4] text-[#1c2e4d] border border-neutral-300 shadow-lg">

                                <SelectItem value="efectivo">Efectivo</SelectItem>
                                <SelectItem value="transferencia">Transferencia</SelectItem>
                                <SelectItem value="posnet">Tarjeta</SelectItem>
                                <SelectItem value="mp">Mercado Pago</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <span className="capitalize">{order.paymentMethod}</span>
                          )}
                        </TableCell>
                        <TableCell className="font-semibold">${order.total}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(order.createdAt).toLocaleDateString("es-AR", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
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
                    )
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

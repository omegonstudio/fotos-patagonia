"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Package,
  DollarSign,
  Camera,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Order } from "@/lib/types";
import { getUserRoleName, isAdmin } from "@/lib/types";
import { usePhotos } from "@/hooks/photos/usePhotos";
import { useAuthStore } from "@/lib/store";
import { usePhotographers } from "@/hooks/photographers/usePhotographers";
import { useEarningsSummaryAll } from "@/hooks/earnings/useEarningsSummaryAll";
import { useOrders } from "@/hooks/orders/useOrders";

export default function AdminDashboard() {
  const user = useAuthStore((state) => state.user);
  const { photos, loading: photosLoading } = usePhotos();
  const { data: ordersData, loading: ordersLoading } = useOrders();
  const photographerId = useMemo(
    () => user?.photographer?.id ?? user?.photographer_id ?? null,
    [user]
  );
  // Normalizar pedidos a array con referencia estable
  const orders: Order[] = useMemo(
    () => (Array.isArray(ordersData) ? ordersData : ordersData ? [ordersData] : []),
    [ordersData]
  );

  // Obtener información del rol
  const roleName = getUserRoleName(user)?.toLowerCase();
  const userIsAdmin = isAdmin(user);

  const filteredOrders = useMemo(() => {
    if (ordersLoading || photosLoading) return [];

    if (userIsAdmin || !photographerId) return orders;

    const ordersWithPhotographerItems: Order[] = [];

    orders.forEach((order) => {
      const photographerItems = (order.items || []).filter((item) => {
        const photo = photos.find((p) => p.id === item.photo?.id);
        return photo?.photographer_id === photographerId;
      });

      if (photographerItems.length > 0) {
        const photographerTotal = photographerItems.reduce(
          (sum, item) => sum + (item.price || 0),
          0
        );
        ordersWithPhotographerItems.push({
          ...order,
          items: photographerItems,
          total: photographerTotal,
        });
      }
    });

    return ordersWithPhotographerItems;
  }, [orders, photos, photosLoading, ordersLoading, userIsAdmin, photographerId]);

  const stats = useMemo(() => {
    if (ordersLoading || photosLoading)
      return { totalOrders: 0, pendingOrders: 0, totalPhotos: 0 };

    const pendingOrders = filteredOrders.filter(
      (o) => o.order_status === "pending" || o.order_status === "paid"
    ).length;

    const totalPhotos = userIsAdmin
      ? photos.length
      : photos.filter((p) => p.photographer_id === photographerId).length;

    return {
      totalOrders: filteredOrders.length,
      pendingOrders,
      totalPhotos,
    };
  }, [filteredOrders, photos, photosLoading, ordersLoading, userIsAdmin, photographerId]);

  const recentOrders = useMemo(() => filteredOrders.slice(-5), [filteredOrders]);

  // Textos dinámicos según el rol
  const isPhotographer = !userIsAdmin && !!photographerId;
  const texts = {
    title: isPhotographer ? "Mi Panel" : "Panel de Administración",
    subtitle: isPhotographer
      ? "Visualiza tus métricas y pedidos"
      : "Gestiona pedidos, fotos y contenido de Fotos Patagonia",
    ordersTitle: isPhotographer ? "Mis Pedidos" : "Total Pedidos",
    ordersDesc: isPhotographer
      ? "Pedidos con tus fotos"
      : "Todos los pedidos registrados",
    revenueTitle: isPhotographer ? "Mis Ingresos" : "Ingresos Totales",
    revenueDesc: isPhotographer
      ? "Ingresos de tus fotos"
      : "Suma de todos los pedidos",
    pendingTitle: isPhotographer ? "Mis Pendientes" : "Pedidos Pendientes",
    photosTitle: isPhotographer ? "Mis Fotos" : "Total Fotos",
    photosDesc: isPhotographer ? "Tus fotos en el catálogo" : "En el catálogo",
    recentOrdersTitle: isPhotographer
      ? "Mis Pedidos Recientes"
      : "Pedidos Recientes",
    recentOrdersDesc: isPhotographer
      ? "Últimos 5 pedidos con tus fotos"
      : "Últimos 5 pedidos realizados",
  };
  /*  */

  // === NUEVO === Fecha seleccionada por el admin
  const [startDateInput, setStartDateInput] = useState<string>("");
  const [endDateInput, setEndDateInput] = useState<string>("");
  const [appliedStartDate, setAppliedStartDate] = useState<string | undefined>(
    undefined
  );
  const [appliedEndDate, setAppliedEndDate] = useState<string | undefined>(
    undefined
  );

  // === NUEVO === Resumen global de ingresos (solo admins)
  const {
    data: earningsAll,
    loading: earningsLoading,
  } = useEarningsSummaryAll(appliedStartDate, appliedEndDate, {
    enabled: userIsAdmin,
  });

  // === NUEVO === Resumen individual (para fotógrafos)
  const { getPhotographerEarningsSummary } = usePhotographers();

  const [mySummary, setMySummary] = useState<number>(0);

  const handleApplyDateFilter = async () => {
    const newStart = startDateInput || undefined;
    const newEnd = endDateInput || undefined;
    setAppliedStartDate(newStart);
    setAppliedEndDate(newEnd);
    // Admins refetcharán vía hook al cambiar dependencias; fotógrafos vía useEffect
  };

  useEffect(() => {
    if (!userIsAdmin && photographerId) {
      (async () => {
        const summary = await getPhotographerEarningsSummary(photographerId, {
          startDate: appliedStartDate,
          endDate: appliedEndDate,
        });
        setMySummary(summary.total_earnings);
      })();
    }
  }, [
    userIsAdmin,
    photographerId,
    appliedStartDate,
    appliedEndDate,
    getPhotographerEarningsSummary,
  ]);

  /*    */

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-4xl font-bold">{texts.title}</h1>
        <p className="text-muted-foreground">{texts.subtitle}</p>
      </div>
      {/* Filtro de fecha para ingresos (admin y fotógrafos) */}
      {(userIsAdmin || photographerId) && (
        <div className="mb-6 flex gap-4 items-end">
          <div>
            <label className="block text-sm font-medium mb-1">
              Fecha desde
            </label>
            <input
              type="date"
              className="border rounded-lg p-2"
              value={startDateInput}
              onChange={(e) => setStartDateInput(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Fecha hasta
            </label>
            <input
              type="date"
              className="border rounded-lg p-2"
              value={endDateInput}
              onChange={(e) => setEndDateInput(e.target.value)}
            />
          </div>

          <Button
            onClick={handleApplyDateFilter}
            disabled={earningsLoading && userIsAdmin}
            className="h-10"
          >
            {earningsLoading && userIsAdmin ? "Cargando..." : "Aplicar"}
          </Button>
        </div>
      )}

      {/* Stats Grid */}
      <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-2xl border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {texts.ordersTitle}
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalOrders}</div>
            <p className="mt-1 text-xs text-muted-foreground">
              {texts.ordersDesc}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {texts.revenueTitle}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {" "}
              {userIsAdmin
                ? `$${(
                    earningsAll?.reduce(
                      (sum, r) => sum + r.total_earnings,
                      0
                    ) || 0
                  ).toLocaleString()}`
                : `$${mySummary.toLocaleString()}`}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {texts.revenueDesc}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {texts.pendingTitle}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.pendingOrders}</div>
            <p className="mt-1 text-xs text-muted-foreground">
              Requieren atención
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {texts.photosTitle}
            </CardTitle>
            <Camera className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalPhotos}</div>
            <p className="mt-1 text-xs text-muted-foreground">
              {texts.photosDesc}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mb-8 grid gap-6 md:grid-cols-2">
        <Card className="rounded-2xl border-gray-200">
          <CardHeader>
            <CardTitle>Gestión de Pedidos</CardTitle>
            <CardDescription>
              Ver y administrar todos los pedidos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/pedidos">
              <Button className="w-full rounded-xl bg-primary font-semibold text-foreground hover:bg-primary-hover">
                Ver Pedidos
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-gray-200">
          <CardHeader>
            <CardTitle>Gestión de Fotos</CardTitle>
            <CardDescription>Administrar catálogo de fotos</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/fotos">
              <Button className="w-full rounded-xl bg-primary font-semibold text-foreground hover:bg-primary-hover">
                Ver Fotos
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-gray-200">
          <CardHeader>
            <CardTitle>Gestión de Contenidos (ABM)</CardTitle>
            <CardDescription>
              Administrar álbumes, fotógrafos, tags y códigos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/abm">
              <Button className="w-full rounded-xl bg-primary font-semibold text-foreground hover:bg-primary-hover">
                Gestionar Contenido
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card className="rounded-2xl border-gray-200">
        <CardHeader>
          <CardTitle>{texts.recentOrdersTitle}</CardTitle>
          <CardDescription>{texts.recentOrdersDesc}</CardDescription>
        </CardHeader>
        <CardContent>
          {recentOrders.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              {isPhotographer
                ? "No hay pedidos con tus fotos"
                : "No hay pedidos registrados"}
            </div>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between rounded-xl border border-gray-200 p-4"
                >
                  <div className="flex-1">
                    <p className="font-semibold">Pedido #{order.id}</p>
                    <p className="text-sm text-muted-foreground">
                      {order.customer_email || "Sin email"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">${order.total}</p>
                    <p className="text-sm capitalize text-muted-foreground">
                      {order.order_status?.replace("_", " ") || "Sin estado"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

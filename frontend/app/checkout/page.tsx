"use client";

import type React from "react";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CreditCard,
  Store,
  CheckCircle2,
  Printer,
  ImageIcon,
} from "lucide-react";
import { Header } from "@/components/organisms/header";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useCartStore, useAuthStore } from "@/lib/store";
import { usePhotos } from "@/hooks/photos/usePhotos";
import { isAdmin } from "@/lib/types";
import type { Order, OrderItem, Photo } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { mapBackendPhotoToPhoto } from "@/lib/mappers/photos";
import { useCheckout } from "@/hooks/checkout/useCheckout";
import { usePresignedUrl } from "@/hooks/photos/usePresignedUrl";
import { buildThumbObjectName } from "@/lib/photo-thumbnails";

type MercadoPagoPreferenceResponse = {
  init_point?: string;
  preference_id?: string;
};

// Sub-componente para cargar la imagen de la foto del checkout
function CheckoutPhotoThumbnail({ photo }: { photo: Photo }) {
  const previewObjectName =
    photo.previewObjectName ?? buildThumbObjectName(photo.objectName);
  const { url, loading, error } = usePresignedUrl(previewObjectName);

  if (loading) {
    return (
      <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-muted flex items-center justify-center">
        <ImageIcon className="h-6 w-6 text-gray-400 animate-pulse" />
      </div>
    );
  }

  if (error || !url) {
    return (
      <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-red-100 flex items-center justify-center text-red-500 text-xs text-center">
        Error
      </div>
    );
  }

  return (
    <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
      <img
        src={url}
        alt={photo.place || "Foto"}
        className="h-full w-full object-cover"
      />
    </div>
  );
}


export default function CheckoutPage() {
  const router = useRouter();
  const { items, email, total, channel, clearCart } = useCartStore();
  const { user, isAuthenticated } = useAuthStore();
  const { photos } = usePhotos();
  const { createOrder, createMercadoPagoPreference } = useCheckout();

  // Create photos map for quick lookup
  const mappedPhotos = useMemo(
    () => photos.map((photo) => mapBackendPhotoToPhoto(photo)),
    [photos]
  );

  const photosMap = useMemo(() => {
    const map = new Map<string, Photo>();
    mappedPhotos.forEach((photo) => {
      map.set(photo.id, photo);
    });
    return map;
  }, [mappedPhotos]);

  // Determinar el canal según el tipo de usuario
  // Staff users (admin o usuarios con photographer_id) pueden usar el canal "local"
  const isStaffUser =
    isAuthenticated && user && (isAdmin(user) || user.photographer_id);
  const defaultChannel = isStaffUser ? "local" : "web";

  const [selectedChannel, setSelectedChannel] = useState<"web" | "local">(
    defaultChannel
  );
  const [paymentMethod, setPaymentMethod] = useState<
    "efectivo" | "transferencia" | "posnet" | "mp"
  >();
  const [isProcessing, setIsProcessing] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (items.length === 0) {
      router.push("/carrito");
    }
    if (!email) {
      router.push("/carrito");
    }
  }, [items, email, router]);

  // Actualizar el canal según el tipo de usuario
  useEffect(() => {
    setSelectedChannel(defaultChannel);
  }, [defaultChannel]);

  const cartPhotos = useMemo(() => {
    return items
      .map((item) => {
        const photo = photosMap.get(item.photoId);
        return photo ? { photo, item } : null;
      })
      .filter((item) => item !== null);
  }, [items, photosMap]);

  const digitalPhotos = useMemo(() => {
    return cartPhotos.filter((item) => !item.item.printer);
  }, [cartPhotos]);

  const printPhotos = useMemo(() => {
    return cartPhotos.filter((item) => item.item.printer);
  }, [cartPhotos]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!paymentMethod || !email) return;

    setIsProcessing(true);
    setSubmitError(null);

    // Determinar el canal según el tipo de usuario
    const orderChannel = isStaffUser ? "local" : "web";

    // Crear los OrderItems con la información de impresión
    const orderItems: OrderItem[] = items.map((item) => {
      const photo = photosMap.get(item.photoId);
      const price =
        item.printer && item.printFormat
          ? item.printFormat.price
          : photo?.price || 0;

      return {
        photoId: item.photoId,
        forPrint: item.printer,
        printFormat: item.printFormat,
        priceAtPurchase: price,
      };
    });

    // Payload para backend (ajustar si el backend espera campos distintos)
  // Payload para backend (ajustado al esquema real)
const orderPayload = {
  customer_email: email, // <--- CORREGIDO AQUÍ
  total,
  payment_method: paymentMethod, // 'mp' ya es un valor válido en el backend
  payment_status: "pending",
  order_status: "pending",
  external_payment_id: null,
  user_id: isAuthenticated ? user?.id ?? null : null,
  discount_id: null,

  items: orderItems.map((it) => ({
    price: it.priceAtPurchase,
    quantity: 1,
    photo_id: Number(it.photoId),
  })),

  // EXTRA — si querés mantener metadata útil sin romper el backend
  metadata: {
    channel: orderChannel,
    items: orderItems,
  },
};



    try {
      // 1) Crear orden en el backend obligatorio antes de generar preferencia
      const createdOrder = (await createOrder(orderPayload)) as Order;
      // Guardar orden en localStorage para poder mostrarla en la página de éxito
      try {
        const existingOrders = localStorage.getItem("orders");
        const orders = existingOrders ? JSON.parse(existingOrders) : [];
        orders.push(createdOrder);
        localStorage.setItem("orders", JSON.stringify(orders));
      } catch (err) {
        // no bloquear si falla el guardado local
        console.warn("No se pudo guardar la orden en localStorage", err);
      }

      if (orderChannel === "web") {
        // 2) Crear preferencia MERCADO PAGO enviando SOLO { order_id }
        const preference = (await createMercadoPagoPreference({
          order_id: createdOrder.id,
        })) as MercadoPagoPreferenceResponse;

        if (!preference?.init_point) {
          throw new Error("No se recibió el enlace de pago de Mercado Pago.");
        }

        // Redirigir al init_point de Mercado Pago
        window.location.href = preference.init_point;
        return;
      }

      // Canal local: limpiar carrito y redirigir a página de éxito/confirmación
      clearCart();
      router.push(
        `/checkout/success?orderId=${encodeURIComponent(
          String(createdOrder.id)
        )}`
      );
    } catch (error: any) {
      console.error("Error procesando el checkout:", error);
      setSubmitError(
        error?.message || "No pudimos iniciar el pago, intenta nuevamente."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  if (items.length === 0 || !email) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <Link
          href="/carrito"
          className="mb-6 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver al carrito
        </Link>

        <div className="mb-8">
          <h1 className="mb-2 text-4xl font-heading text-balance">
            Finalizar Compra
          </h1>
          <p className="text-muted-foreground">
            Completa tu información para procesar el pedido
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              <Card className="rounded-2xl border-gray-200 shadow-md">
                <CardHeader>
                  <CardTitle>Canal de Pago</CardTitle>
                  <CardDescription>
                    {isStaffUser
                      ? "Como usuario del personal, puedes generar órdenes para pago en local"
                      : "Selecciona tu método de pago online"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isStaffUser ? (
                    // Solo mostrar opción local para admin, vendedor y fotógrafo
                    <div className="flex items-start space-x-3 rounded-xl border border-primary bg-primary/5 p-4">
                      <Store className="h-5 w-5 text-primary mt-1" />
                      <div className="flex-1">
                        <div className="font-semibold">Pago en Local</div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Genera un número de orden (ORD-[ID]) que se comunicará
                          con el backend
                        </p>
                      </div>
                    </div>
                  ) : (
                    // Solo mostrar opción web para visitantes
                    <div className="flex items-start space-x-3 rounded-xl border border-primary bg-primary/5 p-4">
                      <CreditCard className="h-5 w-5 text-primary mt-1" />
                      <div className="flex-1">
                        <div className="font-semibold">Pago por Internet</div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Paga online de forma segura con Mercado Pago
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-gray-200 shadow-md">
                <CardHeader>
                  <CardTitle>Método de Pago</CardTitle>
                  <CardDescription>
                    {isStaffUser
                      ? "Selecciona cómo se realizará el pago en el local"
                      : "Procederás al pago con Mercado Pago"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RadioGroup
                    value={paymentMethod}
                    onValueChange={(value) =>
                      setPaymentMethod(value as typeof paymentMethod)
                    }
                  >
                    {isStaffUser ? (
                      // Opciones para pago en local
                      <>
                        <div className="flex items-center space-x-3 rounded-xl border border-gray-200 p-4">
                          <RadioGroupItem value="efectivo" id="efectivo" />
                          <Label
                            htmlFor="efectivo"
                            className="flex-1 cursor-pointer font-medium"
                          >
                            Efectivo
                          </Label>
                        </div>
                        <div className="flex items-center space-x-3 rounded-xl border border-gray-200 p-4">
                          <RadioGroupItem value="posnet" id="posnet_local" />
                          <Label
                            htmlFor="posnet_local"
                            className="flex-1 cursor-pointer font-medium"
                          >
                            Tarjeta (POS en local)
                          </Label>
                        </div>
                      </>
                    ) : (
                      // Solo Mercado Pago para visitantes
                      <div className="flex items-center space-x-3 rounded-xl border border-gray-200 p-4">
                        <RadioGroupItem value="mp" id="mp" />
                        <Label
                          htmlFor="mp"
                          className="flex-1 cursor-pointer font-medium"
                        >
                          Mercado Pago
                        </Label>
                      </div>
                    )}
                  </RadioGroup>
                </CardContent>
              </Card>

              {isStaffUser && (
                <div className="rounded-xl bg-secondary/50 p-4 text-sm">
                  <p className="font-medium">
                    Instrucciones para pago en local:
                  </p>
                  <ol className="mt-2 list-inside list-decimal space-y-1 text-muted-foreground">
                    <li>
                      Confirma tu pedido para generar el número de orden
                      (ORD-[ID])
                    </li>
                    <li>
                      La orden se comunicará automáticamente con el backend
                    </li>
                    <li>
                      El cliente puede pagar en el local con el método
                      seleccionado
                    </li>
                  </ol>
                </div>
              )}

              <Button
                type="submit"
                disabled={isProcessing || !paymentMethod}
                className="w-full rounded-xl bg-primary py-6 text-lg font-semibold text-foreground hover:bg-primary-hover disabled:opacity-50"
              >
                {isProcessing ? (
                  "Procesando..."
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-5 w-5" />
                    {isStaffUser
                      ? "Generar Orden Local (ORD-[ID])"
                      : "Proceder a Mercado Pago"}
                  </>
                )}
              </Button>
              {submitError && (
                <p className="text-sm text-destructive text-center">
                  {submitError}
                </p>
              )}
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 rounded-2xl bg-card p-6 shadow-lg">
              <h2 className="mb-4 text-xl font-heading">Resumen del Pedido</h2>

              {/* Fotos Impresas */}
              {printPhotos.length > 0 && (
                <div className="mb-4 space-y-3 border-b border-gray-200 pb-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                      <Printer className="h-4 w-4" />
                      FOTOS IMPRESAS
                    </h3>
                    <span className="text-xs text-muted-foreground">
                      {printPhotos.length}{" "}
                      {printPhotos.length === 1 ? "foto" : "fotos"}
                    </span>
                  </div>
                  {printPhotos.slice(0, 3).map(({ photo, item }) => (
                    <div
                      key={photo.id}
                      className="flex items-center gap-3"
                    >
                      <CheckoutPhotoThumbnail photo={photo} />
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {photo.place}
                        </p>
                        {item.printFormat ? (
                          <Badge variant="secondary" className="text-xs mt-1">
                            {item.printFormat.name} (
                            {item.printFormat.size})
                          </Badge>
                        ) : (
                          <p className="text-xs text-destructive">
                            Sin formato
                          </p>
                        )}
                      </div>
                      <p className="text-sm font-semibold">
                        ${item.printFormat?.price || photo.price}
                      </p>
                    </div>
                  ))}
                  {printPhotos.length > 3 && (
                    <p className="text-sm text-muted-foreground">
                      + {printPhotos.length - 3} fotos más
                    </p>
                  )}
                </div>
              )}

              {/* Fotos Digitales */}
              {digitalPhotos.length > 0 && (
                <div className="mb-4 space-y-3 border-b border-gray-200 pb-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-muted-foreground">
                      FOTOS DIGITALES
                    </h3>
                    <span className="text-xs text-muted-foreground">
                      {digitalPhotos.length}{" "}
                      {digitalPhotos.length === 1 ? "foto" : "fotos"}
                    </span>
                  </div>
                  {digitalPhotos.slice(0, 3).map(({ photo }) => (
                    <div
                      key={photo.id}
                      className="flex items-center gap-3"
                    >
                      <CheckoutPhotoThumbnail photo={photo} />
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {photo.place}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {photo.takenAt &&
                            new Date(photo.takenAt).toLocaleDateString(
                              "es-AR"
                            )}
                        </p>
                      </div>
                      <p className="text-sm font-semibold">
                        ${photo.price}
                      </p>
                    </div>
                  ))}
                  {digitalPhotos.length > 3 && (
                    <p className="text-sm text-muted-foreground">
                      + {digitalPhotos.length - 3} fotos más
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Email</span>
                  <span className="font-medium">{email}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Total ({items.length} fotos)
                  </span>
                  <span className="font-medium">${total}</span>
                </div>
                {printPhotos.length > 0 && (
                  <div className="text-xs text-muted-foreground pt-2 space-y-1">
                    {printPhotos
                      .filter((item) => item.item.printFormat)
                      .reduce((acc, item) => {
                        const format = item.item.printFormat!;
                        const existing = acc.find((f) => f.id === format.id);
                        if (existing) {
                          existing.count++;
                          existing.totalPrice += format.price;
                        } else {
                          acc.push({
                            id: format.id,
                            name: format.name,
                            size: format.size,
                            price: format.price,
                            count: 1,
                            totalPrice: format.price,
                          });
                        }
                        return acc;
                      }, [] as Array<{ id: string; name: string; size: string; price: number; count: number; totalPrice: number }>)
                      .map((format) => (
                        <div key={format.id} className="flex justify-between">
                          {/*   <span>• {format.name} ({format.size}) × {format.count}</span>
                          <span>${format.totalPrice}</span> */}
                        </div>
                      ))}
                  </div>
                )}
                <div className="flex justify-between border-t border-gray-200 pt-2 text-lg font-bold">
                  <span>Total</span>
                  <span className="text-primary">${total}</span>
                </div>
              </div>

              <div className="mt-6 space-y-2 border-t border-gray-200 pt-6 text-xs text-muted-foreground">
                <p>✓ Descarga inmediata después del pago</p>
                <p>✓ Resolución web y alta calidad</p>
                {printPhotos.length > 0 && (
                  <p>✓ Impresiones en formato seleccionado</p>
                )}
                <p>✓ Soporte técnico incluido</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

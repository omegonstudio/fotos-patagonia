import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Header } from "@/components/organisms/header"
import { Heart, MailCheck, ShoppingBag, Zap } from "lucide-react"
import AlbumesPage from "./albumes/page"
import { HeroVideo } from "@/components/organisms/hero-video"

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Header />

      <main>
        {/* Hero Section */}
        <HeroVideo />
        {/* Parallax Bento Carousel */}
        <AlbumesPage main={true}/>
        {/* Features Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <h2 className="mb-12 text-center text-4xl font-heading">¿Cómo llevar tu foto?</h2>
            <div className="grid gap-8 md:grid-cols-4">
              <div className="rounded-2xl bg-card p-8 text-center shadow-md">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <Zap className="h-8 w-8 text-primary" />
                </div>
                <h3 className="mb-3 text-xl font-heading">1. Elegí dónde te tomaron la foto</h3>
                <p className="text-muted-foreground">
                Buscá la actividad o el lugar donde estuviste hoy (canopy,escalada, navegación, pádel, etc.).
                </p>
              </div>

              <div className="rounded-2xl bg-card p-8 text-center shadow-md">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <Heart className="h-8 w-8 text-primary" />
                </div>
                <h3 className="mb-3 text-xl font-heading">2. Encontrá tu FOTO</h3>
                <p className="text-muted-foreground">
                Abrí el álbum y buscate. Podés usar filtros por fecha y horario si lo necesitás.
                </p>
              </div>

              <div className="rounded-2xl bg-card p-8 text-center shadow-md">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <ShoppingBag className="h-8 w-8 text-primary" />
                </div>
                <h3 className="mb-3 text-xl font-heading">3. Comprala en un clic</h3>
                <p className="text-muted-foreground">Seleccioná tu foto y elegí el formato digital el Descuento por Pack se aplica solo
                😉. Sin marcas de agua, en máxima calidad.</p>
              </div>

              <div className="rounded-2xl bg-card p-8 text-center shadow-md">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <MailCheck className="h-8 w-8 text-primary" />
                </div>
                <h3 className="mb-3 text-xl font-heading">4. Recibila al instante</h3>
                <p className="text-muted-foreground">Te llega directo a tu mail, lista para guardar, imprimir o compartir.</p>
              </div>
              

            </div>

          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gradient-to-r from-primary via-accent to-secondary py-20">
          <div className="container mx-auto px-4 text-center">
            <h2 className="mb-6 text-4xl font-heading text-foreground">¿Listo para encontrar tus fotos?</h2>
            <p className="mb-8 text-lg text-foreground/80">
              Miles de fotos de eventos en la Patagonia te están esperando.
            </p>
            <Button
              asChild
              size="lg"
              variant="secondary"
              className="rounded-xl bg-foreground px-8 text-lg font-semibold text-background hover:bg-foreground/90"
            >
              <Link href="/galeria">Comenzar Ahora</Link>
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-card">
        <div className="container mx-auto px-4 py-12">
          <div className="grid gap-10 md:grid-cols-3">
            {/* Brand */}
            <div className="space-y-3">
              <div className="relative flex items-center gap-2">
              <img
                  src="/Logo-Fotos-Patagonia.png"
                  alt="Fotos Patagonia"
                  className="w-15 h-12 object-cover"
                />
                <h4 className="font-heading text-lg">Fotos Patagonia</h4>
              </div>
        
              <p className="text-sm text-muted-foreground max-w-sm">
                Capturando los mejores momentos de la Patagonia desde 2020.
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 className="mb-4 font-heading text-lg">Enlaces</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    href="/galeria"
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Galería
                  </Link>
                </li>
                <li>
                  <Link
                    href="/albums"
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Álbumes
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contacto"
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Contacto
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="mb-4 font-heading text-lg">Contacto</h4>
              <p className="text-sm text-muted-foreground leading-6">
                Email:{" "}
                <a
                  href="mailto:info@fotospatagonia.com"
                  className="transition-colors hover:text-foreground"
                >
                  info@fotospatagonia.com
                </a>
                <br />
                Tel:{" "}
                <a
                  href="tel:+5492941234567"
                  className="transition-colors hover:text-foreground"
                >
                  +54 9 294 123-4567
                </a>
              </p>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-gray-200 pt-8 text-sm text-muted-foreground md:flex-row">
            <p>© 2025 Fotos Patagonia. Todos los derechos reservados.</p>

            <a
              href="https://omegon.com.ar"
              target="_blank"
              rel="noreferrer"
              className="group inline-flex items-center gap-2 transition-colors hover:text-foreground"
              aria-label="Made by Omegon"
            >
              {/* Logo Omegon */}
              <span className="relative h-10 w-10 overflow-hidden rounded-sm">
                <img
                  src="/omegon.png"
                  alt="Omegon"
                  className="h-full w-full object-contain opacity-80 transition-opacity group-hover:opacity-100"
                />
              </span>

              <span className="leading-none">
                Made by <span className="font-medium text-foreground/90 group-hover:text-foreground">Omegon</span>
              </span>
            </a>
          </div>
        </div>
      </footer>

    </div>
  )
}

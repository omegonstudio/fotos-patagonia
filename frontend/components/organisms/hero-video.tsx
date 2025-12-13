import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Camera } from 'lucide-react';

export const HeroVideo = () => {
  return (
    <section className="relative overflow-hidden h-screen w-full">
      {/* Background video with overlay */}
      <div className="absolute inset-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
        >
          <source src="/aimap video.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/50" />
      </div>

      {/* Content */}
      <div className="relative h-full flex items-center justify-center">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mb-6 text-5xl font-heading leading-tight text-balance md:text-6xl lg:text-7xl text-white">
              Fotos Patagonia
            </h1>
            <p className="mb-8 text-xl text-white/90 text-pretty md:text-xl">
              Encuentra y compra las mejores fotos de tus eventos deportivos y aventuras en la región más hermosa del
              mundo.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button
                asChild
                size="lg"
                className="rounded-xl bg-primary px-8 text-lg font-semibold text-foreground hover:bg-primary-hover"
              >
                <Link href="/galeria">
                  <Camera className="mr-2 h-5 w-5" />
                  Explorar Galería
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="rounded-xl border-2 text-lg font-semibold bg-white/10 text-white hover:bg-white/20 border-white/30"
              >
                <Link href="/albumes">Ver Álbumes</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

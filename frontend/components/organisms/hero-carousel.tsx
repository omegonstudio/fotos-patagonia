"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight } from "lucide-react"

const HERO_SLIDES = [
  {
    id: 1,
    image: "/patagonia-sunset-mountains.jpg",
    title: "Captura la magia de la Patagonia",
    subtitle: "Fotos de alta calidad de tus momentos especiales",
  },
  {
    id: 2,
    image: "/mountain-landscape-adventure.jpg",
    title: "Eventos deportivos en acción",
    subtitle: "Imágenes profesionales de maratones y aventuras",
  },
  {
    id: 3,
    image: "/trail-running-nature-photography.jpg",
    title: "Recuerdos que perduran",
    subtitle: "Descarga y comparte tus fotos favoritas",
  },
  {
    id: 4,
    image: "/landscape-glacier-patagonia.jpg",
    title: "Belleza natural capturada",
    subtitle: "Los mejores fotógrafos de la región",
  },
]

export function HeroCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isAutoplay, setIsAutoplay] = useState(true)

  useEffect(() => {
    if (!isAutoplay) return

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [isAutoplay])

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length)
    setIsAutoplay(false)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)
    setIsAutoplay(false)
  }

  const goToSlide = (index: number) => {
    setCurrentSlide(index)
    setIsAutoplay(false)
  }

  return (
    <div
      className="relative h-96 w-full overflow-hidden rounded-2xl md:h-[500px] lg:h-[600px]"
      onMouseEnter={() => setIsAutoplay(false)}
      onMouseLeave={() => setIsAutoplay(true)}
    >
      {/* Slides */}
      <div className="relative h-full w-full">
        {HERO_SLIDES.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              index === currentSlide ? "opacity-100" : "opacity-0"
            }`}
          >
            <Image
              src={slide.image || "/placeholder.svg"}
              alt={slide.title}
              fill
              className="object-cover"
              priority={index === 0}
            />
            {/* Dark overlay */}
            <div className="absolute inset-0 bg-black/40" />

            {/* Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <h2 className="mb-2 text-3xl font-heading text-white md:text-5xl lg:text-6xl">{slide.title}</h2>
              <p className="text-lg text-white/90 md:text-xl">{slide.subtitle}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Buttons */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/20 p-2 transition-colors hover:bg-white/40 md:p-3"
        aria-label="Anterior"
      >
        <ChevronLeft className="h-5 w-5 text-white md:h-6 md:w-6" />
      </button>

      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/20 p-2 transition-colors hover:bg-white/40 md:p-3"
        aria-label="Siguiente"
      >
        <ChevronRight className="h-5 w-5 text-white md:h-6 md:w-6" />
      </button>

      {/* Dot Indicators */}
      <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-2">
        {HERO_SLIDES.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`h-2 rounded-full transition-all duration-300 md:h-3 ${
              index === currentSlide ? "w-6 bg-primary md:w-8" : "w-2 bg-white/50 hover:bg-white/75 md:w-3"
            }`}
            aria-label={`Ir a slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  )
}

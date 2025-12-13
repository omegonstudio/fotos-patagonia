"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"

const MOCK_IMAGES = [
  {
    id: 1,
    url: "/patagonia-mountain-landscape-sunset.jpg",
    alt: "Montañas de la Patagonia al atardecer",
  },
  {
    id: 2,
    url: "/trail-running-patagonia.jpg",
    alt: "Corredor de trail en la Patagonia",
  },
  {
    id: 3,
    url: "/patagonia-lake-reflection.jpg",
    alt: "Lago patagónico con reflejo",
  },
  {
    id: 4,
    url: "/mountain-biking-patagonia-forest.jpg",
    alt: "Ciclismo de montaña en bosque patagónico",
  },
  {
    id: 5,
    url: "/patagonia-glacier-ice-blue.jpg",
    alt: "Glaciar patagónico",
  },
  {
    id: 6,
    url: "/hiking-patagonia-mountains.jpg",
    alt: "Senderismo en montañas patagónicas",
  },
  {
    id: 7,
    url: "/marathon-runner.png",
    alt: "Corredor de maratón",
  },
]

export function ParallaxBentoCarousel() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        const scrollProgress = Math.max(0, Math.min(1, (window.innerHeight - rect.top) / window.innerHeight))
        setScrollY(scrollProgress)
      }
    }

    window.addEventListener("scroll", handleScroll)
    handleScroll()

    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <section ref={containerRef} className="relative overflow-hidden bg-secondary/20 py-20">
      <div className="container mx-auto px-4">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-4xl font-heading">Momentos Inolvidables</h2>
          <p className="text-lg text-muted-foreground">Capturamos la esencia de tus aventuras en la Patagonia</p>
        </div>

        <div className="grid auto-rows-[200px] grid-cols-6 gap-4">
          {/* Top left - small square */}
          <div
            className="col-span-1 row-span-1 overflow-hidden rounded-2xl shadow-lg"
            style={{
              transform: `translateY(${scrollY * 20}px)`,
              transition: "transform 0.1s ease-out",
            }}
          >
            <div className="relative h-full w-full">
              <Image
                src={MOCK_IMAGES[0].url || "/placeholder.svg"}
                alt={MOCK_IMAGES[0].alt}
                fill
                className="object-cover transition-transform duration-700 hover:scale-110"
              />
            </div>
          </div>

          {/* Top middle - tall rectangle */}
          <div
            className="col-span-2 row-span-2 overflow-hidden rounded-2xl shadow-lg"
            style={{
              transform: `translateY(${scrollY * -30}px)`,
              transition: "transform 0.1s ease-out",
            }}
          >
            <div className="relative h-full w-full">
              <Image
                src={MOCK_IMAGES[1].url || "/placeholder.svg"}
                alt={MOCK_IMAGES[1].alt}
                fill
                className="object-cover transition-transform duration-700 hover:scale-110"
              />
            </div>
          </div>

          {/* Top right - large rectangle */}
          <div
            className="col-span-3 row-span-1 overflow-hidden rounded-2xl shadow-lg"
            style={{
              transform: `translateY(${scrollY * 25}px)`,
              transition: "transform 0.1s ease-out",
            }}
          >
            <div className="relative h-full w-full">
              <Image
                src={MOCK_IMAGES[2].url || "/placeholder.svg"}
                alt={MOCK_IMAGES[2].alt}
                fill
                className="object-cover transition-transform duration-700 hover:scale-110"
              />
            </div>
          </div>

          {/* Middle left - medium rectangle */}
          <div
            className="col-span-1 row-span-1 overflow-hidden rounded-2xl shadow-lg"
            style={{
              transform: `translateY(${scrollY * -20}px)`,
              transition: "transform 0.1s ease-out",
            }}
          >
            <div className="relative h-full w-full">
              <Image
                src={MOCK_IMAGES[6].url || "/placeholder.svg"}
                alt={MOCK_IMAGES[6].alt}
                fill
                className="object-cover transition-transform duration-700 hover:scale-110"
              />
            </div>
          </div>

          {/* Middle right top - small rectangle */}
          <div
            className="col-span-2 row-span-1 overflow-hidden rounded-2xl shadow-lg"
            style={{
              transform: `translateY(${scrollY * 35}px)`,
              transition: "transform 0.1s ease-out",
            }}
          >
            <div className="relative h-full w-full">
              <Image
                src={MOCK_IMAGES[3].url || "/placeholder.svg"}
                alt={MOCK_IMAGES[3].alt}
                fill
                className="object-cover transition-transform duration-700 hover:scale-110"
              />
            </div>
          </div>

          {/* Middle right bottom - small rectangle */}
          <div
            className="col-span-1 row-span-1 overflow-hidden rounded-2xl shadow-lg"
            style={{
              transform: `translateY(${scrollY * -25}px)`,
              transition: "transform 0.1s ease-out",
            }}
          >
            <div className="relative h-full w-full">
              <Image
                src={MOCK_IMAGES[4].url || "/placeholder.svg"}
                alt={MOCK_IMAGES[4].alt}
                fill
                className="object-cover transition-transform duration-700 hover:scale-110"
              />
            </div>
          </div>

          {/* Bottom left - large rectangle */}
          <div
            className="col-span-3 row-span-2 overflow-hidden rounded-2xl shadow-lg"
            style={{
              transform: `translateY(${scrollY * -35}px)`,
              transition: "transform 0.1s ease-out",
            }}
          >
            <div className="relative h-full w-full">
              <Image
                src={MOCK_IMAGES[5].url || "/placeholder.svg"}
                alt={MOCK_IMAGES[5].alt}
                fill
                className="object-cover transition-transform duration-700 hover:scale-110"
              />
            </div>
          </div>

          {/* Bottom right - medium rectangle */}
          <div
            className="col-span-2 row-span-1 overflow-hidden rounded-2xl shadow-lg"
            style={{
              transform: `translateY(${scrollY * 30}px)`,
              transition: "transform 0.1s ease-out",
            }}
          >
            <div className="relative h-full w-full">
              <Image
                src={MOCK_IMAGES[1].url || "/placeholder.svg"}
                alt={MOCK_IMAGES[1].alt}
                fill
                className="object-cover transition-transform duration-700 hover:scale-110"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

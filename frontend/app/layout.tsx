import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import dynamic from "next/dynamic"
import { ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"

const UploadManager = dynamic(
  () => import("@/components/organisms/upload-manager").then((m) => m.UploadManager),
  { ssr: false },
)

export const metadata: Metadata = {
  title: "Fotos Patagonia - Fotografía de Eventos y Paisajes",
  description: "Encuentra y compra tus fotos de eventos en la Patagonia",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Questrial&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased">
        {children}
        <UploadManager />
        <ToastContainer
          position="bottom-right"
          autoClose={4000}
          hideProgressBar
          theme="light"
        />
      </body>
    </html>
  )
}


import Image from "next/image"

export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative">
       <img
          src="/Logo-Fotos-Patagonia.png"
          alt="Fotos Patagonia"
          className="w-15 h-12 object-cover"
        />
      </div>
      {/*  <div className="flex flex-col leading-none">
        <span className="text-2xl font-heading tracking-tight">Fotos</span>
        <span className="text-lg font-heading tracking-tight">Patagonia</span>
      </div>  */}
    </div>
  )
}

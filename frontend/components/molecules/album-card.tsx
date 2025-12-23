"use client";

import Link from "next/link";
import Image from "next/image";
import { Camera, MapPin, Calendar } from "lucide-react";
import { usePresignedUrl } from "@/hooks/photos/usePresignedUrl";

// Mantenemos la misma definición de tipo que en la página
interface AlbumWithDetails {
  id: number;
  name: string;
  description?: string | null;
  sessions: any[];
  photoCount: number;
  coverPhotoObjectName?: string; // <-- Cambio de nombre
  location?: string;
  event?: string;
  photographerName?: string;
  photographerId?: number;
  createdAt?: string;
}

export function AlbumCard({ album }: { album: AlbumWithDetails }) {
  const { url: coverPhotoUrl, loading: isLoading } = usePresignedUrl(album.coverPhotoObjectName);

  return (
    <Link href={`/albumes/${album.id}`} className="group">
      <div className="overflow-hidden rounded-2xl bg-card shadow-md transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
        {/* Cover Image */}
        <div className="relative aspect-square overflow-hidden bg-secondary">
          {isLoading ? (
            <div className="flex h-full w-full animate-pulse items-center justify-center bg-gray-200">
              <Camera className="h-16 w-16 text-gray-400" />
            </div>
          ) : album.coverPhotoObjectName ? (
            <Image
              src={coverPhotoUrl}
              alt={album.name}
              fill
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-muted">
              <Camera className="h-16 w-16 text-muted-foreground" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

          {/* Photo Count Badge */}
          <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-black/70 px-3 py-1 text-sm text-white backdrop-blur-sm">
            <Camera className="h-3 w-3" />
            <span>{album.photoCount}</span>
          </div>
        </div>

        {/* Album Info */}
        <div className="p-4">
          <h3 className="mb-2 text-lg font-heading line-clamp-1 group-hover:text-primary transition-colors">
            {album.name}
          </h3>

          {album.event && <p className="mb-2 text-sm text-muted-foreground line-clamp-1">{album.event}</p>}

          <div className="flex flex-col gap-1 text-xs text-muted-foreground">
            {album.location && (
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                <span className="line-clamp-1">{album.location}</span>
              </div>
            )}
            {album.createdAt && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{new Date(album.createdAt).toLocaleDateString("es-AR")}</span>
              </div>
            )}
          </div>

          {album.photographerName && (
            <p className="mt-2 text-xs text-muted-foreground">
              Por {album.photographerName}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}

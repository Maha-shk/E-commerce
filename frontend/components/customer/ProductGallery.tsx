"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Image {
  id: string;
  url: string;
  position: number;
}

interface ProductGalleryProps {
  images: Image[];
}

export function ProductGallery({ images = [] }: ProductGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // If no images, show placeholder
  if (!images || images.length === 0) {
    return (
      <div className="flex aspect-square w-full items-center justify-center rounded-lg bg-muted">
        <p className="text-sm text-muted-foreground">No product images</p>
      </div>
    );
  }

  const currentImage = images[currentIndex];

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleThumbnailClick = (index: number) => {
    setCurrentIndex(index);
  };

  return (
    <div className="flex gap-4">
      {/* Thumbnails - Desktop: Left side, Mobile: Bottom */}
      <div className="hidden gap-2 lg:flex lg:flex-col">
        {images.slice(0, 5).map((image, index) => (
          <button
            key={image.id}
            onClick={() => handleThumbnailClick(index)}
            className={cn(
              "relative aspect-square w-20 overflow-hidden rounded-lg border-2 transition-colors hover:border-primary",
              index === currentIndex ? "border-primary" : "border-border"
            )}
            aria-label={`View image ${index + 1}`}
          >
            <img
              src={image.url}
              alt={`Product thumbnail ${index + 1}`}
              className="size-full object-cover"
            />
          </button>
        ))}
      </div>

      {/* Main Image */}
      <div className="relative flex-1">
        <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-muted">
          <img
            src={currentImage.url}
            alt={`Product image ${currentIndex + 1}`}
            className="size-full object-cover"
          />
        </div>

        {/* Navigation Buttons */}
        {images.length > 1 && (
          <>
            <button
              onClick={handlePrevious}
              className="absolute left-2 top-1/2 flex -translate-y-1/2 size-10 items-center justify-center rounded-full bg-white/90 shadow-md transition-colors hover:bg-white"
              aria-label="Previous image"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-2 top-1/2 flex -translate-y-1/2 size-10 items-center justify-center rounded-full bg-white/90 shadow-md transition-colors hover:bg-white"
              aria-label="Next image"
            >
              <ChevronRight className="size-5" />
            </button>
          </>
        )}
      </div>

      {/* Mobile Thumbnails */}
      <div className="flex gap-2 lg:hidden">
        {images.slice(0, 5).map((image, index) => (
          <button
            key={image.id}
            onClick={() => handleThumbnailClick(index)}
            className={cn(
              "relative aspect-square w-16 overflow-hidden rounded-lg border-2 transition-colors hover:border-primary",
              index === currentIndex ? "border-primary" : "border-border"
            )}
            aria-label={`View image ${index + 1}`}
          >
            <img
              src={image.url}
              alt={`Product thumbnail ${index + 1}`}
              className="size-full object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  );
}

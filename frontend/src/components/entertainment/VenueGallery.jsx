import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { XMarkIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { useLanguage } from '../../contexts/LanguageContext';

const VenueGallery = ({ images, venueName, showFullGallery = false }) => {
  const { translate } = useLanguage();
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const openLightbox = (index) => {
    setSelectedImageIndex(index);
    setCurrentIndex(index);
  };

  const closeLightbox = () => {
    setSelectedImageIndex(null);
  };

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  useEffect(() => {
    if (selectedImageIndex === null) return undefined;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        closeLightbox();
      } else if (event.key === 'ArrowRight') {
        nextImage();
      } else if (event.key === 'ArrowLeft') {
        prevImage();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedImageIndex, images.length]);

  if (!images || images.length === 0) {
    return null;
  }

  const renderLightbox = () => {
    if (selectedImageIndex === null) return null;

    return createPortal(
      <div
        className="fixed inset-0 bg-black bg-opacity-90 z-[2000] flex items-center justify-center"
        onClick={closeLightbox}
      >
        <button
          onClick={closeLightbox}
          className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
        >
          <XMarkIcon className="w-8 h-8" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            prevImage();
          }}
          className="absolute left-4 text-white hover:text-gray-300 z-10"
        >
          <ChevronLeftIcon className="w-10 h-10" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            nextImage();
          }}
          className="absolute right-4 text-white hover:text-gray-300 z-10"
        >
          <ChevronRightIcon className="w-10 h-10" />
        </button>
        <div
          className="max-w-7xl max-h-[90vh] p-4"
          onClick={(e) => e.stopPropagation()}
        >
          <img
            src={
              images[currentIndex].image_display_url ||
              images[currentIndex].image_url ||
              images[currentIndex].image
            }
            alt={
              images[currentIndex].caption ||
              `${venueName} - Image ${currentIndex + 1}`
            }
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
          />
          {images[currentIndex].caption && (
            <p className="text-white text-center mt-4">
              {images[currentIndex].caption}
            </p>
          )}
          <div className="text-white text-center mt-2 text-sm">
            {currentIndex + 1} / {images.length}
          </div>
        </div>
      </div>,
      document.body
    );
  };

  // If showFullGallery is true, show all images in a grid
  if (showFullGallery) {
    return (
      <div className="space-y-3 sm:space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {images.map((image, index) => (
            <div
              key={image.image_id || index}
              className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group"
              onClick={() => openLightbox(index)}
            >
              <img
                src={image.image_display_url || image.image_url || image.image}
                alt={image.caption || `${venueName} - Image ${index + 1}`}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity" />
            </div>
          ))}
        </div>

        {renderLightbox()}
      </div>
    );
  }

  // Default: Show first image with thumbnail strip
  const mainImage = images[0];
  const thumbnails = images.slice(0, 5);

  return (
    <div className="space-y-2">
      {/* Main Image */}
      <div
        className="relative aspect-video rounded-lg overflow-hidden cursor-pointer group"
        onClick={() => openLightbox(0)}
      >
        <img
          src={mainImage.image_display_url || mainImage.image_url || mainImage.image}
          alt={mainImage.caption || `${venueName} - Main image`}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {images.length > 1 && (
          <div className="absolute bottom-2 right-2 bg-black bg-opacity-60 text-white px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm">
            +{images.length - 1} {images.length > 1 ? (translate('common.more') || 'more') : ''}
          </div>
        )}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-opacity" />
      </div>

      {/* Thumbnail Strip */}
      {images.length > 1 && (
        <div className="flex gap-1.5 sm:gap-2 overflow-x-auto scrollbar-hide -mx-1 px-1">
          {thumbnails.map((image, index) => (
            <div
              key={image.image_id || index}
              className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden cursor-pointer group"
              onClick={() => openLightbox(index)}
            >
              <img
                src={image.image_display_url || image.image_url || image.image}
                alt={image.caption || `${venueName} - Thumbnail ${index + 1}`}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              />
            </div>
          ))}
        </div>
      )}

      {renderLightbox()}
    </div>
  );
};

export default VenueGallery;

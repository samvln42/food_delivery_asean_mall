import React, { useState, useEffect, useRef } from "react";

const AdvertisementGallery = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const galleryRef = useRef(null);
  const autoScrollInterval = useRef(null);

  const advertisements = [
    {
      id: 1,
      image:
        "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&h=400&fit=crop&crop=center",
    },
    {
      id: 2,
      image:
        "https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=800&h=400&fit=crop&crop=center",
    },
    {
      id: 3,
      image:
        "https://images.unsplash.com/photo-1551782450-17144efb9c50?w=800&h=400&fit=crop&crop=center",
    },
    {
      id: 4,
      image:
        "https://images.unsplash.com/photo-1571091655789-405eb7a3a3a8?w=800&h=400&fit=crop&crop=center",
    },
  ];

  // 🔁 Duplicate 3 ชุด
  const duplicatedAdvertisements = [
    ...advertisements,
    ...advertisements,
    ...advertisements,
  ];

  // ✅ ใช้ scrollWidth/3 เป็นความกว้างของชุดจริง
  const adjustCircularScroll = () => {
    if (!galleryRef.current) return;
    const container = galleryRef.current;
    const singleSetWidth = container.scrollWidth / 3;

    if (container.scrollLeft >= singleSetWidth * 2) {
      container.scrollLeft -= singleSetWidth;
    } else if (container.scrollLeft < singleSetWidth) {
      container.scrollLeft += singleSetWidth;
    }
  };

  const startAutoScroll = () => {
    if (autoScrollInterval.current) return;

    autoScrollInterval.current = setInterval(() => {
      if (galleryRef.current && !isDragging) {
        galleryRef.current.scrollLeft += 1;
        adjustCircularScroll();
      }
    }, 16); // ~60fps
  };

  const stopAutoScroll = () => {
    if (autoScrollInterval.current) {
      clearInterval(autoScrollInterval.current);
      autoScrollInterval.current = null;
    }
  };

  useEffect(() => {
    if (galleryRef.current) {
      const singleSetWidth = galleryRef.current.scrollWidth / 3;
      // เริ่มต้นที่ชุดกลาง
      galleryRef.current.scrollLeft = singleSetWidth;

      startAutoScroll();
      return () => stopAutoScroll();
    }
  }, []);

  useEffect(() => {
    if (isDragging) stopAutoScroll();
    else startAutoScroll();
  }, [isDragging]);

  // ✅ Mouse drag
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.pageX - galleryRef.current.offsetLeft);
    setScrollLeft(galleryRef.current.scrollLeft);
    stopAutoScroll();
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      const x = e.pageX - galleryRef.current.offsetLeft;
      galleryRef.current.scrollLeft = scrollLeft - (x - startX);
      adjustCircularScroll();
    };

    const handleMouseUp = () => {
      if (!isDragging) return;
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, startX, scrollLeft]);

  // ✅ Touch drag
  const handleTouchStart = (e) => {
    setIsDragging(true);
    setStartX(e.touches[0].pageX - galleryRef.current.offsetLeft);
    setScrollLeft(galleryRef.current.scrollLeft);
    stopAutoScroll();
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    const x = e.touches[0].pageX - galleryRef.current.offsetLeft;
    galleryRef.current.scrollLeft = scrollLeft - (x - startX);
    adjustCircularScroll();
  };

  const handleTouchEnd = () => setIsDragging(false);

  return (
    <div className="relative overflow-hidden bg-gray-100 rounded-xl h-32 sm:h-40">
      <div
        ref={galleryRef}
        className="flex h-full overflow-x-auto select-none [&::-webkit-scrollbar]:hidden"
        style={{ 
          cursor: isDragging ? "grabbing" : "grab",
          scrollbarWidth: "none",
          msOverflowStyle: "none"
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {duplicatedAdvertisements.map((ad, index) => (
          <div
            key={`${ad.id}-${index}`}
            className="w-full h-full flex-shrink-0"
          >
            <img
              src={ad.image}
              alt="Advertisement Banner"
              className="w-full h-full object-cover pointer-events-none"
              draggable={false}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdvertisementGallery;

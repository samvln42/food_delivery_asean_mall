import React, { useState, useEffect, useRef } from "react";
import { advertisementService } from "../../services/api";

const AdvertisementGallery = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [advertisements, setAdvertisements] = useState([]);
  const [loading, setLoading] = useState(true);
  const galleryRef = useRef(null);
  const autoScrollInterval = useRef(null);

  // ดึงข้อมูลโฆษณาจาก API
  useEffect(() => {
    const fetchAdvertisements = async () => {
      try {
        const response = await advertisementService.getActive();
        // Ensure response.data is an array
        const data = Array.isArray(response.data) ? response.data : [];
        setAdvertisements(data);
      } catch (error) {
        console.error("Error fetching advertisements:", error);
        // ถ้าเกิดข้อผิดพลาด แสดงเป็น array ว่าง (ไม่แสดงอะไร)
        setAdvertisements([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAdvertisements();
  }, []);

  // 🔁 Duplicate 3 ชุด
  const duplicatedAdvertisements = Array.isArray(advertisements) ? [
    ...advertisements,
    ...advertisements,
    ...advertisements,
  ] : [];

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
    if (galleryRef.current && Array.isArray(advertisements) && advertisements.length > 0) {
      const singleSetWidth = galleryRef.current.scrollWidth / 3;
      // เริ่มต้นที่ชุดกลาง
      galleryRef.current.scrollLeft = singleSetWidth;

      startAutoScroll();
      return () => stopAutoScroll();
    }
  }, [advertisements]);

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

  // แสดง loading state
  if (loading) {
    return (
      <div className="relative overflow-hidden bg-gray-200 rounded-xl h-32 sm:h-40 flex items-center justify-center">
        <div className="text-gray-500">กำลังโหลด...</div>
      </div>
    );
  }

  // ถ้าไม่มีโฆษณา ไม่แสดงอะไรเลย
  if (!Array.isArray(advertisements) || advertisements.length === 0) {
    return null;
  }

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
            key={`${ad.advertisement_id}-${index}`}
            className="w-full h-full flex-shrink-0"
          >
            <img
              src={ad.image_display_url || "https://via.placeholder.com/800x400"}
              alt={`Advertisement ${ad.advertisement_id}`}
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

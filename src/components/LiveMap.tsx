import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

interface LiveMapProps {
  restaurantLocation?: { lat: number; lng: number };
  customerLocation?: { lat: number; lng: number };
  driverLocation?: { lat: number; lng: number };
  driverName?: string;
  onSelectLocation?: (loc: { lat: number; lng: number }) => void;
  interactive?: boolean;
  height?: string;
}

export const LiveMap: React.FC<LiveMapProps> = ({
  restaurantLocation = { lat: 30.3125, lng: 31.4285 },
  customerLocation,
  driverLocation,
  driverName = 'كابتن التوصيل',
  onSelectLocation,
  interactive = false,
  height = '320px',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{
    restaurant?: L.Marker;
    customer?: L.Marker;
    driver?: L.Marker;
    pin?: L.Marker;
  }>({});

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const initialCenter: [number, number] = customerLocation
        ? [customerLocation.lat, customerLocation.lng]
        : [restaurantLocation.lat, restaurantLocation.lng];

      const map = L.map(mapContainerRef.current, {
        center: initialCenter,
        zoom: 14,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      // Restaurant Marker (Custom HTML icon)
      const restaurantIcon = L.divIcon({
        className: 'custom-map-icon',
        html: `<div style="background:#0f172a; border:2px solid #FF6321; border-radius:50%; width:34px; height:34px; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 10px rgba(0,0,0,0.3); font-size:16px;">🌮</div>`,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      });
      markersRef.current.restaurant = L.marker([restaurantLocation.lat, restaurantLocation.lng], {
        icon: restaurantIcon,
      })
        .addTo(map)
        .bindPopup('<b>مطعم تاكو بروست</b><br>ش السنترال - شبرا النخلة');

      // Click to place customer pin if interactive
      if (interactive && onSelectLocation) {
        map.on('click', (e) => {
          const { lat, lng } = e.latlng;
          onSelectLocation({ lat, lng });

          if (markersRef.current.pin) {
            markersRef.current.pin.setLatLng([lat, lng]);
          } else {
            const pinIcon = L.divIcon({
              className: 'custom-map-icon',
              html: `<div style="background:#FF6321; border:2px solid #fff; border-radius:50%; width:30px; height:30px; display:flex; align-items:center; justify-content:center; box-shadow:0 3px 8px rgba(0,0,0,0.3); font-size:14px; color:#fff;">📍</div>`,
              iconSize: [30, 30],
              iconAnchor: [15, 15],
            });
            markersRef.current.pin = L.marker([lat, lng], { icon: pinIcon }).addTo(map);
          }
        });
      }

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Update Customer Marker
    if (customerLocation) {
      if (markersRef.current.customer) {
        markersRef.current.customer.setLatLng([customerLocation.lat, customerLocation.lng]);
      } else {
        const custIcon = L.divIcon({
          className: 'custom-map-icon',
          html: `<div style="background:#0284c7; border:2px solid #fff; border-radius:50%; width:32px; height:32px; display:flex; align-items:center; justify-content:center; box-shadow:0 3px 8px rgba(0,0,0,0.3); font-size:15px; color:#fff;">🏠</div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });
        markersRef.current.customer = L.marker([customerLocation.lat, customerLocation.lng], {
          icon: custIcon,
        })
          .addTo(map)
          .bindPopup('<b>موقع استلام العميل</b>');
      }
    }

    // Update Driver Marker with smooth movement
    if (driverLocation) {
      if (markersRef.current.driver) {
        markersRef.current.driver.setLatLng([driverLocation.lat, driverLocation.lng]);
      } else {
        const driverIcon = L.divIcon({
          className: 'custom-map-icon',
          html: `<div style="background:#10b981; border:2px solid #fff; border-radius:50%; width:36px; height:36px; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 12px rgba(16,185,129,0.4); font-size:18px; animation: pulse 1.5s infinite;">🛵</div>`,
          iconSize: [36, 36],
          iconAnchor: [18, 18],
        });
        markersRef.current.driver = L.marker([driverLocation.lat, driverLocation.lng], {
          icon: driverIcon,
        })
          .addTo(map)
          .bindPopup(`<b>${driverName}</b><br>في الطريق إليك الآن`);
      }
    }

    // Auto-fit bounds if both driver & customer or restaurant exist
    const points: [number, number][] = [];
    if (restaurantLocation) points.push([restaurantLocation.lat, restaurantLocation.lng]);
    if (customerLocation) points.push([customerLocation.lat, customerLocation.lng]);
    if (driverLocation) points.push([driverLocation.lat, driverLocation.lng]);

    if (points.length > 1) {
      try {
        const bounds = L.latLngBounds(points.map((p) => L.latLng(p[0], p[1])));
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
      } catch (e) {
        // Safe catch
      }
    }
  }, [restaurantLocation, customerLocation, driverLocation, interactive, onSelectLocation, driverName]);

  return (
    <div className="relative rounded-xl overflow-hidden border border-slate-200 shadow-inner">
      <div ref={mapContainerRef} style={{ height, width: '100%' }} className="z-10" />
      {interactive && (
        <div className="absolute bottom-2 right-2 z-20 bg-white/90 backdrop-blur-xs px-3 py-1 rounded-lg text-[11px] font-semibold text-slate-700 shadow-xs border border-slate-200">
          انقر على الخريطة لتحديد موقع التوصيل بدقة 📍
        </div>
      )}
    </div>
  );
};

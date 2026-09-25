import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation, Search, CheckCircle, Compass } from 'lucide-react';
import Button from './Button';

// SRI LANKA COMMON REGIONAL PRESETS
const SRI_LANKA_PRESETS = [
  { name: 'Colombo', lat: 6.9271, lng: 79.8612 },
  { name: 'Galle', lat: 6.0535, lng: 80.2210 },
  { name: 'Kandy', lat: 7.2906, lng: 80.6337 },
  { name: 'Jaffna', lat: 9.6615, lng: 80.0255 },
  { name: 'Matara', lat: 5.9549, lng: 80.5550 },
  { name: 'Kurunegala', lat: 7.4863, lng: 80.3623 },
  { name: 'Anuradhapura', lat: 8.3114, lng: 80.4037 },
  { name: 'Hambantota', lat: 6.1429, lng: 81.1212 },
];

/**
 * Modern SVG Microgrid Node Pin Icon for Leaflet
 */
const createMicrogridPin = () => {
  return L.divIcon({
    className: 'microgrid-map-pin',
    html: `
      <div style="
        position: relative;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          position: absolute;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(245, 158, 11, 0.35);
          animation: pulseMarker 2s infinite;
        "></div>
        <div style="
          width: 26px;
          height: 26px;
          background: #f59e0b;
          border: 2px solid #ffffff;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          box-shadow: 0 4px 12px rgba(0,0,0,0.6);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="
            width: 8px;
            height: 8px;
            background: #ffffff;
            border-radius: 50%;
            transform: rotate(45deg);
          "></div>
        </div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

/**
 * Interactive Map Location Picker
 * Allows clicking on map or dragging marker to automatically capture:
 * - Latitude
 * - Longitude
 * - Reverse Geocoded Location Name (City / Area)
 */
const LocationPickerMap = ({
  latitude,
  longitude,
  locationName = '',
  onLocationSelect,
}) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  const [geocoding, setGeocoding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCoords, setSelectedCoords] = useState(null);

  // Parse initial coordinates or fallback to Sri Lanka center
  const initialLat = parseFloat(latitude) || 6.9271; // Default Colombo
  const initialLng = parseFloat(longitude) || 79.8612;
  const hasInitialCoords = Boolean(parseFloat(latitude) && parseFloat(longitude));

  // Reverse geocoding via OpenStreetMap Nominatim
  const reverseGeocode = useCallback(async (lat, lng) => {
    setGeocoding(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=en`,
        { headers: { 'User-Agent': 'SmartSolarMicrogrid/1.0' } }
      );
      if (!response.ok) throw new Error('Geocoding failed');
      const data = await response.json();

      const addr = data.address || {};
      const detectedCity =
        addr.city ||
        addr.town ||
        addr.municipality ||
        addr.suburb ||
        addr.village ||
        addr.county ||
        addr.state_district ||
        addr.state ||
        'Sri Lanka';

      return detectedCity;
    } catch {
      // Fallback: estimate nearest preset city
      let nearestCity = 'Sri Lanka';
      let minDistance = Infinity;
      for (const preset of SRI_LANKA_PRESETS) {
        const d = Math.hypot(preset.lat - lat, preset.lng - lng);
        if (d < minDistance) {
          minDistance = d;
          nearestCity = preset.name;
        }
      }
      return nearestCity;
    } finally {
      setGeocoding(false);
    }
  }, []);

  // Update marker and dispatch selected position
  const setPosition = useCallback(
    async (lat, lng, overrideLocationName = null) => {
      const roundedLat = parseFloat(lat.toFixed(6));
      const roundedLng = parseFloat(lng.toFixed(6));

      setSelectedCoords({ lat: roundedLat, lng: roundedLng });

      // Move or create marker
      if (markerRef.current && mapInstanceRef.current) {
        markerRef.current.setLatLng([roundedLat, roundedLng]);
      }

      // Determine location name
      let locName = overrideLocationName;
      if (!locName) {
        locName = await reverseGeocode(roundedLat, roundedLng);
      }

      if (onLocationSelect) {
        onLocationSelect({
          latitude: roundedLat.toString(),
          longitude: roundedLng.toString(),
          location: locName,
        });
      }
    },
    [onLocationSelect, reverseGeocode]
  );

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return; // Prevent double init

    const centerLat = hasInitialCoords ? initialLat : 7.8731; // Sri Lanka center
    const centerLng = hasInitialCoords ? initialLng : 80.7718;
    const initialZoom = hasInitialCoords ? 13 : 8;

    const map = L.map(mapContainerRef.current, {
      center: [centerLat, centerLng],
      zoom: initialZoom,
      minZoom: 6,
      maxZoom: 18,
    });

    // Dark-themed tiles from CartoDB with fallback attribution
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    // Initial marker if coords exist
    const pinIcon = createMicrogridPin();
    const marker = L.marker([centerLat, centerLng], {
      icon: pinIcon,
      draggable: true,
    }).addTo(map);

    markerRef.current = marker;
    mapInstanceRef.current = map;

    if (hasInitialCoords) {
      setSelectedCoords({ lat: initialLat, lng: initialLng });
    }

    // Handle marker drag end
    marker.on('dragend', async (e) => {
      const pos = e.target.getLatLng();
      await setPosition(pos.lat, pos.lng);
    });

    // Handle map click
    map.on('click', async (e) => {
      const { lat, lng } = e.latlng;
      await setPosition(lat, lng);
    });

    // Invalidate size after layout mounts to ensure proper rendering
    setTimeout(() => {
      map.invalidateSize();
    }, 250);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []); // Run once on mount

  // Sync if latitude/longitude change from external inputs
  useEffect(() => {
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    if (!isNaN(lat) && !isNaN(lng) && mapInstanceRef.current && markerRef.current) {
      if (!selectedCoords || selectedCoords.lat !== lat || selectedCoords.lng !== lng) {
        markerRef.current.setLatLng([lat, lng]);
        setSelectedCoords({ lat, lng });
      }
    }
  }, [latitude, longitude, selectedCoords]);

  // Handle Preset selection
  const handleSelectPreset = async (preset) => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([preset.lat, preset.lng], 14, { duration: 1.2 });
    }
    await setPosition(preset.lat, preset.lng, preset.name);
  };

  // Search forward geocoding
  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setGeocoding(true);
    try {
      const q = encodeURIComponent(`${searchQuery.trim()}, Sri Lanka`);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`,
        { headers: { 'User-Agent': 'SmartSolarMicrogrid/1.0' } }
      );
      const data = await response.json();
      if (data && data.length > 0) {
        const item = data[0];
        const lat = parseFloat(item.lat);
        const lng = parseFloat(item.lon);
        const name = item.display_name.split(',')[0].trim();

        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([lat, lng], 14, { duration: 1.2 });
        }
        await setPosition(lat, lng, name);
      }
    } catch {
      // Ignored
    } finally {
      setGeocoding(false);
    }
  };

  // Use browser geolocation
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) return;
    setGeocoding(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([lat, lng], 15, { duration: 1.2 });
        }
        await setPosition(lat, lng);
        setGeocoding(false);
      },
      () => setGeocoding(false)
    );
  };

  return (
    <div style={{ marginTop: 8, marginBottom: 24 }}>
      {/* Header / Instructions */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 10
      }}>
        <label className="form-label" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
          <MapPin size={16} color="var(--primary)" />
          Interactive Node Location Picker
        </label>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Click anywhere on map or drag pin to auto-detect coordinates & location
        </span>
      </div>

      {/* Search & Actions Bar */}
      <div style={{
        display: 'flex',
        gap: 8,
        flexWrap: 'wrap',
        alignItems: 'center',
        marginBottom: 12
      }}>
        <div style={{ position: 'relative', flex: '1 1 240px', minWidth: 200 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-control"
            placeholder="Search town (e.g. Galle, Kandy, Negombo)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch(e)}
            style={{ paddingLeft: 34, height: 36, fontSize: '0.85rem' }}
          />
        </div>
        <Button type="button" variant="secondary" size="sm" onClick={handleSearch} disabled={geocoding}>
          <Search size={14} className="icon-mr" /> Find
        </Button>
        <Button type="button" variant="secondary" size="sm" onClick={handleUseCurrentLocation} title="Locate via GPS">
          <Navigation size={14} className="icon-mr" /> My Location
        </Button>
      </div>

      {/* Quick Regional Presets */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        flexWrap: 'wrap',
        marginBottom: 12
      }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <Compass size={13} /> Quick Select:
        </span>
        {SRI_LANKA_PRESETS.map((p) => {
          const isSelected =
            selectedCoords &&
            Math.abs(selectedCoords.lat - p.lat) < 0.05 &&
            Math.abs(selectedCoords.lng - p.lng) < 0.05;
          return (
            <button
              key={p.name}
              type="button"
              onClick={() => handleSelectPreset(p)}
              style={{
                background: isSelected ? 'var(--primary)' : 'rgba(255, 255, 255, 0.05)',
                color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                padding: '3px 10px',
                borderRadius: '14px',
                fontSize: '0.75rem',
                cursor: 'pointer',
                fontWeight: isSelected ? 700 : 500,
                transition: 'all 0.15s ease',
              }}
            >
              {p.name}
            </button>
          );
        })}
      </div>

      {/* Map Element Container */}
      <div
        style={{
          position: 'relative',
          borderRadius: 'var(--radius-md, 8px)',
          overflow: 'hidden',
          border: '1px solid var(--border)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        }}
      >
        <div
          ref={mapContainerRef}
          style={{
            height: 320,
            width: '100%',
            background: '#131b2e',
            cursor: 'crosshair',
          }}
        />

        {/* Live Detected Info Overlay at Map Bottom */}
        <div
          style={{
            position: 'absolute',
            bottom: 12,
            left: 12,
            right: 12,
            zIndex: 1000,
            background: 'rgba(15, 23, 42, 0.88)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '6px',
            padding: '8px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 8,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem' }}>
            <span style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: geocoding ? 'var(--warning, #f59e0b)' : 'var(--success, #10b981)',
              boxShadow: geocoding ? '0 0 8px #f59e0b' : '0 0 8px #10b981'
            }} />
            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
              {geocoding ? 'Detecting location name...' : `Selected: ${locationName || 'Sri Lanka'}`}
            </span>
          </div>

          {selectedCoords && (
            <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--accent, #f59e0b)', fontWeight: 700 }}>
              Lat: {selectedCoords.lat.toFixed(4)}, Lng: {selectedCoords.lng.toFixed(4)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LocationPickerMap;

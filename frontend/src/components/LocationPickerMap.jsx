import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation, Search, Compass, Layers, CheckCircle2 } from 'lucide-react';
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
        width: 34px;
        height: 34px;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          position: absolute;
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: rgba(245, 158, 11, 0.4);
          animation: pulseMarker 2s infinite;
        "></div>
        <div style="
          width: 28px;
          height: 28px;
          background: #f59e0b;
          border: 2.5px solid #ffffff;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          box-shadow: 0 4px 14px rgba(0,0,0,0.7);
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
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    popupAnchor: [0, -34],
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
  const tileLayerRef = useRef(null);

  const [geocoding, setGeocoding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCoords, setSelectedCoords] = useState(null);
  const [mapTheme, setMapTheme] = useState('dark'); // 'dark' | 'street'

  // Parse initial coordinates or fallback to Sri Lanka center
  const initialLat = parseFloat(latitude) || 6.9271;
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
      // Fallback: estimate nearest preset city in Sri Lanka
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

  const onLocationSelectRef = useRef(onLocationSelect);
  useEffect(() => {
    onLocationSelectRef.current = onLocationSelect;
  }, [onLocationSelect]);

  // Helper to quickly find nearest major Sri Lankan city
  const getNearestPresetName = useCallback((lat, lng) => {
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
  }, []);

  // Update marker position and emit values to parent form instantly
  const setPosition = useCallback(
    async (lat, lng, overrideLocationName = null) => {
      const roundedLat = parseFloat(lat.toFixed(6));
      const roundedLng = parseFloat(lng.toFixed(6));

      setSelectedCoords({ lat: roundedLat, lng: roundedLng });

      // Move marker on map
      if (markerRef.current) {
        markerRef.current.setLatLng([roundedLat, roundedLng]);
      }

      // 1. Immediately emit coordinates and fallback location so form has values instantly (0ms delay)
      const instantLocation = overrideLocationName || getNearestPresetName(roundedLat, roundedLng);
      if (onLocationSelectRef.current) {
        onLocationSelectRef.current({
          latitude: roundedLat.toString(),
          longitude: roundedLng.toString(),
          location: instantLocation,
        });
      }

      // 2. If no override provided, asynchronously refine with high-detail Nominatim town name
      if (!overrideLocationName) {
        const refinedName = await reverseGeocode(roundedLat, roundedLng);
        if (refinedName && refinedName !== instantLocation && onLocationSelectRef.current) {
          onLocationSelectRef.current({
            latitude: roundedLat.toString(),
            longitude: roundedLng.toString(),
            location: refinedName,
          });
        }
      }
    },
    [reverseGeocode, getNearestPresetName]
  );

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return; // Prevent double initialization

    const centerLat = hasInitialCoords ? initialLat : 7.8731; // Sri Lanka center
    const centerLng = hasInitialCoords ? initialLng : 80.7718;
    const initialZoom = hasInitialCoords ? 13 : 8;

    const map = L.map(mapContainerRef.current, {
      center: [centerLat, centerLng],
      zoom: initialZoom,
      minZoom: 6,
      maxZoom: 18,
    });

    // Use OpenStreetMap standard tiles (100% free, reliable, no API key required)
    const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      subdomains: ['a', 'b', 'c'],
      maxZoom: 19,
      className: mapTheme === 'dark' ? 'leaflet-dark-tiles' : '',
    }).addTo(map);

    tileLayerRef.current = tileLayer;

    // Microgrid pin marker
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

    // Invalidate size multiple times to ensure full canvas load
    const t1 = setTimeout(() => map.invalidateSize(), 100);
    const t2 = setTimeout(() => map.invalidateSize(), 300);
    const t3 = setTimeout(() => map.invalidateSize(), 600);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []); // Run once on mount

  // Toggle map theme between dark and street
  const toggleTheme = () => {
    const newTheme = mapTheme === 'dark' ? 'street' : 'dark';
    setMapTheme(newTheme);

    if (mapInstanceRef.current && tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
      const newLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        subdomains: ['a', 'b', 'c'],
        maxZoom: 19,
        className: newTheme === 'dark' ? 'leaflet-dark-tiles' : '',
      }).addTo(mapInstanceRef.current);
      tileLayerRef.current = newLayer;
    }
  };

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
      // Search fallback handled gracefully
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
    <div style={{ marginTop: 12, marginBottom: 24 }}>
      {/* Header / Instructions */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 12
      }}>
        <label className="form-label" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-primary)' }}>
          <MapPin size={16} color="var(--primary)" />
          Interactive Node Location Picker
        </label>
        <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          Click anywhere on map or drag pin to auto-detect coordinates & location
        </span>
      </div>

      {/* Search & Actions Bar */}
      <div style={{
        display: 'flex',
        gap: 10,
        flexWrap: 'wrap',
        alignItems: 'center',
        marginBottom: 14
      }}>
        <div style={{ position: 'relative', flex: '1 1 240px', minWidth: 200 }}>
          <Search size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', zIndex: 1 }} />
          <input
            type="text"
            className="form-input"
            placeholder="Search town (e.g. Galle, Kandy, Negombo)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch(e)}
            style={{ paddingLeft: 38, height: 40, fontSize: '0.88rem' }}
          />
        </div>
        <Button type="button" variant="secondary" size="sm" onClick={handleSearch} disabled={geocoding} style={{ height: 40 }}>
          <Search size={14} className="icon-mr" /> Find
        </Button>
        <Button type="button" variant="secondary" size="sm" onClick={handleUseCurrentLocation} title="Locate via GPS" style={{ height: 40 }}>
          <Navigation size={14} className="icon-mr" /> My Location
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={toggleTheme}
          title={mapTheme === 'dark' ? 'Switch to Street View' : 'Switch to Dark Microgrid View'}
          style={{ height: 40, padding: '0 12px' }}
        >
          <Layers size={14} className="icon-mr" />
          {mapTheme === 'dark' ? 'Street View' : 'Dark Theme'}
        </Button>
      </div>

      {/* Quick Regional Presets */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        flexWrap: 'wrap',
        marginBottom: 14
      }}>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
          <Compass size={14} /> Quick Select:
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
                background: isSelected ? 'var(--primary)' : 'rgba(255, 255, 255, 0.06)',
                color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                padding: '4px 12px',
                borderRadius: '16px',
                fontSize: '0.78rem',
                cursor: 'pointer',
                fontWeight: isSelected ? 700 : 500,
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }
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
          borderRadius: 'var(--radius-lg, 12px)',
          overflow: 'hidden',
          border: '1px solid var(--border)',
          boxShadow: '0 6px 24px rgba(0,0,0,0.4)',
        }}
      >
        <div
          ref={mapContainerRef}
          style={{
            height: 380,
            width: '100%',
            background: '#0b1120',
            cursor: 'crosshair',
          }}
        />

        {/* Live Detected Info Overlay at Map Bottom */}
        <div
          style={{
            position: 'absolute',
            bottom: 14,
            left: 14,
            right: 14,
            zIndex: 1000,
            background: 'rgba(15, 23, 42, 0.92)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.14)',
            borderRadius: '8px',
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 10,
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.5)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.85rem' }}>
            <span style={{
              width: 9,
              height: 9,
              borderRadius: '50%',
              backgroundColor: geocoding ? 'var(--warning, #f59e0b)' : 'var(--success, #10b981)',
              boxShadow: geocoding ? '0 0 10px #f59e0b' : '0 0 10px #10b981'
            }} />
            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
              {geocoding ? 'Detecting location name...' : (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <CheckCircle2 size={15} color="var(--success)" />
                  Location: <strong style={{ color: 'var(--primary-light)' }}>{locationName || 'Sri Lanka'}</strong>
                </span>
              )}
            </span>
          </div>

          {selectedCoords && (
            <div style={{
              fontSize: '0.82rem',
              fontFamily: 'monospace',
              color: 'var(--accent-light, #38bdf8)',
              background: 'rgba(6, 182, 212, 0.1)',
              border: '1px solid rgba(6, 182, 212, 0.25)',
              padding: '3px 10px',
              borderRadius: '4px',
              fontWeight: 700
            }}>
              Lat: {selectedCoords.lat.toFixed(4)}, Lng: {selectedCoords.lng.toFixed(4)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LocationPickerMap;

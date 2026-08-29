"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

export interface GeoLocationState {
  lat: number;
  lng: number;
  address: string;
  radiusKm: number;
  isLocating: boolean;
  accuracy: number | null;
  error: string | null;
  requestCurrentGPS: () => Promise<boolean>;
  setLocation: (address: string, lat: number, lng: number) => void;
  setRadius: (radius: number) => void;
}

export const PRESET_HUBS = [
  { name: "Dekat Kampus ITS, Surabaya", lat: -7.2856, lng: 112.6954 },
  { name: "Kampus UNAIR B, Gubeng Surabaya", lat: -7.2694, lng: 112.7582 },
  { name: "Kampus UB / Malang Kota", lat: -7.9525, lng: 112.6144 },
  { name: "Kampus ITB / Dago Bandung", lat: -6.8915, lng: 107.6107 },
  { name: "Kampus UI / Margonda Depok", lat: -6.3644, lng: 106.8286 },
  { name: "Kuningan / Sudirman Jakarta", lat: -6.2244, lng: 106.8294 },
];

const DEFAULT_HUB = PRESET_HUBS[0];

const GeoContext = createContext<GeoLocationState | null>(null);

export function GeoProvider({ children }: { children: React.ReactNode }) {
  const [lat, setLat] = useState<number>(DEFAULT_HUB.lat);
  const [lng, setLng] = useState<number>(DEFAULT_HUB.lng);
  const [address, setAddress] = useState<string>(DEFAULT_HUB.name);
  const [radiusKm, setRadiusKm] = useState<number>(5);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load saved location preferences from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("fr_geo");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.lat && parsed.lng) {
            setLat(parsed.lat);
            setLng(parsed.lng);
            setAddress(parsed.address || DEFAULT_HUB.name);
            setRadiusKm(parsed.radiusKm || 5);
          }
        } catch {
          // ignore
        }
      }
    }
  }, []);

  const saveToStorage = (newLat: number, newLng: number, newAddr: string, newRad: number) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "fr_geo",
        JSON.stringify({ lat: newLat, lng: newLng, address: newAddr, radiusKm: newRad })
      );
    }
  };

  const requestCurrentGPS = useCallback(async (): Promise<boolean> => {
    setIsLocating(true);
    setError(null);

    if (!("geolocation" in navigator)) {
      setIsLocating(false);
      setError("Browser Anda tidak mendukung geolokasi.");
      return false;
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const latitude = pos.coords.latitude;
          const longitude = pos.coords.longitude;
          const acc = Math.round(pos.coords.accuracy);

          setLat(latitude);
          setLng(longitude);
          setAccuracy(acc);

          let readableAddr = `GPS (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;

          // Try reverse geocoding via OpenStreetMap Nominatim
          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=id`
            );
            if (res.ok) {
              const data = await res.json();
              const suburb =
                data.address?.suburb ||
                data.address?.neighbourhood ||
                data.address?.village ||
                data.address?.city_district;
              const city =
                data.address?.city || data.address?.town || data.address?.county || "Lokasi Anda";
              if (suburb && city) {
                readableAddr = `${suburb}, ${city}`;
              } else if (data.display_name) {
                readableAddr = data.display_name.split(",").slice(0, 2).join(",");
              }
            }
          } catch {
            // Keep coordinates string as fallback
          }

          setAddress(readableAddr);
          setIsLocating(false);
          saveToStorage(latitude, longitude, readableAddr, radiusKm);
          resolve(true);
        },
        (err) => {
          setIsLocating(false);
          let msg = "Gagal mengambil lokasi GPS.";
          if (err.code === 1) msg = "Izin akses lokasi ditolak oleh browser/perangkat.";
          else if (err.code === 2) msg = "Sinyal GPS tidak terdeteksi.";
          else if (err.code === 3) msg = "Waktu pencarian GPS habis (Timeout).";
          setError(msg);
          resolve(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    });
  }, [radiusKm]);

  const setLocation = useCallback(
    (newAddr: string, newLat: number, newLng: number) => {
      setAddress(newAddr);
      setLat(newLat);
      setLng(newLng);
      setError(null);
      saveToStorage(newLat, newLng, newAddr, radiusKm);
    },
    [radiusKm]
  );

  const setRadius = useCallback(
    (newRadius: number) => {
      setRadiusKm(newRadius);
      saveToStorage(lat, lng, address, newRadius);
    },
    [lat, lng, address]
  );

  return (
    <GeoContext.Provider
      value={{
        lat,
        lng,
        address,
        radiusKm,
        isLocating,
        accuracy,
        error,
        requestCurrentGPS,
        setLocation,
        setRadius,
      }}
    >
      {children}
    </GeoContext.Provider>
  );
}

export function useGeoLocation(): GeoLocationState {
  const context = useContext(GeoContext);
  if (!context) {
    throw new Error("useGeoLocation must be used within a GeoProvider");
  }
  return context;
}

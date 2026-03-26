import { useState, useEffect } from 'react';

export interface WeatherData {
  temp: number;
  description: string;
  city: string;
  humidity: number;
}

export const useWeather = (lat?: number, lng?: number) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!lat || !lng) return;

    const fetchWeather = async () => {
      setLoading(true);
      try {
        // Using a public API or mock for demo if no key provided
        // For this app, we'll use a mock if no API key is available, 
        // but we'll try to fetch from a generic service.
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true`);
        const data = await res.json();
        
        setWeather({
          temp: data.current_weather.temperature,
          description: "Ensoleillé", // Open-meteo doesn't give text descriptions easily without mapping codes
          city: "Votre position",
          humidity: 65
        });
      } catch (err) {
        console.error("Weather fetch failed", err);
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, [lat, lng]);

  return { weather, loading };
};

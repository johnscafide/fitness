import { useState, useEffect } from 'react';

// Open-Meteo weather codes to emoji + label
const WMO = {
  0:  { icon: '☀️', label: 'Clear' },
  1:  { icon: '🌤️', label: 'Mostly Clear' },
  2:  { icon: '⛅', label: 'Partly Cloudy' },
  3:  { icon: '☁️', label: 'Overcast' },
  45: { icon: '🌫️', label: 'Foggy' },
  48: { icon: '🌫️', label: 'Icy Fog' },
  51: { icon: '🌦️', label: 'Light Drizzle' },
  53: { icon: '🌧️', label: 'Drizzle' },
  55: { icon: '🌧️', label: 'Heavy Drizzle' },
  61: { icon: '🌧️', label: 'Light Rain' },
  63: { icon: '🌧️', label: 'Rain' },
  65: { icon: '🌧️', label: 'Heavy Rain' },
  71: { icon: '🌨️', label: 'Light Snow' },
  73: { icon: '❄️', label: 'Snow' },
  75: { icon: '❄️', label: 'Heavy Snow' },
  80: { icon: '🌦️', label: 'Showers' },
  81: { icon: '🌧️', label: 'Rain Showers' },
  82: { icon: '⛈️', label: 'Heavy Showers' },
  95: { icon: '⛈️', label: 'Thunderstorm' },
  99: { icon: '⛈️', label: 'Severe Storm' },
};

const getWMO = (code) => WMO[code] || WMO[Math.floor(code / 10) * 10] || { icon: '🌡️', label: 'Unknown' };

export const useWeather = () => {
  const [weather, setWeather] = useState(null);

  useEffect(() => {
    // Try to get location
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const { latitude: lat, longitude: lon } = coords;
          const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weathercode&temperature_unit=fahrenheit&timezone=auto`;
          const res  = await fetch(url);
          const data = await res.json();
          const cur  = data.current;
          const wmo  = getWMO(cur.weathercode);
          setWeather({
            temp:  Math.round(cur.temperature_2m),
            icon:  wmo.icon,
            label: wmo.label,
          });
        } catch {
          // Silently fail — weather is cosmetic
        }
      },
      () => {},  // Location denied — no weather
      { timeout: 5000, maximumAge: 600000 }  // Cache position 10 min
    );
  }, []);

  return weather;
};

export function WeatherWidget() {
  const weather = useWeather();
  if (!weather) return null;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-dim)',
      background: 'var(--bg-2)', border: '1px solid var(--border)',
      padding: '6px 12px',
    }}>
      <span style={{ fontSize: 18 }}>{weather.icon}</span>
      <span style={{ fontFamily: 'var(--display)', fontSize: 20, color: 'var(--text)', letterSpacing: 1 }}>
        {weather.temp}°F
      </span>
      <span style={{ fontSize: 10, letterSpacing: 1, textTransform: 'uppercase' }}>{weather.label}</span>
    </div>
  );
}

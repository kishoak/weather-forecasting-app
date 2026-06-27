import { useEffect, useState } from "react";

const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;

function App() {
  const [city, setCity] = useState("Montreal");
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [unit, setUnit] = useState("C");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const convertTemp = (temp) => {
    if (unit === "F") return Math.round((temp * 9) / 5 + 32);
    return Math.round(temp);
  };

  const unitSymbol = unit === "F" ? "°F" : "°C";

  const getWeatherByCity = async (cityName) => {
    if (!cityName.trim()) {
      setError("Please enter a city name.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${cityName}&appid=${API_KEY}&units=metric`;
      const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${cityName}&appid=${API_KEY}&units=metric`;

      const weatherRes = await fetch(weatherUrl);
      const forecastRes = await fetch(forecastUrl);

      if (!weatherRes.ok || !forecastRes.ok) {
        throw new Error("City not found. Please try another city.");
      }

      const weatherData = await weatherRes.json();
      const forecastData = await forecastRes.json();

      setWeather(weatherData);
      setForecast(getDailyForecast(forecastData.list));
    } catch (err) {
      setWeather(null);
      setForecast([]);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getWeatherByLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser.");
      return;
    }

    setLoading(true);
    setError("");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;

          const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric`;
          const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric`;

          const weatherRes = await fetch(weatherUrl);
          const forecastRes = await fetch(forecastUrl);

          if (!weatherRes.ok || !forecastRes.ok) {
            throw new Error("Unable to get weather for your location.");
          }

          const weatherData = await weatherRes.json();
          const forecastData = await forecastRes.json();

          setCity(weatherData.name);
          setWeather(weatherData);
          setForecast(getDailyForecast(forecastData.list));
        } catch (err) {
          setWeather(null);
          setForecast([]);
          setError(err.message);
        } finally {
          setLoading(false);
        }
      },
      () => {
        setLoading(false);
        setError("Location permission was denied.");
      }
    );
  };

  const getDailyForecast = (list) => {
    const days = [];

    for (let item of list) {
      if (item.dt_txt.includes("12:00:00")) {
        days.push(item);
      }
      if (days.length === 5) break;
    }

    return days;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    getWeatherByCity(city);
  };

  const formatDate = (dateText) => {
    return new Date(dateText).toLocaleDateString("en-CA", {
      weekday: "short",
      month: "short",
      day: "numeric"
    });
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleTimeString("en-CA", {
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  useEffect(() => {
    getWeatherByCity("Montreal");
  }, []);

  return (
    <div className="app">
      <div className="background-circle circle-one"></div>
      <div className="background-circle circle-two"></div>

      <main className="weather-container">
        <section className="hero">
          <p className="small-title">Kish Weather</p>
          <h1>Weather Forecasting App</h1>
          <p className="subtitle">
            Search any city, use your current location, and view the current weather with a 5-day forecast.
          </p>
        </section>

        <form className="search-box" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Enter a city..."
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />

          <button type="submit">Search</button>

          <button type="button" onClick={getWeatherByLocation}>
            Use Location
          </button>

          <button
            type="button"
            className="unit-button"
            onClick={() => setUnit(unit === "C" ? "F" : "C")}
          >
            {unit === "C" ? "Show °F" : "Show °C"}
          </button>
        </form>

        {loading && <p className="message">Loading weather data...</p>}

        {error && <p className="error">{error}</p>}

        {weather && !loading && (
          <section className="weather-card">
            <div className="main-weather">
              <div>
                <h2>
                  {weather.name}, {weather.sys.country}
                </h2>
                <p className="description">{weather.weather[0].description}</p>
              </div>

              <img
                src={`https://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`}
                alt={weather.weather[0].description}
              />
            </div>

            <div className="temperature">
              {convertTemp(weather.main.temp)}
              <span>{unitSymbol}</span>
            </div>

            <div className="details-grid">
              <div className="detail-box">
                <p>Feels Like</p>
                <h3>
                  {convertTemp(weather.main.feels_like)}
                  {unitSymbol}
                </h3>
              </div>

              <div className="detail-box">
                <p>Humidity</p>
                <h3>{weather.main.humidity}%</h3>
              </div>

              <div className="detail-box">
                <p>Wind Speed</p>
                <h3>{Math.round(weather.wind.speed * 3.6)} km/h</h3>
              </div>

              <div className="detail-box">
                <p>Pressure</p>
                <h3>{weather.main.pressure} hPa</h3>
              </div>

              <div className="detail-box">
                <p>Sunrise</p>
                <h3>{formatTime(weather.sys.sunrise)}</h3>
              </div>

              <div className="detail-box">
                <p>Sunset</p>
                <h3>{formatTime(weather.sys.sunset)}</h3>
              </div>
            </div>
          </section>
        )}

        {forecast.length > 0 && !loading && (
          <section className="forecast-section">
            <h2>5-Day Forecast</h2>

            <div className="forecast-grid">
              {forecast.map((day) => (
                <div className="forecast-card" key={day.dt}>
                  <p>{formatDate(day.dt_txt)}</p>

                  <img
                    src={`https://openweathermap.org/img/wn/${day.weather[0].icon}@2x.png`}
                    alt={day.weather[0].description}
                  />

                  <h3>
                    {convertTemp(day.main.temp)}
                    {unitSymbol}
                  </h3>

                  <span>{day.weather[0].main}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;
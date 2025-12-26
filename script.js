// DOM references
const forecastContainer = document.getElementById('forecast'),
      inputCity = document.getElementById('cityInput'),
      btnSearch = document.getElementById('searchBtn'),
      selectUnit = document.getElementById('unitSelect');

// OpenWeatherMap API key
const OWM_KEY = 'cb0269513c1320546a451e8cb7a14321';
function getApiKey() {
    return OWM_KEY || localStorage.getItem('OWM_API_KEY') || '';
}

// Trigger weather fetch when search button clicked
btnSearch.addEventListener('click', () => {
    const cityName = inputCity.value.trim();
    if (!cityName) return;
    retrieveWeather(cityName);
});

// Also trigger weather fetch on Enter key
inputCity.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const cityName = inputCity.value.trim();
        if (!cityName) return;
        retrieveWeather(cityName);
    }
});

// Fetch weather info by city
async function retrieveWeather(city) {
    const key = getApiKey();
    if (!key) return;

    try {
        const units = 'metric'; // default to Celsius
        const currentResp = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${key}&units=${units}`);
        if (!currentResp.ok) return;
        const currentData = await currentResp.json();

        const forecastResp = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${key}&units=${units}`);
        if (!forecastResp.ok) return;
        const forecastData = await forecastResp.json();

        displayWeather(currentData, forecastData);
    } catch(err) {
        console.error(err);
    }
}

// Render current and forecast weather
function displayWeather(current, forecast) {
    forecastContainer.innerHTML = '';
    const unit = selectUnit.value || 'C';
    const isFahrenheit = unit === 'F';
    const convertTemp = c => isFahrenheit ? Math.round(c * 9 / 5 + 32) : Math.round(c);
    const tempSymbol = isFahrenheit ? '°F' : '°C';

    // Current weather card
    const currentCard = document.createElement('article');
    currentCard.className = 'card';
    currentCard.innerHTML = `
        <div class="date">${current.name} — Now</div>
        <div class="icon">${mapWeatherToIcon(current.weather[0].id)}</div>
        <div class="desc">${current.weather[0].description}</div>
        <div class="temps">
            <div class="temp-max">${convertTemp(current.main.temp)}${tempSymbol}</div>
            <div class="temp-min">💧 ${current.main.humidity}%</div>
        </div>
    `;
    forecastContainer.appendChild(currentCard);

    // Group forecast items by day
    const dailyForecast = groupForecastByDay(forecast.list);
    Object.keys(dailyForecast).slice(0,5).forEach(dayKey => {
        const dayData = dailyForecast[dayKey];
        const maxTemp = Math.max(...dayData.temps);
        const minTemp = Math.min(...dayData.temps);

        const dayCard = document.createElement('article');
        dayCard.className = 'card';
        dayCard.innerHTML = `
            <div class="date">${new Date(dayKey + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</div>
            <div class="icon">${mapWeatherToIcon(dayData.mainWeatherId)}</div>
            <div class="desc">${dayData.description}</div>
            <div class="temps">
                <div class="temp-max">${convertTemp(maxTemp)}${tempSymbol}</div>
                <div class="temp-min">${convertTemp(minTemp)}${tempSymbol}</div>
            </div>
            <div class="desc">💧 ${Math.round(dayData.avgHumidity)}%</div>
        `;
        forecastContainer.appendChild(dayCard);
    });
}

// Organize forecast list by day
function groupForecastByDay(list) {
    const grouped = {};

    list.forEach(item => {
        const dayKey = item.dt_txt.split(' ')[0];
        if (!grouped[dayKey]) grouped[dayKey] = { temps: [], humidities: [], weatherIds: [], descriptions: [], mainWeatherId: null, description: '' };
        const g = grouped[dayKey];
        g.temps.push(item.main.temp);
        g.humidities.push(item.main.humidity);
        g.weatherIds.push(item.weather[0].id);
        g.descriptions.push(item.weather[0].main);
        if (item.dt_txt.includes('12:00:00')) {
            g.mainWeatherId = item.weather[0].id;
            g.description = item.weather[0].main;
        }
    });

    Object.keys(grouped).forEach(k => {
        const g = grouped[k];
        g.avgHumidity = g.humidities.reduce((a,b) => a+b, 0) / g.humidities.length;
        if (!g.mainWeatherId) {
            g.mainWeatherId = g.weatherIds[0];
            g.description = g.descriptions[0];
        }
    });

    return grouped;
}

// Map OpenWeather weather codes to emoji
function mapWeatherToIcon(id) {
    if(id>=200 && id<300) return '⛈️';
    if(id>=300 && id<400) return '🌧️';
    if(id>=500 && id<600) return '🌧️';
    if(id>=600 && id<700) return '❄️';
    if(id>=700 && id<800) return '🌫️';
    if(id===800) return '☀️';
    if(id===801) return '🌤️';
    if(id===802) return '⛅';
    if(id===803||id===804) return '☁️';
    return '🌈';
}

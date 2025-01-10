const API_KEY = '954808a22aba44654d0ad7e670d5f90f';
        
window.addEventListener('load', () => {
    getUserLocation();
});
function hideInitialContent() {
    document.querySelector('.current-weather').style.visibility = 'hidden';
    document.querySelector('.right-section').style.visibility = 'hidden';
    document.querySelector('.details-card').style.visibility = 'hidden';
    document.getElementById('loading').style.display = 'block'; 
}

function showContent() {
    document.querySelector('.current-weather').style.visibility = 'visible';
    document.querySelector('.right-section').style.visibility = 'visible';
    document.querySelector('.details-card').style.visibility = 'visible';
    document.getElementById('loading').style.display = 'none'; 
}

function getUserLocation() {
    showLoading(true);
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            position => {
                searchWeatherByCoords(position.coords.latitude, position.coords.longitude);
            },
            error => {
                console.log('Erro na geolocalização:', error);
                searchWeatherByCity('São Paulo');
            }
        );
    } else {
        searchWeatherByCity('São Paulo');
    }
}

function showLoading(show) {
    if (show) {
        hideInitialContent();
    } else {
        showContent();
    }
}

document.addEventListener('DOMContentLoaded', hideInitialContent);
        
window.addEventListener('load', () => {
    getUserLocation();
});

function getWeatherIcon(weatherCode) {
    const iconPath = 'resources/svg/';

    const weatherIcons = {
        '01d': 'sun.svg',         
        '01n': 'moon.svg',       
        '02d': 'partly-cloudy.svg', 
        '02n': 'cloudy-night.svg',  
        '03d': 'cloudy.svg',      
        '03n': 'cloudy.svg',      
        '04d': 'cloudy.svg',      
        '04n': 'cloudy.svg',      
        '09d': 'rain.svg',      
        '09n': 'rain.svg',        
        '10d': 'rain.svg',        
        '10n': 'rain.svg',        
        '11d': 'storm.svg',       
        '11n': 'storm.svg',      
        '13d': 'snow.svg',        
        '13n': 'snow.svg',       
        '50d': 'mist.svg',   
        '50n': 'mist.svg'         
    };
    
    return iconPath + (weatherIcons[weatherCode] || 'default.svg');
}

function formatDate(date, timezone) {
    const timezoneOffset = timezone * 1000;
    
    const cityDate = new Date(date.getTime() + timezoneOffset + (date.getTimezoneOffset() * 60000));
    
    const dateOptions = { 
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    };
    
    const timeOptions = {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    };
    
    const formattedDate = cityDate.toLocaleDateString('pt-BR', dateOptions);
    const formattedTime = cityDate.toLocaleTimeString('pt-BR', timeOptions);
    
    return {
        date: formattedDate,
        time: formattedTime
    };
}

function formatShortDate(date) {
    const weekday = date.toLocaleDateString('pt-BR', { weekday: 'long' });
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${weekday} ${day}/${month}`;
}

async function searchWeather() {
    const city = document.getElementById('cityInput').value;
    if (!city) return;
    showLoading(true);
    await searchWeatherByCity(city);
}

async function searchWeatherByCity(city) {
    try {
        const [currentData, forecastData] = await Promise.all([
            fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric&lang=pt_br`)
                .then(res => res.json()),
            fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=metric&lang=pt_br`)
                .then(res => res.json())
        ]);

        updateWeatherDisplay(currentData, forecastData);
    } catch (error) {
        alert('Erro ao buscar dados meteorológicos. Verifique o nome da cidade.');
    } finally {
        showLoading(false);
    }
}

async function searchWeatherByCoords(lat, lon) {
    try {
        const [currentData, forecastData] = await Promise.all([
            fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=pt_br`)
                .then(res => res.json()),
            fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=pt_br`)
                .then(res => res.json())
        ]);

        updateWeatherDisplay(currentData, forecastData);
    } catch (error) {
        alert('Erro ao buscar dados meteorológicos. Tentando cidade padrão...');
        await searchWeatherByCity('São Paulo');
    } finally {
        showLoading(false);
    }
}

function updateWeatherDisplay(currentData, forecastData) {

    const cityDateTime = formatDate(new Date(), currentData.timezone);
    
    const locationDate = document.querySelector('.location-date');
    locationDate.children[0].querySelector('span').textContent = currentData.name;
    locationDate.children[1].querySelector('span').textContent = `${cityDateTime.date} - ${cityDateTime.time}`;
    
    const sunriseDate = formatDate(new Date(currentData.sys.sunrise * 1000), currentData.timezone);
    const sunsetDate = formatDate(new Date(currentData.sys.sunset * 1000), currentData.timezone);
    
    document.querySelector('.temperature').textContent = `${Math.round(currentData.main.temp)}°C`;
    document.querySelector('.condition').textContent = currentData.weather[0].description;

    const weatherDetails = document.querySelector('.weather-details');
    weatherDetails.children[0].querySelector('p').textContent = `${Math.round(currentData.main.temp_max)}°C`;
    weatherDetails.children[1].querySelector('p').textContent = `${Math.round(currentData.main.temp_min)}°C`;
    weatherDetails.children[2].querySelector('p').textContent = `${currentData.main.humidity}%`;
    weatherDetails.children[3].querySelector('p').textContent = `${(currentData.wind.speed * 3.6).toFixed(1)} km/h`;
    
    weatherDetails.children[4].querySelector('p').textContent = sunriseDate.time;
    weatherDetails.children[5].querySelector('p').textContent = sunsetDate.time;

    const weatherIcon = document.querySelector('.weather-icon');
    weatherIcon.innerHTML = `<img src="${getWeatherIcon(currentData.weather[0].icon)}" alt="${currentData.weather[0].description}">`;

    updateForecast(forecastData);
    
    if (window.Chart && document.getElementById('temperatureChart')) {
        updateTemperatureChart(forecastData);
    }
}

function updateForecast(data) {
    const forecastItems = document.querySelectorAll('.forecast-item');
    const dailyForecasts = data.list.filter(forecast => 
        forecast.dt_txt.includes('12:00:00')
    ).slice(0, 5);

    dailyForecasts.forEach((day, index) => {
        if (forecastItems[index]) {
            const date = formatDate(new Date(day.dt * 1000), data.city.timezone);
            const spans = forecastItems[index].getElementsByTagName('span');

            spans[0].textContent = `${Math.round(day.main.temp)}°C`;
            spans[1].textContent = day.weather[0].description;

            if (!spans[2]) {
                const dateSpan = document.createElement('span');
                dateSpan.textContent = formatShortDate(new Date(day.dt * 1000));
                forecastItems[index].appendChild(dateSpan);
            } else {
                spans[2].textContent = formatShortDate(new Date(day.dt * 1000));
            }

            const existingIcon = forecastItems[index].querySelector('img');
            if (!existingIcon) {
                const weatherIcon = document.createElement('img');
                weatherIcon.src = getWeatherIcon(day.weather[0].icon);
                weatherIcon.alt = day.weather[0].description;
                weatherIcon.style.width = '20px';
                weatherIcon.style.height = '20px';
                weatherIcon.style.marginLeft = '8px';
                weatherIcon.style.verticalAlign = 'middle';
                spans[1].after(weatherIcon);
            } else {
                existingIcon.src = getWeatherIcon(day.weather[0].icon);
                existingIcon.alt = day.weather[0].description;
            }
        }
    });
}


function updateTemperatureChart(forecastData) {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const hourlyData = forecastData.list.filter(item => {
        const itemDate = new Date(item.dt * 1000);
        return itemDate >= today && itemDate < tomorrow;
    });

    const labels = hourlyData.map(item => {
        const date = new Date(item.dt * 1000);
        return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    });

    const temperatures = hourlyData.map(item => item.main.temp);

    const existingChart = Chart.getChart("temperatureChart");
    if (existingChart) {
        existingChart.destroy();
    }

    const ctx = document.getElementById('temperatureChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Previsão de Temperatura',
                data: temperatures,
                borderColor: '#1a365d', // Dark blue line
                backgroundColor: 'rgba(26, 54, 93, 0.1)', // Light blue fill
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#ffffff',
                pointBorderColor: '#1a365d',
                pointRadius: 4,
                pointHoverRadius: 6,
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    right: 20,
                    top: 30
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    align: 'center',
                    labels: {
                        color: '#1a365d',
                        font: {
                            size: 14,
                            weight: 'bold'
                        },
                        padding: 20,
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(26, 54, 93, 0.9)',
                    titleColor: '#ffffff',
                    bodyColor: '#ffffff',
                    borderColor: '#1a365d',
                    borderWidth: 1,
                    padding: 10,
                    callbacks: {
                        label: function(context) {
                            return `${context.raw.toFixed(1)}°C`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    grid: {
                        color: 'rgba(26, 54, 93, 0.1)',
                        lineWidth: 1,
                        drawBorder: false,
                        drawTicks: true
                    },
                    ticks: {
                        color: '#1a365d',
                        font: {
                            size: 12,
                            weight: 'bold'
                        },
                        padding: 10,
                        callback: function(value) {
                            return value + '°C';
                        },
                        stepSize: 5
                    }
                },
                x: {
                    grid: {
                        display: true,
                        color: 'rgba(26, 54, 93, 0.1)',
                        lineWidth: 1,
                        drawBorder: false
                    },
                    ticks: {
                        color: '#1a365d',
                        font: {
                            size: 12,
                            weight: 'bold'
                        },
                        padding: 5,
                        maxRotation: 0,
                        autoSkip: true,
                        maxTicksLimit: 12
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    });
}
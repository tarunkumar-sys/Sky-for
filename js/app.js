"use strict";

import { fetchData, url } from "./api.js";
import * as module from "./module.js";

document.addEventListener("DOMContentLoaded", () => {
  const errorSection = document.querySelector("[data-error-content]");

  if (window.matchMedia("(hover: none) and (pointer: coarse)").matches) {
    const errorHeading = errorSection.querySelector(".mobile-error");

    const mobileMessage = document.createElement("h1");
    mobileMessage.className = "mobile-error-message";
    mobileMessage.textContent = "ERROR: 170V380085";
    const lineBreak = document.createElement("br");
    errorHeading.replaceWith(mobileMessage);
    mobileMessage.after(lineBreak);
  }

  const cursorDot = document.querySelector(".cursor-dot");
  const cursorOutline = document.querySelector(".cursor-outline");

  // Only initialize if we're not on a touch device
  if (window.matchMedia("(pointer: fine)").matches) {
    // Show cursors when mouse enters the window
    document.addEventListener("mouseenter", () => {
      cursorDot.style.opacity = "1";
      cursorOutline.style.opacity = "1";
    });

    // Hide cursors when mouse leaves the window
    document.addEventListener("mouseleave", () => {
      cursorDot.style.opacity = "0";
      cursorOutline.style.opacity = "0";
    });

    // Update cursor position
    document.addEventListener("mousemove", (e) => {
      // Check if the mouse is within the viewport
      if (
        e.clientY >= 0 &&
        e.clientX >= 0 &&
        e.clientX <= window.innerWidth &&
        e.clientY <= window.innerHeight
      ) {
        cursorDot.style.opacity = "1";
        cursorOutline.style.opacity = "1";

        // Update position
        cursorDot.style.left = e.clientX + "px";
        cursorDot.style.top = e.clientY + "px";
        cursorOutline.style.left = e.clientX + "px";
        cursorOutline.style.top = e.clientY + "px";
      } else {
        // Hide cursors if mouse is outside viewport
        cursorDot.style.opacity = "0";
        cursorOutline.style.opacity = "0";
      }
    });
  }
});

/**
 * ------------------------------ Add event listener on multiple elements ------------------------------
 * @param {NodeList} elements Elements node array
 * @param {string} eventType Event Type e.g.; "click", "mouseover"
 * @param {Function} callback Callback function
 */
const addEventOnElements = function (elements, eventType, callback) {
  for (const element of elements) element.addEventListener(eventType, callback);
};

/**
 * ---------------------------------- Toggle Search in Mobile Devices -----------------------------------
 */
const searchView = document.querySelector("[data-search-view]");
const searchTogglers = document.querySelectorAll("[data-search-toggler]");

const toggleSearch = () => searchView.classList.toggle("active");
addEventOnElements(searchTogglers, "click", toggleSearch);

/**
 * ----------------------------------------- Search Integration ------------------------------------------
 */

const searchField = document.querySelector("[data-search-field]");
const searchResult = document.querySelector("[data-search-result]");

let searchTimeout = null;
const searchTimeoutDuration = 500;

searchField.addEventListener("input", function () {
  searchTimeout ?? clearTimeout(searchTimeout);
  if (!searchField.value) {
    searchResult.classList.remove("active");
    searchResult.innerHTML = "";
    searchField.classList.remove("searching");
  } else {
    searchField.classList.add("searching");
  }

  if (searchField.value) {
    searchTimeout = setTimeout(() => {
      fetchData(url.geo(searchField.value), function (locations) {
        searchField.classList.remove("searching");
        searchResult.classList.add("active");
        searchResult.innerHTML = `
          <ul class="view-list" data-search-list></ul>
        `;

        const /** {NodeList} | [] */ items = [];
        for (const { name, lat, lon, country, state } of locations) {
          const searchItem = document.createElement("li");
          searchItem.classList.add("view-item");
          searchItem.innerHTML = `
            <span class="m-icon">location_on</span>
            <div>
              <p class="item-title">${name}</p>
              <p class="label-2 item-subtitle">${state || ""} ${country}</p>
            </div>
            <a href="#/weather?lat=${lat}&lon=${lon}" class="item-link has-state" aria-label="${name} weather" data-search-toggler></a>
          `;

          searchResult
            .querySelector("[data-search-list]")
            .appendChild(searchItem);
          items.push(searchItem.querySelector("[data-search-toggler]"));
        }

        addEventOnElements(items, "click", function () {
          toggleSearch();
          searchResult.classList.remove("active");
        });
      });
    }, searchTimeoutDuration);
  }
});

const container = document.querySelector("[data-container]");
const loading = document.querySelector("[data-loading]");
const currentLocationBtn = document.querySelector(
  "[data-current-location-btn]"
);
const errorContent = document.querySelector("[data-error-content]");

/**
 * --------------------------- Render All Weather Data in the HTML Page ------------------------------
 * @param {number} lat Latitude
 * @param {number} lon Longitude
 */
export const updateWeather = function (lat, lon) {
  loading.style.display = "grid";
  container.style.overflowY = "hidden";
  container.classList.remove("fade-in");
  errorContent.style.display = "none";

  const currentWeatherSection = document.querySelector(
    "[data-current-weather]"
  );
  const highlightSection = document.querySelector("[data-highlights]");
  const hourlySection = document.querySelector("[data-hourly-forecast]");
  const forecastSection = document.querySelector("[data-5-day-forecast]");

  currentWeatherSection.innerHTML = "";
  highlightSection.innerHTML = "";
  hourlySection.innerHTML = "";
  forecastSection.innerHTML = "";

  if (window.location.hash === "#/current-location") {
    currentLocationBtn.setAttribute("disabled", "");
  } else {
    currentLocationBtn.removeAttribute("disabled");
  }

  /**
   * ----------------------------------- Current Weather Section ----------------------------------------
   */

  fetchData(url.currentWeather(lat, lon), function (currentWeather) {
    const {
      weather,
      dt: dateUnix,
      sys: { sunrise: sunriseUnixUTC, sunset: sunsetUnixUTC },
      main: { temp, feels_like, pressure, humidity },
      visibility,
      timezone,
    } = currentWeather;
    const [{ description, icon }] = weather;
    const card = document.createElement("div");
    card.classList.add("card", "card-lg", "current-weather-card");

    // Determine the icon based on the description
    const weatherIcon = description === "broken clouds" ? "04.0d" : icon;

    card.innerHTML = `
      <h2 class="title-2 card-title">Now</h2>
      <div class="weapper">
        <p class="heading">${parseInt(temp)}&deg;<sup>c</sup></p>
        <img
          src="./public/images/weather_icons/${weatherIcon}.png"
          width="64"
          height="64"
          alt="${description}"
          class="weather-icon"
        />
      </div>

      <p class="body-3">${description}</p>

      <ul class="meta-list">
        <li class="meta-item">
          <span class="m-icon">calendar_today</span>
          <p class="title-3 meta-text">${module.getDate(dateUnix, timezone)}</p>
        </li>
        <li class="meta-item">
          <span class="m-icon">location_on</span>
          <p class="title-3 meta-text" data-location></p>
        </li>
      </ul>
    `;

    fetchData(url.reverseGeo(lat, lon), function ([{ name, country }]) {
      card.querySelector("[data-location]").innerHTML = `${name}, ${country}`;
    });
    currentWeatherSection.appendChild(card);

    /**
     * ------------------------------------faculty Highlights ---------------------------------------------
     */
    fetchData(url.airPollution(lat, lon), function () {
      const card = document.createElement("div");
      card.classList.add("card", "card-lg");

      // Replace the content of "faculty Highlights" with faculty cards
      card.innerHTML = `
      <div class='main-highlight'>
      <h1 class='text-4xl text-right pb-1 '>Faculty Highlights</h1>
      </div>
        <div class="container p-5 rounded-3xl">
        
<h2 class="pb-2 rounded-xl font-light text-left text-3xl">Arts Faculty</h2>

<div class="card bg-[#B5A1E5] rounded-xl grid grid-cols-1 md:grid-cols-3 gap-5 text-white p-5">
            <!-- Temperature Card -->
            <div class="sub-card temperature bg-[#0F0F12] p-10 rounded-xl flex flex-col justify-center">
                <h3 class="text-lg mb-2 text-gray-400 text-left">Temperature</h3>
                <div class="flex items-center justify-between w-full px-4 py-2 rounded-lg">
                    <i class="fas fa-thermometer-half text-4xl text-gray-300"></i>
                    <div class="value text-3xl font-bold px-4" id="artsTemp">--°C</div>
                </div>
            </div>

            <!-- Humidity Card -->
            <div class="sub-card humidity bg-[#0F0F12] p-10 rounded-xl flex flex-col justify-center">
                <h3 class="text-lg mb-2 text-gray-400 text-left">Humidity</h3>
                <div class="flex items-center justify-between w-full px-4 py-2 rounded-lg">
                    <i class="fas fa-tint text-4xl text-gray-300"></i>
                    <div class="value text-3xl font-bold px-4" id="artsHumidity">--%</div>
                </div>
            </div>

            <!-- Soil Moisture Card -->
            <div class="sub-card soil-moisture bg-[#0F0F12] p-10 rounded-xl flex flex-col justify-center">
                <h3 class="text-lg mb-2 text-gray-400 text-left">Soil Moisture</h3>
                <div class="flex items-center justify-between w-full px-4 py-2 rounded-lg">
                    <i class="fas fa-water text-4xl text-gray-300"></i>
                    <div class="value text-3xl font-bold px-4" id="artsSoil">--%</div>
                </div>
            </div>
        </div>

<h2 class="pb-2 pt-12 rounded-xl font-light text-left text-3xl">Science Faculty</h2>

<div class="card bg-[#B5A1E5] rounded-xl grid grid-cols-1 md:grid-cols-3 gap-5 text-white p-5">
            <!-- Temperature Card -->
            <div class="sub-card temperature bg-[#0F0F12] p-10 rounded-xl flex flex-col justify-center">
                <h3 class="text-lg mb-2 text-gray-400 text-left">Temperature</h3>
                <div class="flex items-center justify-between w-full px-4 py-2 rounded-lg">
                    <i class="fas fa-thermometer-half text-4xl text-gray-300"></i>
                    <div class="value text-3xl font-bold px-4" id="scienceTemp">--°C</div>
                </div>
            </div>

            <!-- Humidity Card -->
            <div class="sub-card humidity bg-[#0F0F12] p-10 rounded-xl flex flex-col justify-center">
                <h3 class="text-lg mb-2 text-gray-400 text-left">Humidity</h3>
                <div class="flex items-center justify-between w-full px-4 py-2 rounded-lg">
                    <i class="fas fa-tint text-4xl text-gray-300"></i>
                    <div class="value text-3xl font-bold px-4" id="scienceHumidity">--%</div>
                </div>
            </div>

            <!-- Soil Moisture Card -->
            <div class="sub-card soil-moisture bg-[#0F0F12] p-10 rounded-xl flex flex-col justify-center">
                <h3 class="text-lg mb-2 text-gray-400 text-left">Soil Moisture</h3>
                <div class="flex items-center justify-between w-full px-4 py-2 rounded-lg">
                    <i class="fas fa-water text-4xl text-gray-300"></i>
                    <div class="value text-3xl font-bold px-4" id="scienceSoil">--%</div>
                </div>
            </div>
        </div>

<h2 class="pb-2 pt-12 rounded-xl font-light text-left text-3xl">Engineering Faculty</h2>

<div class="card bg-[#B5A1E5] rounded-xl grid grid-cols-1 md:grid-cols-3 gap-5 text-white p-6">
            <!-- Temperature Card -->
            <div class="sub-card temperature bg-[#0F0F12] p-10 rounded-xl flex flex-col justify-center">
                <h3 class="text-lg mb-2 text-gray-400 text-left">Temperature</h3>
                <div class="flex items-center justify-between w-full px-4 py-2 rounded-lg">
                    <i class="fas fa-thermometer-half text-4xl text-gray-300"></i>
                    <div class="value text-3xl font-bold px-4" id="engineeringTemp">--°C</div>
                </div>
            </div>

            <!-- Humidity Card -->
            <div class="sub-card humidity bg-[#0F0F12] p-10 rounded-xl flex flex-col justify-center">
                <h3 class="text-lg mb-2 text-gray-400 text-left">Humidity</h3>
                <div class="flex items-center justify-between w-full px-4 py-2 rounded-lg">
                    <i class="fas fa-tint text-4xl text-gray-300"></i>
                    <div class="value text-3xl font-bold px-4" id="engineeringHumidity">--%</div>
                </div>
            </div>

            <!-- Soil Moisture Card -->
            <div class="sub-card soil-moisture bg-[#0F0F12] p-10 rounded-xl flex flex-col justify-center">
                <h3 class="text-lg mb-2 text-gray-400 text-left">Soil Moisture</h3>
                <div class="flex items-center justify-between w-full px-4 py-2 rounded-lg">
                    <i class="fas fa-water text-4xl text-gray-300"></i>
                    <div class="value text-3xl font-bold px-4" id="engineeringSoil">--%</div>
                </div>
            </div>
        </div>
      `;

      highlightSection.appendChild(card);

      // Firebase Configuration
      const firebaseConfig = {
        apiKey: "AIzaSyCrJAXnHlMTPhJVXgCCb4Rr32DBSG3A27M",
        authDomain: "faculty-environment-monitor.firebaseapp.com",
        databaseURL:
          "https://faculty-environment-monitor-default-rtdb.asia-southeast1.firebasedatabase.app",
        projectId: "faculty-environment-monitor",
        storageBucket: "faculty-environment-monitor.firebasestorage.app",
        messagingSenderId: "653287288737",
        appId: "1:653287288737:web:9c9ed020ff6417fa26a5e0",
        measurementId: "G-7MQB5K28CB",
      };

      // Initialize Firebase
      firebase.initializeApp(firebaseConfig);
      const database = firebase.database();

      // Update display function
      function updateFacultyDisplay(faculty, data) {
        document.getElementById(
          `${faculty}Temp`
        ).textContent = `${data.temperature}°C`;
        document.getElementById(
          `${faculty}Humidity`
        ).textContent = `${data.humidity}%`;
        document.getElementById(
          `${faculty}Soil`
        ).textContent = `${data.soilMoisture}%`;
      }

      // Monitor data for each faculty
      ["arts", "science", "engineering"].forEach((faculty) => {
        database.ref(`faculties/${faculty}`).on("value", (snapshot) => {
          const data = snapshot.val();
          if (data) updateFacultyDisplay(faculty, data);
        });
      });

      // Dummy Data Generator
      setInterval(() => {
        ["arts", "science", "engineering"].forEach((faculty) => {
          const data = {
            temperature: (Math.random() * 15 + 20).toFixed(1),
            humidity: (Math.random() * 30 + 40).toFixed(1),
            soilMoisture: (Math.random() * 30 + 40).toFixed(1),
          };
          database.ref(`faculties/${faculty}`).update(data);
        });
      }, 3000);
    });

    /**
     * ------------------------------------ 24-Hour Forecast Section ------------------------------------------
     */
    fetchData(url.forecast(lat, lon), function (forecast) {
      const {
        list: forecastList,
        city: { timezone },
      } = forecast;

      hourlySection.innerHTML = `
        <h2 class="title-2">Today at</h2>
        <div class="slider-container">
          <ul class="slider-list" data-temp></ul>
          <ul class="slider-list" data-wind></ul>
        </div>
      `;

      for (const [index, data] of forecastList.entries()) {
        if (index > 7) break;
        const {
          dt: dateTimeUnix,
          main: { temp },
          weather,
          wind: { deg: windDirection, speed: windSpeed },
        } = data;
        const [{ icon, description }] = weather;

        const weatherIcon = description === "broken clouds" ? "04.0d" : icon;

        const tempLi = document.createElement("li");
        tempLi.classList.add("slider-item");
        tempLi.innerHTML = `
          <div class="card card-sm slider-card">
            <p class="body-3">${module.getHours(dateTimeUnix, timezone)}</p>
            <img
              src="./public/images/weather_icons/${weatherIcon}.png"
              width="48"
              height="48"
              loading="lazy"
              title="${description}"
              alt="${description}"
              class="weather-icon"
            />
            <p class="body-3">${parseInt(temp)}&deg;</p>
          </div>
        `;
        hourlySection.querySelector("[data-temp]").appendChild(tempLi);

        const windLi = document.createElement("li");
        windLi.classList.add("slider-item");
        windLi.innerHTML = `
          <div class="card card-sm slider-card">
            <p class="body-3">${module.getHours(dateTimeUnix, timezone)}</p>
            <img
              src="./public/images/weather_icons/direction.png"
              width="48"
              height="48"
              loading="lazy"
              alt="direction"
              class="weather-icon"
              style = "transform: rotate(${windDirection - 180}deg)"
            />
            <p class="body-3">${parseInt(module.mps_to_kmh(windSpeed))} km/h</p>
          </div>
        `;
        hourlySection.querySelector("[data-wind]").appendChild(windLi);
      }

      /**
       * ------------------------------------ 5-Day Forecast Section --------------------------------------------
       */
      forecastSection.innerHTML = `
        <h2 class="title-2" id="forecast-label">5 Days Forecast</h2>
        <div class="card card-lg forecast-card">
          <ul data-forecast-list>
          </ul>
        </div>
      `;

      for (let i = 7, len = forecastList.length; i < len; i += 8) {
        const {
          main: { temp_max },
          weather,
          dt_txt,
        } = forecastList[i];
        const [{ icon, description }] = weather;

        const weatherIcon = description === "broken clouds" ? "04.0d" : icon;

        const date = new Date(dt_txt);
        const li = document.createElement("li");
        li.classList.add("card-item");
        li.innerHTML = `
          <div class="icon-wrapper">
            <img
              src="./public/images/weather_icons/${weatherIcon}.png"
              width="36"
              height="36"
              alt="${description}"
              class="weather-icon"
              title = "${description}"
            />
            <span class="span">
              <p class="title-2">${parseInt(temp_max)}&deg;</p>
            </span>
          </div>
          <p class="label-1">${date.getDate()} ${
          module.monthNames[date.getUTCMonth()]
        }</p>
          <p class="label-1"> ${module.weekDayNames[date.getUTCDay()]}</p>
        `;

        forecastSection.querySelector("[data-forecast-list]").appendChild(li);
      }

      loading.style.display = "none";
      container.style.overflowY = "overlay";
      container.classList.add("fade-in");
    });
  });
};

export const error404 = () => (errorContent.style.display = "flex");

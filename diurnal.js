// Diurnal Time Calculator
// Modern refactor with improved error handling and code organization

const DiurnalTime = (() => {
  // Private state
  let state = {
    runDirection: null,
    displayType: null,
    locationMethod: null,

    // Geographic location
    latitude: 0,
    longitude: 0,
    accuracy: 0,
    city: '',
    state: '',

    // Time values (in seconds)
    sunriseSecs: 0,
    sunsetSecs: 0,

    // Date values for future sunset/rise events
    currentSunset: null,
    currentSunrise: null,

    // Control flags
    fireOnce: false,
    updateInterval: null
  };

  // Constants
  const CLOCK_PHASE = {
    NIGHT: { value: 0, name: "Night", code: "N" },
    DAY: { value: 1, name: "Day", code: "D" }
  };

  const LOC_TYPE = {
    IP: { value: 0, name: "Approx", code: "A" },
    GPS: { value: 1, name: "Precise", code: "P" },
    TEST: { value: 2, name: "Test", code: "T" }
  };

  const SUN = {
    RISE: { value: 0, name: "Rise", code: "R" },
    SET: { value: 1, name: "Set", code: "S" }
  };

  // Test location (Santa Cruz, CA)
  const TEST_LOCATION = {
    latitude: 36.9720,
    longitude: -122.0263,
    city: "Santa Cruz",
    state: "California"
  };

  // Private methods
  function setTestLocation() {
    state.latitude = TEST_LOCATION.latitude;
    state.longitude = TEST_LOCATION.longitude;
    state.city = TEST_LOCATION.city;
    state.state = TEST_LOCATION.state;
  }

  function getReverseGeocodingData(lat, lng) {
    // Use a free reverse geocoding service
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
      .then(response => response.json())
      .then(data => {
        if (data && data.address) {
          state.city = data.address.city || data.address.town || data.address.village || '';
          state.state = data.address.state || '';
        }
            })
        .catch(error => {
          console.warn('Reverse geocoding failed:', error);
          // Fallback to generic location description
          state.city = 'Your location';
          state.state = '';
        });
    }

  function checkLocation() {
    if (state.latitude === 0) {
      getApproximateLocation();
    }
  }

  function getExactLocation() {
    const options = {
      enableHighAccuracy: false,
      timeout: 1000,
      maximumAge: 0
    };

    if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            storeExactLocation,
            getApproximateLocation,
            options
          );
        } else {
          console.warn('Geolocation not supported');
          getApproximateLocation();
        }

      setTimeout(checkLocation, 5000);
    }

  function storeExactLocation(position) {
    state.latitude = position.coords.latitude;
    state.longitude = position.coords.longitude;
    state.accuracy = position.coords.accuracy;

      // Update global coordinates for sunclock
      updateGlobalCoordinates(state.latitude, state.longitude);

      getReverseGeocodingData(state.latitude, state.longitude);
      updateSunValues(state.latitude, state.longitude);

      // Draw or redraw clock - use setTimeout to ensure globals are set
      setTimeout(() => {
        if (typeof sunclock_draw === 'function') {
          sunclock_draw();
        }
         }, 100);
    }

  function getApproximateLocation() {
    // Use ipapi.co as a fallback (free tier available)
    fetch('https://ipapi.co/json/')
      .then(response => response.json())
      .then(data => {
        if (data && data.latitude && data.longitude) {
          state.latitude = data.latitude;
          state.longitude = data.longitude;
          state.city = data.city || '';
          state.state = data.region || '';

                  // Update global coordinates for sunclock
                  updateGlobalCoordinates(state.latitude, state.longitude);

                  updateSunValues(state.latitude, state.longitude);

                  // Draw or redraw clock - use setTimeout to ensure globals are set
                  setTimeout(() => {
                    if (typeof sunclock_draw === 'function') {
                      sunclock_draw();
                       }
                     }, 100);
              }
            })
          .catch(error => {
            console.error('IP geolocation failed:', error);
            // Use test location as ultimate fallback
            setTestLocation();
            updateGlobalCoordinates(state.latitude, state.longitude);
            updateSunValues(state.latitude, state.longitude);

              // Draw or redraw clock - use setTimeout to ensure globals are set
              setTimeout(() => {
                if (typeof sunclock_draw === 'function') {
                  sunclock_draw();
                }
              }, 100);
            });
    }

  function updateLocation(method) {
    if (method === LOC_TYPE.IP) {
      getApproximateLocation();
    } else if (method === LOC_TYPE.GPS) {
      getExactLocation();
    } else if (method === LOC_TYPE.TEST) {
      setTestLocation();
    }
  }

  function publishTime() {
    let hours, minutes, seconds;

      if (state.displayType === SUN.RISE) {
        hours = Math.floor(state.sunriseSecs / 3600);
        minutes = Math.floor((state.sunriseSecs - (hours * 3600)) / 60);
        seconds = Math.ceil(state.sunriseSecs - (hours * 3600) - (minutes * 60));

          if (state.runDirection === CLOCK_PHASE.NIGHT) {
            $("#dir").html("-");
            } else {
              $("#dir").html("");
            }
        } else if (state.displayType === SUN.SET) {
          hours = Math.floor(state.sunsetSecs / 3600);
          minutes = Math.floor((state.sunsetSecs - (hours * 3600)) / 60);
          seconds = Math.ceil(state.sunsetSecs - (hours * 3600) - (minutes * 60));

          if (state.runDirection === CLOCK_PHASE.DAY) {
            $("#dir").html("-");
          } else {
            $("#dir").html("");
          }
        }

      if (state.latitude !== 0 && state.longitude !== 0) {
        $("#sec").html((seconds < 10 ? "0" : "") + seconds);
        $("#min").html((minutes < 10 ? "0" : "") + minutes);
        $("#hours").html((hours < 10 ? "0" : "") + hours);

          const locationText = state.state ? `${state.city}, ${state.state}` : state.city;

        if (state.displayType === SUN.RISE) {
          $("#GeoText").html(`Based on the location of <em>${locationText}</em> with a sunrise of ${formatTime(state.currentSunrise)}am.`);
        } else if (state.displayType === SUN.SET) {
          $("#GeoText").html(`Based on the location of <em>${locationText}</em> with a sunset of ${formatTime(state.currentSunset)}pm.`);
        }
      }
    }

  function calcTime(sunrise, sunset, direction) {
    const now = new Date();

      if (direction === CLOCK_PHASE.DAY) {
        state.sunriseSecs = Math.floor((now - sunrise) / 1000);
        state.sunsetSecs = Math.floor((sunset - now) / 1000);
      } else if (direction === CLOCK_PHASE.NIGHT) {
        state.sunriseSecs = Math.floor((sunrise - now) / 1000);
        state.sunsetSecs = Math.floor((now - sunset) / 1000);
      }

      publishTime();
    }

  function changeBackgroundToNight() {
    const newimgsrc = 'images/glacier_night.jpg';
    $("html").css("background", "url(" + newimgsrc + ") no-repeat center center fixed");
    $("html").css("background-size", "cover");
  }

  function changeBackgroundToDay() {
    const newimgsrc = 'images/glacier.jpg';
    $("html").css("background", "url(" + newimgsrc + ") no-repeat center center fixed");
    $("html").css("background-size", "cover");
  }

  function updateSunValues(latitude, longitude) {
    const currentTime = new Date();
    let suncalcTimes = SunCalc.getTimes(currentTime, latitude, longitude);

      // Handle edge cases where sunrise/sunset might be null (polar regions)
      if (!suncalcTimes.sunrise || !suncalcTimes.sunset) {
        console.warn('Sunrise/sunset unavailable for this location (polar region?)');
        // Set reasonable defaults
        state.runDirection = CLOCK_PHASE.DAY;
        state.currentSunrise = new Date(currentTime.getFullYear(), currentTime.getMonth(), currentTime.getDate(), 6, 0, 0);
        state.currentSunset = new Date(currentTime.getFullYear(), currentTime.getMonth(), currentTime.getDate(), 18, 0, 0);
        return;
      }

      // Check if sun is currently out
      if (currentTime < suncalcTimes.sunset && currentTime > suncalcTimes.sunrise) {
        state.runDirection = CLOCK_PHASE.DAY;
      } else {
        state.runDirection = CLOCK_PHASE.NIGHT;

          if (state.displayType === SUN.RISE) {
            // Make sure we're looking at the next sunrise
            if (suncalcTimes.sunrise < currentTime) {
              const tomorrow = new Date();
              tomorrow.setDate(tomorrow.getDate() + 1);
                suncalcTimes = SunCalc.getTimes(tomorrow, latitude, longitude);
              }
            }

          if (state.displayType === SUN.SET) {
            // Make sure we're looking at the last sunset
            if (suncalcTimes.sunset > currentTime) {
              const yesterday = new Date();
              yesterday.setDate(yesterday.getDate() - 1);
              suncalcTimes = SunCalc.getTimes(yesterday, latitude, longitude);
            }
          }
        }

      state.currentSunrise = suncalcTimes.sunrise;
      state.currentSunset = suncalcTimes.sunset;
    }

  function checkSunEvent(sunrise, sunset, direction) {
    const now = new Date();

      if (direction === CLOCK_PHASE.NIGHT) {
        // Next event is sunrise
        if (now >= sunrise) {
          updateSunValues(state.latitude, state.longitude);
        }
      } else if (direction === CLOCK_PHASE.DAY) {
        // Next event is sunset
        if (now >= sunset) {
          updateSunValues(state.latitude, state.longitude);
        }
      }
    }

  function formatTime(dateVal) {
    let hours = dateVal.getHours();
    let minutes = dateVal.getMinutes();

      // Use 12 hour clock
      hours = hours % 12;
      if (hours === 0) hours = 12;

      if (minutes < 10) {
        minutes = "0" + minutes;
        }

      return hours + ':' + minutes;
    }

  function toggleRiseSet() {
    if (state.displayType === SUN.RISE) {
      state.displayType = SUN.SET;
      changeBackgroundToNight();
    } else if (state.displayType === SUN.SET) {
      state.displayType = SUN.RISE;
      changeBackgroundToDay();
    }

      // CRITICAL: Recalculate sun values with new display type
      // This ensures we get the correct sunrise/sunset for the new reference point
      updateSunValues(state.latitude, state.longitude);

      // Force immediate time calculation with updated values
      calcTime(state.currentSunrise, state.currentSunset, state.runDirection);
    }

  function handleKeyPress(e) {
    if (!state.fireOnce) {
      if (e.keyCode === 114 || e.charCode === 114) { // 'r'
        toggleRiseSet();
      }
    }
      state.fireOnce = true;
    }

  function handleKeyUp(e) {
    if (e.keyCode === 82 || e.charCode === 82) { // 'R'
      toggleRiseSet();
    }
      state.fireOnce = false;
    }

  function enableTouch() {
    const getPointerEvent = (event) => {
      return event.originalEvent.targetTouches ? event.originalEvent.targetTouches[0] : event;
    };

      const $touchArea = $('#touchArea');
      let touchStarted = false;

      $touchArea.on('touchstart mousedown', function (e) {
        e.preventDefault();
          touchStarted = true;
          toggleRiseSet();
        });

      $touchArea.on('touchend mouseup touchcancel', function (e) {
        e.preventDefault();
          touchStarted = false;
        });
    }

  function startUpdateLoop() {
    state.updateInterval = setInterval(() => {
      checkSunEvent(state.currentSunrise, state.currentSunset, state.runDirection);
      calcTime(state.currentSunrise, state.currentSunset, state.runDirection);
    }, 1000);
  }

  function stopUpdateLoop() {
    if (state.updateInterval) {
      clearInterval(state.updateInterval);
      state.updateInterval = null;
    }
  }

  // Public API
  return {
    init: function () {
      state.displayType = SUN.RISE;

        // Preload night image
        if (document.images) {
              const img1 = new Image();
              img1.src = "images/glacier_night.jpg";
            }

        enableTouch();

        // Setup keyboard handlers
        document.addEventListener('keypress', handleKeyPress);
        document.addEventListener('keyup', handleKeyUp);

        // Get location
        state.locationMethod = LOC_TYPE.GPS;
        updateLocation(state.locationMethod);

        // Start update loop
        startUpdateLoop();
      },

      destroy: function () {
        stopUpdateLoop();
        document.removeEventListener('keypress', handleKeyPress);
        document.removeEventListener('keyup', handleKeyUp);
      },

    // Expose state for sunclock.js
    getState: function () {
      return {
        latitude: state.latitude,
        longitude: state.longitude
      };
    }
  };
})();

// Initialize when DOM is ready
$(document).ready(function () {
  DiurnalTime.init();
});

// Expose globals for sunclock.js compatibility
window.Latitude = 0;
window.Longitude = 0;

// Helper to update globals
function updateGlobalCoordinates(lat, lon) {
  window.Latitude = lat;
  window.Longitude = lon;
}

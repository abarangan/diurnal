// Sunclock visualization using Raphael.js
// Cleaned up and modernized

const SunClock = (() => {
    // Private state
    let state = {
        lat: 0,
        lon: 0,
        calcsInitialized: false,
        
        // Sun time values in minutes
        dawnMin: 0,
        duskMin: 0,
        sunriseMin: 0,
        sunsetMin: 0,
        daylengthMin: 0,
        
        // Raphael objects
        r: null,
        dial: null,
        hub: null,
        dawnArc: null,
        dayArc: null,
        minHand: null,
        geoError: null,
        geoMsg: null
    };

    // Constants
    const R = 67; // Radius for arcs
    const ORIGIN = 300;
    const ARC_STYLE = "nofill";

    // Private methods
    function minutize(datetime) {
        // Convert Date object to minutes from day's beginning
        return datetime.getHours() * 60 + datetime.getMinutes();
    }

    function initializeSunCalcs(latitude, longitude) {
        const times = SunCalc.getTimes(new Date(), latitude, longitude);

        state.dawnMin = minutize(times.dawn);
        state.duskMin = minutize(times.dusk);
        state.sunriseMin = minutize(times.sunrise);
        state.sunsetMin = minutize(times.sunset);
        state.daylengthMin = state.sunsetMin - state.sunriseMin;
        state.calcsInitialized = true;
    }

    function initializeDrawing() {
        state.r = Raphael("holder", 600, 600);
        
        // Set viewBox to crop to just the visible sundial area (160x160 centered at 300,300)
        state.r.canvas.setAttribute('viewBox', '220 220 160 160');
        state.r.canvas.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        
        const param = { stroke: "#fff", "stroke-width": 50 };

        // Custom attribute for minute hand
        state.r.customAttributes.min_hand = function(min, radius) {
            radius = radius * 1.1;
            const alpha = 360 / 1440 * min;
            const a = (270 - alpha) * Math.PI / 180;
            const x = ORIGIN + radius * Math.cos(a);
            const y = ORIGIN - radius * Math.sin(a);
            const path = [["M", ORIGIN, ORIGIN], [x, y]];
            
            return { 
                path: path, 
                stroke: "#DDD" 
            };
        };

        // Custom attribute for minute arc
        state.r.customAttributes.min_arc = function(min0, min1, radius) {
            const alpha0 = 360 / 1440 * min0;
            const a0 = (270 - alpha0) * Math.PI / 180;
            const x0 = ORIGIN + radius * Math.cos(a0);
            const y0 = ORIGIN - radius * Math.sin(a0);
            
            const alpha1 = 360 / 1440 * min1;
            const a1 = (270 - alpha1) * Math.PI / 180;
            const x1 = ORIGIN + radius * Math.cos(a1);
            const y1 = ORIGIN - radius * Math.sin(a1);

            let largeArcFlag = 0;
            if (alpha1 > alpha0 && Math.abs(alpha1 - alpha0) > 180) {
                largeArcFlag = 1;
            }
            if (alpha1 < alpha0 && Math.abs(alpha1 - alpha0) < 180) {
                largeArcFlag = 1;
            }

            const sweepFlag = 1;
            let path = [["M", x0, y0], ["A", radius, radius, 0, largeArcFlag, sweepFlag, x1, y1]];
            
            if (ARC_STYLE === "fill") {
                path.push(["L", ORIGIN, ORIGIN], ["Z"]);
            }

            return { path: path };
        };

        // Create clock elements
        state.dial = state.r.circle(300, 300, 80).attr({
            stroke: "#fff",
            "stroke-width": 1
        });

        state.hub = state.r.circle(300, 300, 3).attr({
            stroke: "none",
            fill: "#DDD"
        });

        // Create arcs based on style
        if (ARC_STYLE === "fill") {
            const arcR = 45;
            state.dawnArc = state.r.path()
                .attr({ opacity: 50 })
                .attr({ fill: "#74622E", "stroke-width": 0 })
                .attr({ min_arc: [0, 0, arcR] });
            
            state.dayArc = state.r.path()
                .attr({ opacity: 50 })
                .attr({ fill: "#C1A34D", "stroke-width": 0 })
                .attr({ min_arc: [0, 0, arcR] });
        } else {
            state.dawnArc = state.r.path()
                .attr({ opacity: 50 })
                .attr({ stroke: "#74622E", "stroke-width": 15, "stroke-opacity": 0.60 })
                .attr({ min_arc: [0, 0, R] });
            
            state.dayArc = state.r.path()
                .attr({ opacity: 50 })
                .attr({ stroke: "#C1A34D", "stroke-width": 15, "stroke-opacity": 0.60 })
                .attr({ min_arc: [0, 0, R] });
        }

        // Create minute hand
        state.minHand = state.r.path()
            .attr({ "stroke-width": 3 })
            .attr({ min_hand: [0, R] });

        // Create error messages
        state.geoError = state.r.text(300, 300, 
            "Sorry, browser geolocation\nmust be available to\ncalculate your sunclock.\n\nShowing default location:\nSanta Cruz, California")
            .attr({ fill: '#bbb', "font-size": 14, opacity: 0 })
            .hide();

        state.geoMsg = state.r.text(300, 300, 
            "(To calculate your sunclock,\nyou must allow browser geolocation.)")
            .attr({ fill: '#bbb', "font-size": 14, opacity: 0 })
            .hide();
    }

    function updateSunArcs() {
        if (!state.calcsInitialized) return;

        state.dawnArc
            .attr({ min_arc: [state.dawnMin, state.duskMin, R] })
            .animate({ opacity: 50 }, 300);
        
        state.dayArc
            .attr({ min_arc: [state.sunriseMin, state.sunsetMin, R] })
            .animate({ opacity: 50 }, 300);
    }

    function updateMinHand(time) {
        if (!state.minHand) return;
        state.minHand.animate({ min_hand: [time, 65] }, 750, "linear");
    }

    function setPosition() {
        // Get location from global variables set by diurnal.js
        if (typeof Latitude !== 'undefined' && typeof Longitude !== 'undefined') {
            state.lat = Latitude;
            state.lon = Longitude;
        }

        if (state.lat !== 0 && state.lon !== 0) {
            if (state.geoMsg) {
                state.geoMsg.animate({ opacity: 0 }, 1000).hide();
            }
            initializeSunCalcs(state.lat, state.lon);
            updateSunArcs();
        } else {
            // Try again in a moment if location isn't ready
            setTimeout(setPosition, 500);
        }
    }

    function startClockUpdate() {
        const updateClock = () => {
            const d = new Date();
            const currentMin = minutize(d);
            updateMinHand(currentMin);
            setTimeout(updateClock, 1000);
        };
        updateClock();
    }

    // Public API
    return {
        draw: function() {
            // Only initialize if not already done
            if (!state.r) {
                initializeDrawing();
                startClockUpdate();
            }
            setPosition();
        },

        updatePosition: function(latitude, longitude) {
            state.lat = latitude;
            state.lon = longitude;
            if (state.r) {  // Only update if already initialized
                initializeSunCalcs(latitude, longitude);
                updateSunArcs();
            } else {
                // Initialize if not yet done
                this.draw();
            }
        },

        redraw: function() {
            // Force a redraw with current location
            if (state.r && state.lat !== 0 && state.lon !== 0) {
                initializeSunCalcs(state.lat, state.lon);
                updateSunArcs();
            } else if (state.lat !== 0 && state.lon !== 0) {
                // Initialize if not yet done but we have coordinates
                this.draw();
            }
        }
    };
})();

// Expose for backward compatibility
function sunclock_draw() {
    SunClock.draw();
}

function sunclock_redraw() {
    SunClock.redraw();
}

// Export for modern usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SunClock;
}

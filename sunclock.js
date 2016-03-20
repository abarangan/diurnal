var lat, lon; // dawn_min, dusk_min, sunrise_min, sunset_min, daylength_min, GeoError;
var calcs_initialized = false;
var ARC_STYLE = "nofill";

function initializeSunCalcs() {
        var times = SunCalc.getTimes(new Date(), lat, lon);

        // format sunrise time from the Date object
        var sunriseStr = times.sunrise.getHours() + ':' + times.sunrise.getMinutes();


        console.log("Sunrise : " + times.sunrise);
        console.log("Sunset: " + times.sunset);
        (times.sunrise.getHours()*60) + times.sunrise.getMinutes();

        dawn_min = minutize(times.dawn);
        dusk_min = minutize(times.dusk);
        sunrise_min = minutize(times.sunrise);
        sunset_min = minutize(times.sunset);
        daylength_min = sunset_min - sunrise_min;

        calcs_initialized = true;
}

function initializeSunCalcsLatLon(latitude, longitude) {
        var times = SunCalc.getTimes(new Date(), latitude, longitude);

        console.log("latlon: " + latitude + " " + longitude)

        // format sunrise time from the Date object
        var sunriseStr = times.sunrise.getHours() + ':' + times.sunrise.getMinutes();


        console.log("Sunrise: " + times.sunrise);
        console.log("Sunset: " + times.sunset);
        (times.sunrise.getHours()*60) + times.sunrise.getMinutes();

        dawn_min = minutize(times.dawn);
        dusk_min = minutize(times.dusk);
        sunrise_min = minutize(times.sunrise);
        sunset_min = minutize(times.sunset);
        daylength_min = sunset_min - sunrise_min;

        calcs_initialized = true;
}

function initializeDrawing() {
        r = Raphael("holder", 600, 600),
            R = 180,
            ORIGIN = 300,
            init = true,
            param = {stroke: "#fff", "stroke-width": 50};

        r.customAttributes.min_hand = function (min, R) {
            R = R*1.1
            var alpha = 360 / 1440 * min,
                a = (270 - alpha) * Math.PI / 180,
                x = ORIGIN + R * Math.cos(a),
                y = ORIGIN - R * Math.sin(a),
                color = "#DDD",
                path;
            // if (total == value) {
            //     path = [["M", ORIGIN, ORIGIN - R], ["A", R, R, 0, 1, 1, 299.99, ORIGIN - R]];
            // } else {
                path = [["M", ORIGIN, ORIGIN], [x, y]];
            // }
            return {path: path, stroke: color};
        };

        // r.customAttributes.min_arc = function (min_0, min_1, R) {
        //     var alpha0 = 360 / 1440 * min_0,
        //         a0 = (270 - alpha0) * Math.PI / 180,
        //         x0 = ORIGIN + R * Math.cos(a0),
        //         y0 = ORIGIN - R * Math.sin(a0),
        //         alpha1 = 360 / 1440 * min_1,
        //         a1 = (270 - alpha1) * Math.PI / 180,
        //         x1 = ORIGIN + R * Math.cos(a1),
        //         y1 = ORIGIN - R * Math.sin(a1),
        //         path;
        //     // if (total == value) {
        //     //     path = [["M", ORIGIN, ORIGIN - R], ["A", R, R, 0, 1, 1, 299.99, ORIGIN - R]];
        //     // } else {
        //         path = [["M", x0, y0], ["A", R, R, 0, +(alpha0 > 180), 1, x1, y1]];
        //     // }
        //     return {path: path};
        // };


        // r.customAttributes.min_arc = function (min_0, min_1, R) {
        //     var alpha0 = 360 / 1440 * min_0,            //ok angle0
        //         a0 = (270 - alpha0) * Math.PI / 180,
        //         x0 = ORIGIN + R * Math.cos(a0),
        //         y0 = ORIGIN - R * Math.sin(a0),
        //         alpha1 = 360 / 1440 * min_1,            //ok angle1
        //         a1 = (270 - alpha1) * (Math.PI / 180),
        //         x1 = ORIGIN + R * Math.cos(a1),
        //         y1 = ORIGIN - R * Math.sin(a1),
        //         path;
        //     // if (total == value) {
        //     //     path = [["M", ORIGIN, ORIGIN - R], ["A", R, R, 0, 1, 1, 299.99, ORIGIN - R]];
        //     // } else {
        //         console.log("min_0: "+min_0+" ("+alpha0+")   min_1: "+min_1+" ("+alpha1+")");

        //         var large_arc_flag;
        //         if (alpha1 > alpha0 && Math.abs(alpha1-alpha0) > 180 ) { large_arc_flag = 1 } 
        //             else { large_arc_flag = 0 }
        //         if ( alpha1 < alpha0 && Math.abs(alpha1-alpha0) < 180 ) { large_arc_flag = 1 }

        //         var sweep_flag = 1;

        //         path = [["M", x0, y0], ["A", R, R, 0, large_arc_flag, sweep_flag, x1, y1]];
        //         console.log("large_arc_flag " + large_arc_flag+ "   sweep_flag " + sweep_flag);
        //     // }
        //     return {path: path};
        // };

        r.customAttributes.min_arc = function (min_0, min_1, R) {
            var alpha0 = 360 / 1440 * min_0,            //ok angle0
                a0 = (270 - alpha0) * Math.PI / 180,
                x0 = ORIGIN + R * Math.cos(a0),
                y0 = ORIGIN - R * Math.sin(a0),
                alpha1 = 360 / 1440 * min_1,            //ok angle1
                a1 = (270 - alpha1) * (Math.PI / 180),
                x1 = ORIGIN + R * Math.cos(a1),
                y1 = ORIGIN - R * Math.sin(a1),
                path;
            // if (total == value) {
            //     path = [["M", ORIGIN, ORIGIN - R], ["A", R, R, 0, 1, 1, 299.99, ORIGIN - R]];
            // } else {
                console.log("min_0: "+min_0+" ("+alpha0+")   min_1: "+min_1+" ("+alpha1+")");

                var large_arc_flag;
                if (alpha1 > alpha0 && Math.abs(alpha1-alpha0) > 180 ) { large_arc_flag = 1 } 
                    else { large_arc_flag = 0 }
                if ( alpha1 < alpha0 && Math.abs(alpha1-alpha0) < 180 ) { large_arc_flag = 1 }

                var sweep_flag = 1;

                path = [["M", x0, y0], ["A", R, R, 0, large_arc_flag, sweep_flag, x1, y1]];
                if (ARC_STYLE == "fill") { path +=  [["L", ORIGIN, ORIGIN], ["Z"]]; }

                console.log("large_arc_flag " + large_arc_flag+ "   sweep_flag " + sweep_flag);
            // }
            return {path: path};
        };


        dial = r.circle(300, 300, 80).attr({stroke: "#fff", "stroke-width":1});
        hub = r.circle(300, 300, 3).attr({stroke: "none", fill: "#DDD"});

        if (ARC_STYLE == "fill") {
            R = 45;
            DawnArc = r.path().attr({ opacity:50 }).attr({fill:"#74622E", "stroke-width":0}).attr({min_arc: [0, 0, R]});
            DayArc = r.path().attr({ opacity:50 }).attr({fill:"#C1A34D", "stroke-width":0}).attr({min_arc: [0, 0, R]});
        } else {
            R = 67;
            DawnArc = r.path().attr({ opacity:50 }).attr({stroke:"#74622E", "stroke-width":15, "stroke-opacity":0.60}).attr({min_arc: [0, 0, R]});
            DayArc = r.path().attr({ opacity:50 }).attr({stroke:"#C1A34D", "stroke-width":15, "stroke-opacity":0.60}).attr({min_arc: [0, 0, R]});
        }
        
        MinHand = r.path().attr({"stroke-width":3}).attr({min_hand: [0, R]});
        GeoError = r.text(300, 300, "Sorry, browser geolocation\n must be available to\ncalculate your sunclock.\n \nShowing default location:\nSan Lorenzo River (at Branciforte confluence)").attr({fill: '#bbb', "font-size":14, opacity:0}).hide()
        GeoMsg = r.text(300, 300, "(To calculate your sunclock,\n you must allow browser geolocation.)").attr({fill: '#bbb', "font-size":14, opacity: 0}).hide()
}


function updateSunArcs(elem) {
    DawnArc.attr({min_arc: [dawn_min, dusk_min, R]}).animate({ opacity:50 }, 300);
    DayArc.attr({min_arc: [sunrise_min, sunset_min, R]}).animate({ opacity:50 }, 300);
}

function updateMinHand(time, elem) {
    elem.animate({min_hand: [time, 65]}, 750, "none");
}

function blinkOut(elem) {
    elem.animate({fill:"#DDD", "stroke-width":1.5, stroke:"#AAA"}, 700);            
    // elem.animate({fill:"#666"}, 300);
    elem.animate({fill:"#666", "stroke-width":0}, 300);

}

function flashGeoError() {
    GeoMsg.hide();
    GeoError.show().animate({opacity:1}, 5000);
    setTimeout(function() {GeoError.animate({opacity:0}, 3000);}, 9000);
    setTimeout(function() {GeoError.hide()}, 6000);
}


function minutize(datetime) {
    // reports standard date object as minutes from day's beginning
    return datetime.getHours()*60 + datetime.getMinutes();
}

function showDefaultSunArcs() {
    lat = 36.97408;
    lon = -122.0230029;
    showDefaultMapPoint(lat, lon);
}

function getLocationAndInitialize() {
    if (navigator.geolocation) {
        setTimeout(function() {if (!calcs_initialized) {GeoMsg.show().animate({ opacity : 1 }, 1000);}}, 4000);
        console.log("Geolocation possible.");
        navigator.geolocation.getCurrentPosition(setPosition, setPosition);
    } else {
        console.log("Geolocation is not supported by this browser.");
        flashGeoError();
        //showDefaultSunArcs();
    }
}

function setPosition() {
    GeoMsg.animate({ opacity : 0 }, 1000).hide();
        
	lat = Latitude;
    lon = Longitude;
    console.log("Geo: " + lat + " " + lon);
    
    initializeSunCalcs();
    updateSunArcs();
}

function minutize(datetime) {
    // reports standard date object as minutes from day's beginning
    return datetime.getHours()*60 + datetime.getMinutes();
}



function sunclock_draw() {

        initializeDrawing();

        //getLocationAndInitialize();
		setPosition();

        (function () {
            var d = new Date,
                am = (d.getHours() < 12),
                h = d.getHours() % 12 || 12;
            updateMinHand(minutize(d), MinHand);
            //blinkOut(hub);
            setTimeout(arguments.callee, 1000);
            init = false;
        })();
    };

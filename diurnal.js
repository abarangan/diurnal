
//if we're counting up or down
var Run_direction='';;
var CLOCK_PHASE = {
	NIGHT : {value: 0, name: "Night", code: "N"}, 
	DAY: {value: 1, name: "Day", code: "D"} 
};

//how to determine location
var Location_method;
var LOC_TYPE = {
	IP : {value: 0, name: "Approx", code: "A"}, 
	GPS: {value: 1, name: "Precise", code: "P"},
	TEST: {value: 2, name: "Test", code: "T"},
};

//are we displaying w/r/t sunrise or sunset
var Display_type;
var SUN = {
	RISE : {value: 0, name: "Rise", code: "R"}, 
	SET : {value: 1, name: "Set", code: "S"} 
};

//Geo Location
var Latitude=0;
var Longitude=0;
var Accuracy;

//Commmon Location
var City = '';
var State = '';

//Diurnal Time Values (in seconds)
var SunriseSecs;
var SunsetSecs;

//Date values for future sunset/rise events
var Current_sunset;
var Current_sunrise;

function location_get_test() {
	//test values for Santa Cruz, CA
	Latitude = 36.9720;
	Longitude = -122.0263;
	City = "Santa Cruz";
	State = "California";
}


function location_getReverseGeocodingData(lat, lng) {
    var latlng = new google.maps.LatLng(lat, lng);
   
 	// This is making the Geocode request
    var geocoder = new google.maps.Geocoder();
    geocoder.geocode({ 'latLng': latlng }, function (results, status) {
        if (status == google.maps.GeocoderStatus.OK) {
			var result = results[0];
			//look for locality tag and administrative_area_level_1

			for(var i=0, len=result.address_components.length; i<len; i++) {
				var ac = result.address_components[i];
				if(ac.types.indexOf("locality") >= 0) City = ac.long_name;
				if(ac.types.indexOf("administrative_area_level_1") >= 0) State = ac.long_name;
			}
    	}
	});
}

function location_check() {
	if (Latitude==0) {
		location_get_approximate();
	}
}

function location_get_exact() {

	var options = {
  		enableHighAccuracy: false,
  		timeout: 5000,
  		maximumAge: 0
	};
    
	if (navigator.geolocation) {
		setTimeout(navigator.geolocation.getCurrentPosition(location_store_exact,location_get_approximate,options), 0);
    } else { 
       location_get_approximate();
    }

	setTimeout(location_check, 5000);
}

function location_store_exact(position) {
	Latitude =  position.coords.latitude;
	Longitude = position.coords.longitude;
	Accuracy = position.coords.accuracy;

	//get City/State information based on geo
	location_getReverseGeocodingData(Latitude,Longitude);

	//update display
	suntime_update_values(Latitude,Longitude);

	//draw clock
	sunclock_draw();
}

function location_get_approximate() {

	$.getJSON("http://ip-api.com/json/?callback=?", function(data) {
		if (data != null) {
    		$.each(data, function(k, v) {
        		if(k == "lat")
					Latitude = v;
				if(k == "lon")
					Longitude = v;
				if(k == "city")
					City = v;
				if(k == "regionName")
					State = v;
    		});
		}

		//get City/State information based on geo
		location_getReverseGeocodingData(Latitude,Longitude);

		suntime_update_values(Latitude,Longitude);

		//draw clock
		sunclock_draw();

	});
}



function location_update(method) {
	if(method == LOC_TYPE.IP)
		location_get_approximate();
	else if(method == LOC_TYPE.GPS) 
		location_get_exact();
	else if(method == LOC_TYPE.TEST) 
		location_get_test();
}


function suntime_publish() {

	if(Display_type == SUN.RISE) {
		var hours   = Math.floor(SunriseSecs / 3600);
		var minutes = Math.floor((SunriseSecs - (hours * 3600)) / 60);
		var seconds = Math.ceil(SunriseSecs - (hours * 3600) - (minutes * 60));

		if(Run_direction==CLOCK_PHASE.NIGHT) { 
			$("#dir").html("-");
		}
		else {
			$("#dir").html("");
		}
	}
	else if(Display_type == SUN.SET) { 
		var hours   = Math.floor(SunsetSecs / 3600);
		var minutes = Math.floor((SunsetSecs - (hours * 3600)) / 60);
		var seconds = Math.ceil(SunsetSecs - (hours * 3600) - (minutes * 60));

		if(Run_direction==CLOCK_PHASE.DAY) { 
			$("#dir").html("-");
		}
		else {
			$("#dir").html("");
		}
	}
	
	if((Latitude != 0)&&(Longitude != 0)) {
		$("#sec").html(( seconds < 10 ? "0" : "" ) + seconds);
		$("#min").html(( minutes < 10 ? "0" : "" ) + minutes);
		$("#hours").html(( hours < 10 ? "0" : "" ) + hours);



		if(Display_type == SUN.RISE) {
			$("#GeoText").html("Based on the location of <em>" + City + ", " + State + "</em> with a sunrise of " + time_format(Current_sunrise) + "am.");
		}
		else if(Display_type == SUN.SET) {
			$("#GeoText").html("Based on the location of <em>" + City + ", " + State + "</em> with a sunset of " + time_format(Current_sunset) + "pm.");
		}
	}
}

function suntime_calc(sunrise, sunset, direction) {
	var now = new Date();

	if(direction==CLOCK_PHASE.DAY) {
		SunriseSecs = Math.floor((now - sunrise) / 1000);	//in seconds
		SunsetSecs = Math.floor((sunset - now) / 1000);
	}
	else if(direction==CLOCK_PHASE.NIGHT) {
		SunriseSecs = Math.floor((sunrise - now) / 1000);
		SunsetSecs = Math.floor((now - sunset) / 1000);
	}

	suntime_publish();
}

function suntime_change_to_night() {
    //var newimgsrc = 'images/glacier_night.jpg?' + (new Date().getTime());
	var newimgsrc = 'images/glacier_night.jpg';
    //replace the image
	$("html").css("background", "url("+newimgsrc+") no-repeat center center fixed");
	$("html").css("background-size", "cover");
}

function suntime_change_to_day() {
    //var newimgsrc = 'images/glacier.jpg?' + (new Date().getTime());
	var newimgsrc = 'images/glacier.jpg';
    //replace the image
	$("html").css("background", "url("+newimgsrc+") no-repeat center center fixed");
	$("html").css("background-size", "cover");
}

//---------------------
//Function: suntime_update_sun_values
//Purpose: determine proper sunrise/set times and set run_direction global
//Inputs: latitude, longitude of location
//Returns: Sunrise and Sunset times within SunCalc Object
//---------------------
function suntime_update_values(latitude, longitude) {
	var current_time = new Date();
	var suncalc_times = SunCalc.getTimes(current_time, latitude, longitude);
	var datenow;
	var daterise;
	var dateset;

	//if the sun is out now
	if((current_time < suncalc_times.sunset)&&(current_time > suncalc_times.sunrise)) {

		if(Run_direction==CLOCK_PHASE.NIGHT) {
			//suntime_change_to_day();
		}

		Run_direction = CLOCK_PHASE.DAY;
	}
	//else the sun has set
	else {
		
		//suntime_change_to_night();
	
		Run_direction = CLOCK_PHASE.NIGHT;

		if(Display_type == SUN.RISE) {
			//let's make sure we're looking at the next sunrise
    		if(suncalc_times.sunrise < current_time) {
    			var tomorrow = new Date();
    			tomorrow.setDate(tomorrow.getDate() + 1);
    			suncalc_times = SunCalc.getTimes(tomorrow, latitude, longitude);
			}
		}

		if(Display_type == SUN.SET) {
			//let's make sure we're looking at the last sunset
    		if(suncalc_times.sunset > current_time) {
    			var tomorrow = new Date();
    			tomorrow.setDate(tomorrow.getDate() - 1);
    			suncalc_times = SunCalc.getTimes(tomorrow, latitude, longitude);
			}
		}

	}

	Current_sunrise = suncalc_times.sunrise;
	Current_sunset = suncalc_times.sunset;

	datenow = current_time.getDate();
	daterise = Current_sunrise.getDate();
	dateset = Current_sunset.getDate();

}	


function suntime_check(sunrise, sunset, direction) {
	var now = new Date();

	if(direction==CLOCK_PHASE.NIGHT) {
		//next event is sun will rise, did that happen?
		if(now >= sunrise) {
			console.log("Updating values, we think the sun has risen")
			//verify location?
			//location_update(Location_method);

			//update sun values
			suntime_update_values(Latitude,Longitude);
		}
	}
	else if(direction==CLOCK_PHASE.DAY) {
		console.log("direction==CLOCK_PHASE.DAY")
		//next event is sun will set, did that happen?
		if(now >= sunset) {
			console.log("Updating values, we think the sun has set")
			//verify location?
			//location_update(Location_method);

			//update sun values
			suntime_update_values(Latitude,Longitude);
		}			
	}
}


function time_format(date_val) {
	var hours = date_val.getHours();
	var minutes = date_val.getMinutes();

	//Just use 12 hour clock
	hours = hours % 12;

	if(minutes < 10)
		minutes = "0" + minutes;

	return hours + ':' + minutes;
}

function toggle_rise_set() {
	if (Display_type==SUN.RISE) {
		Display_type = SUN.SET;
		suntime_change_to_night();
	}
	else if (Display_type==SUN.SET) {
		Display_type = SUN.RISE;
		suntime_change_to_day();
	}

	//update DT
	suntime_update_values(Latitude,Longitude);
	suntime_calc(Current_sunrise, Current_sunset, Run_direction);
}

var Fire_once = false;

document.onkeypress = key_press_handler;
function key_press_handler(e)
{
	var now = new Date();
  	
	if (!e) e=window.event;
	
	if(Fire_once==false)
	{
		if((e.keyCode==114)||(e.charCode==114)) { 	// 'r'
			toggle_rise_set();
		}
	}

	Fire_once = true;
}

document.onkeyup = key_up_handler;
function key_up_handler(e)
{
  	if (!e) e=window.event;

	if((e.keyCode==82)||(e.charCode==82)) { 	// 'r'
		toggle_rise_set();
	}
	
	Fire_once = false;	
}


function enable_touch() {
	var getPointerEvent = function(event) {
	    return event.originalEvent.targetTouches ? event.originalEvent.targetTouches[0] : event;
	};

	var $touchArea = $('#touchArea'),
	    touchStarted = false, // detect if a touch event is sarted
	    currX = 0,
	    currY = 0,
	    cachedX = 0,
	    cachedY = 0;

	$touchArea.on('touchstart mousedown',function (e){
    	e.preventDefault(); 
    	
		var pointer = getPointerEvent(e);
    
		// caching the current x
    	cachedX = currX = pointer.pageX;
    
		// caching the current y
    	cachedY = currY = pointer.pageY;
    
		// a touch event is detected      
    	touchStarted = true;
    	toggle_rise_set();
	});

	$touchArea.on('touchend mouseup touchcancel',function (e){
    	e.preventDefault();
    
		// here we can consider finished the touch event
    	touchStarted = false;
    	toggle_rise_set();
	});
}

$(document).ready(function() {
	var now = new Date();
	Display_type = SUN.RISE;

	//preload night image
	if (document.images) {
	    img1 = new Image();
	    img1.src = "images/glacier_night.jpg";
	}

	enable_touch();

	//get location
	Location_method = LOC_TYPE.GPS;	//GPS, IP, TEST
	location_update(Location_method);

	setInterval( function() {
		//do we need to update sun data?
		suntime_check(Current_sunrise, Current_sunset, Run_direction); 

		//update DT
		suntime_calc(Current_sunrise, Current_sunset, Run_direction);
    },1000);
});	


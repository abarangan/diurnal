
//if we're counting up or down
var Run_direction;
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

//Commmon Location
var City = '';
var State = '';

//Diurnal Time Values (in seconds)
var SunriseSecs;
var SunsetSecs;


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

function location_get_exact() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(location_store_exact);
    } else { 
        x.innerHTML = "Geolocation is not supported by this browser.";
    }
}

function location_store_exact(position) {
	Latitude =  position.coords.latitude;
	Longitude = position.coords.longitude;

	//get City/State information based on geo
	location_getReverseGeocodingData(Latitude,Longitude);

	//update display
	suntime_update_values(Latitude,Longitude);
}

function location_update(method) {
	if(method == LOC_TYPE.IP)
		;//location_get_approximate();
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
	}
	else if(Display_type == SUN.SET) { 
    	var hours   = Math.floor(SunsetSecs / 3600);
    	var minutes = Math.floor((SunsetSecs - (hours * 3600)) / 60);
    	var seconds = Math.ceil(SunsetSecs - (hours * 3600) - (minutes * 60));
	}

    if(Run_direction==CLOCK_PHASE.NIGHT) { 
		$("#dir").html("-");
	}
	
	if((Latitude != 0)&&(Longitude != 0)) {
    	$("#sec").html(( seconds < 10 ? "0" : "" ) + seconds);
    	$("#min").html(( minutes < 10 ? "0" : "" ) + minutes);
    	$("#hours").html(( hours < 10 ? "0" : "" ) + hours);
		$("#GeoText").html("Based on your location of <em>" + City + ", " + State + "</em> with a sunrise of " + time_format(Current_sunrise) + "am.");
	}
}

function suntime_change_to_night() {
    var newimgsrc = 'images/glacier_night.jpg?' + (new Date().getTime());
    var newimg = $('#html');
    //replace the image
	$("html").css("background", "url("+newimgsrc+") no-repeat center center fixed");
	newimg.css({'background': 'url('+newimgsrc+')', '-webkit-background-size': 'cover', '-moz-background-size': 'cover', '-o-background-size': 'cover', 'background-size': 'cover'});
	newimg.show();
}

function suntime_change_to_day() {
    var newimgsrc = 'images/glacier.jpg?' + (new Date().getTime());
    var newimg = $('#html');
    //replace the image
	$("html").css("background", "url("+newimgsrc+") no-repeat center center fixed");
	newimg.css({'background': 'url('+newimgsrc+')', '-webkit-background-size': 'cover', '-moz-background-size': 'cover', '-o-background-size': 'cover', 'background-size': 'cover'});
	newimg.show();

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
	var test_hours;

	//if the sun is out now
	if((current_time < suncalc_times.sunset)&&(current_time > suncalc_times.sunrise)) {
		Run_direction = CLOCK_PHASE.DAY;
		suntime_change_to_day();
	}
	//else the sun has set
	else {
		Run_direction = CLOCK_PHASE.NIGHT;
		suntime_change_to_night();

		//if it's before midnight, we need to look at "tomorrow's" sunrise
    	if(current_time.getHours() > 12) {
    		var tomorrow = new Date();
    		tomorrow.setDate(tomorrow.getDate() + 1);
    		suncalc_times = SunCalc.getTimes(tomorrow, latitude, longitude);
		}
	}

	Current_sunrise = suncalc_times.sunrise;
	Current_sunset = suncalc_times.sunset;
}	


function suntime_check(now, sunrise, sunset, direction) {
	if(direction==CLOCK_PHASE.NIGHT) {
		//next event is sun will rise, did that happen?
		if(now >= sunrise) {
			//verify location
			location_update(Location_method);

			//update sun values
			suntime_update_values(Latitude,Longitude);
		}
	}
	else if(direction==CLOCK_PHASE.DAY) {
		//next event is sun will set, did that happen?
		if(now >= sunset) {
			//verify location
			location_update(Location_method);

			//update sun values
			suntime_update_values(Latitude,Longitude);
		}			
	}
}


function suntime_calc(now, sunrise, sunset, direction) {
	if(direction==CLOCK_PHASE.DAY) {
		SunriseSecs = (now - sunrise) / 1000;	//in seconds
		SunsetSecs = (sunset - now) / 1000;
	}
	else if(direction==CLOCK_PHASE.NIGHT) {
		SunriseSecs = (sunrise - now) / 1000;
		SunsetSecs = (now - sunset) / 1000;
	}
}


function time_format(date_val) {
	return date_val.getHours() + ':' + date_val.getMinutes();
}


$(document).ready(function() {
	var now = new Date();
	Display_type = SUN.RISE;

	//get location
	Location_method = LOC_TYPE.GPS;	//GPS, IP, TEST
	location_update(Location_method);

	//update sunrise/set values
	//suntime_update_values(Latitude,Longitude);
	
	//update time to display
	//suntime_calc(now, Current_sunrise, Current_sunset, Run_direction);
	
	//set display values
	//suntime_publish();


setInterval( function() {
	// Create a newDate() object and extract the seconds of the current time on the visitor's
	var now = new Date();

	//do we need to update sun data?
	suntime_check(now, Current_sunrise, Current_sunset, Run_direction); 
	
	//update DT
	suntime_calc(now, Current_sunrise, Current_sunset, Run_direction);

	//initiate publish
	suntime_publish(); 

    },1000);
});	


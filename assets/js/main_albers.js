mapboxgl.accessToken = 
'pk.eyJ1IjoiY2xpbWF0ZWNhYmluZXQiLCJhIjoiY2tkem41a2p3Mmd1NzJ0bXA3ZXc4dDBrdyJ9.MCFylyjbwUw7Sisd5QUhDw';

// District Data comes from a var imported from top_20.js in index.html.
// Here, we convert it from a dict of key to value to an array without the
// key, since we don't need it.
district_data = Object.values(district_data); 

var mapOrigin = {
    zoom: 3.48,
    // lng: -95.5,
    // lat: 38,
};

// got these bounds using map.fitBounds(turf.bbox(us_states_id_albers[0]), {padding: 20});
var bounds = [
        [-29.62723161264651, -14.135507266203689],
        [26.315476155372494,13.760911540652828]
      ];



var map = new mapboxgl.Map({
    container: 'map',
    // style: 'mapbox://styles/patrickvossler/ckc0ydvhi5h3v1iodhe5rgsjg', // mercator
    style:"mapbox://styles/climatecabinet/cke05bgqr13cv19nxjurapvsc", //albers
    zoom: mapOrigin.zoom,
    attributionControl: false,
    maxBounds: bounds // prevents users from panning and zooming outside of bounding box

});

map.addControl(new mapboxgl.AttributionControl(), 'bottom-right');
// map.addControl(new mapboxgl.NavigationControl(), 'top-left');
map.dragRotate.disable();
map.touchZoomRotate.disableRotation();
// map.scrollZoom.disable();

var url = new URL(window.location.href);
var embed = url.searchParams.get('embed');
if (embed === 'true') {
    document.getElementsByTagName('body')[0].classList.add('embed');
    map.resize();
}

var circleOpacity = ['interpolate', ['linear'], ['zoom'], 0, 0.15, 3, 0.15, 6, 0.9];
var lineOpacity = ['interpolate', ['linear'], ['zoom'], 0, 0, 4, 0, 6, 0.05];

var colorDemocrat = '#2381C1';
var colorRepublican = '#CC2531';
var colorOther = 'hsl(0, 0%, 65%)';
var colorMixed = '#9a23c1';

var hoveredStateId;
var hoveredStateFillId;
var houseName = 'lower';
var styleMode = 'polygons';

// This popup appears to the right of the map and contains
// all of the candidate info.
var popup = document.getElementById("floating-card");

function loadDots() {
    styleMode = 'dots';
    map
        .setLayoutProperty('district-points', 'visibility', 'visible')
}


// When viewing at state level
const onMouseMoveState = function(e){
    if (e.features.length > 0) {
        if (hoveredStateFillId) {
            map.setFeatureState(
                { source: 'us-states', id: hoveredStateFillId },
                { hover: false }
            );
            // also remove hover on Maine as well because for some reason it is not removing hover normally
            map.setFeatureState(
                { source: 'us-states', id: 23 },
                { hover: false }
            );

        }
        hoveredStateFillId = e.features[0].id;
        map.setFeatureState(
            { source: 'us-states', id: hoveredStateFillId },
            { hover: true }
        );
    }
}

const onMouseLeaveState = function(){
    map.getCanvas().style.cursor = '';
    if (hoveredStateFillId) {
        map.setFeatureState(
            { source: 'us-states', id: hoveredStateFillId },
            { hover: false }
        );
        // also remove hover on Maine as well because for some reason it is not removing hover normally
        map.setFeatureState(
            { source: 'us-states', id: 23 },
            { hover: false }
        );
    }
    hoveredStateFillId = null;
}

// When viewing at district level
const onMouseMoveDistrict = function(e) {
    if (e.features.length > 0) {
        map.getCanvas().style.cursor = 'pointer';
        if (hoveredStateId) {
            map.setFeatureState(
                { source: 'state_districts_pts',  
                id: hoveredStateId },
                { hover: false }
            );
        }
        hoveredStateId = e.features[0].id;
        map.setFeatureState(
            { source: 'state_districts_pts', id: hoveredStateId },
            { hover: true }
        );
    }
};

// When viewing at district level
const onMouseLeaveDistrict = function() {
    if (hoveredStateId) {
        map.setFeatureState(
            { source: 'state_districts_pts', id: hoveredStateId },
            { hover: false }
        );
    }
    hoveredStateId = null;
};

const onDistrictClick = function(e) {
    if (e.features.length == 0) return;
    map.getCanvas().style.cursor = 'pointer';
    map.setFeatureState(
        { source: 'state_districts_pts', id: hoveredStateId },
        { hover: false }
    );
    var district_properties = e.features[0].properties;
  
    var is_incumbent = false;
    if (district_properties.incumbent_lifetime_score && district_properties.oponent_lifetime_score) {
       is_incumbent = district_properties.incumbent_lifetime_score > district_properties.opponent_lifetime_score;
    } else if (district_properties.incumbent_lifetime_score) {
	is_incumbent = true;
   }
    // TBD: for deciding action needed, we can compare lifetime scores?

    // only saying which party won
    var prev_winner = district_properties.prev_natl_election_winner;
    var prev_winner_percent = Math.round(district_properties.prev_natl_election_winner_percent * 100,2);
    var prev_election_year = district_properties.prev_natl_election_year;
    
    var reps = '';

    // TODO: Candidate Image. Not currently populated, so no we sub in the climate cabinet pic.
    var img_src = "https://uploads-ssl.webflow.com/5f13afc0ce36dff9a4e6a640/5f1424fd860f156c851130d7_ClimCab-Logo.png";
    reps += '<img width="373" src="' + img_src + '" alt="" sizes="(max-width: 479px) 159.796875px, (max-width: 767px) 37vw, (max-width: 991px) 286px, 373px" class="image-4">';

    var candidate_name = is_incumbent ? district_properties.incumbent_name : district_properties.opponent_name;

    var district = district_properties.name;    
    reps += '<h5 class="card_intro heading-4">' + candidate_name + ', ' + 
        (is_incumbent ? 'incumbent ' : 'candidate') + ' for ' + district + '</h5>';

    reps += '<div class="div-block-2">' + 
            '<img src="https://uploads-ssl.webflow.com/5f13afc0ce36dff9a4e6a640/5f14e3b5b156a21f896d6fd5_StateChamber.png"' +
            'width="47" alt="" class="image-5"><div class="text-block-2">Climate Cabinet Ranking: #' +
            district_properties.climate_cabinet_ranking + ' </div></div>';

    var action_needed = is_incumbent ? "Flip the seat": "Hold the seat";
    var donate_url = is_incumbent ?
        district_properties.incumbent_donate_url : district_properties.opponent_donate_url;
    var donate_link = "<a href = " + donate_url + "> Donate to " + candidate_name + " here.</a>";
    reps += '<h6>Action Needed: ' + action_needed + ' -- ' + donate_link + ' </h6>';


    // TBD: do we have data on local election results?
    if (prev_winner && prev_winner_percent && prev_election_year) {
    	var race_label = "\"tossup\"";
    	reps += '<br><p class="paragraph-4">This race is a ' + race_label + '. ' + prev_winner + ' won it by ' + prev_winner_percent + '% in ' + prev_election_year+'. </p>'; 
    }

    var key_votes = "[Examples of key climate votes]";    
    reps += '<br><p class="paragraph-4> ' + candidate_name + ' has voted ' + key_votes + '. </p>';
   
    // Override all inner html of the popup.
    popup.innerHTML = reps;

    hoveredStateId = e.features[0].id;
    map.setFeatureState(
        { source: 'state_districts_pts', id: hoveredStateId },
        { hover: true }
    );
};

const getDistrictCentroid = function(district, albers=false){
    // TODO: Handle upper and lower legislatures
    // TODO: Select shape based on year. Currently assuming we only have one shape in the array
    return district['shapes'].map(function(shape,i){
        var response = {};
        response.type = "Feature";
        response.id = i + 1 // doing this to avoid 0 == false in Javascript
        response.properties = {};
        response.properties.state = district.state_abbr;
        response.properties.district_code = district.district_code;
        response.properties.name = district.name;
        response.properties.which_house = district.ccid.indexOf("L") > -1 ? "lower" : "upper";
	response.properties.climate_cabinet_ranking = district.cc_ranking;
        if (district.elections && district.elections[0]) {
		response.properties.prev_natl_election_winner = (district.elections[0]["dem_prop"] > district.elections[0]["rep_prop"]) ? "Democrats" : "Republicans";
		response.properties.prev_natl_election_winner_percent = Math.abs(district.elections[0]["dem_prop"] - district.elections[0]["rep_prop"]);
     		response.properties.prev_natl_election_year = district.elections[0].year;
       } 
       if (district.incumbent) {
		var incumbent = district.incumbent;
		response.properties.incumbent_name = incumbent.name;
        	response.properties.incumbent_lifetime_score = incumbent.lifetime_score;
		response.properties.incumbent_donate_url = incumbent.donation_link;
	} 
        if (district.opoonent) {
		var opponent = district.opponent;
		response.properties.opponent_name = opponent.name;
		response.properties.opponent_lifetime_score = opponent.lifetime_score;
		response.properties.opponent_donate_url = district.opponent.donation_link;
        }
        response.geometry = (albers ? getCentroid(projectToAlbersUsa(shape.geometry)) : getCentroid(shape.geometry));
        return response;
    })
};

const projectToAlbersUsa = function(geometry){
    let R = 6378137.0 // radius of Earth in meters
    var options = {
        "forward": "albersUsa",
        "reverse": "geoMercator",
        "projections": {
            "albersUsa": d3.geoAlbersUsa().translate([0, 0]).scale(R),
            "geoMercator": d3.geoMercator().translate([0, 0]).scale(R)
        }
    };

    return reproject(options,geometry)
}

const getPolygonBoundingBox = function(feature) {
    // bounds [xMin, yMin][xMax, yMax]
    var bounds = [[], []];
    var polygon;
    var latitude;
    var longitude;

    for (var i = 0; i < feature.geometry.coordinates.length; i++) {
        if (feature.geometry.coordinates.length === 1) {
            // Polygon coordinates[0][nodes]
            polygon = feature.geometry.coordinates[0];
        } else {
            // Polygon coordinates[poly][0][nodes]
            polygon = feature.geometry.coordinates[i][0];
        }

        for (var j = 0; j < polygon.length; j++) {
            longitude = polygon[j][0];
            latitude = polygon[j][1];

            bounds[0][0] = bounds[0][0] < longitude ? bounds[0][0] : longitude;
            bounds[1][0] = bounds[1][0] > longitude ? bounds[1][0] : longitude;
            bounds[0][1] = bounds[0][1] < latitude ? bounds[0][1] : latitude;
            bounds[1][1] = bounds[1][1] > latitude ? bounds[1][1] : latitude;
        }
    }

    return bounds;
}


const getCentroid = function(geometry) {
    var poly_bounds = [];
    var polygon;
    var latitude;
    var longitude;
    for (var i = 0; i < geometry.coordinates.length; i++) {
        if (geometry.coordinates.length === 1) {
           // Polygon coordinates[0][nodes]
           polygon = geometry.coordinates[0];
        } else {
            // Polygon coordinates[poly][0][nodes]
	    // HACK - Currently, some data is not formatted the same as others.
	    // So skip it for now.
	    return null;
            polygon = geometry.coordinates[i][0];
        }
        for (var j = 0; j < polygon.length; j++) {
            longitude = polygon[j][0];
            latitude = polygon[j][1];
            poly_bounds.push([longitude,latitude])
        }

    }
    var outline = turf.polygon([poly_bounds]);
    return turf.centroid(outline)['geometry'];
}

const loadMap = function() {
    map.on('mousemove', 'district-points', function(e) {
        onMouseMoveDistrict(e);
    });

    map.on('mouseleave', 'district-points', function() {
        onMouseLeaveDistrict();
    });

    map.on('mousemove', 'us-states-fill', function(e) {
        onMouseMoveState(e);
    });

    map.on('mouseleave', 'us-states-fill', function() {
        onMouseLeaveState();
    });

    map.on('click', 'us-states-fill', function(e) {
        var bounds = getPolygonBoundingBox(e.features[0]);
        map.fitBounds(bounds, {
            padding: 20
        });

    });

    map.on('click', 'district-points', function(e){
        onDistrictClick(e);
    })


    if (map.getLayer('district-polygons-fill')) {
        map.removeLayer('district-polygons-fill');
    }
    map.addLayer(
        {
            id: 'district-polygons-fill',
            type: 'fill',
            source: 'state_districts_pts',
            paint: {
                'fill-color': colorDemocrat,
                'fill-opacity': styleMode === 'polygons' ? 0.6 : 0,
            },
        },
    );


    if (map.getLayer('district-polygons-line')) {
        map.removeLayer('district-polygons-line');
    }

    map.addLayer(
        {
            id: 'district-polygons-line',
            type: 'line',
            source: 'state_districts_pts',
            // 'source-layer': layerName + '_polygons',
            paint: {
                'line-color': '#000',
                'line-opacity': styleMode === 'polygons' ? 0.6 : lineOpacity,
                'line-width': 1,
            },
        },
    );


    if (map.getLayer('district-polygons-highlight')) {
        map.removeLayer('district-polygons-highlight');
    }
    map.addLayer(
        {
            id: 'district-polygons-highlight',
            type: 'line',
            source: 'state_districts_pts',
            paint: {
                'line-color': '#000',
                'line-opacity': ['case', ['boolean', ['feature-state', 'hover'], false], 0.9, 0],
                'line-width': 2,
            },
        },
    );



    if (map.getLayer('district-points')) {
        map.removeLayer('district-points');
    }

    map.addLayer(
        {
            id: 'district-points',
            type: 'circle',
            source: 'state_districts_pts',
            paint: {
                // 'circle-opacity': circleOpacity,
                'circle-opacity':
                [
                'case',
                ['boolean', ['feature-state', 'hover'], false],
                1,
                0.75
                ],
                // 'circle-opacity': 0.9,
                'circle-color': '#000',
                'circle-radius': ['interpolate', ['linear'], ['zoom'],
                    // When zoom is x, circle radius will be y
                    // x,y
                    5, 8,
                    10, 16
                ],
                // 'circle-radius': 20,
                'circle-stroke-color': '#000',
                'circle-stroke-width': 0.5,
                'circle-stroke-opacity': 0.75
                
            },
            layout: {
                visibility: styleMode === 'polygons' ? 'none' : 'visible',
            },
            // 'filter' : ['==', 'which_house', houseName]
        }
    );

};

map.on('load', function() {
    map.fitBounds(turf.bbox(us_states_id_albers[0]), {padding: 20});
    map.addSource('us-states', {
        type: 'geojson',
        // data: '/data/us-states-id.json',
        data: us_states_id_albers[0]
    });

    map.addLayer(
        {
            id: 'us-states-fill',
            type: 'fill',
            source: 'us-states',
            paint: {
                'fill-color': '#c36c27',
                'fill-opacity': 1
            },
        },
    );
    map.addLayer(
        {
            id: 'us-states-line',
            type: 'line',
            source: 'us-states',
            paint: {
                'line-color': '#FFF',
                'line-opacity': 0.9,
                'line-width': [
                    'case',
                    ['boolean', ['feature-state', 'hover'], false],
                    3,
                    1
                ],
            },
        },
    );

    // What's returned is an object, and we need an array of objects.
    const flattenDistrictDataIntoGeoJSON = function(obj) {
        var features = [];
        // In order to get the length of an object, we need to get the keys, then get their length - we
        // can't just get it directly.
        for (var i = 0; i < Object.keys(obj).length; ++i) {
            features.push(obj[i][0]);
        }
        return features;
    }

    map.addSource('state_districts_pts',{
        type: 'geojson',
        data: {
                'type': 'FeatureCollection',
                'features': flattenDistrictDataIntoGeoJSON(
                    district_data.map(district => getDistrictCentroid(district, true))
                )
            }
    });

    loadMap();
    loadDots();

    // when we first load the map, make sure only the states are visible, not the districts
    map.setLayoutProperty('us-states-fill', 'visibility', 'visible')
    map.setLayoutProperty('us-states-line', 'visibility', 'visible')
    map.setLayoutProperty('district-polygons-fill', 'visibility', 'none')
    map.setLayoutProperty('district-polygons-line', 'visibility', 'none')
});

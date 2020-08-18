mapboxgl.accessToken = 
'pk.eyJ1IjoicGF0cmlja3Zvc3NsZXIiLCJhIjoiY2tjMHd0eTFrMHphMjJybG0yOTU1dDEzZyJ9.FsIqtdsHIru8Ay_0zmZYHw';

// District Data comes from a var imported from top_20.js in index.html.
// Here, we convert it from a dict of key to value to an array without the
// key, since we don't need it.
district_data = Object.values(top_district_data).concat(Object.values(bottom_district_data)); 

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
    style:"mapbox://styles/patrickvossler/ckcc7fav36ug51iqukp1vt6v8", //albers
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
    if (district_properties.incumbent_lifetime_score &&
        district_properties.oponent_lifetime_score) {
        is_incumbent =
            district_properties.incumbent_lifetime_score >
                district_properties.opponent_lifetime_score;

    } else if (district_properties.incumbent_lifetime_score) {
	   is_incumbent = true;
    }
    // TBD: for deciding action needed, we can compare lifetime scores?

    // only saying which party won, take the first character.
    var prev_winner = district_properties.prev_natl_election_winner;
    if (prev_winner) {
        prev_winner = prev_winner[0];
    }
    var prev_winner_percent = Math.round(district_properties.prev_natl_election_winner_percent * 100,2);
    var prev_election_year = district_properties.prev_natl_election_year;

    var climate_cabinet_ranking = district_properties.climate_cabinet_ranking;
    var climate_cabinet_score = district_properties.climate_cabinet_score;
    
    var reps = '';

    // TODO - add this data to dataset?
    var party = "PARTY";

    // TODO: Candidate Image. Not currently populated, so no we sub in the climate cabinet pic.
    var img_src = "https://uploads-ssl.webflow.com/5f13afc0ce36dff9a4e6a640/5f1424fd860f156c851130d7_ClimCab-Logo.png";
    reps += '<div class="photo-div">' + '<img src="' + img_src + '" alt="" class="image-11"></div>';

    var candidate_name = is_incumbent ? district_properties.incumbent_name : district_properties.opponent_name;

    var district = district_properties.name;
    // Basic Candidate Info
    reps += '<div class="candidate-info">' + 
            '<img src="https://uploads-ssl.webflow.com/5f149275ce02e1caf8d6a2ef/5f3419033a168c32da9db220_22_climate-cabinate-icons-' +
            party + '.png" alt="" class="party-logo">' + 
            '<div class="text-block-5">' + (is_incumbent ? 'Incumbent ' : 'Candidate') + '</div>' +
            '<h5 class="candidate-name">' + candidate_name + '</h5>' + 
            '<div class="text-block-4">' + district + '</div></div>';

    // Climate Cabinet Scores for Candidate
    reps += '<div class="div-block-11"><div class="columns-2 w-row"><div class="w-col w-col-6">' +
            // Climate Cabinet Score
            '<img src="https://uploads-ssl.webflow.com/5f13afc0ce36dff9a4e6a640/5f37f70dc3b70c05d3c1213a_Icons-Score-Grey.png"' +
            ' alt="" class="image-9"><div class="icon-name">Climate Cabinet Score</div><div class="text-block-7">' +
            climate_cabinet_score + '</div></div>' + '<div class="w-col w-col-6">' +
            // Climate Cabinet Ranking
            '<img src="https://uploads-ssl.webflow.com/5f13afc0ce36dff9a4e6a640/5f37f70c17c81a205af52f7b_Icons-Rank-Grey.png"' +
            'alt="" class="image-12"><div class="icon-name">Climate Cabinet Rank</div><div class="text-block-9">' +
            climate_cabinet_ranking + '</div></div></div></div>' + 
            '<div class="div-block-12"><div class="columns-2 w-row"><div class="w-col w-col-6">' +
            // Candidate status
            '<img src="https://uploads-ssl.webflow.com/5f13afc0ce36dff9a4e6a640/5f37f70d39ae744b0fedb7db_Icons-Trump-Status-Grey.png"' +
            ' alt="" class="image-9"><div class="icon-name">Climate Cabinet Score</div><div class="text-block-7">' +
            (is_incumbent ? 'Incumbent ' : 'Candidate') + '</div></div>' + '<div class="w-col w-col-6">' +
            // Previous election results
            '<img src="https://uploads-ssl.webflow.com/5f13afc0ce36dff9a4e6a640/5f37f70ddc915b5cbec8c24f_Icons-Trump-Clinton-Grey.png"' +
            'alt="" class="image-12"><div class="icon-name">Climate Cabinet Rank</div><div class="text-block-9">' +
            prev_winner + '+' + prev_winner_percent + "%"
             '</div></div></div></div>';

    // Voting history.
    // TODO - Voting Info data in js?
    var vote1_text = "";
    var vote2_text = "";
    var vote3_text = "";
    reps +=  '<div class="vote-div"><div class="columns w-row"><div class="column-9 w-col w-col-2 w-col-small-4 w-col-tiny-4">' +
             '<img src="https://uploads-ssl.webflow.com/5f13afc0ce36dff9a4e6a640/5f37f70dde15692d312cf715_Icons-Trump-Vote-Grey.png" alt="" class="image-13">' + 
             '</div><div class="column-7 w-col w-col-6 w-col-small-4 w-col-tiny-4"><div class="text-block-3">' + 
             'Representatives Climate Voting History</div></div><div class="column-8 w-col w-col-4 w-col-small-4 w-col-tiny-4">' + 
             '<a href="https://www.google.com" target="_blank" class="link">Vote Info</a></div></div></div>' +
             '<div data-duration-in="300" data-duration-out="100" class="tabs w-tabs"><div class="tabs-menu w-tab-menu" role="tablist">' + 
             '<a data-w-tab="Tab 1" class="tab-link-tab-1 w-inline-block w-tab-link w--current" id="w-tabs-19-data-w-tab-0"' +
             'href="#w-tabs-19-data-w-pane-0" role="tab" aria-controls="w-tabs-19-data-w-pane-0" aria-selected="true">' + 
             '<div class="text-block-10">Vote 1</div></a><a data-w-tab="Tab 2" class="w-inline-block w-tab-link" tabindex="-1"' +
             'id="w-tabs-19-data-w-tab-1" href="#w-tabs-19-data-w-pane-1" role="tab" aria-controls="w-tabs-19-data-w-pane-1"' +
             'aria-selected="false"><div class="text-block-11">Vote 2</div></a><a data-w-tab="Tab 3" class="tab-link-tab-3 w-inline-block w-tab-link"' + 
             ' tabindex="-1" id="w-tabs-19-data-w-tab-2" href="#w-tabs-19-data-w-pane-2" role="tab" aria-controls="w-tabs-19-data-w-pane-2"' + 
             ' aria-selected="false"><div class="text-block-12">Vote 3</div></a></div><div class="tabs-content w-tab-content">' +
             ' <div data-w-tab="Tab 1" class="tab-pane-tab-1 w-tab-pane w--tab-active" id="w-tabs-19-data-w-pane-0" role="tabpanel"' +
             ' aria-labelledby="w-tabs-19-data-w-tab-0"><p class="paragraph-4">' + vote1_text + '</p>' + 
             '</div><div data-w-tab="Tab 2" class="tab-pane-tab-2 w-tab-pane" id="w-tabs-19-data-w-pane-1" role="tabpanel" ' + 
             'aria-labelledby="w-tabs-19-data-w-tab-1"><p class="paragraph-4">' + vote2_text + '</p>' +
             '</div><div data-w-tab="Tab 3" class="tab-pane-tab-3 w-tab-pane" id="w-tabs-19-data-w-pane-2" role="tabpanel" ' +
             'aria-labelledby="w-tabs-19-data-w-tab-2"><p class="paragraph-4">' + vote3_text + '</p></div></div></div>';

    // Donate Button
    var donate_url = is_incumbent ?
        district_properties.incumbent_donate_url : district_properties.opponent_donate_url;
        console.log(donate_url);
    reps +=  '<div class="container-7 w-container"><div class="div-block-17"><a href="/spotlight-legend" target="_blank"' +
             'class="link-block w-inline-block"><div class="div-block-18">' +
             '<img src="https://uploads-ssl.webflow.com/5f13afc0ce36dff9a4e6a640/5f39d82ead458c7c81426b4e_Icons-Info-Grey.png"' + 
             'alt="" class="image-16"></div></a><a href="' + donate_url + '" class="button-3 w-button">ActBlue</a></div></div>';

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
        response.properties.climate_cabinet_score = district.cc_score;
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
        if (response.geometry == null) {
            console.log("No geometry data for " + candidate_name);
        }
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

    // No data, something is wrong.
    if (geometry.coordinates.length === 0 ) return null;

    if (geometry.coordinates.length === 1) {
       polygon = geometry.coordinates[0];
    } else {
        // HACK - This district is non-contiguous, so
        // just pick a point from it.
        polygon = geometry.coordinates[0][0];
    }
    for (var j = 0; j < polygon.length; j++) {
        longitude = polygon[j][0];
        latitude = polygon[j][1];
        poly_bounds.push([longitude,latitude])
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

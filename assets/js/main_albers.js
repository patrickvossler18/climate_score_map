mapboxgl.accessToken = 
'pk.eyJ1IjoiY2xpbWF0ZWNhYmluZXQiLCJhIjoiY2tkem41a2p3Mmd1NzJ0bXA3ZXc4dDBrdyJ9.MCFylyjbwUw7Sisd5QUhDw';

// District Data comes from a var imported from cc40.js in index.html.
// Here, we convert it from a dict of key to value to an array without the
// key, since we don't need it.
district_data = Object.values(district_data); 

var mapOrigin = {
    zoom: 3.48,
    // lng: -95.5,
    // lat: 38,
};

// got these bounds using map.fitBounds(turf.bbox(us_states_id_albers[0]), {padding: 20});
// var bounds = [
//         [-29.62723161264651, -14.135507266203689],
//         [26.315476155372494,13.760911540652828]
//       ];

var bounds = [
        [-45,-45],[45,45]
      ];


var map = new mapboxgl.Map({
    container: 'map',
    // style: 'mapbox://styles/patrickvossler/ckc0ydvhi5h3v1iodhe5rgsjg', // mercator
    style:"mapbox://styles/climatecabinet/cke05bgqr13cv19nxjurapvsc", //albers
    zoom: mapOrigin.zoom,
    attributionControl: false,
    maxBounds: bounds, // prevents users from panning and zooming outside of bounding box
    maxZoom: 13 // prevent users from zooming really far into the map

});

// Adds an event listener that will fit the map to a bounding box of the states
var bbox_usa_albers = turf.bbox(us_states_id_albers[0]);
window.addEventListener('resize', function(event){
    map.fitBounds(bbox_usa_albers, {padding: 20});
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
var hoveredDistrictId;
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

    // Convenience vars.
    // TODO - some of these are based on strings. Instead, we should just represent them as bools.

    // TODO - the candidate we care about is always the incumbent - even if they are actually the
    // challenger.
    var is_incumbent = (district_properties.incumbent_or_challenger == "Incumbent");
    var prev_winner_percent = district_properties.presidential_win_rate;
    var climate_cabinet_ranking = district_properties.climate_cabinet_ranking;
    var climate_cabinet_score = district_properties.climate_cabinet_score;
    var party = district_properties.party;

    var icon =  "https://uploads-ssl.webflow.com/5f149275ce02e1caf8d6a2ef/5f3419033a168c32da9db220_22_climate-cabinate-icons-democrat.png";
    if (party == "R") {
        icon = "https://uploads-ssl.webflow.com/5f149275ce02e1caf8d6a2ef/5f3419068cfd7dd95bdf9037_22_climate-cabinate-icons-republican.png";
    }

    var vote_info_link = district_properties.vote_info_link;
    var district = district_properties.state_id;
    var candidate_name = is_incumbent ? district_properties.incumbent_name : district_properties.opponent_name;
    var donate_url = is_incumbent ? district_properties.incumbent_donate_url : district_properties.opponent_donate_url;

    // This is currently fixed - all races are  tossups.
    var race_status = "Tossup";
    
    var reps = '';


    // TODO: Candidate Image. Not currently populated, so for now we sub in a generic pic.
    var img_src = "https://uploads-ssl.webflow.com/5f149275ce02e1caf8d6a2ef/5f3419033a168c57f59db21f_22_twitter-avi-gender-balanced-figure.png";
    reps += '<div class="photo-div">' + '<img src="' + img_src + '" alt="" class="image-11"></div>';

    // Basic Candidate Info
    reps+= '<div class="w-container">'+
                '<div class="div-block-26">' +
                    '<img src="' + icon + '" alt="" class="party-logo">' +
                    '<h5 class="candidate-name">'+ candidate_name +'</h5>'+
                '</div>'+
            '</div>';

    reps += '<div class="candidate-info">' + 
                '<div class="text-block-5">' + district_properties.incumbent_or_challenger + '</div>' +
                '<div class="text-block-4">' + district + '</div>'+
            '</div>';

    // Climate Cabinet Scores for Candidate
    reps += '<div class="div-block-11">'+
                '<div class="columns-2 w-row">'+
                    '<div class="column-10 w-col w-col-6 w-col-small-6 w-col-tiny-6">'+
                        '<img src="https://uploads-ssl.webflow.com/5f13afc0ce36dff9a4e6a640/5f37f70dc3b70c05d3c1213a_Icons-Score-Grey.png" alt="" class="image-9">' +
                        '<div class="icon-name">Climate Cabinet Score</div>'
                        +'<div class="text-block-7">'+climate_cabinet_score +'</div>'+
                    '</div>'+
                    '<div class="column-11 w-col w-col-6 w-col-small-6 w-col-tiny-6">'+
                        '<img src="https://uploads-ssl.webflow.com/5f13afc0ce36dff9a4e6a640/5f37f70c17c81a205af52f7b_Icons-Rank-Grey.png" alt="" class="image-12">' +
                        '<div class="icon-name">Climate Cabinet Rank</div>'+
                        '<div class="text-block-9">'+ climate_cabinet_ranking + '</div>' +
                    '</div>'+
                '</div>'+
            '</div>'+

            '<div class="div-block-12">'+
                '<div class="columns-2-copy w-row">'+

                    '<div class="column-13 w-col w-col-6 w-col-small-6 w-col-tiny-6">'+
                        // Candidate status
                        '<img src="https://uploads-ssl.webflow.com/5f13afc0ce36dff9a4e6a640/5f3e7da3f6fa9c58668f582f_Icons-Race-Status-Grey.png"'+
                        ' alt="" class="image-9">'+
                        '<div class="icon-name">Race Status</div>'+
                        '<div class="text-block-7">' + race_status + '</div>' +
                    '</div>' +
                    '<div class="column-12 w-col w-col-6 w-col-small-6 w-col-tiny-6">'+
                        '<img src="https://uploads-ssl.webflow.com/5f13afc0ce36dff9a4e6a640/5f3e7da33bebdb1cd05a16fb_Icons-Trump-Clinton-Grey.png"'+
                        ' alt="" class="image-12">'+
                        '<div class="icon-name">Trump/Clinton Win Rate</div>'+
                    '<div class="text-block-9">'+ prev_winner_percent + '%' + '</div>'+
                    '</div>' +
                '</div>' +
            '</div>';

            // '<div class="vote-div">'+
            //     '<div class="columns w-row">'+
            //         '<div class="column-9 w-col w-col-2 w-col-small-4 w-col-tiny-4">'+
            //             '<img src="https://uploads-ssl.webflow.com/5f13afc0ce36dff9a4e6a640/5f3e7da30838ff14bd63af97_Icons-Vote-Grey.png" alt="" class="image-13">'+
            //         '</div>'+
            //         '<div class="column-7 w-col w-col-6 w-col-small-4 w-col-tiny-4">'+
            //             '<div class="text-block-3">Representative\'s Climate Related Voting History</div>'+
            //         '</div>'+
            //         '<div class="column-8 w-col w-col-4 w-col-small-4 w-col-tiny-4">'+
            //             '<a href="https://www.sierraclub.org/sites/www.sierraclub.org/files/sce/iowa-chapter/political/2019-2020Scorecard.pdf" target="_blank" class="link">Vote Info</a></div></div></div>'


    // TODO - fix whatever is causing this to be a string instead of an array and undo this hack.
    var spotlight_votes = district_properties.spotlight_votes.split("\",\"");
    var vote1_text = spotlight_votes[0].substring(2);
    var vote2_text = spotlight_votes[1].substring(0, spotlight_votes[1].length - 2);

     reps += '<div class="vote-div">'+
                    '<img src="https://uploads-ssl.webflow.com/5f13afc0ce36dff9a4e6a640/5f3e7da30838ff14bd63af97_Icons-Vote-Grey.png" alt="" class="image-13">' + 
                    '<div class="vote-text">Representative\'s Climate Related Voting History</div>' + 
                    '<a href="' + vote_info_link + '" target="_blank" class="link">Vote Info</a>'+
                    '</div>'+
                '</div>'+
             '</div>' +

             '<div data-duration-in="300" data-duration-out="100" class="tabs w-tabs">'+ 
                '<div class="tabs-menu w-tab-menu" role="tablist">' +
                    '<a data-w-tab="Tab 1" class="tab-link-tab-1 w-inline-block w-tab-link w--current" id="w-tabs-0-data-w-tab-0" href="#w-tabs-0-data-w-pane-0" role="tab" aria-controls="w-tabs-0-data-w-pane-0" aria-selected="true">'+
                        '<div class="text-block-10">Vote 1</div>'+
                    '</a>'+
                    '<a data-w-tab="Tab 2" class="tab-link-tab-2 w-inline-block w-tab-link" tabindex="-1" id="w-tabs-0-data-w-tab-1" href="#w-tabs-0-data-w-pane-1" role="tab" aria-controls="w-tabs-0-data-w-pane-1" aria-selected="false">'+
                        '<div class="text-block-11">Vote 2</div>'+
                    '</a>'+
                '</div>' +
                '<div class="tabs-content w-tab-content">'+
                    '<div data-w-tab="Tab 1" class="tab-pane-tab-1 w-tab-pane w--tab-active" id="w-tabs-0-data-w-pane-0" role="tabpanel" aria-labelledby="w-tabs-0-data-w-tab-0">'+
                        '<p class="paragraph-4">'+ vote1_text + '</p>'+
                    '</div>'+
                
                    '<div data-w-tab="Tab 2" class="tab-pane-tab-2 w-tab-pane" id="w-tabs-0-data-w-pane-1" role="tabpanel" aria-labelledby="w-tabs-0-data-w-tab-1">'+
                        '<p class="paragraph-4">' + vote2_text +'</p>' +
                    '</div>' +
                '</div>' +
            '</div>';

    // Donate Button
    reps += '<div class="div-block-17">'+
                '<a href="/spotlight-legend" target="_blank" class="link-block w-inline-block">'+
                    '<div class="div-block-18">'+
                        '<img src="https://uploads-ssl.webflow.com/5f13afc0ce36dff9a4e6a640/5f39d82ead458c7c81426b4e_Icons-Info-Grey.png" alt="" class="image-16">'+
                    '</div>'+
                '</a>'+
                '<a href="'+ donate_url +'" class="button-3 w-button">ActBlue</a>'+
            '</div>';
   
    // Override all inner html of the popup.
    popup.innerHTML = reps;

    hoveredStateId = e.features[0].id;
    map.setFeatureState(
        { source: 'state_districts_pts', id: hoveredStateId },
        { hover: true }
    );
};

const getDistrictCentroid = function(district, albers=false){
    //   TODO - make this function just a straight passthrough of properties.
    return district['shapes'].map(function(shape,i){
        var response = {};
        response.type = "Feature";
        response.id = parseInt(district['geoid']); // doing this to avoid 0 == false in Javascript
        response.properties = {};
        response.properties.state = district.state_abbr;
        response.properties.state_id = district.state_id;
        response.properties.district_code = district.district_code;
        response.properties.name = district.name;
        response.properties.which_house = district.ccid.indexOf("L") > -1 ? "lower" : "upper";
        response.properties.climate_cabinet_ranking = district.cc_ranking;
        response.properties.climate_cabinet_score = district.cc_score;
        response.properties.presidential_win_rate = district.presidential_win_rate;
        response.properties.party = district.party;
        response.properties.vote_info_link = district.vote_info_link;
        response.properties.incumbent_or_challenger = district.incumbent_or_challenger;
        response.properties.spotlight_votes = district.spotlight_votes;
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
            response.properties.incumbent_votes = incumbent.votes;
        } 
        if (district.opponent) {
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
                0.5
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
                'fill-opacity': [
                    'case', ['boolean', ['feature-state', 'hover'], false], 1, 0.85
                ]
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
                'line-width': 1

                // [
                //     'case',
                //     ['boolean', ['feature-state', 'hover'], false],
                //     3,
                //     1
                // ],
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
    // move the state-points layer to the top so we don't hide the state abbreviations
    // this ugly one-liner moves 'state-points', which are our abbreviations to the top of our stack of layers
    map.moveLayer('state-points', map.getStyle().layers.slice(-1)[0]);
});

mapboxgl.accessToken = 
'pk.eyJ1IjoicGF0cmlja3Zvc3NsZXIiLCJhIjoiY2tjMHd0eTFrMHphMjJybG0yOTU1dDEzZyJ9.FsIqtdsHIru8Ay_0zmZYHw';


var mapOrigin = {
    zoom: 3.48,
    // lng: -95.5,
    // lat: 38,
};

var map = new mapboxgl.Map({
    container: 'map',
    // style: 'mapbox://styles/patrickvossler/ckc0ydvhi5h3v1iodhe5rgsjg', // mercator
    style:"mapbox://styles/patrickvossler/ckcc7fav36ug51iqukp1vt6v8", //albers
    zoom: mapOrigin.zoom,
});

map.dragRotate.disable();
map.touchZoomRotate.disableRotation();

var url = new URL(window.location.href);
var embed = url.searchParams.get('embed');
if (embed === 'true') {
    document.getElementsByTagName('body')[0].classList.add('embed');
    map.resize();
}

var $buttonDots = document.getElementById('button-dots');
var $buttonPolygons = document.getElementById('button-polygon');
var $buttonHouse = document.getElementById('button-house');
var $buttonSenate = document.getElementById('button-senate');

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


function getColorByParty(party) {
    if (['Democrat', 'Democratic-Farmer-Labor', 'Democrat/Progressive'].includes(party))
        return colorDemocrat;
    else if (['Republican'].includes(party)) return colorRepublican;
    else return colorOther;
}

function politicalColors() {
    return [
        'match',
        ['get', 'political_color'],
        '1',
        colorDemocrat,
        '2',
        colorRepublican,
        '3',
        colorMixed,
        colorOther,
    ];
}

var popup = new mapboxgl.Popup({
    closeButton: true,
    closeOnClick: true,
    // anchor: 'top-left',
});

function loadDots() {
    styleMode = 'dots';
    map
    // .setPaintProperty('district-polygons-fill', 'fill-opacity', 0)
    //     .setPaintProperty('district-polygons-line', 'line-opacity', lineOpacity)
    //     .setLayoutProperty('district-polygons-line', 'visibility', 'visible')
        .setLayoutProperty('district-points', 'visibility', 'visible')
    // $buttonDots.classList.add('selected');
    // $buttonPolygons.classList.remove('selected');
}

function loadPolygons() {
    styleMode = 'polygons';
    map
    // .setPaintProperty('district-polygons-fill', 'fill-opacity', 0.6)
    //     .setPaintProperty('district-polygons-line', 'line-opacity', 0.2)
        .setLayoutProperty('us-states-line', 'visibility', 'visible')
        .setLayoutProperty('district-points', 'visibility', 'none')
    $buttonPolygons.classList.add('selected');
    $buttonDots.classList.remove('selected');
}

function loadLowerHouse() {
    $buttonHouse.classList.add('selected');
    $buttonSenate.classList.remove('selected');
    houseName = 'lower';
    loadMap();
    // if (map.getZoom() > zoomThreshold) {
   
        // map.setLayoutProperty('us-states-fill', 'visibility', 'none')
        // map.setLayoutProperty('district-polygons-fill', 'visibility', 'visible')
        // map.setLayoutProperty('district-polygons-line', 'visibility', 'visible')
        
        map.setLayoutProperty('us-states-fill', 'visibility', 'visible')
           .setLayoutProperty('district-points', 'visibility', 'visible')
        // map.setLayoutProperty('district-polygons-fill', 'visibility', 'none')
        // map.setLayoutProperty('district-polygons-line', 'visibility', 'none')
    //     .setLayoutProperty('district-points', 'visibility', 'none')
        
    // }
}

function loadUpperHouse() {
    $buttonSenate.classList.add('selected');
    $buttonHouse.classList.remove('selected');
    houseName = 'upper';
    loadMap();
    map.setLayoutProperty('us-states-fill', 'visibility', 'visible')
        .setLayoutProperty('district-points', 'visibility', 'visible')
    // if (map.getZoom() > zoomThreshold) {
    //     map.setLayoutProperty('us-states-fill', 'visibility', 'none')
    //     map.setLayoutProperty('district-polygons-fill', 'visibility', 'visible')
    //     map.setLayoutProperty('district-polygons-line', 'visibility', 'visible')
    //     .setLayoutProperty('district-points', 'visibility', 'visible')
    // } else {
    //     map.setLayoutProperty('us-states-fill', 'visibility', 'visible')
    //     map.setLayoutProperty('district-polygons-fill', 'visibility', 'none')
    //     map.setLayoutProperty('district-polygons-line', 'visibility', 'none')
    //     .setLayoutProperty('district-points', 'visibility', 'none')
        
    // }
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
    // map.getCanvas().style.cursor = '';
    if (hoveredStateId) {
        map.setFeatureState(
            { source: 'state_districts_pts', id: hoveredStateId },
            { hover: false }
        );
    }
    hoveredStateId = null;
};

const onDistrictClick = function(e) {
    if (e.features.length > 0) {
        console.log(e.features[0].properties)
        map.getCanvas().style.cursor = 'pointer';
        map.setFeatureState(
            { source: 'state_districts_pts', id: hoveredStateId },
            { hover: false }
        );
        var district_properties = e.features[0].properties;
        var state = district_properties.state;
        var district = district_properties.district_code;
        var incumbent_name = district_properties.incumbent_name;
      
        // TODO - Fill in real data here once we have it.
        var climate_cabinet_ranking = "3";
        
        // TBD: for deciding action needed, we can compare lifetime scores?
        var action_needed = district_properties.incumbent_lifetime_score < district_properties.opponent_lifetime_score ? "Flip the seat": "Hold the seat";
        var donate_url = district_properties.incumbent_lifetime_score < district_properties.opponent_lifetime_score ? district_properties.opponent_donate_url : district_properties.incumbent_donate_url;
        // TBD: do we have data on local election results?
        var race_label = "\"tossup\"";
        // only saying which party won
        var prev_winner = district_properties.prev_natl_election_winner;
        var prev_winner_percent = Math.round(district_properties.prev_natl_election_winner_percent * 100,2);
        var prev_election_year = district_properties.prev_natl_election_year;
        // we have this in the mock data but not clear how to display this.
        var key_votes = "[Examples of key climate votes]";
        var donation_name = district_properties.incumbent_lifetime_score < district_properties.opponent_lifetime_score ? district_properties.opponent_name : district_properties.incumbent_name;
        var donate_link = "<a href = " + donate_url + "> Donate to " + donation_name + " here.</a>";


        // This part can (should) be styled differently
        var reps = '';


        reps += '<h2>' + incumbent_name + '</h2>';
        reps += '<h3>Climate Cabinet Ranking: #' + climate_cabinet_ranking + ' </h3>';
        reps += '<h3>Action Needed: ' + action_needed + ' -- ' + donate_link + ' </h3>';
        reps += '<br><h3>This race is a ' + race_label + '. ' + prev_winner + ' won it by ' + prev_winner_percent + '% in ' + prev_election_year+'. </h3>'; 
        reps += '<br><h3> ' + incumbent_name + ' has voted ' + key_votes + '.';
        var description =
            '<h1>' + state + '-' + district + '</h1><div class="reps">' + reps + '</div>';
        popup
            .setLngLat(e.lngLat)
            .setHTML(description)
            .addTo(map);
        hoveredStateId = e.features[0].id;
        map.setFeatureState(
            { source: 'state_districts_pts', id: hoveredStateId },
            { hover: true }
        );
    }
};

const getDistrictShapes = function(district, albers=false) {
    // TODO: Handle upper and lower legislatures
    // TODO: Select shape based on year
   return district['shapes'].map(function(shape,i){
        return({
                "type" : "Feature",
                "id": i + 1, // doing this to avoid 0 == false in Javascript
                "properties": {
                    "state": district['state_abbr'],
                    "district_code": district['district_code'],
                    "which_house" : district['ccid'].indexOf("L") > -1 ? "lower" : "upper",
                    // incumbent info
                    "incumbent_name": district['incumbent']['name'],
                    "incumbent_donate_url": district['incumbent']['donation_link'],
                    "incumbent_lifetime_score": district['incumbent']['lifetime_score'],
                    // opponent_info
                    "opponent_name": district["opponent"]['name'],
                    "opponent_donate_url": district["opponent"]['donation_link'],
                    "opponent_lifetime_score": district["opponent"]['lifetime_score'],
                    "climate_cabinet_ranking": district['cc_ranking'],
                    // election info (assuming most recent national election first in the array)
                    "prev_natl_election_winner": (district.elections[0]["dem_prop"] > district.elections[0]["rep_prop"]) ? "Democrats" : "Republicans",
                    "prev_natl_election_winner_percent": Math.abs(district.elections[0]["dem_prop"] - district.elections[0]["rep_prop"]),
                    "prev_natl_election_year": district.elections[0]['year']
                },
                "geometry" : (albers ? projectToAlbersUsa(shape['geometry']) : shape['geometry'])
            })
        })
};

const getDistrictCentroid = function(district, albers=false){
    // TODO: Handle upper and lower legislatures
    // TODO: Select shape based on year. Currently assuming we only have one shape in the array
    return district['shapes'].map(function(shape,i){
        return({
                "type" : "Feature",
                "id": i + 1, // doing this to avoid 0 == false in Javascript
                "properties": {
                    "state": district['state_abbr'],
                    "district_code": district['district_code'],
                    "which_house" : district['ccid'].indexOf("L") > -1 ? "lower" : "upper",
                    // incumbent info
                    "incumbent_name": district['incumbent']['name'],
                    "incumbent_donate_url": district['incumbent']['donation_link'],
                    "incumbent_lifetime_score": district['incumbent']['lifetime_score'],
                    // opponent_info
                    "opponent_name": district["opponent"]['name'],
                    "opponent_donate_url": district["opponent"]['donation_link'],
                    "opponent_lifetime_score": district["opponent"]['lifetime_score'],
                    "climate_cabinet_ranking": district['cc_ranking'],
                    // election info (assuming most recent national election first in the array)
                    "prev_natl_election_winner": (district.elections[0]["dem_prop"] > district.elections[0]["rep_prop"]) ? "Democrats" : "Republicans",
                    "prev_natl_election_winner_percent": (district.elections[0]["dem_prop"] > district.elections[0]["rep_prop"]) ? district.elections[0]["dem_prop"] : district.elections[0]["rep_prop"],
                    "prev_natl_election_year": district.elections[0]['year']
                },
                "geometry" : (albers ? getCentroid(projectToAlbersUsa(shape['geometry'])) : getCentroid(shape['geometry']))
            })
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

// map.on('zoom', function() {
//     if (map.getZoom() > zoomThreshold) {
//         // If the user is zoomed in past our threshold, show the individual districts
//         map.setLayoutProperty('us-states-fill', 'visibility', 'none')
//         map.setLayoutProperty('district-polygons-fill', 'visibility', 'visible')
//         map.setLayoutProperty('district-polygons-line', 'visibility', 'visible')
//         map.setLayoutProperty('district-points', 'visibility', 'visible')
//     } else {
//         map.setLayoutProperty('us-states-fill', 'visibility', 'visible')
//         map.setLayoutProperty('district-polygons-fill', 'visibility', 'none')
//         map.setLayoutProperty('district-polygons-line', 'visibility', 'none')
//         map.setLayoutProperty('district-points', 'visibility', 'none')
//         onMouseLeaveDistrict();
        
//     }
// });




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
        // when user clicks the state, zoom in to show the state
        popup.setLngLat({ lng: 0, lat: 0 });
        


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
                0.4
                ],
                // 'circle-opacity': 0.9,
                'circle-color': colorDemocrat,
                'circle-radius': ['interpolate', ['linear'], ['zoom'],
                    // When zoom is x, circle radius will be y
                    // x,y
                    5, 8,
                    10, 16
                ],
                // 'circle-radius': 20,
                'circle-stroke-color': colorDemocrat,
                'circle-stroke-width': 0.5,
                'circle-stroke-opacity': 1
                
            },
            layout: {
                visibility: styleMode === 'polygons' ? 'none' : 'visible',
            },
            'filter' : ['==', 'which_house', houseName]
        }
    );

    // map.setFilter('district-points', 
    //     ['match',
    //     ['get', 'which_house'], 
    //     district_data.map(district => district.state_abbr),
    //     true,
    //     false 
    // ])

};

map.on('load', function() {
    map.addSource('us-states', {
        type: 'geojson',
        // data: '/data/us-states-id.json',
        data: us_states_id_albers
    });

    

    map.addLayer(
        {
            id: 'us-states-fill',
            type: 'fill',
            source: 'us-states',
            paint: {
                'fill-color': '#627BC1',
                'fill-opacity': 0
                // [
                // 'case',
                // ['boolean', ['feature-state', 'hover'], false],
                // 1,
                // 0.5
                // ]
            },
        },
    );
    map.setFilter('us-states-fill', 
        ['match',
        ['get', 'abbr'], 
        // remove duplicate states if we have multiple races of interest in the same state
        [... new Set(district_data.map(district => district.state_abbr))], 
        true,
        false 
    ])
    map.addLayer(
        {
            id: 'us-states-line',
            type: 'line',
            source: 'us-states',
            paint: {
                'line-color': '#000',
                'line-opacity': 0.9,
                // 'line-width': ['interpolate', ['linear'], ['zoom'], 0, 1, 4, 2, 6, 4, 8, 6],
                'line-width': [
                    'case',
                    ['boolean', ['feature-state', 'hover'], false],
                    3,
                    1
                ],
            },
        },
    );

    map.setFilter('us-states-fill', 
        ['match',
        ['get', 'abbr'], 
        // remove duplicate states if we have multiple races of interest in the same state
        [... new Set(district_data.map(district => district.state_abbr))], 
        true,
        false 
    ])

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

    map.addSource('state_districts',{
        type: 'geojson',
        data: {
                'type': 'FeatureCollection',
                'features': flattenDistrictDataIntoGeoJSON(district_data.map(district => getDistrictShapes(district, true)))
            }
    });


    map.addSource('state_districts_pts',{
        type: 'geojson',
        data: {
                'type': 'FeatureCollection',
                'features': flattenDistrictDataIntoGeoJSON(district_data.map(district => getDistrictCentroid(district, true)))
            }
    });

    loadMap();
    // loadPolygons();
    loadDots();
    // show lower house by default
    loadLowerHouse();

    // when we first load the map, make sure only the states are visible, not the districts
    map.setLayoutProperty('us-states-fill', 'visibility', 'visible')
    map.setLayoutProperty('us-states-line', 'visibility', 'visible')
    map.setLayoutProperty('district-polygons-fill', 'visibility', 'none')
    map.setLayoutProperty('district-polygons-line', 'visibility', 'none')
});

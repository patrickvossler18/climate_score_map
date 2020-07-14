mapboxgl.accessToken = 
'pk.eyJ1IjoicGF0cmlja3Zvc3NsZXIiLCJhIjoiY2tjMHd0eTFrMHphMjJybG0yOTU1dDEzZyJ9.FsIqtdsHIru8Ay_0zmZYHw';


var mapOrigin = {
    zoom: 3.48,
    // lng: -95.5,
    // lat: 38,
};

var map = new mapboxgl.Map({
    container: 'map',
    // style: 'mapbox://styles/patrickvossler/ckc0ydvhi5h3v1iodhe5rgsjg',
    // style: 'mapbox://styles/patrickvossler/ckcc7fav36ug51iqukp1vt6v8',
    style:"mapbox://styles/patrickvossler/ckcc7fav36ug51iqukp1vt6v8",
    zoom: mapOrigin.zoom,
    // center: [mapOrigin.lng, mapOrigin.lat],
    // maxZoom: 8
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
var layerName = 'state_lower';
var layerAbbr = 'sl';
var styleMode = 'polygons';
var zoomThreshold = 4;


function getColorByParty(party) {
    if (['Democrat', 'Democratic-Farmer-Labor', 'Democrat/Progressive'].includes(party))
        return colorDemocrat;
    else if (['Republican'].includes(party)) return colorRepublican;
    else return colorOther;
}

function politicalColors() {
    return [
        'match',
        // ['get', layerAbbr + '_color'],
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
    closeOnClick: false,
    anchor: 'top-left',
});

function loadDots() {
    styleMode = 'dots';
    map.setPaintProperty('district-polygons-fill', 'fill-opacity', 0)
        .setPaintProperty('district-polygons-line', 'line-opacity', lineOpacity)
        .setLayoutProperty('district-polygons-line', 'visibility', 'visible')
        .setLayoutProperty('district-points', 'visibility', 'visible')
        // .setLayoutProperty('us-states-line', 'visibility', 'none');
    $buttonDots.classList.add('selected');
    $buttonPolygons.classList.remove('selected');
}

function loadPolygons() {
    styleMode = 'polygons';
    map.setPaintProperty('district-polygons-fill', 'fill-opacity', 0.6)
        .setPaintProperty('district-polygons-line', 'line-opacity', 0.2)
        .setLayoutProperty('us-states-line', 'visibility', 'visible')
        .setLayoutProperty('district-points', 'visibility', 'none')
    $buttonPolygons.classList.add('selected');
    $buttonDots.classList.remove('selected');
}

function loadLowerHouse() {
    $buttonHouse.classList.add('selected');
    $buttonSenate.classList.remove('selected');
    layerName = 'state_lower';
    layerAbbr = 'sl';
    loadMap();
    if (map.getZoom() > zoomThreshold) {
        map.setLayoutProperty('us-states-fill', 'visibility', 'none')
        map.setLayoutProperty('district-polygons-fill', 'visibility', 'visible')
        map.setLayoutProperty('district-polygons-line', 'visibility', 'visible')
        .setLayoutProperty('district-points', 'visibility', 'visible')
    } else {
        map.setLayoutProperty('us-states-fill', 'visibility', 'visible')
        map.setLayoutProperty('district-polygons-fill', 'visibility', 'none')
        map.setLayoutProperty('district-polygons-line', 'visibility', 'none')
        .setLayoutProperty('district-points', 'visibility', 'none')
        
    }
}

function loadUpperHouse() {
    $buttonSenate.classList.add('selected');
    $buttonHouse.classList.remove('selected');
    layerName = 'state_upper';
    layerAbbr = 'su';
    loadMap();
    if (map.getZoom() > zoomThreshold) {
        map.setLayoutProperty('us-states-fill', 'visibility', 'none')
        map.setLayoutProperty('district-polygons-fill', 'visibility', 'visible')
        map.setLayoutProperty('district-polygons-line', 'visibility', 'visible')
        .setLayoutProperty('district-points', 'visibility', 'visible')
    } else {
        map.setLayoutProperty('us-states-fill', 'visibility', 'visible')
        map.setLayoutProperty('district-polygons-fill', 'visibility', 'none')
        map.setLayoutProperty('district-polygons-line', 'visibility', 'none')
        .setLayoutProperty('district-points', 'visibility', 'none')
        
    }
}

// When viewing at state level
const onMouseMoveState = function(e){
    if (e.features.length > 0) {
        if (hoveredStateFillId) {

            map.setFeatureState(
                { source: 'us-states', id: hoveredStateFillId },
                { hover: false }
            );
            // also remove hover on Maine as well because for some reason it is not removing hover
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
        // also remove hover on Maine as well because for some reason it is not removing hover
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
                { source: 'district_'+layerName+ '_polygons', sourceLayer: layerName + '_polygons', id: hoveredStateId },
                { hover: false }
            );
        }
        hoveredStateId = e.features[0].id;
        map.setFeatureState(
            { source: 'district_'+layerName+ '_polygons', sourceLayer: layerName + '_polygons', id: hoveredStateId },
            { hover: true }
        );
    }
};

// When viewing at district level
const onMouseLeaveDistrict = function() {
    map.getCanvas().style.cursor = '';
    if (hoveredStateId) {
        map.setFeatureState(
            { source: 'district_'+layerName+ '_polygons', sourceLayer: layerName + '_polygons', id: hoveredStateId },
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
            { source: 'district_'+layerName+ '_polygons', sourceLayer: layerName + '_polygons', id: hoveredStateId },
            { hover: false }
        );
        var party = e.features[0].properties['party']; // is this in our mock data? It is in our mapbox data if needed
        var state = e.features[0].properties.STATE;
        var district = e.features[0].properties.DISTRICT_I;


        var geoId = e.features[0].properties.GEOID

        // The following code assumes we have a json object called district_data with, well, district info
        var matching_district = district_data.find(district => district.geoid === geoId);

        var reps = '';

        if (matching_district !== undefined) {
            reps += '<h2>' + matching_district.incumbent.name + '</h2><h3 style="display: ';
            reps += party === undefined ? 'none' : 'block';
            reps +=
                '"><div class="party-color" style="background: ' +
                getColorByParty(party) +
                '"></div>' +
                party +
                '</h3>';
        }

        
        var description =
            '<h1>' + state + '-' + district + '</h1><div class="reps">' + reps + '</div>';
        popup
            .setLngLat(e.lngLat)
            .setHTML(description)
            .addTo(map);
        hoveredStateId = e.features[0].id;
        map.setFeatureState(
            { source: 'district_'+layerName+ '_polygons', sourceLayer: layerName + '_polygons', id: hoveredStateId },
            { hover: true }
        );
    }
};

map.on('zoom', function() {
    if (map.getZoom() > zoomThreshold) {
        // If the user is zoomed in past our threshold, show the individual districts
        map.setLayoutProperty('us-states-fill', 'visibility', 'none')
        map.setLayoutProperty('district-polygons-fill', 'visibility', 'visible')
        map.setLayoutProperty('district-polygons-line', 'visibility', 'visible')
        map.setLayoutProperty('district-points', 'visibility', 'visible')
    } else {
        map.setLayoutProperty('us-states-fill', 'visibility', 'visible')
        map.setLayoutProperty('district-polygons-fill', 'visibility', 'none')
        map.setLayoutProperty('district-polygons-line', 'visibility', 'none')
        map.setLayoutProperty('district-points', 'visibility', 'none')
        onMouseLeaveDistrict();
        
    }
});


const loadMap = function() {
    map.on('mousemove', 'district-polygons-fill', function(e) {
        onMouseMoveDistrict(e);
    });

    map.on('mouseleave', 'district-polygons-fill', function() {
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
        function getPolygonBoundingBox(feature) {
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


        var bounds = getPolygonBoundingBox(e.features[0]);
        map.fitBounds(bounds, {
            padding: 20
        });

        

        // loadPolygons();
    });

    map.on('click', 'district-polygons-fill', function(e){
        onDistrictClick(e);
    })


    if (map.getLayer('district-polygons-fill')) {
        map.removeLayer('district-polygons-fill');
    }

    map.addLayer(
        {
            id: 'district-polygons-fill',
            type: 'fill',
            source: 'district_'+layerName + '_polygons',
            'source-layer': layerName + '_polygons',
            paint: {
                'fill-color': politicalColors(),
                'fill-opacity': styleMode === 'polygons' ? 0.6 : 0,
            },
            // 'filter': ['in', '$type', ['literal', ['Polygon', 'MultiPolygon']]]
            'filter': ['==', '$type', 'Polygon']
        },

    );

    // These filters can probably be combined...
    map.setFilter('district-polygons-fill', 
        ['match',
            ['get', 'GEOID'],
            district_data.map(district => district.geoid),
            true,
            false 
        ]
    );
    // map.setFilter('district-polygons-fill', 
    //     ["all",
    //         ["in", "$type", 'Polygon']
    //     ]
        
        
    // );

    if (map.getLayer('district-polygons-line')) {
        map.removeLayer('district-polygons-line');
    }

    map.addLayer(
        {
            id: 'district-polygons-line',
            type: 'line',
            source: 'district_'+layerName + '_polygons',
            'source-layer': layerName + '_polygons',
            paint: {
                'line-color': '#000',
                'line-opacity': styleMode === 'polygons' ? 0.2 : lineOpacity,
                'line-width': 1,
            },
            // 'filter': ['in', '$type', ['literal', ['Polygon', 'MultiPolygon']]]
            'filter': ['==', '$type', 'Polygon']
        },
    );
    map.setFilter('district-polygons-line', 
        ['match',
            ['get', 'GEOID'],
            district_data.map(district => district.geoid),
            true,
            false 
        ]
    );

    if (map.getLayer('district-polygons-highlight')) {
        map.removeLayer('district-polygons-highlight');
    }

    map.addLayer(
        {
            id: 'district-polygons-highlight',
            type: 'line',
            source: 'district_'+layerName + '_polygons',
            'source-layer': layerName + '_polygons',
            paint: {
                'line-color': '#000',
                'line-opacity': ['case', ['boolean', ['feature-state', 'hover'], false], 0.9, 0],
                'line-width': 2,
            },
            'filter': ['==', '$type', 'Polygon']
        },
    );



    if (map.getLayer('district-points')) {
        map.removeLayer('district-points');
    }

    map.addLayer(
        {
            id: 'district-points',
            type: 'circle',
            source: 'district_'+layerName + '_points',
            // mapbox auto-generated this source-layer name
            // 'source-layer': 'lower_data_combined_pts_albers',
            // 'source-layer': layerName + '_polygons',
            'source-layer': layerName + '_points',
            paint: {
                'circle-opacity': circleOpacity,
                // 'circle-opacity': 0.9,
                'circle-color': politicalColors(),
                'circle-radius': ['interpolate', ['linear'], ['zoom'], 0, 4, 4, 6, 6, 8, 8, 12],
                // 'circle-radius': 20,
                'circle-stroke-color': politicalColors(),
                'circle-stroke-width': 0.5,
                'circle-stroke-opacity': 1,
            },
            layout: {
                visibility: styleMode === 'polygons' ? 'none' : 'visible',
            },
            'filter' : ['==', '$type', 'Point']
        }
    );
    map.setFilter('district-points',
        ['all',
            ['match',
                ['get', 'GEOID'],
                district_data.map(district => district.geoid),
                true,
                false 
            ],

        ] 
    );

};

map.on('load', function() {
    map.addSource('us-states', {
        type: 'geojson',
        // data: '/data/us-states-id.json',
        data: '/data/us-states-id_albers.json'
    });

    

    map.addLayer(
        {
            id: 'us-states-fill',
            type: 'fill',
            source: 'us-states',
            paint: {
                'fill-color': '#627BC1',
                'fill-opacity': [
                'case',
                ['boolean', ['feature-state', 'hover'], false],
                1,
                0.5
                ]
            },
        },
    );
    map.setFilter('us-states-fill', 
        ['match',
        ['get', 'abbr'], 
        district_data.map(district => district.state_abbr),
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
                'line-width': ['interpolate', ['linear'], ['zoom'], 0, 1, 4, 2, 6, 4, 8, 6],
            },
        },
    );
    

    map.addSource('district_state_upper_polygons', {
        // upper data
        type: 'vector',
        url: 'mapbox://patrickvossler.ddtirtni' // albers without points
    });
    map.addSource('district_state_lower_polygons', {
        // lower data
        type: 'vector',
        url: 'mapbox://patrickvossler.a41nsixd' // albers without points

    });

    map.addSource('district_state_upper_points', {
        // upper data
        type: 'vector',
        // url: 'mapbox://patrickvossler.ckcdz6t480ew52fqgqyjocpx8-25z6t' // from uploading as dataset to mapbox
        url: 'mapbox://patrickvossler.8x18qhiy' // geojson -> mbtiles via tippecanoe
        // tippecanoe -o {}.mbtiles {}.geojson  -r1 -pk -pf --layer="state_upper_points" --read-parallel --force 
    });
    map.addSource('district_state_lower_points', {
        // lower data
        type: 'vector',
        // url: 'mapbox://patrickvossler.ckcdys4br0luh23k48u4lxl9r-9ihs1' // from uploading as dataset to mapbox
        url: 'mapbox://patrickvossler.6rz6anpq' // geojson -> mbtiles via tippecanoe
        // tippecanoe -o {}.mbtiles {}.geojson  -r1 -pk -pf --layer="state_lower_points" --read-parallel --force 
    });

    loadMap();
    loadPolygons();
    loadDots();
    // show lower house by default
    loadLowerHouse();

    // when we first load the map, make sure only the states are visible, not the districts
    map.setLayoutProperty('us-states-fill', 'visibility', 'visible')
    map.setLayoutProperty('us-states-line', 'visibility', 'visible')
    map.setLayoutProperty('district-polygons-fill', 'visibility', 'none')
    map.setLayoutProperty('district-polygons-line', 'visibility', 'none')

});

mapboxgl.accessToken = 
'pk.eyJ1IjoicGF0cmlja3Zvc3NsZXIiLCJhIjoiY2tjMHd0eTFrMHphMjJybG0yOTU1dDEzZyJ9.FsIqtdsHIru8Ay_0zmZYHw';


var mapOrigin = {
    zoom: 3,
    lng: -95.5,
    lat: 38,
};

var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/patrickvossler/ckc0ydvhi5h3v1iodhe5rgsjg',
    zoom: mapOrigin.zoom,
    center: [mapOrigin.lng, mapOrigin.lat],
    maxZoom: 8
});

map.dragRotate.disable();
map.touchZoomRotate.disableRotation();

var url = new URL(window.location.href);
var embed = url.searchParams.get('embed');
if (embed === 'true') {
    document.getElementsByTagName('body')[0].classList.add('embed');
    map.resize();
}

var $buttonPolygons = document.getElementById('button-polygon');
var $buttonHouse = document.getElementById('button-house');
var $buttonSenate = document.getElementById('button-senate');

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
        ['get', layerAbbr + '_color'],
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


function loadPolygons() {
    styleMode = 'polygons';
    map.setPaintProperty('district-polygons-fill', 'fill-opacity', 0.6)
        .setPaintProperty('district-polygons-line', 'line-opacity', 0.2)
        .setLayoutProperty('us-states-line', 'visibility', 'visible')
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
    } else {
        map.setLayoutProperty('us-states-fill', 'visibility', 'visible')
        map.setLayoutProperty('district-polygons-fill', 'visibility', 'none')
        map.setLayoutProperty('district-polygons-line', 'visibility', 'none')
        
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
    } else {
        map.setLayoutProperty('us-states-fill', 'visibility', 'visible')
        map.setLayoutProperty('district-polygons-fill', 'visibility', 'none')
        map.setLayoutProperty('district-polygons-line', 'visibility', 'none')
        
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
                { source: 'district_'+layerName, sourceLayer: layerName + '_polygons', id: hoveredStateId },
                { hover: false }
            );
        }
        hoveredStateId = e.features[0].id;
        map.setFeatureState(
            { source: 'district_'+layerName, sourceLayer: layerName + '_polygons', id: hoveredStateId },
            { hover: true }
        );
    }
};

// When viewing at district level
const onMouseLeaveDistrict = function() {
    map.getCanvas().style.cursor = '';
    if (hoveredStateId) {
        map.setFeatureState(
            { source: 'district_'+layerName, sourceLayer: layerName + '_polygons', id: hoveredStateId },
            { hover: false }
        );
    }
    hoveredStateId = null;
};

const onDistrictClick = function(e) {
    if (e.features.length > 0) {
        map.getCanvas().style.cursor = 'pointer';
        map.setFeatureState(
            { source: 'district_'+layerName, sourceLayer: layerName + '_polygons', id: hoveredStateId },
            { hover: false }
        );
        var party = e.features[0].properties[layerAbbr + '_party_1']; // is this in our mock data?
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
            { source: 'district_'+layerName, sourceLayer: layerName + '_polygons', id: hoveredStateId },
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
    } else {
        map.setLayoutProperty('us-states-fill', 'visibility', 'visible')
        map.setLayoutProperty('district-polygons-fill', 'visibility', 'none')
        map.setLayoutProperty('district-polygons-line', 'visibility', 'none')
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

        var xmin = e.features[0].properties.xmin;
        var xmax = e.features[0].properties.xmax;
        var ymin = e.features[0].properties.ymin;
        var ymax = e.features[0].properties.ymax;

        // Previously, clicking on Alaska would result in map zooming to the full extent of the planet. This quick fix ensures that its bbox is on the same side of the planet and zooms in as the user would expect. Would need to enhance this if making a map that isn't focused on the US.
        xmax = xmax <= 0 ? xmax : -180;

        map.fitBounds([[xmax, ymax], [xmin, ymin]], { padding: 2 });

        loadPolygons();
    });

    map.on('click', 'district-polygons-fill', function(e){
        onDistrictClick(e);
    })


    if (map.getLayer('district-polygons-fill')) {
        map.removeLayer('district-polygons-fill');
    }

    var layers = map.getStyle().layers;
    // Find the index of the first symbol layer in the map style
    var firstSymbolId;
    for (var i = 0; i < layers.length; i++) {
        if (layers[i].type === 'symbol') {
            firstSymbolId = layers[i].id;
            break;
        }
    }

    map.addLayer(
        {
            id: 'district-polygons-fill',
            type: 'fill',
            source: 'district_'+layerName,
            'source-layer': layerName + '_polygons',
            paint: {
                'fill-color': politicalColors(),
                'fill-opacity': styleMode === 'polygons' ? 0.6 : 0,
            },
        },
        firstSymbolId,
        'waterway-label'
    );

    map.setFilter('district-polygons-fill', 
        ['match',
                ['get', 'GEOID'],
                // the replace removes zero padding to make district id 033 match 33, for example
                district_data.map(district => district.geoid),
                true,
                false 
        ]
        
    );

    if (map.getLayer('district-polygons-line')) {
        map.removeLayer('district-polygons-line');
    }

    map.addLayer(
        {
            id: 'district-polygons-line',
            type: 'line',
            source: 'district_'+layerName,
            'source-layer': layerName + '_polygons',
            paint: {
                'line-color': '#000',
                'line-opacity': styleMode === 'polygons' ? 0.2 : lineOpacity,
                'line-width': 1,
            },
        },
        firstSymbolId,
        'waterway-label'
    );

    if (map.getLayer('district-polygons-highlight')) {
        map.removeLayer('district-polygons-highlight');
    }

    map.addLayer(
        {
            id: 'district-polygons-highlight',
            type: 'line',
            source: 'district_'+layerName,
            'source-layer': layerName + '_polygons',
            paint: {
                'line-color': '#000',
                'line-opacity': ['case', ['boolean', ['feature-state', 'hover'], false], 0.9, 0],
                'line-width': 2,
            },
        },
        'waterway-label'
    );

};

map.on('load', function() {
    map.addSource('us-states', {
        type: 'geojson',
        data: '/data/us-states-id.json',
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
        'waterway-label'
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
        'waterway-label'
    );
    

    map.addSource('district_state_upper', {
        // upper data
        type: 'vector',
        url: 'mapbox://patrickvossler.32coil2n'
    });
    map.addSource('district_state_lower', {
        // upper data
        type: 'vector',
        url: 'mapbox://patrickvossler.7938os9w'
    });

    loadMap();
    loadPolygons();
    // show lower house by default
    loadLowerHouse();

    // when we first load the map, make sure only the states are visible, not the districts
    map.setLayoutProperty('us-states-fill', 'visibility', 'visible')
    map.setLayoutProperty('us-states-line', 'visibility', 'visible')
    map.setLayoutProperty('district-polygons-fill', 'visibility', 'none')
    map.setLayoutProperty('district-polygons-line', 'visibility', 'none')

});

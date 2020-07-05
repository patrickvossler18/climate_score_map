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
    // maxZoom: 6.89
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
var layerName = 'state_lower';
var layerAbbr = 'sl';
// var styleMode = 'dots';
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
    closeButton: false,
    closeOnClick: false,
    anchor: 'top-left',
});

function loadDots() {
    styleMode = 'dots';
    map.setPaintProperty('district-polygons-fill', 'fill-opacity', 0)
        .setPaintProperty('district-polygons-line', 'line-opacity', lineOpacity)
        .setLayoutProperty('district-points', 'visibility', 'visible')
        .setLayoutProperty('district-points', 'visibility', 'visible')
        .setLayoutProperty('us-states-line', 'visibility', 'none');
    $buttonDots.classList.add('selected');
    $buttonPolygons.classList.remove('selected');
}

function loadPolygons() {
    styleMode = 'polygons';
    map.setPaintProperty('district-polygons-fill', 'fill-opacity', 0.6)
        .setPaintProperty('district-polygons-line', 'line-opacity', 0.2)
        .setLayoutProperty('us-states-line', 'visibility', 'visible')
}

function loadHouse() {
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

function loadSenate() {
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

const onMouseMove = function(e) {
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

const onDistrictClick = function(e) {
    if (e.features.length > 0) {
        map.getCanvas().style.cursor = 'pointer';
        // if (hoveredStateId) {
            map.setFeatureState(
                { source: 'district_'+layerName, sourceLayer: layerName + '_polygons', id: hoveredStateId },
                { hover: false }
            );
            map.setFeatureState(
                { source: 'us-states', id: hoveredStateId },
                { hover: false }
            );
            var name1 = e.features[0].properties[layerAbbr + '_name_1'];
            var party1 = e.features[0].properties[layerAbbr + '_party_1'];
            var name2 = e.features[0].properties[layerAbbr + '_name_2'];
            var party2 = e.features[0].properties[layerAbbr + '_party_2'];
            var name3 = e.features[0].properties[layerAbbr + '_name_3'];
            var party3 = e.features[0].properties[layerAbbr + '_party_3'];
            var name4 = e.features[0].properties[layerAbbr + '_name_4'];
            var party4 = e.features[0].properties[layerAbbr + '_party_4'];
            var name5 = e.features[0].properties[layerAbbr + '_name_5'];
            var party5 = e.features[0].properties[layerAbbr + '_party_5'];
            var name6 = e.features[0].properties[layerAbbr + '_name_6'];
            var party6 = e.features[0].properties[layerAbbr + '_party_6'];
            var name7 = e.features[0].properties[layerAbbr + '_name_7'];
            var party7 = e.features[0].properties[layerAbbr + '_party_7'];
            var name8 = e.features[0].properties[layerAbbr + '_name_8'];
            var party8 = e.features[0].properties[layerAbbr + '_party_8'];

            var state = e.features[0].properties.STATE;
            var district = e.features[0].properties.DISTRICT_I;

            var reps = '';

            if (name1 !== 'NA' && name1 !== undefined) {
                reps += '<h2>' + name1 + '</h2><h3 style="display: ';
                reps += party1 === undefined ? 'none' : 'block';
                reps +=
                    '"><div class="party-color" style="background: ' +
                    getColorByParty(party1) +
                    '"></div>' +
                    party1 +
                    '</h3>';
            }

            if (name2 !== 'NA' && name2 !== undefined) {
                reps +=
                    '<h2>' +
                    name2 +
                    '</h2><h3><div class="party-color" style="background: ' +
                    getColorByParty(party2) +
                    '"></div>' +
                    party2 +
                    '</h3>';
            }

            if (name3 !== 'NA' && name3 !== undefined) {
                reps +=
                    '<h2>' +
                    name3 +
                    '</h2><h3><div class="party-color" style="background: ' +
                    getColorByParty(party3) +
                    '"></div>' +
                    party3 +
                    '</h3>';
            }

            if (name4 !== 'NA' && name4 !== undefined) {
                reps +=
                    '<h2>' +
                    name4 +
                    '</h2><h3><div class="party-color" style="background: ' +
                    getColorByParty(party4) +
                    '"></div>' +
                    party4 +
                    '</h3>';
            }

            if (name5 !== 'NA' && name5 !== undefined) {
                reps +=
                    '<h2>' +
                    name5 +
                    '</h2><h3><div class="party-color" style="background: ' +
                    getColorByParty(party5) +
                    '"></div>' +
                    party5 +
                    '</h3>';
            }

            if (name6 !== 'NA' && name6 !== undefined) {
                reps +=
                    '<h2>' +
                    name6 +
                    '</h2><h3><div class="party-color" style="background: ' +
                    getColorByParty(party6) +
                    '"></div>' +
                    party6 +
                    '</h3>';
            }

            if (name7 !== 'NA' && name7 !== undefined) {
                reps +=
                    '<h2>' +
                    name7 +
                    '</h2><h3><div class="party-color" style="background: ' +
                    getColorByParty(party7) +
                    '"></div>' +
                    party7 +
                    '</h3>';
            }

            if (name8 !== 'NA' && name8 !== undefined) {
                reps +=
                    '<h2>' +
                    name8 +
                    '</h2><h3><div class="party-color" style="background: ' +
                    getColorByParty(party8) +
                    '"></div>' +
                    party8 +
                    '</h3>';
            }
            var description =
                '<h1>' + state + '-' + district + '</h1><div class="reps">' + reps + '</div>';
            popup
                .setLngLat(e.lngLat)
                .setHTML(description)
                .addTo(map);
        // }
        hoveredStateId = e.features[0].id;
        map.setFeatureState(
            { source: 'district_'+layerName, sourceLayer: layerName + '_polygons', id: hoveredStateId },
            { hover: true }
        );
        map.setFeatureState(
            { source: 'us-states', id: hoveredStateId },
            { hover: true }
        );
    }
};


const onMouseLeave = function() {
    map.getCanvas().style.cursor = '';
    if (hoveredStateId) {
        map.setFeatureState(
            { source: 'district_'+layerName, sourceLayer: layerName + '_polygons', id: hoveredStateId },
            { hover: false }
        );
        map.setFeatureState(
            { source: 'us-states', id: hoveredStateId },
            { hover: false }
        );
    }
    hoveredStateId = null;
    // popup.remove();
};


map.on('mousemove', 'us-states-fill', function(e) {
    if (e.features.length > 0) {
        if (hoveredStateId) {
            map.setFeatureState(
                { source: 'us-states', id: hoveredStateId },
                { hover: false }
            );
            map.setFeatureState(
                { source: 'us-states', id: hoveredStateId },
                { hover: false }
            );
        }
        hoveredStateId = e.features[0].id;
        map.setFeatureState(
            { source: 'us-states', id: hoveredStateId },
            { hover: true }
        );
    }
});
 


map.on('zoom', function() {
    if (map.getZoom() > zoomThreshold) {
        map.setLayoutProperty('us-states-fill', 'visibility', 'none')
        map.setLayoutProperty('district-polygons-fill', 'visibility', 'visible')
        map.setLayoutProperty('district-polygons-line', 'visibility', 'visible')
    } else {
        map.setLayoutProperty('us-states-fill', 'visibility', 'visible')
        map.setLayoutProperty('district-polygons-fill', 'visibility', 'none')
        map.setLayoutProperty('district-polygons-line', 'visibility', 'none')
        onMouseLeave();
        
    }
});


const loadMap = function() {
    map.on('mousemove', 'district-polygons-fill', function(e) {
        onMouseMove(e);

    });

    map.on('mouseleave', 'district-polygons-fill', function() {
        onMouseLeave();
        map.getCanvas().style.cursor = 'text';
    });

    map.on('click', 'us-states-fill', function(e) {
        popup.setLngLat({ lng: 0, lat: 0 });

        var xmin = e.features[0].properties.xmin;
        var xmax = e.features[0].properties.xmax;
        var ymin = e.features[0].properties.ymin;
        var ymax = e.features[0].properties.ymax;

        // Previously, clicking on Alaska would result in map zooming to the full extent of the planet. This quick fix ensures that its bbox is on the same side of the planet and zooms in as the user would expect. Would need to enhance this if making a map that isn't focused on the US.
        xmax = xmax <= 0 ? xmax : -180;

        map.fitBounds([[xmax, ymax], [xmin, ymin]], { padding: 25 });

        loadPolygons();
        // onMouseMove(e);
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
            source: 'district_'+layerName,
            'source-layer': layerName + '_polygons',
            paint: {
                'fill-color': politicalColors(),
                'fill-opacity': styleMode === 'polygons' ? 0.6 : 0,
            },
        },
        'waterway-label'
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
            // layout: {
            //     visibility: styleMode === 'polygons' ? 'visible' : 'none'
            // }
        },
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
            // paint: {
            //     'fill-color': 'transparent',
            // },
            'paint': {
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
            // layout: {
            //     visibility: 'none',
            // },
        },
        'waterway-label'
    );
    

    map.addSource('district_state_upper', {
        // upper data
        type: 'vector',
        url: 'mapbox://patrickvossler.32coil2n'
        // data: '/data/upper_data_combined.mbtiles'
        // data: '/data/us-states.json',
    });
    map.addSource('district_state_lower', {
        // upper data
        type: 'vector',
        url: 'mapbox://patrickvossler.7938os9w'
        // url: location.origin + '/data/lower_data_combined_test.mbtiles'
        // data: '/data/us-states.json',
    });

    loadMap();
    // loadDots();
    loadPolygons();
    // loadSenate();
    loadHouse();
    map.setLayoutProperty('us-states-fill', 'visibility', 'visible')
    map.setLayoutProperty('us-states-line', 'visibility', 'visible')
    map.setLayoutProperty('district-polygons-fill', 'visibility', 'none')
    map.setLayoutProperty('district-polygons-line', 'visibility', 'none')

});

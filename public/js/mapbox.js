

// const locations = JSON.parse(document.getElementById('map').dataset.locations);
// console.log(locations);

const displayMap = (locations)=>{

    mapboxgl.accessToken = 'pk.eyJ1IjoibWZpdHJpZTc4IiwiYSI6ImNsMHYwamlwaTA5bTQza28wNjN0NWJrYW4ifQ.yBCWxHGLSikCBRS6GcyzQA';
    var map = new mapboxgl.Map({
        // the map will be specified to id 'map' at HTML
        container: 'map',
        style: 'mapbox://styles/mapbox/light-v10',
        scrollZoom: false
        // // longitude, langitude
        // center: [-118.113491,34.111745],
        // zoom: 10
    });
    
    const bounds = new mapboxgl.LngLatBounds();
    
    locations.forEach(loc=>{
        // Create marker
        const el = document.createElement('div');
        // this marker is custom by jonas at css files
        el.className = 'marker';
    
        new mapboxgl.Marker({
            element: el,
            anchor: 'bottom'
        })
        .setLngLat(loc.coordinates)
        .addTo(map);
    
        // Add popup
        new mapboxgl
        .Popup({
            offset: 30
        })
        .setLngLat(loc.coordinates)
        .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
        .addTo(map);
    
        // Extend map bounds to include current location
        bounds.extend(loc.coordinates);
    
    });
    
    // will make zoom animation at first
    map.fitBounds(bounds, {
        padding: {
            top: 200,
            bottom: 150,
            left: 100,
            right: 100
        }
    });

}



export {displayMap};
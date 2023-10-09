import React, { useState } from 'react';
import { GoogleMap, useJsApiLoader, Polyline, Marker } from '@react-google-maps/api';

function GMap(props){
    const coordinates       = props.coordinates;
    const mapContainerStyle = {
        height: "20vh",
        width: "100%"
    };

    const center = coordinates.length > 0
        ? { lat: coordinates[0].lat, lng: coordinates[0].lng }
        : { lat: 0, lng: 0 };

    const options = {
        zoomControl: true,
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true
    };

    return (<GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={center}
                zoom={16}
                onLoad={(map) => {
                    props.setMap(map);
                }}
                options={options}
            >
                {coordinates.map((coordinate, index) => (
                    <Marker key={index} position={coordinate} />
                ))}
                <Polyline path={coordinates} />
            </GoogleMap>);
}

const GMapContainer = ({ coordinates }) => {
    const [map, setMap]             = useState(null);
    const { isLoaded }              = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: 'AIzaSyB7bJMYfQLt_xOhecW4RnHRNhdUCv8zE4M'
    });

    return (
                isLoaded
                    ? <GMap coordinates={coordinates} map={map} setMap={setMap}/>
                    : <div>Loading...</div>
    )
};

export default GMapContainer;

import React, { useState, useMemo } from 'react';
import { GoogleMap, useJsApiLoader, Polyline, Marker } from '@react-google-maps/api';
import { Offline, Online } from "react-detect-offline";

const mapContainerStyle = {
    height: "20vh",
    width: "100%"
};

const options = {
    zoomControl: true,
    mapTypeControl: true,
    streetViewControl: false,
    fullscreenControl: false
};

function GMap({ coordinates, setMap }) {
    const center = useMemo(() => (
        coordinates.length > 0
            ? { lat: coordinates[0].lat, lng: coordinates[0].lng }
            : { lat: 0, lng: 0 }
    ), [coordinates]);

    const filteredCoordinates = useMemo(() => (
        coordinates.filter(coordinate => coordinate.lat !== undefined && coordinate.lng !== undefined)
    ), [coordinates]);

    return (
        <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={center}
            zoom={16}
            onLoad={map => {
                setMap(map);
                if (coordinates.length > 0) {
                    const bounds = new window.google.maps.LatLngBounds();
                    coordinates.forEach(coordinate => bounds.extend(new window.google.maps.LatLng(coordinate.lat, coordinate.lng)));
                    map.fitBounds(bounds);

                    const listener = map.addListener("bounds_changed", () => {
                        if (map.getZoom() > 16) map.setZoom(16);
                        window.google.maps.event.removeListener(listener);
                    });
                }
            }}
            options={options}
        >
            {filteredCoordinates.map((coordinate, index) => (
                <Marker key={index} position={{ lat: coordinate.lat, lng: coordinate.lng }} />
            ))}
            <Polyline path={coordinates} />
        </GoogleMap>
    );
}

const GMapContainer = ({ coordinates }) => {
    const [map, setMap] = useState(null);
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: "AIzaSyB7bJMYfQLt_xOhecW4RnHRNhdUCv8zE4M"
    });

    if (!isLoaded) {
        return <div className={`map_err_msg`}>Loading...</div>;
    }

    if (isLoaded && (!coordinates || coordinates.length === 0)) {
        return <div className={`map_err_msg`}>The map is currently not available.</div>;
    }

    return (
        <>
            <Online>
                <GMap coordinates={coordinates} map={map} setMap={setMap} />
            </Online>
            <Offline>
                <div className={`map_err_msg`}>Sorry, map may not generate offline. Map data will be available on the data portal.</div>
            </Offline>
        </>
    );
};

export default GMapContainer;

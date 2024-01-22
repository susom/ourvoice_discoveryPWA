import {createContext, useState, useContext, useEffect, useRef} from 'react';
import {SessionContext} from "../contexts/Session";
import {hasGeo} from "../components/util";

export const WalkmapContext = createContext({
    data : {},
    setData : () => {},
    startGeoTracking: () => {}
});

export const WalkmapContextProvider = ({children}) => {
    const session_context                   = useContext(SessionContext);
    const [data, setData]                   = useState([]);
    const [startTracking, setStartTracking] = useState(false);
    let interval = useRef()
    let watchID
    const startGeoTracking = () => {
        setStartTracking(true);
    };

    // const watchPosition = () => {
    //     const start = Date.now();
    //     console.log('watching position')
    //     if(hasGeo()){
    //         watchID = navigator.geolocation.watchPosition(
    //             (pos) => {
    //                 let same_geo = false;
    //                 if(data.length){
    //                     const lastpos   = data[data.length - 1] ;
    //                     same_geo  = pos.coords.latitude === lastpos.lat && pos.coords.longitude === lastpos.lng;
    //                 }
    //
    //
    //                 if(pos.coords.accuracy < 50 && !same_geo){
    //                     const geo_point = {
    //                         "accuracy" : pos.coords.accuracy,
    //                         "altitude" : pos.coords.altitude,
    //                         "heading" : pos.coords.heading,
    //                         "lat" : pos.coords.latitude,
    //                         "lng" : pos.coords.longitude,
    //                         "speed" : pos.coords.speed,
    //                         "timestamp" : pos.timestamp,
    //                     };
    //                     const end = Date.now();
    //                     console.log(`saving position successfully, geolocation call execution time: ${end-start} ms `)
    //                     // console.log("a fresh coordinate", geo_point);
    //                     setData(prevData => [...prevData, geo_point]);
    //                     // interval.current = setTimeout(updatePosition, 5000);
    //                 } else {
    //                     if(pos.coords.accuracy < 50)
    //                         setData(prevData => [...prevData, {err:'accuracy of pos not < 50, not saving'}])
    //                     else
    //                         setData(prevData => [...prevData, {err:'same geo encountered, skipping'}])
    //                 }
    //                 navigator.geolocation.clearWatch(watchID)
    //                 interval.current = setTimeout(watchPosition, 2000);
    //             }, (err) => {
    //                 console.log('error callback triggered in updatePosition', err);
    //                 setData(prevData => [...prevData, {err:err}])
    //                 navigator.geolocation.clearWatch(watchID)
    //                 interval.current = setTimeout(watchPosition, 2000);
    //             }, {maximumAge: 0})
    //
    //     } else {
    //         console.log("geodata api not available");
    //         setData(prevData => [...prevData, {err:"geodata api not available"}])
    //         interval.current = setTimeout(watchPosition, 2000);
    //     }
    // }

    const updatePosition = () => {
        const start = Date.now();
        console.log('updatePositionCalled')
        if(hasGeo()){
            navigator.geolocation.getCurrentPosition((pos) => {
                let same_geo = false;
                if(data.length){
                    const lastpos   = data[data.length - 1] ;
                    same_geo  = pos.coords.latitude === lastpos.lat && pos.coords.longitude === lastpos.lng;
                }

                if(pos.coords.accuracy < 50 && !same_geo){
                    const geo_point = {
                        "accuracy" : pos.coords.accuracy,
                        "altitude" : pos.coords.altitude,
                        "heading" : pos.coords.heading,
                        "lat" : pos.coords.latitude,
                        "lng" : pos.coords.longitude,
                        "speed" : pos.coords.speed,
                        "timestamp" : pos.timestamp,
                    };
                    const end = Date.now();
                    console.log(`saving position successfully, geolocation call execution time: ${end-start} ms `)
                    // console.log("a fresh coordinate", geo_point);
                    setData(prevData => [...prevData, geo_point]);

                }
                interval.current = setTimeout(updatePosition, 2000);
            }, (err) => {
                interval.current = setTimeout(updatePosition, 2000);
            }, {maximumAge: 0, timeout: 10000, enableHighAccuracy : true});
        }else{
            interval.current = setTimeout(updatePosition, 2000);
        }
    };
    const clearPolling = () => {
        console.log('clearing poll')
        clearTimeout(interval.current)
        interval.current = null
    }

    const startPolling = () => {
        console.log('starting poll')
        // watchPosition()
        // console.log(interval.current)
        if(!interval.current)
            interval.current = setTimeout(updatePosition, 2000);
    }

    useEffect(() => {
        console.log("WalkmapContext useEffect triggered", startTracking, session_context.data.in_walk);
        console.log("WalkmapContext Data", WalkmapContext.data)
        // let interval;
        if (startTracking && session_context.data.in_walk) {
            startPolling()
        }
        //when unmounted will clear it
        return () => clearInterval(interval);
    }, [startTracking, session_context.data.in_walk]);

    return (
        <WalkmapContext.Provider value={{data, setData, startGeoTracking, startTracking, startPolling, clearPolling, setStartTracking}}>
            {children}
        </WalkmapContext.Provider>
    );
}

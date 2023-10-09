import {createContext, useState, useContext, useEffect} from 'react';
import {SessionContext} from "../contexts/Session";
import {hasGeo} from "../components/util";

export const WalkmapContext = createContext({
    data : {},
    setData : () => {},
    startGeoTracking: () => {}
});

export const WalkmapContextProvider = ({children}) => {
    const session_context = useContext(SessionContext);
    const [data, setData] = useState([]);
    const [startTracking, setStartTracking] = useState(false);

    const startGeoTracking = () => {
        setStartTracking(true);
    };

    const updatePosition = () => {
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
                    const data_copy = data;
                    data_copy.push(geo_point);
                    setData(data_copy);
                }
            }, (err) => {
                console.log(err);
            });
        }else{
            console.log("geodata api not available");
        }
    };

    useEffect(() => {
        let interval;
        if (startTracking && session_context.data.in_walk) {
            interval = setInterval(updatePosition, 5000);
        }
        //when unmounted will clear it
        return () => clearInterval(interval);
    }, [startTracking, session_context.data.in_walk]);

    return (
        <WalkmapContext.Provider value={{data, setData, startGeoTracking}}>
            {children}
        </WalkmapContext.Provider>
    );
}

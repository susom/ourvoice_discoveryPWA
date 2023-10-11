import {createContext, useState} from 'react';
import {cloneDeep} from "../components/util";

const { platform, userAgent } = navigator;
const context_init = {
     walk_id    : null
    ,project_id : null
    ,user_id    : null
    ,lang       : "en"
    ,photos     : []
    ,geotags    : []
    ,device     : {"platform" : platform, "userAgent" : userAgent}
    ,timestamp  : null
    ,uploaded   : 0
    ,complete   : 0
    ,status     : 'PENDING' // can be 'PENDING', 'COMPLETE', 'IN_PROGRESS', or 'ERROR'
}

export const WalkContext = createContext({
    data : {},
    setData : () => {}
});

export const WalkContextProvider = ({children}) => {
    const clean_obj                     = cloneDeep(context_init);
    const [data, setData]               = useState(clean_obj);
    const [photoCount, setPhotoCount]   = useState(0);

    const resetData = () => {
        const clean_obj     = cloneDeep(context_init);
        setData(clean_obj);
        setPhotoCount(0);
    }

    return (
        <WalkContext.Provider value={{data, setData, resetData, photoCount, setPhotoCount}}>
            {children}
        </WalkContext.Provider>
    );
}
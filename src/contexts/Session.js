import { createContext, useState, useEffect } from 'react';
import { cloneDeep } from "../components/util";
import { firestore } from "../database/Firebase";
import { collection, getDocs, getDoc,  collectionGroup, doc,  where, query } from "firebase/firestore";
import defaultTranslations from './defaultTranslations.json';
import useAnonymousSignIn from "../components/useAnonymousSignIn";

const context_init = {
    project_id : "",
    splash_viewed : false,
    in_walk : false,
    signed_in : false,
    project_info : {}
};

export const SessionContext = createContext({
    data : {},
    setData : () => {}
});

export const SessionContextProvider = ({children}) => {
    const clean_obj         = cloneDeep(context_init);
    const [data, setData]                   = useState(clean_obj);
    const [slideOpen, setSlideOpen]         = useState(false);

    const [previewWalk, setPreviewWalk]         = useState(null);
    const [previewPhoto, setPreviewPhoto]       = useState(null);
    const [previewWalkID, setPreviewWalkID]     = useState(null);
    const [previewProjID, setPreviewProjID]     = useState(null);

    const [lastUploadsUpdated, setLastUploadsUpdated]   = useState(Date.now());

    const [selectedLanguage, setSelectedLanguage]       = useState('en');
    const [translations, setTranslations]               = useState(defaultTranslations);
    const [version, setVersion]                         = useState("v 4.0.0");

    const isAuthenticated = useAnonymousSignIn();

    useEffect(() => {
        const fetchTranslations = async () => {
            const ovMetaRef     = collection(firestore, "ov_meta");
            const appDataRef    = doc(ovMetaRef, "app_data");

            try {
                const appDataSnapshot   = await getDoc(appDataRef);
                if (appDataSnapshot.exists()) {
                    const appTextData   = appDataSnapshot.get('app_text');
                    setTranslations({ ...defaultTranslations, ...appTextData });

                    const version       = appDataSnapshot.get('version');
                    setVersion(version);

                    console.log("useEffect translations SHOULD ONLY SHOW ONCE", appTextData);
                    console.log("useEffect version", version);

                }
            } catch (error) {
                console.error("Error getting documents: ", error);
            }
        };

        if (isAuthenticated) {
            fetchTranslations();
        }
    }, [isAuthenticated]);

    useEffect(() => {
        console.log("Translations have been updated SHOULD ONLY SHOW AFTER THE ABOVE USE EFFECT RIGHT?:", translations);
    }, [translations]);


    useEffect(() => {
        console.log("Selected language: ", selectedLanguage);
        console.log("Current translations: ", translations);
    }, [selectedLanguage]);

    const handleLanguageChange = (language) => {
        setSelectedLanguage(language);
    }

    const getTranslation = (key) => {
        if (!translations[key]) return '';
        return translations[key][selectedLanguage] || translations[key]['en'] || '';
    };

    // This function can be called to update lastUpdated
    const updateLastUploadsUpdated = () => {
        setLastUploadsUpdated(Date.now());
    };

    const resetData = () => {
        const clean_obj     = cloneDeep(context_init);
        setData(clean_obj);
        setSlideOpen(false);

        setPreviewWalk(null);
        setPreviewPhoto(null);
        setPreviewProjID(null);
        setPreviewWalkID(null);
    }



    return (
        <SessionContext.Provider value={{data, setData,selectedLanguage,handleLanguageChange, translations, getTranslation, resetData, slideOpen, setSlideOpen, previewPhoto, setPreviewPhoto, previewWalk, setPreviewWalk, previewWalkID, setPreviewWalkID, previewProjID, setPreviewProjID, lastUploadsUpdated, updateLastUploadsUpdated, version}}>
            {children}
        </SessionContext.Provider>
    );
}
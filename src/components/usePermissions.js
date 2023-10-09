import { useState, useEffect } from 'react';
import {db_project} from "../database/db";
import {getDeviceType} from "./util";

const usePermissions = () => {
    const initialPermissionsState = {
        camera: "prompt",
        audio: "prompt",
        geo: "prompt",
    };
    const [permissions, setPermissions] = useState(initialPermissionsState);
    const [loading, setLoading] = useState({
        camera: false,
        audio: false,
        geo: false,
    });

    const mapPermissionName = (permissionName) => {
        switch (permissionName) {
            case 'camera': return 'camera';
            case 'audio': return 'microphone';
            case 'geo': return 'geolocation';
            default: return null;
        }
    };

    const loadDbPermissions = async () => {
        try {
            const dbPermissions = await db_project.permissions.get(1);
            return dbPermissions || initialPermissionsState;
        } catch (error) {
            console.error("Could not load permissions from the database:", error);
            return initialPermissionsState;
        }
    };

    const updateDbPermissions = async (permissions) => {
        try {
            await db_project.permissions.put({ id: 1, ...permissions });
        } catch (error) {
            console.error("Could not update permissions in the database:", error);
        }
    }

    const device_type = getDeviceType();
    //if device_type === "Android"
    console.log(device_type);

    useEffect(() => {
        if (device_type === "Android" && navigator.permissions) {
            Promise.all(
                Object.keys(initialPermissionsState).map(async (permissionName) => {
                    const permissionStatus = await navigator.permissions.query({ name: mapPermissionName(permissionName) });
                    return { [permissionName]: permissionStatus.state };
                })
            ).then(results => {
                const permissionsState = results.reduce((acc, current) => ({ ...acc, ...current }), {});
                setPermissions(permissionsState);
            });
        } else {
            loadDbPermissions().then(permissionsState => {
                setPermissions(permissionsState);
            });
        }
    }, []);

    const requestPermission = async (permissionName) => {
        setLoading((prevLoading) => ({
            ...prevLoading,
            [permissionName]: true,
        }));

        try {
            switch (permissionName) {
                case 'camera':
                    const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
                    videoStream.getTracks().forEach(track => track.stop());

                    setPermissions(prevPermissions => {
                        const updatedPermissions = {
                            ...prevPermissions,
                            camera: 'granted',
                        };
                        updateDbPermissions(updatedPermissions);  // Update the database
                        return updatedPermissions;
                    });
                    break;
                case 'audio':
                    const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    audioStream.getTracks().forEach(track => track.stop());

                    setPermissions(prevPermissions => {
                        const updatedPermissions = {
                            ...prevPermissions,
                            audio: 'granted',
                        };
                        updateDbPermissions(updatedPermissions);  // Update the database
                        return updatedPermissions;
                    });
                    break;
                case 'geo':
                    const granted = await new Promise((resolve) => {
                        if (navigator.geolocation) {
                            navigator.geolocation.getCurrentPosition(() => resolve('granted'), () => resolve('denied'));
                        } else {
                            resolve('denied');
                        }
                    });

                    setPermissions(prevPermissions => {
                        const updatedPermissions = {
                            ...prevPermissions,
                            geo: 'granted',
                        };
                        updateDbPermissions(updatedPermissions);  // Update the database
                        return updatedPermissions;
                    });
                    break;
                default:
                    break;
            }
        } catch (error) {
            if (error.name === 'NotAllowedError') {
                setPermissions(prevPermissions => {
                    const updatedPermissions = {
                        ...prevPermissions,
                        [permissionName]: 'denied',
                    };
                    updateDbPermissions(updatedPermissions);  // Update the database
                    return updatedPermissions;
                });
            } else {
                console.error(`An error occurred while requesting ${permissionName} permission: ${error}`);
            }
        }

        setLoading((prevLoading) => ({
            ...prevLoading,
            [permissionName]: false,
        }));
    };

    return [permissions, loading, requestPermission, setPermissions];
};

export default usePermissions;

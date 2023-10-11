import { useState, useEffect, useContext } from 'react';
import { SessionContext } from '../contexts/Session';

const usePermissions = () => {
    const { isAudioPermissionGranted, setIsAudioPermissionGranted, isGeoPermissionGranted, setIsGeoPermissionGranted, isCameraPermissionGranted, setIsCameraPermissionGranted } = useContext(SessionContext);

    const initialPermissionsState = {
        camera: isCameraPermissionGranted ? 'granted' : 'prompt',
        audio: isAudioPermissionGranted ? 'granted' : 'prompt',
        geo: isGeoPermissionGranted ? 'granted' : 'prompt',
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

    useEffect(() => {
        if (navigator.permissions) {
            Promise.all(
                Object.keys(initialPermissionsState).map(async (permissionName) => {
                    const permissionStatus = await navigator.permissions.query({ name: mapPermissionName(permissionName) });
                    return { [permissionName]: permissionStatus.state };
                })
            ).then(results => {
                const permissionsState = results.reduce((acc, current) => ({ ...acc, ...current }), {});
                // Defer to session context if values are present
                if (isAudioPermissionGranted !== null) {
                    permissionsState.audio = isAudioPermissionGranted ? 'granted' : permissionsState.audio;
                }
                if (isGeoPermissionGranted !== null) {
                    permissionsState.geo = isGeoPermissionGranted ? 'granted' : permissionsState.geo;
                }
                if (isCameraPermissionGranted !== null) {
                    permissionsState.camera = isCameraPermissionGranted ? 'granted' : permissionsState.camera;
                }

                // Update the session context with the initially queried permissions
                setIsAudioPermissionGranted(permissionsState.audio === 'granted');
                setIsGeoPermissionGranted(permissionsState.geo === 'granted');
                setIsCameraPermissionGranted(permissionsState.camera === 'granted');

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
                    setPermissions(prevPermissions => ({
                        ...prevPermissions,
                        camera: 'granted',
                    }));
                    setIsCameraPermissionGranted(true);
                    break;

                case 'audio':
                    const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    audioStream.getTracks().forEach(track => track.stop());
                    setPermissions(prevPermissions => ({
                        ...prevPermissions,
                        audio: 'granted',
                    }));
                    setIsAudioPermissionGranted(true);
                    break;

                case 'geo':
                    const granted = await new Promise((resolve) => {
                        if (navigator.geolocation) {
                            navigator.geolocation.getCurrentPosition(
                                () => {
                                    setIsGeoPermissionGranted(true);
                                    resolve('granted');
                                },
                                () => {
                                    setIsGeoPermissionGranted(false);
                                    resolve('denied');
                                }
                            );
                        } else {
                            resolve('denied');
                        }
                    });
                    setPermissions(prevPermissions => ({
                        ...prevPermissions,
                        geo: granted,
                    }));
                    break;

                default:
                    break;
            }
        } catch (error) {
            if (error.name === 'NotAllowedError') {
                setPermissions(prevPermissions => ({
                    ...prevPermissions,
                    [permissionName]: 'denied',
                }));
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

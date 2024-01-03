import { useState, useContext, useEffect, useRef , useCallback} from "react";
import Webcam from "react-webcam";

import PermissionModal from './device_permisssions';

import { Container, Row, Col, Button } from 'react-bootstrap';
import { Link, useNavigate } from "react-router-dom";

import { SessionContext } from "../contexts/Session";
import { WalkContext } from "../contexts/Walk";
import { WalkmapContext } from "../contexts/Walkmap";
import { db_walks } from "../database/db";
import { updateContext } from "../components/util";

import loading_photo_ui_boring from "../assets/images/loading_camera_boring.gif";

function WalkStart(props) {
    const session_context   = useContext(SessionContext);
    const walk_context      = useContext(WalkContext);
    const walkmap_context   = useContext(WalkmapContext);

    const {takePhoto, setTakePhoto}                 = useContext(WalkContext);
    const {cameraLoaded, setCameraLoaded}           = useContext(WalkContext);
    const [customPhotoPrompt, setCustomPhotoPrompt] = useState("");

    const [cameraError, setCameraError] = useState(null);
    let navigate = useNavigate();

    useEffect(() => {
        setCustomPhotoPrompt(session_context.data.project_info.custom_take_photo_text);
    }, [session_context.data.project_info.custom_take_photo_text]);

    const initGeoTracking = (permissionGranted) => {
        if(permissionGranted) {
            walkmap_context.startGeoTracking();
        }
    };

    const takePhotoHandler = (e) => {
        e.preventDefault();
        setTakePhoto(true);
    }

    const doneWalkHandler = (e) => {
        walkmap_context.clearPolling() //Pause location collection

        console.log('doneHandler called', walkmap_context.data)

        const walk_geos = walk_context.data.geotags.concat(walkmap_context.data);
        console.log('walk_geos', walk_geos)

        updateContext(walk_context, { "geotags": walk_geos });

        console.log(walk_context)

        // walkmap_context.data.length = 0;
        // walkmap_context.setData(walkmap_context.data);
        walkmap_context.setData([]) //Set walkmap context to empty... still recording in back

        console.log(walkmap_context)
        const update_walk = async () => {
            console.log('attempting to cache...')
            return await db_walks.walks.put(walk_context.data)
        };

        update_walk()
            .then((res) => {
                console.log('Success!', res)
                navigate('/summary')
            })
            .catch(err => console.log(err));
    }

    const webcamRef = useRef(null);
    const capture   = useCallback(
        () => {
            const imageSrc = webcamRef.current.getScreenshot();
            props.handleTakePhoto(imageSrc);
        },
        [webcamRef, props]
    );

    const take_photo_text   = session_context.getTranslation("take_photo");
    const take_another_text = session_context.getTranslation("take_another");
    const done_walk_text    = session_context.getTranslation("done_walk");
    // console.log('inside walk start', walkmap_context.data)
    const debug = walkmap_context?.data?.map((e, i) => {
        if('lat' in e)
            return <p key={i}>{i} - {parseFloat(e.lat).toFixed(4)} {parseFloat(e.lng).toFixed(4)}</p>
        else
            return <p key={i}>{i} -  Error</p>
    })

    return (
        (takePhoto) ?
            <>
                {takePhoto && cameraError && <div className="error">{cameraError}</div>}
                {!cameraLoaded && (
                    <div className="loading-container">
                        <img src={loading_photo_ui_boring} alt="Loading..." />
                    </div>
                )}
                {takePhoto && !cameraError && <Webcam
                    audio={false}  // Captures audio along with video
                    screenshotFormat="image/jpeg"
                    videoConstraints={{
                        width: 1280,
                        height: 720,
                        aspectRatio: 16/9,  // (optional)
                        facingMode: "environment",  // prioritize back camera
                        frameRate: 30  // (optional)
                    }}
                    onUserMedia={() => {
                        setCameraLoaded(true);
                        console.log("Webcam media stream loaded");
                    }}
                    onUserMediaError={(error) => {  // Callback on media stream error
                        switch(error.name) {
                            case "NotAllowedError":
                                console.error("User has denied camera/microphone permissions.");
                                break;
                            case "NotFoundError":
                                console.error("No camera/microphone found or user denied permission.");
                                break;
                            case "NotReadableError":
                                console.error("Unable to access the camera/microphone due to hardware or OS issue.");
                                break;
                            case "OverconstrainedError":
                                console.error("Constraints don't match any installed camera/microphone.");
                                break;
                            case "TypeError":
                                console.error("Invalid constraints provided.");
                                break;
                            default:
                                console.error("Webcam media stream error:", error);
                                break;
                        }
                    }}
                    className="webcam-style"
                    ref={webcamRef}
                />}

                <div className="camera-button-container">
                    <button
                        onClick={() => {
                            setCameraLoaded(false);
                            setTakePhoto(!takePhoto);
                        }}
                        className="btn cancel-button">
                        <b>Cancel</b>
                    </button>
                    <button
                        className="capture-button"
                        onClick={capture}>
                        Take Photo
                    </button>
                </div>


            </>
            :
            <Container className="content walk walk_start" >
                <Row id="walk_start" className="panel">
                    <Col className="content">
                        <PermissionModal
                            permissionNames={["camera","geo"]}
                            onPermissionChanged={initGeoTracking}
                        />

                        <Container>
                            <Row>
                                <Col className="custom_takephoto_text">
                                    <h5 className="offset-sm-1 col-sm-10 col-10">{customPhotoPrompt}</h5>
                                </Col>
                            </Row>

                            <Row className="photoaction">
                                <Col className="actions">
                                    <a href="/#" onClick={takePhotoHandler} className="btn button action daction camera">
                                        <b>{take_photo_text}</b>
                                        <b>{take_another_text}</b>
                                    </a>
                                </Col>
                            </Row>

                            <Row className="buttons walk_actions">
                                <Col>
                                    <Button
                                        className="btn btn-primary endwalk"
                                        variant="primary"
                                        // as={Link} to="/summary"
                                        onClick={(e) => {
                                            doneWalkHandler(e);
                                        }}
                                    >{done_walk_text}</Button>
                                </Col>
                            </Row>
                             <div style={{height:'200px', overflow:'scroll'}}>
                                 <p>Coordinates</p>
                                {debug.reverse()}
                            </div>
                        </Container>
                    </Col>
                </Row>
            </Container>
    )
}

export default WalkStart;

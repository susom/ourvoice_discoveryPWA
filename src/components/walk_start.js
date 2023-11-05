import { useState, useContext, useEffect, useRef , useCallback} from "react";
import Webcam from "react-webcam";

import PermissionModal from './device_permisssions';

import { Container, Row, Col, Button } from 'react-bootstrap';
import { Link } from "react-router-dom";

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
    const [cameraLoaded, setCameraLoaded]           = useState(false);
    const [customPhotoPrompt, setCustomPhotoPrompt] = useState("");

    const [cameraError, setCameraError] = useState(null);

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
        const walk_geos = walk_context.data.geotags.concat(walkmap_context.data);
        updateContext(walk_context, { "geotags": walk_geos });

        walkmap_context.data.length = 0;
        walkmap_context.setData(walkmap_context.data);

        const update_walk = async () => {
            try {
                const walk_prom = await db_walks.walks.put(walk_context.data).then(() => {
                    // console.log(walk_context.data.id, "walk_context already got an id from og add/put, so re-put the walk_context should update new data");
                });
                return [walk_prom];
            } catch (error) {
                console.log(`Failed to update ${walk_context.data.walk_id}: ${error}`);
            }
        };
        update_walk();
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

    return (
        (takePhoto) ?
            <>
                {takePhoto && cameraError && <div className="error">{cameraError}</div>}
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
                    onUserMedia={() => {  // Callback when media stream is loaded
                        setCameraLoaded(true); // Add this line
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
                        onClick={() => setTakePhoto(!takePhoto)}
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
                                        as={Link} to="/summary"
                                        onClick={(e) => {
                                            doneWalkHandler(e);
                                        }}
                                    >{done_walk_text}</Button>
                                </Col>
                            </Row>
                        </Container>
                    </Col>
                </Row>
            </Container>
    )
}

export default WalkStart;

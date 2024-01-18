import { useContext, useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from 'react-bootstrap';
import  Slider  from 'react-slide-out';
import 'react-slide-out/lib/index.css';
import { XCircle } from 'react-bootstrap-icons';


import { SessionContext } from "../contexts/Session";
import { WalkContext } from "../contexts/Walk";
import { db_walks, db_files } from "../database/db";
import {buildFileArr, shallowMerge, getFileByName, updateContext} from "./util";

import "../assets/css/slideout.css";

import JSZip from 'jszip';
import { saveAs } from 'file-saver';

function PhotoList({data, closeSlideOut}){
    const navigate          = useNavigate();
    const session_context   = useContext(SessionContext);
    const gotoPhotoPreview = (e) => {
        e.preventDefault();
        session_context.setPreviewPhoto(data.photo_id);
        closeSlideOut();
        navigate('/walk');
    }

    return (
        <dl>
            <dt className={`img_preview`} onClick={gotoPhotoPreview}><span>{data.photo_id + 1}.</span> {data.img_preview}</dt>
            <dd>{data.vote_good} {data.vote_bad} {data.has_text} {data.has_audios} {data.has_tags}</dd>
        </dl>
    );
}

function SlideOut(props){
    const session_context   = useContext(SessionContext);
    const walk_context      = useContext(WalkContext);

    const [walkAudios, setWalkAudios]       = useState({});
    const [audioPlaying, setAudioPlaying]   = useState(null);

    const [summProjectID, setSummProjectID] = useState(null);
    const [summWalkID, setSummWalkID]       = useState(null);
    const [walkSumm, setWalkSumm]           = useState([]);

    const audioRef      = useRef(null);
    const walkAudiosRef = useRef({});


    useEffect(() => {
        walkAudiosRef.current = walkAudios;
    }, [walkAudios]);


    useEffect(() => {
        async function prepSummary(doc_id, photos) {
            // Query the database for records where fileName matches any value in the array
            const files_arr = buildFileArr(doc_id, photos);
            const files     = await db_files.files.where('name').anyOf(files_arr).toArray();

            const summ_preview = photos.map((photo, index) => {
                // Use Dexie to get photo + audio
                const photo_name    = doc_id + "_" + photo.name;
                const photo_base64  = getFileByName(files, photo_name); // Assuming this gets the base64 data
                const img_preview   = <img src={photo_base64} className={`slide_preview`} alt={`preview`} />;

                const vote_type     = session_context.data.project_info.thumbs === 2 ? "smilies" : "thumbs";
                const vote_good     = photo.goodbad === 2 || photo.goodbad === 3 ? <span className={`icon ${vote_type} up`}>smile</span> : "";
                const vote_bad      = photo.goodbad === 1 || photo.goodbad === 3 ? <span className={`icon ${vote_type} down`}>frown</span> : "";
                const has_text      = photo.text_comment !== "" ? <span className={`icon keyboard`}>keyboard</span> : "";
                const has_audios    = Object.keys(photo.audios).length
                    ? Object.keys(photo.audios).map((audio_name, idx) => {
                        return <Button
                            key={idx}
                            className="icon audio"
                            onClick={(e) => { handleAudio(e, doc_id + "_" + audio_name); }}
                        >{idx + 1}</Button>;
                    })
                    : "";

                const audioPreloads = Object.keys(photo.audios).reduce((acc, audio_i) => {
                    const audio_name    = doc_id + "_" + audio_i;
                    acc[audio_name]     = getFileByName(files, audio_name);
                    return acc;
                }, {});

                const has_tags = photo.hasOwnProperty("tags") && photo.tags.length ? <span className={`icon tags`}>{photo.tags.length}</span> : "";

                return {
                    "photo_id": index,
                    "img_preview": img_preview,
                    "photo_base64": photo_base64,
                    "vote_good": vote_good,
                    "vote_bad": vote_bad,
                    "has_text": has_text,
                    "has_audios": has_audios,
                    "has_tags": has_tags,
                    "audioPreloads" : audioPreloads
                };
            });

            return summ_preview;
        }

        if (session_context.slideOpen) {
            if (!session_context.data.in_walk && session_context.previewWalk) {
                // Fetch and update data for preview walk
                db_walks.walks.get(session_context.previewWalk).then(walk_preview => {
                    const doc_id = walk_preview.project_id + "_" + walk_preview.user_id + "_" + walk_preview.timestamp;
                    prepSummary(doc_id, walk_preview.photos).then(summ_preview => {
                        setWalkSumm(summ_preview);

                        const allAudioPreloads = summ_preview.reduce((acc, item) => {
                            return { ...acc, ...item.audioPreloads };
                        }, {});

                        console.log("summ_preview from uploadsumm", summ_preview);
                        setWalkAudios(allAudioPreloads);
                    });
                });
            } else if (walk_context.data.photos.length) {
                // Fetch and update data for current walk
                const walk = walk_context.data;
                const doc_id = walk.project_id + "_" + walk.user_id + "_" + walk.timestamp;
                prepSummary(doc_id, walk.photos).then(summ_preview => {
                    setWalkSumm(summ_preview);

                    const allAudioPreloads = summ_preview.reduce((acc, item) => {
                        return { ...acc, ...item.audioPreloads };
                    }, {});

                    console.log("summ_preview current walk", summ_preview);
                    setWalkAudios(allAudioPreloads);
                });
            }
        }
    }, [session_context.slideOpen, session_context.data.in_walk, session_context.previewWalk, walk_context.data.photos]);

    const handleAudio = (e, audio_name) => {
        e.preventDefault();
        const audioElement = audioRef.current;
        const currentWalkAudios = walkAudiosRef.current;

        if (audioElement && currentWalkAudios.hasOwnProperty(audio_name)) {
            const audioData = currentWalkAudios[audio_name];
            const blob = new Blob([audioData.buffer], { type: audioData.type }); // Create Blob from ArrayBuffer and MIME type

            if (blob instanceof Blob) {
                const url = URL.createObjectURL(blob);
                console.log("is there walk audio?", audio_name, blob, currentWalkAudios, url);

                if (audioElement.canPlayType(blob.type)) {
                    e.target.classList.toggle('playing', !audioPlaying);
                    if (audioPlaying) {
                        audioElement.pause();
                        setAudioPlaying(null);
                    } else {
                        audioElement.src = url;
                        audioElement.play()
                            .then(() => setAudioPlaying(audio_name))
                            .catch(err => console.error("Error playing audio:", err));
                    }

                    audioElement.onended = () => {
                        URL.revokeObjectURL(url);
                        setAudioPlaying(null);
                        e.target.classList.remove('playing');
                    };
                } else {
                    console.error('Audio format not supported:', blob.type);
                }
            } else {
                console.error('Invalid audio blob:', blob);
            }
        }
    };

    const handleClose = () => {
        session_context.setSlideOpen(false);
    }

    const downloadPhotos = async () => {
        const zip = new JSZip();
        const photoFolder = zip.folder("photos");
        const audioFolder = zip.folder("audios"); // Create a folder for audios

        // Loop over walkSumm and gather photos
        for (const item of walkSumm) {
            const base64Data = item.photo_base64.split(",")[1];
            const photoBlob = await fetch(item.photo_base64).then(response => response.blob());
            photoFolder.file(`photo_${item.photo_id}.jpg`, photoBlob, { binary: true });
        }

        // Loop over walkAudios and gather audios
        for (const [audioName, audioBlob] of Object.entries(walkAudios)) {
            audioFolder.file(`${audioName}`, audioBlob, { binary: true });
        }

        // Prepare walk metadata as JSON
        const walkMetadata = await db_walks.walks.get(session_context.previewWalk);
        const metadataStr = JSON.stringify(walkMetadata, null, 2); // Convert to a formatted JSON string
        const metadataBlob = new Blob([metadataStr], { type: "application/json" });
        zip.file("walk_metadata.json", metadataBlob); // Add metadata JSON to the zip

        // Generate zip and trigger download
        zip.generateAsync({ type: "blob" }).then(blob => {
            saveAs(blob, "photos_and_audios.zip");
        });
    }


    const walk_summary_text = session_context.getTranslation("walk_summary");
    const project_text      = session_context.getTranslation("project");
    const walkid_text       = session_context.getTranslation("walk_id");
    const no_photos_text    = session_context.getTranslation("no_photos_yet");


    return (<Slider
                isOpen={session_context.slideOpen}
                position="right"
                onClose={handleClose}
                onOutsideClick={handleClose}
                size={300}
                duration={500}
            >
                <div className={`slideout`}>
                    <hgroup>
                        <h2>{walk_summary_text}</h2>
                        <h4>{project_text} : {summProjectID}  | {walkid_text} : {summWalkID}</h4>
                        <XCircle className={`close_slider`} color="#bbb" size={30} onClick={handleClose}/>
                    </hgroup>
                    {
                        !walkSumm.length
                            ? <em>{no_photos_text}</em>
                            : walkSumm.map((item,idx) => {
                                return (<PhotoList key={idx} data={item} closeSlideOut={handleClose}/>)
                            })
                    }

                    { walkSumm.length ? <Button onClick={downloadPhotos}>Download All Photos & Audios</Button> : "" }

                    <audio ref={audioRef} hidden></audio>
                </div>
            </Slider>)
}

export default SlideOut;
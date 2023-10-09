import { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from 'react-bootstrap';
import  Slider  from 'react-slide-out';
import 'react-slide-out/lib/index.css';
import { XCircle } from 'react-bootstrap-icons';


import { SessionContext } from "../contexts/Session";
import { WalkContext } from "../contexts/Walk";
import { db_walks, db_files } from "../database/db";
import { buildFileArr, shallowMerge, getFileByName } from "./util";

import "../assets/css/slideout.css";

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

    useEffect(() => {
        async function prepSummary(doc_id, photos){
            // Query the database for records where fileName matches any value in the array
            const files_arr = buildFileArr(doc_id, photos);
            const files     = await db_files.files.where('name').anyOf(files_arr).toArray();

            const summ_preview  = photos.map((photo, index) => {
                //use dexie to get photo + audio
                const photo_name    = doc_id + "_" + photo.name;
                const photo_base64  = getFileByName(files, photo_name);

                for(let audio_i in photo.audios){
                    const audio_name        = doc_id + "_" + audio_i;
                    const update_obj        = {};
                    update_obj[audio_name]  = getFileByName(files, audio_name);
                    //oh now shallowMerge works, but not deepMerge?  FML
                    const copy_audios       = shallowMerge(walkAudios, update_obj);
                    setWalkAudios(copy_audios);
                }

                const img_preview   = <img src={photo_base64} className={`slide_preview`} alt={`preview`}/>;
                const has_audios    = Object.keys(photo.audios).length
                    ? Object.keys(photo.audios).map((audio_name, idx) => {
                        return <Button
                            key={idx}
                            className="icon audio"
                            onClick={(e) => {
                                handleAudio(e, doc_id + "_" + audio_name) }
                            }>{idx + 1 }</Button>
                    })
                    : "";

                const vote_type     = session_context.data.project_info.thumbs === 2 ? "smilies" : "thumbs";
                const vote_good     = photo.goodbad === 1 || photo.goodbad === 3 ? <span className={`icon ${vote_type} up`}>smile</span> : "";
                const vote_bad      = photo.goodbad === 2 || photo.goodbad === 3 ? <span className={`icon ${vote_type} down`}>frown</span> : "";
                const has_text      = photo.text_comment !== "" ? <span className={`icon keyboard`} >keyboard</span> : "";
                const has_tags      = photo.hasOwnProperty("tags") && photo.tags.length ? <span className={`icon tags`}>{photo.tags.length}</span> : "";

                return {"photo_id" : index ,"img_preview" : img_preview, "vote_good" : vote_good, "vote_bad" : vote_bad, "has_text": has_text, "has_audios" : has_audios, "has_tags" : has_tags}
            });

            //SAVE IT TO STATE
            setWalkSumm(summ_preview);
        };

        //TODO CONSOLIDATE THESE
        if(!session_context.data.in_walk && session_context.previewWalk){
            async function getWalkSummary(){
                const walk_preview  = await db_walks.walks.get(session_context.previewWalk);
                setSummProjectID(walk_preview.project_id);
                setSummWalkID(walk_preview.walk_id);

                const doc_id    = walk_preview.project_id + "_" + walk_preview.user_id + "_" + walk_preview.timestamp;
                prepSummary(doc_id, walk_preview.photos);
            }
            getWalkSummary();
        }

        if(walk_context.data.photos.length){
            const walk = walk_context.data;
            setSummProjectID(walk.project_id);
            setSummWalkID(walk.walk_id);

            const doc_id = walk.project_id + "_" + walk.user_id + "_" + walk.timestamp ;
            prepSummary(doc_id, walk.photos);
        }
    },[session_context.data.in_walk, session_context.data.project_info.thumbs, session_context.previewWalk, walk_context.data.photos, walkAudios]);

    const handleAudio = (e, audio_name) => {
        //TODO ,THIS IS SAME CODE AS IN Photo_detail, maybe move it UP to context?... or?
        e.preventDefault();
        if(e.target.classList.contains("playing")){
            //if playing then stop and remove css
            const audio = audioPlaying;
            if(audio){
                e.target.classList.remove('playing');
                audio.pause();
                audio.remove();
            }
            setAudioPlaying(null);
        }else{
            //if not playing then play, and add class "playing"
            if(walkAudios.hasOwnProperty(audio_name)){
                e.target.classList.add('playing');
                const blob  = walkAudios[audio_name];
                const url   = URL.createObjectURL(blob);
                const audio = document.createElement('audio');
                audio.src   = url;
                audio.setAttribute('id', 'temporary_audioplayer');
                audio.addEventListener("ended", () => {
                    e.target.classList.remove('playing');
                }, false);
                audio.play();
                setAudioPlaying(audio);
            }
        }
    }

    const handleClose = () => {
        session_context.setSlideOpen(false);
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
                            ? (<em>{no_photos_text}</em>)
                            : walkSumm.map((item,idx) => {
                                return (<PhotoList key={idx} data={item} closeSlideOut={handleClose}/>)
                            })
                    }
                </div>
            </Slider>)
}

export default SlideOut;
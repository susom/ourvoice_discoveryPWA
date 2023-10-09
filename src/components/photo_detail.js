import { useEffect, useState, useContext } from "react";
import { Link } from "react-router-dom";
import { Container, Row, Col, Button } from 'react-bootstrap';

import { db_walks, db_files } from "../database/db";
import { updateContext, hasGeo, cloneDeep, getFileByName, buildFileArr, shallowMerge } from "../components/util";

import { SessionContext } from "../contexts/Session";
import { WalkContext } from "../contexts/Walk";
import AudioRecorderWithIndexDB from "../components/audio_recorder";

import PermissionModal from './device_permisssions';

import icon_walk from "../assets/images/icon_walk.png";

function ViewBox(props){
    return (
        <div className={`consent`}>
            {props.children}
        </div>
    );
}

function PhotoDetail({setDataUri, dataUri, viewPhotoDetail, setViewPhotoDetail}){
    const session_context   = useContext(SessionContext);
    const walk_context      = useContext(WalkContext);

    const [upVote, setUpVote]               = useState(false);
    const [downVote, setDownVote]           = useState(false);
    const [showText, setShowText]           = useState(false);
    const [textComment, setTextComment]     = useState("");
    const [audios, setAudios]               = useState({});
    const [tags, setTags]                   = useState([]);
    const [rotate, setRotate]               = useState(null);
    const [spotGeo, setSpotGeo]             = useState({});
    const [photoPreview, setPhotoPreview]   = useState(icon_walk);
    const [audioPlaying, setAudioPlaying]   = useState(null);

    const [existingFiles, setExistingFiles] = useState([]);
    const has_audio_comments                = session_context.data.project_info.hasOwnProperty("audio_comments") && session_context.data.project_info["audio_comments"];

    useEffect(() => {
        if(hasGeo()){
            navigator.geolocation.getCurrentPosition(function(position) {
                const geoDataPhoto = {latitude : position.coords.latitude, longitude : position.coords.longitude};
                setSpotGeo(geoDataPhoto);
            });
        }

        if(dataUri !== null) {
            setPhotoPreview(dataUri);
        }

        if(viewPhotoDetail !== null){
            async function preparePreview(){
                clearStates();
                setDataUri(null);

                let doc_id;
                let photo;

                if(session_context.previewWalk !== null){
                    const walk_preview  = await db_walks.walks.get(session_context.previewWalk);
                    doc_id      = walk_preview.project_id + "_" + walk_preview.user_id + "_" + walk_preview.timestamp;
                    photo       = walk_preview.photos[viewPhotoDetail];
                    session_context.setPreviewWalkID(walk_preview.walk_id);
                    session_context.setPreviewProjID(walk_preview.project_id);
                }else{
                    doc_id      = walk_context.data.project_id + "_" + walk_context.data.user_id + "_" + walk_context.data.timestamp;
                    photo       = walk_context.data.photos[viewPhotoDetail];
                }

                const files_arr = buildFileArr(doc_id,[photo]);
                const files     = await db_files.files.where('name').anyOf(files_arr).toArray();

                const photo_name    = doc_id + "_" + photo.name;
                const photo_base64  = getFileByName(files, photo_name);
                setPhotoPreview(photo_base64);

                //stash the existing files to compare later incase adding more files via slide out edit
                const existing_files_array = [...Object.keys(photo.audios), photo.name];
                setExistingFiles(existing_files_array);
                for(let audio_i in photo.audios){
                    const audio_name        = doc_id + "_" + audio_i;
                    const update_obj        = {};
                    update_obj[audio_i]     = getFileByName(files, audio_name);
                    const copy_audios       = shallowMerge(audios, update_obj);
                    setAudios(copy_audios);
                }

                if(photo.goodbad === 1 || photo.goodbad === 3){
                    setUpVote(true);
                }
                if(photo.goodbad === 2 || photo.goodbad === 3){
                    setDownVote(true);
                }
                setTags(photo.tags);
                setTextComment(photo.text_comment);
            }
            preparePreview();
        }
    },[dataUri, viewPhotoDetail, walk_context.data.project_id, walk_context.data.user_id, walk_context.data.timestamp, walk_context.data.photos, audios]);

    const clearStates = () => {
        setUpVote(false);
        setDownVote(false);
        setShowText(false);
        setTextComment(null);
        Object.keys(audios).forEach(key => delete audios[key]);
        setAudios(audios);
        setTags([]);
        setRotate(null)
        setSpotGeo({});
        setDataUri(null);
    }

    const voteClick = (e, isUp) => {
        e.preventDefault();
        if(isUp){
            setUpVote(!upVote);
        }else{
            setDownVote(!downVote);
        }
    }

    const saveTag = (e, item) => {
        e.preventDefault();
        const tags_copy = [...tags];
        tags_copy.push(item);
        setTags(tags_copy);
    }

    const savePhoto = (e,_this) => {
        e.preventDefault();
        const files_to_save = [];

        const photos        = cloneDeep(walk_context.data.photos);
        const photo_i       = session_context.previewPhoto !== null ? session_context.previewPhoto  : photos.length;
        const photo_name    = "photo_" + photo_i + ".jpg";
        const photo_id      = walk_context.data.project_id + "_" + walk_context.data.user_id + "_" + walk_context.data.timestamp + "_" + photo_name;

        if(!existingFiles.includes(photo_name)){
            //if existing photo , then dont resave the file to indexdb
            files_to_save.push({"name" : photo_id, "file" : dataUri});
        }

        const audio_names   = {};
        for(let audio_name in audios){
            audio_names[audio_name] = "";
            let audio_id = walk_context.data.project_id + "_" + walk_context.data.user_id + "_" + walk_context.data.timestamp + "_" + audio_name;

            if(!existingFiles.includes(audio_name)){
                files_to_save.push({"name" : audio_id, "file" : audios[audio_name]});
            }
        }

        const upvote_val    = upVote ? 1 : 0;
        const downvote_val  = downVote ? 2 : 0;

        const this_photo    = {
            "audios" : audio_names,
            "geotag" : spotGeo,
            "goodbad" : upvote_val + downvote_val,
            "name" : "photo_" + photo_i + ".jpg",
            "rotate" : rotate,
            "tags" : tags,
            "text_comment" : textComment,
            "timestamp": Date.now()
        }

        if(session_context.previewPhoto === null) {
            photos.push(this_photo);
        }else{
            photos[session_context.previewPhoto] = this_photo;
        }
        updateContext(walk_context, {"photos": photos});

        const update_walk = async () => {
            try {
                const walk_prom         = await db_walks.walks.put(walk_context.data).then(() => {
                    // console.log(walk_context.data.id, "walk_context already got an id from og add/put, so re-put the walk_context should update new data");
                    walk_context.setPhotoCount(walk_context.data.photos.length);
                });

                const bulk_upload_prom  = await db_files.files.bulkPut(files_to_save).then(() => {
                    // console.log(files_to_save.length , "files saved to ov_files indexDB");
                }).catch((error) => {
                    console.log('Error saving files', error);
                });

                return [walk_prom, bulk_upload_prom];
            } catch (error) {
                console.log(`Failed to add ${walk_context.data.walk_id}: ${error}`);
            }
        };
        update_walk();

        clearStates();
        session_context.setPreviewWalk(null);
        session_context.setPreviewPhoto(null);
        e.stopPropagation();
        return true;
    }

    const deletePhoto = (e,_this) => {
        e.preventDefault();
        clearStates();
        session_context.setPreviewWalk(null);
        session_context.setPreviewPhoto(null);
    }

    const handleAudio = (e, audio_name) => {
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
            if(audios.hasOwnProperty(audio_name)){
                e.target.classList.add('playing');
                const blob  = audios[audio_name];
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

    const why_this_text     = session_context.getTranslation("why_this_photo");
    const what_about_text   = session_context.getTranslation("project_tags");
    const good_or_bad_text  = session_context.getTranslation("good_or_bad");
    const choose_one_text   = session_context.getTranslation("chose_one");
    const delete_text       = session_context.getTranslation("delete");
    const save_text         = session_context.getTranslation("save");
    const no_tags_text      = session_context.getTranslation("no_tags");
    const no_edit_text      = session_context.getTranslation("no_edit");

    return (
        <ViewBox>
            {
                <Container className="content walk photo_detail">
                    <Row id="pic_review" className="panel">
                        <Col className="content">


                            <Container>
                                <Row className="recent_pic">
                                    <Col>
                                        <img src={photoPreview} id="recent_pic" alt="current"/>
                                    </Col>
                                </Row>

                                <Row>
                                    <Col xs={{span: 12}} className="consentbox">
                                        {why_this_text}
                                    </Col>
                                </Row>

                                <Row className="audio_text">
                                    <Col xs={{span: 3}} className="text_text">
                                    <a href="/#" className={`btn daction keyboard ${textComment !== "" && textComment !== null ? "edit" : ""}`} onClick={(e)=>{
                                            e.preventDefault();
                                            setShowText(!showText);
                                            document.getElementById("text_comment").focus();
                                        }}>keyboard</a>
                                    </Col>
                                    <Col xs={{span: 9}} className="record_audio">
                                        {
                                            session_context.data.project_info["audio_comments"] ? (
                                                <>
                                                    <PermissionModal permissionNames={["audio"]} />
                                                    <AudioRecorderWithIndexDB stateAudios={audios} stateSetAudios={setAudios}/>

                                                    <div id="saved_audio">
                                                        {
                                                            Object.keys(audios).map((key, idx) => {
                                                                return <a href="/#" className="saved" key={key} onClick={(e) => { handleAudio(e, key) }}>{idx+1}</a>
                                                            })
                                                        }
                                                    </div>
                                                </>
                                            )
                                            : ""
                                        }
                                    </Col>

                                </Row>

                                <Row className={`text_comment  ${showText ? "showit" : ""}`}>
                                    <Col xs={{span: 12}}>
                                        <textarea id="text_comment"
                                                  defaultValue={textComment}
                                                  onBlur={(e)=>{
                                            setShowText(false);
                                            setTextComment(e.target.value);
                                        }}></textarea>
                                    </Col>
                                </Row>

                                {
                                    session_context.data.project_info.show_project_tags
                                        ?<div>
                                            <Row className="project_tags">
                                                <Col xs={{span: 12}} className="consentbox">{what_about_text}
                                                </Col>
                                            </Row>
                                            <Row className="project_tags">
                                            {
                                                session_context.data.project_info.tags.length
                                                    ? <Col id="project_tags" xs={{span: 12}}>
                                                        {session_context.data.project_info.tags.map((item)=>(
                                                            <a href="/#" className={`project_tag ${tags.includes(item) ? 'on' : ''}`} key={item} onClick={(e)=> {
                                                                saveTag(e, item);
                                                            }}>{item}</a>
                                                        ))}
                                                    </Col>
                                                    : <Col id="no_tags" xs={{span: 12}}><em>{no_tags_text}</em></Col>
                                            }
                                            </Row>
                                        </div>
                                        : ""
                                }


                                <Row>
                                    <Col xs={{span: 12}} className="consentbox">{good_or_bad_text}
                                    </Col>
                                </Row>

                                <Row className="goodbad votes smilies">
                                    <Col xs={{span: 4}}><a href="/#"
                                                                      className={`vote up smilies ${upVote ? 'on' : ''} `}
                                                                      onClick={(e) => voteClick(e, 1)}>up</a></Col>
                                    <Col xs={{span: 4}} className="jointext">{choose_one_text}</Col>
                                    <Col xs={{span: 4}}><a href="/#"
                                                                      className={`vote down smilies ${downVote ? 'on' : ''}`}
                                                                      onClick={(e) => voteClick(e, 0)}>down</a></Col>
                                </Row>

                                <Row className="btns buttons">
                                    {
                                        session_context.previewWalk == null
                                        ? (<><Col xs={{span: 5}}>
                                            <Button
                                                className="delete"
                                                variant="primary"
                                                as={Link} to="/walk"
                                                onClick={(e) => {
                                                    deletePhoto(e);
                                                }}
                                            >{delete_text}</Button>
                                        </Col>
                                        <Col xs={{span: 5, offset: 2}}>
                                            <Button
                                                className="save"
                                                variant="primary"
                                                as={Link} to="/walk"
                                                onClick={(e) => {
                                                    savePhoto(e);
                                                }}
                                            >{save_text}</Button>
                                        </Col></>)
                                        : <em>{no_edit_text}</em>
                                    }
                                </Row>
                            </Container>
                        </Col>
                    </Row>
                </Container>
            }
        </ViewBox>
    )
}

export default PhotoDetail;
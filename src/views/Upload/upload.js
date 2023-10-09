import { useEffect, useState, useContext } from "react";
import { Container, Row, Col } from 'react-bootstrap';
import { CloudUploadFill, CloudUpload} from 'react-bootstrap-icons';

import {db_files, db_logs, db_project, db_walks} from "../../database/db";
import {SessionContext} from "../../contexts/Session";

import {tsToYmd, updateContext} from "../../components/util";

import "../../assets/css/view_upload.css";
import icon_camera_black from "../../assets/images/icon_camera_black.png";
import icon_audio_comment_black from "../../assets/images/icon_audio_comment_black.png";
function ViewBox(props){
    const [walks, setWalks] = useState(props.walks);
    const session_context   = useContext(SessionContext);

    useEffect(() => {
        setWalks(props.walks);
    }, [props.walks]);

    const instructions_upload_text  = session_context.getTranslation("instructions_upload");
    const data_uploaded_text        = session_context.getTranslation("data_uploaded");
    const data_pending_text         = session_context.getTranslation("data_pending");
    const date_text                 = session_context.getTranslation("date");
    const project_text              = session_context.getTranslation("project");
    const id_text                   = session_context.getTranslation("walk_id");
    const status_text               = session_context.getTranslation("upload_status");
    const delete_stored_text        = session_context.getTranslation("delete_all_data");

    const clearLocal    = () => {
        if(window.confirm('All Discovery Tool data saved on this device will be deleted and reset. Click \'Ok\' to proceed.')){
            //TRUNCATE ALL FOUR LOCAL INDEXDBs'
            db_project.table("active_project").clear();
            db_walks.table("walks").clear();
            db_files.table("files").clear();
            db_logs.table("logs").clear();
            localStorage.clear();

            //RESET UI BY CHANGING SIGN IN /OUT STATE
            updateContext(session_context, {"project_id" : null, "project_info" : {}});
            props.setWalks([]);
        }
    }
    const countAudios   = (photos) => {
        let count = 0;
        for (let i in photos) {
            if (photos[i].hasOwnProperty("audios")) {
                count += Object.keys(photos[i].audios).length;
            }
        }
        return count;
    }
    const countTexts    = (photos) => {
        let count = 0;
        for (let i in photos) {
            if (photos[i].text_comment !== "") {
                count ++;
            }
        }
        return count;
    }

    return (

            <Container className="content upload">
                <Row className={`upload_desc`}>
                    <Col>
                        <p className="instructions_upload">
                            <span>{instructions_upload_text}</span>
                        </p>
                        <span><CloudUploadFill className={`color_success`}/> {data_uploaded_text}</span> <span> | </span> <span><CloudUpload className={`color_pending`}/> {data_pending_text}</span>
                    </Col>
                </Row>

                <Row className={`table_header`}>
                    <Col sm={{span:2}} xs={{span:2}}><span>{date_text}</span></Col>
                    <Col sm={{span:2}} xs={{span:2}}><span>{project_text}</span></Col>
                    <Col sm={{span:2}} xs={{span:2}}><span>{id_text}</span></Col>
                    <Col sm={{span:2}} xs={{span:2}}><span><img alt='' className={`hdr_icon`} src={icon_camera_black}/></span></Col>
                    <Col sm={{span:2}} xs={{span:2}}><span><img alt='' className={`hdr_icon`} src={icon_audio_comment_black}/></span></Col>
                    <Col sm={{span:2}} xs={{span:2}}><span>{status_text}</span></Col>
                </Row>

                {walks.map(item => {
                    if(!item.photos.length){
                        return false;
                    }
                    return (
                        <Row className={`table_row list_data`} key={item.id}>
                            <Col sm={{span:2}}  xs={{span:2}}>{tsToYmd(item.timestamp)}</Col>
                            <Col sm={{span:2}}  xs={{span:2}}>{item.project_id}</Col>
                            <Col sm={{span:2}}  xs={{span:2}} className={`walkid`} onClick={(e) => {
                                e.preventDefault();
                                session_context.setPreviewWalk(item.id);
                                session_context.setSlideOpen(true);
                            }}>{item.walk_id}</Col>
                            <Col sm={{span:2}}  xs={{span:2}}>{item.photos.length}</Col>
                            <Col sm={{span:2}}  xs={{span:2}}>{countAudios(item.photos) + countTexts(item.photos)}</Col>
                            <Col sm={{span:2}}  xs={{span:2}}>{item.uploaded ? <CloudUploadFill className={'color_success'}/> : <CloudUpload className={'color_pending'}/>}</Col>
                        </Row>
                    )
                })}

                
            </Container>

    )
}

export function Upload(){
    const [walks, setWalks]         = useState([]);
    const { lastUploadsUpdated, updateLastUploadsUpdated } = useContext(SessionContext);

    // In your Upload component
    useEffect(() => {
        // Define a function to handle the custom event
        const handleIndexedDBChange = () => {
            updateLastUploadsUpdated(Date.now());
        };

        // Add an event listener for the custom event
        window.addEventListener('indexedDBChange', handleIndexedDBChange);

        // Remove the event listener when the component unmounts
        return () => {
            window.removeEventListener('indexedDBChange', handleIndexedDBChange);
        };
    }, []);

    useEffect(() => {
        // Query the object store to get the number of records
        const walks_col = db_walks.walks.toCollection();

        walks_col.count().then(count => {
            if (count > 0) {
                walks_col.toArray(( arr_data) => {
                    console.log(count, "walks");
                    setWalks(arr_data);
                });
            }else{
                console.log("no walks in DB");
            }
        }).catch(error => {
            console.error('Error counting walks:', error);
        });
    },[lastUploadsUpdated]);

    return (
        <ViewBox walks={walks} setWalks={setWalks}/>
    )
};

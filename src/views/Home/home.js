import {useEffect, useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from 'react-bootstrap';

import {db_walks, db_project, db_files, db_logs} from "../../database/db";
import { collection, getDocs, collectionGroup, doc,  where, query } from "firebase/firestore";
import {firestore, auth} from "../../database/Firebase";


import {WalkmapContext} from "../../contexts/Walkmap";
import {SessionContext} from "../../contexts/Session";
import {WalkContext} from "../../contexts/Walk";

import AlertModal from "../../components/modal";
import HomeLead from "../../components/home_lead";

import {updateContext, tsDiffInHours} from "../../components/util";

import "../../assets/css/view_home.css";
import PermissionModal from '../../components/device_permisssions';

// service worker caching doesnt seem to be working.
// will load these essential images here since the user absolutely must be online
// to sign in at this point before the app can be usable offline
import pic_walk_with_another from "../../assets/images/pic_walk_with_another.png";
import pic_danger_2 from "../../assets/images/pic_danger_2.png";
import pic_no_faces from "../../assets/images/pic_no_faces.png";
import pic_ask_help from "../../assets/images/pic_ask_help.png";
import icon_smilies from "../../assets/images/icon_smilies.png";

function ViewProjectDetails(props){
    const session_context           = useContext(SessionContext);
    const walk_context              = useContext(WalkContext);
    const [status, setStatus]       = useState("");
    const [language, setLanguage]   = useState([{"lang" : "en", "language" : "English"}]);

    //IF previously logged in , should have session info for project
    useEffect(() => {
        if(session_context.data.project_info.languages){
            setLanguage(session_context.data.project_info.languages);
        }
    }, [session_context.data.project_info.languages]); // dependencies array


    async function checkLogin(){
        let upperCasePcode = props.pcode.toUpperCase();

        const q = query(collection(firestore, "ov_projects")
            , where("code", "==", upperCasePcode)
            , where("project_pass", "==", props.pword)
        );

        const snapshots = await getDocs(q);
        if(!snapshots.empty && snapshots.size){
            snapshots.forEach((doc) => {
                if (doc.exists() ){
                    const data = doc.data();
                    //MAKE SURE NOT ARCHIVED (can't use in where query above cause firestore cant query for field that is potentially not existing)

                    if(!data.hasOwnProperty("archived")){
                        setStatus("");
                        props.projectSignInOut(true);

                        const active_project_data = {
                            project_id              : upperCasePcode,
                            audio_comments          : parseInt(doc.get("audio_comments")),
                            custom_take_photo_text  : doc.get("custom_take_photo_text"),
                            expire_date             : doc.get("expire_date"),
                            languages               : doc.get("languages"),
                            name                    : doc.get("name"),
                            project_created         : doc.get("project_created"),
                            project_email           : doc.get("project_email"),
                            show_project_tags       : data.hasOwnProperty("show_project_tags") ? parseInt(doc.get("show_project_tags")) : 0,
                            tags                    : data.hasOwnProperty("tags") ? doc.get("tags") : [],
                            text_comments           : parseInt(doc.get("text_comments")),
                            thumbs                  : parseInt(doc.get("thumbs")),
                            ov_meta                 : session_context.translations,
                            timestamp               : Date.now()
                        };

                        setLanguage(active_project_data.languages);

                        //TODO GET ov_meta AND PUT IN AP too
                        updateActiveProject(active_project_data);
                    }else{
                        setStatus("Invalid Project Id or Project Passcode");
                        props.setPword("");
                    }
                }
            });
        }else{
            setStatus("Invalid Project Id or Project Passcode");
            props.setAlertMessage({"title" : "Pleas try again", "body" : "Wrong Project ID or Passcode", "cancel_txt" : "Close" , "ok_txt" : ""});
            props.setShowModal(true);
            props.setPword("");
        }
    }

    async function updateActiveProject(active_project_data) {
        try {
            db_project.active_project.clear();
            await db_project.active_project.add(active_project_data).then(() => {
                setStatus("");
            });

            props.setPcode(active_project_data.project_id);
            updateContext(session_context, { "project_info" : active_project_data, "project_id" : active_project_data.project_id });
            updateContext(walk_context, {"project_id" : active_project_data.project_id});
        } catch (error) {
            console.log(`Failed to add ${props.pcode}: ${error}`);
        }
    }

    const getPostInfo = async (e) => {
        e.preventDefault();

        let upperCasePcode = props.pcode.toUpperCase();

        if(upperCasePcode !== "" && props.pword !== ""){

            const active_project = db_project.active_project.where({project_id: upperCasePcode}).first();
            active_project.then(async function(project_data) {
                const diff_hours = project_data ? tsDiffInHours(project_data["timestamp"] , Date.now()) : 999;
                if(diff_hours <= 24){
                    setStatus("");
                    props.projectSignInOut(true);
                    updateContext(session_context, {"project_id" : project_data.project_id});
                    updateContext(walk_context, {"project_id" : project_data.project_id});
                }else{
                    // console.log("there is no active project or the 24 hour period has expired");
                    if(navigator.onLine){
                        // console.log("May or May not have active project, but ONLINE so check server for fresh project data", session_context.data);
                        // if online pull new copy, if offline continue using the stale one for now until next refresh.
                        await checkLogin();
                    }else{
                        //is offline
                        console.log("May or May not have active project, OFFLINE so auto login", session_context.data);
                    }
                }
            }).catch(function(error) {
                // Handle error
                console.log("IndexDB query error? active_project", error);
            });
        }
    };

    const project_id_text       = session_context.getTranslation("project_id");
    const passcode_text         = session_context.getTranslation("password");
    const language_text         = session_context.getTranslation("language");

    let pw_or_language = props.signedIn  ? (
        <label><span>{language_text}</span>
            <span className="input_field">
                {language ? (
                    <select onChange={ (e) => session_context.handleLanguageChange(e.target.value) } value={session_context.selectedLanguage}>
                        {language.map((lang) => (
                            <option key={lang.lang} value={lang.lang}>
                                {lang.language}
                            </option>
                        ))}
                    </select>
                ) : (
                    <p>Loading languages...</p>
                )}
            </span>
        </label>
    ) : (
        <label><span>{passcode_text}</span>
            <span className="input_field"><input type="text" onChange={ e => props.setPword(e.target.value)} value={props.pword} placeholder='eg; 1234' autoComplete="off"/></span>
        </label>
    );

    return (
        <form id="signin_project" className="project_setup_form" onSubmit={getPostInfo} autoComplete="off">
            <div className="project_login">
                <p className="signin_status">{status}</p>
                <label><span>{project_id_text}</span>
                    <span className="input_field"><input type="text" className={props.signedIn ? "signedIn" : ""} disabled={props.signedIn && session_context.data.project_id !== null ? true : false} onChange={ e => props.setPcode(e.target.value) } value={props.pcode.toUpperCase()} placeholder='eg; ABCD'/></span>
                </label>
                {pw_or_language}
            </div>
        </form>
    );
}

function Actions(props){
    const session_context       = useContext(SessionContext);
    const walk_context          = useContext(WalkContext);

    const [clicks, setClicks]   = useState(0);

    const onClickDeleteInc = () => {
        setClicks(clicks+1);
        if(clicks === 10){


            if(window.confirm('All Discovery Tool data saved on this device will be deleted and reset. Click \'Ok\' to proceed.')){
                console.log("truncate followind DB; db_walks, db_project, db_logs, localStorage");

                //TRUNCATE ALL THREE LOCAL INDEXDBs'
                db_project.table("active_project").clear();
                db_walks.table("walks").clear();
                db_files.table("files").clear();
                db_logs.table("logs").clear();
                localStorage.clear();

                //RESET UI BY CHANGING SIGN IN /OUT STATE
                updateContext(session_context, {"project_id" : null, "project_info" : {}});
                props.projectSignInOut(false);
            }
            //RESET CLICK COUNT TO 0
            setClicks(0);
        }
    }

    const startConsent = (e) => {
        //DONT NEED ANYTHING HERE
    }
    const signInProject = (e) => {
        //DONT NEED ANYTHING HERE?
        // console.log("sign in project");
    }

    const changeProject = (e) => {
        props.projectSignInOut(false);
        updateContext(session_context, {"project_id" : null});
        updateContext(walk_context, {"project_id" : null});
        // console.log("change project");
    }

    const start_walk_text       = session_context.getTranslation("start");
    const change_project_text   = session_context.getTranslation("change_project");
    const view_data_text        = session_context.getTranslation("view_upload");
    const setup_text            = session_context.getTranslation("setup_project");
    const clear_db_text         = session_context.getTranslation("truncate_localdb");

    //DO WE STILL NEED AN "upload page"?
    return props.signedIn  ? (
        <div className="home_actions">
            <Button
                className="start_walk project_setup"
                variant="primary"
                as={Link} to="/consent"
                onClick={(e) => {
                    startConsent(e);
                }}
            >{start_walk_text}</Button>

            <Button
                className="change_project project_setup"
                variant="info"
                onClick={(e) => {
                    changeProject(e);
                }}
                as={Link} to="/home"
            >{change_project_text}</Button>

            <Button
                className="upload_data project_setup"
                variant="info"
                as={Link} to="/upload"
            >{view_data_text}</Button>
        </div>
    ) : (
        <div className="home_actions">
            <Button
                form="signin_project"
                type="submit"
                variant="success"
                className="project_setup"
                onClick={(e) => {
                    signInProject(e);
                }}
            >{setup_text}</Button>

            <Button
                variant="warning"
                className="truncate_database"
                onClick={onClickDeleteInc}
            >{clear_db_text}</Button>
        </div>
    );
}

function ViewBox(props){
    const history           = useNavigate();
    const session_context   = useContext(SessionContext);

    const [alertMessage, setAlertMessage]   = useState({});
    const [showModal, setShowModal]         = useState(false);
    const [handleCancel, setHandleCancel]   = useState(() => {
        return () => {
            setShowModal(false);
        }  });
    const [handleOK, setHandleOK]           = useState(() => {
        return () => {
            setShowModal(false);
        } })
    const onSignInOut = (flag) => {
        props.setSignedIn(flag);
        updateContext(session_context, {"signed_in" : flag});
    }
    const onClickNavigate = (view) => {
        history(view);
    }

    return (
            <div className="content home">
                
                <HomeLead signedIn={props.signedIn}/>

                <ViewProjectDetails
                    pcode={props.pcode}
                    setPcode={props.setPcode}
                    pword={props.pword}
                    setPword={props.setPword}

                    setAlertMessage={setAlertMessage}
                    setShowModal={setShowModal}
                    setModalCancel={setHandleCancel}
                    setModalOK={setHandleOK}

                    signedIn={props.signedIn}
                    projectSignInOut={onSignInOut}
                />

                <Actions
                    pcode={props.pcode}
                    setPcode={props.setPcode}
                    pword={props.pword}
                    setPword={props.setPword}

                    setAlertMessage={setAlertMessage}
                    setShowModal={setShowModal}
                    setModalCancel={setHandleCancel}
                    setModalOK={setHandleOK}

                    signedIn={props.signedIn}
                    projectSignInOut={onSignInOut}
                    onClickNav = { onClickNavigate }
                />
                <AlertModal show={showModal} handleCancel={handleCancel} handleOK={handleOK} message={alertMessage}/>
                {/*<PermissionModal permissionNames={["camera","geo"]} />*/}

                <div style={{ width: 0, height: 0, overflow: "hidden", visibility: "hidden" }}>
                    <img src={pic_walk_with_another} alt="Hidden" />
                    <img src={pic_danger_2} alt="Hidden" />
                    <img src={pic_no_faces} alt="Hidden" />
                    <img src={pic_ask_help} alt="Hidden" />
                    <img src={icon_smilies} alt="Hidden" />
                </div>
            </div>
    )
}

export function Home(){
    const walkmap_context           = useContext(WalkmapContext); //THE API NEEDS TO "warm up" SO KICK IT OFF HERE BUT DONT STORE DATA UNTIL 'in_walk'
    const session_context           = useContext(SessionContext);

    const [pcode, setPcode]         = useState("");
    const [pword, setPword]         = useState("");
    const [signedIn, setSignedIn]   = useState(null);

    useEffect(() => {
        //check if there is a recent login to a project and set in session if so
        const active_project_col = db_project.active_project.toCollection();

        // Query the object store to get the number of records
        active_project_col.count().then(count => {
            if (count > 0) {
                const getActiveProject  = async () => {
                    try {
                        const firstRecord = await active_project_col.first();
                        return firstRecord;
                    } catch (error) {
                        console.error('Error getting active project: ', error);
                    }
                }
                const active_project    = getActiveProject();

                active_project.then((ap) => {
                    const diffInHours = tsDiffInHours(ap["timestamp"], Date.now());
                    if(diffInHours<24){
                        // console.log("Project Info in Cache is < 24h, populate Session_context", ap);
                        let session_data = {
                            project_id : ap["project_id"],
                            splash_viewed : true,
                            signed_in : true,
                            project_info : ap
                        };

                        updateContext(session_context, session_data);
                        setPcode(ap["project_id"]);
                        setSignedIn(true);
                    }
                });
            }else{
                // console.log("no active project, need to login");
            }
        }).catch(error => {
            console.error('Error counting records:', error);
        });


    }, [session_context]);

    return (
        <ViewBox signedIn={signedIn} setSignedIn={setSignedIn} pcode={pcode} setPcode={setPcode} pword={pword} setPword={setPword}/>
    )
}
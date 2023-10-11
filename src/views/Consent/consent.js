import {useContext, useState, useEffect} from "react";
import { useNavigate , Link} from 'react-router-dom';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { v4 as uuid } from 'uuid';

import {db_walks} from "../../database/db";
import {WalkContext} from "../../contexts/Walk";
import {SessionContext} from "../../contexts/Session";
import {updateContext} from "../../components/util";

import "../../assets/css/view_consent.css";

import pic_walk_with_another from "../../assets/images/pic_walk_with_another.png";
import pic_danger_2 from "../../assets/images/pic_danger_2.png";
import pic_no_faces from "../../assets/images/pic_no_faces.png";
import pic_ask_help from "../../assets/images/pic_ask_help.png";

function ViewBox(props){
    return (
        <div className="consent_wrap">
            {props.children}
        </div>
    );
}

export function Consent({Navigate}){
    const [curPage, setCurPage] = useState(0);
    const session_context       = useContext(SessionContext);
    const walk_context          = useContext(WalkContext);
    const navigate              = useNavigate();

    useEffect(() => {
        if (!session_context.data.project_id) {
            navigate('/home');
        }
    }, [session_context.data.project_id,navigate]);

    const onClickReturnHome = (e) => {
        e.preventDefault();
    };

    const startWalk = (e) => {
        const unique_id         = uuid();
        const walk_start        = Date.now();
        let walk_id             = walk_start.toString();
        walk_id                 = walk_id.substring(walk_id.length - 4);
        updateContext(walk_context, {"timestamp" : walk_start, "walk_id" : walk_id, "user_id" : unique_id, "project_id" : session_context.data.project_id});
        updateContext(session_context, {"in_walk" : true});

        //save walk now, in case interrupted
        //after every photo, update the indexDB with new photo data...
        //when finish walk, flag it for service worker to pick it up to push
        const save_walk = async () => {
            try {
                const prom = await db_walks.walks.put(walk_context.data).then(() => {
                    // console.log("Walk in indexDB, id was added automagically", walk_context.data.id);
                });

                return prom;
            } catch (error) {
                console.log(`Failed to put walk id ${walk_id}: ${error}`);
            }
        };
        save_walk();
    }


    //translations
    const welcome_text          = session_context.getTranslation("consent_greet");
    const consent_info1_text    = session_context.getTranslation("consent_info_1");
    const consent_info2_text    = session_context.getTranslation("consent_info_2");
    const agree_btn_text        = session_context.getTranslation("understand_agree");

    const safety_text           = session_context.getTranslation("saftey_tips");
    const safety_1_text         = session_context.getTranslation("saftey_tips_1");
    const safety_2_text         = session_context.getTranslation("saftey_tips_2");
    const safety_3_text         = session_context.getTranslation("saftey_tips_3");
    const safety_4_text         = session_context.getTranslation("saftey_tips_4");
    const start_btn_text        = session_context.getTranslation("start");

    let consent_pages   = [];
    consent_pages[0]    = (
        <Container className="content consent panel" id="consent_0">
            <Row>
                <Col sm={{span:10, offset:1}} xs={{span:10, offset:1}} className="consentbox vertconnect green_man_speech">{welcome_text}
                </Col>
            </Row>

            <Row>
                <Col sm={{span:10, offset:1}} xs={{span:10, offset:1}} className="consentbox vertconnect">{consent_info1_text}
                </Col>
            </Row>

            <Row>
                <Col sm={{span:10, offset:1}} xs={{span:10, offset:1}} className="consentbox">{consent_info2_text}
                </Col>
            </Row>

            <Row className="buttons">
                <Col>
                    <Button
                        className="btn btn-primary start_walk"
                        variant="primary"
                        onClick={()=> setCurPage(1)}
                    >{agree_btn_text}</Button>
                </Col>
            </Row>
        </Container>
    );
    consent_pages[1]    = (
        <Container className="content consent panel" id="consent_1" >
            <Row>
                <Col sm={{span:10, offset:1}} xs={{span:10, offset:1}} className="consentbox">{safety_text}</Col>
            </Row>

            <Row className="safteytip">
                <Col sm={{span:3, offset:1}} xs={{span:3}}><span><img alt='' src={pic_walk_with_another}/></span></Col>
                <Col sm={7} xs={7}><span>{safety_1_text}</span>
                </Col>
            </Row>

            <Row className="safteytip">
                <Col sm={{span:3, offset:1}} xs={{span:3}}><span><img alt='' src={pic_danger_2}/></span></Col>
                <Col sm={7} xs={7}><span>{safety_2_text}</span>
                </Col>
            </Row>

            <Row className="safteytip">
                <Col sm={{span:3, offset:1}} xs={{span:3}}><span><img alt='' src={pic_no_faces}/></span></Col>
                <Col sm={7} xs={7}><span>{safety_3_text}</span>
                </Col>
            </Row>

            <Row className="safteytip">
                <Col sm={{span:3, offset:1}} xs={{span:3}}><span><img alt=''  src={pic_ask_help}/></span></Col>
                <Col sm={7} xs={7}><span>{safety_4_text}</span>
                </Col>
            </Row>

            <Row className="buttons">
                <Col>
                    <Button
                    className="btn btn-primary start_walk"
                    variant="primary"
                    as={Link} to="/walk"
                    onClick={(e)=>{
                        startWalk(e);
                    }}
                >{start_btn_text}</Button>
                </Col>
            </Row>
        </Container>
    );

    return (
        <ViewBox navTo="/home" onClickReturnHome={onClickReturnHome} >
            {consent_pages[curPage]}
        </ViewBox>
    );
};

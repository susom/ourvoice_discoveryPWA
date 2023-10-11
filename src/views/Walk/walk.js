import { useState, useContext, useEffect } from "react";
import { useNavigate } from 'react-router-dom';

import { SessionContext } from "../../contexts/Session";

import WalkStart from "../../components/walk_start";
import PhotoDetail from "../../components/photo_detail";

import "../../assets/css/view_walk.css";

function ViewBox(props){
    return (
        <div className={`consent`}>
            {props.children}
        </div>
    );
}

export function Walk(){
    const session_context       = useContext(SessionContext);
    const navigate              = useNavigate();

    const [dataUri, setDataUri]                 = useState(null);
    const [viewPhotoDetail, setViewPhotoDetail] = useState(null);

    useEffect(() => {
        if (!session_context.data.in_walk && !session_context.previewWalk) {
            navigate('/home');
        }

        //IF viewing a photo detail from the slide out then set the state here
        setViewPhotoDetail(session_context.previewPhoto);
    }, [session_context.data.in_walk, session_context.previewPhoto, session_context.previewWalk, viewPhotoDetail, navigate]);

    const handleTakePhoto = (dataUri) => {
        setDataUri(dataUri);
        return false;
    };

    return (
        <ViewBox>
            {
                dataUri || viewPhotoDetail !== null
                    ? <PhotoDetail setDataUri={setDataUri} dataUri={dataUri} viewPhotoDetail={viewPhotoDetail} setViewPhotoDetail={setViewPhotoDetail}/>
                    : <WalkStart handleTakePhoto={handleTakePhoto}/>
            }
        </ViewBox>
    );
};

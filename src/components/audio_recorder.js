import {useContext } from "react";
import { AudioRecorder, useAudioRecorder } from 'react-audio-voice-recorder';

import {deepMerge} from "../components/util";

import {SessionContext} from "../contexts/Session";
import {WalkContext} from "../contexts/Walk";

export default function AudioRecorderWithIndexDB(props) {
    const session_context   = useContext(SessionContext);
    const walk_context      = useContext(WalkContext);
    const recorderControls  = useAudioRecorder();

    const addAudioElement   = (blob) => {
        const current_walk  = walk_context.data;
        const current_photo = session_context.previewPhoto !== null ? session_context.previewPhoto :  current_walk.photos.length;
        const current_audio = Object.keys(props.stateAudios).length + 1;

        const audio_name    = "audio_" + current_photo + "_" + current_audio + ".amr";
        const update_obj    = {};
        update_obj[audio_name] = blob;

        const copy_audios   = deepMerge(props.stateAudios, update_obj);

        //SAVE IT TO STATE ONLY IN CASE THEY WANT TO DISCARD
        props.stateSetAudios(copy_audios);
    };

    return (
        <AudioRecorder
            onRecordingComplete={(blob) => addAudioElement(blob)}
            recorderControls={recorderControls}
        />
    );
}

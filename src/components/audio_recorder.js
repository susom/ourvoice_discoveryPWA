import {useContext } from "react";
import { AudioRecorder, useAudioRecorder } from 'react-audio-voice-recorder';

import {deepMerge} from "../components/util";

import {SessionContext} from "../contexts/Session";
import {WalkContext} from "../contexts/Walk";

export default function AudioRecorderWithIndexDB({stateAudios, stateSetAudios}) {

    const session_context   = useContext(SessionContext);
    const walk_context      = useContext(WalkContext);
    const recorderControls  = useAudioRecorder();

    const addAudioElement   = (blob) => {
        console.log('attempting to add audio', blob)
        const current_walk  = walk_context.data;
        const current_photo = session_context.previewPhoto !== null ? session_context.previewPhoto :  current_walk.photos.length;
        const current_audio = Object.keys(stateAudios).length + 1;
        console.log(current_audio)

        const audio_name    = "audio_" + current_photo + "_" + current_audio + ".amr";
        const update_obj    = {};
        update_obj[audio_name] = blob;
        console.log(update_obj)
        const copy_audios   = deepMerge(stateAudios, update_obj);
        console.log(copy_audios)
        //SAVE IT TO STATE ONLY IN CASE THEY WANT TO DISCARD
        stateSetAudios(copy_audios);
    };

    return (
        <AudioRecorder
            onRecordingComplete={(blob) => addAudioElement(blob)}
            recorderControls={recorderControls}
        />
    );
}

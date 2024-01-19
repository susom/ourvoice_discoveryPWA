import {useContext } from "react";
import { AudioRecorder, useAudioRecorder } from 'react-audio-voice-recorder';

import {deepMerge} from "../components/util";

import {SessionContext} from "../contexts/Session";
import {WalkContext} from "../contexts/Walk";

export default function AudioRecorderWithIndexDB({stateAudios, stateSetAudios}) {

    const session_context   = useContext(SessionContext);
    const walk_context      = useContext(WalkContext);
    const recorderControls  = useAudioRecorder();

    const addAudioElement = async (blob) => {
        console.log('attempting to add audio', blob);

        // Convert blob to ArrayBuffer
        const arrayBuffer = await blob.arrayBuffer();
        const audioType = blob.type; // Get the MIME type of the blob

        // Construct the audio data object
        const audioData = {
            buffer: arrayBuffer,
            type: audioType
        };

        const current_walk = walk_context.data;
        const current_photo = session_context.previewPhoto !== null ? session_context.previewPhoto : current_walk.photos.length;
        const current_audio = Object.keys(stateAudios).length + 1;

        const audio_name = "audio_" + current_photo + "_" + current_audio + ".amr";
        const update_obj = {};
        update_obj[audio_name] = audioData; // Store the audio data object instead of the blob

        const copy_audios = deepMerge(stateAudios, update_obj);
        console.log(copy_audios);

        // Save it to state
        stateSetAudios(copy_audios);
    };

    return (
        <AudioRecorder
            onRecordingComplete={(blob) => addAudioElement(blob)}
            recorderControls={recorderControls}
        />
    );
}

// syncManager.js
import {auth, firestore, storage, storage_2} from "./Firebase";
import {signInAnonymously} from "firebase/auth";
import {db_files, db_walks} from "./db";
import {ref, uploadBytes, uploadBytesResumable} from "firebase/storage";
import {buildFileArr, bulkUpdateDb, cloneDeep, isBase64} from "../components/util";
import {collection, doc, setDoc, writeBatch} from "firebase/firestore";

async function uploadFiles(file_arr){
    const files = await db_files.files.where('name').anyOf(file_arr).toArray();
    console.log(files)
    const promises = files.map((file) => {
        const file_type     = file.name.indexOf("audio") > -1 ? "audio_" : "photo_";
        const temp          = file.name.split("_" + file_type);
        const file_name     = file_type + temp[1];
        const temp_path     = temp[0].split("_");
        const file_path     = temp_path[0] + "/" + temp_path[1] + "/" + temp_path[2] + "/" + file_name;

        const storageRef    = ref(storage, file_path);
        const storageRef_2  = ref(storage_2, file_path);

        let fileToUpload    = file.file;
        let isImage         = false;

        if (file_type === "audio_") {
            fileToUpload = new Blob([fileToUpload.buffer], { type: fileToUpload.type });
        } else if (isBase64(fileToUpload)) {
            isImage = true;
            const binaryString = atob(fileToUpload.split(",")[1]);
            const byteArray = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                byteArray[i] = binaryString.charCodeAt(i);
            }
            fileToUpload = new Blob([byteArray], { type: "image/png" });
        }

        return new Promise((resolve, reject) => {
            const which_storage = storageRef_2;
            const uploadTask    = uploadBytesResumable(which_storage, fileToUpload);
            uploadTask.on('state_changed',
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    console.log(`Upload is ${progress}% done`);
                },
                (error) => {
                    console.error("Error uploading file", file.name, error);
                    reject(error);
                },
                () => {
                    console.log(file.name, "uploaded");
                    resolve();
                }
            );
        });
    });

    await Promise.all(promises);
}

async function updateWalkStatus(item, status, uploaded) {
    const walk = await db_walks.walks.get(item.id);
    if (walk) {
        walk.status = status;
        if (typeof uploaded !== 'undefined') {
            walk.uploaded = uploaded;
        }
        await db_walks.walks.put(walk);

        //Is this necessary ?
        // Trigger the custom event after the status is updated in IndexedDB
        window.dispatchEvent(new Event('indexedDBChange'));
    }
}


async function batchPushToFirestore(walk_data) {
    const update_records = [];
    let files_arr = [];
    const batch = writeBatch(firestore);

    // Filter out already uploaded or incomplete walks
    const filteredWalkData = walk_data.filter(item => !item.uploaded && item.complete);
    console.log(`Filtered walks to be processed:`, filteredWalkData);

    // return; //Remember to delete after testing.

    for (const item of filteredWalkData) {
        // if(item.status === "IN_PROGRESS") //If loop attempts uploading a current walk, continue
        //     continue

        try {
            await updateWalkStatus(item, "IN_PROGRESS");

            // Prepare the document data
            const doc_id = item.project_id + "_" + item.user_id + "_" + item.timestamp;
            const doc_data = {
                "device": item.device,
                "lang": item.lang,
                "project_id": item.project_id,
                "timestamp": item.timestamp,
                "photos": item.photos
            };

            //References allowed before document creation
            //Generate reference to document by id
            const doc_ref = doc(firestore, "ov_walks", doc_id);

            // Log the doc_data for inspection before updating Firestore
            // console.log(`Data for doc_id ${doc_id}:`, doc_data);

            const sub_ref = collection(doc_ref, "geotags");

            //Set base document in OV walks with metadata
            batch.set(doc_ref, doc_data);

            //Prepare Geotag collection data
            const geotags = item.geotags;

            for (const [index, geotag] of geotags.entries()) {
                const subid = (index + 1).toString();
                await setDoc(doc(sub_ref, subid), { geotag });
            }

            await batch.commit();

            console.log(`Firestore batch commit successful for walk ID: ${item.id}`);
            await updateWalkStatus(item, "COMPLETE", 1);
            files_arr = [...files_arr, ...buildFileArr(doc_id, item.photos)];
            uploadFiles(files_arr)
                .then(async () => {
                    console.log('success')
                    await updateWalkStatus(item, "COMPLETE", 1);
                }).catch(e => console.log('upload failed', e));

        } catch (error) {
            console.error(`Error processing walk ID ${item.id}:`, error);
            await updateWalkStatus(item, "ERROR");
            // Implement a mechanism to handle individual walk failures here
        }
    }
}

export async function syncData() {
    // Set up timer to periodically check IndexedDB

    //Cloud Firestore and Cloud Storage both have offline persistence and automatic upload , even while offline without service worker
    //just cause i read some blog about a guy that found this hybrid approach to be the best performing... maybe thats outdated?
    //neeed to find that blog again.

    const signInIfNeeded = async () => {
        if (!auth.currentUser && navigator.onLine) {
            try {
                const userCredential = await signInAnonymously(auth);
                console.log("Anonymous user signed in:", userCredential.user.uid);
            } catch (error) {
                console.error("Error signing in anonymously:", error);
            }
        }
    };

    try {
        // Sign in anonymously if needed
        await signInIfNeeded();

        // Continue with sync process if online
        // if (navigator.onLine) {
            const walks_col = await db_walks.walks.toCollection();
            const count = await walks_col.count();

            if (count > 0) {
                const arr_data = await walks_col.toArray();
                await batchPushToFirestore(arr_data);
            } else {
                console.log("No new walks to sync.");
            }
        // } else {
        //     console.log("Offline. Skipping sync.");
        // }
    } catch (error) {
        console.error('An error occurred during the sync interval:', error);
    }

    // Schedule next sync
    setTimeout(syncData, 30000);
}


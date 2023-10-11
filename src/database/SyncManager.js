// syncManager.js
import {auth, firestore, storage} from "./Firebase";
import {signInAnonymously} from "firebase/auth";
import {db_files, db_walks} from "./db";
import {ref, uploadBytes, uploadBytesResumable} from "firebase/storage";
import {buildFileArr, bulkUpdateDb, cloneDeep, isBase64} from "../components/util";
import {collection, doc, setDoc, writeBatch} from "firebase/firestore";

async function uploadFiles(file_arr){
    const files = await db_files.files.where('name').anyOf(file_arr).toArray();
    const promises = files.map((file) => {
        const file_type     = file.name.indexOf("audio") > -1 ? "audio_" : "photo_";
        const temp          = file.name.split("_" + file_type);
        const file_name     = file_type + temp[1];
        const temp_path     = temp[0].split("_");
        const file_path     = temp_path[0] + "/" + temp_path[1] + "/" + temp_path[2] + "/" + file_name;

        const storageRef    = ref(storage, file_path);
        let fileToUpload    = file.file;
        if (isBase64(fileToUpload)) {
            const binaryString = atob(fileToUpload.split(",")[1]);
            const byteArray = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                byteArray[i] = binaryString.charCodeAt(i);
            }
            fileToUpload = new Blob([byteArray], { type: "image/png" });
        }

        return new Promise((resolve, reject) => {
            const uploadTask = uploadBytesResumable(storageRef, fileToUpload);
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

    for (const item of filteredWalkData) {
        updateWalkStatus(item, "IN_PROGRESS"); // Update status

        // Prepare the document data
        const doc_id = item.project_id + "_" + item.user_id + "_" + item.timestamp;
        const doc_data = {
            "device": item.device,
            "lang": item.lang,
            "project_id": item.project_id,
            "timestamp": item.timestamp,
            "photos": item.photos
        };

        // Create a document reference
        const doc_ref = doc(firestore, "ov_walks", doc_id);

        // Create a subcollection reference under the document
        const geotags = item.geotags;
        const sub_ref = collection(doc_ref, "geotags");
        geotags.forEach((geotag, index) => {
            const subid = (index + 1).toString();
            setDoc(doc(sub_ref, subid), { geotag })
                .then(() => {
                    console.log(`Document written with ID: ${subid}`);
                })
                .catch((error) => {
                    console.error(`Error adding document: ${error}`);
                });
        });

        // Add the main document to the batch
        batch.set(doc_ref, doc_data);

        // Build an array of file names to be uploaded to Cloud Storage
        files_arr = [...files_arr, ...buildFileArr(doc_id, item.photos)];

        // Commit the batch
        await batch.commit()
            .then(() => {
                updateWalkStatus(item, "COMPLETE", 1); // Update status
            })
            .catch((error) => {
                updateWalkStatus(item, "ERROR"); // Update status
            });

        // Upload files
        await uploadFiles(files_arr);

        // Trigger the custom event after the files are uploaded
        window.dispatchEvent(new Event('indexedDBChange'));

        // Update IndexedDB status after files are uploaded
        await bulkUpdateDb(db_walks, "walks", update_records);
    }
}



export async function syncData() {
    // Set up timer to periodically check IndexedDB

    //Cloud Firestore and Cloud Storage both have offline persistence and automatic upload , even while offline without service worker
    //just cause i read some blog about a guy that found this hybrid approach to be the best performing... maybe thats outdated?
    //neeed to find that blog again.

    const signIn = async () => {
        try {
            if(!auth.currentUser){
                await signInAnonymously(auth);
            }
        } catch (error) {
            console.error("Error signing in anonymously:", error);
        }
    };

    setInterval(async () => {
        try {
            if (navigator.onLine) {
                await signIn();

                const walks_col = await db_walks.walks.toCollection();
                const count = await walks_col.count();

                if (count > 0) {
                    console.log(`Syncing ${count} walk(s) from IndexedDB to Firestore`);

                    const arr_data = await walks_col.toArray();
                    await batchPushToFirestore(arr_data);
                } else {
                    console.log("No new walks to sync.");
                }
            } else {
                console.log("Offline. Skipping sync.");
            }
        } catch (error) {
            console.error('An error occurred during the sync interval:', error);
        }
    }, 60000);  // Check every 60 seconds (60000 ms)

}

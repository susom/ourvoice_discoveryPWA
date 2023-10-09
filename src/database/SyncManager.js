// syncManager.js
import {auth, firestore, storage} from "./Firebase";
import {signInAnonymously} from "firebase/auth";
import {db_files, db_walks} from "./db";
import {ref, uploadBytes} from "firebase/storage";
import {buildFileArr, bulkUpdateDb, cloneDeep, isBase64} from "../components/util";
import {collection, doc, setDoc, writeBatch} from "firebase/firestore";

async function uploadFiles(file_arr){
    // Query the database for records where fileName matches any value in the array
    const files         = await db_files.files.where('name').anyOf(file_arr).toArray();
    // console.log("files to array", files);
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

        return uploadBytes(storageRef, fileToUpload).then(() => {
            console.log(file.name, "uploaded");
        }).catch((error) => {
            console.error("Error uploading file", file.name, error);
        });;
    });

    try {
        await Promise.all(promises);
    } catch (error) {
        console.error("Error uploading files", error);
    }
};

function batchPushToFirestore(walk_data){
    // Add walk to Firestore, Add geotags Subcollection to walk, Upload files to Storage
    const update_records    = [];
    let files_arr           = [];

    // Create a batch object
    const batch = writeBatch(firestore);

    walk_data.filter(function(item) {
        //need to figure out why the query doesnt give proper collection
        //for now just filter out whole data set which should never really get that many
        if (item.uploaded || !item.complete) {
            return false; // skip
        }
        return true;
    }).map((item) => {
        // TRIM THE LOCAL CACHE TO MAKE RECORD FOR FIRESTORE
        let doc_id    = item.project_id + "_" + item.user_id + "_" + item.timestamp;
        let doc_data  = {
            "device"    : item.device,
            "lang"      : item.lang,
            "project_id": item.project_id,
            "timestamp" : item.timestamp,
            "photos"    : item.photos
        };
        //create document
        let doc_ref     = doc(firestore, "ov_walks", doc_id);

        //create subcollection under document
        let geotags     = item.geotags;
        let sub_ref     = collection(doc_ref, "geotags");
        geotags.forEach((geotag,index) => {
            let subid   = (index+1).toString();
            //add each walk route geo data point in order
            setDoc(doc(sub_ref, subid), {geotag})
                .then((docRef) => {
                    console.log('in SW Document written with ID: ', docRef);
                }).catch((error) => {
                console.error('Error adding document: ', error);
            });
        });

        //set the main doc into batch for single processing
        batch.set(doc_ref, doc_data);

        //collect records to update the indexdb "uploaded" flag
        const uploaded_record = cloneDeep(item);

        uploaded_record.uploaded = 1;
        update_records.push(uploaded_record);

        //build array of files from the walks that need uploading to storage
        files_arr = [...files_arr, ...buildFileArr(doc_id, item.photos)];
    });

    // Commit the batch of walk data
    batch.commit().then(() => {
        console.log('in SW and upload the indivdual files' , files_arr);
        uploadFiles(files_arr);

        console.log('in SW now update the walks in indexDB');
        bulkUpdateDb(db_walks, "walks", update_records);

        //dispatch an event that the upload table can listen for?
        window.dispatchEvent(new CustomEvent('indexedDBChange'));
    }).catch((error) => {
        console.error('Batch write failed:', error);
    });
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
        // Query IndexedDB for new data
        console.log("every 60 seconds, navigator", navigator.onLine);

        if(navigator.onLine){
            signIn();

            const walks_col = await db_walks.walks.toCollection();

            walks_col.count().then(count => {
                if (count > 0) {
                    console.log("in syncData maybe SW maybe in APP, has ", count, "walks");
                    walks_col.toArray(( arr_data) => {
                        batchPushToFirestore(arr_data);
                    });
                }
            }).catch(error => {
                console.error('Error counting walks:', error);
            });
        }else{
            console.log("in syncData maybe SW maybe in APP what navigator not online/");
        }
    }, 60000); // Check every 60 (60000ms) seconds
}

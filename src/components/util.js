import _ from "lodash";
import {db_logs} from "../database/db";

export function getDeviceType(){
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    if (/android|Chrome/i.test(userAgent)) {
        return 'Android';
    }
    if (/iPad|iPhone|iPod|Safari/.test(userAgent) && !window.MSStream) {
        return 'iOS';
    }
    return 'unknown';
};

export async function putDb(db_table, context_data) {
    try {
        const id = await db_table.put(context_data);
        // console.log(id, "Context Data auto gets id from og add/put, put-ing the Context Data again will update");
    } catch (error) {
        console.log(`Failed to add/update record ${context_data.id} in ${db_table}: ${error}`);
    }
}


export async function logError(projectId, walkId, type, message) {
    const logData = {
        project_id: projectId,
        walk_id: walkId,
        type: type,
        message: message
    };

    try {
        const id = await db_logs.logs.add(logData);
        console.log('Log added with id:', id);
    } catch (error) {
        console.error('Error adding log:', error);
    }
}


export async function bulkUpdateDb(db, table, recordsToUpdate){
    await db.transaction('rw', db[table], async () => {
        await db[table].bulkPut(recordsToUpdate);
        // console.log('Records updated successfully!');
    }).catch(error => {
        console.error(`Error updating records: ${error}`);
    });
}

export function updateContext(context, updates){
    //updating context is so difficult, shallow copys persist, deep copys dont do shit?
    //but nested properties dont register a change without a deepcopy. lose lose... maybe need to restructure Contexts to not nest
    const context_copy  = context.data;
    for(const prop_name in updates){
        context_copy[prop_name] = updates[prop_name];
        //if update is array or object, do deep clone then added it back...
    }

    //OR IF DEEP COPY use lodash
    // const updated_obj   = deepMerge(context.data, updates);

    context.setData(context_copy);
}

export function cloneDeep(og_obj){
    return _.cloneDeep(og_obj);
}

export function deepMerge(og_obj, update_obj){
    const obj_copy      = _.cloneDeep(og_obj);
    const updated_obj   = _.merge(obj_copy, update_obj);
    return updated_obj;
}

export function shallowMerge(og_obj, update_obj){
    return Object.assign(og_obj, update_obj);
}

export function permissionTimeout(ms) {
    return new Promise((_, reject) => {
        setTimeout(() => {
            // console.log('Timeout promise resolved at:', Date.now());
            reject(new Error('Permission request timed out'));
        }, ms);
    });
}

export function getGeoPermission() {
    return new Promise((resolve, reject) => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                () => {
                    // console.log('Geo permission resolved at:', Date.now());
                    resolve('granted')
                },
                (err) => {
                    switch (err.code) {
                        case err.PERMISSION_DENIED:
                            reject(new Error('GEO USER DENIED'));
                            break;
                        case err.POSITION_UNAVAILABLE:
                            reject(new Error('GEO UNAVAILABLE'));
                            break;
                        default:
                            // err.TIMEOUT
                            reject(new Error('Permission request timed out'));
                            break;
                    }
                }
            );
        } else {
            reject(new Error('GEO UNAVAILABLE'));
        }
    });
}


export function hasGeo(){
    return !! (navigator.geolocation);
}

export function tsDiffInHours(ts_1, ts_2){
    const diffInMs              = ts_2 -  ts_1  ;
    const diffInHours           = diffInMs / (1000 * 60 * 60);
    const roundedDiffInHours    = Math.round(diffInHours * 100) / 100;
    return roundedDiffInHours;
}

export function tsToYmd(ts){
    const date  = new Date(ts);
    const year  = String(date.getFullYear()).substring(2);
    const month = String(date.getMonth() + 1);
    const day   = String(date.getDate());
    return `${month}/${day}/${year}`;
}

export function isBase64(str) {
    if (typeof str !== "string") {
        return false;
    }
    const regex = /^data:(.*?);base64,/;
    return regex.test(str);
}

export function buildFileArr(prefix, photos){
    let file_arr = [];
    for (let i in photos){
        let photo = photos[i];
        file_arr.push(prefix +"_" + photo.name);
        if(photo.hasOwnProperty("audios")){
            let audio_keys = Object.keys(photo["audios"]);
            for(let n in audio_keys){
                file_arr.push(prefix +"_" + audio_keys[n]);
            }
        }
    }

    return file_arr;
}

export function getFileByName(files, name){
    let file = null;
    if(files.length){
        for(let i in files){
            if(name === files[i].name){
                file = files[i].file;
                break;
            }
        }
    }
    return file;
}




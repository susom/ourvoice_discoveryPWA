import _ from "lodash";


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

export function putDb(db_table, context_data){
    const update_db = async () => {
        try {
            const update_prom  = await db_table.put(context_data).then(() => {
                console.log(context_data.id, "Context Data auto gets id from og add/put, put-ing the Context Data again will update");
            });


            return [update_prom];
        } catch (error) {
            console.log(`Failed to add/update record ${context_data.id} in ${db_table}: ${error}`);
        }
    };
    return update_db();
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




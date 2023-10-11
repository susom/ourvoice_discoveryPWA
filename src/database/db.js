//Dexie is a wrapper library for indexDB
import Dexie from 'dexie';

//Our Voice APP uses 3 separate data

export const db_project = new Dexie('ov_project');
db_project.version(1).stores({
    active_project  : 'project_id, audio_comments, custom_take_photo_text, expire_date, languages, name, project_created, project_email, show_project_tags, tags, text_comments, thumbs, ov_meta, timestamp'
    , permissions: 'id, camera, audio, geo'
    , installed : 'id, is_complete'
});

export const db_walks = new Dexie('ov_walks');
db_walks.version(1).stores({
    walks :  '++id, project_id, user_id, timestamp, walk_id, lang, photos, geotags, device, uploaded, complete, status'
});

export const db_files = new Dexie('ov_files');
db_files.version(1).stores({
    files  : '++id, name, file'
});

export const db_logs = new Dexie('ov_logs');
db_logs.version(1).stores({
    logs :  '++id, project_id, walk_id, type, message'
});
import PouchDB from 'pouchdb';
import Search from 'pouchdb-quick-search';
import config from './config';

PouchDB.plugin(Search);

export var local = new PouchDB(config.db.name);
export var remote = new PouchDB(`${config.db.remote}/${config.db.name}/`);
export var sync = local.sync(remote);

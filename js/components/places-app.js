/* global HTMLElement */
import { Router } from 'director';

import PlaceMap from './place-map.js';
import PlaceList from './place-list.js';
import PlaceForm from './place-form.js';
import PlaceDetail from './place-detail.js';

import {local as db, sync} from '../db.js';

class PlaceAppElement extends HTMLElement {
  createdCallback () {
    this.sidebar = document.createElement('div');
    this.sidebar.id = 'sidebar';

    this.map = PlaceMap();
    this.map.id = 'map';

    this.list = PlaceList();
    this.form = PlaceForm();
    this.detail = PlaceDetail();

    this.appendChild(this.map);
    this.appendChild(this.sidebar);

    this.router = new Router({
      '/': this.indexRoute.bind(this),
      '/map': this.mapRoute.bind(this),
      '/places': this.indexRoute.bind(this),
      '/places/add': this.addPlaceRoute.bind(this),
      '/places/:id': this.placeDetailRoute.bind(this),
      '/places/:id/edit': this.placeEditRoute.bind(this)
    });

    this.router.param('id', /([\\w\\-]+)/);
  }

  attachedCallback () {
    this.router.init('/');
    this.initMapState();
    this.initHeight();
    this.initSync();

    this.map.addEventListener('mapmove', this.saveMapState.bind(this));
    this.map.addEventListener('selectplace', this.openPlace.bind(this));
    this.map.addEventListener('createplace', this.createPlaceAtCoords.bind(this));
    this.form.addEventListener('createplace', this.createPlace.bind(this));
    this.form.addEventListener('updateplace', this.updatePlace.bind(this));
    this.list.addEventListener('search', this.filterList.bind(this));

    db.allDocs({
      include_docs: true
    }).then((res) => {
      var geojson = res.rows.map(row => row.doc);
      this.list.buildList(geojson);
      this.map.buildMap(geojson);
    });
  }

  indexRoute () {
    this.form.resetForm();
    this.map.clearActiveFeature();
    this.setSidebarComponent(this.list);
    this.map.resize();
    this.detail.back = `#${this.router.getRoute() || '#/'}`;
    this.form.back = `#${this.router.getRoute() || '#/'}`;
  }

  mapRoute () {
    this.indexRoute();
    this.classList.remove('sidebar');
    this.classList.add('map');
    this.map.resize();
  }

  addPlaceRoute () {
    this.map.clearActiveFeature();
    this.setSidebarComponent(this.form);
  }

  placeDetailRoute (id) {
    db.get(id).then((doc) => {
      this.detail.name = doc.properties.name;
      this.detail.address = doc.properties.address || '';
      this.detail.description = doc.properties.description;
      this.detail.url = doc.properties.url;
      this.detail.placeid = doc._id;
      this.detail.icon = doc.properties.icon;
      this.detail.color = doc.properties.color;
      this.detail.size = doc.properties.size;
      this.detail.lat = doc.geometry.coordinates[1];
      this.detail.lng = doc.geometry.coordinates[0];
      this.map.setActiveFeature(doc);
      this.setSidebarComponent(this.detail);
    }).catch((error) => {
      console.log(error);
    });
  }

  placeEditRoute (id) {
    db.get(id).then((doc) => {
      this.form.resetForm();
      this.form.setup(doc);
      this.map.map.setView([doc.geometry.coordinates[1], doc.geometry.coordinates[0]], map.map.getZoom());
      this.setActiveComponent(this.form);
    }).catch((error) => {
      console.log(error);
    });
  }

  initMapState () {
    db.get('_local/map-state').then((doc) => {
      this.map.lat = doc.lat;
      this.map.lng = doc.lng;
      this.map.zoom = doc.zoom;
    }).catch(() => {
      console.log('could not get last map state');
    });
  }

  initHeight () {
    if (window.navigator.standalone) {
      this.classList.add('standalone');
    }

    window.addEventListener('resize', (e) => {
      this.style.height = window.innerHeight;
      this.map.resize();
    });

    this.style.height = window.innerHeight;
  }

  initSync () {
    sync.on('change', (info) => {
      // handle change
      if (info.direction === 'pull') {
        for (var i = 0; i < info.change.docs.length; i++) {
          var doc = info.change.docs[i];
          this.handleDocChange(doc);
        }
      }
    }).on('paused', function () {
      // replication paused (e.g. user went offline)
      console.log('sync paused');
    }).on('active', function () {
      // replicate resumed (e.g. user went back online)
      console.log('sync active');
    }).on('denied', function (info) {
      // a document failed to replicate, e.g. due to permissions
      console.log('sync denied', info);
    }).on('complete', function (info) {
      // handle complete
      console.log('sync complete', info);
    }).on('error', function (err) {
      // handle error
      console.log('sync error', err);
    });
  }

  handleDocChange (doc) {
    if (doc._deleted) {
      console.log('sync - deleted', doc);
      this.map.removeLayer(doc._id);
      this.list.removePlace(doc._id);
      return;
    }

    console.log('sync - create/update', doc);
    if (this.map.getLayer(doc._id)) {
      this.map.updateLayer(doc);
    } else {
      this.map.createLayer(doc);
    }

    if (this.list.hasPlace(doc._id)) {
      this.list.updatePlace(doc);
    } else {
      this.list.addPlace(doc);
    }
  }

  setSidebarComponent (component) {
    this.classList.add('sidebar');
    this.classList.remove('map');
    if (this.sidebar.hasChildNodes()) {
      this.sidebar.replaceChild(component, this.sidebar.childNodes[0]);
    } else {
      this.sidebar.appendChild(component);
    }
  }

  saveMapState (e) {
    db.put({
      _id: '_local/map-state',
      lat: e.detail.latlng.lat,
      lng: e.detail.latlng.lng,
      zoom: e.detail.zoom
    }).catch((error) => {
      if (error.name === 'conflict') {
        return db.get('_local/map-state');
      }
    }).then((doc) => {
      return db.put({
        _id: '_local/map-state',
        _rev: doc._rev,
        lat: e.detail.latlng.lat,
        lng: e.detail.latlng.lng,
        zoom: e.detail.zoom
      });
    }).catch(function (error) {
      console.log('map state update error', error);
    });
  }

  openPlace (e) {
    this.detail.back = '#/map';
    this.form.back = '#/map';
    this.router.setRoute(`/places/${e.detail.id}`);
  }

  createPlaceAtCoords (e) {
    this.form.address = e.detail.address;
    this.form.lat = e.detail.latlng.lat;
    this.form.lng = e.detail.latlng.lng;
    this.form.geocode = false;
    this.router.setRoute(`/places/add`);
  }

  createPlace (e) {
    var geojson = e.detail.geojson;
    db.put(geojson).then((response) => {
      this.router.setRoute(`/places/${geojson.id}`);
    }).catch((error) => {
      console.error(`create error: ${error}`);
    });
  }

  updatePlace (e) {
    var geojson = e.detail.geojson;
    db.get(geojson.id).then((doc) => {
      geojson.geometry.coordinates = doc.geometry.coordinates;
      geojson._rev = doc._rev;
      return db.put(geojson);
    }).then((response) => {
      this.router.setRoute(`/places/${geojson.id}`);
    }).catch((e) => {
      console.error(`error updating place: ${e}`);
    });
  }

  filterList (e) {
    var query;
    if (e.detail.value) {
      query = db.search({
        query: e.detail.value,
        fields: {
          'properties.name': 5,
          'properties.description': 1
        },
        mm: '25%',
        include_docs: true
      });
    } else {
      query = db.allDocs({
        include_docs: true
      });
    }

    query.then((res) => {
      var geojson = res.rows.map(row => row.doc);
      this.list.buildList(geojson);
    }).catch((e) => {
      console.error(`error searching: ${e}`);
    });
  }
}

var PlaceApp = document.registerElement('place-app', PlaceAppElement);

export default function (attributes) {
  return Object.assign(new PlaceApp(), attributes);
}

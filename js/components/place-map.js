/* global HTMLElement CustomEvent */

// map related
import L from 'leaflet';
import LocateControl from 'leaflet.locatecontrol';
import { basemapLayer } from 'esri-leaflet';
import {reverseGeocode, geosearch, arcgisOnlineProvider} from 'esri-leaflet-geocoder';
import '../maki-markers.js';

// import color schemes
import {light, dark} from '../colors.js';

class PlaceMapElement extends HTMLElement {
  createdCallback () {
    this.insertAdjacentHTML('afterbegin', `
      <a href="#/places" class="floater-btn fa fa-list" id="place-list-btn"></a>
      <div style="width:100%; height: 100%;">
    `);

    this.container = this.querySelectorAll('div')[0];

    this.appendChild(this.container);
  }

  resize () {
    this.map.invalidateSize();
  }

  setupMap () {
    // create our map
    this.map = L.map(this.container, {
      attributionControl: false
    }).setView([33.78, -117.85], 12);

    this.map.on('contextmenu', (e) => {
      reverseGeocode().latlng(e.latlng).distance(500).run((error, response) => {
        if (error) { return; }

        this.dispatchEvent(new CustomEvent('createplace', {
          detail: {
            address: response.address.Match_addr,
            latlng: e.latlng
          }
        }));
      });
    });

    this.map.on('moveend', (e) => {
      this.dispatchEvent(new CustomEvent('mapmove', {
        bubbles: true,
        detail: {
          latlng: this.map.getCenter(),
          zoom: this.map.getZoom()
        }
      }));
    });

    this.map.attributionControl = L.control.attribution({
      position: 'bottomleft',
      prefix: ''
    }).addTo(this.map);

    // create search control
    this.searchControl = geosearch({
      providers: [
        arcgisOnlineProvider()
      ]
    }).addTo(this.map);

    // create the locate control
    this.locateControl = new LocateControl({
      locateOptions: {
        maxZoom: 14
      }
    }).addTo(this.map);

    // create basic tile layer
    var streets = L.tileLayer('https://{s}.tiles.mapbox.com/v4/mapbox.emerald/{z}/{x}/{y}{r}.png?access_token={token}', {
      subdomains: ['a', 'b', 'c', 'd'],
      token: 'pk.eyJ1IjoibWFwYm94IiwiYSI6IlhHVkZmaW8ifQ.hAMX5hSW-QnTeRCMAy9A8Q',
      detectRetina: true,
      r: (L.Browser.retina) ? '@2x' : ''
    }).addTo(this.map);

    var satellite = L.tileLayer('https://api.tiles.mapbox.com/v4/mapbox.streets-satellite/{z}/{x}/{y}.png?access_token={token}', {
      token: 'pk.eyJ1IjoibWFwYm94IiwiYSI6IlhHVkZmaW8ifQ.hAMX5hSW-QnTeRCMAy9A8Q'
    });

    this.layerControl = L.control.layers({
      Streets: streets,
      Satellite: satellite
    }).addTo(this.map);

    this.features = L.featureGroup().addTo(this.map);

    this.features.on('click', (e) => {
      this.selectFeature(e.layer);
    });

    this.ids = {};
    this.resize();
  }

  selectFeature (layer) {
    this.dispatchEvent(new CustomEvent('selectplace', {
      bubbles: true,
      detail: {
        id: layer.feature.id
      }
    }));
  }

  createLayer (geojson) {
    var layer = L.GeoJSON.geometryToLayer(geojson, {
      pointToLayer: (feature, latlng) => {
        return L.marker(latlng, {
          icon: this.iconForFeature(feature, 'm', light)
        });
      }
    });

    layer.feature = geojson;
    this.features.addLayer(layer);
    this.ids[geojson.id] = layer;

    return layer;
  }

  getLayer (geojson) {
    return this.ids[geojson.id];
  }

  removeLayer (id) {
    this.map.removeLayer(this.ids[id]);
  }

  clearActiveFeature () {
    if (this.activeLayer) {
      this.activeLayer.setIcon(this.iconForFeature(this.activeLayer.feature));
    }
  }

  setActiveFeature (geojson) {
    this.clearActiveFeature();

    var layer = this.getLayer(geojson) || this.createLayer(geojson);
    var icon = this.iconForFeature(geojson, false, dark);

    layer.setIcon(icon);
    layer.setZIndexOffset(1000);

    if (!this.map.getBounds().pad(-0.1).contains(layer.getLatLng())) {
      this.map.panTo(layer.getLatLng());
    }

    this.activeLayer = layer;
  }

  iconForFeature (geojson, size, colors) {
    size = size || geojson.properties.size;
    colors = colors || light;

    return L.MakiMarkers.icon({
      icon: geojson.properties.icon,
      color: colors[geojson.properties.color] || colors['alizarin'],
      size: geojson.properties.size || size
    });
  }

  buildMap (geojson) {
    geojson
      .filter(feature => !this.getLayer(feature))
      .map(geojson => this.createLayer(geojson))
      .forEach((layer) => {
        this.features.addLayer(layer);
      });
  }

  attachedCallback () {
    this.setupMap();
  }

  detachedCallback () {
    this.map.remove();
  }

  attributeChangedCallback (attribute, oldValue, newValue) {
    if (this.lat && this.lng && this.zoom) {
      this.map.setView([this.lat, this.lng], this.zoom);
    }
  }

  get lat () { return parseFloat(this.getAttribute('lat'), 10); }
  set lat (lat) { this.setAttribute('lat', lat); }

  get lng () { return parseFloat(this.getAttribute('lng'), 10); }
  set lng (lng) { this.setAttribute('lng', lng); }

  get zoom () { return parseFloat(this.getAttribute('zoom'), 10); }
  set zoom (zoom) { this.setAttribute('zoom', zoom); }
}

var PlaceMap = document.registerElement('place-map', PlaceMapElement);

export default function (attributes) {
  return Object.assign(new PlaceMap(), attributes);
}

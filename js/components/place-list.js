/* global HTMLElement CustomEvent*/

import { light } from '../colors.js';
import bindEvent from '../decorators/bindEvent.js';

@bindEvent('submit', 'handleSearch')
@bindEvent('input', 'handleSearch')
class PlaceListElement extends HTMLElement {
  createdCallback () {
    this.insertAdjacentHTML('afterbegin', `
      <header>
        <form>
          <input type="search" placeholder="Search Places">
        </form>
      </header>
      <ul class="place-list body"></ul>
      <footer>
        <a href="#/map" id="place-map-btn" class="floater-btn fa fa-map"></a>
        <a href="#/places/add" class="floater-btn action fa fa-plus"></a>
      </footer>
    `);

    this.container = this.querySelectorAll('ul')[0];
  }

  handleSearch (e) {
    this.dispatchEvent(new CustomEvent('search', {
      bubbles: true,
      detail: {
        value: e.target.value
      }
    }));

    if(e.type === 'submit') {
      e.preventDefault();
    }
  }

  hasPlace (id) {
    !!this.querySelector(`#${id}`);
  }

  addPlace (geojson) {
    this.container.insertAdjacentHTML('beforeend', this.buildItem(geojson));
  }

  updatePlace (geojson) {
    this.removePlace(geojson.id);
    this.addPlace(geojson);
  }

  removePlace (id) {
    this.container.removeChild(this.querySelector(`#${id}`));
  }

  buildList (geojson) {
    this.container.innerHTML = geojson.map(feature => this.buildItem(feature)).join(' ');
  }

  buildItem (geojson) {
    var color = (light[geojson.properties.color || 'alizarin'] || '#e74c3c').replace('#', '');

    return `
      <li id="${geojson.id}">
        <div class="wrapper">
          <div class="image">
            <img src="https://api.tiles.mapbox.com/v3/marker/pin-m-${geojson.properties.icon}+${color}.png">
          </div>
        </div>
        <div class="list-item-body">
          <h4><a href="#/places/${geojson.id}">${geojson.properties.name}</a></h4>
          ${geojson.properties.description ? `<p>${geojson.properties.description}</p>` : ``}
        </div>
      </li>
    `;
  }
}

var PlaceList = document.registerElement('place-list', PlaceListElement);

export default function (attributes) {
  return Object.assign(new PlaceList(), attributes);
}

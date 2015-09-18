/* global HTMLElement */
import bindEvent from '../decorators/bindEvent.js';
import attribute from '../decorators/attribute.js';
import { light as colors } from '../colors.js';
import config from '../config.js';

@bindEvent('click', 'a.cancel', 'deletePlace')
@attribute('name', String)
@attribute('url', String)
@attribute('address', String)
@attribute('description', String)
@attribute('placeid', String)
@attribute('lat', Number)
@attribute('lng', Number)
@attribute('rev', String)
@attribute('icon', String)
@attribute('color', String)
class PlaceDetailElement extends HTMLElement {
  createdCallback () {
    this.update();
  }

  deletePlace (e) {
    this.dispatchEvent(new CustomEvent('placedeleted', {
      bubbles: true,
      detail: {
        id: this.placeid
      }
    }));

    e.preventDefault();
    e.stopPropagation();
  }

  attributeChangedCallback (attribute, oldValue, newValue) {
    this.update();
  }

  update () {
    this.innerHTML = `
      <header>
        <a href="${this.back || "#/places"}" class="back-link">Back</a>
      </header>
      <main class="body">
        <h3>${this.name}</h3>
        ${this.address ? `<p>${this.address}</p>` : ``}
        ${this.description ? `<p>${this.description}</p>` : ``}
        <img src="https://api.mapbox.com/v4/mapbox.emerald/pin-m-${this.icon}+${colors[this.color || 'alizarin'].replace('#', '')}(${this.lng},${this.lat})/${this.lng},${this.lat},16/420x240.png?access_token=${config.mapboxKey}" alt="Mapbox Map of ${this.lat},${this.lng}">
        <br><br>
        <img src="https://maps.googleapis.com/maps/api/streetview?size=420x240&location=${this.lat},${this.lng}&key=${config.googleKey}">
      </main>
      <footer>
        <a href="#/places/${this.placeid}/edit" class="floater-btn action fa fa-pencil"></a>
        ${(this.address) ? `<a href="https://maps.google.com?saddr=Current+Location&daddr=${encodeURIComponent(this.address)}" target="_blank" class="floater-btn fa fa-map-signs"></a>` : ``}
        ${(!this.address) ? `<a href="https://maps.google.com?saddr=Current+Location&daddr=${this.lat},${this.lng}" target="_blank" class="floater-btn fa fa-map-signs"></a>` : ``}
        ${(this.url) ? `<a href="${this.url}" target="_blank" class="floater-btn fa fa-link"></a>` : ``}
        <a href="#" class="floater-btn fa fa-trash cancel"></a>
      </footer>
    `;
  }
}

var PlaceDetail = document.registerElement('place-detail', PlaceDetailElement);

export default function (attributes) {
  return Object.assign(new PlaceDetail(), attributes);
}

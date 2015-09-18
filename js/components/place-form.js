/* global HTMLElement CustomEvent */

import './color-selector.js';
import './size-selector.js';
import './icon-selector.js';

import { geocode } from 'esri-leaflet-geocoder';

import attribute from '../decorators/attribute.js';
import bindEvent from '../decorators/bindEvent.js';
import watchAttribute from '../decorators/watchAttribute.js';

function slugify (text) {
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '');            // Trim - from end of text
}

@bindEvent('submit', 'submitForm')
@attribute('placeid', String)
@attribute('geocoded', Boolean)
@attribute('lat', Number)
@attribute('lng', Number)
@attribute('name', String)
@attribute('url', String)
@attribute('address', String)
@attribute('description', String)
@attribute('size', String)
@attribute('color', String)
@attribute('icon', String)
@attribute('back', String)
@watchAttribute('placeid', function (oldValue, newValue) { this.idInput.value = newValue })
@watchAttribute('geocoded', function (oldValue, newValue) { this.geocodeInput.checked = !!newValue })
@watchAttribute('lat', function (oldValue, newValue) { this.latInput.value = newValue })
@watchAttribute('lng', function (oldValue, newValue) { this.lngInput.value = newValue })
@watchAttribute('name', function (oldValue, newValue) { console.log(oldValue, newValue, this.nameInput); this.nameInput.value = newValue })
@watchAttribute('url', function (oldValue, newValue) { this.urlInput.value = newValue })
@watchAttribute('address', function (oldValue, newValue) { this.addressInput.value = newValue })
@watchAttribute('description', function (oldValue, newValue) { this.descriptionInput.value = newValue })
@watchAttribute('size', function (oldValue, newValue) { this.sizeInput.value = newValue })
@watchAttribute('color', function (oldValue, newValue) { this.colorInput.value = newValue })
@watchAttribute('icon', function (oldValue, newValue) { this.iconInput.value = newValue })
class PlaceFormElement extends HTMLElement {

  createdCallback () {
    this.insertAdjacentHTML('afterbegin', `
    <header>
      <h1>Add Place</h1>
    </header>

      <form class="body" id="place-form">
        <input type="hidden" name="_id" value="${this.placeid}" />
        <input type="hidden" name="lat" value="${this.lat}" />
        <input type="hidden" name="lng" value="${this.lng}" />

        <label>
          Name
          <input type="text" name="name" value="${this.name}" />
        </label>

        <label>
          Website
          <input type="text" name="url"  value="${this.url}" />
        </label>

        <label>
          Address
          <input type="text" name="address" value="${this.address}" />
        </label>

        <label>
          <input type="checkbox" name="geocode" ${(this.geocoded) ? 'checked' : ''} />
          Use address as location?
        </label>

        <label>
          Description
          <textarea name="description">${this.description}</textarea>
        </label>

        <label>Marker Size</label>
        <marker-size-selector name="size" value="${this.size}"></marker-size-selector>

        <label>Marker Color</label>
        <marker-color-selector name="color" value="${this.color}"></marker-color-selector>

        <label>Marker Icon</label>
        <marker-icon-selector name="icon" value="${this.icon}"></marker-icon-selector>

        <input type="submit" value="" style="display: none;"></input>

        </form>

        <footer>
          <button type="submit" class="floater-btn action fa fa-check" form="place-form"></button>
          <a href="${this.back}" class="floater-btn cancel fa fa-ban" form="place-form"></a>
        </footer>
    `);

    this.form = this.querySelectorAll('form')[0];
    this.header = this.querySelectorAll('header h1')[0];
    this.submitBtn = this.querySelectorAll('input[type="submit"]')[0];
    this.cancelBtn = this.querySelectorAll('.cancel')[0];
    this.idInput = this.querySelectorAll('input[name="_id"]')[0];
    this.revInput = this.querySelectorAll('input[name="_rev"]')[0];
    this.nameInput = this.querySelectorAll('input[name="name"]')[0];
    this.urlInput = this.querySelectorAll('input[name="url"]')[0];
    this.descriptionInput = this.querySelectorAll('textarea[name="description"]')[0];
    this.addressInput = this.querySelectorAll('input[name="address"]')[0];
    this.sizeInput = this.querySelectorAll('marker-size-selector')[0];
    this.colorInput = this.querySelectorAll('marker-color-selector')[0];
    this.iconInput = this.querySelectorAll('marker-icon-selector')[0];
    this.geocodeInput = this.querySelectorAll('input[name="geocode"]')[0];
    this.latInput = this.querySelectorAll('input[name="lat"]')[0];
    this.lngInput = this.querySelectorAll('input[name="lng"]')[0];
  }

  serializeForm (e) {
    var form = {};

    [].slice.call(e.target).forEach(function (input) {
      if ((input.type === 'radio' || input.type === 'checkbox') && input.checked) {
        form[input.name] = input.value;
      } else if (input.type !== 'radio') {
        form[input.name] = input.value;
      }
    });

    return form;
  }

  resetForm () {
    this.header.textContent = `Add Place`;
    this.placeid = false;
    this.geocoded = false;
    this.lat = false;
    this.lng = false;
    this.name = false;
    this.url = false;
    this.address = false;
    this.description = false;
    this.size = false;
    this.color = false;
    this.icon = false;
  }

  submitForm (e) {
    var formData = this.serializeForm(e);

    if (!this.placeid) {
      this._createPlace(formData);
    } else {
      this._updatePlace(formData);
    }

    e.preventDefault();
  }

  _updatePlace (formData) {
    if (this.geocodeInput.checked) {
      // address changed geocode and update
      this._geocode(formData.address, (error, address, coordinates) => {
        var geojson = this.formDataToFeature(formData);
        geojson.geometry.coordinates = coordinates;
        geojson.properties.address = address;
        this._putPlace(geojson);
      });
    } else {
      // just update place
      var geojson = this.formDataToFeature(formData);
      this._putPlace(geojson);
    }
  }

  _putPlace (geojson) {
    this.dispatchEvent(new CustomEvent('updateplace', {
      bubbles: true,
      detail: {
        geojson
      }
    }));
  }

  _createPlace (formData) {
    if (this.geocodeInput.checked) {
      this._geocode(formData.address, (error, address, coordinates) => {
        var geojson = this.formDataToFeature(formData);
        geojson.geometry.coordinates = coordinates;
        geojson.properties.address = address;
        this.dispatchEvent(new CustomEvent('createplace', {
          bubbles: true,
          detail: {
            geojson
          }
        }));
      });
    } else {
      this.dispatchEvent(new CustomEvent('createplace', {
        bubbles: true,
        detail: {
          geojson: this.formDataToFeature(formData)
        }
      }));
    }
  }

  _geocode (address, callback) {
    geocode().text(address).run((error, response) => {
      callback(null, response.results[0].text, [response.results[0].latlng.lng, response.results[0].latlng.lat]);
    });
  }

  formDataToFeature (formData) {
    return {
      id: (this.placeid) ? this.placeid : slugify(formData.name),
      _id: (this.placeid) ? this.placeid : slugify(formData.name),
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [formData.lng, formData.lat]
      },
      properties: {
        geocoded: formData.geocode,
        name: formData.name,
        address: formData.address,
        icon: formData.icon,
        color: formData.color,
        description: formData.description,
        url: formData.url,
        size: formData.size
      }
    };
  }

  setup (geojson) {
    Object.assign(this, geojson.properties);
    this.lat = geojson.geometry.coordinates[1];
    this.lng = geojson.geometry.coordinates[0];
    if (geojson._id) {
      this.placeid = geojson._id;
      this.header.textContent = `Editing ${geojson.properties.name}`;
    } else {
      this.header.textContent = `Add Place`;
    }
  }
}

var PlaceForm = document.registerElement('place-form', PlaceFormElement);

export default function (attributes) {
  return Object.assign(new PlaceForm(), attributes);
}

/* global HTMLElement */

import icons from '../icons.js';
import watchAttribute from '../decorators/watchAttribute.js';
import attribute from '../decorators/attribute.js';

@attribute('name', String)
@attribute('value', String)
@watchAttribute('value', 'updateInputs')
@watchAttribute('name', 'updateInputs')
class MarkerIconSelectorElement extends HTMLElement {
  createdCallback () {
    var sizeList = icons.map((icon) => {
      return `<li>
        <input type="radio" name="${this.name}" id="icon-selector-${icon}" value="${icon}">
        <label class="maki-icon ${icon}" for="icon-selector-${icon}" title="icon-${icon}"><span>${icon}<span></label>
      </li>`;
    }).join('');

    this.insertAdjacentHTML('afterbegin', `
      <ul class="marker-icon-selector">
        ${sizeList}
      </ul>
    `);

    this.inputs = [].slice.call(this.querySelectorAll('input'));

    this.updateInputs();
  }

  updateInputs () {
    this.inputs.forEach((input) => {
      input.checked = (input.value === this.value);
      input.name = this.name;
    });

    if (!this.inputs.some(input => input.checked)) {
      this.inputs[0].checked = true;
      this.value = this.inputs[0].value;
    }
  }
}

var MarkerIconSelector = document.registerElement('marker-icon-selector', MarkerIconSelectorElement);

export default function (attributes) {
  return Object.assign(new MarkerIconSelector(), attributes);
}

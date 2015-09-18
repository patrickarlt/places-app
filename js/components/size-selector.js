/* global HTMLElement */

import watchAttribute from '../decorators/watchAttribute.js';
import attribute from '../decorators/attribute.js';

@attribute('name', String)
@attribute('value', String)
@watchAttribute('value', 'updateInputs')
@watchAttribute('name', 'updateInputs')
class MarkerSizeSelectorElement extends HTMLElement {
  createdCallback () {
    var sizeList = ['s', 'm', 'l'].map((size) => {
      return `<li>
        <input type="radio" name="${this.name}" id="size-selector-${size}" value="${size}">
        <label class="marker-size-${size}" for="size-selector-${size}" title="size-${size}"><span>${size}<span></label>
      </li>`
    }).join('');

    this.insertAdjacentHTML('afterbegin', `
      <ul class="marker-size-selector">
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

var MarkerSizeSelector = document.registerElement('marker-size-selector', MarkerSizeSelectorElement);

export default function (attributes) {
  return Object.assign(new MarkerSizeSelector(), attributes);
}

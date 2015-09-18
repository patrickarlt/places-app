/* global HTMLElement */

import colors from '../colors.js';
import watchAttribute from '../decorators/watchAttribute.js';
import attribute from '../decorators/attribute.js';

@attribute('name', String)
@attribute('value', String)
@watchAttribute('value', 'updateInputs')
@watchAttribute('name', 'updateInputs')
class MarkerColorSelectorElement extends HTMLElement {
  createdCallback () {
    var colorList = Object.keys(colors).map((color) => {
      return `<li>
        <input type="radio" name="${this.name}" id="color-selector-${color}" value="${color}" ${(this.value === color) ? 'checked' : ''}>
        <label class="${color}" for="color-selector-${color}" title="color-${color}"><span>${color}<span></label>
      </li>`;
    }).join('');

    this.insertAdjacentHTML('afterbegin', `
      <ul class="marker-color-selector">
        ${colorList}
      </ul>
    `);

    this.inputs = [].slice.call(this.querySelectorAll('input[type="radio"]'));

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

var MarkerColorSelector = document.registerElement('marker-color-selector', MarkerColorSelectorElement);

export default function (attributes) {
  return Object.assign(new MarkerColorSelector(), attributes);
}

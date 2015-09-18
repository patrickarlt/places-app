export default function watchAttribute (watchAttr, handler) {
  return function (target) {
    var attributeChangedCallback = target.prototype.attributeChangedCallback || function () {};

    handler = (typeof handler === 'function') ? handler : target.prototype[handler];

    if (!handler) {
      throw new Error(`@watchAttribute: #{handler} does not exist on #{target}`);
    }

    target.prototype.attributeChangedCallback = function (attr, oldValue, newValue) {
      if (watchAttr === attr) {
        handler.call(this, oldValue, newValue);
      }

      attributeChangedCallback.call(this, attr, oldValue, newValue);
    };
  };
}

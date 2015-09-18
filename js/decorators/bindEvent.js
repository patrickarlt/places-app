export default function bindEvent (event, selector, handler) {
  var callback;

  if (arguments.length === 2) {
    handler = selector;
    selector = false;
  }

  return function (target) {
    var attachedCallback = target.prototype.attachedCallback || function () {};

    handler = (typeof handler === 'function') ? handler : target.prototype[handler];

    if (!handler) {
      throw new Error(`@bindEvent: #{handler} does not exist on #{target}`);
    }

    target.prototype.attachedCallback = function () {
      callback = (e) => {
        if (!selector || (selector && e.target.matches(selector))) {
          handler.call(this, e);
        }
      };

      this.addEventListener(event, callback, /focus|blur/.test(event));
      attachedCallback.call(this);
    };

    var detachedCallback = target.prototype.detachedCallback || function () {};
    target.prototype.detachedCallback = function () {
      this.removeEventListener(event, callback);
      detachedCallback.call(this);
    };
  };
}

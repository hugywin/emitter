'use strict';

const define = require('define-property');

/**
 * Initialize a new `Emitter`.
 *
 * ```js
 * const Emitter = require('emitter');
 * // as an `Emitter` instance
 * const emitter = new Emitter;
 * emitter.emit('something');
 * // or inherit
 * class MyEmitter extends Emitter {}
 * ```
 * @name Emitter
 * @api public
 */

class Emitter {
  constructor(obj) {
    if (obj) return mixin(obj);
  }

  /**
   * Mixin methods from Emitter.
   *
   * ```js
   * var Emitter = require('emitter');
   * var obj = {};
   * Emitter.mixin(obj);
   * obj.on('status', console.log);
   * obj.emit('status', 'I emit!');
   * ```
   * @name Emitter#mixin
   * @param {Object} `obj`
   * @return {Object}
   * @api public
   */

  static mixin(obj) {
    return new Emitter(obj);
  }

  /**
   * Return the array of registered listeners for `event`.
   *
   * ```js
   * console.log(emitter.listeners());
   * ```
   * @name .listeners
   * @param {String} `event`
   * @return {Array}
   * @api public
   */

  listeners(event) {
    if (!this._listeners) define(this, '_listeners', {});
    return this._listeners['$' + event] || (this._listeners['$' + event] = []);
  }

  /**
   * Listen on the given `event` with `fn`.
   *
   * ```js
   * emitter.on('foo', () => 'do stuff');
   * ```
   * @name .on
   * @param {String} `event`
   * @param {Function} `fn`
   * @return {Emitter}
   * @api public
   */

  on(event, fn) {
    if (!this._only) define(this, '_only', {});
    if (this._only[event]) {
      this.off(event, fn);
    }

    const listeners = this.listeners(event);
    listeners.push(fn);
    return this;
  }

  /**
   * Adds an `event` listener that will be invoked a single
   * time then automatically removed.
   *
   * ```js
   * emitter.only('once', () => 'do stuff');
   * ```
   * @name .once
   * @param {String} `event`
   * @param {Function} `fn`
   * @return {Emitter}
   * @api public
   */

  once(event, fn) {
    const on = function() {
      this.off(event, on);
      fn.apply(this, arguments);
    };
    on.fn = fn;
    this.on(event, on);
    return this;
  }

  /**
   * Ensures that events for event `event` are only **registered**
   * once and are disabled correctly when specified. This is
   * different from `.once`, which only **emits** once.
   *
   * ```js
   * emitter.only('foo', () => 'do stuff');
   * ```
   * @name .only
   * @param {String} `event`
   * @param {Object} `options`
   * @param {Function} `fn`
   * @return {Emitter}
   * @api public
   */

  only(event, options, fn) {
    if (typeof options === 'function') {
      fn = options;
      options = null;
    }

    if (options && options.first === true) {
      define(this, '_first', true);
    }

    if (!this._only) define(this, '_only', {});
    if (!event) {
      for (var key in this._only) {
        this.off(key, this._only[key]);
      }
      this._only = {};
      return this;
    }

    if (!this._only[event]) {
      this.off(event);
    }

    if (!fn) {
      this.off(event);
      delete this._only[event];
      return this;
    }

    if (this._only[event]) {
      if (this._first !== true) {
        this.off(event, this._only[event]);
      } else {
        fn = this._only[event];
        this.off(event);
      }
    }

    this._only[event] = fn;
    this.on(event, fn);
    return this;
  }

  /**
   * Remove the given listener for `event`, or remove all
   * registered listeners if `event` is undefined.
   *
   * ```js
   * emitter.off();
   * emitter.off('foo');
   * emitter.off('foo', fn);
   * ```
   * @name .off
   * @param {String} `event`
   * @param {Function} `fn`
   * @return {Emitter}
   * @api public
   */

  off(event, fn) {
    if (!this._listeners) define(this, '_listeners', {});

    // remove all listeners
    if (!event) {
      this._listeners = {};
      return this;
    }

    // remove all listeners for "event"
    if (!fn) {
      this._listeners['$' + event] = [];
      return this;
    }

    // remove all instances of "fn" from "event"
    removeListeners(fn, this.listeners(event));
    return this;
  }

  /**
   * Emit `event` with the given args.
   *
   * ```js
   * emitter.emit('foo', 'bar');
   * ```
   * @name .emit
   * @param {String} `event`
   * @param {Mixed} ...
   * @return {Emitter}
   */

  emit(event) {
    const listeners = this.listeners(event).slice();
    const args = [].slice.call(arguments, 1);
    for (const fn of listeners) {
      fn.apply(this, args);
    }
    return this;
  }

  /**
   * Returns true if the emitter has registered listeners for `event`.
   *
   * ```js
   * emitter.on('foo', 'do stuff');
   * console.log(emitter.has('foo')); // true
   * console.log(emitter.has('bar')); // false
   * ```
   * @name .has
   * @param {String} `event`
   * @return {Boolean}
   * @api public
   */

  has(event) {
    return this.listeners(event).length > 0;
  }
}

/**
 * Expose common aliases for `.has`, `.on` and `.off`
 */

Emitter.prototype.hasListeners =
Emitter.prototype.has;

Emitter.prototype.addListener =
Emitter.prototype.addEventListener =
Emitter.prototype.on;

Emitter.prototype.removeListener =
Emitter.prototype.removeListeners =
Emitter.prototype.removeAllListeners =
Emitter.prototype.removeEventListener =
Emitter.prototype.off;

/**
 * Remove all instances of the given `fn` from listeners.
 */

function removeListeners(fn, listeners) {
  for (let i = 0; i < listeners.length; i++) {
    const listener = listeners[i];
    if (listener === fn || listener.fn === fn) {
      listeners.splice(i, 1);
      return removeListeners(fn, listeners);
    }
  }
}

/**
 * Mixin emitter properties.
 */

function mixin(obj) {
  Object.setPrototypeOf(obj, Emitter.prototype);
  return obj;
}

/**
 * Expose `Emitter`
 */

module.exports = Emitter;

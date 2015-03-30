/**
 * Module dependencies
 */
var debug = require('debug')('session-glint');
var merge = require('utils-merge');
var noop = function () {
};

var defer = typeof setImmediate === 'function'
  ? setImmediate
  : function (fn) {
  process.nextTick(fn.bind.apply(fn, arguments))
};

/**
 * One day in seconds.
 */

var oneDay = 86400;

/**
 * Return the `GlintStore` extending `express`'s session Store.
 *
 * @param {object} express session
 * @return {Function}
 * @api public
 */

module.exports = function (session) {

  /**
   * Express's session Store.
   */

  var Store = session.Store;

  /**
   * Initialize GlintStore with the given `options`.
   *
   * @param {Object} options
   * @api public
   */

  function GlintStore(options) {
    if (!(this instanceof GlintStore)) return new GlintStore(options);
    var self = this;

    options = options || {};
    Store.call(this, options);
    merge(this, options);

    // check provided options | set defaults
    if (!this.adapter) {
      throw new Error('session-glint Adapter has not been provided');
    }
    if (!this.adapter.db()) {
      debug('db not set on the adapter, setting to default: "%s"', 'glint');
      this.adapter.db('glint');
    }
    if (!this.adapter.type()) {
      debug('type not set on the adapter, setting to default: "%s"', 'session');
      this.adapter.type('session');
    }

  }

  /**
   * Inherit from `Store`.
   */

  GlintStore.prototype.__proto__ = Store.prototype;

  /**
   * Default attributes (options)
   */
  GlintStore.prototype.prefix = '';
  GlintStore.prototype.ttlAttribute = '_ttl';

  /**
   * Attempt to fetch session by the given `sid`.
   *
   * @param {String} sid
   * @param {Function} fn
   * @api public
   */

  GlintStore.prototype.get = function (sid, fn) {
    var store = this;
    var psid = store.prefix + sid;
    if (!fn) fn = noop;
    debug('load "%s"', sid);

    store.adapter.load(psid, function (err, data) {
      if (err) return fn(err);
      if (!data) return fn();
      debug('loaded %s', data);
      return fn(null, data);
    });
  };

  /**
   * Commit the given `sess` object associated with the given `sid`.
   *
   * @param {String} sid
   * @param {Session} sess
   * @param {Function} fn
   * @api public
   */

  GlintStore.prototype.set = function (sid, sess, fn) {
    var store = this;
    var psid = store.prefix + sid;
    if (!fn) fn = noop;
    sess = sess || {};

    if (!store.disableTTL) {
      // add ttl virtual field
      var maxAge = sess.cookie.maxAge;
      // TODO check also for expires: https://gist.github.com/andineck/3d0bf62bbd297ed2aee0
      var ttl = store.ttl || (typeof maxAge === 'number' ? maxAge / 1000 | 0 : oneDay);
      sess[this.ttlAttribute] = ttl;
      // TODO implement ttl remove session deamon or adapter plugin
    }

    debug('store "%s" ttl:%s %s', sid, ttl, sess);
    store.adapter.save(psid, sess, function (err) {
      if (err) return fn(err);
      debug('SET complete');
      fn.apply(null, arguments);
    });

  };

  /**
   * Destroy the session associated with the given `sid`.
   *
   * @param {String} sid
   * @api public
   */

  GlintStore.prototype.destroy = function (sid, fn) {
    sid = this.prefix + sid;
    debug('DEL "%s"', sid);
    this.adapter.delete(sid, fn);
  };

  return GlintStore;
};

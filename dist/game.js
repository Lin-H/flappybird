var MyGame = (function () {
	'use strict';

	var global = window;

	function commonjsRequire () {
		throw new Error('Dynamic requires are not currently supported by rollup-plugin-commonjs');
	}

	function createCommonjsModule(fn, module) {
		return module = { exports: {} }, fn(module, module.exports), module.exports;
	}

	var localforage = createCommonjsModule(function (module, exports) {
	/*!
	    localForage -- Offline Storage, Improved
	    Version 1.7.3
	    https://localforage.github.io/localForage
	    (c) 2013-2017 Mozilla, Apache License 2.0
	*/
	(function(f){{module.exports=f();}})(function(){return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof commonjsRequire=="function"&&commonjsRequire;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw (f.code="MODULE_NOT_FOUND", f)}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r);}return n[o].exports}var i=typeof commonjsRequire=="function"&&commonjsRequire;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
	(function (global){
	var Mutation = global.MutationObserver || global.WebKitMutationObserver;

	var scheduleDrain;

	{
	  if (Mutation) {
	    var called = 0;
	    var observer = new Mutation(nextTick);
	    var element = global.document.createTextNode('');
	    observer.observe(element, {
	      characterData: true
	    });
	    scheduleDrain = function () {
	      element.data = (called = ++called % 2);
	    };
	  } else if (!global.setImmediate && typeof global.MessageChannel !== 'undefined') {
	    var channel = new global.MessageChannel();
	    channel.port1.onmessage = nextTick;
	    scheduleDrain = function () {
	      channel.port2.postMessage(0);
	    };
	  } else if ('document' in global && 'onreadystatechange' in global.document.createElement('script')) {
	    scheduleDrain = function () {

	      // Create a <script> element; its readystatechange event will be fired asynchronously once it is inserted
	      // into the document. Do so, thus queuing up the task. Remember to clean up once it's been called.
	      var scriptEl = global.document.createElement('script');
	      scriptEl.onreadystatechange = function () {
	        nextTick();

	        scriptEl.onreadystatechange = null;
	        scriptEl.parentNode.removeChild(scriptEl);
	        scriptEl = null;
	      };
	      global.document.documentElement.appendChild(scriptEl);
	    };
	  } else {
	    scheduleDrain = function () {
	      setTimeout(nextTick, 0);
	    };
	  }
	}

	var draining;
	var queue = [];
	//named nextTick for less confusing stack traces
	function nextTick() {
	  draining = true;
	  var i, oldQueue;
	  var len = queue.length;
	  while (len) {
	    oldQueue = queue;
	    queue = [];
	    i = -1;
	    while (++i < len) {
	      oldQueue[i]();
	    }
	    len = queue.length;
	  }
	  draining = false;
	}

	module.exports = immediate;
	function immediate(task) {
	  if (queue.push(task) === 1 && !draining) {
	    scheduleDrain();
	  }
	}

	}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {});
	},{}],2:[function(_dereq_,module,exports){
	var immediate = _dereq_(1);

	/* istanbul ignore next */
	function INTERNAL() {}

	var handlers = {};

	var REJECTED = ['REJECTED'];
	var FULFILLED = ['FULFILLED'];
	var PENDING = ['PENDING'];

	module.exports = Promise;

	function Promise(resolver) {
	  if (typeof resolver !== 'function') {
	    throw new TypeError('resolver must be a function');
	  }
	  this.state = PENDING;
	  this.queue = [];
	  this.outcome = void 0;
	  if (resolver !== INTERNAL) {
	    safelyResolveThenable(this, resolver);
	  }
	}

	Promise.prototype["catch"] = function (onRejected) {
	  return this.then(null, onRejected);
	};
	Promise.prototype.then = function (onFulfilled, onRejected) {
	  if (typeof onFulfilled !== 'function' && this.state === FULFILLED ||
	    typeof onRejected !== 'function' && this.state === REJECTED) {
	    return this;
	  }
	  var promise = new this.constructor(INTERNAL);
	  if (this.state !== PENDING) {
	    var resolver = this.state === FULFILLED ? onFulfilled : onRejected;
	    unwrap(promise, resolver, this.outcome);
	  } else {
	    this.queue.push(new QueueItem(promise, onFulfilled, onRejected));
	  }

	  return promise;
	};
	function QueueItem(promise, onFulfilled, onRejected) {
	  this.promise = promise;
	  if (typeof onFulfilled === 'function') {
	    this.onFulfilled = onFulfilled;
	    this.callFulfilled = this.otherCallFulfilled;
	  }
	  if (typeof onRejected === 'function') {
	    this.onRejected = onRejected;
	    this.callRejected = this.otherCallRejected;
	  }
	}
	QueueItem.prototype.callFulfilled = function (value) {
	  handlers.resolve(this.promise, value);
	};
	QueueItem.prototype.otherCallFulfilled = function (value) {
	  unwrap(this.promise, this.onFulfilled, value);
	};
	QueueItem.prototype.callRejected = function (value) {
	  handlers.reject(this.promise, value);
	};
	QueueItem.prototype.otherCallRejected = function (value) {
	  unwrap(this.promise, this.onRejected, value);
	};

	function unwrap(promise, func, value) {
	  immediate(function () {
	    var returnValue;
	    try {
	      returnValue = func(value);
	    } catch (e) {
	      return handlers.reject(promise, e);
	    }
	    if (returnValue === promise) {
	      handlers.reject(promise, new TypeError('Cannot resolve promise with itself'));
	    } else {
	      handlers.resolve(promise, returnValue);
	    }
	  });
	}

	handlers.resolve = function (self, value) {
	  var result = tryCatch(getThen, value);
	  if (result.status === 'error') {
	    return handlers.reject(self, result.value);
	  }
	  var thenable = result.value;

	  if (thenable) {
	    safelyResolveThenable(self, thenable);
	  } else {
	    self.state = FULFILLED;
	    self.outcome = value;
	    var i = -1;
	    var len = self.queue.length;
	    while (++i < len) {
	      self.queue[i].callFulfilled(value);
	    }
	  }
	  return self;
	};
	handlers.reject = function (self, error) {
	  self.state = REJECTED;
	  self.outcome = error;
	  var i = -1;
	  var len = self.queue.length;
	  while (++i < len) {
	    self.queue[i].callRejected(error);
	  }
	  return self;
	};

	function getThen(obj) {
	  // Make sure we only access the accessor once as required by the spec
	  var then = obj && obj.then;
	  if (obj && (typeof obj === 'object' || typeof obj === 'function') && typeof then === 'function') {
	    return function appyThen() {
	      then.apply(obj, arguments);
	    };
	  }
	}

	function safelyResolveThenable(self, thenable) {
	  // Either fulfill, reject or reject with error
	  var called = false;
	  function onError(value) {
	    if (called) {
	      return;
	    }
	    called = true;
	    handlers.reject(self, value);
	  }

	  function onSuccess(value) {
	    if (called) {
	      return;
	    }
	    called = true;
	    handlers.resolve(self, value);
	  }

	  function tryToUnwrap() {
	    thenable(onSuccess, onError);
	  }

	  var result = tryCatch(tryToUnwrap);
	  if (result.status === 'error') {
	    onError(result.value);
	  }
	}

	function tryCatch(func, value) {
	  var out = {};
	  try {
	    out.value = func(value);
	    out.status = 'success';
	  } catch (e) {
	    out.status = 'error';
	    out.value = e;
	  }
	  return out;
	}

	Promise.resolve = resolve;
	function resolve(value) {
	  if (value instanceof this) {
	    return value;
	  }
	  return handlers.resolve(new this(INTERNAL), value);
	}

	Promise.reject = reject;
	function reject(reason) {
	  var promise = new this(INTERNAL);
	  return handlers.reject(promise, reason);
	}

	Promise.all = all;
	function all(iterable) {
	  var self = this;
	  if (Object.prototype.toString.call(iterable) !== '[object Array]') {
	    return this.reject(new TypeError('must be an array'));
	  }

	  var len = iterable.length;
	  var called = false;
	  if (!len) {
	    return this.resolve([]);
	  }

	  var values = new Array(len);
	  var resolved = 0;
	  var i = -1;
	  var promise = new this(INTERNAL);

	  while (++i < len) {
	    allResolver(iterable[i], i);
	  }
	  return promise;
	  function allResolver(value, i) {
	    self.resolve(value).then(resolveFromAll, function (error) {
	      if (!called) {
	        called = true;
	        handlers.reject(promise, error);
	      }
	    });
	    function resolveFromAll(outValue) {
	      values[i] = outValue;
	      if (++resolved === len && !called) {
	        called = true;
	        handlers.resolve(promise, values);
	      }
	    }
	  }
	}

	Promise.race = race;
	function race(iterable) {
	  var self = this;
	  if (Object.prototype.toString.call(iterable) !== '[object Array]') {
	    return this.reject(new TypeError('must be an array'));
	  }

	  var len = iterable.length;
	  var called = false;
	  if (!len) {
	    return this.resolve([]);
	  }

	  var i = -1;
	  var promise = new this(INTERNAL);

	  while (++i < len) {
	    resolver(iterable[i]);
	  }
	  return promise;
	  function resolver(value) {
	    self.resolve(value).then(function (response) {
	      if (!called) {
	        called = true;
	        handlers.resolve(promise, response);
	      }
	    }, function (error) {
	      if (!called) {
	        called = true;
	        handlers.reject(promise, error);
	      }
	    });
	  }
	}

	},{"1":1}],3:[function(_dereq_,module,exports){
	(function (global){
	if (typeof global.Promise !== 'function') {
	  global.Promise = _dereq_(2);
	}

	}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {});
	},{"2":2}],4:[function(_dereq_,module,exports){

	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	function getIDB() {
	    /* global indexedDB,webkitIndexedDB,mozIndexedDB,OIndexedDB,msIndexedDB */
	    try {
	        if (typeof indexedDB !== 'undefined') {
	            return indexedDB;
	        }
	        if (typeof webkitIndexedDB !== 'undefined') {
	            return webkitIndexedDB;
	        }
	        if (typeof mozIndexedDB !== 'undefined') {
	            return mozIndexedDB;
	        }
	        if (typeof OIndexedDB !== 'undefined') {
	            return OIndexedDB;
	        }
	        if (typeof msIndexedDB !== 'undefined') {
	            return msIndexedDB;
	        }
	    } catch (e) {
	        return;
	    }
	}

	var idb = getIDB();

	function isIndexedDBValid() {
	    try {
	        // Initialize IndexedDB; fall back to vendor-prefixed versions
	        // if needed.
	        if (!idb) {
	            return false;
	        }
	        // We mimic PouchDB here;
	        //
	        // We test for openDatabase because IE Mobile identifies itself
	        // as Safari. Oh the lulz...
	        var isSafari = typeof openDatabase !== 'undefined' && /(Safari|iPhone|iPad|iPod)/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent) && !/BlackBerry/.test(navigator.platform);

	        var hasFetch = typeof fetch === 'function' && fetch.toString().indexOf('[native code') !== -1;

	        // Safari <10.1 does not meet our requirements for IDB support (#5572)
	        // since Safari 10.1 shipped with fetch, we can use that to detect it
	        return (!isSafari || hasFetch) && typeof indexedDB !== 'undefined' &&
	        // some outdated implementations of IDB that appear on Samsung
	        // and HTC Android devices <4.4 are missing IDBKeyRange
	        // See: https://github.com/mozilla/localForage/issues/128
	        // See: https://github.com/mozilla/localForage/issues/272
	        typeof IDBKeyRange !== 'undefined';
	    } catch (e) {
	        return false;
	    }
	}

	// Abstracts constructing a Blob object, so it also works in older
	// browsers that don't support the native Blob constructor. (i.e.
	// old QtWebKit versions, at least).
	// Abstracts constructing a Blob object, so it also works in older
	// browsers that don't support the native Blob constructor. (i.e.
	// old QtWebKit versions, at least).
	function createBlob(parts, properties) {
	    /* global BlobBuilder,MSBlobBuilder,MozBlobBuilder,WebKitBlobBuilder */
	    parts = parts || [];
	    properties = properties || {};
	    try {
	        return new Blob(parts, properties);
	    } catch (e) {
	        if (e.name !== 'TypeError') {
	            throw e;
	        }
	        var Builder = typeof BlobBuilder !== 'undefined' ? BlobBuilder : typeof MSBlobBuilder !== 'undefined' ? MSBlobBuilder : typeof MozBlobBuilder !== 'undefined' ? MozBlobBuilder : WebKitBlobBuilder;
	        var builder = new Builder();
	        for (var i = 0; i < parts.length; i += 1) {
	            builder.append(parts[i]);
	        }
	        return builder.getBlob(properties.type);
	    }
	}

	// This is CommonJS because lie is an external dependency, so Rollup
	// can just ignore it.
	if (typeof Promise === 'undefined') {
	    // In the "nopromises" build this will just throw if you don't have
	    // a global promise object, but it would throw anyway later.
	    _dereq_(3);
	}
	var Promise$1 = Promise;

	function executeCallback(promise, callback) {
	    if (callback) {
	        promise.then(function (result) {
	            callback(null, result);
	        }, function (error) {
	            callback(error);
	        });
	    }
	}

	function executeTwoCallbacks(promise, callback, errorCallback) {
	    if (typeof callback === 'function') {
	        promise.then(callback);
	    }

	    if (typeof errorCallback === 'function') {
	        promise["catch"](errorCallback);
	    }
	}

	function normalizeKey(key) {
	    // Cast the key to a string, as that's all we can set as a key.
	    if (typeof key !== 'string') {
	        console.warn(key + ' used as a key, but it is not a string.');
	        key = String(key);
	    }

	    return key;
	}

	function getCallback() {
	    if (arguments.length && typeof arguments[arguments.length - 1] === 'function') {
	        return arguments[arguments.length - 1];
	    }
	}

	// Some code originally from async_storage.js in
	// [Gaia](https://github.com/mozilla-b2g/gaia).

	var DETECT_BLOB_SUPPORT_STORE = 'local-forage-detect-blob-support';
	var supportsBlobs = void 0;
	var dbContexts = {};
	var toString = Object.prototype.toString;

	// Transaction Modes
	var READ_ONLY = 'readonly';
	var READ_WRITE = 'readwrite';

	// Transform a binary string to an array buffer, because otherwise
	// weird stuff happens when you try to work with the binary string directly.
	// It is known.
	// From http://stackoverflow.com/questions/14967647/ (continues on next line)
	// encode-decode-image-with-base64-breaks-image (2013-04-21)
	function _binStringToArrayBuffer(bin) {
	    var length = bin.length;
	    var buf = new ArrayBuffer(length);
	    var arr = new Uint8Array(buf);
	    for (var i = 0; i < length; i++) {
	        arr[i] = bin.charCodeAt(i);
	    }
	    return buf;
	}

	//
	// Blobs are not supported in all versions of IndexedDB, notably
	// Chrome <37 and Android <5. In those versions, storing a blob will throw.
	//
	// Various other blob bugs exist in Chrome v37-42 (inclusive).
	// Detecting them is expensive and confusing to users, and Chrome 37-42
	// is at very low usage worldwide, so we do a hacky userAgent check instead.
	//
	// content-type bug: https://code.google.com/p/chromium/issues/detail?id=408120
	// 404 bug: https://code.google.com/p/chromium/issues/detail?id=447916
	// FileReader bug: https://code.google.com/p/chromium/issues/detail?id=447836
	//
	// Code borrowed from PouchDB. See:
	// https://github.com/pouchdb/pouchdb/blob/master/packages/node_modules/pouchdb-adapter-idb/src/blobSupport.js
	//
	function _checkBlobSupportWithoutCaching(idb) {
	    return new Promise$1(function (resolve) {
	        var txn = idb.transaction(DETECT_BLOB_SUPPORT_STORE, READ_WRITE);
	        var blob = createBlob(['']);
	        txn.objectStore(DETECT_BLOB_SUPPORT_STORE).put(blob, 'key');

	        txn.onabort = function (e) {
	            // If the transaction aborts now its due to not being able to
	            // write to the database, likely due to the disk being full
	            e.preventDefault();
	            e.stopPropagation();
	            resolve(false);
	        };

	        txn.oncomplete = function () {
	            var matchedChrome = navigator.userAgent.match(/Chrome\/(\d+)/);
	            var matchedEdge = navigator.userAgent.match(/Edge\//);
	            // MS Edge pretends to be Chrome 42:
	            // https://msdn.microsoft.com/en-us/library/hh869301%28v=vs.85%29.aspx
	            resolve(matchedEdge || !matchedChrome || parseInt(matchedChrome[1], 10) >= 43);
	        };
	    })["catch"](function () {
	        return false; // error, so assume unsupported
	    });
	}

	function _checkBlobSupport(idb) {
	    if (typeof supportsBlobs === 'boolean') {
	        return Promise$1.resolve(supportsBlobs);
	    }
	    return _checkBlobSupportWithoutCaching(idb).then(function (value) {
	        supportsBlobs = value;
	        return supportsBlobs;
	    });
	}

	function _deferReadiness(dbInfo) {
	    var dbContext = dbContexts[dbInfo.name];

	    // Create a deferred object representing the current database operation.
	    var deferredOperation = {};

	    deferredOperation.promise = new Promise$1(function (resolve, reject) {
	        deferredOperation.resolve = resolve;
	        deferredOperation.reject = reject;
	    });

	    // Enqueue the deferred operation.
	    dbContext.deferredOperations.push(deferredOperation);

	    // Chain its promise to the database readiness.
	    if (!dbContext.dbReady) {
	        dbContext.dbReady = deferredOperation.promise;
	    } else {
	        dbContext.dbReady = dbContext.dbReady.then(function () {
	            return deferredOperation.promise;
	        });
	    }
	}

	function _advanceReadiness(dbInfo) {
	    var dbContext = dbContexts[dbInfo.name];

	    // Dequeue a deferred operation.
	    var deferredOperation = dbContext.deferredOperations.pop();

	    // Resolve its promise (which is part of the database readiness
	    // chain of promises).
	    if (deferredOperation) {
	        deferredOperation.resolve();
	        return deferredOperation.promise;
	    }
	}

	function _rejectReadiness(dbInfo, err) {
	    var dbContext = dbContexts[dbInfo.name];

	    // Dequeue a deferred operation.
	    var deferredOperation = dbContext.deferredOperations.pop();

	    // Reject its promise (which is part of the database readiness
	    // chain of promises).
	    if (deferredOperation) {
	        deferredOperation.reject(err);
	        return deferredOperation.promise;
	    }
	}

	function _getConnection(dbInfo, upgradeNeeded) {
	    return new Promise$1(function (resolve, reject) {
	        dbContexts[dbInfo.name] = dbContexts[dbInfo.name] || createDbContext();

	        if (dbInfo.db) {
	            if (upgradeNeeded) {
	                _deferReadiness(dbInfo);
	                dbInfo.db.close();
	            } else {
	                return resolve(dbInfo.db);
	            }
	        }

	        var dbArgs = [dbInfo.name];

	        if (upgradeNeeded) {
	            dbArgs.push(dbInfo.version);
	        }

	        var openreq = idb.open.apply(idb, dbArgs);

	        if (upgradeNeeded) {
	            openreq.onupgradeneeded = function (e) {
	                var db = openreq.result;
	                try {
	                    db.createObjectStore(dbInfo.storeName);
	                    if (e.oldVersion <= 1) {
	                        // Added when support for blob shims was added
	                        db.createObjectStore(DETECT_BLOB_SUPPORT_STORE);
	                    }
	                } catch (ex) {
	                    if (ex.name === 'ConstraintError') {
	                        console.warn('The database "' + dbInfo.name + '"' + ' has been upgraded from version ' + e.oldVersion + ' to version ' + e.newVersion + ', but the storage "' + dbInfo.storeName + '" already exists.');
	                    } else {
	                        throw ex;
	                    }
	                }
	            };
	        }

	        openreq.onerror = function (e) {
	            e.preventDefault();
	            reject(openreq.error);
	        };

	        openreq.onsuccess = function () {
	            resolve(openreq.result);
	            _advanceReadiness(dbInfo);
	        };
	    });
	}

	function _getOriginalConnection(dbInfo) {
	    return _getConnection(dbInfo, false);
	}

	function _getUpgradedConnection(dbInfo) {
	    return _getConnection(dbInfo, true);
	}

	function _isUpgradeNeeded(dbInfo, defaultVersion) {
	    if (!dbInfo.db) {
	        return true;
	    }

	    var isNewStore = !dbInfo.db.objectStoreNames.contains(dbInfo.storeName);
	    var isDowngrade = dbInfo.version < dbInfo.db.version;
	    var isUpgrade = dbInfo.version > dbInfo.db.version;

	    if (isDowngrade) {
	        // If the version is not the default one
	        // then warn for impossible downgrade.
	        if (dbInfo.version !== defaultVersion) {
	            console.warn('The database "' + dbInfo.name + '"' + " can't be downgraded from version " + dbInfo.db.version + ' to version ' + dbInfo.version + '.');
	        }
	        // Align the versions to prevent errors.
	        dbInfo.version = dbInfo.db.version;
	    }

	    if (isUpgrade || isNewStore) {
	        // If the store is new then increment the version (if needed).
	        // This will trigger an "upgradeneeded" event which is required
	        // for creating a store.
	        if (isNewStore) {
	            var incVersion = dbInfo.db.version + 1;
	            if (incVersion > dbInfo.version) {
	                dbInfo.version = incVersion;
	            }
	        }

	        return true;
	    }

	    return false;
	}

	// encode a blob for indexeddb engines that don't support blobs
	function _encodeBlob(blob) {
	    return new Promise$1(function (resolve, reject) {
	        var reader = new FileReader();
	        reader.onerror = reject;
	        reader.onloadend = function (e) {
	            var base64 = btoa(e.target.result || '');
	            resolve({
	                __local_forage_encoded_blob: true,
	                data: base64,
	                type: blob.type
	            });
	        };
	        reader.readAsBinaryString(blob);
	    });
	}

	// decode an encoded blob
	function _decodeBlob(encodedBlob) {
	    var arrayBuff = _binStringToArrayBuffer(atob(encodedBlob.data));
	    return createBlob([arrayBuff], { type: encodedBlob.type });
	}

	// is this one of our fancy encoded blobs?
	function _isEncodedBlob(value) {
	    return value && value.__local_forage_encoded_blob;
	}

	// Specialize the default `ready()` function by making it dependent
	// on the current database operations. Thus, the driver will be actually
	// ready when it's been initialized (default) *and* there are no pending
	// operations on the database (initiated by some other instances).
	function _fullyReady(callback) {
	    var self = this;

	    var promise = self._initReady().then(function () {
	        var dbContext = dbContexts[self._dbInfo.name];

	        if (dbContext && dbContext.dbReady) {
	            return dbContext.dbReady;
	        }
	    });

	    executeTwoCallbacks(promise, callback, callback);
	    return promise;
	}

	// Try to establish a new db connection to replace the
	// current one which is broken (i.e. experiencing
	// InvalidStateError while creating a transaction).
	function _tryReconnect(dbInfo) {
	    _deferReadiness(dbInfo);

	    var dbContext = dbContexts[dbInfo.name];
	    var forages = dbContext.forages;

	    for (var i = 0; i < forages.length; i++) {
	        var forage = forages[i];
	        if (forage._dbInfo.db) {
	            forage._dbInfo.db.close();
	            forage._dbInfo.db = null;
	        }
	    }
	    dbInfo.db = null;

	    return _getOriginalConnection(dbInfo).then(function (db) {
	        dbInfo.db = db;
	        if (_isUpgradeNeeded(dbInfo)) {
	            // Reopen the database for upgrading.
	            return _getUpgradedConnection(dbInfo);
	        }
	        return db;
	    }).then(function (db) {
	        // store the latest db reference
	        // in case the db was upgraded
	        dbInfo.db = dbContext.db = db;
	        for (var i = 0; i < forages.length; i++) {
	            forages[i]._dbInfo.db = db;
	        }
	    })["catch"](function (err) {
	        _rejectReadiness(dbInfo, err);
	        throw err;
	    });
	}

	// FF doesn't like Promises (micro-tasks) and IDDB store operations,
	// so we have to do it with callbacks
	function createTransaction(dbInfo, mode, callback, retries) {
	    if (retries === undefined) {
	        retries = 1;
	    }

	    try {
	        var tx = dbInfo.db.transaction(dbInfo.storeName, mode);
	        callback(null, tx);
	    } catch (err) {
	        if (retries > 0 && (!dbInfo.db || err.name === 'InvalidStateError' || err.name === 'NotFoundError')) {
	            return Promise$1.resolve().then(function () {
	                if (!dbInfo.db || err.name === 'NotFoundError' && !dbInfo.db.objectStoreNames.contains(dbInfo.storeName) && dbInfo.version <= dbInfo.db.version) {
	                    // increase the db version, to create the new ObjectStore
	                    if (dbInfo.db) {
	                        dbInfo.version = dbInfo.db.version + 1;
	                    }
	                    // Reopen the database for upgrading.
	                    return _getUpgradedConnection(dbInfo);
	                }
	            }).then(function () {
	                return _tryReconnect(dbInfo).then(function () {
	                    createTransaction(dbInfo, mode, callback, retries - 1);
	                });
	            })["catch"](callback);
	        }

	        callback(err);
	    }
	}

	function createDbContext() {
	    return {
	        // Running localForages sharing a database.
	        forages: [],
	        // Shared database.
	        db: null,
	        // Database readiness (promise).
	        dbReady: null,
	        // Deferred operations on the database.
	        deferredOperations: []
	    };
	}

	// Open the IndexedDB database (automatically creates one if one didn't
	// previously exist), using any options set in the config.
	function _initStorage(options) {
	    var self = this;
	    var dbInfo = {
	        db: null
	    };

	    if (options) {
	        for (var i in options) {
	            dbInfo[i] = options[i];
	        }
	    }

	    // Get the current context of the database;
	    var dbContext = dbContexts[dbInfo.name];

	    // ...or create a new context.
	    if (!dbContext) {
	        dbContext = createDbContext();
	        // Register the new context in the global container.
	        dbContexts[dbInfo.name] = dbContext;
	    }

	    // Register itself as a running localForage in the current context.
	    dbContext.forages.push(self);

	    // Replace the default `ready()` function with the specialized one.
	    if (!self._initReady) {
	        self._initReady = self.ready;
	        self.ready = _fullyReady;
	    }

	    // Create an array of initialization states of the related localForages.
	    var initPromises = [];

	    function ignoreErrors() {
	        // Don't handle errors here,
	        // just makes sure related localForages aren't pending.
	        return Promise$1.resolve();
	    }

	    for (var j = 0; j < dbContext.forages.length; j++) {
	        var forage = dbContext.forages[j];
	        if (forage !== self) {
	            // Don't wait for itself...
	            initPromises.push(forage._initReady()["catch"](ignoreErrors));
	        }
	    }

	    // Take a snapshot of the related localForages.
	    var forages = dbContext.forages.slice(0);

	    // Initialize the connection process only when
	    // all the related localForages aren't pending.
	    return Promise$1.all(initPromises).then(function () {
	        dbInfo.db = dbContext.db;
	        // Get the connection or open a new one without upgrade.
	        return _getOriginalConnection(dbInfo);
	    }).then(function (db) {
	        dbInfo.db = db;
	        if (_isUpgradeNeeded(dbInfo, self._defaultConfig.version)) {
	            // Reopen the database for upgrading.
	            return _getUpgradedConnection(dbInfo);
	        }
	        return db;
	    }).then(function (db) {
	        dbInfo.db = dbContext.db = db;
	        self._dbInfo = dbInfo;
	        // Share the final connection amongst related localForages.
	        for (var k = 0; k < forages.length; k++) {
	            var forage = forages[k];
	            if (forage !== self) {
	                // Self is already up-to-date.
	                forage._dbInfo.db = dbInfo.db;
	                forage._dbInfo.version = dbInfo.version;
	            }
	        }
	    });
	}

	function getItem(key, callback) {
	    var self = this;

	    key = normalizeKey(key);

	    var promise = new Promise$1(function (resolve, reject) {
	        self.ready().then(function () {
	            createTransaction(self._dbInfo, READ_ONLY, function (err, transaction) {
	                if (err) {
	                    return reject(err);
	                }

	                try {
	                    var store = transaction.objectStore(self._dbInfo.storeName);
	                    var req = store.get(key);

	                    req.onsuccess = function () {
	                        var value = req.result;
	                        if (value === undefined) {
	                            value = null;
	                        }
	                        if (_isEncodedBlob(value)) {
	                            value = _decodeBlob(value);
	                        }
	                        resolve(value);
	                    };

	                    req.onerror = function () {
	                        reject(req.error);
	                    };
	                } catch (e) {
	                    reject(e);
	                }
	            });
	        })["catch"](reject);
	    });

	    executeCallback(promise, callback);
	    return promise;
	}

	// Iterate over all items stored in database.
	function iterate(iterator, callback) {
	    var self = this;

	    var promise = new Promise$1(function (resolve, reject) {
	        self.ready().then(function () {
	            createTransaction(self._dbInfo, READ_ONLY, function (err, transaction) {
	                if (err) {
	                    return reject(err);
	                }

	                try {
	                    var store = transaction.objectStore(self._dbInfo.storeName);
	                    var req = store.openCursor();
	                    var iterationNumber = 1;

	                    req.onsuccess = function () {
	                        var cursor = req.result;

	                        if (cursor) {
	                            var value = cursor.value;
	                            if (_isEncodedBlob(value)) {
	                                value = _decodeBlob(value);
	                            }
	                            var result = iterator(value, cursor.key, iterationNumber++);

	                            // when the iterator callback retuns any
	                            // (non-`undefined`) value, then we stop
	                            // the iteration immediately
	                            if (result !== void 0) {
	                                resolve(result);
	                            } else {
	                                cursor["continue"]();
	                            }
	                        } else {
	                            resolve();
	                        }
	                    };

	                    req.onerror = function () {
	                        reject(req.error);
	                    };
	                } catch (e) {
	                    reject(e);
	                }
	            });
	        })["catch"](reject);
	    });

	    executeCallback(promise, callback);

	    return promise;
	}

	function setItem(key, value, callback) {
	    var self = this;

	    key = normalizeKey(key);

	    var promise = new Promise$1(function (resolve, reject) {
	        var dbInfo;
	        self.ready().then(function () {
	            dbInfo = self._dbInfo;
	            if (toString.call(value) === '[object Blob]') {
	                return _checkBlobSupport(dbInfo.db).then(function (blobSupport) {
	                    if (blobSupport) {
	                        return value;
	                    }
	                    return _encodeBlob(value);
	                });
	            }
	            return value;
	        }).then(function (value) {
	            createTransaction(self._dbInfo, READ_WRITE, function (err, transaction) {
	                if (err) {
	                    return reject(err);
	                }

	                try {
	                    var store = transaction.objectStore(self._dbInfo.storeName);

	                    // The reason we don't _save_ null is because IE 10 does
	                    // not support saving the `null` type in IndexedDB. How
	                    // ironic, given the bug below!
	                    // See: https://github.com/mozilla/localForage/issues/161
	                    if (value === null) {
	                        value = undefined;
	                    }

	                    var req = store.put(value, key);

	                    transaction.oncomplete = function () {
	                        // Cast to undefined so the value passed to
	                        // callback/promise is the same as what one would get out
	                        // of `getItem()` later. This leads to some weirdness
	                        // (setItem('foo', undefined) will return `null`), but
	                        // it's not my fault localStorage is our baseline and that
	                        // it's weird.
	                        if (value === undefined) {
	                            value = null;
	                        }

	                        resolve(value);
	                    };
	                    transaction.onabort = transaction.onerror = function () {
	                        var err = req.error ? req.error : req.transaction.error;
	                        reject(err);
	                    };
	                } catch (e) {
	                    reject(e);
	                }
	            });
	        })["catch"](reject);
	    });

	    executeCallback(promise, callback);
	    return promise;
	}

	function removeItem(key, callback) {
	    var self = this;

	    key = normalizeKey(key);

	    var promise = new Promise$1(function (resolve, reject) {
	        self.ready().then(function () {
	            createTransaction(self._dbInfo, READ_WRITE, function (err, transaction) {
	                if (err) {
	                    return reject(err);
	                }

	                try {
	                    var store = transaction.objectStore(self._dbInfo.storeName);
	                    // We use a Grunt task to make this safe for IE and some
	                    // versions of Android (including those used by Cordova).
	                    // Normally IE won't like `.delete()` and will insist on
	                    // using `['delete']()`, but we have a build step that
	                    // fixes this for us now.
	                    var req = store["delete"](key);
	                    transaction.oncomplete = function () {
	                        resolve();
	                    };

	                    transaction.onerror = function () {
	                        reject(req.error);
	                    };

	                    // The request will be also be aborted if we've exceeded our storage
	                    // space.
	                    transaction.onabort = function () {
	                        var err = req.error ? req.error : req.transaction.error;
	                        reject(err);
	                    };
	                } catch (e) {
	                    reject(e);
	                }
	            });
	        })["catch"](reject);
	    });

	    executeCallback(promise, callback);
	    return promise;
	}

	function clear(callback) {
	    var self = this;

	    var promise = new Promise$1(function (resolve, reject) {
	        self.ready().then(function () {
	            createTransaction(self._dbInfo, READ_WRITE, function (err, transaction) {
	                if (err) {
	                    return reject(err);
	                }

	                try {
	                    var store = transaction.objectStore(self._dbInfo.storeName);
	                    var req = store.clear();

	                    transaction.oncomplete = function () {
	                        resolve();
	                    };

	                    transaction.onabort = transaction.onerror = function () {
	                        var err = req.error ? req.error : req.transaction.error;
	                        reject(err);
	                    };
	                } catch (e) {
	                    reject(e);
	                }
	            });
	        })["catch"](reject);
	    });

	    executeCallback(promise, callback);
	    return promise;
	}

	function length(callback) {
	    var self = this;

	    var promise = new Promise$1(function (resolve, reject) {
	        self.ready().then(function () {
	            createTransaction(self._dbInfo, READ_ONLY, function (err, transaction) {
	                if (err) {
	                    return reject(err);
	                }

	                try {
	                    var store = transaction.objectStore(self._dbInfo.storeName);
	                    var req = store.count();

	                    req.onsuccess = function () {
	                        resolve(req.result);
	                    };

	                    req.onerror = function () {
	                        reject(req.error);
	                    };
	                } catch (e) {
	                    reject(e);
	                }
	            });
	        })["catch"](reject);
	    });

	    executeCallback(promise, callback);
	    return promise;
	}

	function key(n, callback) {
	    var self = this;

	    var promise = new Promise$1(function (resolve, reject) {
	        if (n < 0) {
	            resolve(null);

	            return;
	        }

	        self.ready().then(function () {
	            createTransaction(self._dbInfo, READ_ONLY, function (err, transaction) {
	                if (err) {
	                    return reject(err);
	                }

	                try {
	                    var store = transaction.objectStore(self._dbInfo.storeName);
	                    var advanced = false;
	                    var req = store.openCursor();

	                    req.onsuccess = function () {
	                        var cursor = req.result;
	                        if (!cursor) {
	                            // this means there weren't enough keys
	                            resolve(null);

	                            return;
	                        }

	                        if (n === 0) {
	                            // We have the first key, return it if that's what they
	                            // wanted.
	                            resolve(cursor.key);
	                        } else {
	                            if (!advanced) {
	                                // Otherwise, ask the cursor to skip ahead n
	                                // records.
	                                advanced = true;
	                                cursor.advance(n);
	                            } else {
	                                // When we get here, we've got the nth key.
	                                resolve(cursor.key);
	                            }
	                        }
	                    };

	                    req.onerror = function () {
	                        reject(req.error);
	                    };
	                } catch (e) {
	                    reject(e);
	                }
	            });
	        })["catch"](reject);
	    });

	    executeCallback(promise, callback);
	    return promise;
	}

	function keys(callback) {
	    var self = this;

	    var promise = new Promise$1(function (resolve, reject) {
	        self.ready().then(function () {
	            createTransaction(self._dbInfo, READ_ONLY, function (err, transaction) {
	                if (err) {
	                    return reject(err);
	                }

	                try {
	                    var store = transaction.objectStore(self._dbInfo.storeName);
	                    var req = store.openCursor();
	                    var keys = [];

	                    req.onsuccess = function () {
	                        var cursor = req.result;

	                        if (!cursor) {
	                            resolve(keys);
	                            return;
	                        }

	                        keys.push(cursor.key);
	                        cursor["continue"]();
	                    };

	                    req.onerror = function () {
	                        reject(req.error);
	                    };
	                } catch (e) {
	                    reject(e);
	                }
	            });
	        })["catch"](reject);
	    });

	    executeCallback(promise, callback);
	    return promise;
	}

	function dropInstance(options, callback) {
	    callback = getCallback.apply(this, arguments);

	    var currentConfig = this.config();
	    options = typeof options !== 'function' && options || {};
	    if (!options.name) {
	        options.name = options.name || currentConfig.name;
	        options.storeName = options.storeName || currentConfig.storeName;
	    }

	    var self = this;
	    var promise;
	    if (!options.name) {
	        promise = Promise$1.reject('Invalid arguments');
	    } else {
	        var isCurrentDb = options.name === currentConfig.name && self._dbInfo.db;

	        var dbPromise = isCurrentDb ? Promise$1.resolve(self._dbInfo.db) : _getOriginalConnection(options).then(function (db) {
	            var dbContext = dbContexts[options.name];
	            var forages = dbContext.forages;
	            dbContext.db = db;
	            for (var i = 0; i < forages.length; i++) {
	                forages[i]._dbInfo.db = db;
	            }
	            return db;
	        });

	        if (!options.storeName) {
	            promise = dbPromise.then(function (db) {
	                _deferReadiness(options);

	                var dbContext = dbContexts[options.name];
	                var forages = dbContext.forages;

	                db.close();
	                for (var i = 0; i < forages.length; i++) {
	                    var forage = forages[i];
	                    forage._dbInfo.db = null;
	                }

	                var dropDBPromise = new Promise$1(function (resolve, reject) {
	                    var req = idb.deleteDatabase(options.name);

	                    req.onerror = req.onblocked = function (err) {
	                        var db = req.result;
	                        if (db) {
	                            db.close();
	                        }
	                        reject(err);
	                    };

	                    req.onsuccess = function () {
	                        var db = req.result;
	                        if (db) {
	                            db.close();
	                        }
	                        resolve(db);
	                    };
	                });

	                return dropDBPromise.then(function (db) {
	                    dbContext.db = db;
	                    for (var i = 0; i < forages.length; i++) {
	                        var _forage = forages[i];
	                        _advanceReadiness(_forage._dbInfo);
	                    }
	                })["catch"](function (err) {
	                    (_rejectReadiness(options, err) || Promise$1.resolve())["catch"](function () {});
	                    throw err;
	                });
	            });
	        } else {
	            promise = dbPromise.then(function (db) {
	                if (!db.objectStoreNames.contains(options.storeName)) {
	                    return;
	                }

	                var newVersion = db.version + 1;

	                _deferReadiness(options);

	                var dbContext = dbContexts[options.name];
	                var forages = dbContext.forages;

	                db.close();
	                for (var i = 0; i < forages.length; i++) {
	                    var forage = forages[i];
	                    forage._dbInfo.db = null;
	                    forage._dbInfo.version = newVersion;
	                }

	                var dropObjectPromise = new Promise$1(function (resolve, reject) {
	                    var req = idb.open(options.name, newVersion);

	                    req.onerror = function (err) {
	                        var db = req.result;
	                        db.close();
	                        reject(err);
	                    };

	                    req.onupgradeneeded = function () {
	                        var db = req.result;
	                        db.deleteObjectStore(options.storeName);
	                    };

	                    req.onsuccess = function () {
	                        var db = req.result;
	                        db.close();
	                        resolve(db);
	                    };
	                });

	                return dropObjectPromise.then(function (db) {
	                    dbContext.db = db;
	                    for (var j = 0; j < forages.length; j++) {
	                        var _forage2 = forages[j];
	                        _forage2._dbInfo.db = db;
	                        _advanceReadiness(_forage2._dbInfo);
	                    }
	                })["catch"](function (err) {
	                    (_rejectReadiness(options, err) || Promise$1.resolve())["catch"](function () {});
	                    throw err;
	                });
	            });
	        }
	    }

	    executeCallback(promise, callback);
	    return promise;
	}

	var asyncStorage = {
	    _driver: 'asyncStorage',
	    _initStorage: _initStorage,
	    _support: isIndexedDBValid(),
	    iterate: iterate,
	    getItem: getItem,
	    setItem: setItem,
	    removeItem: removeItem,
	    clear: clear,
	    length: length,
	    key: key,
	    keys: keys,
	    dropInstance: dropInstance
	};

	function isWebSQLValid() {
	    return typeof openDatabase === 'function';
	}

	// Sadly, the best way to save binary data in WebSQL/localStorage is serializing
	// it to Base64, so this is how we store it to prevent very strange errors with less
	// verbose ways of binary <-> string data storage.
	var BASE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

	var BLOB_TYPE_PREFIX = '~~local_forage_type~';
	var BLOB_TYPE_PREFIX_REGEX = /^~~local_forage_type~([^~]+)~/;

	var SERIALIZED_MARKER = '__lfsc__:';
	var SERIALIZED_MARKER_LENGTH = SERIALIZED_MARKER.length;

	// OMG the serializations!
	var TYPE_ARRAYBUFFER = 'arbf';
	var TYPE_BLOB = 'blob';
	var TYPE_INT8ARRAY = 'si08';
	var TYPE_UINT8ARRAY = 'ui08';
	var TYPE_UINT8CLAMPEDARRAY = 'uic8';
	var TYPE_INT16ARRAY = 'si16';
	var TYPE_INT32ARRAY = 'si32';
	var TYPE_UINT16ARRAY = 'ur16';
	var TYPE_UINT32ARRAY = 'ui32';
	var TYPE_FLOAT32ARRAY = 'fl32';
	var TYPE_FLOAT64ARRAY = 'fl64';
	var TYPE_SERIALIZED_MARKER_LENGTH = SERIALIZED_MARKER_LENGTH + TYPE_ARRAYBUFFER.length;

	var toString$1 = Object.prototype.toString;

	function stringToBuffer(serializedString) {
	    // Fill the string into a ArrayBuffer.
	    var bufferLength = serializedString.length * 0.75;
	    var len = serializedString.length;
	    var i;
	    var p = 0;
	    var encoded1, encoded2, encoded3, encoded4;

	    if (serializedString[serializedString.length - 1] === '=') {
	        bufferLength--;
	        if (serializedString[serializedString.length - 2] === '=') {
	            bufferLength--;
	        }
	    }

	    var buffer = new ArrayBuffer(bufferLength);
	    var bytes = new Uint8Array(buffer);

	    for (i = 0; i < len; i += 4) {
	        encoded1 = BASE_CHARS.indexOf(serializedString[i]);
	        encoded2 = BASE_CHARS.indexOf(serializedString[i + 1]);
	        encoded3 = BASE_CHARS.indexOf(serializedString[i + 2]);
	        encoded4 = BASE_CHARS.indexOf(serializedString[i + 3]);

	        /*jslint bitwise: true */
	        bytes[p++] = encoded1 << 2 | encoded2 >> 4;
	        bytes[p++] = (encoded2 & 15) << 4 | encoded3 >> 2;
	        bytes[p++] = (encoded3 & 3) << 6 | encoded4 & 63;
	    }
	    return buffer;
	}

	// Converts a buffer to a string to store, serialized, in the backend
	// storage library.
	function bufferToString(buffer) {
	    // base64-arraybuffer
	    var bytes = new Uint8Array(buffer);
	    var base64String = '';
	    var i;

	    for (i = 0; i < bytes.length; i += 3) {
	        /*jslint bitwise: true */
	        base64String += BASE_CHARS[bytes[i] >> 2];
	        base64String += BASE_CHARS[(bytes[i] & 3) << 4 | bytes[i + 1] >> 4];
	        base64String += BASE_CHARS[(bytes[i + 1] & 15) << 2 | bytes[i + 2] >> 6];
	        base64String += BASE_CHARS[bytes[i + 2] & 63];
	    }

	    if (bytes.length % 3 === 2) {
	        base64String = base64String.substring(0, base64String.length - 1) + '=';
	    } else if (bytes.length % 3 === 1) {
	        base64String = base64String.substring(0, base64String.length - 2) + '==';
	    }

	    return base64String;
	}

	// Serialize a value, afterwards executing a callback (which usually
	// instructs the `setItem()` callback/promise to be executed). This is how
	// we store binary data with localStorage.
	function serialize(value, callback) {
	    var valueType = '';
	    if (value) {
	        valueType = toString$1.call(value);
	    }

	    // Cannot use `value instanceof ArrayBuffer` or such here, as these
	    // checks fail when running the tests using casper.js...
	    //
	    // TODO: See why those tests fail and use a better solution.
	    if (value && (valueType === '[object ArrayBuffer]' || value.buffer && toString$1.call(value.buffer) === '[object ArrayBuffer]')) {
	        // Convert binary arrays to a string and prefix the string with
	        // a special marker.
	        var buffer;
	        var marker = SERIALIZED_MARKER;

	        if (value instanceof ArrayBuffer) {
	            buffer = value;
	            marker += TYPE_ARRAYBUFFER;
	        } else {
	            buffer = value.buffer;

	            if (valueType === '[object Int8Array]') {
	                marker += TYPE_INT8ARRAY;
	            } else if (valueType === '[object Uint8Array]') {
	                marker += TYPE_UINT8ARRAY;
	            } else if (valueType === '[object Uint8ClampedArray]') {
	                marker += TYPE_UINT8CLAMPEDARRAY;
	            } else if (valueType === '[object Int16Array]') {
	                marker += TYPE_INT16ARRAY;
	            } else if (valueType === '[object Uint16Array]') {
	                marker += TYPE_UINT16ARRAY;
	            } else if (valueType === '[object Int32Array]') {
	                marker += TYPE_INT32ARRAY;
	            } else if (valueType === '[object Uint32Array]') {
	                marker += TYPE_UINT32ARRAY;
	            } else if (valueType === '[object Float32Array]') {
	                marker += TYPE_FLOAT32ARRAY;
	            } else if (valueType === '[object Float64Array]') {
	                marker += TYPE_FLOAT64ARRAY;
	            } else {
	                callback(new Error('Failed to get type for BinaryArray'));
	            }
	        }

	        callback(marker + bufferToString(buffer));
	    } else if (valueType === '[object Blob]') {
	        // Conver the blob to a binaryArray and then to a string.
	        var fileReader = new FileReader();

	        fileReader.onload = function () {
	            // Backwards-compatible prefix for the blob type.
	            var str = BLOB_TYPE_PREFIX + value.type + '~' + bufferToString(this.result);

	            callback(SERIALIZED_MARKER + TYPE_BLOB + str);
	        };

	        fileReader.readAsArrayBuffer(value);
	    } else {
	        try {
	            callback(JSON.stringify(value));
	        } catch (e) {
	            console.error("Couldn't convert value into a JSON string: ", value);

	            callback(null, e);
	        }
	    }
	}

	// Deserialize data we've inserted into a value column/field. We place
	// special markers into our strings to mark them as encoded; this isn't
	// as nice as a meta field, but it's the only sane thing we can do whilst
	// keeping localStorage support intact.
	//
	// Oftentimes this will just deserialize JSON content, but if we have a
	// special marker (SERIALIZED_MARKER, defined above), we will extract
	// some kind of arraybuffer/binary data/typed array out of the string.
	function deserialize(value) {
	    // If we haven't marked this string as being specially serialized (i.e.
	    // something other than serialized JSON), we can just return it and be
	    // done with it.
	    if (value.substring(0, SERIALIZED_MARKER_LENGTH) !== SERIALIZED_MARKER) {
	        return JSON.parse(value);
	    }

	    // The following code deals with deserializing some kind of Blob or
	    // TypedArray. First we separate out the type of data we're dealing
	    // with from the data itself.
	    var serializedString = value.substring(TYPE_SERIALIZED_MARKER_LENGTH);
	    var type = value.substring(SERIALIZED_MARKER_LENGTH, TYPE_SERIALIZED_MARKER_LENGTH);

	    var blobType;
	    // Backwards-compatible blob type serialization strategy.
	    // DBs created with older versions of localForage will simply not have the blob type.
	    if (type === TYPE_BLOB && BLOB_TYPE_PREFIX_REGEX.test(serializedString)) {
	        var matcher = serializedString.match(BLOB_TYPE_PREFIX_REGEX);
	        blobType = matcher[1];
	        serializedString = serializedString.substring(matcher[0].length);
	    }
	    var buffer = stringToBuffer(serializedString);

	    // Return the right type based on the code/type set during
	    // serialization.
	    switch (type) {
	        case TYPE_ARRAYBUFFER:
	            return buffer;
	        case TYPE_BLOB:
	            return createBlob([buffer], { type: blobType });
	        case TYPE_INT8ARRAY:
	            return new Int8Array(buffer);
	        case TYPE_UINT8ARRAY:
	            return new Uint8Array(buffer);
	        case TYPE_UINT8CLAMPEDARRAY:
	            return new Uint8ClampedArray(buffer);
	        case TYPE_INT16ARRAY:
	            return new Int16Array(buffer);
	        case TYPE_UINT16ARRAY:
	            return new Uint16Array(buffer);
	        case TYPE_INT32ARRAY:
	            return new Int32Array(buffer);
	        case TYPE_UINT32ARRAY:
	            return new Uint32Array(buffer);
	        case TYPE_FLOAT32ARRAY:
	            return new Float32Array(buffer);
	        case TYPE_FLOAT64ARRAY:
	            return new Float64Array(buffer);
	        default:
	            throw new Error('Unkown type: ' + type);
	    }
	}

	var localforageSerializer = {
	    serialize: serialize,
	    deserialize: deserialize,
	    stringToBuffer: stringToBuffer,
	    bufferToString: bufferToString
	};

	/*
	 * Includes code from:
	 *
	 * base64-arraybuffer
	 * https://github.com/niklasvh/base64-arraybuffer
	 *
	 * Copyright (c) 2012 Niklas von Hertzen
	 * Licensed under the MIT license.
	 */

	function createDbTable(t, dbInfo, callback, errorCallback) {
	    t.executeSql('CREATE TABLE IF NOT EXISTS ' + dbInfo.storeName + ' ' + '(id INTEGER PRIMARY KEY, key unique, value)', [], callback, errorCallback);
	}

	// Open the WebSQL database (automatically creates one if one didn't
	// previously exist), using any options set in the config.
	function _initStorage$1(options) {
	    var self = this;
	    var dbInfo = {
	        db: null
	    };

	    if (options) {
	        for (var i in options) {
	            dbInfo[i] = typeof options[i] !== 'string' ? options[i].toString() : options[i];
	        }
	    }

	    var dbInfoPromise = new Promise$1(function (resolve, reject) {
	        // Open the database; the openDatabase API will automatically
	        // create it for us if it doesn't exist.
	        try {
	            dbInfo.db = openDatabase(dbInfo.name, String(dbInfo.version), dbInfo.description, dbInfo.size);
	        } catch (e) {
	            return reject(e);
	        }

	        // Create our key/value table if it doesn't exist.
	        dbInfo.db.transaction(function (t) {
	            createDbTable(t, dbInfo, function () {
	                self._dbInfo = dbInfo;
	                resolve();
	            }, function (t, error) {
	                reject(error);
	            });
	        }, reject);
	    });

	    dbInfo.serializer = localforageSerializer;
	    return dbInfoPromise;
	}

	function tryExecuteSql(t, dbInfo, sqlStatement, args, callback, errorCallback) {
	    t.executeSql(sqlStatement, args, callback, function (t, error) {
	        if (error.code === error.SYNTAX_ERR) {
	            t.executeSql('SELECT name FROM sqlite_master ' + "WHERE type='table' AND name = ?", [dbInfo.storeName], function (t, results) {
	                if (!results.rows.length) {
	                    // if the table is missing (was deleted)
	                    // re-create it table and retry
	                    createDbTable(t, dbInfo, function () {
	                        t.executeSql(sqlStatement, args, callback, errorCallback);
	                    }, errorCallback);
	                } else {
	                    errorCallback(t, error);
	                }
	            }, errorCallback);
	        } else {
	            errorCallback(t, error);
	        }
	    }, errorCallback);
	}

	function getItem$1(key, callback) {
	    var self = this;

	    key = normalizeKey(key);

	    var promise = new Promise$1(function (resolve, reject) {
	        self.ready().then(function () {
	            var dbInfo = self._dbInfo;
	            dbInfo.db.transaction(function (t) {
	                tryExecuteSql(t, dbInfo, 'SELECT * FROM ' + dbInfo.storeName + ' WHERE key = ? LIMIT 1', [key], function (t, results) {
	                    var result = results.rows.length ? results.rows.item(0).value : null;

	                    // Check to see if this is serialized content we need to
	                    // unpack.
	                    if (result) {
	                        result = dbInfo.serializer.deserialize(result);
	                    }

	                    resolve(result);
	                }, function (t, error) {
	                    reject(error);
	                });
	            });
	        })["catch"](reject);
	    });

	    executeCallback(promise, callback);
	    return promise;
	}

	function iterate$1(iterator, callback) {
	    var self = this;

	    var promise = new Promise$1(function (resolve, reject) {
	        self.ready().then(function () {
	            var dbInfo = self._dbInfo;

	            dbInfo.db.transaction(function (t) {
	                tryExecuteSql(t, dbInfo, 'SELECT * FROM ' + dbInfo.storeName, [], function (t, results) {
	                    var rows = results.rows;
	                    var length = rows.length;

	                    for (var i = 0; i < length; i++) {
	                        var item = rows.item(i);
	                        var result = item.value;

	                        // Check to see if this is serialized content
	                        // we need to unpack.
	                        if (result) {
	                            result = dbInfo.serializer.deserialize(result);
	                        }

	                        result = iterator(result, item.key, i + 1);

	                        // void(0) prevents problems with redefinition
	                        // of `undefined`.
	                        if (result !== void 0) {
	                            resolve(result);
	                            return;
	                        }
	                    }

	                    resolve();
	                }, function (t, error) {
	                    reject(error);
	                });
	            });
	        })["catch"](reject);
	    });

	    executeCallback(promise, callback);
	    return promise;
	}

	function _setItem(key, value, callback, retriesLeft) {
	    var self = this;

	    key = normalizeKey(key);

	    var promise = new Promise$1(function (resolve, reject) {
	        self.ready().then(function () {
	            // The localStorage API doesn't return undefined values in an
	            // "expected" way, so undefined is always cast to null in all
	            // drivers. See: https://github.com/mozilla/localForage/pull/42
	            if (value === undefined) {
	                value = null;
	            }

	            // Save the original value to pass to the callback.
	            var originalValue = value;

	            var dbInfo = self._dbInfo;
	            dbInfo.serializer.serialize(value, function (value, error) {
	                if (error) {
	                    reject(error);
	                } else {
	                    dbInfo.db.transaction(function (t) {
	                        tryExecuteSql(t, dbInfo, 'INSERT OR REPLACE INTO ' + dbInfo.storeName + ' ' + '(key, value) VALUES (?, ?)', [key, value], function () {
	                            resolve(originalValue);
	                        }, function (t, error) {
	                            reject(error);
	                        });
	                    }, function (sqlError) {
	                        // The transaction failed; check
	                        // to see if it's a quota error.
	                        if (sqlError.code === sqlError.QUOTA_ERR) {
	                            // We reject the callback outright for now, but
	                            // it's worth trying to re-run the transaction.
	                            // Even if the user accepts the prompt to use
	                            // more storage on Safari, this error will
	                            // be called.
	                            //
	                            // Try to re-run the transaction.
	                            if (retriesLeft > 0) {
	                                resolve(_setItem.apply(self, [key, originalValue, callback, retriesLeft - 1]));
	                                return;
	                            }
	                            reject(sqlError);
	                        }
	                    });
	                }
	            });
	        })["catch"](reject);
	    });

	    executeCallback(promise, callback);
	    return promise;
	}

	function setItem$1(key, value, callback) {
	    return _setItem.apply(this, [key, value, callback, 1]);
	}

	function removeItem$1(key, callback) {
	    var self = this;

	    key = normalizeKey(key);

	    var promise = new Promise$1(function (resolve, reject) {
	        self.ready().then(function () {
	            var dbInfo = self._dbInfo;
	            dbInfo.db.transaction(function (t) {
	                tryExecuteSql(t, dbInfo, 'DELETE FROM ' + dbInfo.storeName + ' WHERE key = ?', [key], function () {
	                    resolve();
	                }, function (t, error) {
	                    reject(error);
	                });
	            });
	        })["catch"](reject);
	    });

	    executeCallback(promise, callback);
	    return promise;
	}

	// Deletes every item in the table.
	// TODO: Find out if this resets the AUTO_INCREMENT number.
	function clear$1(callback) {
	    var self = this;

	    var promise = new Promise$1(function (resolve, reject) {
	        self.ready().then(function () {
	            var dbInfo = self._dbInfo;
	            dbInfo.db.transaction(function (t) {
	                tryExecuteSql(t, dbInfo, 'DELETE FROM ' + dbInfo.storeName, [], function () {
	                    resolve();
	                }, function (t, error) {
	                    reject(error);
	                });
	            });
	        })["catch"](reject);
	    });

	    executeCallback(promise, callback);
	    return promise;
	}

	// Does a simple `COUNT(key)` to get the number of items stored in
	// localForage.
	function length$1(callback) {
	    var self = this;

	    var promise = new Promise$1(function (resolve, reject) {
	        self.ready().then(function () {
	            var dbInfo = self._dbInfo;
	            dbInfo.db.transaction(function (t) {
	                // Ahhh, SQL makes this one soooooo easy.
	                tryExecuteSql(t, dbInfo, 'SELECT COUNT(key) as c FROM ' + dbInfo.storeName, [], function (t, results) {
	                    var result = results.rows.item(0).c;
	                    resolve(result);
	                }, function (t, error) {
	                    reject(error);
	                });
	            });
	        })["catch"](reject);
	    });

	    executeCallback(promise, callback);
	    return promise;
	}

	// Return the key located at key index X; essentially gets the key from a
	// `WHERE id = ?`. This is the most efficient way I can think to implement
	// this rarely-used (in my experience) part of the API, but it can seem
	// inconsistent, because we do `INSERT OR REPLACE INTO` on `setItem()`, so
	// the ID of each key will change every time it's updated. Perhaps a stored
	// procedure for the `setItem()` SQL would solve this problem?
	// TODO: Don't change ID on `setItem()`.
	function key$1(n, callback) {
	    var self = this;

	    var promise = new Promise$1(function (resolve, reject) {
	        self.ready().then(function () {
	            var dbInfo = self._dbInfo;
	            dbInfo.db.transaction(function (t) {
	                tryExecuteSql(t, dbInfo, 'SELECT key FROM ' + dbInfo.storeName + ' WHERE id = ? LIMIT 1', [n + 1], function (t, results) {
	                    var result = results.rows.length ? results.rows.item(0).key : null;
	                    resolve(result);
	                }, function (t, error) {
	                    reject(error);
	                });
	            });
	        })["catch"](reject);
	    });

	    executeCallback(promise, callback);
	    return promise;
	}

	function keys$1(callback) {
	    var self = this;

	    var promise = new Promise$1(function (resolve, reject) {
	        self.ready().then(function () {
	            var dbInfo = self._dbInfo;
	            dbInfo.db.transaction(function (t) {
	                tryExecuteSql(t, dbInfo, 'SELECT key FROM ' + dbInfo.storeName, [], function (t, results) {
	                    var keys = [];

	                    for (var i = 0; i < results.rows.length; i++) {
	                        keys.push(results.rows.item(i).key);
	                    }

	                    resolve(keys);
	                }, function (t, error) {
	                    reject(error);
	                });
	            });
	        })["catch"](reject);
	    });

	    executeCallback(promise, callback);
	    return promise;
	}

	// https://www.w3.org/TR/webdatabase/#databases
	// > There is no way to enumerate or delete the databases available for an origin from this API.
	function getAllStoreNames(db) {
	    return new Promise$1(function (resolve, reject) {
	        db.transaction(function (t) {
	            t.executeSql('SELECT name FROM sqlite_master ' + "WHERE type='table' AND name <> '__WebKitDatabaseInfoTable__'", [], function (t, results) {
	                var storeNames = [];

	                for (var i = 0; i < results.rows.length; i++) {
	                    storeNames.push(results.rows.item(i).name);
	                }

	                resolve({
	                    db: db,
	                    storeNames: storeNames
	                });
	            }, function (t, error) {
	                reject(error);
	            });
	        }, function (sqlError) {
	            reject(sqlError);
	        });
	    });
	}

	function dropInstance$1(options, callback) {
	    callback = getCallback.apply(this, arguments);

	    var currentConfig = this.config();
	    options = typeof options !== 'function' && options || {};
	    if (!options.name) {
	        options.name = options.name || currentConfig.name;
	        options.storeName = options.storeName || currentConfig.storeName;
	    }

	    var self = this;
	    var promise;
	    if (!options.name) {
	        promise = Promise$1.reject('Invalid arguments');
	    } else {
	        promise = new Promise$1(function (resolve) {
	            var db;
	            if (options.name === currentConfig.name) {
	                // use the db reference of the current instance
	                db = self._dbInfo.db;
	            } else {
	                db = openDatabase(options.name, '', '', 0);
	            }

	            if (!options.storeName) {
	                // drop all database tables
	                resolve(getAllStoreNames(db));
	            } else {
	                resolve({
	                    db: db,
	                    storeNames: [options.storeName]
	                });
	            }
	        }).then(function (operationInfo) {
	            return new Promise$1(function (resolve, reject) {
	                operationInfo.db.transaction(function (t) {
	                    function dropTable(storeName) {
	                        return new Promise$1(function (resolve, reject) {
	                            t.executeSql('DROP TABLE IF EXISTS ' + storeName, [], function () {
	                                resolve();
	                            }, function (t, error) {
	                                reject(error);
	                            });
	                        });
	                    }

	                    var operations = [];
	                    for (var i = 0, len = operationInfo.storeNames.length; i < len; i++) {
	                        operations.push(dropTable(operationInfo.storeNames[i]));
	                    }

	                    Promise$1.all(operations).then(function () {
	                        resolve();
	                    })["catch"](function (e) {
	                        reject(e);
	                    });
	                }, function (sqlError) {
	                    reject(sqlError);
	                });
	            });
	        });
	    }

	    executeCallback(promise, callback);
	    return promise;
	}

	var webSQLStorage = {
	    _driver: 'webSQLStorage',
	    _initStorage: _initStorage$1,
	    _support: isWebSQLValid(),
	    iterate: iterate$1,
	    getItem: getItem$1,
	    setItem: setItem$1,
	    removeItem: removeItem$1,
	    clear: clear$1,
	    length: length$1,
	    key: key$1,
	    keys: keys$1,
	    dropInstance: dropInstance$1
	};

	function isLocalStorageValid() {
	    try {
	        return typeof localStorage !== 'undefined' && 'setItem' in localStorage &&
	        // in IE8 typeof localStorage.setItem === 'object'
	        !!localStorage.setItem;
	    } catch (e) {
	        return false;
	    }
	}

	function _getKeyPrefix(options, defaultConfig) {
	    var keyPrefix = options.name + '/';

	    if (options.storeName !== defaultConfig.storeName) {
	        keyPrefix += options.storeName + '/';
	    }
	    return keyPrefix;
	}

	// Check if localStorage throws when saving an item
	function checkIfLocalStorageThrows() {
	    var localStorageTestKey = '_localforage_support_test';

	    try {
	        localStorage.setItem(localStorageTestKey, true);
	        localStorage.removeItem(localStorageTestKey);

	        return false;
	    } catch (e) {
	        return true;
	    }
	}

	// Check if localStorage is usable and allows to save an item
	// This method checks if localStorage is usable in Safari Private Browsing
	// mode, or in any other case where the available quota for localStorage
	// is 0 and there wasn't any saved items yet.
	function _isLocalStorageUsable() {
	    return !checkIfLocalStorageThrows() || localStorage.length > 0;
	}

	// Config the localStorage backend, using options set in the config.
	function _initStorage$2(options) {
	    var self = this;
	    var dbInfo = {};
	    if (options) {
	        for (var i in options) {
	            dbInfo[i] = options[i];
	        }
	    }

	    dbInfo.keyPrefix = _getKeyPrefix(options, self._defaultConfig);

	    if (!_isLocalStorageUsable()) {
	        return Promise$1.reject();
	    }

	    self._dbInfo = dbInfo;
	    dbInfo.serializer = localforageSerializer;

	    return Promise$1.resolve();
	}

	// Remove all keys from the datastore, effectively destroying all data in
	// the app's key/value store!
	function clear$2(callback) {
	    var self = this;
	    var promise = self.ready().then(function () {
	        var keyPrefix = self._dbInfo.keyPrefix;

	        for (var i = localStorage.length - 1; i >= 0; i--) {
	            var key = localStorage.key(i);

	            if (key.indexOf(keyPrefix) === 0) {
	                localStorage.removeItem(key);
	            }
	        }
	    });

	    executeCallback(promise, callback);
	    return promise;
	}

	// Retrieve an item from the store. Unlike the original async_storage
	// library in Gaia, we don't modify return values at all. If a key's value
	// is `undefined`, we pass that value to the callback function.
	function getItem$2(key, callback) {
	    var self = this;

	    key = normalizeKey(key);

	    var promise = self.ready().then(function () {
	        var dbInfo = self._dbInfo;
	        var result = localStorage.getItem(dbInfo.keyPrefix + key);

	        // If a result was found, parse it from the serialized
	        // string into a JS object. If result isn't truthy, the key
	        // is likely undefined and we'll pass it straight to the
	        // callback.
	        if (result) {
	            result = dbInfo.serializer.deserialize(result);
	        }

	        return result;
	    });

	    executeCallback(promise, callback);
	    return promise;
	}

	// Iterate over all items in the store.
	function iterate$2(iterator, callback) {
	    var self = this;

	    var promise = self.ready().then(function () {
	        var dbInfo = self._dbInfo;
	        var keyPrefix = dbInfo.keyPrefix;
	        var keyPrefixLength = keyPrefix.length;
	        var length = localStorage.length;

	        // We use a dedicated iterator instead of the `i` variable below
	        // so other keys we fetch in localStorage aren't counted in
	        // the `iterationNumber` argument passed to the `iterate()`
	        // callback.
	        //
	        // See: github.com/mozilla/localForage/pull/435#discussion_r38061530
	        var iterationNumber = 1;

	        for (var i = 0; i < length; i++) {
	            var key = localStorage.key(i);
	            if (key.indexOf(keyPrefix) !== 0) {
	                continue;
	            }
	            var value = localStorage.getItem(key);

	            // If a result was found, parse it from the serialized
	            // string into a JS object. If result isn't truthy, the
	            // key is likely undefined and we'll pass it straight
	            // to the iterator.
	            if (value) {
	                value = dbInfo.serializer.deserialize(value);
	            }

	            value = iterator(value, key.substring(keyPrefixLength), iterationNumber++);

	            if (value !== void 0) {
	                return value;
	            }
	        }
	    });

	    executeCallback(promise, callback);
	    return promise;
	}

	// Same as localStorage's key() method, except takes a callback.
	function key$2(n, callback) {
	    var self = this;
	    var promise = self.ready().then(function () {
	        var dbInfo = self._dbInfo;
	        var result;
	        try {
	            result = localStorage.key(n);
	        } catch (error) {
	            result = null;
	        }

	        // Remove the prefix from the key, if a key is found.
	        if (result) {
	            result = result.substring(dbInfo.keyPrefix.length);
	        }

	        return result;
	    });

	    executeCallback(promise, callback);
	    return promise;
	}

	function keys$2(callback) {
	    var self = this;
	    var promise = self.ready().then(function () {
	        var dbInfo = self._dbInfo;
	        var length = localStorage.length;
	        var keys = [];

	        for (var i = 0; i < length; i++) {
	            var itemKey = localStorage.key(i);
	            if (itemKey.indexOf(dbInfo.keyPrefix) === 0) {
	                keys.push(itemKey.substring(dbInfo.keyPrefix.length));
	            }
	        }

	        return keys;
	    });

	    executeCallback(promise, callback);
	    return promise;
	}

	// Supply the number of keys in the datastore to the callback function.
	function length$2(callback) {
	    var self = this;
	    var promise = self.keys().then(function (keys) {
	        return keys.length;
	    });

	    executeCallback(promise, callback);
	    return promise;
	}

	// Remove an item from the store, nice and simple.
	function removeItem$2(key, callback) {
	    var self = this;

	    key = normalizeKey(key);

	    var promise = self.ready().then(function () {
	        var dbInfo = self._dbInfo;
	        localStorage.removeItem(dbInfo.keyPrefix + key);
	    });

	    executeCallback(promise, callback);
	    return promise;
	}

	// Set a key's value and run an optional callback once the value is set.
	// Unlike Gaia's implementation, the callback function is passed the value,
	// in case you want to operate on that value only after you're sure it
	// saved, or something like that.
	function setItem$2(key, value, callback) {
	    var self = this;

	    key = normalizeKey(key);

	    var promise = self.ready().then(function () {
	        // Convert undefined values to null.
	        // https://github.com/mozilla/localForage/pull/42
	        if (value === undefined) {
	            value = null;
	        }

	        // Save the original value to pass to the callback.
	        var originalValue = value;

	        return new Promise$1(function (resolve, reject) {
	            var dbInfo = self._dbInfo;
	            dbInfo.serializer.serialize(value, function (value, error) {
	                if (error) {
	                    reject(error);
	                } else {
	                    try {
	                        localStorage.setItem(dbInfo.keyPrefix + key, value);
	                        resolve(originalValue);
	                    } catch (e) {
	                        // localStorage capacity exceeded.
	                        // TODO: Make this a specific error/event.
	                        if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
	                            reject(e);
	                        }
	                        reject(e);
	                    }
	                }
	            });
	        });
	    });

	    executeCallback(promise, callback);
	    return promise;
	}

	function dropInstance$2(options, callback) {
	    callback = getCallback.apply(this, arguments);

	    options = typeof options !== 'function' && options || {};
	    if (!options.name) {
	        var currentConfig = this.config();
	        options.name = options.name || currentConfig.name;
	        options.storeName = options.storeName || currentConfig.storeName;
	    }

	    var self = this;
	    var promise;
	    if (!options.name) {
	        promise = Promise$1.reject('Invalid arguments');
	    } else {
	        promise = new Promise$1(function (resolve) {
	            if (!options.storeName) {
	                resolve(options.name + '/');
	            } else {
	                resolve(_getKeyPrefix(options, self._defaultConfig));
	            }
	        }).then(function (keyPrefix) {
	            for (var i = localStorage.length - 1; i >= 0; i--) {
	                var key = localStorage.key(i);

	                if (key.indexOf(keyPrefix) === 0) {
	                    localStorage.removeItem(key);
	                }
	            }
	        });
	    }

	    executeCallback(promise, callback);
	    return promise;
	}

	var localStorageWrapper = {
	    _driver: 'localStorageWrapper',
	    _initStorage: _initStorage$2,
	    _support: isLocalStorageValid(),
	    iterate: iterate$2,
	    getItem: getItem$2,
	    setItem: setItem$2,
	    removeItem: removeItem$2,
	    clear: clear$2,
	    length: length$2,
	    key: key$2,
	    keys: keys$2,
	    dropInstance: dropInstance$2
	};

	var sameValue = function sameValue(x, y) {
	    return x === y || typeof x === 'number' && typeof y === 'number' && isNaN(x) && isNaN(y);
	};

	var includes = function includes(array, searchElement) {
	    var len = array.length;
	    var i = 0;
	    while (i < len) {
	        if (sameValue(array[i], searchElement)) {
	            return true;
	        }
	        i++;
	    }

	    return false;
	};

	var isArray = Array.isArray || function (arg) {
	    return Object.prototype.toString.call(arg) === '[object Array]';
	};

	// Drivers are stored here when `defineDriver()` is called.
	// They are shared across all instances of localForage.
	var DefinedDrivers = {};

	var DriverSupport = {};

	var DefaultDrivers = {
	    INDEXEDDB: asyncStorage,
	    WEBSQL: webSQLStorage,
	    LOCALSTORAGE: localStorageWrapper
	};

	var DefaultDriverOrder = [DefaultDrivers.INDEXEDDB._driver, DefaultDrivers.WEBSQL._driver, DefaultDrivers.LOCALSTORAGE._driver];

	var OptionalDriverMethods = ['dropInstance'];

	var LibraryMethods = ['clear', 'getItem', 'iterate', 'key', 'keys', 'length', 'removeItem', 'setItem'].concat(OptionalDriverMethods);

	var DefaultConfig = {
	    description: '',
	    driver: DefaultDriverOrder.slice(),
	    name: 'localforage',
	    // Default DB size is _JUST UNDER_ 5MB, as it's the highest size
	    // we can use without a prompt.
	    size: 4980736,
	    storeName: 'keyvaluepairs',
	    version: 1.0
	};

	function callWhenReady(localForageInstance, libraryMethod) {
	    localForageInstance[libraryMethod] = function () {
	        var _args = arguments;
	        return localForageInstance.ready().then(function () {
	            return localForageInstance[libraryMethod].apply(localForageInstance, _args);
	        });
	    };
	}

	function extend() {
	    for (var i = 1; i < arguments.length; i++) {
	        var arg = arguments[i];

	        if (arg) {
	            for (var _key in arg) {
	                if (arg.hasOwnProperty(_key)) {
	                    if (isArray(arg[_key])) {
	                        arguments[0][_key] = arg[_key].slice();
	                    } else {
	                        arguments[0][_key] = arg[_key];
	                    }
	                }
	            }
	        }
	    }

	    return arguments[0];
	}

	var LocalForage = function () {
	    function LocalForage(options) {
	        _classCallCheck(this, LocalForage);

	        for (var driverTypeKey in DefaultDrivers) {
	            if (DefaultDrivers.hasOwnProperty(driverTypeKey)) {
	                var driver = DefaultDrivers[driverTypeKey];
	                var driverName = driver._driver;
	                this[driverTypeKey] = driverName;

	                if (!DefinedDrivers[driverName]) {
	                    // we don't need to wait for the promise,
	                    // since the default drivers can be defined
	                    // in a blocking manner
	                    this.defineDriver(driver);
	                }
	            }
	        }

	        this._defaultConfig = extend({}, DefaultConfig);
	        this._config = extend({}, this._defaultConfig, options);
	        this._driverSet = null;
	        this._initDriver = null;
	        this._ready = false;
	        this._dbInfo = null;

	        this._wrapLibraryMethodsWithReady();
	        this.setDriver(this._config.driver)["catch"](function () {});
	    }

	    // Set any config values for localForage; can be called anytime before
	    // the first API call (e.g. `getItem`, `setItem`).
	    // We loop through options so we don't overwrite existing config
	    // values.


	    LocalForage.prototype.config = function config(options) {
	        // If the options argument is an object, we use it to set values.
	        // Otherwise, we return either a specified config value or all
	        // config values.
	        if ((typeof options === 'undefined' ? 'undefined' : _typeof(options)) === 'object') {
	            // If localforage is ready and fully initialized, we can't set
	            // any new configuration values. Instead, we return an error.
	            if (this._ready) {
	                return new Error("Can't call config() after localforage " + 'has been used.');
	            }

	            for (var i in options) {
	                if (i === 'storeName') {
	                    options[i] = options[i].replace(/\W/g, '_');
	                }

	                if (i === 'version' && typeof options[i] !== 'number') {
	                    return new Error('Database version must be a number.');
	                }

	                this._config[i] = options[i];
	            }

	            // after all config options are set and
	            // the driver option is used, try setting it
	            if ('driver' in options && options.driver) {
	                return this.setDriver(this._config.driver);
	            }

	            return true;
	        } else if (typeof options === 'string') {
	            return this._config[options];
	        } else {
	            return this._config;
	        }
	    };

	    // Used to define a custom driver, shared across all instances of
	    // localForage.


	    LocalForage.prototype.defineDriver = function defineDriver(driverObject, callback, errorCallback) {
	        var promise = new Promise$1(function (resolve, reject) {
	            try {
	                var driverName = driverObject._driver;
	                var complianceError = new Error('Custom driver not compliant; see ' + 'https://mozilla.github.io/localForage/#definedriver');

	                // A driver name should be defined and not overlap with the
	                // library-defined, default drivers.
	                if (!driverObject._driver) {
	                    reject(complianceError);
	                    return;
	                }

	                var driverMethods = LibraryMethods.concat('_initStorage');
	                for (var i = 0, len = driverMethods.length; i < len; i++) {
	                    var driverMethodName = driverMethods[i];

	                    // when the property is there,
	                    // it should be a method even when optional
	                    var isRequired = !includes(OptionalDriverMethods, driverMethodName);
	                    if ((isRequired || driverObject[driverMethodName]) && typeof driverObject[driverMethodName] !== 'function') {
	                        reject(complianceError);
	                        return;
	                    }
	                }

	                var configureMissingMethods = function configureMissingMethods() {
	                    var methodNotImplementedFactory = function methodNotImplementedFactory(methodName) {
	                        return function () {
	                            var error = new Error('Method ' + methodName + ' is not implemented by the current driver');
	                            var promise = Promise$1.reject(error);
	                            executeCallback(promise, arguments[arguments.length - 1]);
	                            return promise;
	                        };
	                    };

	                    for (var _i = 0, _len = OptionalDriverMethods.length; _i < _len; _i++) {
	                        var optionalDriverMethod = OptionalDriverMethods[_i];
	                        if (!driverObject[optionalDriverMethod]) {
	                            driverObject[optionalDriverMethod] = methodNotImplementedFactory(optionalDriverMethod);
	                        }
	                    }
	                };

	                configureMissingMethods();

	                var setDriverSupport = function setDriverSupport(support) {
	                    if (DefinedDrivers[driverName]) {
	                        console.info('Redefining LocalForage driver: ' + driverName);
	                    }
	                    DefinedDrivers[driverName] = driverObject;
	                    DriverSupport[driverName] = support;
	                    // don't use a then, so that we can define
	                    // drivers that have simple _support methods
	                    // in a blocking manner
	                    resolve();
	                };

	                if ('_support' in driverObject) {
	                    if (driverObject._support && typeof driverObject._support === 'function') {
	                        driverObject._support().then(setDriverSupport, reject);
	                    } else {
	                        setDriverSupport(!!driverObject._support);
	                    }
	                } else {
	                    setDriverSupport(true);
	                }
	            } catch (e) {
	                reject(e);
	            }
	        });

	        executeTwoCallbacks(promise, callback, errorCallback);
	        return promise;
	    };

	    LocalForage.prototype.driver = function driver() {
	        return this._driver || null;
	    };

	    LocalForage.prototype.getDriver = function getDriver(driverName, callback, errorCallback) {
	        var getDriverPromise = DefinedDrivers[driverName] ? Promise$1.resolve(DefinedDrivers[driverName]) : Promise$1.reject(new Error('Driver not found.'));

	        executeTwoCallbacks(getDriverPromise, callback, errorCallback);
	        return getDriverPromise;
	    };

	    LocalForage.prototype.getSerializer = function getSerializer(callback) {
	        var serializerPromise = Promise$1.resolve(localforageSerializer);
	        executeTwoCallbacks(serializerPromise, callback);
	        return serializerPromise;
	    };

	    LocalForage.prototype.ready = function ready(callback) {
	        var self = this;

	        var promise = self._driverSet.then(function () {
	            if (self._ready === null) {
	                self._ready = self._initDriver();
	            }

	            return self._ready;
	        });

	        executeTwoCallbacks(promise, callback, callback);
	        return promise;
	    };

	    LocalForage.prototype.setDriver = function setDriver(drivers, callback, errorCallback) {
	        var self = this;

	        if (!isArray(drivers)) {
	            drivers = [drivers];
	        }

	        var supportedDrivers = this._getSupportedDrivers(drivers);

	        function setDriverToConfig() {
	            self._config.driver = self.driver();
	        }

	        function extendSelfWithDriver(driver) {
	            self._extend(driver);
	            setDriverToConfig();

	            self._ready = self._initStorage(self._config);
	            return self._ready;
	        }

	        function initDriver(supportedDrivers) {
	            return function () {
	                var currentDriverIndex = 0;

	                function driverPromiseLoop() {
	                    while (currentDriverIndex < supportedDrivers.length) {
	                        var driverName = supportedDrivers[currentDriverIndex];
	                        currentDriverIndex++;

	                        self._dbInfo = null;
	                        self._ready = null;

	                        return self.getDriver(driverName).then(extendSelfWithDriver)["catch"](driverPromiseLoop);
	                    }

	                    setDriverToConfig();
	                    var error = new Error('No available storage method found.');
	                    self._driverSet = Promise$1.reject(error);
	                    return self._driverSet;
	                }

	                return driverPromiseLoop();
	            };
	        }

	        // There might be a driver initialization in progress
	        // so wait for it to finish in order to avoid a possible
	        // race condition to set _dbInfo
	        var oldDriverSetDone = this._driverSet !== null ? this._driverSet["catch"](function () {
	            return Promise$1.resolve();
	        }) : Promise$1.resolve();

	        this._driverSet = oldDriverSetDone.then(function () {
	            var driverName = supportedDrivers[0];
	            self._dbInfo = null;
	            self._ready = null;

	            return self.getDriver(driverName).then(function (driver) {
	                self._driver = driver._driver;
	                setDriverToConfig();
	                self._wrapLibraryMethodsWithReady();
	                self._initDriver = initDriver(supportedDrivers);
	            });
	        })["catch"](function () {
	            setDriverToConfig();
	            var error = new Error('No available storage method found.');
	            self._driverSet = Promise$1.reject(error);
	            return self._driverSet;
	        });

	        executeTwoCallbacks(this._driverSet, callback, errorCallback);
	        return this._driverSet;
	    };

	    LocalForage.prototype.supports = function supports(driverName) {
	        return !!DriverSupport[driverName];
	    };

	    LocalForage.prototype._extend = function _extend(libraryMethodsAndProperties) {
	        extend(this, libraryMethodsAndProperties);
	    };

	    LocalForage.prototype._getSupportedDrivers = function _getSupportedDrivers(drivers) {
	        var supportedDrivers = [];
	        for (var i = 0, len = drivers.length; i < len; i++) {
	            var driverName = drivers[i];
	            if (this.supports(driverName)) {
	                supportedDrivers.push(driverName);
	            }
	        }
	        return supportedDrivers;
	    };

	    LocalForage.prototype._wrapLibraryMethodsWithReady = function _wrapLibraryMethodsWithReady() {
	        // Add a stub for each driver API method that delays the call to the
	        // corresponding driver method until localForage is ready. These stubs
	        // will be replaced by the driver methods as soon as the driver is
	        // loaded, so there is no performance impact.
	        for (var i = 0, len = LibraryMethods.length; i < len; i++) {
	            callWhenReady(this, LibraryMethods[i]);
	        }
	    };

	    LocalForage.prototype.createInstance = function createInstance(options) {
	        return new LocalForage(options);
	    };

	    return LocalForage;
	}();

	// The actual localForage object that we expose as a module or via a
	// global. It's extended by pulling in one of our other libraries.


	var localforage_js = new LocalForage();

	module.exports = localforage_js;

	},{"3":3}]},{},[4])(4)
	});
	});

	const problems = [
	    {
	        "question": {
	            "label": "风险可以从不同角度、根据不同的标准来进行分类。百年不遇的暴雨属于"
	        },
	        "answers": [
	            {
	                "label": "不可预测风险",
	                "isCorrect": true
	            },
	            {
	                "label": "可预测风险",
	                "isCorrect": false
	            },
	            {
	                "label": "已知风险",
	                "isCorrect": false
	            }
	        ]
	    },
	    {
	        "question": {
	            "label": "（）指的是从项目的优势、劣势、机会和威胁出发，对项目进行考察，从而更全面地考虑风险"
	        },
	        "answers": [
	            {
	                "label": "头脑风暴法",
	                "isCorrect": false
	            },
	            {
	                "label": "因果图",
	                "isCorrect": false
	            },
	            {
	                "label": "SWOT分析法",
	                "isCorrect": true
	            }
	        ]
	    },
	    {
	        "question": {
	            "label": "下面哪个不属于项目管理中的变量控制"
	        },
	        "answers": [
	            {
	                "label": "时间",
	                "isCorrect": false
	            },
	            {
	                "label": "质量",
	                "isCorrect": false
	            },
	            {
	                "label": "沟通",
	                "isCorrect": true
	            }
	        ]
	    },
	    {
	        "question": {
	            "label": "项目管理计划不包括"
	        },
	        "answers": [
	            {
	                "label": "绩效信息",
	                "isCorrect": true
	            },
	            {
	                "label": "项目目标",
	                "isCorrect": false
	            },
	            {
	                "label": "配置管理计划",
	                "isCorrect": false
	            }
	        ]
	    },
	    {
	        "question": {
	            "label": "商业智能系统应具有的主要功能不包括"
	        },
	        "answers": [
	            {
	                "label": "数据仓库",
	                "isCorrect": false
	            },
	            {
	                "label": "分析能力",
	                "isCorrect": false
	            },
	            {
	                "label": "联机实务处理OLTP",
	                "isCorrect": true
	            }
	        ]
	    },
	    {
	        "question": {
	            "label": "在组织级项目管理中，要求项目组合、项目集、项目三者都要与（）保持一致。"
	        },
	        "answers": [
	            {
	                "label": "组织管理",
	                "isCorrect": false
	            },
	            {
	                "label": "组织战略",
	                "isCorrect": true
	            },
	            {
	                "label": "组织文化",
	                "isCorrect": false
	            }
	        ]
	    },
	    {
	        "question": {
	            "label": "项目外包是承接项目可能采取的方式，但只有（）是允许的"
	        },
	        "answers": [
	            {
	                "label": "部分外包",
	                "isCorrect": true
	            },
	            {
	                "label": "整体外包",
	                "isCorrect": false
	            },
	            {
	                "label": "层层转包",
	                "isCorrect": false
	            }
	        ]
	    },
	    {
	        "question": {
	            "label": "战略管理包含3个层次，（）不属于战略管理的层次。"
	        },
	        "answers": [
	            {
	                "label": "目标层",
	                "isCorrect": false
	            },
	            {
	                "label": "规划层",
	                "isCorrect": true
	            },
	            {
	                "label": "方针层",
	                "isCorrect": false
	            }
	        ]
	    },
	    {
	        "question": {
	            "label": "项目组合的管理/协调对象是（）"
	        },
	        "answers": [
	            {
	                "label": "项目团队",
	                "isCorrect": false
	            },
	            {
	                "label": "项目经理",
	                "isCorrect": false
	            },
	            {
	                "label": "组合管理人员",
	                "isCorrect": true
	            }
	        ]
	    },
	    {
	        "question": {
	            "label": "一份项目进度网络图中的关键路径有（）"
	        },
	        "answers": [
	            {
	                "label": "只有1条",
	                "isCorrect": false
	            },
	            {
	                "label": "只有2条",
	                "isCorrect": false
	            },
	            {
	                "label": "1条或多条",
	                "isCorrect": true
	            }
	        ]
	    },
	    {
	        "question": {
	            "label": "智能制造是制造技术发展的必然趋势，从理论上来讲，（）是智能制造的核心"
	        },
	        "answers": [
	            {
	                "label": "制造机器人",
	                "isCorrect": false
	            },
	            {
	                "label": "信息物理系统",
	                "isCorrect": true
	            },
	            {
	                "label": "互联网",
	                "isCorrect": false
	            }
	        ]
	    },
	    {
	        "question": {
	            "label": "（）不是获取需求的方法"
	        },
	        "answers": [
	            {
	                "label": "问卷调查",
	                "isCorrect": false
	            },
	            {
	                "label": "会议讨论",
	                "isCorrect": false
	            },
	            {
	                "label": "决策分析",
	                "isCorrect": true
	            }
	        ]
	    },
	    {
	        "question": {
	            "label": "软件工程中，（）的目的是评价软件产品，以确定其对使用意图的适合性"
	        },
	        "answers": [
	            {
	                "label": "审计",
	                "isCorrect": false
	            },
	            {
	                "label": "技术评审",
	                "isCorrect": true
	            },
	            {
	                "label": "功能确认",
	                "isCorrect": false
	            }
	        ]
	    },
	    {
	        "question": {
	            "label": "软件测试是为评价和改进产品质量进行的活动？"
	        },
	        "answers": [
	            {
	                "label": "是",
	                "isCorrect": true
	            },
	            {
	                "label": "否",
	                "isCorrect": false
	            }
	        ]
	    },
	    {
	        "question": {
	            "label": "软件测试是必须在编码阶段完成后才开始的活动？"
	        },
	        "answers": [
	            {
	                "label": "是",
	                "isCorrect": false
	            },
	            {
	                "label": "否",
	                "isCorrect": true
	            }
	        ]
	    },
	    {
	        "question": {
	            "label": "软件测试一般分为单元测试、集成测试、系统测试等阶段"
	        },
	        "answers": [
	            {
	                "label": "是",
	                "isCorrect": true
	            },
	            {
	                "label": "否",
	                "isCorrect": false
	            }
	        ]
	    },
	    {
	        "question": {
	            "label": "在软件工程项目中，评估和改进一个过程是提高（）的一种手段"
	        },
	        "answers": [
	            {
	                "label": "产品质量",
	                "isCorrect": true
	            },
	            {
	                "label": "使用质量",
	                "isCorrect": false
	            },
	            {
	                "label": "外部质量",
	                "isCorrect": false
	            }
	        ]
	    },
	    {
	        "question": {
	            "label": "信息系统的安全威胁分成七类，其中不包括（）"
	        },
	        "answers": [
	            {
	                "label": "人为事件风险",
	                "isCorrect": false
	            },
	            {
	                "label": "项目管理风险",
	                "isCorrect": false
	            },
	            {
	                "label": "功能风险",
	                "isCorrect": true
	            }
	        ]
	    },
	    {
	        "question": {
	            "label": "局域网中，常采用广播消息的方法来获取访问目标IP地址对应的MAC地址，实现此功能的协议为（）"
	        },
	        "answers": [
	            {
	                "label": "RARP协议",
	                "isCorrect": false
	            },
	            {
	                "label": "SMTP协议",
	                "isCorrect": false
	            },
	            {
	                "label": "ARP协议",
	                "isCorrect": true
	            }
	        ]
	    },
	    {
	        "question": {
	            "label": "“采用先进成熟的技术和设备，满足当前业务需求，兼顾未来的业务需求”体现了“（）”"
	        },
	        "answers": [
	            {
	                "label": "实用性和先进性",
	                "isCorrect": true
	            },
	            {
	                "label": "灵活性和可扩展性",
	                "isCorrect": false
	            },
	            {
	                "label": "可管理性",
	                "isCorrect": false
	            }
	        ]
	    },
	    {
	        "question": {
	            "label": "在无线通信领域，现在主流应用的是第四代（4G）通信技术，其理论下载速率可达到（）Mbps"
	        },
	        "answers": [
	            {
	                "label": "4",
	                "isCorrect": false
	            },
	            {
	                "label": "20",
	                "isCorrect": false
	            },
	            {
	                "label": "100",
	                "isCorrect": true
	            }
	        ]
	    },
	    {
	        "question": {
	            "label": "根据《中华人民共和国政府采购法》，（）应作为政府采购的主要方式"
	        },
	        "answers": [
	            {
	                "label": "公开招标",
	                "isCorrect": true
	            },
	            {
	                "label": "竞争性谈判",
	                "isCorrect": false
	            },
	            {
	                "label": "询价",
	                "isCorrect": false
	            }
	        ]
	    },
	    {
	        "question": {
	            "label": "将项目的进度、成本、质量和范围作为项目管理的目标，这体现了项目管理的（）特点"
	        },
	        "answers": [
	            {
	                "label": "多目标性",
	                "isCorrect": true
	            },
	            {
	                "label": "层次性",
	                "isCorrect": false
	            },
	            {
	                "label": "系统性",
	                "isCorrect": false
	            }
	        ]
	    },
	    {
	        "question": {
	            "label": "成本预算的输入不包括"
	        },
	        "answers": [
	            {
	                "label": "成本基准",
	                "isCorrect": true
	            },
	            {
	                "label": "资源日历",
	                "isCorrect": false
	            },
	            {
	                "label": "风险登记册",
	                "isCorrect": false
	            }
	        ]
	    },
	    {
	        "question": {
	            "label": "在沟通管理中，一般（）是最有效的沟通并解决干系人之间问题的方法。"
	        },
	        "answers": [
	            {
	                "label": "面对面会议",
	                "isCorrect": true
	            },
	            {
	                "label": "问题日志",
	                "isCorrect": false
	            },
	            {
	                "label": "问题清单",
	                "isCorrect": false
	            }
	        ]
	    },
	    {
	        "question": {
	            "label": "（）不属于风险管理计划编制的成果"
	        },
	        "answers": [
	            {
	                "label": "风险类别",
	                "isCorrect": false
	            },
	            {
	                "label": "风险概率",
	                "isCorrect": false
	            },
	            {
	                "label": "风险记录",
	                "isCorrect": true
	            }
	        ]
	    },
	    {
	        "question": {
	            "label": "（）不属于项目团队建设的工具和技巧"
	        },
	        "answers": [
	            {
	                "label": "事先分派",
	                "isCorrect": true
	            },
	            {
	                "label": "培训",
	                "isCorrect": false
	            },
	            {
	                "label": "集中办公",
	                "isCorrect": false
	            }
	        ]
	    },
	    {
	        "question": {
	            "label": "一般，项目计划主要关注项目的（）"
	        },
	        "answers": [
	            {
	                "label": "活动计划",
	                "isCorrect": true
	            },
	            {
	                "label": "过程计划",
	                "isCorrect": false
	            },
	            {
	                "label": "组织计划",
	                "isCorrect": false
	            }
	        ]
	    },
	    {
	        "question": {
	            "label": "对大型复杂项目来说，必须优先考虑制定项目的（）。"
	        },
	        "answers": [
	            {
	                "label": "活动计划",
	                "isCorrect": false
	            },
	            {
	                "label": "过程计划",
	                "isCorrect": true
	            },
	            {
	                "label": "资源计划",
	                "isCorrect": false
	            }
	        ]
	    },
	    {
	        "question": {
	            "label": "（）是控制范围常用的工具和技术"
	        },
	        "answers": [
	            {
	                "label": "产品分析",
	                "isCorrect": false
	            },
	            {
	                "label": "偏差分析",
	                "isCorrect": false
	            },
	            {
	                "label": "标杆对照",
	                "isCorrect": true
	            }
	        ]
	    },
	    {
	        "question": {
	            "label": "项目经理对项目负责，其正式权利由（）获得。"
	        },
	        "answers": [
	            {
	                "label": "项目工作说明书",
	                "isCorrect": false
	            },
	            {
	                "label": "成本管理计划",
	                "isCorrect": false
	            },
	            {
	                "label": "项目章程",
	                "isCorrect": true
	            }
	        ]
	    },
	    {
	        "question": {
	            "label": "质量管理工具（）常用于找出导致项目问题产生的潜在原因"
	        },
	        "answers": [
	            {
	                "label": "控制图",
	                "isCorrect": false
	            },
	            {
	                "label": "鱼骨图",
	                "isCorrect": true
	            },
	            {
	                "label": "散点图",
	                "isCorrect": false
	            }
	        ]
	    },
	    {
	        "question": {
	            "label": "（）不属于项目人力资源管理的范畴"
	        },
	        "answers": [
	            {
	                "label": "人员获取",
	                "isCorrect": false
	            },
	            {
	                "label": "入职培训",
	                "isCorrect": false
	            },
	            {
	                "label": "建立项目组织计划",
	                "isCorrect": true
	            }
	        ]
	    },
	    {
	        "question": {
	            "label": "下列（）不是传统项目生命周期的阶段。"
	        },
	        "answers": [
	            {
	                "label": "开发阶段",
	                "isCorrect": false
	            },
	            {
	                "label": "概念阶段",
	                "isCorrect": true
	            },
	            {
	                "label": "系统分析",
	                "isCorrect": false
	            }
	        ]
	    },
	    {
	        "question": {
	            "label": "项目是实现组织（）的手段"
	        },
	        "answers": [
	            {
	                "label": "文化",
	                "isCorrect": false
	            },
	            {
	                "label": "战略",
	                "isCorrect": true
	            },
	            {
	                "label": "架构",
	                "isCorrect": false
	            }
	        ]
	    },
	    {
	        "question": {
	            "label": "RFID射频技术多应用与物联网的（）"
	        },
	        "answers": [
	            {
	                "label": "网络层",
	                "isCorrect": false
	            },
	            {
	                "label": "感知层",
	                "isCorrect": true
	            },
	            {
	                "label": "应用层",
	                "isCorrect": false
	            }
	        ]
	    },
	    {
	        "question": {
	            "label": "在信息系统的生命周期中、开发阶段不包括（）"
	        },
	        "answers": [
	            {
	                "label": "系统规划",
	                "isCorrect": true
	            },
	            {
	                "label": "系统设计",
	                "isCorrect": false
	            },
	            {
	                "label": "系统分析",
	                "isCorrect": false
	            }
	        ]
	    },
	    {
	        "question": {
	            "label": "区块链的特征不包括（）"
	        },
	        "answers": [
	            {
	                "label": "中心化",
	                "isCorrect": true
	            },
	            {
	                "label": "开发性",
	                "isCorrect": false
	            },
	            {
	                "label": "匿名性",
	                "isCorrect": false
	            }
	        ]
	    },
	    {
	        "question": {
	            "label": "（）不属于“互联网+”的应用"
	        },
	        "answers": [
	            {
	                "label": "滴滴打车",
	                "isCorrect": false
	            },
	            {
	                "label": "AlhaGo",
	                "isCorrect": true
	            },
	            {
	                "label": "共享单车",
	                "isCorrect": false
	            }
	        ]
	    },
	    {
	        "question": {
	            "label": "质量保证成本属于质量成本中（）成本"
	        },
	        "answers": [
	            {
	                "label": "一致性",
	                "isCorrect": true
	            },
	            {
	                "label": "非一致性",
	                "isCorrect": false
	            },
	            {
	                "label": "外部失败",
	                "isCorrect": false
	            }
	        ]
	    },
	    {
	        "question": {
	            "label": "PMGO看板页面能否按优先级分泳道"
	        },
	        "answers": [
	            {
	                "label": "能",
	                "isCorrect": true
	            },
	            {
	                "label": "不能",
	                "isCorrect": false
	            }
	        ]
	    },
	    {
	        "question": {
	            "label": "PMGO任务单能否导出至excel"
	        },
	        "answers": [
	            {
	                "label": "能",
	                "isCorrect": true
	            },
	            {
	                "label": "不能",
	                "isCorrect": false
	            }
	        ]
	    },
	    {
	        "question": {
	            "label": "PMGO能否按任务描述搜索任务单"
	        },
	        "answers": [
	            {
	                "label": "能",
	                "isCorrect": true
	            },
	            {
	                "label": "不能",
	                "isCorrect": false
	            }
	        ]
	    },
	    {
	        "question": {
	            "label": "PMGO看板页面能否按项目成员分泳道"
	        },
	        "answers": [
	            {
	                "label": "能",
	                "isCorrect": false
	            },
	            {
	                "label": "不能",
	                "isCorrect": true
	            }
	        ]
	    },
	    {
	        "question": {
	            "label": "PMGO项目访客可查看的任务单范围"
	        },
	        "answers": [
	            {
	                "label": "全部任务单",
	                "isCorrect": false
	            },
	            {
	                "label": "仅参与的任务单",
	                "isCorrect": true
	            }
	        ]
	    },
	    {
	        "question": {
	            "label": "PMGO只读成员可查看的任务单范围"
	        },
	        "answers": [
	            {
	                "label": "全部任务单",
	                "isCorrect": true
	            },
	            {
	                "label": "仅参与的任务单",
	                "isCorrect": false
	            }
	        ]
	    },
	    {
	        "question": {
	            "label": "PMGO任务单的字段\"截止时间\"能否设置为必填"
	        },
	        "answers": [
	            {
	                "label": "能",
	                "isCorrect": true
	            },
	            {
	                "label": "不能",
	                "isCorrect": false
	            }
	        ]
	    },
	    {
	        "question": {
	            "label": "PMGO能否批量修改任务单的迭代"
	        },
	        "answers": [
	            {
	                "label": "能",
	                "isCorrect": true
	            },
	            {
	                "label": "不能",
	                "isCorrect": false
	            }
	        ]
	    },
	    {
	        "question": {
	            "label": "PMGO能否给任务单加标签"
	        },
	        "answers": [
	            {
	                "label": "能",
	                "isCorrect": true
	            },
	            {
	                "label": "不能",
	                "isCorrect": false
	            }
	        ]
	    },
	    {
	        "question": {
	            "label": "PMGO任务单能否加密"
	        },
	        "answers": [
	            {
	                "label": "能",
	                "isCorrect": true
	            },
	            {
	                "label": "不能",
	                "isCorrect": false
	            }
	        ]
	    },
	    {
	        "question": {
	            "label": "PMGO任务单能否分别给各个职能打SP"
	        },
	        "answers": [
	            {
	                "label": "能",
	                "isCorrect": true
	            },
	            {
	                "label": "不能",
	                "isCorrect": false
	            }
	        ]
	    },
	    {
	        "question": {
	            "label": "PMGO中待规划的任务单能否直接拖至已完成"
	        },
	        "answers": [
	            {
	                "label": "能",
	                "isCorrect": true
	            },
	            {
	                "label": "不能",
	                "isCorrect": false
	            }
	        ]
	    },
	    {
	        "question": {
	            "label": "PMGO可以在中网访问么？"
	        },
	        "answers": [
	            {
	                "label": "能",
	                "isCorrect": true
	            },
	            {
	                "label": "不能",
	                "isCorrect": false
	            }
	        ]
	    },
	    {
	        "question": {
	            "label": "PMGO报告标题能否修改"
	        },
	        "answers": [
	            {
	                "label": "能",
	                "isCorrect": true
	            },
	            {
	                "label": "不能",
	                "isCorrect": false
	            }
	        ]
	    },
	    {
	        "question": {
	            "label": "PMGO中关闭了的迭代是否能重启"
	        },
	        "answers": [
	            {
	                "label": "能",
	                "isCorrect": true
	            },
	            {
	                "label": "不能",
	                "isCorrect": false
	            }
	        ]
	    },
	    {
	        "question": {
	            "label": "创建任务单时，填写了内容但未保存，如何找回填写内容"
	        },
	        "answers": [
	            {
	                "label": "下次创建任务单时加载草稿",
	                "isCorrect": true
	            },
	            {
	                "label": "找不回来了",
	                "isCorrect": false
	            }
	        ]
	    },
	    {
	        "question": {
	            "label": "如何快速查看与自己相关的任务单"
	        },
	        "answers": [
	            {
	                "label": "看板中筛选“与我相关”",
	                "isCorrect": true
	            },
	            {
	                "label": "导出任务单查看",
	                "isCorrect": false
	            }
	        ]
	    },
	    {
	        "question": {
	            "label": "PMGO如何开启“测试用例”模块"
	        },
	        "answers": [
	            {
	                "label": "在设置页面自行开启",
	                "isCorrect": true
	            },
	            {
	                "label": "联系PMGO系统策划人员",
	                "isCorrect": false
	            }
	        ]
	    },
	    {
	        "question": {
	            "label": "PMGO在哪里创建工单会话"
	        },
	        "answers": [
	            {
	                "label": "任务详情中",
	                "isCorrect": true
	            },
	            {
	                "label": "设置页面中",
	                "isCorrect": false
	            }
	        ]
	    },
	    {
	        "question": {
	            "label": "火星聊天窗口中如何快创建PMGO任务单"
	        },
	        "answers": [
	            {
	                "label": "选中文字，点击鼠标右键选中“添加到PMGO”",
	                "isCorrect": true
	            },
	            {
	                "label": "复制文字去PMGO系统中创建",
	                "isCorrect": false
	            }
	        ]
	    },
	    {
	        "question": {
	            "label": "PMGO任务单的参与人只允许一个人"
	        },
	        "answers": [
	            {
	                "label": "对",
	                "isCorrect": false
	            },
	            {
	                "label": "错",
	                "isCorrect": true
	            }
	        ]
	    },
	    {
	        "question": {
	            "label": "PMGO任务单的备注不能添加GIF图"
	        },
	        "answers": [
	            {
	                "label": "对",
	                "isCorrect": false
	            },
	            {
	                "label": "错",
	                "isCorrect": true
	            }
	        ]
	    },
	    {
	        "question": {
	            "label": "PMGO任务单不能添加附件"
	        },
	        "answers": [
	            {
	                "label": "对",
	                "isCorrect": false
	            },
	            {
	                "label": "错",
	                "isCorrect": true
	            }
	        ]
	    },
	    {
	        "question": {
	            "label": "PMGO任务单能设置开始时间和截止时间"
	        },
	        "answers": [
	            {
	                "label": "对",
	                "isCorrect": false
	            },
	            {
	                "label": "错",
	                "isCorrect": true
	            }
	        ]
	    },
	    {
	        "question": {
	            "label": "PMGO任务单导出时如何设置导出内容"
	        },
	        "answers": [
	            {
	                "label": "需求页面中设置显示字段",
	                "isCorrect": true
	            },
	            {
	                "label": "设置页面中设置",
	                "isCorrect": false
	            }
	        ]
	    },
	    {
	        "question": {
	            "label": "PMGO报告标题能否修改"
	        },
	        "answers": [
	            {
	                "label": "能",
	                "isCorrect": true
	            },
	            {
	                "label": "不能",
	                "isCorrect": false
	            }
	        ]
	    },
	    {
	        "question": {
	            "label": "PMGO看板中的任务卡片大小有几种规格"
	        },
	        "answers": [
	            {
	                "label": "一种",
	                "isCorrect": false
	            },
	            {
	                "label": "两种",
	                "isCorrect": false
	            },
	            {
	                "label": "三种",
	                "isCorrect": true
	            }
	        ]
	    },
	    {
	        "question": {
	            "label": "PMGO中的任务单可以设置完成度么？"
	        },
	        "answers": [
	            {
	                "label": "能",
	                "isCorrect": true
	            },
	            {
	                "label": "不能",
	                "isCorrect": false
	            }
	        ]
	    },
	    {
	        "question": {
	            "label": "PMGO中的任务单优先级可以自定义么？"
	        },
	        "answers": [
	            {
	                "label": "能",
	                "isCorrect": true
	            },
	            {
	                "label": "不能",
	                "isCorrect": false
	            }
	        ]
	    },
	    {
	        "question": {
	            "label": "PMGO中的测试用例可以进行复制么？"
	        },
	        "answers": [
	            {
	                "label": "能",
	                "isCorrect": false
	            },
	            {
	                "label": "不能",
	                "isCorrect": true
	            }
	        ]
	    },
	    {
	        "question": {
	            "label": "PMGO中的消息推送可以按个人喜好进行设置么？"
	        },
	        "answers": [
	            {
	                "label": "能",
	                "isCorrect": true
	            },
	            {
	                "label": "不能",
	                "isCorrect": false
	            }
	        ]
	    },
	    {
	        "question": {
	            "label": "PMGO中卡片左侧的色条表示的是什么？"
	        },
	        "answers": [
	            {
	                "label": "优先级",
	                "isCorrect": false
	            },
	            {
	                "label": "模块",
	                "isCorrect": true
	            },
	            {
	                "label": "版本",
	                "isCorrect": false
	            }
	        ]
	    },
	    {
	        "question": {
	            "label": "PMGO中卡片右上角的蓝色三角形表示的是什么？"
	        },
	        "answers": [
	            {
	                "label": "与我相关",
	                "isCorrect": true
	            },
	            {
	                "label": "重点关注",
	                "isCorrect": false
	            },
	            {
	                "label": "加密任务",
	                "isCorrect": false
	            }
	        ]
	    },
	    {
	        "question": {
	            "label": "PMGO中一个测试用例可以关联几个任务单？"
	        },
	        "answers": [
	            {
	                "label": "一个",
	                "isCorrect": false
	            },
	            {
	                "label": "两个",
	                "isCorrect": false
	            },
	            {
	                "label": "多个",
	                "isCorrect": true
	            }
	        ]
	    },
	    {
	        "question": {
	            "label": "PMGO中的测试用例可以有多少人验收？"
	        },
	        "answers": [
	            {
	                "label": "一个",
	                "isCorrect": false
	            },
	            {
	                "label": "两个",
	                "isCorrect": false
	            },
	            {
	                "label": "多个",
	                "isCorrect": true
	            }
	        ]
	    },
	    {
	        "question": {
	            "label": "PMGO中是否支持任务单在各节点中的停留时长的统计"
	        },
	        "answers": [
	            {
	                "label": "是",
	                "isCorrect": true
	            },
	            {
	                "label": "否",
	                "isCorrect": false
	            }
	        ]
	    }
	];

	const HEIGHT = 896 || document.documentElement.clientHeight;
	let scorePoint = 0;
	const problemProint = 15;
	let timedEvent;
	let timedAlive;
	let stopTimer;
	let makeProblemTimer;
	let firstAlivePipe = null;
	var Status;
	(function (Status) {
	    Status[Status["ready"] = 0] = "ready";
	    Status[Status["playing"] = 1] = "playing";
	    Status[Status["end"] = 2] = "end";
	})(Status || (Status = {}));
	class Bird extends Phaser.Scene {
	    constructor() {
	        super('Bird');
	        this.status = Status.ready;
	        this.score = 0;
	    }
	    preload() {
	        this.load.image('ground', 'assets/ground.png');
	        this.load.image('background', 'assets/background.png');
	        this.load.image('pipe', 'assets/pipe.png');
	        this.load.spritesheet('bird', 'assets/bird.png', {
	            frameWidth: 92,
	            frameHeight: 64,
	            startFrame: 0,
	            endFrame: 2
	        });
	    }
	    create() {
	        // 初始化数据
	        this.openStartPanel();
	        this.pipes = this.physics.add.group();
	        this.size = this.scale.baseSize;
	        scorePoint = this.size.width / 3;
	        for (let i = 0; i < Math.ceil(this.size.width / 768); i++) {
	            this.add.image(i * 768 + 384 - i, 320, 'background'); // 图片拼接会有间隙
	        }
	        let platforms = this.physics.add.staticGroup();
	        for (let i = 0; i < Math.ceil(this.size.width / 36); i++) {
	            platforms.create(16 + 36 * i, 832, 'ground');
	        }
	        platforms.setDepth(10);
	        this.scoreText = this.add.text(this.size.width / 2, 100, '0', {
	            fontSize: '70px',
	            fontFamily: 'fb',
	            align: 'center'
	        });
	        this.scoreText.setDepth(9);
	        this.scoreText.setOrigin(.5, .5);
	        this.bird = this.physics.add.sprite(0, 0, 'bird');
	        this.bird.setDepth(2);
	        this.bird.setCollideWorldBounds(true);
	        this.birdCollider = this.physics.add.collider(this.bird, platforms, () => {
	            if (this.status === Status.end)
	                return;
	            this.die();
	        });
	        this.anims.create({
	            key: 'birdfly',
	            frames: this.anims.generateFrameNumbers('bird', { start: 0, end: 2 }),
	            frameRate: 10,
	            repeat: -1
	        });
	        this.birdTween = this.tweens.add({
	            targets: this.bird,
	            delay: 300,
	            duration: 500,
	            ease: 'easeOut',
	            paused: true,
	            props: {
	                'angle': {
	                    value: {
	                        getStart() {
	                            return -25;
	                        },
	                        getEnd() {
	                            return 90;
	                        }
	                    }
	                }
	            }
	        });
	        this.birdFloat = this.tweens.add({
	            targets: this.bird,
	            delay: 0,
	            duration: 800,
	            ease: 'ease',
	            y: {
	                value: '-=100'
	            },
	            yoyo: true,
	            repeat: -1
	        });
	        this.initEvent();
	        this.ready();
	    }
	    initEvent() {
	        this.input.on('pointerdown', function () {
	            switch (this.status) {
	                case Status.ready: {
	                    return this.start();
	                }
	                case Status.playing: {
	                    return this.fly();
	                }
	            }
	        }, this);
	    }
	    update() {
	    }
	    ready() {
	        this.bird.body.setAllowGravity(false);
	        this.bird.setAngle(0);
	        this.birdFloat.restart();
	        this.pipes.clear(true, true); // 重新初始化水管
	        firstAlivePipe = null;
	        this.setScore(0);
	        this.bird.play('birdfly');
	        this.bird.setPosition(this.size.width / 3, 300);
	        this.initProblems(); // 重新初始化题目
	        this.destroyProblem();
	        this.status = Status.ready;
	    }
	    start() {
	        this.status = Status.playing;
	        this.bird.body.setAllowGravity();
	        this.birdFloat.stop();
	        this.bird.play('birdfly');
	        this.bird.setAngle(-25);
	        this.birdTween.play();
	        this.bird.setVelocityY(-700);
	        this.makePipes();
	        // 使用定时器来计算小鸟是否通过水管，update过于频繁
	        timedEvent = this.time.addEvent({
	            delay: 200,
	            callback: this.checkPass,
	            loop: true,
	            callbackScope: this
	        });
	        // 计时存活
	        timedAlive = this.time.addEvent({
	            delay: 1000,
	            callback: this.aliveScore,
	            loop: true,
	            callbackScope: this
	        });
	    }
	    fly() {
	        this.birdTween.restart();
	        this.bird.setVelocityY(-700);
	    }
	    die() {
	        this.status = Status.end;
	        this.birdTween.stop(1);
	        this.bird.setAngle(90);
	        this.bird.anims.stop();
	        // 停止所有水管移动
	        this.pipes.setVelocityX(0);
	        this.stopPipes();
	        clearTimeout(stopTimer);
	        clearTimeout(makeProblemTimer);
	        this.stopProblem();
	        timedEvent.destroy();
	        timedAlive.destroy();
	        // 死亡时候先设置分数，再打开排行榜
	        this.setGrade(this.score).then(() => this.openEndPanel());
	    }
	    makePipes() {
	        this.makePipe();
	        this.timer = setInterval(this.makePipe.bind(this), 2000);
	        stopTimer = setTimeout(() => {
	            this.stopPipes();
	            makeProblemTimer = setTimeout(() => {
	                this.makeProblem();
	            }, 3000);
	        }, 10000);
	    }
	    makePipe(gap = 500) {
	        let up = this.physics.add.image(this.size.width + 100, 0, 'pipe');
	        up.setName('up');
	        up.setFlipY(true);
	        let height = up.height;
	        let randomHeight = Math.ceil(Math.random() * (this.size.height - 300 - gap)) - 700 + height / 2;
	        up.y = randomHeight;
	        let down = this.physics.add.image(this.size.width + 100, 0, 'pipe');
	        down.name = 'down';
	        down.y = up.y + gap + height;
	        this.pipes.addMultiple([up, down]);
	        up.body.setAllowGravity(false);
	        down.body.setAllowGravity(false);
	        up.setImmovable();
	        down.setImmovable();
	        down.setVelocityX(-200);
	        up.setVelocityX(-200);
	        let timer = setTimeout(() => {
	            if (up.x < -100) {
	                this.pipes.remove(up, true, true);
	                this.pipes.remove(down, true, true);
	            }
	        }, 10000);
	        this.physics.add.collider(this.bird, [down, up], () => {
	            if (this.status === Status.end)
	                return;
	            clearTimeout(timer);
	            this.die();
	        });
	    }
	    stopPipes() {
	        clearInterval(this.timer);
	    }
	    // about problems START
	    initProblems() {
	        this.problems = problems.slice();
	    }
	    makeProblem() {
	        this.problem = this.chooseProblem();
	        this.makeQuestion();
	        this.makeAnswer();
	    }
	    chooseProblem() {
	        const index = Math.floor(Math.random() * this.problems.length);
	        return this.problems.splice(index, 1)[0];
	    }
	    makeQuestion() {
	        this.problem.question.instance = this.add.text(this.size.width, HEIGHT / 2 - 60, this.problem.question.label, {
	            fontSize: '40px',
	            color: '#000'
	        });
	        let body = this.makeArcadeInstance(this.problem.question.instance);
	        body.setImmovable();
	        this.physics.add.collider(this.bird, this.problem.question.instance, () => {
	            this.fly();
	        });
	    }
	    makeAnswer() {
	        this.problem.answers.forEach((item, index) => {
	            item.instance = this.add.text(this.size.width + this.problem.question.instance.width + 500, HEIGHT / (this.problem.answers.length + 1) * (index + 1) - 100, item.label, {
	                fontSize: '28px',
	                color: '#000'
	            });
	            let body = this.makeArcadeInstance(item.instance);
	            // 开启答案与左墙壁的碰撞检测，用于未作答情况
	            body.setCollideWorldBounds(true);
	            body.onWorldBounds = true;
	            body.world.setBoundsCollision(true, false, true, true);
	            body.world.on("worldbounds", body => {
	                if (index === 0) {
	                    this.refreshProblem(body);
	                }
	            }, item.instance);
	            // 开启答案与小鸟的碰撞检测，用于作答情况
	            this.physics.add.collider(this.bird, item.instance, () => {
	                if (item.isCorrect) {
	                    this.addScore(problemProint);
	                }
	                else {
	                    this.addScore(-problemProint);
	                }
	                this.bird.setVelocityX(0); // 防止小鸟被反作用力反弹
	                this.refreshProblem(body);
	            });
	        });
	    }
	    makeArcadeInstance(instance) {
	        this.physics.world.enable(instance);
	        let body = instance.body;
	        body.setAllowGravity(false);
	        body.setVelocityX(-200);
	        return body;
	    }
	    refreshProblem(body) {
	        body.world.removeListener('worldbounds');
	        this.destroyProblem();
	        if (this.status === Status.end)
	            return;
	        this.makePipes();
	        timedEvent.paused = false;
	    }
	    stopProblem() {
	        if (!this.problem)
	            return;
	        let questionInstance = this.problem.question.instance;
	        if (questionInstance) {
	            let questionBody = questionInstance.body;
	            questionBody && questionBody.setVelocityX(0);
	        }
	        this.problem.answers.forEach(item => {
	            let answerInstance = item.instance;
	            if (answerInstance) {
	                let answerBody = answerInstance.body;
	                answerBody && answerBody.setVelocityX(0);
	            }
	        });
	    }
	    destroyProblem() {
	        if (!this.problem)
	            return;
	        let questionInstance = this.problem.question.instance;
	        questionInstance && this.problem.question.instance.destroy();
	        this.problem.answers.forEach(item => {
	            let answerInstance = item.instance;
	            answerInstance && answerInstance.destroy();
	        });
	    }
	    // about problems END
	    // 打开游戏开始面板
	    openStartPanel() {
	        if (!this.startLayer) {
	            this.startLayer = this.add.dom(0, 0, '#start');
	            this.startLayer.addListener('click');
	            this.startLayer.on('click', ({ target }) => {
	                if (!target.classList.contains('start-button'))
	                    return;
	                const userName = document.querySelector('.name-input').value.trim();
	                if (!userName)
	                    return alert('姓名不能为空');
	                localforage.getItem(userName).then((data) => {
	                    // 新建用户数据
	                    data === null && localforage.setItem(userName, 0);
	                    this.currentUser = userName;
	                    this.startLayer.setVisible(false);
	                });
	            });
	        }
	        this.startLayer.setVisible(true);
	    }
	    // 游戏结束面板
	    openEndPanel() {
	        if (!this.endLayer) {
	            this.endLayer = this.add.dom(0, 0, '#end');
	            document.querySelector('.replay-button').addEventListener('click', () => {
	                this.endLayer.setVisible(false);
	                this.openStartPanel();
	                this.ready();
	            });
	        }
	        const gradeList = [];
	        localforage.iterate((grade, user) => {
	            gradeList.push({ user, grade });
	        }).then(() => {
	            gradeList.sort((a, b) => b.grade - a.grade);
	            let html = '';
	            gradeList.slice(0, 20).forEach(item => html += `<div><span>${item.user}</span><span>${item.grade}</span></div>`);
	            document.querySelector('.grade-list').innerHTML = html;
	        });
	        this.endLayer.setVisible(true);
	    }
	    // 设置分数
	    setGrade(grade) {
	        return localforage.getItem(this.currentUser).then(data => {
	            // 取最高分存入
	            if (grade > data) {
	                return localforage.setItem(this.currentUser, grade);
	            }
	            return Promise.resolve(0);
	        });
	    }
	    setScore(score) {
	        this.score = score;
	        this.scoreText.setText(this.score + '');
	    }
	    addScore(score) {
	        this.score += score;
	        this.scoreText.setText(this.score + '');
	    }
	    aliveScore() {
	        this.addScore(1);
	    }
	    checkPass() {
	        if (this.pipes.getLength() <= 0)
	            return;
	        // 穿过最后一组水管进入答题
	        if (this.pipes.getChildren().length > 2 && !this.pipes.getChildren().filter(children => children.active).length) {
	            timedEvent.paused = true;
	            return;
	        }
	        if (!firstAlivePipe) {
	            firstAlivePipe = this.pipes.getFirstAlive();
	            // 垂直方向上只判断一根水管
	            if (firstAlivePipe.name == 'down') {
	                firstAlivePipe.setActive(false);
	                firstAlivePipe = null;
	                return;
	            }
	        }
	        let x = firstAlivePipe.x;
	        if (x > this.size.width / 3)
	            return;
	        // 小鸟已过水管中间
	        this.addScore(10);
	        firstAlivePipe.setActive(false);
	        firstAlivePipe = null;
	    }
	}
	const config = {
	    type: Phaser.AUTO,
	    backgroundColor: '#ded895',
	    scene: Bird,
	    scale: {
	        width: '100%',
	        height: HEIGHT,
	        mode: Phaser.Scale.ScaleModes.HEIGHT_CONTROLS_WIDTH,
	        autoCenter: Phaser.Scale.CENTER_HORIZONTALLY
	    },
	    physics: {
	        default: 'arcade',
	        arcade: {
	            gravity: { y: 2700 },
	            debug: true
	        }
	    },
	    parent: 'body',
	    dom: {
	        createContainer: true
	    }
	};
	const game = new Phaser.Game(config);

	return Bird;

}());
//# sourceMappingURL=game.js.map

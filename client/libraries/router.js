import R from 'ramda';
import Immutable from 'immutable';
import {win} from '../globals';
import {memoizeShallow} from '../utils';
import {fromCamelCase} from '../utils/toCamelCase';
import {_hashEventStreamDiff} from '../streams/hashEventStreamDiff';

const HASH = "#";
const PARAM_SPLIT_ON = "&";
const VALUE_SPLIT_ON = "=";


/**
 * Use memoize to cache the immutable for optimising calls to the function
 * @param {String} pagePath - page path
 * @param {Immutable.List} routes - the application routes configuration
 * @return {Immutable.Map} page properties
 */
export let getPage = memoizeShallow(function getPage(pagePath, routes) {
  var routesJS = routes.toJS();
  var rootFind = R.find(R.propEq('camelCaseName', pagePath), routesJS);
  //Check the root of the routes collection first (match the 401, 404 and default pages)
  if (pagePath !== "" && rootFind) {
    return Immutable.fromJS(rootFind);
  }
  //Use reduce on camelCaseName property to allow defaulting to lowest point in route tree
  // should there be an error in the pagePath
  return Immutable.fromJS(
    R.reduce((routeItem, pathPartial) => {
      if (routeItem.hasOwnProperty('routes')) {
        return R.defaultTo(
          routeItem,
          R.find(R.propEq('camelCaseName', pathPartial), routeItem.routes)
        );
      }
      return routeItem;
    }, {"routes": routesJS}, getPagePathArray(pagePath))
  );
}, 100);

/**
 * @param {String} pagePath - page path
 * @return {Array} page path array containing [""] if home page
 */
export function getPagePathArray(pagePath) {
  var _pagePath = R.defaultTo("", pagePath);
  switch (_pagePath) {
    case "":
      return [""];
    default:
      return ("/" + _pagePath).split("/");
  }
}

/**
 * Get the route config from a route path
 * @param {Array} routePath - the route path
 * @param {Array} remainingRoutes - the remaining routes
 * @param {Int} depth - the current depth (must be less than or equal to length of routePath)
 * @returns {*} the route at provided path
 */
export function getRouteFromPath(routePath, remainingRoutes, depth) {
  var nextRemainingRoutes, nextPath;
  var _depth = depth || 0;
  _depth = _depth + 1;
  if (_depth > routePath.length) {
    return remainingRoutes;
  }
  nextPath = R.slice(0, _depth, routePath);
  nextRemainingRoutes = R.find((route) => (R.equals(getPagePathArray(route.path), nextPath)), remainingRoutes);
  if (R.isNil(nextRemainingRoutes) || !nextRemainingRoutes.hasOwnProperty("routes")) {
    return remainingRoutes;
  }
  return getRouteFromPath(routePath, nextRemainingRoutes.routes, _depth);
}

/**
 * @param {String} pagePath - page path
 * @param {Immutable.List} routes - the application routes configuration
 * @return {Array} breadcrumb
 */
export let getBreadcrumb = memoizeShallow(function getBreadcrumb(pagePath, routes) {
  return R.mapAccum((prevAccumPagePath, pagePathPartial) => {
    var nextAccumPagePath = prevAccumPagePath + (prevAccumPagePath.length > 0 ? "/" : "") + pagePathPartial;
    return [
      nextAccumPagePath,
      getPage(nextAccumPagePath, routes)
    ];
  }, "", getPagePathArray(pagePath))[1];
}, 100);

/**
 * @param {Immutable} pageRouteConfig - page route config
 * @return {Array} labels
 */
export let getPageLabels = memoizeShallow(function getPageLabels(pageRouteConfig) {
  if (R.isNil(pageRouteConfig)) {
    return [];
  }
  const pagePath = pageRouteConfig.get('path');
  if (R.isNil(pagePath) || pagePath === '') {
    return Immutable.fromJS([]);
  }
  const pagePathArr = pagePath.split("/");
  const pageLabelsJS = R.map(
    (page) => (fromCamelCase(page).replace(/\s/g, "_").toLowerCase()),
    pagePathArr
  );
  return Immutable.fromJS(pageLabelsJS);
}, 100);

/**
 * @param {String} href - href
 * @return {String} hash or #
 */
export function getHash(href) {
  var hrefArr = href.split(HASH);
  return hrefArr.length > 1 ? HASH + hrefArr[1] : HASH;
}

/**
 * @param {String} href - href
 * @param {String} newHashStr - hash
 * @return {String} updated href
 */
export function updateHrefHash(href, newHashStr) {
  return newHashStr.split(HASH).length > 1 ? href.split(HASH)[0] + newHashStr : href;
}

/**
 * @param {String} hash - hash string
 * @return {Object} hash object
 */
export function hashToObject(hash) {
  var hashArr = hash ? hash.split(HASH) : [];
  var hashStr = hashArr.length > 1 ? hashArr[1] : "";
  //process hash from array and convert array pairs to object key-value pairs
  return R.pipe(
    R.split(PARAM_SPLIT_ON),
    R.map(function paramToArray(item) {
      var arrParams = item.split(VALUE_SPLIT_ON);
      return arrParams.length > 1 ? arrParams : null;
    }),
    R.filter(item => (item !== null)),
    R.fromPairs()
  )(hashStr);
}

export function getPreviousPathFromHash(hash) {
  const currentPagePath = R.isNil(hash.page) ? [""] : hash.page.split("/");
  const currentPagePathLength = currentPagePath.length;
  if (currentPagePathLength > 0) {
    return hashToObject("#page=" + R.take(currentPagePathLength - 1, currentPagePath).join("/"));
  }
  return hashToObject("#");
}

/**
 * @param {Object} obj - hash object
 * @param {Boolean} [prefixHash=true] - prefix return string with #
 * @return {String} hash string
 */
export function objectToHash(obj, prefixHash) {
  var _hash = R.defaultTo(true, prefixHash) ? HASH : "";
  var arrArrParams = R.toPairs(obj);
  var paramToString = param => (param instanceof Array ? param.join(VALUE_SPLIT_ON) : "");
  return _hash + R.addIndex(R.reduce)(function arrayToParam(hashStr, param, idx) {
      var paramStr = paramToString(param);
      //skip empty parameter strings and the first iteration where memo is already set
      return paramStr.length > 0 && idx > 0 ? hashStr + PARAM_SPLIT_ON + paramStr : hashStr;
    }, paramToString(arrArrParams[0]), arrArrParams);
}

/**
 * @param {string} url - URL of page to open
 * @param {string} target - target attribute of the new window
 * @return {String} window.location.href
 */
export function openWindow(url, target) {
  return win.open(url, target);
}


/**
 * @return {String} window.location.href
 */
export function getWindowLocationHref() {
  return win.location.href;
}

/**
 * @param {String} href - href
 * @return {String} href
 */
export function setWindowLocationHref(href) {
  win.location.href = href;
  return href;
}

/**
 * @return {String} hash
 */
export function getWindowLocationHashStr() {
  return getHash(getWindowLocationHref());
}

/**
 * @param {Object} defaults - default values to apply to returned hash object
 * @return {Object} hash
 */
export function getWindowLocationHash(defaults) {
  return R.merge(R.defaultTo({}, defaults), hashToObject(getWindowLocationHashStr()));
}

/**
 * @param {Object} defaults - default values to apply to returned hash object
 * @return {Array} hash string split by '/'
 */
export function getWindowLocationHashPageArray(defaults) {
  const hash = getWindowLocationHash(defaults);
  if (R.isNil(hash.page) || hash.page.length === 0) {
    return [""];
  }
  return R.split("/", hash.page);
}

/**
 * @param {String} appendPagePartialStr - page partial to append to page
 * @return {String} page
 */
export function appendToWindowLocationHashPageStr(appendPagePartialStr) {
  const hash = getWindowLocationHash();
  return R.defaultTo("", hash.page) + "/" + appendPagePartialStr
}

/**
 * @param {Object} defaults - default values to apply to returned hash object
 * @return {String} first part of hash string split by '/'
 */
export function getWindowLocationHashPageInitialRoute(defaults) {
  return getWindowLocationHashPageArray(defaults)[0];
}

/**
 * @param {Object} defaults - default values to apply to returned hash object
 * @return {Object} hash
 */
export function debugEnabled() {
  return win.DEBUG === true;
}

/**
 * @param {String} newHashStr - hash
 * @return {String} updated window.location.href
 */
export function setWindowLocationHashStr(newHashStr) {
  return setWindowLocationHref(updateHrefHash(getWindowLocationHref(), newHashStr));
}

/**
 * @param {Object} newHash - hash object
 * @return {String} updated window.location.href
 */
export function setWindowLocationHash(newHash) {
  return setWindowLocationHashStr(objectToHash(extendWindowLocationHash(newHash)));
}

/**
 * @param {Object} newHash - hash object
 * @return {Object} extend hash object with window.location.href if newHash.page === windowLocationHash.page
 */
export function extendWindowLocationHash(newHash) {
  var windowLocationHash = getWindowLocationHash();
  //only extend if the newHash does not contain a new page
  if (!newHash.hasOwnProperty("page") || windowLocationHash.page === newHash.page) {
    return R.merge(windowLocationHash, newHash);
  }
  return newHash;
}

/**
 * @param {String} newHashStr - hash
 * @param {Object} options - map of options
 * @param {Object} options.cache - add a cache property to the A link
 * @return {String} window.location.href hash extended with newHashStr
 */
export function createALink(newHashStr, options) {
  if (options && options.cache) {
    newHashStr = newHashStr + "&cache=" + (Math.random() * 100000).toFixed(0);
  }
  return objectToHash(extendWindowLocationHash(hashToObject("#" + newHashStr)));
}

/**
 * @param {String} eventKey - menu item event key
 * @param {String} href - href of selected menu item
 */
export function linkSelect(eventKey, href) {
  setWindowLocationHashStr(href);
}

/**
 * @param {object} storeMap - map containing non-initialised store and initialisation data and functions
 * @return {Bacon.EventStream} current state and previous state of the url hash {hash, prevHash}.
 * Hash events filtered by pageFilter.
 */
export function getFilteredHashEventStream(storeMap) {
  var page = R.ifElse(R.is(Array), R.head, R.identity)(storeMap.uiStoreJSON.route.page);
  return _hashEventStreamDiff
    .map((hashDiff) => {
      if (hashDiff.prevHash && hashDiff.hash
        && hashDiff.prevHash.page && hashDiff.hash.page
        && hashDiff.prevHash.page.indexOf(page) === 0
        && hashDiff.hash.page.indexOf(page) === 0) {
        return hashDiff.hash;
      }
      return null;
    })
    .filter(hash => (hash !== null))
    .changes();
}

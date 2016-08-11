/* global window */
"use strict";
import browserDetect from "bowser";
import R from 'ramda';

let _browserPass;

function getJQuery() {
  return window.$;
}

if ((browserDetect.msie && browserDetect.version >= 11)
  || (browserDetect.chrome && browserDetect.version >= 49)
  || (browserDetect.firefox && browserDetect.version >= 45)
  || (browserDetect.safari && browserDetect.version >= 8)) {
  _browserPass = true;
} else if (!browserDetect.msie && !browserDetect.chrome && !browserDetect.msie && !browserDetect.chrome) {
  _browserPass = null;
} else {
  _browserPass = false;
}


export let appInsights = {
  trackPageView: function trackPageView(name, url, measurements, duration) {
    window.appInsights.trackPageView(name, url, window.globalEnvVariables.defaultProperties, measurements, duration);
    window.ga('set', 'page', "/" + url);
    window.ga('set', 'title', name);
    window.ga('send', 'pageview');
  },
  trackException: function trackException(exception, handledAt, measurements) {
    window.appInsights.trackException(
      JSON.stringify(R.defaultTo({}, exception)),
      handledAt,
      window.globalEnvVariables.defaultProperties,
      measurements
    );
    window.ga('send', 'exception', {
      "exDescription": R.defaultTo("", handledAt) + " " + JSON.stringify(R.defaultTo({}, exception)),
      "exFatal": true
    });
  },
  trackEvent: function trackEvent(eventCategory, eventAction, eventLabel, eventValue) {
    window.appInsights.trackEvent(
      eventCategory + '-' + eventAction + '-' + eventLabel,
      window.globalEnvVariables.defaultProperties,
      eventValue
    );
    window.ga('send', {
      "hitType": 'event',
      "eventCategory": eventCategory,
      "eventAction": eventAction,
      "eventLabel": eventLabel,
      "eventValue": eventValue
    });
  },
  trackMetric: function trackMetric(name, average, sampleCount, min, max) {
    window.appInsights.trackMetric(name, average, sampleCount, min, max, window.globalEnvVariables.defaultProperties);
    window.ga('send', {
      "hitType": "timing",
      "timingCategory": "Metrics",
      "timingVar": name,
      "timingValue": average,
      "timingLabel": "index"
    });
  },
  trackTransaction: function trackTransaction(transactionId, service, productName, productId, category, price) {
    window.appInsights.trackEvent(
      transactionId  + '-' + service  + '-' + productName  + '-' + productId  + '-' + category + '-' + price,
      window.globalEnvVariables.defaultProperties
    );
    window.ga('send', {
      "hitType": 'event',
      "eventCategory": 'Transaction-' + service,
      "eventAction": category,
      "eventLabel": productName,
      "eventValue": price
    });
    window.ga('require', 'ecommerce');
    window.ga('ecommerce:addTransaction', {
      'id': transactionId,                     // Transaction ID. Required.
      'affiliation': service,   // Affiliation or store name.
      'revenue': price,               // Grand Total.
      'shipping': '0',                  // Shipping.
      'tax': '0'                     // Tax.
    });
    window.ga('ecommerce:addItem', {
      'id': transactionId,                     // Transaction ID. Required.
      'name': productName,    // Product name. Required.
      'sku': productId,                 // SKU/code.
      'category': category,         // Category or variation.
      'price': price,                 // Unit price.
      'quantity': '1'                   // Quantity.
    });
    window.ga('ecommerce:send');
  },
  setAuthenticatedUserContext: function setAuthenticatedUserContext(authenticatedUserId, accountId) {
    window.appInsights.setAuthenticatedUserContext(authenticatedUserId, accountId);
    window.ga('set', 'userId', authenticatedUserId);
    window.ga('send', {
      "hitType": 'event',
      "eventCategory": 'AuthenticatedUserContext',
      "eventAction": 'User',
      "eventLabel": authenticatedUserId
    });
    window.ga('send', {
      "hitType": 'event',
      "eventCategory": 'AuthenticatedUserContext',
      "eventAction": 'Account',
      "eventLabel": accountId
    });
  },
  clearAuthenticatedUserContext: function clearAuthenticatedUserContext(){
    window.appInsights.clearAuthenticatedUserContext();
  }
};

export let performance = window.performance;
export let connectors = window.globalEnvVariables.connectors;
export let databaseVersion = window.globalEnvVariables.databaseVersion;
export let production = window.globalEnvVariables.remoteENV === "staging" ||
  window.globalEnvVariables.remoteENV === "production";
export let devOrTestMode = process.env.NODE_ENV !== "production" || process.env.TEST_MODE;
export let testMode = !R.isNil(process.env.TEST_MODE) && process.env.TEST_MODE === "true";
export let win = window;
export let goog = window.google;
export let doc = document;
export let $ = getJQuery();
export let browser = browserDetect;
export let nhvrLogoUrl = connectors.remoteStorage.server + "/policies/nhvrLogo.png";
export let loginLogoUrl = connectors.remoteStorage.server + "/policies/portalLogin.png";
export let browserDetection = browserDetect.name + " " + browserDetect.version;
export let browserPass = _browserPass;
export let browserSupportsModals = browserDetect.name !== "iPad";
export let logger = {
  "info": function info(a, b) {
    if (process.env.NODE_ENV !== "production" || process.env.TEST_MODE) {
      console.info(a, b || null);
      if (browserDetect.msie && browserDetect.version <= 9) {
        console.trace();
      }
    }
  },
  "log": function log(a, b) {
    if (process.env.NODE_ENV !== "production" || process.env.TEST_MODE) {
      console.log(a, b || null);
      if (browserDetect.msie && browserDetect.version <= 9) {
        console.trace();
      }
    }
  },
  "warn": function warn(a, b) {
    if (process.env.NODE_ENV !== "production" || process.env.TEST_MODE) {
      console.warn(a, b || null);
      if (browserDetect.msie && browserDetect.version <= 9) {
        console.trace();
      }
    }
  },
  "error": function error(a) {
    appInsights.trackException(a, "error");
  }
};

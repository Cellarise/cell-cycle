// Modified from Route Planner to support modules

var L = require("leaflet");

var GoogleTileLayer = L.GridLayer.extend({
  pollInterval: 100, // milliseconds
  timeoutInterval: 10000, // milliseconds
  options: {
    noWrap: false
  },
  initialize: function(googleLayer, options) {
    L.setOptions(this, options);
    this.googleLayer = googleLayer;
    this.on("load", this._addAttribution);
    this._tileCache = {};
  },
  onAdd: function(map) {
    this.map = map;
    L.GridLayer.prototype.onAdd.call(this, map);
    map.addLayer(this.googleLayer);
    $(this.googleLayer._container).css("visibility", "hidden"); // Hide the Google Maps layer
  },
  onRemove: function(map) {
    L.GridLayer.prototype.onRemove.call(this, map);
    map.removeLayer(this.googleLayer);
    $(map._container).find("#" + this.googleLayer._container.id).remove();
  },
  createTile: function(coords, done) {
    switch (this.googleLayer._type) {
      case "ROADMAP":
        var img = L.DomUtil.create("img", "");
        this._findImg("ROADMAP", coords, img, done);
        return img;
      case "SATELLITE":
        var img = L.DomUtil.create("img", "");
        this._findImg("SATELLITE", coords, img, done);
        return img;
      case "HYBRID":
        var div = L.DomUtil.create("div", "");
        var imgSatellite = L.DomUtil.create("img", "");
        var imgRoadmap = L.DomUtil.create("img", "");
        imgSatellite.style.cssText = "position: absolute; left: 0px; top: 0px; width: 256px; height: 256px; -webkit-user-select: none; border: 0px; padding: 0px; margin: 0px; max-width: none; z-index: 0;";
        imgRoadmap.style.cssText = imgSatellite.style.cssText;
        div.appendChild(imgSatellite);
        div.appendChild(imgRoadmap);
        this._findImg("SATELLITE", coords, imgSatellite, done);
        this._findImg("ROADMAP", coords, imgRoadmap, done);
        return div;
      case "TERRAIN":
        var img = L.DomUtil.create("img", "");
        this._findImg("ROADMAP", coords, img, done);
        return img;
    }
  },
  _addAttribution: function() {
    var $map = $(this.map._container);
    if ($map.find(".gm-attribution#" + this.googleLayer._container.id).length === 0) {
      var $attribution = $("<div/>", {
        id: this.googleLayer._container.id,
        class: "gm-attribution",
        css: {
          "position": "relative"
        }

      });
      $map.append($attribution);
      // Reparent all divs except the first (first is the map)
      $(this.googleLayer._container)
        .find(".gm-style")
        .children()
        .each(function(index, el) {
          if (index === 0) {
            return true;
          }
          $attribution.append(el);
        });
    }
  },
  _findImg: function(googleMapType, coords, img, done) {
    var start = new Date();

    img.src = this._getTileCache(googleMapType, coords.z, coords.x, coords.y) || "";

    var _this = this;
    var googleLayer = this.googleLayer;
    var timeoutInterval = this.timeoutInterval;

    // Poll DOM until Google tile image is found
    var interval = setInterval(function() {
      if (!googleLayer._container) {
        return;
      }

      // There are some non-visible createTile requests that we stop
      if (new Date().getTime() - start.getTime() > timeoutInterval) {
        clearInterval(interval);
      }

      var src = _this._getTileCache(googleMapType, coords.z, coords.x, coords.y);
      if (!src) {
        var id = "#" + googleLayer._container.id;
        var googleImg = $(id + " .gm-style img").filter(function(i, el) {
          var src = $(el).attr("src");
          switch (googleMapType) {
            case "ROADMAP":
              return src.indexOf("!1i" + coords.z + "!") > 0
                && src.indexOf("!2i" + coords.x + "!") > 0
                && src.indexOf("!3i" + coords.y + "!") > 0;
            case "SATELLITE":
              return src.indexOf("z=" + coords.z) > 0
                && src.indexOf("x=" + coords.x + "&") > 0
                && src.indexOf("y=" + coords.y + "&") > 0;
          }
        });
        if (googleImg.length) {
          googleImg = googleImg.first();
          src = googleImg.attr("src");
        }
      }

      if (src) {
        clearInterval(interval);
        img.src = src;
        _this._setTileCache(googleMapType, coords.z, coords.x, coords.y, img.src);
        done(null, img);
      }
    }, this.pollInterval);
  },
  _setTileCache: function(t, z, x, y, src) {
    if (!this._tileCache[t]) {
      this._tileCache[t] = {};
    }
    if (!this._tileCache[t][z]) {
      this._tileCache[t][z] = {};
    }
    if (!this._tileCache[t][z][x]) {
      this._tileCache[t][z][x] = {};
    }
    this._tileCache[t][z][x][y] = src;
  },
  _getTileCache: function(t, z, x, y) {
    return this._tileCache[t] && this._tileCache[t][z] && this._tileCache[t][z][x] && this._tileCache[t][z][x][y];
  }
});
module.exports = GoogleTileLayer;

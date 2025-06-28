(function(global) {
  // Minimal Leaflet stub - offline placeholder.
  const L = {};

  L.map = function(id) {
    return {
      _id: id,
      _center: [0, 0],
      _zoom: 0,
      setView(center, zoom) {
        this._center = center;
        this._zoom = zoom;
        return this;
      },
      fitBounds(bounds) {
        this._bounds = bounds;
        return this;
      },
      addLayer(layer) {
        if (layer && typeof layer.addTo === 'function') {
          layer.addTo(this);
        }
        return this;
      }
    };
  };

  L.tileLayer = function(urlTemplate, options) {
    return {
      addTo(map) {
        console.log('Stub tileLayer added to map', map);
        return this;
      }
    };
  };

  L.circleMarker = function(latlng, options) {
    return {
      addTo(map) {
        console.log('Stub circleMarker added to map', map);
        return this;
      }
    };
  };

  L.latLngBounds = function(coords) {
    return {
      _coords: coords,
      pad() { return this; }
    };
  };

  global.L = L;
})(this);

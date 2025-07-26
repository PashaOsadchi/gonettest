(function(global) {
  if (!global.L) { global.L = {}; }
  const L = global.L;
  function MarkerClusterGroup(options) {
    this.options = options || {};
  }
  MarkerClusterGroup.prototype = {
    addLayer: function() { return this; },
    addLayers: function() { return this; },
    addTo: function() { return this; },
    clearLayers: function() { return this; }
  };
  L.MarkerClusterGroup = MarkerClusterGroup;
  L.markerClusterGroup = function(options) { return new MarkerClusterGroup(options); };
})(this);

// Cloned from: https://gist.github.com/lahabana/5a07d36ad366b63e6469

/**
 * One full hyperlapse part
 */
var HyperlapseJob = function(data) {
  this.data = data;
};
 
HyperlapseJob.prototype.directions_service = new google.maps.DirectionsService();
/**
 * Load the route from google maps
 */
HyperlapseJob.prototype.loadRoute = function(cb) {
  var route = {
    request: {
      travelMode: google.maps.DirectionsTravelMode.DRIVING
    }
  };
  var type = ['origin', 'destination'];
  for (var i = 0; i < type.length; i++) {
    if (typeof(this.data[type[i]]) === "object") {
      route.request[type[i]] = this.data[type[i]];
    } else {
      var str = this.data[type[i]].split(',');
      route.request[type[i]] = new google.maps.LatLng(str[0], str[1]);
    }
  }
  console.log(route.request);
  this.directions_service.route(route.request, function(response, status) {
    if (status == google.maps.DirectionsStatus.OK) {
      cb({route:response});
    } else {
      console.log(status);
    }
  });
};
 
/**
 * Create the parameters to be given to Hyperlapse
 */
HyperlapseJob.prototype._getHyperlapseParams = function() {
  var res = this.data;
  if (this.data.lookat) {
    if (typeof(this.data.lookat) === "string") {
      var str = this.data.lookat.split(',');
      route.request[type[i]] = new google.maps.LatLng(str[0], str[1]);
    }
  }
  res.use_lookat = !!(this.data.lookat);
  res.use_elevation = (this.data.elevation > 0);
  return res;
};
 
HyperlapseJob.prototype.serialize = function() {
  var res = {
    origin: this.data.origin.toUrlValue(),
    destination: this.data.destination.toUrlValue(),
    
    elevation: this.hyperlapse.elevation_offset,
    fov : this.hyperlapse.fov()
  };
  if (this.lookat) {
    res.lookat = this.data.lookat.toUrlValue();
  }
  res.distance_between_points = this.data.distance_between_points;
  res.max_points = this.data.max_points;
  return res;
};
 
/**
 * Start an Hyperlapse by loading the route and then launching the video
 * in the dom element elt. Fires the callback cb of type (err, action)
 * where action can be "loaded", "finished" or "frame"
 */
HyperlapseJob.prototype.start = function(elt, cb) {
  var that = this;
  that.loadRoute(function(route) {
    var params = that._getHyperlapseParams();
    console.log(params);
    that.hyperlapse = new Hyperlapse(elt, params);
    if (typeof(cb) === "function") {
      that.hyperlapse.onError = function(e) {
        cb(e);
      };
 
      that.hyperlapse.onRouteComplete = function(e) {
        cb(null, "loaded");
        that.hyperlapse.load();
      };
 
      var hyperlapseNext = function() {
        if (!that.hyperlapse.next()) {
          cb(null, "finished");
        }
      };
 
      that.hyperlapse.onFrame = function() {
        cb(null, "frame");
        setTimeout(hyperlapseNext, 50);
      };
 
      that.hyperlapse.onLoadComplete = function(e) {
        hyperlapseNext();
      };
    } else {
      that.hyperlapse.onError = cb.onError || that.hyperlapse.onError;
      that.hyperlapse.onRouteComplete = cb.onRouteComplete || that.hyperlapse.onRouteComplete;
      that.hyperlapse.onLoadComplete = cb.onLoadComplete || that.hyperlapse.onLoadComplete;
      that.hyperlapse.onFrame = cb.onFrame || that.hyperlapse.onFrame;
    }
    that.hyperlapse.generate(route);
  });
};
 
 
var parseData = function(data) {
  var params = ['max_points', 'distance_between_points', 'zoom', 'elevation', 'look_at'];
  for (var i = 0; i < params.length; i++) {
    data[params[i]] = data[params[i]] || this[params[i]];
  }
}
 
/**
 * A queue consisting of many Hyperlapse job which will be created in order
 */
var HyperlapseQueue = function(elt, options) {
  this.max_points = options.max_points || 100;
  this.distance_between_points = options.distance_between_points || 5;
  this.zoom = options.zoom || 1;
  this.elevation = options.elevation || 0;
  this._elt = elt;
  this._jobs = [];
  for(var i = 0; i < options.data.length; i++) {
    parseData.call(this, options.data[i]);
    this._jobs.push(new HyperlapseJob(options.data[i]));
  }
  this._idx = 0;
};
 
// Default callbacks
HyperlapseQueue.prototype.onFinish = function() {};
HyperlapseQueue.prototype.onFrame = function() {};
HyperlapseQueue.prototype.onLoadComplete = function() {};
 
/**
 * Start the next Hyperlapse job in the queue
 * returns true if a job was indeed started
 */
HyperlapseQueue.prototype.startNext = function() {
  var that = this;
  if (that._jobs.length === 0) {
    that.onFinish();
    return false;
  }
 
  that._elt.innerHTML = "";
  var data = that._jobs.shift();
  data.start(that._elt, function(err, result) {
    if (err) {
      console.log(err);
      return;
    }
    if (result === "finished") {
      that.startNext()
    }
    if (result === "frame") {
      that.onFrame(that._idx);
      that._idx++;
    }
    if (result === "loaded") {
      that.onLoadComplete();
    }
  });
  return true;
};
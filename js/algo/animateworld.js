// test: no

(function(exports) {
  "use strict";

  var active = null;

  function Animated(world, tag_id, params) {    
    if (params) { // if provided, use params for configuration
      this.config = params.config;
    } else { // fallback: default configuration
      this.config = {
        autostart: true,
        tickTime: 60,
        scaleFactor: 1.5,
        useColor: true
      }
    }
    // configuration from params
    let style = document.documentElement.style;    
    style.setProperty('--scale-factor', this.config.scaleFactor);


    // remember the provided world as separate object for future resets
    this.initialWorld = world.duplicate();
    this.world = world; 

    // the outermost wrapper element
    this.outer = document.querySelector('#'+tag_id);
    // the wrapper that contains the displayed world and the control button
    this.wrapper = this.outer.appendChild(document.createElement("div"));
    this.wrapper.className = 'elife-wrapper';

    let buttonsWrapper = this.wrapper.appendChild(document.createElement("div"));
    buttonsWrapper.className = 'elife-btn-wrapper';
    // create and insert the control button
    this.buttonStartStop = buttonsWrapper.appendChild(document.createElement("div"));
    this.buttonStartStop.className = 'elife-btn';
    this.buttonStartStop.innerHTML = this.config.autostart ? "Stop" : "Start";

    // create and insert the reset button
    this.buttonReset = buttonsWrapper.appendChild(document.createElement("div"));
    this.buttonReset.className = 'elife-btn';
    this.buttonReset.innerHTML = 'Reset';

    this.legendPane = this.wrapper.appendChild(document.createElement('p'));
    this.legendPane.className = 'elife-legend';
    this.legendPane.innerHTML = `<pre><span style="color: rgb(0,130,0)">*</span> - plant | <span style="color: rgba(20,100,0,1)">o</span> - plant eater | <span style="color: rgba(170,40,0,1)">@</span> - predator</pre>`;

    var self = this;
    this.buttonStartStop.addEventListener("click", function() { self.clicked(); });
    this.buttonReset.addEventListener("click", function() { self.restart(); });

    // initialize the rest    
    this.init();
  }

  Animated.prototype.init = function() {
    const outer = this.outer;
    const world = this.world;
    const wrapper = this.wrapper;    

    // create the div that contains the displayed world, insert it into the wrapper
    this.pre = wrapper.insertBefore(document.createElement("pre"), wrapper.firstChild);
    this.pre.className = 'elife-pre';

    // create and insert the displayed world    
    let newNode = document.createElement('p');    
    newNode.innerHTML = world.toString(this.config.useColor);    
    this.pre.appendChild(newNode);   

    if (this.config.autostart) {
      this.interval = setInterval(function() { self.tick(); }, self.config.tickTime);
    }  
  }

  Animated.prototype.restart = function() {
    this.hold();    
    this.wrapper.removeChild(this.wrapper.firstChild);
    

    this.world = this.initialWorld;
    this.initialWorld = this.world.duplicate();
    this.init();    
  }

  Animated.prototype.clicked = function() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
      this.buttonStartStop.innerHTML = "Start";
    } else {
      var self = this;
      this.interval = setInterval(function() { self.tick(); }, self.config.tickTime);
      this.buttonStartStop.innerHTML = "Stop";
    }
  };

  Animated.prototype.tick = function() {
    this.world.turn();

    this.pre.removeChild(this.pre.firstChild);
    let newNode = this.pre.ownerDocument.createElement('p');
    newNode.innerHTML = this.world.toString(this.config.useColor);

    this.pre.appendChild(newNode);
  };

  Animated.prototype.go = function() {
    if (this.interval || this.buttonStartStop.innerHTML === "Start") {
      return;
    } else {
      this.clicked();
    }
  }

  Animated.prototype.hold = function() {
    if (this.interval) {
      this.clicked();
    } else {
      return;
    }
  }

  Animated.prototype.getWrapper = function() {
    return this.outer;
  }

  /**Deep copy. Don't use on objects with Date values  */
  function clone(obj) {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (Array.isArray(obj)) {
      let clonedArray = [];
      obj.forEach(function(element) {
        clonedArray.push(clone(element));
      });
      return clonedArray;
    }

    let clonedObj = new obj.constructor();
    for (var prop in obj) {
      if (obj.hasOwnProperty(prop)) {
        clonedObj[prop] = clone(obj[prop]);
      }
    }
    return clonedObj;
  }

  exports.animateWorld = function(world, tag_id, params) { return new Animated(world, tag_id, params); };
})(this.animator = {});

;(function(global) {

 /**
   * Creates a canvas, initializes and inserts it in a given div container. Tha canvas is then held by a Poppy object.
   * @param tag_id: id of the container that should display the poppy canvas
   * @param params: configuration parameters for the Poppy object. if null, using default values.
   * @return Poppy object - contains the canvas inserted to DOM and offers interface for display/behaviour control. */
global.poppyJS = function(tag_id, params) {
  /* configure canvas, initialize and launch (autoStart depends on params, by default it is true) */
  return new Poppy(tag_id, params);
};


/** Constructor for the poppy object
 * Configures and initializes the animation/drawing behaviour
 */
function Poppy(tag_id, params) {

  this.dom = {}

  let self = this;

  // remember identification tag in the dom
  let tag = this.dom.tag_id = tag_id;

  /* keep reference to container in the object props*/
  let wrp = this.dom.poppyWrapper = document.querySelector('#'+tag_id);

  // one canvas per Poppy object. referenced by this.canvas.el.
  let canv = this.dom.canvas = {};

  // animation/drawing/behaviour configuration
  let conf = this.config = {};

  // State-related props
  let st = this.state = {};

  // connection to global
  let globalCon = this.globalCon = {};

  // functionality
  let fn = this.fn  = {};


  // convenience vars
  let eraserDiv;
  let cursorDiv;
  let docElement;

  /* - - - ---  -- -- -- -- -- -- --- - - -  -   */
  /* - - - -- FUNCTION DEFINITIONS -- - - -  -   */
  /* - - - ---  -- -- -- -- -- -- --- - - -  -   */

  /* ====== Basic poppy configuration: setting defaults ====== */
  fn._configInit = function(params) {
    if (params) {
      conf = self.conf = params.config;
    } else {
      conf = self.conf = {
        autoStart: true,
        genTimeFrame: 50, // average circle popping rate (ms) - min. is 50. For faster rates, set poppers to values > 1.
        poppers: 1, // set to more than 1 for multiplying popping rate given by genTimeFrame
        freezeTime: 1000, // how long to suspend popping on mouse mouve events (ms)
        distort: false, // draw any distorted circles?
        distortAll: false,  // if distorting, distort all?
        distortionMargin: 0.5, // if distorting, maximum degree of distortion
        fill: true, // fill any circles?
        fillAll: true, // if filling, fill all?
        stroke: true, // stroke any circles?
        strokeAll: true, // if stroking, stroke all?
        chancesTransparent: 0.7,  // how many percent shall have any transparency? - value will vary randomly
        basicSize: 40, // basic size for a circle
        varSize: true,  // should sizes vary?
        minSize: 20, // minimum size for a cricle
        sizeVariationFactor: 5.5, // circles of different sizes? how much should they vary?
                                  // enter values >=1, 1 is for no variation
        perspective: true,

        bgColor: 'rgb(245, 245, 220)', // beige, default
        eraserColor: 'rgba(245,245,220,0.05)'
      };
    }
  }

  // ====================================== //
  /* =========== Initialization =========== */
  // ====================================== //

  // ---------- Initialize object state when booting ------- //
  fn._stateInit = function() {
    st = self.state = {
      onHold: conf.autoStart ? false : true, // flag: system halted or running. set only within fn._go() and fn._hold()
      offByButton: false, // flag: popping stopped by clicking on the button (erasing can also stop popping)
      timeOuts: [],  // pending timeout, each will call generateCircleTimeout()
      erasing: false, // flag: mouse held down
      outside: true, // flag: mouse outside of the canvas
      wheelUnlocked: false, // flag: init false, set to true after the first click.
                          // If false, no handling of mousewheel events
    }
  }
  /** Starting / resetting the thing.
   * In case of a reset, state is preserved, so that UX remains consistent.
   * However, the canvas is all cleared on resets.
   */
  fn._initAll = function(booting) {
    console.log('--- INIT/RESET --- . Booting: ', booting);

    if (booting) {
      fn._canvasInit(true);
      fn._eraserDivInit();
      fn._cursorDivInit();

      fn._buttonsInit();
      fn._eventsListeners(true);

      // state init
      fn._stateInit();

      // initialize convenience vars
      docElement = document.documentElement;
      eraserDiv = document.querySelector('#'+tag+' #eraser-div');
      cursorDiv = document.querySelector('#'+tag+' #cursor-div');
    } else {
      fn._canvasInit(false);
      fn._updateEraserCircleRadius();

      fn._eventsListeners(false);  // on resets, keep all listeners not related to the canvas itself

      // cancel timeout
      st.timeOuts.forEach(window.clearTimeout);
      window.clearTimeout(st.timeOut);
      st.timeOuts = [];
    }
  }
  // Prepare canvas
  fn._canvasInit = function(booting) {
    /* the canvas element that displays the animation */
    let canvas_el = document.createElement('canvas');
    canvas_el.className = 'poppy-main'; // for css to work

    if (booting) {
      /* insert canvas into its container*/
      wrp.appendChild(canvas_el);
    } else {
      /* insert canvas into its container*/
      wrp.replaceChild(canvas_el, canv.el);
    }

    // get ref to canvas context
    canvas_el.ctx = canvas_el.getContext('2d');
    // --- style according to config and context where embedded ---
    canvas_el.style.backgroundColor = conf.bgColor;
    let rad = getComputedStyle(wrp).getPropertyValue('border-radius');
    canvas_el.style.borderRadius = rad;
    canvas_el.ctx.clearRect(0,0,canvas_el.width, canvas_el.height);

    /* Setting canvas to fill the container - not including the borders.
      If container has borders, they are rendered 'inside' and 'take away'
      from the canvas real estate. Tried setting the css box-sizing of the
      parent to content-box, but for some reason it didn't work.*/
    canvas_el.width = wrp.clientWidth;
    canvas_el.height = wrp.clientHeight;

    // set canvas reference in object properties - both when booting and when resetting
    canv.el = canvas_el;
  }
  // Prepare Buttons
  fn._buttonsInit = function() {
    let controlPanel = document.createElement('div');
    controlPanel.classList.add('control-panel');
    wrp.appendChild(controlPanel);

    let controlButton = document.createElement('button');
    controlButton.classList.add('btn-popping');
    controlButton.classList.add('on');
    controlButton.innerHTML = '<img src="./img/pause.png" alt="Pause">';
    controlPanel.appendChild(controlButton);
  }
  // Prepare eraser cursor
  fn._eraserDivInit = function() {
    let eraser = document.createElement('div');
    eraser.id = 'eraser-div';
    wrp.appendChild(eraser);
  }
  // Prepare normal cursor div
  fn._cursorDivInit = function() {
    let cursorDiv = document.createElement('div');
    cursorDiv.id = 'cursor-div';
    wrp.appendChild(cursorDiv);
  }
  // Set up event listeners. When not booting, only the ones pertaining to canvas object are changed
  fn._eventsListeners = function(booting) {
    let canvasEl = canv.el;
    /* mouse */
    // allow no contextmenu for rightclicks
    canvasEl.addEventListener("contextmenu", function(e) {
      e.preventDefault();
    }, false);

    canvasEl.addEventListener('mousedown', fn._mouseDownHandler);
    canvasEl.addEventListener('mouseup', fn._mouseUpHandler);
    canvasEl.addEventListener('mouseout', fn._mouseOutHandler);
    canvasEl.addEventListener('mouseenter', fn._mouseEnterHandler);
    canvasEl.addEventListener('mousemove', fn._mouseMoveHandler);

    canvasEl.addEventListener('mousewheel', fn._mouseWheelHandler);

    if (booting) {
      let panel = wrp.querySelector('.control-panel');
      let button = wrp.querySelector('.btn-popping');
      button.addEventListener("click", fn._buttonClickHandler);
      globalCon.resizeListener = window.addEventListener('resize', fn._resizeHandler.bind(this));
    }
  }

  // ====================================== //
  /* ========= Drawing action ============  */
  // ====================================== //

  // sets the correct number of timeouts according to config
  fn._generateTimeouts = function() {
    console.log(st.timeOuts);
    for (let i=0; i<conf.poppers; i++) {
      setTimeout(fn._generateCircleTimeout, Math.round(Math.random()*1000));
    }
  }
  // performs action of drawing one circle according to config
  fn._generateCircle = function() {
    let c = canv.el.ctx;


    // Prepare needed values
    let coords = fn._generateNewCoords();
    let x = coords.x;
    let y = coords.y;
    let r = Math.floor(Math.random()*255);
    let g = Math.floor(Math.random()*255);
    let b = Math.floor(Math.random()*255);
    let color = 'rgb('+r+','+g+','+b+')';
    let colorWithAlpha = function(a) { return 'rgba('+r+','+g+','+b+','+a+ ')'; };
    let dM = conf.distortionMargin;
    let size = fn._calculateSizeForCircle(x,y);
    let perspective = conf.perspective;
    let alpha = perspective ? fn._computeAlphaFromPerspective(x,y) : Math.random();



    // stroke?
    let stroke = conf.stroke ? (conf.strokeAll ? true : (Math.random() > 0.7)) : false;
    // fill?
    let fill = conf.fill ? (conf.fillAll ? true : (Math.random() > 0.7)) : false;
    // change opacity? (when perspective is true, opacity settings result from there)
    let transparent = Math.random() <= conf.chancesTransparent;


    // distort? - reconfigure canvas context
    if (conf.distort) {
      let dist = Math.random() > 0.5;
      let distX = dM + Math.random()*(2-dM);
      let distY = dM + Math.random()*(2-dM);
      if (dist) {
        c.save();
        c.scale(distX, distY);
      }
    }

    // create the shape
    c.beginPath();
    c.arc(x, y,
          size,
          0, 7, false);

    // --- filling
    if (fill) {
      if (perspective) { // in perspective - the computed alpha takes perspective into consideration
        c.fillStyle = colorWithAlpha(alpha);
      } else { // no perspective
        if (transparent) {
          c.fillStyle = colorWithAlpha(alpha);
        } else {
          c.fillStyle = color;
        }
      }
      c.fill();
    }

    // --- stroking
    // strokes are always more opaque => use (alpha + 1)/2
    if (stroke) {
      if (!perspective) {
        c.lineWidth = conf.fill ? 2 : 4; // line thicker if no fills are drawn
        c.strokeStyle = transparent ? colorWithAlpha(Math.sqrt(alpha)) : color;
      } else { // in perspective - the computed alpha takes perspective into consideration
        c.lineWidth = fn._computeLineWidthFromPerspective(x,y, fill);
        c.strokeStyle = colorWithAlpha(Math.sqrt(alpha));
      }
      c.stroke();
    }

    // was it a distorted one? - need to restore
    if (conf.distort)
      c.restore();
  }
  // loop for drawing new circles, according to config
  fn._generateCircleTimeout = function() {
    if (st.onHold) { // popping is suspended
      return;
    }
    fn._generateCircle();
    var time = Math.floor(Math.random() * 2 * conf.genTimeFrame);
    st.timeOuts.push(setTimeout(fn._generateCircleTimeout, time));
  }
  // helper function = draws the circles that clear the canvas
  fn._drawEraserCircle = function(x,y) {
    const c = canv.el.ctx;
    // console.log(updateEraserCircleRadius());
    const radius = st.eraserCircleRadius ? st.eraserCircleRadius: fn._updateEraserCircleRadius();

    // create the shape
    c.beginPath();
    c.arc(x, y,
          radius,
          0, 7, false);

    // filling
    c.fillStyle = conf.eraserColor;
    c.fill();
  }

  // ====================================== //
  // ======= Event handling logic ========= //
  // ====================================== //

  // What to do when mouse down
  fn._mouseDownHandler = function(e) {
    // update cursor (make sure state is correct)
    if (st.outside) {
      st.outside = false;
      fn._toggleCursorDiv();
    }
    // unlock mousewheel
    st.wheelUnlocked = true;

    let coord = fn._getCoordinatesInCanvasFromClick(e);
    let leftClick = e.button === 0;
    // Only left CLicks are handled
    if (leftClick) {
      // MANAGE STATE
      // popping suspended during mousedown
      fn._hold();

      // prepare for possible mousemove
      st.erasing = true;
      lastX = coord.x;
      lastY = coord.y;
      fn._toggleEraserDiv();

      // CLICK HANDLING
      // draw an eraserCircle where the user clicked
      fn._drawEraserCircle(coord.x, coord.y);
    }
  }
  // what to do when mouse moves
  fn._mouseMoveHandler = function(e) {
    // update cursor (make sure state is correct)
    if (st.outside) {
      st.outside = false;
      fn._toggleCursorDiv();
    }

    let coord = fn._getCoordinatesInCanvasFromClick(e);

    // update coordinates in css
    eraserDiv.style.setProperty('--mouse-pos-x', coord.x);
    eraserDiv.style.setProperty('--mouse-pos-y', coord.y);
    cursorDiv.style.setProperty('--mouse-pos-x', coord.x);
    cursorDiv.style.setProperty('--mouse-pos-y', coord.y);

    // action eraser, if we're erasing
    if (st.erasing) {
      // draw an eraserCircle where the user clicked
      fn._drawEraserCircle(coord.x, coord.y);
      // store current pos as last pos
      lastX = coord.x;
      lastY = coord.y;
    }
  }
  // what to do when mouse button released
  fn._mouseUpHandler = function(e) {
    // update cursor (make sure state is correct)
    if (st.outside) {
      st.outside = false;
      fn._toggleCursorDiv();
    }
    // stop erasing
    if (st.erasing) {
      // not erasing anymore
      fn._toggleEraserDiv();
      // reset the erasing flag
      st.erasing = false;
    }
    if (st.onHold) {
      // proceed with popping
      fn._go();
    }
    // exit
    return;
  }
  fn._mouseOutHandler = function(e) {
    // flag the exit
    st.outside = true;
    // loose cursorDiv
    fn._toggleCursorDiv();
    // stop erasing, if necessary
    if (st.erasing) {
      st.erasing = false;
      fn._toggleEraserDiv();
    }
  }
  fn._mouseEnterHandler = function(e) {
    st.outside = false;
    fn._toggleCursorDiv();
  }
  fn._mouseWheelHandler = function(e) {
    if (!st.wheelUnlocked) {
      return;
    }
    e.deltaY; // scrolled up: negative | down: positive values

    // Eraser
    const computedStyle = getComputedStyle(docElement);
    const min = +computedStyle.getPropertyValue('--radius-eraser-div-min');
    const max = +computedStyle.getPropertyValue('--radius-eraser-div-max');
    const current = +getComputedStyle(eraserDiv).getPropertyValue('--radius-used');
    const newVal = current + Math.sign(e.deltaY)*(-1)*5;
    if (newVal >= min && newVal <= max) {
      eraserDiv.style.setProperty('--radius-used', newVal);
      cursorDiv.style.setProperty('--radius-used', Math.floor(newVal/2));
      // now erasing with the new radius
      fn._updateEraserCircleRadius();
    }
    event.preventDefault();
  }
  // hanlder for button clicks
  fn._buttonClickHandler = function(e) {
    // unlock mousewheel
    st.wheelUnlocked = true;

    let button = e.target;
    if (button.classList.contains('on')) {
      // switch off
      button.classList.remove('on');
      button.classList.add('off');
      button.innerHTML = '<img src="./img/play.png" alt="Play">';
      st.offByButton = true;
      // stop drawing
      fn._hold();
    } else {
      // switch on
      button.classList.remove('off');
      button.classList.add('on');
      button.innerHTML = '<img src="./img/pause.png" alt="Pause">';
      st.offByButton = false;
      // attempt to continue drawing
      fn._go();
    }
  }
  fn._toggleEraserDiv = function(e) {
    // update state in the css of the element
    const computedStyle = getComputedStyle(eraserDiv);
    const current = computedStyle.getPropertyValue('opacity');
    if (current === '0') {
      eraserDiv.style.setProperty('--opacity-used', 'var(--opacity-eraser-div-max)');
    } else {
      eraserDiv.style.setProperty('--opacity-used', '0');
    }
  }
  fn._toggleCursorDiv = function(e) {
    // update state in the css of the element
    const computedStyle = getComputedStyle(cursorDiv);
    const current = computedStyle.getPropertyValue('opacity');
    if (current === '0') {
      cursorDiv.style.setProperty('--opacity-used', 'var(--opacity-cursor-div-max)');
    } else {
      cursorDiv.style.setProperty('--opacity-used', '0');
    }
  }
  // for window resize events
  fn._resizeHandler = function() {
    fn._initAll(false); // reset the thing
    if (!st.onHold) {
      fn._go();
    }
  }


  // ------------ HELPERS -------------- //

  fn._getCoordinatesInCanvasFromClick = function(e) {
    let xOnPage = e.clientX;
    let yOnPage = e.clientY;
    let canvasRect = canv.el.getBoundingClientRect();
    let xOnCanvas = xOnPage - canvasRect.x;
    let yOnCanvas = yOnPage - canvasRect.y;
    return {x: xOnCanvas, y: yOnCanvas};
  }
  fn._outOfCanvas = function(e) {
    let xOnPage = e.clientX;
    let yOnPage = e.clientY;
    let canvasRect = canv.el.getBoundingClientRect();
    return xOnPage < canvasRect.left ||
            xOnPage > canvasRect.right ||
            yOnPage < canvasRect.top ||
            yOnPage > canvasRect.bottom;
  }
  fn._generateNewCoords = function() {
    let x;
    let y;
    basicY = Math.random()*canv.el.offsetHeight;
    basicX = Math.random()*canv.el.offsetWidth;
    if (!conf.perspective) {
      // simple, done.
      x = basicX;
      y = basicY;
    } else {
      // PERSPECTIVE
      // draw point towards the center

      // pullfactor:
      let distCenter = fn._getDistToCenter(basicX, basicY);
      let cornerDist = Math.floor(fn._getDistToCenter(0,0));
      let pullFactor = distCenter/cornerDist;

      cX = canv.el.offsetWidth/2; // centerx
      cY = canv.el.offsetHeight/2; // centery
      // TRANSFORM coordinates to cartesian system with origin at canvascenter
      let transX = basicX-cX;
      let transY = cY-basicY;
      // pull towards center
      transXPulled = transX*pullFactor;
      transYPulled = transY*pullFactor;
      // Transform back
      x = cX + transXPulled;
      y = cY - transYPulled;
    }

    return {x: Math.floor(x), y: Math.floor(y)};
  }
  fn._computeAlphaFromPerspective = function(x,y) {
    let alpha;

    // far away means smaller alpha value

    let dist = Math.floor(fn._getDistToCenter(x,y));
    let cornerDist = Math.floor(fn._getDistToCenter(0,0));
    let correctedVal = Math.pow(dist/cornerDist, 1.5);

    alpha = Number(correctedVal).toFixed(2); // smallest at the center
    return alpha;
  }
  fn._computeLineWidthFromPerspective = function(x,y, fillToo) {
    // far away means smaller width;
    let dist = Math.floor(fn._getDistToCenter(x,y));
    let cornerDist = Math.floor(fn._getDistToCenter(0,0));
    // change should be non-linear.
    let correctedVal = Math.pow(dist/cornerDist, 1);
    let minWidth = 0.2;
    let maxWidth = fillToo ? 4 : 4; // keep the same
    let factor; // between 0 and 1
    factor = Number(correctedVal).toFixed(2); // smallest at the center

    return minWidth + factor*(maxWidth-minWidth);
  }
  // x and y coordinates within canvas - (0,0) is the upper left corner
  fn._getDistToCenter = function(x,y) {
    const canvasRect = canv.el.getBoundingClientRect();
    const xCenter = canvasRect.width/2;
    const yCenter = canvasRect.height/2;
    const dist = Math.sqrt((xCenter-x)*(xCenter-x) +
                           (yCenter-y)*(yCenter-y));
    return dist;
  }
  fn._calculateSizeForCircle = function(x,y) {
    let size;
    if (!conf.varSize && !conf.perspective) {
      size = conf.basicSize;
    } else {
      let factor = conf.sizeVariationFactor; // 1 is min
      let max = Math.floor(conf.basicSize * factor); // grows
      let min = Math.floor(conf.basicSize / factor); // shrinks
      let range = max-min;

      if (!conf.perspective) {
        // random choice of size
        let targetSize = min + Math.random()*range; // value in range
        // take computed target size only if greater than expected minSize
        size = Math.max(targetSize, conf.minSize);
      } else {
        // create perspective effect: distance to center corellated with circle size
        // don't care about minSize
        let dist = Math.floor(fn._getDistToCenter(x,y));
        let cornerDist = Math.floor(fn._getDistToCenter(0,0));
        let correctedVal = Math.pow(dist/cornerDist, 1.2); // not lineary changing.

        size = min + correctedVal*range; // smallest at the center
      }
    }
    return size;
  }
  /* Update via css variables : computes and returns the current radius for an erasercircle.
    It's the eraser-div-radius and the amount added by it's shadow*/
  fn._updateEraserCircleRadius = function() {
    const docStyle = getComputedStyle(docElement);
    const eraserStyle = eraserDiv.style;
    const radius = +eraserStyle.getPropertyValue('--radius-used') +
                   +docStyle.getPropertyValue('--radius-eraser-div-shadowadd');

    st.eraserCircleRadius = radius;
    return radius;
  }

  // ======================================== //
  // ----- Control and Access functions ----- //
  // ======================================== //

  /** Use this for all cases when the system is supposed to run.
   * Calling it multiple times should not affect the system behaviour
   * or the cpu/memory usage.
   */
  fn._go = function() {
    console.log('GO');

    if (st.offByButton) {
      // no need to generate any new timeout
      // system is supposed to stay on hold
      return;
    } else {
      st.timeOuts.forEach(window.clearTimeout);
      st.timeOuts = [];
      st.onHold = false;
      fn._generateTimeouts();
    }
  }
  fn._hold = function() {
    console.log('HOLD');
    st.onHold = true;
    st.timeOuts = [];
    st.timeOuts.forEach(window.clearTimeout);
  }
  fn._kill = function() {
    // disconnect from global context
    window.removeEventListener('resize', globalCon.globalResizeListener);
    st.timeOuts.forEach(window.clearTimeout);
    // remove canvas from parent div in the dom
    canv.el.remove();
  }

  // --------=====  END FUNCTIONS ====--------- //



  // =====-------------------------------------====  //
  // ========------ START THE THING ------=========  //
  // =====-------------------------------------====  //

  // configure
  fn._configInit(params);
  // booting
  fn._initAll(true);
  // make 'em pop
  if (conf  .autoStart) {
    fn._go();
  }

  // ------------- DEBUGGING ------------ //
  function logState() {
    console.log('=== STATE ===');
    console.log('onHold: ', st.onHold);
    console.log('offByButton: ', st.offByButton);
    console.log('timeOuts: ', st.timeOuts);
    console.log('erasing: ', st.erasing);

    console.log('outside: ', st.outside);
    console.log('eraserCircleRadius: ', st.eraserCircleRadius);
    console.log('wheelUnlocked: ', st.wheelUnlocked);

    console.log('globalResizeListener: ', globalCon.globalResizeListener);
  }
}

// ========================================== //
// ========== Interface to GLOBAL =========== //
// ========================================== //

/** Use this for all cases when the system is supposed to run.
 * Calling it multiple times should not affect the system behaviour
 * or the cpu/memory usage.
 */
Poppy.prototype.go = function() {
  this.fn._go();
}
/** Use this to suspend the system.
 * Calling it multiple times should not affect the system behaviour
 * or the cpu/memory usage.
 */
Poppy.prototype.hold = function() {
  this.fn._hold();
}
Poppy.prototype.kill = function() {
  this.fn._kill();
}
Poppy.prototype.getWrapper = function() {
  return this.dom.poppyWrapper;
}

})(window);

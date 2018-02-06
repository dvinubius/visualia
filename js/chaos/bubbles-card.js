;(function(global) {

  /**
   * Creates, initializes and starts the BubblesCard animation, inserted in a given div container.
   * @param tag_id: id of the container that should display the bubblesCard canvas
   * @param params: configuration parameters for the BubblesCard object. if null, using default values.
   * @return BubblesCard object - contains the canvas inserted to DOM and offers interface for display/behaviour control. */
  window.bubblesCardJS = function(tag_id, params) {
    /* configure canvas, initialize and launch (autoStart depends on params, by default it is true) */        
    return new BubblesCard(tag_id, params);
  };
  
  
  /** Constructor for the BubblesCard object
   * Configures and initializes the animation/drawing behaviour
   */
  let BubblesCard = function(tag_id, params) {  
    let self = this;

    this.dom = {};

    // remember identification tag in the dom
    let tag = this.dom.tag_id = tag_id;
  
    /* keep reference to container in the object props*/
    let wrp = this.dom.bubblesCardWrapper = document.querySelector('#'+tag_id);
  
    // one canvas per BubblesCard object. referenced by this.canv.el.
    let canv = this.dom.canvas = {};
  
    // animation/drawing/behaviour configuration
    let conf = this.config = {};
  
    // State-related props
    let st = this.state = {};
  
    // connection to global
    let globalCon = this.globalCon = {};
  
    // functionality
    let fn = this.fn  = {};
    
    // ==== Convenience vars & Data Structures === //
    let docElement;
    let canvasRect;
    let boxRect;
    const initialBoxWidth = 600;
    const initialBoxHeight = 300;
    const radiantsCircle = 2*Math.PI;  
    // EIGHT ZONES (SURFACES) on canvas, around the message box
    const zonesByNumber = [
      "top", 
      "bottom",
      "left", 
      "right",
      "tl", 
      "tr", 
      "br", 
      "bl"
    ]; 
    // coordinates and dimensions for each zone
    let zoneRects; 
    let zoneThresholds = []; // for calculating random distribution of circles

  
  
    /* - - - ---  -- -- -- -- -- -- --- - - -  -   */
    /* - - - -- FUNCTION DEFINITIONS -- - - -  -   */
    /* - - - ---  -- -- -- -- -- -- --- - - -  -   */
  
    /* ====== Basic BubblesCard configuration: setting defaults ====== */
    fn._configInit = function(params) {
      if (params) {
        conf = self.config = params.config;
      } else {
        conf = self.config = {
          autoStart: true,
          numberOfBubbles: 900,
          defaultRadius: 3,
          maxRadius: 40,   // when cursor is near
          minRadius: 5,   // when cursor is near
          speed: 0.5,
          animStepTime: 100, // ms for one animation step          
          interactive: true,
          senseDistance: 40,
          senseDistanceEnhancement: 1, // during mousedown. 1 = no effect
          growthRate: 5.5,  // while close to cursor (caught), each animation step makes the size change
          growthRateEnhancement: 1.5, // during mousedown
          stopClickedBubbles: false,    // grab and keep close bubbles during mousedown
          alphaForClose: 0.5, // display grabbed bubbles transparent
          strokeClickedBubbles: true, // used during mousedown
          bgColor: 'rgb(245, 245, 220)', // beige, default
          defaultColorInside: "rgb(0,0,0)",
          colorPaletteInsides: [
            "rgb(178,97,6)",
            "rgb(255,224,189)",
            "rgb(255,143,17)",
            "rgb(0,127,178)",
            "rgb(17,186,255)",
            "rgb(0,54,76)"
          ]
        };
      }
    }
  
  
    // ====================================== //
    /* =========== Initialization =========== */
    // ====================================== //
  
    // ---------- Initialize object state when booting ------- //
    fn._stateInit = function() {         
      st = self.state = {
        onHold: conf.autoStart ? false : true, // flag: system halted or running. set within fn._go() and fn._hold();
        mouseDown: false,
        offByButton: false, // flag: popping stopped by clicking on the button (erasing can also stop popping)
        wheelUnlocked: false, // flag: init false, set to true after the first click.
                            // If false, no handling of mousewheel events
        bubblesArray: [],
        colorArrayInsides: [], // ["rgb(r,g,b)"] or ["rgba(r,g,b,a)"]
        mouse: {           // keeps track of current mouse position
          x: undefined, 
          y: undefined,
          xDiff: undefined,
          yDiff: undefined
        }
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
        fn._buttonsInit();
        fn._eventListeners();
        // state init
        fn._stateInit();
  
        // initialize convenience vars
        docElement = document.documentElement;
      } else {
        fn._canvasInit(false);        
      }
    }
    // Prepare canvas at start/update canvas on resize
    fn._canvasInit = function(booting) {      
      if (booting) {
        /* the canvas element that displays the animation */
        let canvas_el = document.createElement('canvas');
        canvas_el.className = 'bubbles-card-main'; // for css to work
    
        wrp.appendChild(canvas_el);        
    
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

        canvasRect = canv.el.getBoundingClientRect();       

        // init MessageBox
        let box = document.createElement('div');
        box.className = 'message-box';
        box.innerHTML = 
          `<h1>Pentru <small>...</small></h1>
           <h2><small>... urare ...</small></h2>
           <h5>...semnat...<h5>`;
        wrp.appendChild(box);                           
        boxRect = box.getBoundingClientRect();

        // init the zones needed for generating initial bubble coordinates
        // the init calculation is based on the canvas and box dimensions initialized above
        fn._zonesInit();

      } else { // Not booting, but resizing
        // update canvas
        canv.el.width = wrp.clientWidth;
        canv.el.height = wrp.clientHeight;
        canvasRect = canv.el.getBoundingClientRect();   
        return; 
      }
    }
    // Prepare Buttons
    fn._buttonsInit = function() {
      let controlPanel = document.createElement('div');
      controlPanel.classList.add('control-panel');
      wrp.appendChild(controlPanel);
  
      let controlButton = document.createElement('button');
      controlButton.classList.add('btn-animate');
      controlButton.classList.add('on');
      controlButton.innerHTML = '<img src="./img/pause.png" alt="Pause">';
      controlPanel.appendChild(controlButton);
    }
    // Set up event listeners. When not booting, only the ones pertaining to canvas object are changed
    fn._eventListeners = function() {
      let canvasEl = canv.el;     
      /* mouse */
      // allow no contextmenu for rightclicks
      canvasEl.addEventListener("contextmenu", function(e) {
        e.preventDefault();
      }, false);

      if (conf.interactive) {
        canvasEl.addEventListener('mouseout', fn._trackNoMore);
        canvasEl.addEventListener('mouseenter', fn._updateMouse);
        canvasEl.addEventListener('mousemove', fn._updateMouse);
        canvasEl.addEventListener('mousedown', fn._attractMore);
      }   

      let panel = wrp.querySelector('.control-panel');
      let button = wrp.querySelector('.btn-animate');
      button.addEventListener("click", fn._buttonClickHandler);
      globalCon.resizeListener = window.addEventListener('resize', fn._resizeHandler.bind(this));      
    }
  
    // generates the bubble objects to be used in the animation
    fn._generateBubbles = function() {      
      // prepare colors
      let palette;
      //colors for insides - use palette if available
      conf.colorPaletteInsides.length > 0 ? palette = conf.colorPaletteInsides : palette = [conf.defaultColorInside];    
      st.colorArrayInsides = colorArrayFromPalette(palette, conf.numberOfBubbles); 

      // create bubble objects
      for (let i = 0; i < conf.numberOfBubbles; i++) { 
        let rad = conf.defaultRadius;
        let [x,y] = randomXYAroundMessageBox();
        let dx = 0; // vertical only
        let dy = (Math.random() - 0.5)*conf.speed;

        let fillCol = st.colorArrayInsides[i];
        let strokeCol = fillCol === "rgb(0,0,0)" ? randomCol() : fillCol;
        
        const bubble = new Bubble(x, y, dx, dy, rad, strokeCol, fillCol);
        st.bubblesArray.push(bubble);
      }

      // memory cleanup
      st.colorArrayInsides = null;
    }
    // Helper function to prepare ground for randomly choosing circle positions when generating new circles
    fn._zonesInit = function() {
      // using boxRect and canvasRect - calculating surfaces given
      // by the padding of canvas (containing the boxRect at its center)
      // --- ! not CSS padding property, but the "would-be" padding 
      // that results from the sizes and placement of the box within the canvas

      const paddingX = (canvasRect.width - boxRect.width)/2;  
      const paddingY = (canvasRect.height - boxRect.height)/2;
      
      // surface above or below the box
      const aboveOrBelow = boxRect.width*paddingY;
      // surface lateral to the box  
      const lateral = boxRect.height*paddingX;
      // surface of one "corner" (outside of box)
      const corner = paddingX*paddingY;

      // all available space
      const totalSurface = 4*corner + 2*aboveOrBelow + 2*lateral;
        
      // how much of the total available space does each surface take?
      const zoneWeights = [
        aboveOrBelow/totalSurface, // top
        aboveOrBelow/totalSurface, // bottom
        lateral/totalSurface, // left
        lateral/totalSurface, // right
        corner/totalSurface, // tl
        corner/totalSurface, // tr
        corner/totalSurface, // br
        corner/totalSurface, // bl
      ];

      // calculate thresholds of distribution function (zone category distribution)
      // they are saved in the global zoneThresholds array, to be used at circle object generation  
      zoneWeights.forEach((el,index) => {
        let sumWeights = 0;
        for (let i=0; i<=index; i++) {
          sumWeights += zoneWeights[i];
        }
        zoneThresholds[index] = sumWeights;
      });


      // init data for Zone Rects
      zoneRects = {
        "tl": {
          x: 0,
          y: 0,
          width: paddingX,
          height: paddingY
        },
        "top": {
          x:paddingX,
          y:0,
          width:boxRect.width,
          height:paddingY
        },
        "tr": {
          x: paddingX+boxRect.width,
          y: 0,
          width: paddingX,
          height: paddingY
        },
        "right": {
          x: paddingX+boxRect.width,
          y: paddingY,
          width: paddingX,
          height: boxRect.height
        },
        "br": {
          x: paddingX+boxRect.width,
          y: paddingY+boxRect.height,
          width: paddingX,
          height: paddingY
        },
        "bottom": {
          x: paddingX,
          y: paddingY+boxRect.height,
          width: boxRect.width,
          height: paddingY
        },
        "bl": {
          x:0,
          y:paddingY+boxRect.height,
          width: paddingX,
          height: paddingY
        },
        "left": {
          x:0,
          y: paddingY,
          width: paddingX,
          height: boxRect.height
        }
      };
    }
  
  
    // ====================================== //
    /* ========= Drawing / Animation =======  */
    // ====================================== //
  
    fn._animateBubbles = function() {
      if (st.onHold) {        
        console.log('exiting animation cuz on Hold');   
        return;
      }
      // -- else
      let lastTime = null;
      function frame(time) {
        if (st.onHold) {                         
          return;
        } else {
          if (lastTime != null) {
            fn._updateAnimation(Math.min(conf.animStepTime, time - lastTime) / 1000);
            // result is in seconds, max is 0.1s
          }
          lastTime = time;
          requestAnimationFrame(frame);
        }        
      }
      requestAnimationFrame(frame);
    }


    // stepTime is in seconds
    fn._updateAnimation = function(stepTime) {  
      let c = canv.el.getContext('2d');

      c.clearRect(0,0,canv.el.width,canv.el.height);

      st.bubblesArray.forEach((bubble) => {
        // STROKES are done according to config
        let doStroke = bubble.useStrokeAlways || bubble.clicked && conf.strokeClickedBubbles;
        // ALPHA IS used according to config
        let doUseAlpha = bubble.clicked && conf.alphaForClose < 1;
        if (doUseAlpha && !bubble.colAlpha) {          
          // if bubble has no alpha defined yet, define it in this animation frame              
          bubble.colAlpha = addAlphaToRGB(bubble.colFill, conf.alphaForClose);
        }       
        

        // ------- Draw the bubble --------
        c.beginPath();
        c.arc(bubble.x, bubble.y,
              bubble.radius,
                0, radiantsCircle, false);    
      
        c.fillStyle = (doUseAlpha) ? bubble.colAlpha : bubble.colFill;     
        c.fill();
        if (doStroke) {
          if (doUseAlpha) {
            c.lineWidth = 3;
            c.strokeStyle = bubble.colStroke;
            c.stroke();
            c.lineWidth = 0.5;
            c.strokeStyle = 'black';
            c.stroke();
          } else {
            c.lineWidth = 1;
            c.strokeStyle = bubble.colStroke;
            c.stroke();
          }          
        }

        let holdMe = false; // should this bubble remain where it is?

        //update the size    
        let d = distance(st.mouse.x, st.mouse.y, bubble.x, bubble.y);
        if (d < conf.senseDistance) { // ------- bubble close to the cursor
          // set flag for close-to-cursor display:      
          bubble.caught = true;      
          // change size, if necessary
          if (conf.growthRate >= 0 && bubble.radius < conf.maxRadius) { // necessary to grow
            bubble.radius = Math.min(bubble.radius+conf.growthRate, conf.maxRadius);        
          }
          if (conf.growthRate < 0 && bubble.radius > conf.minRadius) { // necessary to shrink
            bubble.radius = Math.max(bubble.radius+conf.growthRate, conf.minRadius);        
          }

          if (st.mouseHeldDown) { 
            // settings for mouse-down display. they will take effect in the next frame
            if (st.stopClickedBubbles) { holdMe = true; } // bubble stops when caught by click            
            bubble.clicked = true; // flag the state
          } else {                        
            bubble.clicked = false; // flag the state            
          }
        } else { // ------- bubble not close to the cursor anymore
          // undo flag for close-to-cursor display:
          bubble.caught = false; 
          bubble.clicked = false;          

          // come back to original size, if necessary
          if (bubble.radius > bubble.initialRadius) { // necessary to shrink
            bubble.radius = Math.max(bubble.radius-conf.growthRate,bubble.initialRadius);
          }
          if (bubble.radius < bubble.initialRadius) { // necessary to grow
            bubble.radius = Math.min(bubble.radius-conf.growthRate,bubble.initialRadius);
          }
        }
        
        if (holdMe) { // not the usual update of coordinates 
          return;           
        }
        // ELSE -update coordinates


        // would-be coordinates for next rendering
        let newX = bubble.x + bubble.dx*stepTime*100;
        let newY = bubble.y + bubble.dy*stepTime*100;

        // AVOID COLLISIONS:

        // Keep bubble within canvas and around messagebox
        if (outsideCanvasX(newX, bubble) || insideNewX(newX, bubble)) {
          bubble.dx = -bubble.dx;      
          // coordinate X remains unchanged, only the moving direction changes
        } else {
          // update coordinate X                  
          bubble.x = newX;
        }
        if (outsideCanvasY(newY, bubble) || insideNewY(newY, bubble)) {
          bubble.dy = -bubble.dy;
          // coordinate Y remains unchanged, only the moving direction changes
        } else {
          // update coordinate Y
          bubble.y = newY;  
        }  
      });  
    }
  
    // ====================================== //
    // ======= Event handling logic ========= //
    // ====================================== //
      
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
    // for window resize events
    fn._resizeHandler = function() {
      fn._initAll(false); // reset the thing
      if (!st.onHold) {
        fn._go();
      }
    }

    fn._updateMouse = function(event) {
      let coords = getCoordinatesInCanvasFromClick(event);
      st.mouse.x = coords.x;
      st.mouse.y = coords.y;
    }
    fn._attractMore = function() {  
      st.mouseHeldDown = true;
      conf.senseDistance = conf.senseDistance*conf.senseDistanceEnhancement;
      conf.growthRate = conf.growthRate*conf.growthRateEnhancement;  
      canv.el.removeEventListener('mousedown', fn._attractMore);  
      canv.el.addEventListener('mouseup', fn._release);
      canv.el.addEventListener('mouseout', fn._release);  
    }    
    fn._release = function() {
      st.mouseHeldDown = false;
      conf.senseDistance = conf.senseDistance/conf.senseDistanceEnhancement;
      conf.growthRate = conf.growthRate/conf.growthRateEnhancement;  
      canv.el.removeEventListener('mouseup', fn._release);
      canv.el.removeEventListener('mouseout', fn._release);
      canv.el.addEventListener('mousedown', fn._attractMore);     
      st.bubblesArray.forEach((bubble) => bubble.colAlpha = null);
    }
    fn._trackNoMore = function() {
      st.mouse.x = undefined;
      st.mouse.y = undefined;
    }
  
  
    // ------------------------------------- //
    // ------- AUX stuff, HELPERS  --------- //
    // ------------------------------------- //
  
    
    /* Constructor for Bubble objects
    dx & dy are velocity, rad is radius, colS is colour for edge, colF is for fill*/
    function Bubble(x,y,dx,dy,rad,colS,colF) {
      this.x = x;
      this.y = y;
      this.dx = dx; // velocity x
      this.dy = dy; // velocity y
      this.initialRadius = rad;
      this.colStroke = colS; // color to use when stroking bubble
      this.colFill = colF; // color to use when filling bubble
      this.colAlpha = null; // color to use when filling and alpha is desired
      this.radius = rad;
      this.caught = false; // when bubble is close to cursor
      this.useAlpha = false; // should colAlpha be used for fill rendering?
      this.useStrokeAlways = colS !== colF; // should a stroke be used for rendering
      this.clicked = false; // flag: when caught by cursor AND clicked
    }
     
    function getCoordinatesInCanvasFromClick(e) {
      let xOnPage = e.clientX;
      let yOnPage = e.clientY;
      let canvasRect = canv.el.getBoundingClientRect();
      let xOnCanvas = xOnPage - canvasRect.x;
      let yOnCanvas = yOnPage - canvasRect.y;
      return {x: xOnCanvas, y: yOnCanvas};
    }
    // helper function
    function distance(x, y, x2, y2) {
      return Math.sqrt((x-x2)*(x-x2) + (y-y2)*(y-y2));
    }
    /** Generates random values for x and y of a bubble, 
     * distributing them evenly in the available space
     * (space surrounding message box, within canvas) */
    function randomXYAroundMessageBox() {
      // choose random zone according to distribution
      // returns a string: name of category
      function chooseRandomZone() {
        const zoneValue = Math.random();    
        // map according to the weight distribution
        let zoneNumber;
        if (zoneValue < zoneThresholds[0]) {       
          zoneNumber = 0;
        } else {
          for (let i=1; i<zoneThresholds.length; i++) {
            if (zoneValue < zoneThresholds[i]) {
              zoneNumber = i;
              break;
            }
          }      
        }        
        return zonesByNumber[zoneNumber];
      }

      function XYByRect(rect) {        
        let x = rect.x + conf.defaultRadius + Math.random()*(rect.width - 2*conf.defaultRadius);
        let y = rect.y + conf.defaultRadius + Math.random()*(rect.height - 2*conf.defaultRadius);
        return [x,y];
      }
  
      return XYByRect(zoneRects[chooseRandomZone()]);
    }
    
    //helper function collision detection
    function outsideCanvasX(newX, bubble) {
      return newX + bubble.radius > canvasRect.width || newX-bubble.radius < 0;
    }
    //helper function collision detection
    function outsideCanvasY(newY, bubble) {
      return newY + bubble.radius > canvasRect.height || newY-bubble.radius < 0;
    }
    //helper function collision detection
    function insideNewX(newX, bubble) {
      let borderLeft = boxRect.left-canvasRect.left;
      let borderRight = boxRect.right-canvasRect.left;
      let borderTop = boxRect.top-canvasRect.top;
      let borderBottom = boxRect.bottom-canvasRect.top;
        
      let fromLeft = newX + bubble.radius >= borderLeft &&
                    newX < borderRight;
      let fromRight = newX + bubble.radius <= borderRight &&
                    newX > borderLeft;
      
      let verticallyThere = bubble.y > borderTop &&
                            bubble.y < borderBottom;

      return (fromLeft || fromRight) && verticallyThere;
    }
    //helper function collision detection
    function insideNewY(newY, bubble) {
      let borderTop = boxRect.top-canvasRect.top;
      let borderBottom = boxRect.bottom-canvasRect.top;
      let borderLeft = boxRect.left-canvasRect.left;
      let borderRight = boxRect.right-canvasRect.left;

      let fromTop = newY + bubble.radius >= borderTop &&
                    newY < borderBottom;
      let fromBottom = newY + bubble.radius <= borderBottom &&
                      newY > borderTop;

      let horizontallyThere = bubble.x > borderLeft && 
                              bubble.x < borderRight;

      return (fromTop || fromBottom) && horizontallyThere;
    }

    // palette is an array of colors in rgb format. 
    function colorArrayFromPalette(palette, size) {  
      let colors = [];  
      for (let i=1; i<=size; i++) {    
        colors.push(palette[Math.floor(Math.random()*palette.length)]);
      }
      return colors;
    }
    // helper for generating random color in rgb format, as string
    function randomCol() { 
      const r = Math.floor(Math.random()*255);
      const g = Math.floor(Math.random()*255);
      const b = Math.floor(Math.random()*255);
      return 'rgb('+r+','+g+','+b+')'; 
    }
    // helper for generating random color with random alpha value, 
    // returns string in rgba format
    function randomColAlpha() { 
      const a = Math.random();
      return addAlphaToRGB(randomCol(),a);
    };
    // returns array of strings with random rgb values
    function generateRandomPalette(size) {
      const palette = [];
      for (let i=1; i<=size; i++) {
        palette.push(randomCol());    
      }
      return palette;
    }
    // helper function. adds random alpha value to a string @param col (has to be in rgb format). 
    // returns string in rgba format
    function addAlphaToRGB(col, alpha) {  
      const newCol = col.replace('rgb', 'rgba').replace(')', ','+alpha+')');
      return newCol;
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
      // check onHold too, so to avoid multiple parallel animation "threads"
      if (!st.offByButton && st.onHold) {
        // set flag
        st.onHold = false;
        // set style
        canv.el.style.setProperty('cursor', 'crosshair');
        // start system
        fn._animateBubbles();
      }
    }
    fn._hold = function() {
      console.log('HOLD');
      // halt system
      st.onHold = true;      
      // set style
      canv.el.style.setProperty('cursor', 'default');      
    }
    fn._kill = function() {
      // disconnect from global context
      window.removeEventListener('resize', globalCon.globalResizeListener);
      // remove canvas from parent div in the dom
      canv.el.remove();
    }
  
    // --------=====  END FUNCTIONS ====--------- //
  
  
    // =====-------------------------------------====  //
    // ========------ START THE THING ------=========  //
    // =====-------------------------------------====  //
  
    // configure (with params passed into constructor)
    fn._configInit(params);
    // booting
    fn._initAll(true);
    // create content
    fn._generateBubbles();
    // bring.it.on     
    if (conf.autoStart) {     
      // animate content
      fn._animateBubbles();
      // set state
      st.running = true;
    }
  
  }
  
  // ========================================== //
  // ========== Interface to GLOBAL =========== //
  // ========================================== //
  
  BubblesCard.prototype.go = function() {
    // avoid multiple parallel animations     
    this.fn._go();        
  }  
  BubblesCard.prototype.hold = function() {    
    this.fn._hold();
  }  
  BubblesCard.prototype.getWrapper = function() {
    return this.dom.bubblesCardWrapper;
  }
  
})(window);
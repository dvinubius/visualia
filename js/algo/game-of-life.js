;(function(global) {

  /**
    * Creates a display with controls, initializes and inserts it in a given div container. 
    These elements are then stored in a GameOfLife object.
    * @param tag_id: id of the container that should contain the gameOfLife display
    * @param params: configuration parameters for the GameOfLife object. if null, using default values.
    * @return GameOfLife object - contains references to a wrapper element, the display element (grid) 
                                  and the controls inserted to DOM. 
                                  Provides interface for display/behaviour control. */
  global.gameOfLifeJS = function(tag_id, params) {
    /* configure display, initialize and launch */
    return new GameOfLife(tag_id, params);
  };
 
 
  /** Constructor for the GameOfLife object
    * Configures and initializes the animation/drawing behaviour
    */
  function GameOfLife(tag_id, params) {   
    let self = this;

    let dom = this.dom = {};
  
    // remember identification tag in the dom
    let tag = this.dom.tag_id = tag_id;
  
    /* keep reference to container in the object props*/
    let wrp = this.dom.gameOfLifeWrapper = document.querySelector('#'+tag_id);

    let gridWorld; // = this.gridWorld - set later. 
    // The object that contains the actual game of life data, performing turn after turn.


    // wrapper for the grid display and its controls
    let gameWrp; // = this.dom.gameWrapper - set later
  
    // there is one display element per GameOfLife object.
    // grid references a GridWorld object, which itself knows the display div. 
    let gridDisplayDiv; // = this.dom.gridDisplayDiv - set later

    // the buttons for controlling the game
    let controls = this.dom.controls = {}; // - set later (buttons)
  
    // animation/drawing/behaviour configuration
    let conf; // = this.config - set later
  
    // State-related props
    let st; // = this.state - set later
  
    // functionality
    let fn = this.fn  = {};
  
  
    // convenience vars
    let docElement;
  
    /* - - - ---  -- -- -- -- -- -- --- - - -  -   */
    /* - - - -- FUNCTION DEFINITIONS -- - - -  -   */
    /* - - - ---  -- -- -- -- -- -- --- - - -  -   */
  
    /* ====== Basic gameOfLife configuration: setting defaults ====== */
    fn._configInit = function(params) {
      if (params) {
        conf = self.conf = params.config;
      } else {
        conf = self.conf = {
          autoStart: true,
          tickTime: 30, // // ms, less than 17 (60fps) doesn't make sense
          generateSome: true,
          snakeMode: true,
          gridSize: 40 // CELLS WILL LIVE IN A SQUARE GRID of this size
        };
      }
    }
  
    // ====================================== //
    /* =========== Initialization =========== */
    // ====================================== //
  
    // ---------- Initialize object state when booting ------- //
    fn._stateInit = function() {
      st = self.state = {
        playing: false, // flag: system halted or running. set only within fn._go() and fn._hold()
        playTimeout: null
      }
    }
    /** Starting the thing */
    fn._initAll = function() {
      console.log('--- INIT ---');
      fn._gridInit(true);
      fn._eventsListeners(true);

      // state init
      fn._stateInit();

      // initialize convenience vars
      docElement = document.documentElement;      
    }
    // Prepare grid-display
    fn._gridInit = function(booting) {
      // create overall game wrapper
      let gWrapper = document.createElement('div');
      gWrapper.className = 'game-wrapper-game-of-life';
      wrp.appendChild(gWrapper);
      gameWrp = self.dom.gameWrapper = gWrapper;

      // Create and init controls
      let buttonNext = document.createElement('button');
      buttonNext.id = "next-game-of-life";
      buttonNext.innerHTML = 'Next Gen';
      gameWrp.appendChild(buttonNext);
      dom.controls.buttonNext = buttonNext;

      let buttonAutoplay = document.createElement('button');
      buttonAutoplay.id = "autoplay-game-of-life";
      buttonAutoplay.innerHTML = 'Play';
      gameWrp.appendChild(buttonAutoplay);
      dom.controls.buttonAutoplay = buttonAutoplay;

      let buttonClear = document.createElement('button');
      buttonClear.id = "clear-game-of-life";
      buttonClear.innerHTML = 'Clear';
      gameWrp.appendChild(buttonClear);  
      dom.controls.buttonClear = buttonClear;

      let buttonPopulate = document.createElement('button');
      buttonPopulate.id = "populate-game-of-life";
      buttonPopulate.innerHTML = 'Populate';
      gameWrp.appendChild(buttonPopulate);
      dom.controls.buttonPopulate = buttonPopulate;

      let ruler = document.createElement('hr');
      ruler.style = "width: 25%; margin: 20px auto;";
      gameWrp.appendChild(ruler);

      // -- Create and Init the grid

      // create gridworld object
      gridWorld = self.gridWorld = new GridWorld(conf.gridSize, conf.generateSome);

      /* a container for the grid */
      let gridDisplay = self.gridWorld.display.div;
      gridDisplay.className = 'grid-game-of-life'; // for css to work 
      /* insert container into the main wrapper*/
      gameWrp.appendChild(gridDisplay);
      dom.gridDisplayDiv = gridDisplay;  
    }
   
    // Set up event listeners. When not booting, only the ones pertaining to canvas object are changed
    fn._eventsListeners = function(booting) {
      dom.controls.buttonNext.addEventListener('click', () => gridWorld.turn());
      dom.controls.buttonAutoplay.addEventListener('click', fn._autoplay);
      dom.controls.buttonPopulate.addEventListener('click', fn._populate);    
      dom.controls.buttonClear.addEventListener('click', fn._clear);
      dom.gridDisplayDiv.addEventListener('click', fn._userClickedGrid);
    }    
   
    // ====================================== //
    // === Event handling and game logic ==== //
    // ====================================== //
  
   
    fn._autoplay = function() {
      if (!st.playing) {    
        fn._go();
        dom.controls.buttonPopulate.disabled = true;
        dom.controls.buttonClear.disabled = true;
        dom.controls.buttonNext.disabled = true;
        dom.controls.buttonAutoplay.innerHTML = 'Stop';
      } else {
        clearTimeout(st.playTimeout);
        st.playing = false;
        dom.controls.buttonPopulate.disabled = false;
        dom.controls.buttonClear.disabled = false;
        dom.controls.buttonNext.disabled = false;
        dom.controls.buttonAutoplay.innerHTML = 'Play';        
      }
    }
    
    fn._go = function() {
      gridWorld.turn();
      st.playing = true;
      st.playTimeout = setTimeout(fn._go, conf.tickTime);
    }
    
    fn._populate = function() {  
      gridWorld.populate();      
      gridWorld.display.updateCells();
    }
    
    fn._clear = function() {  
      gridWorld.liveCells = [];
      gridWorld.display.updateCells();
    }
    // hanlder for button clicks on grid   
    fn._userClickedGrid = function(e) {  
      if (!e.target.getAttribute('data-position-row')) {
        return;
      }
      let row = Number(e.target.getAttribute('data-position-row'));
      let col = Number(e.target.getAttribute('data-position-col'));
    
      // update data model
      let newState = gridWorld.flipValue(row,col);
      // update UI
      if (newState === 1) {
        e.target.classList.add('live');
      } else {
        e.target.classList.remove('live');
      }
    }
    
 
    // =========================================== //
    // ===--- GridWorld and aux structures ----=== //
    // =========================================== //
 
    // constructor for GridWorld objects
    function GridWorld(size, populate) {
      this.size = size;
      this.liveCells = createCells(size, populate); // keeps track of which cells are alive (no need for a Grid Object)
      this.nextStates = []; // which cells will be alive in next turn 
      this.display = new GridDisplay(this); // Dom element containing all displayed dom elements       
    }
    /** @return array telling which cells in the grid should be live */
    function createCells(n, populate) {  
      cells = [];
      if (populate) {
        for (let i=0; i<n; i++) {    
          for (let j=0; j<n; j++) {
            if(Math.random() < 0.3) {
              cells[i*n + j] = 1;
            }              
          }          
        }  
      } // ELSE - cells remains empty, full of undefined values - no cell is alive
      return cells;
    }
    // move one turn (generation) 
    GridWorld.prototype.turn = function() {     
      // compute nextStates. create new object for that.
      this.nextStates = {};
      for (let i=0; i<conf.gridSize; i++) { 
        for (let j=0; j<conf.gridSize; j++) { 
          let index = i*conf.gridSize + j;      
          let cellAlive = this.liveCells[index];
          let guysAround = neighbours(i,j,this);
    
          if ((cellAlive === 1) && (guysAround === 2 || guysAround === 3)  ||
              !(cellAlive === 1) && (guysAround === 3)                         ) {          
              this.nextStates[index] = 1;        
          }       
        }
      }   
      // apply nextStates to gridWorld
      this.liveCells = this.nextStates;  
      // show in display
      this.display.updateCells(); 
        
      // return number of neighbours of the cell at i, j, which are checked
      function neighbours(i,j,self) {  
        let neighs = []; // collect all neighbours  
        let neighsX = [i-1, i-1, i, i+1, i+1, i+1, i, i-1];  
        let neighsY = [j, j-1, j-1, j-1, j, j+1, j+1, j+1];
        for (let k=0; k<8; k++) {                             
          if (conf.snakeMode) { // count neighbours from the other side of the grid
            // SNAKE MODE
            if (neighsX[k]===-1) {
              neighsX[k]=self.size-1;
            }
            if (neighsY[k]===-1) {
              neighsY[k]=self.size-1;
            }
            if (neighsX[k]===self.size) {
              neighsX[k]=0;
            }
            if (neighsY[k]===self.size) {
              neighsY[k]=0;
            }
            neighs.push(neighsX[k]*self.size+neighsY[k]);       
          } else if (neighsX[k]>=0 && neighsX[k]<GRID_SIZE &&
                     neighsY[k]>=0 && neighsY[k]<GRID_SIZE) {
              neighs.push(neighsX[k]*self.size+neighsY[k]);
          }
        }     
        // count the live cells
        let live = 0;
        neighs.forEach(val => {
          if (self.liveCells[val] === 1) {       
            live++;
          }
        });
        return live;
      }
    }
    GridWorld.prototype.flipValue = function(row,col) {    
      let pos = row*this.size + col;
      val = this.liveCells[pos];    
      return this.liveCells[pos] = (val === 1) ? undefined : 1;
    }
    GridWorld.prototype.populate = function() {
      this.liveCells = createCells(this.size, true);
    }
    
    /** Constructor for the display. returns object with properties:
     * - div: the DOM element to be used for display
     * - leavesInRows: array of arrays of dom elements representing cells */
    function GridDisplay(gridWorld) {  
      this.gridWorld = gridWorld;
      // DOM element to be rendered
      this.div = document.createElement('div');
      // keeping track of leaf elements in a separate structure (rows)
      this.leavesInRows = [];
    
      // Create and add elements to div, initializing
      for (let i=0; i<gridWorld.size; i++) {
        let newRowDiv = document.createElement('div');    
        newRowDiv.classList.add('gol-row');    
        this.div.appendChild(newRowDiv);
    
        // keep track internally
        let newRow = [];
        this.leavesInRows[i] = newRow;
    
        for (let j=0; j<gridWorld.size; j++) {
          let newCell = document.createElement('div');
          newCell.classList.add('gol-cell');
          newCell.setAttribute('data-position-row', i.toString());
          newCell.setAttribute('data-position-col', j.toString());
          newRowDiv.appendChild(newCell);
          if (gridWorld.liveCells[i*gridWorld.size + j] === 1) {
            newCell.classList.add('live');
          }
          // keep track internally
          newRow[j] = newCell;
        }
      }      
    }    
    GridDisplay.prototype.updateCells = function() {  
      for (let i=0; i<this.gridWorld.size; i++) {
        for (let j=0; j<this.gridWorld.size; j++) {
          let cell = this.leavesInRows[i][j];         
          if (this.gridWorld.liveCells[i*this.gridWorld.size + j] === 1) {
            cell.classList.add('live');
          } else {
            cell.classList.remove('live');
          }
        }
      }  
    }
   
   
    fn._kill = function() {
      window.clearTimeout(st.playTimeout);      
      wrp.remove();
    }
  
    // --------=====  END FUNCTIONS ====--------- //
  
  
  
    // =====-------------------------------------====  //
    // ========------ START THE THING ------=========  //
    // =====-------------------------------------====  //
  
    // configure
    fn._configInit(params);
    // booting
    fn._initAll(true);        
 }
 
  // ========================================== //
  // ========== Interface to GLOBAL =========== //
  // ========================================== //
      
  GameOfLife.prototype.kill = function() {
    this.fn._kill();
  }
  GameOfLife.prototype.hold = function() {
    if (this.state.playing) {
      this.fn._autoplay();
    }    
  }
  GameOfLife.prototype.go = function() {
    // not possible from outside
  }
  GameOfLife.prototype.getWrapper = function() {
    return this.dom.gameOfLifeWrapper;
  }
 
 })(window);
 
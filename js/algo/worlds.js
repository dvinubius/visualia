(function(exports) {
			
	// import Vectors
	var Vector = grids.Vector;
	
	// -------- import directions and directionnames	
	var directions = grids.directions;
	var directionNames = grids.directionNames;
	
	
	// -------- VIEW object, used by worlds to let critters see their
	// 																environment in a grid-----------

	function View(world, vector) {
		this.world = world;
		this.vector = vector;
	}
	
	// ---- View INTERFACE
	
	View.prototype.look = function(dir) {
		var target = this.vector.plus(directions[dir]);				
		if (this.world.grid.isInside(target))
			return charFromElement(this.world.grid.get(target));
		else
			return "#";
	};
	View.prototype.findAll = function(ch) {		
		var found = [];
		for (var dir in directions)
			if (this.look(dir) == ch)
				found.push(dir);
		return found;
	};
	View.prototype.find = function(ch) {
		var found = this.findAll(ch);
		if (found.length == 0) return null;
		return randomElement(found);
	};

  // -----------------------------------------------------
	
	
	
	
	
	/* -------- Constructing a World ------------ */
	
	function World(map, legend) {
		var grid = grids.createGrid(map[0].length, map.length);
		this.grid = grid;
		this.legend = legend;
		this.map = map;

		map.forEach(function(line, y) {
			for (var x = 0; x < line.length; x++)
				grid.set(new Vector(x, y),
								 elementFromChar(legend, line[x]));
		});
	}
	
	/*  ---------- World INTERFACE --------------- */	

	World.prototype.turn = function() {
		var acted = [];
				
		this.grid.forEach(function(critter, vector) {
			if (critter.act && acted.indexOf(critter) == -1) {
				acted.push(critter);								
				letAct.call(this, critter, vector);
			}
		}, this);			
	};
	
	World.prototype.toString = function(includeColor) {
		var output = "";
		for (var y = 0; y < this.grid.height; y++) {
			for (var x = 0; x < this.grid.width; x++) {
				var element = this.grid.get(new Vector(x, y));
				let colorPre = "", colorPost = "";
				if (includeColor) {
					colorPre = '<span style="color:'+colorForElement(element)+';">';
					colorPost = '</span>';
				}
				output += colorPre+charFromElement(element)+colorPost;
			}
			output += "\n";
		}
		return output;
	};

	
	// ----------- Life Like World Object --------------
	
	// identical to World in constructor
	function LifeLikeWorld(map, legend) {
		World.call(this, map, legend);
	}		
	// inherits World INTERFACE
	LifeLikeWorld.prototype = Object.create(World.prototype);
	
	LifeLikeWorld.prototype.duplicate = function() {
		return new LifeLikeWorld(this.map, this.legend);
	}
	
	// logic of letAct differs depending on type: World or LifeLikeWorld
	// always to be invoked with this as a world object
	function letAct(critter, vector) {		
	
		if (this instanceof LifeLikeWorld) { // more realistic world: energy consumption modeled (see actions implementations)			
			var action = critter.act(new View(this, vector));
			var handled = action &&
				action.type in actionTypes &&
				actionTypes[action.type].call(this, critter,
																			vector, action);
			if (!handled) {
				critter.energy -= 0.2;
				if (critter.energy <= 0)
					this.grid.set(vector, null);
			}
			return;
		}
		
		if (this instanceof World) { // simplified world: no energy is consumed over time			
			var action = critter.act(new View(this, vector));
			if (action && action.type == "move") {
				var dest = checkDestination.call(this, action, vector);
				if (dest && this.grid.get(dest) == null) {
					this.grid.set(vector, null);
					this.grid.set(dest, critter);
				}
			}
			return;
		}		
	}	
	
	/* --- internal for LifeLikeWorld: actions ----- */		
		
	var actionTypes = Object.create(null);
		
	// ------ to be invoked with context the world object
	function checkDestination(action, vector) {
		if (directions.hasOwnProperty(action.direction)) {
			var dest = vector.plus(directions[action.direction]);
			if (this.grid.isInside(dest))
				return dest;
		}
	};
	
	actionTypes.grow = function(critter) {
		critter.energy += 0.5;
		return true;
	};

	actionTypes.move = function(critter, vector, action) {
		var dest = checkDestination.call(this, action, vector);
		if (dest == null ||
				critter.energy <= 1 ||
				this.grid.get(dest) != null)
			return false;
		critter.energy -= 1;
		this.grid.set(vector, null);
		this.grid.set(dest, critter);
		return true;
	};

	actionTypes.eat = function(critter, vector, action) {
		var dest = checkDestination.call(this, action, vector);
		var atDest = dest != null && this.grid.get(dest);
		if (!atDest || atDest.energy == null)
			return false;
		critter.energy += atDest.energy;
		this.grid.set(dest, null);
		return true;
	};

	actionTypes.reproduce = function(critter, vector, action) {
		var baby = elementFromChar(this.legend,
															 critter.originChar);
		var dest = checkDestination.call(this, action, vector);
		if (dest == null ||
				critter.energy <= 2 * baby.energy ||
				this.grid.get(dest) != null)
			return false;
		critter.energy -= 2 * baby.energy;
		this.grid.set(dest, baby);
		return true;
	};
	
	
	/* internal HELPERS */
	function elementFromChar(legend, ch) {
		if (ch == " ")
			return null;
		var element = new (legend[ch].what)();
		element.originChar = ch;
		element.color = legend[ch].color;
		return element;
	}
	function charFromElement(element) {
		if (element == null)
			return " ";
		else
			return element.originChar;
	}
	function colorForElement(element) {
		if (element == null)
			return " ";
		else
			return element.color;
	}
	function randomElement(array) {
		return array[Math.floor(Math.random() * array.length)];
	}


		

	// INTERFACE
	exports.createWorld = function(map, legend) {
		return new World(map, legend);
	};
	exports.createLifeLikeWorld = function(map, legend) {		
		return new LifeLikeWorld(map, legend);
	};
	
	
	
	
})(this.worlds = {});
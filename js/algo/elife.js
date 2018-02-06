(function (exports) {
	// import directions and directionNames
	var directions = grids.directions;
	var directionNames = grids.directionNames;
	
	
	function Wall() {}

	function BouncingCritter() {
		this.direction = randomElement(directionNames);
	};

	BouncingCritter.prototype.act = function(view) {
		if (view.look(this.direction) != " ")
			this.direction = view.find(" ") || "s";
		return {type: "move", direction: this.direction};
	};
	
	
	
	function WallFollower() {
		this.dir = "s";
	}

	WallFollower.prototype.act = function(view) {
		var start = this.dir;
		if (view.look(dirPlus(this.dir, -3)) != " ")
			start = this.dir = dirPlus(this.dir, -2);
		while (view.look(this.dir) != " ") {
			this.dir = dirPlus(this.dir, 1);
			if (this.dir == start) break;
		}
		return {type: "move", direction: this.dir};
	};
	
	
	function Plant() {
		this.energy = 3 + Math.random() * 4;
	}
	Plant.prototype.act = function(view) {		
		if (this.energy > 15) {
			var space = view.find(" ");
			if (space)				
				return {type: "reproduce", direction: space};
		}
		if (this.energy < 20)			
			return {type: "grow"};		
	};


	// finds a direction as close as possible to dirOfInterest, looking from view
	function closeTo(view, dirOfInterest) {		
		var newDir;
		var tryDirections = [1, -1, 2, -2];
		for (var i=0; i<tryDirections.length; i++) {
			//check new direction
			newDir = dirPlus(dirOfInterest, tryDirections[i]);
			if (view.look(newDir) == ' ') //free
				return newDir;
		}
		return null;
	}
	
	
	
	/* AUTHOR's SOLUTIONS */
	function SmartPlantEaterA() {
		this.energy = 30;
		this.direction = "e";
	}
	SmartPlantEaterA.prototype.act = function(view) {
		var space = view.find(" ");
		if (this.energy > 120 && space)
			return {type: "reproduce", direction: space};
		var plants = view.findAll("*");
		if (plants.length > 1)
			return {type: "eat", direction: randomElement(plants)};
		if (view.look(this.direction) != " " && space)
			this.direction = space;
		return {type: "move", direction: this.direction};
	};

	function TigerA() {
			this.energy = 100;
			this.direction = "w";
			// Used to track the amount of prey seen per turn in the last six turns
			this.preySeen = [];
	}
	TigerA.prototype.act = function(view) {
		// Average number of prey seen per turn
		var seenPerTurn = this.preySeen.reduce(function(a, b) {
			return a + b;
		}, 0) / this.preySeen.length;
		var prey = view.findAll("o");
		this.preySeen.push(prey.length);
		// Drop the first element from the array when it is longer than 6
		if (this.preySeen.length > 6)
			this.preySeen.shift();

		// Only eat if the predator saw more than ¼ prey animal per turn
		if (prey.length && seenPerTurn > 0.25 && this.energy < 340)
			return {type: "eat", direction: randomElement(prey)};

		var space = view.find(" ");
		if (this.energy > 400 && space)
			return {type: "reproduce", direction: space};
		if (view.look(this.direction) != " " && space)
			this.direction = space;
		return {type: "move", direction: this.direction};
	};


	// adds rotation steps to a direction.
	function dirPlus(dir, n) {
		var index = directionNames.indexOf(dir);
		return directionNames[(index + n + 8) % 8];
	}
	// choose something random from an array
	function randomElement(array) {
		return array[Math.floor(Math.random() * array.length)];
	}

	

	/*  AUTHOR'S EXAMPLE */
	
	exports.valleyEx2Author = worlds.createLifeLikeWorld(
		["####################################################",
		 "##**                oo            *            **###",
		 "#                 ####         ****              ###",
		 "#   *  @  ##                 ########       oo    ##",
		 "#   *    ##          o                 ****       *#",
		 "#         *                        ####  ####     *#",
		 "#      ##***  *         ****                     **#",
		 "#* **  #  *  ***      #########                  **#",
		 "#* **  #      *               #   *              **#",
		 "#     ##              #   o   #  ***          ######",
		 "#*            @       #       #   *        o  #    #",
		 "#*                           ##                 ** #",
		 "#*                    #  ######                  * #",
		 "###          ****   o      ***                  ** #",
		 "#       o                        @         o       #",
		 "#   *     ##  ##  ##  ##               ###      *  #",
		 "#   **         #              *       #####  o     #",
		 "##  **  o   o  #  #    ***  ***        ###      ** #",
		 "###               #   *****                     ***#",
		 "##   *         #              *         ##         #",
		 "#   **          ** *                    **#  o     #",
		 "##****          *       ## **##                    #",
		 "####################################################"],
		{"#": {what: Wall, color: "hsl(280, 3%, 19%)"},
		 "@": {what: TigerA, color: "rgba(170,40,0,1)"},
		 "o": {what: SmartPlantEaterA, color: "rgba(20,100,0,1)"}, // from previous exercise
		 "*": {what: Plant, color: "rgb(0,130,0)"}
		}
	);
})(this.elife = {});


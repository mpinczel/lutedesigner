/*
	<Lutedesigner - A parametric design aid for lutes>
    Copyright (C) 2019  Lauri Niskanen

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

// Make option for forms available if this file is included
try {features_init.push(function(){
	// var meta = getelid("metaselector");
	var output = getelid("drawing");
	
	var label = creel("label");
	label.innerHTML = "Ballnose Endmill size:";
	var s = creel("input","ballnose_endmill_size","",["type","number","value","39.5"]);
	addel(label, s);
	var inp = creel("textarea","output_textbox","",["rows","1","cols","10"]);
	addel(label, inp);
	addel(output, label);
	
	var label = creel("label");
	var bu = creel("button","","",["onclick","gcoder.neckblock_gcode();"]);
	
	bu.innerHTML = "Neckblock Gcode";
	addel(output, label);
	addel(label, bu);
	
	
	
	// Create Gcode class object
	gcoder = new Gcode();
});} catch(e) {console.log("lutedesigner-gcode.js loaded without lutedesigner environment.");}




class Gcode {
	constructor(){
		// Initialized as global gcoder by features_init
		
		this.gprecision = 3; // Output Coordinate decimal places
		this.fprecision = 1; // Output Feedrate decimal places
		this.ball_dia = 6.0; // 6mm ballnose
		this.default_cutrate = 15.0; // mm/s
		this.plunge_feed = 5.0; // Z feedrate when expecting material
		
		// Parser things
		this.coordinates = "XYZABCIJK";
		this.command_letters = "XYZABCIJKSF";
		this.letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
		this.numbers = "-.0123456789";
		// this.program = [];
	}
	
	////////////////////////////////////////////////////////
	// Parser
	parse(text){ // convert gcode file into internal representation (this.program)
		// Tiered list of paths(subprograms) -> lines
		if (text===undefined) return;
		var lines = text.split("\n");
		this.program = [[]];
		for (var i in lines){
			var line = this.understand(lines[i]);
			line.linenumber = parseInt(i);
			// if line starts with "(No." , start new path
			if (lines[i].startsWith("(No.")){
				this.program.push([]);
			}
			this.program[this.program.length-1].push(line);
		}
		
		console.log(this.program);
	}
	
	understand(line){ // Find commands, coordinates, and comments in line of gcode
		// Numbers are stored as text and should be parseFloated when used
		var curL = "";
		var curN = "";
		var comment = "";
		var out = {};
		var i = 0;
		while (i < line.length){
			if (this.letters.indexOf(line[i]) >=0){ // Letter, look for numbers now
				curL = line[i];
				i++;
				while (this.numbers.indexOf(line[i]) >=0 && i < line.length ){
					curN += line[i];
					i++;	
				}
				if (this.command_letters.indexOf(curL) >=0){
					out[curL] = curN;
				} else { // command letter
					out.command = curL+curN;
				}
				curN="";
				
			} else if (line[i] == "("){ // the rest is comment
				out.comment = line.slice(i, line.length);
				break;
			}
			i++;
		}
		out.text = line;
		// console.log(out);
		return out;
	}
	
	split_command(line){ // make many shorter commands out of a long one
		// return an array of lines
		var ar = [];
		if (line.command=="G01"){ // Straight cut
			
		} else if (line.command=="G02"){ // arc clockwise
			
		} else if (line.command=="G03"){ // arc counterclocwise
			
		}
		return ar;
	}
	
	change_height(line, rule){ // Alter path Z coordinates according to some rule
		
	}
	
	textify_line(line){ // Convert to text from internal representation
		var ignore_empty = true; // removes empty lines
		// console.log(line);
		var out = "";
		if (line.command) out += line.command;
		for (var L of this.command_letters){
			if (line[L]) out += " "+L+line[L];
		}
		if (line.comment) out += line.comment;
		return out;
	}
	
	textify_program(prog){// Convert to array of strings from internal representation
		var prog = prog || this.program;
		var output = [];
		console.log(prog);
		for (var i=0; i < prog.length; i++){
			for (var j =0; j < prog[i].length; j++){
				output.push(this.textify_line(prog[i][j]));
			}
		}
		// console.log("Output program", output);
		return output;
	}
	
	////////////////////////////////////////////////////////
	// output commands
	
	neckblock_gcode_(tool_dia){
		// Write a gcode program for machining the neckblock with a ball nose endmill
		// The neckblock is positioned with its inside face laying on the floor, neckjoint up, the endmill will cut the table on the last passes
		// TODO: Maybe do a curved top surface
		var ball_dia = parseFloat(getelid("ballnose_endmill_size").value) || this.ball_dia;
		var gcode = ["(Gcode created with Lutedesigner)"];
		gcode.push(`(Endmill: ${ball_dia.toFixed(1)} mm ballnose)`);
		
		// Sample neckblock shape at every layer
		// Do point if below top and above bottom points
		// lute3d.neckblock.jointpoints, bottompoints, lute3d.inribpaths.threedee
		// threedee is per ribjoint, not per layer...
		var points = lute3d.inribpaths.threedee;
		// bottompoints.y becomes z=0 (using table top as zero rather than stock surface)
		var bottompoints = lute3d.neckblock.bottompoints;
		var jointpoints = lute3d.neckblock.jointpoints;
		var bottom = bottompoints[0].y;
		var zerop = new Point(0,0);
		var njstart = cps.neckjoint_no_origin.y - bottom; // Start of neckjoint at y=0
		var nangle = halfpi - cps.neckjoint_angle; // Neckjoint angle

		var layers = [[]]; // Store rib joint points here per y coordinate, preserve which ribjoint point belongs to. x=x, y=-z, z=-y
		
		// Find out how many layers are needed to store all points between neckjoint and bottom
		for (var j=0; j < points[0].length; j++){
			if(points[0][j].y > bottom /*  && points[0][j].y <= jointpoints[0].y */ ){
				// All points from bottom to tip
				layers.push([]);
			}
		}
		// Store bottompoints as first layer. These have already been calculated by neckjoint_3D()
		for (var j=0; j < bottompoints.length; j++){
			var p = bottompoints[j];
			layers[0][j] = new Point(p.x, p.z, p.y-bottom);
		}
		
		console.log("Layers", layers.length);
		// Arrange neckblock shape into layers for easier use
		var neckblockshape = [];
		for(var i=0; i < points.length; i++){ // ribjoint number
			for(var j=0; j < points[i].length; j++){ // point along ribjoint
				if (points[i][j].y > bottom /* && points[i][j].y < jointpoints[i].y */){
					// Include this point in neckblock shape
					// Put in layer y, jointpoint i,
					// layers[]
					// layers[i][j]
					// put into first layer with free slot on this rib joint
					var lr = 0;
					while(layers[lr+1] && layers[lr][i] !== undefined){
						lr++;
					}
					// lr--;
					var p = points[i][j];
					layers[lr][i] = new Point(p.x, p.z, p.y-bottom);
				}
			}
		}
		console.log("wassup",jointpoints[0].y,bottom );
		var workpiece_height = jointpoints[0].y-bottom; // Z
		var workpiece_width = 2 * bottompoints[bottompoints.length-1].x; // X
		var workpiece_length = bottompoints[0].z; // Y
		// Store jointpoints on top of everything else
		/* for (var j=0; j < jointpoints.length; j++){
			var lr = 0;
			while(layers[lr][j] !== undefined){
				lr++;
			}
			var p = jointpoints[j];
			layers[lr][j] = new Point(p.x, p.z, p.y-bottom);
		} */
		var angles = []; // Rib joint angles
		console.log("layers before culling:", layers);
		// Remove layers where [i][0].z is above neckjoint
		var culled = [];
		for (var i=0; i<layers.length; i++){
			if (layers[i].length){
				var p = layers[i][0];
				// console.log(i, p.z, njstart + p.y * Math.tan(nangle));
				if (p.z <= njstart + p.y * Math.tan(nangle)){
					culled.push(layers[i]);
				}
			}
		}
		layers = culled;
		
		// Now remove points to create neckjoint
		var culled = [];
		for (var i=0; i<layers.length; i++){
			var lr = [];
			var terminate = false;
			for (var j=0; j<layers[i].length; j++){
				var p = layers[i][j];
				
				// Starting from center rib, store if below neckjoint, else discard
				if (p.z <= njstart + p.y * Math.tan(nangle)){
					lr.push(p);
				} else if (terminate){
					lr.push(null);
				} else {
					// Calculate intersection with neckjoint
					var y = (p.z-njstart)*Math.tan(nangle);
					lr.push(new Point(line_x_from_y(getlast(lr),p, y).x,
										y,
										p.z));
					// break; // discard rest
					terminate = true;
				}
			}
			culled.push(lr);
		}
		layers = culled;
		
		// Mirror points on the other side
		for (var i=0; i<layers.length; i++){
			var reversed = [];
			for (var j=0; j<layers[i].length; j++){
				if (layers[i][j]){
					var p = layers[i][j];
					reversed.push(new Point(-p.x, p.y, p.z));
				} else {
					reversed.push(null);
				}
				
			}
			reversed.reverse();
			layers[i] = reversed.concat(layers[i]);
		}
		// TODO: Find and check where it is decided where the neckblock goes
		// TODO: Draw ribline shapes and ball endmills somewhere to compare
		console.log("layers after:",layers);
		// TODO: Maybe check that every point on every layer has same z coordinate
		// Debug draw layers on NECKBLOCKORIGIN
		var bsmove = cps.neckblocky - RIBTHICKNESS - jointpoints[jointpoints.length-1].y;
		var crosslayer = getelid("crosslayer");
		var debugg = makegroup(crosslayer, "neckblock-debug");
		var angles = []; // For later use in milling
		for (var i=0; i<layers.length; i++){
			var lshape = [];
			for (var j=0; j<layers[i].length; j++){
				var p = layers[i][j];
				if (p)lshape.push(NECKBLOCKORIGIN.move(p.x, p.y-bsmove));
				
			}
			/* if (lshape.length > 1 ){
				// var h = parseInt(255 * (i / (layers.length-1)));
				var h = parseInt(255 * (layers[i][0].z / (layers[layers.length-1][0].z)));
				var g = ("0"+(Number(h).toString(16))).slice(-2).toUpperCase();
				var b = ("0"+(Number(255-h).toString(16))).slice(-2).toUpperCase();
				var color = "#00"+g+b;
				// var styl = makestyle(GREENSTYLE, ["stroke",color]);
				var styl = "stroke:"+color+";stroke-width:0.2; fill:none;";
				// drawshape(debugg,lshape,styl,"neckblock-layer-"+i);
			} */
		}
		// Neckblock points have now been neatly arranged in layers
		// TODO: interpolate (or calculate from lute model) extra layers if they are too far apart
		// Start parsing layers to create gcode
		console.log("angles",angles);
		
		var radius = ball_dia/2.0; // Cutter radius
		var toolpath = [];
		
		// Do a positioning move above workpiece
		gcode.push("(Stock size: W"+workpiece_width.toFixed(1)+"mm L"+workpiece_length.toFixed(1)+"mm H"+workpiece_height.toFixed(1)+"mm)");
		gcode.push("(Neckjoint angle: "+(90-(cps.neckjoint_angle/radtodeg)).toFixed(1) +" degrees");
		gcode.push("M3");
		
		// Cut neckjoint
		// ball_dia
		var rshape = [];
		var lshape = [];
		for (var i=0; i < jointpoints.length; i++){
			var p = jointpoints[i];
			rshape.push(new Point(p.x, p.z, p.y-bottom));
			lshape.push(new Point(-p.x, p.z, p.y-bottom));
			
		}
		lshape.reverse();
		rshape = rshape.concat(lshape);
		gcode.push("(No.1 Neckjoint)");
		// gcode.push(this.machine_bounded_plane(rshape, 0, nangle, 0, new Point(0,0,njstart), 2, 5 ));
		
		
		// Prepare for cutting all the layers
		gcode.push("G0 X0 Y-3 Z"+(workpiece_height+10.0).toFixed(this.gprecision));
		var roughtoolpath = ["(Rough pass)"];
		var finetoolpath = ["(Final pass)"];
		var roughcut = 4.0; // Depth to cut on rough pass
		var roughcounter = workpiece_height; // Keep track of rough passes
		var firstrough = true;
		
		// Debug shapes, draw into page later
		var blockshapes = []; // One for each ribline
		var ballposs = []; // One array for each ribline
		for (var i =0; i<layers[0].length ;i++){
			blockshapes.push([]);
			ballposs.push([]);
		}
		
		// Find plane of neckjoint shifted by tool diameter
		// njstart nangle
		// nangle is the angle to be cut to the neck, not really the neckjoint angle
		// console.log("neckjoint",njstart, nangle);
		var njz = njstart; // + radius / Math.sin(nangle);
		console.log("neckjoint",njstart, nangle, njz);
		// var njy = Math.cos(nangle) * radius;
		// If tool y,z is above radius/Math.tan(nangle), tool is above neckjoint
		
		// Calculate cuts
		for (var i=layers.length-1; i>0 ; i--){ // top down for each layer
			var tlayer = [];
			var cen = parseInt(layers[i].length/2)
			var layerh = layers[i][cen].z;
			// TODO: Rough cut. Do before final cut, so gather into two separate toolpaths but calculate here. Fit full tool widths to rough depth
			finetoolpath.push("(No. level "+i+")");
			if (layerh < roughcounter - roughcut){

				roughtoolpath.push("(Rough cut level "+layerh.toFixed(1)+" mm)");
				
				// Do as many rough cuts as fit radially. They need to be organized here in full arcs
				// Number of arcs on this layer
				// TODO: This produces too few rough passes:
				var numbercuts = Math.abs(/* parseInt */((layers[0][cen].x - layers[i][cen].x) / ball_dia));
				console.log("Doing rough cut", layerh, "cuts", numbercuts);
				
				for (var c=1; c<=numbercuts; c++){ 
					for (var j=0; j<layers[i].length; j++){ // for each point
						// Cut around shape at ball_dia intervals
						if (layers[i][j] === null) break;
						var thisp = layers[i][j];
						var lowestp = layers[0][j];
						// Find angle towards center at each joint
						var angle = getangle(thisp,zerop);
						var thispolar = flatlinelength(thisp, zerop);
						var lpolar = flatlinelength(lowestp, zerop);
						var incr = (lpolar-thispolar-radius)/numbercuts;
						if (j==0) console.log("incr",i,c,j,lpolar-thispolar, incr);
						var toolpos = thisp.movedist(radius+incr*c, angle);
						// tlayer.push(toolpos);
						
						if (j==0){
							if (firstrough){
								// Position endmill on top of first move
								roughtoolpath.push(this.gcode_move(toolpos.move(0,0,10.0)));
								roughtoolpath.push(this.gcode_straight_cut(toolpos));
								firstrough = false;
							} else {
								// Normally do a fast move along bottom and arc to arrive at start of cut
								var offset = new Point(0,ball_dia);
								roughtoolpath.push(this.gcode_move(toolpos.move(ball_dia,-ball_dia)));
								roughtoolpath.push(this.gcode_G2(toolpos, offset));
								// 
							}
						} else {
							// On non-first moves do normal cut
							roughtoolpath.push(this.gcode_straight_cut(toolpos));
						}
						
						
						
						if (j==layers[i].length-1){
							// On every layer's last point, do an arc around corner
							var offset = new Point(-ball_dia,0);
							roughtoolpath.push(this.gcode_G2(toolpos.move(-ball_dia,-ball_dia),offset));
						}
					}
				}
				roughcounter -= roughcut;
				
			}
			
			
			// Do fine surfacing
			var lowerp, lowerpolar, polardif, vangle, hdif, prevtoolpos, neckz;
			
			for (var j=0; j<layers[i].length; j++){ // for each point

				// Milling the rib side of the block
				// Calculate offset by finding intersecting jointpoints below current
				// Find vertical tangent from this and point below 
				if (layers[i][j] === null) break;
				var thisp = layers[i][j];
				// if (thisp.z > workpiece_height) workpiece_height = thisp.z
				var thispolar = flatlinelength(thisp, zerop);
				
				
				if (i>0) {
					lowerp = layers[i-1][j];
					lowerpolar = flatlinelength(lowerp, zerop);
					polardif = lowerpolar-thispolar;
					hdif = Math.abs(thisp.z - lowerp.z);
					vangle = Math.atan((polardif)/(hdif));// angle between z axis, this and lower point vertically. 
				} else {
					var higherp = layers[i+1][j];
					var higherpolar = flatlinelength(higherp, zerop);
					polardif = Math.abs(higherpolar-thispolar);
					hdif = Math.abs(thisp.z - higherp.z);
					vangle = Math.atan((polardif)/(hdif));// angle between z axis, this and lower point vertically. 
				}
				
				// Find angle towards center at each joint
				// TODO: This is not exactly correct but very close
				var angle = getangle(thisp,zerop);
				
				var toolcl = radius * Math.cos(vangle); // Ball endmill center offset in polar form
				var toolch =  radius * Math.sin(vangle); // Endmill vertical offset
				// Convert tool position from polar form to xy
				var toolpos = thisp.movedist(toolcl, angle);//.move(0,0,toolch);
				toolpos.z = layerh + toolch - radius; // endmill center height, minus tool radius to get correct height to tool tip
				neckz = njz + toolpos.y/Math.tan(nangle);
				// console.log("neckz", neckz);
				tlayer.push(toolpos);
				// TODO: Should toolpos have height (z)? Is this waht is causing the neckblocks to be too low? no is njstart being about 1.5mm too lowball
				
				// Add point to debug shape
				blockshapes[j].push(new Point(thispolar,-layerh));
				ballposs[j].push(new Point(thispolar+toolcl,-layerh-toolch ));
				
				if (j==0){
					// Before first point of each layer, do a clockwise arc around corner
					// First move to beginning of arc
					if (i==layers.length-1){
						// Position endmill on top of first move
						finetoolpath.push(this.gcode_move(toolpos.move(0,0,10.0)));
						finetoolpath.push(this.gcode_straight_cut(toolpos));
					} else {
						// On all other moves, make (complete) a slight 1 mm curve around the neck surface. This is the other part of that move.
						// var h = ((toolpos.x-radius)**2 + 1)/2 - 1;
						// var offset = new Point(0, h);
						// if (toolpos.z < neckz){
							var endp = toolpos.move(radius, -radius); //new Point(-radius, toolpos.y-radius-1);
							// finetoolpath.push(this.gcode_G2(endp, offset));
							finetoolpath.push(this.gcode_straight_cut(endp));
							
							// Curve around corner
							var offset = new Point(0,radius);
							finetoolpath.push(this.gcode_G2(toolpos, offset));
						// } else {
							
						// }
					}
				} else {
					// Do a regular move from ribjoint to ribjoint. First point does not need this since the tool is moved to the position with the above arc command
					// if (toolpos.z < neckz){
						// If tool y,z is above toolpos.y/Math.tan(nangle), tool is above neckjoint
						finetoolpath.push(this.gcode_straight_cut(toolpos));
					// } else { // Calculate intersection with neckjoint plane and skip to other side
						// var ip = toolpos.move(0,radius*Math.tan((Math.PI/4-nangle)/2));
						// console.log(ip);
						// finetoolpath.push(this.gcode_straight_cut(ip));
						// Also skip points if they are above neckjoint
					// }
					
					
				}
				// After last point of each layer, do an arc
				if (j==layers[i].length-1){
					// TODO: cut neckjoint surface here too?
					// Calculate cutter displacement based on joint angle and cutter radius

					// if (toolpos.z < neckz){
						var offset = new Point(-radius,0);
						finetoolpath.push(this.gcode_G2(toolpos.move(-radius,-radius), offset));
						// On all other moves, make a slight 1 mm curve around the neck surface
						// var h = ((toolpos.x-radius)**2 + 1)/2 - 1;
						// var offset = new Point(-(toolpos.x-radius), h);
						var endp = new Point(0, toolpos.y-radius);
						// finetoolpath.push(this.gcode_G2(endp, offset));
						finetoolpath.push(this.gcode_straight_cut(endp));
					// } else {
						
					// }
				}
				prevtoolpos = toolpos.move(0,0);
			}
			toolpath.push(tlayer);
		}
		
		// Lift tool straight up 
		finetoolpath.push("G0 Y-"+(radius+2).toFixed(this.gprecision)+" Z"+(workpiece_height+10).toFixed(this.gprecision));
		// Add a move to safe height to rough cut path
		roughtoolpath.push("G0 Y-"+(ball_dia).toFixed(this.gprecision)+" Z"+(workpiece_height+10).toFixed(this.gprecision));
		// Join rough and fine to gcode
		gcode.push("(No.2 Rough cut)");
		gcode = gcode.concat(roughtoolpath);
		gcode.push("(No.3 Final cut)");
		gcode = gcode.concat(finetoolpath);
		
		// Cut the neckjoint surface
		// TODO: Code below alters lute3d.neckblock.jointpoints and leads to cascading errors; Rework
		/* var ljp = [];
		for (var i=0; i<jointpoints.length; i++){
			// jointpoints[i].y = jointpoints[i].y-bottom;
			
			jointpoints[i] = new Point(jointpoints[i].x, jointpoints[i].z, jointpoints[i].y-bottom);
			ljp.push(new Point(-jointpoints[i].x, jointpoints[i].y, jointpoints[i].z));
		}
		var startp = jointpoints[0];
		
		ljp.reverse();
		jointpoints = ljp.concat(jointpoints); */
		// gcode.concat(this.machine_bounded_plane(jointpoints, nangle, 0, startp ));
		// machine_bounded_plane(shape, a1, a2, startp, accuracy, rough_depth ){
		console.log(toolpath);
		// Debug draw toolpath
		/* if (toolpath[0]){
			var prevp = NECKBLOCKORIGIN.move(toolpath[0][0].x, toolpath[0][0].y-bsmove, toolpath[0][0].z);
			console.log("prevp",prevp);
			var toolpg = makegroup(crosslayer, "neckblock-toolpath-debug-top");
			for (var i=0; i<toolpath.length; i++){
				var lshape = [];
				for (var j=0; j<toolpath[i].length; j++){
					if (!(i == 0 && j == 0)) {
						var p = toolpath[i][j];
						p = NECKBLOCKORIGIN.move(p.x, p.y-bsmove, p.z);
						
						
						var h = parseInt(255 * (p.z / workpiece_height));
						var r = ("0"+(Number(h).toString(16))).slice(-2).toUpperCase();
						var b = ("0"+(Number(255-h).toString(16))).slice(-2).toUpperCase();
						var color = "#"+r+"44"+"44";
						// var styl = makestyle(GREENSTYLE, ["stroke",color]);
						var styl = "stroke:"+color+";stroke-width:0.2; fill:none;";
						drawline(toolpg,[prevp,p],styl,"neckblock-toolpath-debug-top-"+i+"-"+j);
						
						prevp = p;
					}
					
				}
				
			}
		}
		// Debug: Polar view of riblines and endmill positions

		var frontview = getelid("frontview");
		var debg = makegroup(frontview, "neckblock-toolpath-debug-stuff");
		for (var i=0; i<blockshapes.length/2; i++){
			
			blockshapes[i].push(new Point(0,0));
			blockshapes[i].push(new Point(0,blockshapes[i][0].y));
			
			var tra = " translate("+ (20+i*90) +" -20)";
			var b = drawshape(debg, blockshapes[i],NOFILLTHIN,"");
			b.setAttribute("transform",tra ); // Move shape
			// Draw endmill position
			for (var j=0; j<ballposs[i].length; j++){
				var c = drawcircle(debg, ballposs[i][j], radius,REDSTYLE);
				c.setAttribute("transform",tra ); // Move shape
				var c = drawcircle(debg, ballposs[i][j], 0.5,BLUESTYLE);
				c.setAttribute("transform",tra ); // Move shape
			}
		} */
		
		
		// TODO: Display as a wireframe model if easy...
		gcode.push("M5");
		// console.log(gcode.join("\n"));
		gcode = gcode.join("\n");
		getelid("output_textbox").innerHTML = gcode;
		gcode_window(gcode); // Open gcode viewer
		// TODO: Offer download text file
	} // end neckblock_gcode
	
	
	neckblock_gcode(tool_dia){
		// Write a gcode program for machining the neckblock with a ball nose endmill
		// The neckblock is positioned with its inside face laying on the floor, neckjoint up, the endmill will cut the table on the last passes
		// TODO: Maybe do a curved top surface
		var ball_dia = parseFloat(getelid("ballnose_endmill_size").value) || this.ball_dia;
		var gcode = ["(Gcode created with Lutedesigner)"];
		gcode.push(`(Endmill: ${ball_dia.toFixed(1)} mm ballnose)`);
		
		// Sample neckblock shape at every layer
		// Do point if below top and above bottom points
		// lute3d.neckblock.jointpoints, bottompoints, lute3d.inribpaths.threedee
		// threedee is per ribjoint, not per layer...
		var points = lute3d.inribpaths.threedee;
		// bottompoints.y becomes z=0 (using table top as zero rather than stock surface)
		var bottompoints = lute3d.neckblock.bottompoints;
		var jointpoints = lute3d.neckblock.jointpoints;
		var bottom = bottompoints[0].y;
		var zerop = new Point(0,0);
		var njstart = cps.neckjoint_no_origin.y - bottom+1; // Start of neckjoint at y=0
		var nangle = /* halfpi -  */cps.neckjoint_angle; // Neckjoint angle

		var layers = [[]]; // Store rib joint points here per y coordinate, preserve which ribjoint point belongs to. x=x, y=-z, z=-y
		
		// Find out how many layers are needed to store all points between neckjoint and bottom
		for (var j=0; j < points[0].length; j++){
			if(points[0][j].y > bottom /*  && points[0][j].y <= jointpoints[0].y */ ){
				// All points from bottom to tip
				layers.push([]);
			}
		}
		// Store bottompoints as first layer. These have already been calculated by neckjoint_3D()
		for (var j=0; j < bottompoints.length; j++){
			var p = bottompoints[j];
			layers[0][j] = new Point(p.x, p.z, p.y-bottom);
		}
		
		console.log("Layers", layers.length);
		// Arrange neckblock shape into layers for easier use
		var neckblockshape = [];
		for(var i=0; i < points.length; i++){ // ribjoint number
			for(var j=0; j < points[i].length; j++){ // point along ribjoint
				if (points[i][j].y > bottom /* && points[i][j].y < jointpoints[i].y */){
					// Include this point in neckblock shape
					// Put in layer y, jointpoint i,
					// layers[]
					// layers[i][j]
					// put into first layer with free slot on this rib joint
					var lr = 0;
					while(layers[lr+1] && layers[lr][i] !== undefined){
						lr++;
					}
					// lr--;
					var p = points[i][j];
					layers[lr][i] = new Point(p.x, p.z, p.y-bottom);
				}
			}
		}
		console.log("wassup",jointpoints[0].y,bottom );
		var workpiece_height = jointpoints[0].y-bottom; // Z
		var workpiece_width = 2 * bottompoints[bottompoints.length-1].x; // X
		var workpiece_length = bottompoints[0].z; // Y
		// Store jointpoints on top of everything else
		/* for (var j=0; j < jointpoints.length; j++){
			var lr = 0;
			while(layers[lr][j] !== undefined){
				lr++;
			}
			var p = jointpoints[j];
			layers[lr][j] = new Point(p.x, p.z, p.y-bottom);
		} */
		var angles = []; // Rib joint angles
		console.log("layers before culling:", layers);
		// Remove layers where [i][0].z is above neckjoint
		var culled = [];
		for (var i=0; i<layers.length; i++){
			if (layers[i].length){
				var p = layers[i][0];
				// console.log(i, p.z, njstart + p.y * Math.tan(nangle));
				if (p.z <= njstart + p.y / Math.tan(nangle)){
					culled.push(layers[i]);
				}
			}
		}
		layers = culled;
		
		// Now remove points to create neckjoint
		var culled = [];
		for (var i=0; i<layers.length; i++){
			var lr = [];
			var terminate = false;
			for (var j=0; j<layers[i].length; j++){
				var p = layers[i][j];
				// Calculate tool angle
				
				
				// Starting from center rib, store if below neckjoint, else discard
				if (p.z <= (njstart/* -1.6 */) + p.y / Math.tan(nangle)){
					lr.push(p);
				} else if (terminate){
					lr.push(null);
				} else {
					// Calculate intersection with neckjoint
					var y = (p.z-(njstart))*Math.tan(nangle);
					if (layers[i][j-1]){
						var np = new Point(line_x_from_y(p,layers[i][j-1], y).x,
										y,
										p.z);
						np.old_p = new Point(p.x, p.y, p.z); // Nested point stores original values for tool height calculation
						lr.push(np);
					} else {
						lr.push(new Point(p.x,
										y,
										p.z));
					}
					// lr.push(null);
					// break; // discard rest
					terminate = true;
				}
			}
			culled.push(lr);
		}
		layers = culled;
		
		// Mirror points on the other side
		for (var i=0; i<layers.length; i++){
			var reversed = [];
			for (var j=0; j<layers[i].length; j++){
				if (layers[i][j]){
					var p = layers[i][j];
					var rp = new Point(-p.x, p.y, p.z);
					if (p.old_p){
						rp.old_p = new Point(-p.old_p.x, p.old_p.y, p.old_p.z );
					}
					reversed.push(rp);
				} else {
					reversed.push(null);
				}
				
			}
			reversed.reverse();
			layers[i] = reversed.concat(layers[i]);
		}
		// TODO: Find and check where it is decided where the neckblock goes
		// TODO: Draw ribline shapes and ball endmills somewhere to compare
		console.log("layers after:",layers);
		// TODO: Maybe check that every point on every layer has same z coordinate
		// Debug draw layers on NECKBLOCKORIGIN
		var bsmove = cps.neckblocky - RIBTHICKNESS - jointpoints[jointpoints.length-1].y;
		var crosslayer = getelid("crosslayer");
		var debugg = makegroup(crosslayer, "neckblock-debug");
		// var angles = []; // For later use in milling
		for (var i=0; i<layers.length; i++){
			var lshape = [];
			for (var j=0; j<layers[i].length; j++){
				var p = layers[i][j];
				if (p)lshape.push(NECKBLOCKORIGIN.move(p.x, p.y-bsmove));
				
			}
			/* if (lshape.length > 1 ){
				// var h = parseInt(255 * (i / (layers.length-1)));
				var h = parseInt(255 * (layers[i][0].z / (layers[layers.length-1][0].z)));
				var g = ("0"+(Number(h).toString(16))).slice(-2).toUpperCase();
				var b = ("0"+(Number(255-h).toString(16))).slice(-2).toUpperCase();
				var color = "#00"+g+b;
				// var styl = makestyle(GREENSTYLE, ["stroke",color]);
				var styl = "stroke:"+color+";stroke-width:0.2; fill:none;";
				// drawshape(debugg,lshape,styl,"neckblock-layer-"+i);
			} */
		}
		// Neckblock points have now been neatly arranged in layers
		// TODO: interpolate (or calculate from lute model) extra layers if they are too far apart
		// Start parsing layers to create gcode
		// console.log("angles",angles);
		
		var radius = ball_dia/2.0; // Cutter radius
		var toolpath = [];
		
		// Do a positioning move above workpiece
		gcode.push("(Stock size: W"+workpiece_width.toFixed(1)+"mm L"+workpiece_length.toFixed(1)+"mm H"+workpiece_height.toFixed(1)+"mm)");
		gcode.push("(Neckjoint angle: "+(90-(cps.neckjoint_angle/radtodeg)).toFixed(1) +" degrees");
		gcode.push("M3");
		
		// Cut neckjoint
		// ball_dia
		var rshape = [];
		var lshape = [];
		for (var i=0; i < jointpoints.length; i++){
			var p = jointpoints[i];
			rshape.push(new Point(p.x, p.z, p.y-bottom));
			lshape.push(new Point(-p.x, p.z, p.y-bottom));
			
		}
		lshape.reverse();
		rshape = rshape.concat(lshape);
		gcode.push("(No.1 Neckjoint)");
		// gcode.push(this.machine_bounded_plane(rshape, 0, nangle, 0, new Point(0,0,njstart), 2, 5 ));
		
		
		// Prepare for cutting all the layers
		gcode.push("G0 X0 Y-3 Z"+(workpiece_height+10.0).toFixed(this.gprecision));
		var roughtoolpath = ["(Rough pass)"];
		var finetoolpath = ["(Final pass)"];
		
		var roughcut = 4.0; // Depth to cut on rough pass
		var roughcounter = workpiece_height; // Keep track of rough passes
		var firstrough = true;
		
		// Debug shapes, draw into page later
		var blockshapes = []; // One for each ribline
		var ballposs = []; // One array for each ribline
		for (var i =0; i<layers[0].length ;i++){
			blockshapes.push([]);
			ballposs.push([]);
		}
		
		// Find plane of neckjoint shifted by tool diameter
		// njstart nangle
		// nangle is the angle to be cut to the neck, not really the neckjoint angle
		// console.log("neckjoint",njstart, nangle);
		// var njz = njstart; // + radius / Math.sin(nangle);
		// console.log("neckjoint",njstart, nangle, njz);
		// var njy = Math.cos(nangle) * radius;
		// If tool y,z is above radius/Math.tan(nangle), tool is above neckjoint
		
		var xtreme = workpiece_width/2 /* +radius */; // maximum value for any cut coordinate
		
		// Calculate cuts
		for (var i=layers.length-1; i>0 ; i--){ // top down for each layer
			var tlayer = [];
			var cen = parseInt(layers[i].length/2)
			var layerh = layers[i][cen].z;
			// TODO: Rough cut. Do before final cut, so gather into two separate toolpaths but calculate here. Fit full tool widths to rough depth
			finetoolpath.push("(No. level "+i+")");
			if (layerh < roughcounter - roughcut){

				roughtoolpath.push("(Rough cut level "+layerh.toFixed(1)+" mm)");
				
				// Do as many rough cuts as fit radially. They need to be organized here in full arcs
				// Number of arcs on this layer
				// TODO: This produces too few rough passes:
				var numbercuts = Math.abs(/* parseInt */((layers[0][cen].x - layers[i][cen].x) / ball_dia));
				// console.log("Doing rough cut", layerh, "cuts", numbercuts);
				
				for (var c=1; c<=numbercuts; c++){ 
					for (var j=0; j<layers[i].length; j++){ // for each point
						// Cut around shape at ball_dia intervals
						if (layers[i][j] === null) break;
						var thisp = layers[i][j];
						var lowestp = layers[0][j];
						// Find angle towards center at each joint
						var angle = getangle(thisp,zerop);
						var thispolar = flatlinelength(thisp, zerop);
						var lpolar = flatlinelength(lowestp, zerop);
						var incr = (lpolar-thispolar-radius)/numbercuts;
						if (j==0) console.log("incr",i,c,j,lpolar-thispolar, incr);
						var toolpos = thisp.movedist(radius+incr*c, angle);
						// tlayer.push(toolpos);
						
						if (j==0){
							if (firstrough){
								// Position endmill on top of first move
								roughtoolpath.push(this.gcode_move(toolpos.move(0,0,10.0)));
								roughtoolpath.push(this.gcode_straight_cut(toolpos));
								firstrough = false;
							} else {
								// Normally do a fast move along bottom and arc to arrive at start of cut
								var offset = new Point(0,ball_dia);
								roughtoolpath.push(this.gcode_move(toolpos.move(ball_dia,-ball_dia)));
								roughtoolpath.push(this.gcode_G2(toolpos, offset));
								// 
							}
						} else {
							// On non-first moves do normal cut
							roughtoolpath.push(this.gcode_straight_cut(toolpos));
						}
						
						
						
						if (j==layers[i].length-1){
							// On every layer's last point, do an arc around corner
							var offset = new Point(-ball_dia,0);
							roughtoolpath.push(this.gcode_G2(toolpos.move(-ball_dia,-ball_dia),offset));
						}
					}
				}
				roughcounter -= roughcut;
				
			}
			
			
			// Do fine surfacing
			var lowerp, lowerpolar, polardif, vangle, hdif, toolpos;
			var first = false; // Whether first non-null point on layer
			var last = false;
			
			for (var j=0; j<layers[i].length; j++){ // for each point
				if (layers[i][j] === null){
					continue; // skip null point
				} else if (j==0 || (layers[i][j] != null && layers[i][j-1] === null)) {
					first = true; // This is the first non-null point
				} else {
					first = false;
				}
				// Calculate height of ball shaped cutter so it is tangential to neckblock
				var thisp = layers[i][j];
				// if (thisp.z > workpiece_height) workpiece_height = thisp.z
				
				if (thisp.old_p){
					console.log("using old point");
					var thispolar = flatlinelength(thisp.old_p, zerop);	
				} else {
					var thispolar = flatlinelength(thisp, zerop);
				}
				
				if (i>0) {
					lowerp = layers[i-1][j];
					// lowerpolar = flatlinelength(lowerp, zerop);
					// polardif = lowerpolar-thispolar;
					if (thisp.old_p){// Potentially unnecessary
						polardif = flatlinelength(thisp.old_p, lowerp);
					} else {
						polardif = flatlinelength(thisp, lowerp);
					}
					hdif = Math.abs(thisp.z - lowerp.z);
					vangle = Math.atan((polardif)/(hdif));// angle between z axis, this and lower point vertically. 
				} else { // Lowest layer, can't use non existent lower point to calculate
					var higherp = layers[i+1][j];
					var higherpolar = flatlinelength(higherp, zerop);
					polardif = Math.abs(higherpolar-thispolar);
					hdif = Math.abs(thisp.z - higherp.z);
					vangle = Math.atan((polardif)/(hdif));// angle between z axis, this and lower point vertically. 
				}
				
				// Convert tool position from polar form to xy
				var toolz = layerh + radius * Math.sin(vangle) - radius; // endmill center height, minus tool radius to get correct height to tool tip
				
				// Find angles perpendicular to surfaces at each joint
				// console.log(i,j,layers[i][j]);
				// Angles: +y is -pi, +x is -halfpi, -y is 0. every point should have y>0
				if (layers[i][j+1] != null && first){
					var angle1 = -Math.PI-halfpi; // to the left
					if (thisp.old_p){// Potentially unnecessary
						var angle2 = trueangle(thisp.old_p, layers[i][j+1] );
					} else {
						var angle2 = trueangle(thisp, layers[i][j+1] );
					}
					
					var toolcl = radius * Math.cos(vangle); // Ball endmill center offset in polar form
				} else if (layers[i][j+1] != null){
					var angle1 = trueangle(layers[i][j-1],thisp);
					var angle2 = trueangle(thisp, layers[i][j+1]);
					var angle = (angle2-angle1)/2; // Angle between angles
					var toolcl = (radius/Math.cos(angle)) * Math.cos(vangle); // Ball endmill center offset in polar form with extra correction away from neckjoints
				} else { // last
					if (thisp.old_p){ // Potentially unnecessary
						var angle1 = trueangle(layers[i][j-1], thisp.old_p );
					} else {
						var angle1 = trueangle(layers[i][j-1], thisp );
					}
					// var angle1 = trueangle(layers[i][j-1],thisp.old_p);
					var angle2 = -halfpi; // To the right
					var toolcl = radius * Math.cos(vangle); // Ball endmill center offset in polar form
				}
				
				if (first){
					// Before first point of each layer, do a clockwise arc around corner
					// First move to beginning of arc
					toolpos = thisp.movedist(toolcl, angle2+halfpi).setz(toolz);
					if (i==layers.length-1){
						// Position endmill on top of first move
						// console.log("first",i,j,toolpos);
						finetoolpath.push(this.gcode_move(toolpos.move(0,0,10.0)));
						// finetoolpath.push(this.gcode_straight_cut(toolpos));
					} else {

						if (layers[i][0] === null || layers[i][0].y != 0.0){ // Layer has null points = neckjoint
							if (i > 0){
								polardif = flatlinelength(layers[i][j+1], layers[i-1][j+1]);
							} else {
								polardif = flatlinelength(layers[i+1][j+1], layers[i][j+1]);
							}
							
							hdif = Math.abs(layers[i][j+1].z - layers[i-1][j+1].z);
							vangle = Math.atan((polardif)/(hdif));
							// thisp = layers[i][j+1]
							toolz = layerh + radius * Math.sin(vangle) - radius;
							var toolcl = radius * Math.cos(vangle); // Ball endmill center offset in polar form
							
							// find y coordinate that places tool so it touches neckjoint
							var neckjy = (toolz-njstart) * Math.tan(nangle) - radius * Math.tan((halfpi-nangle)/2) ;
							// console.log(i,j,"neckjy",neckjy);
							if (neckjy < -radius) neckjy = -radius;
							
							// Find extreme corner of movement
							var angle3 = trueangle(layers[i][j+1], layers[i][j+2]);
							var ep1 = thisp.movedist(toolcl, angle3+halfpi).setz(toolz);
							var ep = ep1.movedist(100, angle3);
							// console.log((neckjy-op.y)/Math.tan(Math.PI+angle3));
							var op = new Point(ep.x+(neckjy-ep.y)/Math.tan(halfpi-angle3), neckjy, toolz);
							
							if (op.x < -xtreme){
								finetoolpath.push(this.gcode_straight_cut(op.setx(-xtreme)));
								finetoolpath.push(this.gcode_straight_cut(ep1.setx(-xtreme).sety(ep1.y)));
							} else {
								finetoolpath.push(this.gcode_straight_cut(op));
							}
							
						} else {
							
							// Start of layer south of corner
							var p1 = thisp.move(radius-toolcl,-radius).setz(toolz);
							finetoolpath.push(this.gcode_straight_cut(p1));
							
							// Arc around corner
							var cp = new Point(0,radius); // Arc center relative to start
							var p2 = thisp.move(-toolcl).setz(toolz);
							finetoolpath.push(this.gcode_G2(p2, cp));
							// Move to tangential of surface
							finetoolpath.push(this.gcode_straight_cut(toolpos));
						}
					}
					
					
				} else if (layers[i][j+1] === null || j == layers[i].length-1){
					// After last point of each layer, do an arc
					// Move to tangential of surface
					toolpos = thisp.movedist(toolcl, angle1+halfpi).setz(toolz);
					// finetoolpath.push(this.gcode_straight_cut(toolpos));
					
					if (layers[i][0] === null || layers[i][0].y != 0.0){ // Layer has null points = neckjoint
						if (i > 0){
								polardif = flatlinelength(layers[i][j-1], layers[i-1][j-1]);
							} else {
								polardif = flatlinelength(layers[i+1][j-1], layers[i][j-1]);
							}
							
							hdif = Math.abs(layers[i][j-1].z - layers[i-1][j-1].z);
							vangle = Math.atan((polardif)/(hdif));
							// thisp = layers[i][j+1]
							toolz = layerh + radius * Math.sin(vangle) - radius;
							var toolcl = radius * Math.cos(vangle); // Ball endmill center offset in polar form
							
							// find y coordinate that places tool so it touches neckjoint
							var neckjy = (toolz-njstart) * Math.tan(nangle) - radius * Math.tan((halfpi-nangle)/2) ;
							console.log(i,j,"neckjy",neckjy);
							if (neckjy < -radius) neckjy = -radius;
							
							// Find extreme corner of movement
							var angle3 = trueangle(layers[i][j-2], layers[i][j-1]);
							console.log("angle3",(angle3+halfpi)/radtodeg);
							var ep = thisp.movedist(toolcl, angle3+halfpi).movedist(100, angle3).setz(toolz);
							
							op = new Point(ep.x-(neckjy-ep.y)/Math.tan(angle3+halfpi), neckjy, toolz);
							console.log(op, "op");
							if (op.x > xtreme){
								// console.log((op.x-xtreme)*Math.tan(angle3+halfpi),Math.tan(angle3+halfpi),op.x-xtreme,op.x,xtreme);
								finetoolpath.push(this.gcode_straight_cut(op.setx(xtreme).sety(ep.y-(xtreme-ep.x)*Math.tan(angle3+halfpi))));
								finetoolpath.push(this.gcode_straight_cut(op.setx(xtreme)));
							} else {
								finetoolpath.push(this.gcode_straight_cut(op));
							}
							
					} else {
						
						// Move to east of point, start of arc
						var p1 = thisp.move(toolcl).setz(toolz);
						finetoolpath.push(this.gcode_straight_cut(p1));
						
						// Arc around corner
						var p2 = thisp.move(-(radius-toolcl),-radius).setz(toolz);
						var cp = new Point(-radius); // Arc center relative to start
						finetoolpath.push(this.gcode_G2(p2, cp));
						
					}
					
				} else {// Do a regular move from ribjoint to ribjoint. 
					
					toolpos = thisp.movedist(toolcl, angle1+angle+halfpi).setz(toolz); 		
					finetoolpath.push(this.gcode_straight_cut(toolpos));
					
					
				}
				
				
				// prevtoolpos = toolpos.move(0,0);
			}
			// toolpath.push(tlayer); // Old debug stuff
		}
		
		// Lift tool straight up 
		finetoolpath.push("G0 Y-"+(radius+2).toFixed(this.gprecision)+" Z"+(workpiece_height+10).toFixed(this.gprecision));
		// Add a move to safe height to rough cut path
		roughtoolpath.push("G0 Y-"+(ball_dia).toFixed(this.gprecision)+" Z"+(workpiece_height+10).toFixed(this.gprecision));
		// Join rough and fine to gcode
		// gcode.push("(No.2 Rough cut)");
		// gcode = gcode.concat(roughtoolpath);
		gcode.push("(No.3 Final cut)");
		gcode = gcode.concat(finetoolpath);
		
		var debugtoolpath = ["(No. Debug shape)"];
		
		// for (var j=0; j < layers[0].length; j++){
			// if (j%2==0){
				// for (var i=0; i < layers.length; i++){
					// if (layers[i][j]) debugtoolpath.push(this.gcode_move(layers[i][j]));
				// }
			// } else {
				// for (var i=layers.length-1; i >= 0; i--){
					// if (layers[i][j]) debugtoolpath.push(this.gcode_move(layers[i][j]));
				// }
			// }
			
		// }
		
		// for (var i=0; i < layers.length; i++){
			
			// for (var j=0; j < layers[i].length; j++){
				// if (layers[i][j]) debugtoolpath.push(this.gcode_move(layers[i][j]));
			// }
			
			
		// }
		// gcode = gcode.concat(debugtoolpath);
		
		// Cut the neckjoint surface
		// TODO: Code below alters lute3d.neckblock.jointpoints and leads to cascading errors; Rework
		/* var ljp = [];
		for (var i=0; i<jointpoints.length; i++){
			// jointpoints[i].y = jointpoints[i].y-bottom;
			
			jointpoints[i] = new Point(jointpoints[i].x, jointpoints[i].z, jointpoints[i].y-bottom);
			ljp.push(new Point(-jointpoints[i].x, jointpoints[i].y, jointpoints[i].z));
		}
		var startp = jointpoints[0];
		
		ljp.reverse();
		jointpoints = ljp.concat(jointpoints); */
		// gcode.concat(this.machine_bounded_plane(jointpoints, nangle, 0, startp ));
		// machine_bounded_plane(shape, a1, a2, startp, accuracy, rough_depth ){
		// console.log(toolpath);
		// Debug draw toolpath
		/* if (toolpath[0]){
			var prevp = NECKBLOCKORIGIN.move(toolpath[0][0].x, toolpath[0][0].y-bsmove, toolpath[0][0].z);
			console.log("prevp",prevp);
			var toolpg = makegroup(crosslayer, "neckblock-toolpath-debug-top");
			for (var i=0; i<toolpath.length; i++){
				var lshape = [];
				for (var j=0; j<toolpath[i].length; j++){
					if (!(i == 0 && j == 0)) {
						var p = toolpath[i][j];
						p = NECKBLOCKORIGIN.move(p.x, p.y-bsmove, p.z);
						
						
						var h = parseInt(255 * (p.z / workpiece_height));
						var r = ("0"+(Number(h).toString(16))).slice(-2).toUpperCase();
						var b = ("0"+(Number(255-h).toString(16))).slice(-2).toUpperCase();
						var color = "#"+r+"44"+"44";
						// var styl = makestyle(GREENSTYLE, ["stroke",color]);
						var styl = "stroke:"+color+";stroke-width:0.2; fill:none;";
						drawline(toolpg,[prevp,p],styl,"neckblock-toolpath-debug-top-"+i+"-"+j);
						
						prevp = p;
					}
					
				}
				
			}
		}
		// Debug: Polar view of riblines and endmill positions

		var frontview = getelid("frontview");
		var debg = makegroup(frontview, "neckblock-toolpath-debug-stuff");
		for (var i=0; i<blockshapes.length/2; i++){
			
			blockshapes[i].push(new Point(0,0));
			blockshapes[i].push(new Point(0,blockshapes[i][0].y));
			
			var tra = " translate("+ (20+i*90) +" -20)";
			var b = drawshape(debg, blockshapes[i],NOFILLTHIN,"");
			b.setAttribute("transform",tra ); // Move shape
			// Draw endmill position
			for (var j=0; j<ballposs[i].length; j++){
				var c = drawcircle(debg, ballposs[i][j], radius,REDSTYLE);
				c.setAttribute("transform",tra ); // Move shape
				var c = drawcircle(debg, ballposs[i][j], 0.5,BLUESTYLE);
				c.setAttribute("transform",tra ); // Move shape
			}
		} */
		
		
		// TODO: Display as a wireframe model if easy...
		gcode.push("M5");
		// console.log(gcode.join("\n"));
		gcode = gcode.join("\n");
		getelid("output_textbox").innerHTML = gcode;
		gcode_window(gcode); // Open gcode viewer
		// TODO: Offer download text file
	} // end neckblock_gcode
	
	copyrotate(center, copies, scale){// Rotate and copy existing gcode, returns text
		var copies = copies || 6;
		var rotation = Math.PI*2 / copies;
		var center = center || new Point(0,0,0);
		var scale = scale || new Point(1, 1, 1);
		// Operate on this.program
		var output = [];
		for (var c=0; c < copies ; c++){
			// console.log("copy",c, c*rotation);
			var rotprog = [];
			// for each coordinate: scale, rotate, move
			for (var i =0; i < this.program.length; i++){ // shape
				var subprog = [];
				for (var j =0; j < this.program[i].length; j++){
					if (this.program[i][j]){
						subprog.push( this.alter_command(this.program[i][j], scale, c*rotation, center));
					}
					
				}
				rotprog.push(subprog);
			}
			// output.push(rotprog);
			output = output.concat(rotprog);
		}
		// this.program = output;
		return output;
	}
	
	mask_shapes (mask){ // Remove parts of program that are outside circle // TODO:
		var output = [];
		this.prevp = new Point(parseFloat(this));
		for (var i =0; i < this.program.length; i++){ // shape
			var subprog = [];
			for (var j =0; j < this.program[i].length; j++){
				if (this.program[i][j]){
					subprog.push( this.mask_command(this.program[i][j], mask) );
				}
				
			}
			output.push(subprog);
		}
		// Return text or new Gcoder with changed program?
		return output;
	}
	////////////////////////////////////////////////////////
	// basic gcode commands and combinations
	
	gcode_lift_move(){
		// Do a quick reposition at safe height (lift above, move, lower)
	}
	
	gcode_G2(ep, offset,feed){// Clockwise arc
		// offset from startpoint
		var out = ["G2"];
		out.push("X"+ep.x.toFixed(this.gprecision));
		out.push("Y"+ep.y.toFixed(this.gprecision));
		if (ep.z !== undefined){
			out.push("Z"+ep.z.toFixed(this.gprecision));
		}
		out.push("I"+offset.x.toFixed(this.gprecision));
		out.push("J"+offset.y.toFixed(this.gprecision));
		if (feed !== undefined) out.push("F"+feed.toFixed(this.fprecision));
		return out.join(" ");
		// TODO: Add feed?
	}
	
	gcode_G3(ep, offset, feed){// Counter-clockwise arc
		
		var out = ["G3"];
		out.push("X"+ep.x.toFixed(this.gprecision));
		out.push("Y"+ep.y.toFixed(this.gprecision));
		if (ep.z !== undefined){
			out.push("Z"+ep.z.toFixed(this.gprecision));
		}
		out.push("I"+offset.x.toFixed(this.gprecision));
		out.push("J"+offset.y.toFixed(this.gprecision));
		if (feed !== undefined) out.push("F"+feed.toFixed(this.fprecision));
		return out.join(" ");
	}
	
	gcode_move(ep){// Output line of gcode at fastest unspecified movement rate
		
		var out = ["G0"];
		out.push("X"+ep.x.toFixed(this.gprecision));
		out.push("Y"+ep.y.toFixed(this.gprecision));
		if (ep.z !== undefined){
			out.push("Z"+ep.z.toFixed(this.gprecision));
		}
		
		return out.join(" ");
	}
	
	gcode_straight_cut(ep, feed){	// Output line of gcode at cutting feedrate
	
		var feed = feed || this.default_cutrate;
		var out = ["G1"];
		out.push("X"+ep.x.toFixed(this.gprecision));
		out.push("Y"+ep.y.toFixed(this.gprecision));
		if (ep.z !== undefined){
			out.push("Z"+ep.z.toFixed(this.gprecision));
		}
		if (feed !== undefined){
			out.push("F"+feed.toFixed(1));
		}
		
		return out.join(" ");
	}

	goplunge = function(p, pld){ // Move over point and go down
		var pld = this.depth || pld;
		this.g.push(gcoder.gcode_move(p.setz(this.safeh)));
		this.g.push(gcoder.gcode_straight_cut(p.setz(pld), this.plunge_feed));
		this.plunged = true;
	}
	
	machine_plane(sp, a1,a2,w,h){
		// Machine an arbitrary plane specified in two angles and a point, and width and height
		// Assumes a ballnose endmill
	}
	
	machine_bounded_plane(shape, atool, avert, arot, startp, interval, rough_depth ){
		var atool = atool || 0.0; // tool movement angle along x by default
		while (atool > Math.PI/4) atool -= Math.PI/4; // Clamp value
		var avert = avert || 0.0; // inclination of plane
		var arot = arot || 0.0; // rotation of plane around Z axis on startp
		var interval = interval || 1.0;
		var rough_depth = rough_depth || 3.0;
		// Machine an arbitrary plane specified in two angles and a point, and bounding shape
		// Assumes a ballnose endmill
		// Starts at startp
		// Return array of moves as text 
		var out = ["(Start bounded plane machining at angles "
			+(avert/radtodeg).toFixed(1)+", "
			+(arot/radtodeg).toFixed(1)+")"];
		console.log("Bounding shape", shape);
		
		// Find largest and smallest coordinates in bounding shape to create box
		var smallest = new Point(shape[0].x, shape[0].y);
		var largest = new Point(shape[0].x, shape[0].y); // Z coordinate will be ignored and the shape will be treated as flat
		// var highest = new Point(shape[0].x, shape[0].y, shape[0].z);
		 
		
		for (var i=0; i<shape.length; i++){
			if (shape[i].x < smallest.x) smallest.x = shape[i].x;
			if (shape[i].y < smallest.y) smallest.y = shape[i].y;
			// if (shape[i].z < smallest.z) smallest.z = shape[i].z;
			
			if (shape[i].x > largest.x) largest.x = shape[i].x;
			if (shape[i].y > largest.y) largest.y = shape[i].y;
			// if (shape[i].z > highest.z) highest = shape[i].move(0);
		}
		function getz(/* x, */ y ){
			return startp.z+(y-startp.y)*Math.tan(avert);
		}
		console.log("startp",startp);
		console.log(largest, smallest,/* highest, */ shape[0]);
		// largest = largest.move(1,1);
		// smallest = smallest.move(-1,-1); // bounding box size increased to always know which side of shape is intersected
		// Create intersector lines at atool angle
		var intadva = atool+Math.PI/2; // Angle to advance intersector ,90deg to atool
		var radius = this.tool_dia/2; // Ballnose radius
		// var interval = radius*Math.cos(avert); // Interval depends on avert TODO: Add interval param
		var lines = Math.abs((largest.y - smallest.y)/interval);
		var toolpos = new Point(startp.x, startp.y, startp.z);
		var gcode = ["(Cutting neckjoint surface)"];
		
		// Find highest point
		
		
		// Do cuts
		for (var i=0; i<=lines; i++){
			toolpos.y = interval*i;
			toolpos.z = getz(toolpos.y);
			console.log(toolpos.y, toolpos.z);
			drawcircle(getelid("neckblock-group"), SIDEVIEWORIGIN.move(0,-cps.neckblocky).addpoint(toolpos.yz().scale(-1,-1)), 0.5,REDSTYLE);
		}
		
		return gcode; // gcode is an array that needs to be joined with newlines
	}
	
	alter_command(command, scale, rotation, move, maxr){ // scale, rotate, move a single command
		var scale = scale || new Point(1, 1, 1);
		var move = move || new Point(0, 0, 0);
		var rotation = rotation || 0;
		var maxr = null || maxr; // Cut moves outside this radius
		// console.log("roatio", rotation, move);
		// console.log(this.textify_line(command));
		command = copyobj(command); // Make a copy so the same commands don't get changed 
		
		if (command.X && command.Y){
			// var d = Math.sqrt(parseFloat(command.X)**2+parseFloat(command.Y)**2);
			var p = new Point(parseFloat(command.X), parseFloat(command.Y));
			var p1 = p.rotate(new Point(0,0), rotation);
			// console.log(p);
			command.X = (p1.x * scale.x  + move.x).toFixed(this.gprecision);
			command.Y = (p1.y * scale.y  + move.y).toFixed(this.gprecision);
			if (command.I){
				var ij = new Point(parseFloat(command.I), parseFloat(command.J));
				ij = ij.rotate(new Point(0,0), rotation);
				command.I = (ij.x * scale.x).toFixed(this.gprecision);
				command.J = (ij.y * scale.y).toFixed(this.gprecision);
			}
			// TODO: if maxr!==null, cut move
			// Use existing code from chainmail rosette
		}
		// console.log(this.textify_line(command));
		return command;
	}
	
	mask_command(command, mask){ // Remove parts of command that are outside of circle
		var mask = mask || new Circle(new Point(0,0), 100);
		command = copyobj(command); // Make a copy so the same commands don't get changed 
		// Or maybe just change this.program
		var inmask = null;
		var inters = [];

		// First determine if endpoint is inside mask
		if (Math.sqrt((p.x-this.mask.x)**2+(p.y-this.mask.y)**2) < this.mask.r) {
			inmask = true;
		}
		// Then determine intersection(s)
		if (move == "G2" || move == "G3"){
			var cp = this.prevp.minuspoint(c);
			var inters1 = intersect_circle(cp, this.mask);
			// var inters = [];
			// Then check if intersection is in arc
			for (var i=0; i<inters1.length; i++){
				var mp = midpoint(this.prevp, p);
				if (flatlinelength(mp, inters1[i]) < flatlinelength(mp, p)){
					// intersection is valid; contained within arc move
					// inters.push(inters1[i]);
					if (inters1[i]) inters.push(inters1[i]);
				}
				// TODO: At this point intersection points still need to be organized along cut for arcs
				// TODO: G23 move center point must be recalculated for each intersection, since it is relative to move start point
			}
		} else if (move == "G1") {
			// goplunge & retract -> no intersection needed
			// G1 check if endpoint inside mask
			var inters1 = circle_line(this.mask, this.prevp, p);
			console.log("did inters", inters,this.mask,this.prevp, p);
			if (inters1[0]) inters.push(inters1[0]);
			// Organize intersections by distance from start point
			if (inters1[1] ){
				if (linelength(this.prevp,inters1[1]) < linelength(this.prevp,inters1[0])){
					if (inters1[1]) inters.splice(0,0,inters1[1]);
				}
			} else {
				if (inters1[1]) inters.push(inters1[1]);
			}
		}
		
		
		
		return command;
	}
	
};


////////////////////////////////////////////////////////////
// Functions for sending gcode to gcode editor for viewing

var gcode_tab;

function gcode_window(gcode){ // Open new gcode editor tab with gcode
	// Create tab	
	gcode_tab = window.open("../gcode/gcode.html");
	// Listen for request from opened tab when it finishes loading, then send data
	window.addEventListener('message', (event) => {
		if (event.data?.msg) {
			send_to_tab(gcode);
		}
	});
}

const send_to_tab = (gcode) => {
	gcode_tab.postMessage({ gcode: gcode }, '*');
};



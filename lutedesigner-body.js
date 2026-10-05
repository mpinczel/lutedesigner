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
// Methods for calculating the body.

// TODO: quick sideview rib drawing by flattening middle rib shape

var accuracy = 2; // Accuracy for body calculations in mm
var lastribadd = 2; // Make last rib wider by this much
var positionlist = []; // Where to get edge and middle path height, more accuracy at the start and end
// var lute3d ={}; // Data for creating a 3D render of the body and perhaps the whole lute
// Convert edge and middle shapes in to points, every 5mm or so
// Only calculate half of body, since the body is symmetrical

// TODO: Make cross supports wider to reach the rib surface

function drawribs(crosslayer){ // on the cross section and side view

	// Get points along paths for side and middle
	var sidepoints = getpoints(currentbody.side,null, false); // Last parameter is debug
	// var debugside = [];
	var midpoints = getpoints(currentbody.middle,sidepoints.Y);
	
	var Ypoints = flipsign(sidepoints.Y);
	var sidepoints = flipsign(sidepoints.X);
	var midpoints = flipsign(midpoints.X);
	var widest_i = findmax(sidepoints);
	
	lute3d.sidepoints = sidepoints;
	lute3d.midpoints = midpoints;
	lute3d.Ypoints = Ypoints;
	lute3d.widest_i = widest_i;
	
	var widest = circumference(Ypoints,sidepoints,midpoints, widest_i, 0.1);
	cps.depth = widest.height; // TODO: MAke sure actual highest spot is found somewhere 
	var ribs = getribangles(widest);
	lute3d.ribs = ribs;
	
	
	
	var crossg = makegroup(crosslayer, "cross-section-half");

	// Calculate rib shapes in 3D
	var t0 = performance.now();
	var ribpaths = calculateribjoints_plane(Ypoints,sidepoints,midpoints, ribs, widest_i);
	var t1 = performance.now();
	console.log("It took " + (t1 - t0).toFixed(0) + " ms to calculate ribjoints.")

	lute3d.ribpaths = ribpaths;
	
	// Draw ribs side view as series of lines or curves, jumping over points
	var ribsg = makegroup(getelid("sideview"), "ribjoints-side");
	for (var i=0; i< ribpaths.threedee.length; i++){
		var rshape = [];
		for (var j=0; j< ribpaths.threedee[i].length; j++){
			rshape.push(ribpaths.threedee[i][j].zy());
		}
		var rib = drawshape(ribsg, rshape, NOFILLTHIN,"ribside-"+i, false);
		rotate(translate(rib, SIDEVIEWORIGIN), 180);
	}
	addelafter(getelid("soundboard-side"),ribsg);
	// Original middle gets hidden if drawing rib sides succeeds
	// var ribsg = makegroup(getelid("sideview"), "ribjoints-side");
	// for (var i=1; i< ribpaths.sideview.length; i++){
		// drawshape(ribsg, ribpaths.sideview[i], NOFILLTHIN,"ribside-"+i, false);
	// }
	// addelafter(getelid("soundboard-side"),ribsg);
	// Remove outside side path
	delel(currentbody.middle);
	// console.log(ribpaths);

	// Draw endclasp and ribs on cross-section. Draw ribs gray under the endclasp.
	var endclasp = draw_endclasp ();
	
	// Draw ribs on cross section
	var skip_every = 4; // Start skipping y indexes after true start of ribs has been found
	var doskip=0;
	var backpaths = [];
	var backpathsl = [];
	var frontpaths = [];
	var mo = ribpaths.offsets[findmax(ribpaths.offsets)];
	var crosspoints = [];
	var crosspoints2 = [];
	
	// draw rib paths on cross section 
	for (var i=0; i<ribpaths.threedee.length-1; i++){
		var mid_offset = widest_i/* +ribpaths.offsets[i]-mo */;
		var path = []; // visible rib paths when body is viewed from behind
		// var pathl = []; // mirrored version
		var path2 = []; // After widest_i, to be drawn gray or not at all
		// Find widest point
		var j = 1;
		while(ribpaths.threedee[i][j-1].x <= ribpaths.threedee[i][j].x 
				// &&ribpaths.threedee[i][j-1].x < ribpaths.threedee[i][j].x 
				&& j < ribpaths.threedee[i].length){
			j++;
		}
		
		var longest = ribpaths.threedee[i][4].x**2 + ribpaths.threedee[i][4].z**2;
		var current = 1000000;
		j = 5;
		// Find point that is actually farthest away
		while(longest <= current && j < ribpaths.threedee[i].length){
			j++;
			current = ribpaths.threedee[i][j].x**2 + ribpaths.threedee[i][j].z**2;
			if (current > longest){
				longest = current;
			}
			// TODO: Actually should calculate distance to where ribs meet rather than 0,0 in case deepenbody is used. Only a small difference is caused by this for the last ribs though.
		}
		
		// Save widest point for outline
		crosspoints.push(new Point(ribpaths.threedee[i][j].x, ribpaths.threedee[i][j].z).scale(1,-1).addpoint(CROSSVIEWORIGIN));
		crosspoints2.push(new Point(ribpaths.threedee[i][j].x, ribpaths.threedee[i][j].z).scale(-1,-1).addpoint(CROSSVIEWORIGIN));
		// j+=20;
		// console.log(i,"widest index:",j);
		// Get all points before widest for later use
		for (var yi=0; yi<j+1; yi+=1+doskip){
			if (ribpaths.threedee[i][yi].z >= lute3d.ribs.ribstartpoints[i].y){
				path.push(new Point(ribpaths.threedee[i][yi].x, ribpaths.threedee[i][yi].z).scale(1,-1).addpoint(CROSSVIEWORIGIN));
			}
		}

		backpaths.push(path);
		// backpathsl.push(pathl);
		// frontpaths.push(path2); // part of rib lines hidden from view
		
	}
	// for (var i=0; i<frontpaths.length;i++){
		// drawshape(crossg, frontpaths[i], GRAYSTYLE, "real-rib-front-"+i,false);
	// }
	// console.log(backpaths);
	// Find parts of rib lines which are under the endclasp, draw gray
	for (var i=0; i<backpaths.length;i++){ // for each ribline path
		var p = backpaths[i];
		var gray = [p[0]];
		var grayl = [p[0].minuspoint(CROSSVIEWORIGIN).scale(-1,1).addpoint(CROSSVIEWORIGIN)];
		var black = [];
		var blackl = [];
		// intersect endclasp with each ribline, draw half with gray and half with black
		var inter_found = false;
		for (var j=1; j<p.length; j++){ // for each segment in ribline path
			
			var line = [p[j-1], p[j]];
			// drawcircle(crossg,p[j],0.3,BLUESTYLE);
			if (inter_found /* || p[j].y < CROSSVIEWORIGIN.y -45 */){
				// If intersects, part of ribline should be above the endclasp, and should be painted black
				
				black.push(p[j]);
				blackl.push(p[j].minuspoint(CROSSVIEWORIGIN).scale(-1,1).addpoint(CROSSVIEWORIGIN));
			} else { // Before intersection is found, draw as gray and try to find intersection
				
				var inter = pathline_intersect (endclasp,line,false);
				// console.log(inter);
				if (inter !== false){ // Intersection was found
					
					// console.log("inters",i,j,inter);
					// drawcircle(crossg,inter,1,REDSTYLE);
					// drawline(crossg, line, REDSTYLE);
					
					inter_found = true;
					black.push(inter);
					blackl.push(inter.minuspoint(CROSSVIEWORIGIN).scale(-1,1).addpoint(CROSSVIEWORIGIN));
					gray.push(inter);
					grayl.push(inter.minuspoint(CROSSVIEWORIGIN).scale(-1,1).addpoint(CROSSVIEWORIGIN));
					
				} else {
					gray.push(p[j]);
					grayl.push(p[j].minuspoint(CROSSVIEWORIGIN).scale(-1,1).addpoint(CROSSVIEWORIGIN));
				}
				
			}
		}
		// console.log(gray);
		// console.log(black);
		if (black.length <= 1){
			// If segments only ended up in gray path, it's probably because they are actually all above the endclasp and thus should be drawn black
			drawshape(crossg, gray, NOFILLTHIN, "real-rib-back-r-black-"+i,false);
			drawshape(crossg, grayl, NOFILLTHIN, "real-rib-back-l-black-"+i,false);
		} else {
			drawshape(crossg, gray, GRAYSTYLE, "real-rib-back-r-gray-"+i,false);
			drawshape(crossg, grayl, GRAYSTYLE, "real-rib-back-l-gray-"+i,false);
			drawshape(crossg, black, NOFILLTHIN, "real-rib-back-r-black-"+i,false);
			drawshape(crossg, blackl, NOFILLTHIN, "real-rib-back-l-black-"+i,false);
		}
		
		// addelbefore(endclasp, drawshape(crossg, pl, NOFILLTHIN, "real-rib-back-l-"+i,false));
	}
	
	// console.log(crosspoints[0],crosspoints[crosspoints.length-1],rx,semic);
	// Draw cross section shape
	
	// Draw cross section at CROSSVIEWORIGIN. This draws the shell outline. Take alst points from previously gathered rib paths
	crosspoints.push(CROSSVIEWORIGIN.move(cps.width));
	crosspoints2.push(CROSSVIEWORIGIN.move(-cps.width));
	
	crosspoints.reverse();
	crosspoints = crosspoints.concat(crosspoints2);
	var crossshell = drawshape(crosslayer, crosspoints, THINSTYLE,"cross-section", true);
	addelbefore(crossg,crossshell);
	
	// Draw a semicircle for reference drawarc (c, p1, p2, rx,ry, xrot, largearc, sweep, style, id)
	var rx = linelength(crosspoints[0],crosspoints[crosspoints.length-1])/2;
	var semic = drawarc(crossg,crosspoints[0], getlast(crosspoints),rx,rx,0,0,0,GUIDESTYLE);
	
	// TODO: console.log body form coordinates at widest point as calculated by whatever draws cross-section and ribpaths.threedee
	// console.log("widest_i: ", findmax(flipsign(getpoints(currentbody.side,null, false).X)) );
	
		
}

function drawguitarback(){ // guitar back and side templates and 3d points

	var sidepoints = getpoints(currentbody.side, null, false); // Last parameter is debug
	
	var sidelayer = getelid("sidelayer");
	var midpoints = getpoints(currentbody.middle, sidepoints.Y, false, false);
	// console.log("midpoints",midpoints);
	sidepoints.X[0] = 0.0; // TODO: why does getpoints calculate the first point incorrectly?
	midpoints.X[0] = 0.0; // TODO: Also straight backs have errors
	
	var length= currentbody.side.getBBox().height;
	var depth = editorstate.guitardepth;
	var width = currentbody.side.getBBox().width * 2;
	var concavity = editorstate.guitarconcavity; // % of radius
	var taper = editorstate.guitartaper;
	var lastribadd = editorstate.lastribadd;
	var subribs = 10;
	var side_angle = 1.75  *radtodeg;
	// Do sub-ribs in rib loop using arc from displacement

	// TODO: do subrib calculation which maybe only gets used with 3D drawing and for drawing the cross section
	// TODO: subribs should also be used to calculate the rib template
	// TODO: more precision for body shape calculation at the rear end, and first point should not be theoretical height but rib height
	// TODO: What is that rising thing at the neck end?
	
	var widest_i = 0;
	var widest = 0;
	var highest_i = 0;
	var highest = 0;
	var highest_y = 0;
	var upperbout_i = 0;
	var upperbout_y = 0;
	var upperbout_x = 0;
	var waist_i = 0;
	var waist_y = 0;
	var waist_x = -width;
	for (var i=1; i<sidepoints.Y.length-1; i++){
		// Find lower, wider bout
		if (sidepoints.X[i] < widest) {
			widest_i = i;
			widest = sidepoints.X[i];
		}
		// Find highest point on ribs
		if (midpoints.X[i] < highest) {
			highest_i = i;
			highest = midpoints.X[i];
			highest_y = midpoints.Y[i];
		}
		// Find waist
		// if (i > widest_i && sidepoints.X[i] < sidepoints.X[i-1] && sidepoints.X[i] < waist_x){
		if (sidepoints.X[i-1] < sidepoints.X[i] && sidepoints.X[i] > sidepoints.X[i+1]){
			waist_i = i;
			waist_y = sidepoints.Y[i];
			waist_x = sidepoints.X[i];
		}
		// Find upper bout
		if (i > widest_i && sidepoints.X[i-1] > sidepoints.X[i] && sidepoints.X[i] < sidepoints.X[i+1]){
			upperbout_i = i;
			upperbout_y = sidepoints.Y[i];
			upperbout_x = sidepoints.X[i];
		}
	}
	// midpoints last value being zero causes too high z values in 3d body
	// TODO: attempted fix elsewhere, find and remove that
	midpoints.X[midpoints.X.length-1] = penult(midpoints.X);
	// console.log("sidepoints",sidepoints);
	// console.log("midpoints",midpoints);
	// console.log("waist",waist_i,"y:",waist_y,"x:",waist_x);
	// console.log("upper bout",upperbout_i,"y:",upperbout_y,"x:",upperbout_x);
	
	var backangle = editorstate.guitarangle * radtodeg;
	var rl = editorstate.guitarroundl;
	var rw = editorstate.guitarroundw; // Widthwise roundness
	var radius = rw + (width**2 - 4*rw**2)/(8*rw);
	
	var alpha = 2* Math.asin(0.5*(width+10-lastribadd)/radius); // +10mm to force last ribline outside of body. lastribadd can be used to negate this
	var arclength = alpha * Math.PI * radius;
	var ribwidth = arclength/editorstate.numberofribs;
	var ribangle = alpha/editorstate.numberofribs;
	console.log(width, rw, radius, alpha, arclength, ribwidth);
	
	function riblineh (r, i, subr){
		// return height and x coord precisely on ribline, given rib and index
		// r in ribs.angles[r] and i in midpoints.Y[i]
		var angle = ribs.angles[r];
		var newr = radius+(highest-midpoints.X[i]);
		
		if (editorstate.guitarroundw == 0 ){
			// TODO: concave ribs if no widthwise roundness?
			var x = ribs.endpoints[r].x + ((r+0.5)*taper/length)*midpoints.Y[i];
			
		} else {
			var x = newr*Math.sin(angle)+ ((r+0.5)*taper/length)*midpoints.Y[i];
			// if (!x) console.log("else", newr, highest, midpoints.X[i]);
		}
		
		var h = depth;
		if (editorstate.guitarroundl > 0) { // round back
			h -= midpoints.X[i];
		} else { // Straight, angled backs
			h += midpoints.Y[i] * Math.tan(backangle);
		}
		if (editorstate.guitarroundw > 0){
			h -= newr - newr*Math.cos(angle);
		}
		// if (!x) console.log("riblineh", r, midpoints.Y[i], h);
		return new Point(x, midpoints.Y[i], h);
	}
	
	function getheight(i, x){ // Get height of back given x,y coordinates as Point
		// This function uses indices in midpoints.Y[i]
		// TODO: rib number as optional input, to reduce looping
		// TODO: Returns high (startp?) value as last value sometimes
		if (editorstate.guitarroundw == 0){
			return new Point(x, midpoints.Y[i], riblineh (0, i).z);
		} else {
			var x = Math.abs(x);
			// Loop through ribs.angles to figure out which rib this point belongs on
			for (var r=0; r<ribs.angles.length; r++){
				// var newr = radius+(highest-midpoints.X[i]);
				// var xa = newr*Math.sin(ribs.angles[r]);
				// console.log("xa",xa,x);
				var p1 = riblineh(r,i);
				if (x < p1.x){ // stop at first ribline that is to the left of point
					if (r==0){ // center rib
						// console.log("center rib", p1.z);
						
						if (concavity > 0){
							var ra = (p1.x*(concavity**2+1)) / (2*concavity);
							var h = p1.z + (ra-concavity*p1.x)-Math.sqrt(ra**2-x**2);
						} else {
							var h = p1.z;
						}
						return new Point(x, midpoints.Y[i], h);
					} else { // other ribs
						var p2 = riblineh(r-1,i);
						if (concavity > 0){
							var ra = (concavity**2+1) / (4*concavity);
							var dx = p1.x-p2.x;
							var dy = p1.z-p2.z;
							var w = Math.sqrt(dx**2 + dy**2);
							// Circle center is at half of p1&p2, moved down by concavity, moved up by radius
							var midx = (p1.x+p2.x)/2 + (concavity*dy)/2;
							
							var xc = midx - ra*dy;
							var yc = (p1.z+p2.z)/2 - (concavity*dx)/2 + ra*dx;
							// if last rib and x is over centerline of this rib, make all flat
							if (r==ribs.angles.length-1 && x > midx){
								var midz = (p1.z+p2.z)/2 - (concavity*dx)/2;
								var m = (p2.z - p1.z)/(p2.x - p1.x);
								var h = m*(x-midx) + midz;
								
							} else { // else full concave
								var h = yc - Math.sqrt((ra*w)**2-(x-xc)**2);
							}
							
						} else {
							var h = ((p2.z - p1.z)/(p2.x - p1.x))*(x-p2.x) + p2.z;
						}
						return new Point(x, midpoints.Y[i], h);
					}
				}
			}
			// last rib or actually outside of last rib
			// console.log("last rib");
			var p1 = riblineh(ribs.angles.length-1,i);
			var p2 = riblineh(ribs.angles.length-2,i);
			var h = ((p2.z - p1.z)/(p2.x - p1.x))*(x-p2.x) + p2.z;
			
			// if concave ribs
			// Beyond last rib should be completely flat towards edge
			if (concavity > 0){
				// Calculate drop caused by concavity, as perfect circle arc dangled between riblines
				// same drop everywhere...
				// TODO: Not exactly correct
				
				var dx = p1.x-p2.x;
				var dy = p1.z-p2.z;
				var midx = (p1.x+p2.x)/2 + (concavity*dy)/2;
				// var w = Math.sqrt(dx**2 + dy**2);
				var midz = (p1.z+p2.z)/2 - (concavity*dx)/2;
				var m = (p2.z - p1.z)/(p2.x - p1.x);
				var h = m*(x-midx) + midz;
			}
			
			
			// console.log("last rib getheight");
			return new Point(x, midpoints.Y[i], h);
			// console.log("getheight didn't find a rib",i,x);
			// drawcircle(getelid("frontview"), FRONTVIEWORIGIN.move(-x,midpoints.Y[i]),1,REDSTYLE);
			// return new Point(x, midpoints.Y[i], 0);
		}
	}
	
	// Draw cross section at CROSSVIEWORIGIN. This draws the shell outline
	var crossg = makegroup(crosslayer, "cross-section-half");
	var t = "translate("+CROSSVIEWORIGIN.x+","+CROSSVIEWORIGIN.y+")";
	crossg.setAttribute("transform",t);
	
	var origin = new Point(0,0);
	var cp = origin.move(0, depth);
	drawline(crossg, [origin, cp], COMPARESTYLE); // Middle line
	
	var leftsp = origin.move(-width/2);
	var lefttop = origin.move(-width/2,depth);
	var rightsp = origin.move(width/2);
	var righttop = origin.move(width/2,depth);
	
	// drawshape(crossg, [lefttop,leftsp,rightsp,righttop], GREENSTYLE);
	
	// Highest/deepest point is depth + lengthwise roundness - effect of back angle
	var topp = cp.move(0,rl-0.5*length*Math.tan(backangle));
	// drawcircle(crossg,topp,1,REDSTYLE);
	var ltopp = new Point(leftsp.x, topp.y-rw);
	var rtopp = new Point(rightsp.x, topp.y-rw);
	var bottomarc = [rtopp].concat(arclinedev(rtopp,ltopp,rw, true, 5));
	
	// Bottom arc at highest point
	// drawshape(crossg, bottomarc, GREENSTYLE, false,false);
	
	// Split bottom arc into ribs and subribs, if concave
	// alpha/editorstate.numberofribs
	var ribs = {centerpoint:new Point(0,0), angles:[], endpoints:[], shapes:[], inters:[],/* extrashapes:[], */ subangles:[], subshapes:[]};
	for (var i=0; i<editorstate.numberofribs/2; i++){
		var a = ribangle/2 + ribangle*i;
		if (editorstate.guitarroundw == 0){
			// Can't use angles on a flat back to determine rib locations
			// var p = topp.move(radius*Math.sin(a),radius*Math.cos(a)-radius);
			var p = new Point(((width-lastribadd)/editorstate.numberofribs)*(0.5+i), depth);
			// TODO: lastribadd here does not produce exactly the same change as for angles
			// console.log("angleless rib points",p);
		} else {
			var p = topp.move(radius*Math.sin(a),radius*Math.cos(a)-radius);
		}
		
		if (concavity > 0){ // sub rib angles for concave ribs
			var sa = [];
			if (i==0){
				for (var s = 0; s <subribs/2; s++){
					sa.push( ribangle*(s/subribs)  );
				}
			} else {
				for (var s = 0; s <subribs; s++){
					sa.push(a-ribangle + ribangle*(s/subribs) );
				}
			}
			ribs.subangles.push(sa);
		}
		
		
		ribs.angles.push(a);
		ribs.endpoints.push(p);
		ribs.shapes.push([]); // rib lines
		// ribs.subshapes.push([]); // subrib lines and rib lines
		// ribs.extrashapes.push([]); // side points before and after rib lines
		ribs.inters.push([]);
		// drawcircle(crossg,p,0.5,REDSTYLE);
	}
	// console.log("subRibs angles",ribs.subangles);
	
	/////////////////////////////////////////////////////
	// Calculate side templates
	// spread soundboard edge distances, intersect all ribs with side to get top
	var greatest_offset = Math.sin(side_angle)*(widest);
	var edge = [new Point(0,0)]; // edge touching soundboard
	var edge_angled = [new Point(0,-greatest_offset)]; // edge touching soundboard
	var edge_dip = [new Point(0,0)]; // edge touching soundboard
	var topedge = [new Point(0,depth)]; // edge touching ribs
	var topedge_angled = [new Point(0,depth-greatest_offset)];
	var fp = getheight(0, 0); // riblineh (0, 0, 1);
	var edge3d = [new Point(-fp.x, fp.y, fp.z)];
	
	var ribends = []; // TODO: Drawn as little lines on side template
	
	var rremainder = radius - rw;
	// console.log(rremainder);
	
	function soundboard_dip (y){
		// console.log(y);
		if (y < sidepoints.Y[widest_i] && y > upperbout_y){
			// console.log(1.5+1.5*Math.cos((2*(y-sidepoints.Y[widest_i])*Math.PI)/(upperbout_y-sidepoints.Y[widest_i]) - Math.PI));
			return 1.5+1.5*Math.cos((2*(y-sidepoints.Y[widest_i])*Math.PI)/(upperbout_y-sidepoints.Y[widest_i]) - Math.PI);
		} else {
			return 0;
		}
	}
	var sideg = makegroup(getelid("flatribs-layer"), "guitar-side-flattened");
	var t = "translate("+0+","+(-200)+")";
	sideg.setAttribute("transform",t);
	
	// TODO: Just draw straight single line for soundboard edge
	for (var i=1; i<sidepoints.Y.length; i++){
		var d = Math.sqrt((sidepoints.Y[i]-sidepoints.Y[i-1])**2 + (sidepoints.X[i]-sidepoints.X[i-1])**2);
		// console.log(i,sidepoints.X[i]);
		var p = getheight(i,sidepoints.X[i]);
		var a = -Math.sin(side_angle)*(widest-p.x);
		var dip = soundboard_dip(sidepoints.Y[i]);
		edge.push(getlast(edge).move(d));
		edge_angled.push(getlast(edge).move(0,a+dip));
		edge_dip.push(getlast(edge).move(0,dip));
		topedge.push(getlast(edge).move(0,p.z));
		topedge_angled.push(getlast(topedge).move(0,a));
		edge3d.push(new Point(sidepoints.X[i], sidepoints.Y[i], p.z));
		
		if (sidepoints.X[i] < widest) {
			widest_i = i;
			widest = sidepoints.X[i];
		}
		if (midpoints.X[i] < highest) {
			highest_i = i;
			highest = midpoints.X[i];
		}
		
	}
	
	var arcdepth = highest-radius; // Center of widthwise arc
	
	
	//////////////////////////////////////////////////////////////////
	// Intersect each rib with side shape
	// Each rib is the same shape, just angled differently...
	// Each rib arc has a lengthwise center point and a widthwise center point, and perhaps an extra scallop center point
	
	for (var r=0; r < ribs.angles.length-1; r++){
		var ribshape = [];
		var siderib = [];
		var frontrib = [];
		
		for (var i=0; i < midpoints.Y.length; i++){
			// For each rib, find all intersections with Y points
			var p = riblineh(r,i);
			ribs.shapes[r].push(new Point(-p.x,midpoints.Y[i],p.z));
			ribshape.push(new Point(p.x,p.z));
			siderib.push(new Point(-p.z,midpoints.Y[i]));
			frontrib.push(FRONTVIEWORIGIN.move(-p.x,midpoints.Y[i]));
		}
		// drawshape(crossg, ribshape, REDSTYLE, false, false);
		// drawshape(cg, siderib, THINSTYLE, false, false);
		// drawshape(getelid("frontview"), frontrib, THINSTYLE, false, false);
	}
	// console.log("rib shapes", ribs.shapes);
	// If ribs are concave add subribs, which contain valley shape to the left of the ribline r
	for (var r=0; r < ribs.angles.length; r++){
		if (concavity > 0){
			if (r==0){
				var jend = parseInt(subribs/2);
			} else {
				var jend = subribs;
			}
			var sa = [];
			for (var j = 1; j < jend; j++){
				var subribshape = [];
				var subrib = [];
				// console.log("subrib", r, j );
				for (var i=0; i < ribs.shapes[0].length; i++){
					// Get x coordinate by weighed average between main ribs
					if (r==0){
						var x = ribs.shapes[r][i].x * (j/jend);
					} else if (r==ribs.angles.length-1) {
						var x = ribs.shapes[ribs.shapes.length-2][i].x + (widest - ribs.shapes[ribs.shapes.length-2][i].x) * (j/jend);
					} else {
						var x = ribs.shapes[r-1][i].x + (ribs.shapes[r][i].x - ribs.shapes[r-1][i].x) * (j/jend);
					}
					
					// var p = riblineh(r,i,j);
					var p = getheight(i, x);
					subrib.push(new Point(-p.x, p.y, p.z));
					subribshape.push(new Point(p.x,p.z));
				}
				ribs.subshapes.push(subrib);
				// drawshape(crossg, subribshape, BLUESTYLE, false, false);
			}
			// Then main rib
			var subrib = [];
			if (r < ribs.angles.length-1){ // Would make points at normal rib height
				for (var i=0; i < ribs.shapes[0].length; i++){
					var p = riblineh(r,i);
					subrib.push(new Point(-p.x,p.y, p.z));
				}
			} else {
				for (var i=0; i < ribs.shapes[0].length; i++){
					var p = getheight(i, widest);
					subrib.push(new Point(-p.x,p.y, p.z));
				}
			}
			ribs.subshapes.push(subrib);	
		}
	}
	// TODO: Last subrib gives points with too high z
	// console.log("ribs.subshapes", ribs.subshapes);
	
	// console.log("rib shapes",ribs.shapes);
	var sideinters = [];
	// for (var r=0; r < ribs.shapes.length; r++){
	function cull_shape (ribshape, r, dosideinters){
		var outshape = [];
		var intersections = [];
		for (var i=1; i < ribshape.length; i++){
			// Does this segment intersect side shape?
			var dist = 0 ;
			for (var j=1; j < sidepoints.Y.length; j++){
				var d = Math.sqrt((sidepoints.Y[j]-sidepoints.Y[j-1])**2 + (sidepoints.X[j]-sidepoints.X[j-1])**2);
				
				var inter = intersectline( // Exact point in frontview
							ribshape[i-1],ribshape[i],
							new Point(sidepoints.X[j-1], sidepoints.Y[j-1]),
							new Point(sidepoints.X[j], sidepoints.Y[j]));
				if (inter) {
					// TODO: intersect in y,z to get exact height
					var dr = (inter.y-sidepoints.Y[j-1])/(sidepoints.Y[j]-sidepoints.Y[j-1]);
					var h = ribshape[i-1].z +dr*(ribshape[i].z -ribshape[i-1].z);
					var sp = new Point(dist+dr*d, h);
					intersections.push(new Point(inter.x, inter.y,h));
					// drawcircle(cg, new Point(-ribshape[i].z, inter.y),1,REDSTYLE);
					// drawcircle(crossg, new Point(-inter.x,ribshape[i].z),1,REDSTYLE);
					// drawcircle(getelid("frontview"), FRONTVIEWORIGIN.move(inter.x,inter.y),1,REDSTYLE);
					
					sideinters.push(sp);
					if (dosideinters) { // Draw rib-side intersections on side template
						drawline(sideg, [sp, sp.move(0,-5)], THINSTYLE);
					}
					
					// TODO: Height is still incorrect. Do same as for d?
					// console.log("side intersection ",inter);
				}
				dist += d;
			}
		}
		// Remove points from rib shapes that are outside the intersections and replace them with points from the side shape
		for (var i=0; i < ribshape.length; i++){
			// if before first inter, and after first inter of prev rib, replace with sidep
			// else delete 
			// if after last inter, and before last inter of prev rib, replace sidep
			// else delete
			
			var p = ribshape[i];
			if (tempinters) {
				// If inside previous rib's intersections
				if (p.y < tempinters[0].y && p.y > getlast(tempinters).y) {
					// console.log("inside previous rib's intersections",r,i)
					if (p.y < intersections[0].y && p.y > getlast(intersections).y ) {
						if (intersections.length > 2 && p.y > intersections[2].y && p.y < intersections[1].y){
							outshape.push(null);
							
						} else {
							outshape.push(p.scale(-1,-1,1));
						}
					}
				
				} else {
					// delete point
					outshape.push(null);
				}
			} else { // First rib
				if (p.y < intersections[0].y && p.y > getlast(intersections).y ) {
					outshape.push(p.scale(-1,-1,1));
				} 
			}
		}
		
		// Insert exact rib intersections to tempshapes
		for (var i=0; i < intersections.length; i++){
			for (var j=1; j < outshape.length; j++){
				if (!outshape[j-1] && outshape[j]
				 && -intersections[i].y < outshape[j].y){
					outshape.splice(j,0,intersections[i].scale(-1,-1,1));
					// console.log("added intersection after",i,j,intersections[i]);
					break;
					
				} else if (outshape[j-1] && !outshape[j]
				 && -intersections[i].y > outshape[j-1].y
				 && -intersections[i].y < outshape[j-1].y+5){
					outshape.splice(j,0,intersections[i].scale(-1,-1,1));
					// console.log("added intersection before",i,j,intersections[i]);
					break;
				} 
			}
		}
		return {outshape:outshape, inters:intersections};
	}
	// remove outside points - insert intersections
	var tempinters = null;
	var tempshapes = [];
	for (var r=0; r < ribs.shapes.length; r++){
		var shape = cull_shape(ribs.shapes[r], tempinters, true);
		// console.log(r, shape);
		tempshapes.push(shape.outshape);
		// ribs.inters = ribs.inters.concat(shape.inters);
		ribs.inters = ribs.inters.concat(shape.inters);
		tempinters = shape.inters;
	}
	// same for subrib shapes
	var tempinters = null;
	var tempsubshapes = [];
	for (var r=0; r < ribs.subshapes.length; r++){
		var shape = cull_shape(ribs.subshapes[r], tempinters, false);
		// console.log(r, shape);
		tempsubshapes.push(shape.outshape);
		tempinters = shape.inters;
		if (r < subribs){
			ribs.inters = ribs.inters.concat(shape.inters);
		}
		
	}
	
	// console.log("edge3d",edge3d);
	// console.log("ribs.inters",ribs.inters);
	// Insert exact rib intersections to flattened side shape and cross view
	// First organize intersections into a flat list
	var flatlist = ribs.inters;
	flatlist.sort(function(a,b){
		return b.y - a.y;
	});
	// console.log("flatlist",flatlist);
	var jstart = 1;
	for (var i=0; i < flatlist.length; i++){
		for (var j=jstart; j < edge3d.length; j++){
			if (flatlist[i].y < edge3d[j-1].y && flatlist[i].y > edge3d[j].y){ //negative y
				edge3d.splice(j,0,flatlist[i]);
				// console.log("put",flatlist[i], "after",edge3d[j-1]);
				jstart = j; // No need to start from 0 every time since flatlist is ordered
				break;
			}
		}
	}
	
	// Draw back edge on crossview and sideview
	var crossedge = [];
	var crossedge2 = []; // after widest point, gray
	var crossedger = [];
	var crossedge2r = []; // after widest point, gray
	var sideedge = [];
	var sideshape3d = []; // output as soundboard edge. x,y coords mirrored to positive space
	for (var i=0; i<edge3d.length; i++){
		if (i < widest_i) {
			crossedge.push(new Point(-edge3d[i].x, edge3d[i].z));
			crossedger.push(new Point(edge3d[i].x, edge3d[i].z));
		} else {
			crossedge2.push(new Point(-edge3d[i].x, edge3d[i].z));
			crossedge2r.push(new Point(edge3d[i].x, edge3d[i].z));
		}
		sideedge.push(new Point(-edge3d[i].z, edge3d[i].y));
		sideshape3d.push(new Point(-edge3d[i].x,-edge3d[i].y,edge3d[i].z ));
	}
	// console.log("guitar side", edge3d);
	crossedge.push(crossedge2[0]); // Add point to avoid gap in line
	crossedger.push(crossedge2r[0]);
	drawshape(crossg, crossedge, THINSTYLE, false, false);
	drawshape(crossg, crossedge2, GRAYSTYLE, false, false);
	drawshape(crossg, crossedger, THINSTYLE, false, false);
	drawshape(crossg, crossedge2r, GRAYSTYLE, false, false);
	
	var cg = makegroup(getelid("sideview"), "guitar-side-calculated");
	var t = "translate("+SIDEVIEWORIGIN.x+","+SIDEVIEWORIGIN.y+")";
	cg.setAttribute("transform",t);
	drawshape(cg, sideedge, THINSTYLE, false, false);
	
	// Draw upper and lower bouts on the cross view
	var lefttop = new Point(-width/2,getheight(widest_i,width/2 ).z);
	var righttop = new Point(width/2,lefttop.y);
	drawshape(crossg, [lefttop,leftsp,rightsp,righttop], THINSTYLE,false,false);
	drawline(crossg, [new Point(upperbout_x,0),new Point(upperbout_x, getheight(upperbout_i,upperbout_x).z)], GRAYSTYLE);
	drawline(crossg, [new Point(-upperbout_x,0),new Point(-upperbout_x, getheight(upperbout_i,upperbout_x).z)], GRAYSTYLE);
	
	
	// Group for bottom view
	var bottomg = makegroup(getelid("drawinglayer"), "bottomview");
	var t = "translate("+BOTTOMVIEWORIGIN.x+","+BOTTOMVIEWORIGIN.y+")";
	bottomg.setAttribute("transform",t);
	var sidesh = [];
	var sidesh2 = [];
	for (var i=0; i < sidepoints.Y.length; i++){
		sidesh.push(new Point(sidepoints.X[i], sidepoints.Y[i]));
		sidesh2.push(new Point(-sidepoints.X[i], sidepoints.Y[i]));
	}
	
	drawshape(bottomg, sidesh, THINSTYLE, false, false);
	drawshape(bottomg, sidesh2, THINSTYLE, false, false);
	// Draw ribs
	ribs.shapes = tempshapes;
	var ribtops = [];
	var ribtopsl = [];
	for (var r=0; r < ribs.shapes.length; r++){
		var ribshape = [];
		var ribshapegray = [];
		var ribshapel = [];
		var ribshapegrayl = [];
		
		var siderib = [];
		var frontrib = [];
		var frontrib2 = [];
		var hiest;
		for (var i=0; i < ribs.shapes[r].length; i++){
			var p = ribs.shapes[r][i];
			if (p){
				/* if (-p.y == highest_y) {
					ribtops.push(new Point(p.x,p.z));
					ribtopsl.push(new Point(-p.x,p.z));
					} */
				if (-p.y < highest_y) {
					ribshapegray.push(new Point(p.x,p.z));
					ribshapegrayl.push(new Point(-p.x,p.z));
				} else {
					ribshape.push(new Point(p.x,p.z));
					ribshapel.push(new Point(-p.x,p.z));
					hiest = p;
				}
				siderib.push(new Point(-p.z,-p.y));
				frontrib.push(new Point(-p.x,-p.y));
				frontrib2.push(new Point(p.x,-p.y));
			} else {
				siderib.push(null);
				frontrib.push(null);
				frontrib2.push(null);
				ribshapegray.push(null);
				ribshapegrayl.push(null);
				ribshape.push(null);
				ribshapel.push(null);
			}
		}
		if (hiest && r < ribs.shapes[r].length){
			// check for last rib, because otherwise it's doubled in ribtops
			ribtops.push(new Point(hiest.x,hiest.z));
			ribtopsl.push(new Point(-hiest.x,hiest.z));
		}
		
		// console.log("rib shape ",r, frontrib);
		drawshape(crossg, ribshapegray, GRAYSTYLE, false, false);
		drawshape(crossg, ribshape, THINSTYLE, false, false);
		drawshape(crossg, ribshapegrayl, GRAYSTYLE, false, false);
		drawshape(crossg, ribshapel, THINSTYLE, false, false);
		
		drawshape(cg, siderib, THINSTYLE, false, false);
		drawshape(bottomg, frontrib, THINSTYLE, false, false);
		drawshape(bottomg, frontrib2, THINSTYLE, false, false);
	}
	// bottom shape on crossview
	// TODO: Get highest point of each ribline, not same i on each
	ribtopsl.push(lefttop);
	ribtops.push(righttop);
	ribtopsl.reverse();
	ribtopsl = ribtopsl.concat(ribtops);
	if (concavity > 0 ){
		// Scalloped ribs, draw as arcs
		var nribs = [lefttop];
		var sc = concavity;
		
		for (var i=1; i<ribtopsl.length; i++){
			
			var w = linelength(ribtopsl[i-1],ribtopsl[i]) / 2;
			nribs=nribs.concat(arclinedev(ribtopsl[i-1],
										 ribtopsl[i], sc*w, true, 3));
			
		}
		// console.log("crossg", nribs);
		drawshape(crossg, nribs, THINSTYLE, false, false);
		// drawshape(crossg, ribtopsl, THINSTYLE, false, false);
	} else {
		drawshape(crossg, ribtopsl, THINSTYLE, false, false);
	}
	// console.log("ribs.inters",ribs.inters);
	// Insert exact rib intersections to flattened side shape and cross view
	for (var i=0; i < sideinters.length; i++){
		for (var j=1; j < topedge.length; j++){
			if (sideinters[i].x > topedge[j-1].x && sideinters[i].x < topedge[j].x){
				topedge.splice(j,0,sideinters[i]);
				
				break;
			}
		}
	}
	// Make a copy of side pattern with side angle applied
	
	
	topedge[0].y = topedge[1].y;
	edge3d[0].z = edge3d[1].z;
	topedge.push(getlast(edge));
	topedge.push(edge[0]);
	// console.log("topedge",topedge);
	// console.log("edge3d",edge3d);
	// console.log("widest_i",widest_i);
	
	makefirst(drawshape(sideg, topedge, RIBSTYLE, false, true));
	
	
	drawshape(sideg, topedge_angled, REDSTYLE, false, false);
	drawshape(sideg, edge_angled, REDSTYLE, false, false);
	drawshape(sideg, edge_dip, BLUESTYLE, false, false);
	// console.log("ribs",ribs);
	
	
	lute3d.sidepoints = flipsign(sidepoints.X);
	lute3d.midpoints = flipsign(midpoints.X);
	lute3d.Ypoints = flipsign(sidepoints.Y);
	lute3d.widest_i = widest_i;
	
	lute3d.ribpaths = {};
	// lute3d.ribpaths.threedee = ribs3d;
	lute3d.ribpaths.threedee = ribs.shapes;
	lute3d.ribpaths.threedee_valleys = tempsubshapes;
	lute3d.ribpaths.angles = ribs.angles;
	lute3d.ribpaths.subangles = ribs.subangles;
	lute3d.ribpaths.soundboard_edge = sideshape3d;
	lute3d.ribpaths.Ypoints = lute3d.Ypoints;
	// console.log("threedee",lute3d.ribpaths.threedee);
	// draw_rib_templates ();
}

function draw_endclasp (){
	// console.log("drawing endclasp");
	// Intersect body to get end clasp shape
	
	
	// TODO: Move this calculation (deciding corner position) to where the rib angles are decided, so that it will be possible to make non-converging rib layouts. 
	
	var g = getelid("cross-section-half");
	var shape = lute3d.ribpaths.threedee;
	var offsets = lute3d.ribpaths.offsets; 
	var soundboard = lute3d.ribpaths.soundboard_edge;
	var mo = offsets[findmax(offsets)];
	var clasph = 45;
	if (lute3d.ribpaths.threedee[0][lute3d.widest_i].z < 130) {
		// On tiny instruments, make endclasp smaller
		clasph = lute3d.ribpaths.threedee[0][lute3d.widest_i].z * 0.35;
	}
	
	var endh = 35;
	var claspback = [new Point(0, -clasph).addpoint(CROSSVIEWORIGIN)];
	var claspbackl = [];
	var flatribs = getelid("flatribs-layer");
	var sideview = getelid("sideview");
	
	var clasp3D = []; // unflattened for 3d view, expanded by 1mm along surface normal
	var cornerrib;
	/* lute3d.ribs.cornerrib */
	
	// Find first rib with intersection with clasp that is close enough to center
	for (var i=shape.length-2; i>0; i--){
		var zj = 1;
		while(shape[i][zj].z <= clasph  &&  zj < lute3d.widest_i ){
			zj++;
		}
		if (shape[i][zj].x < cps.width*0.5){
			// console.log(i,zj,shape[i][zj].x,cps.width*0.3);
			break;
		} 
	}	
		
	// }
	// Intersect segment to find exact x position at z=45
	var p1 = new Point(shape[i][zj].x, shape[i][zj].z);
	// if (shape[i][zj-1] === undefined) break; // Sometimes this is undefined and will stop execution, but we can just use the last saved intersection just fine
	var p2 = new Point(shape[i][zj-1].x, shape[i][zj-1].z);
	var ix = p2.x+((p2.y-clasph)*(p1.x-p2.x))/(p2.y-p1.y);
	
	cornerrib = i;
	
	// var ix = cps.width * 0.4 ;
	ix = Math.abs(ix);
	if (ix < cps.width*0.3) ix = cps.width * 0.45 ;
	// console.log("clasph",clasph,cornerrib , ix);
	// Corner top point
	claspback.push(new Point(ix, -clasph).addpoint(CROSSVIEWORIGIN));
	claspbackl.push(new Point(-ix, -clasph).addpoint(CROSSVIEWORIGIN)
			.relbezier(-2,4.5, 0,3));
			
	// flatclasp.push(new Point(ix, -clasph));
	// Corner small round bit
	claspback.push(getlast(claspback).move(7,5).relbezier(-7,-2,-5,-0.5));
	claspbackl.push(getlast(claspbackl).move(-7,5));
	
	// Last point on cross section view
	claspback.push(new Point(cps.width,-clasph*0.5).addpoint(CROSSVIEWORIGIN));
	if (clasph>=45)getlast(claspback).relbezier(-30,-15,-5,-9);
	
	// // Draw bezier in different order on left side, since it will be flipped
	var ep = new Point(-cps.width,-clasph*0.5).addpoint(CROSSVIEWORIGIN);
	if (clasph>=45){
		var cp1 = ep.move(30,-15);
		var cp2 = ep.move(5,-9);
		claspbackl[claspbackl.length-1] = getlast(claspbackl).bezier(cp2,cp1);
	}
	
	claspbackl.push(ep);
	
	// Finally close shape at soundboard edge
	claspback.push(new Point(cps.width+0.5,0).addpoint(CROSSVIEWORIGIN));
	claspbackl.push(new Point(-cps.width-0.5,0).addpoint(CROSSVIEWORIGIN));

	// Add left side to endclasp
	claspbackl.reverse();
	claspback = claspbackl.concat(claspback);
	var endclasp = drawshape(g, claspback, COVERSTYLE,"endclasp-back", true);
	
	
	
	///////////////////////////////////////////////////////////////////////////
	// Do endclasp flattening only if requested
	if (editorstate.drawingpurpose && editorstate.drawingpurpose.startsWith("technical")) {
	// flatclasp.push(getlast(flatclasp).move(7,5).relbezier(-7,-2,-5,-0.5));
	
	// Find rest of endclasp by intersecting a plane with the lute shape
	// Find where each ribline intersects the plane
	var inters = [];
	var bottoms = [];
	var end = lute3d.ribpaths.Ypoints[lute3d.widest_i]*0.85-30; // end of clasp, almost
	
	// refine end coordinate to hit a Ypoint
	for (var i=0; i< lute3d.widest_i; i++){
		if (lute3d.ribpaths.Ypoints[i] > end){
			end = lute3d.ribpaths.Ypoints[i];
			break;
		}
	}
	// console.log("end",end);
	var endh = 27;
	var c1H = new Point(0,clasph);
	var c1L = new Point(0,clasph-4);
	var c2H = new Point(end, clasph-1);
	var c2L = new Point(end, endh);
	for (var r=0; r<shape.length; r++){
		// console.log("r=",r);
		for (var i=1; i<=lute3d.widest_i; i++){
			// console.log("i=",i);
			var p1 = new Point(shape[r][i-1].y, shape[r][i-1].z);
			var p2 = new Point(shape[r][i].y, shape[r][i].z);
			// find y,z coordinates
			var inter;
			if (r <= cornerrib){
				inter = intersectline(c1H,c2H,	p1,p2);
			} else {
				inter = intersectline(c1L,c2L,	p1,p2);
			}
			
			if (inter){
				// Find x coordinate
				
				var xp = (inter.x-shape[r][i-1].y)*(shape[r][i].x-shape[r][i-1].x)/(shape[r][i].y-shape[r][i-1].y) + shape[r][i-1].x;
				
				inters.push(new Point(xp, inter.x, inter.y));
				
				// X location at this Y on side shape
				var ii = 1;
				// Find suitable segment of soundboard edge to intersect
				if (xp < cps.width*0.7){
					while(soundboard[ii].x <= xp){
						ii++;
					}
				} else {
					while(soundboard[ii].y <= inter.x){
						ii++;
					}
				}
				
				
				// Intersect to be more accurate
				var yp = (xp-soundboard[ii-1].x)*(soundboard[ii].y-soundboard[ii-1].y)/(soundboard[ii].x-soundboard[ii-1].x) + soundboard[ii-1].y;
				
				bottoms.push(new Point(xp,yp,0));
				// console.log(ii, xp, yp);
			}
		}
	}
	// TODO: Add points between riblines
	// console.log(inters);
	// console.log(bottoms);
	// Remove intersection after cornerrib if it is too close
	if (inters[cornerrib+1] !==undefined && inters[cornerrib+1].x <= inters[cornerrib].x+7){
		inters.splice(cornerrib+1, 1);
		bottoms.splice(cornerrib+1, 1);
	}
	
	// Draw for debug 
	// for (var i=0; i<inters.length; i++){
		// drawcircle(getelid("crosslayer"), new Point(inters[i].x,-inters[i].z).addpoint(CROSSVIEWORIGIN), 1, GREENSTYLE, "endclasp-inter-cross-"+i);
		// drawcircle(getelid("sideview"), new Point(-inters[i].z,-inters[i].y).addpoint(SIDEVIEWORIGIN), 1, GREENSTYLE, "endclasp-inter-side-"+i);
		// if (i > cornerrib+1){
			// claspback.push(new Point(inters[i].x,-inters[i].z).addpoint(CROSSVIEWORIGIN));
			// claspbackl.push(new Point(-inters[i].x,-inters[i].z).addpoint(CROSSVIEWORIGIN));
		// }
	// }
	
	
	// for (var i=0; i<bottoms.length; i++){
		// drawcircle(getelid("crosslayer"), new Point(bottoms[i].x,-bottoms[i].z).addpoint(CROSSVIEWORIGIN), 1, BLUESTYLE, "endclasp-inter-cross-bot-"+i);
		
		// drawcircle(getelid("sideview"), new Point(-bottoms[i].z,-bottoms[i].y).addpoint(SIDEVIEWORIGIN), 1, BLUESTYLE, "endclasp-inter-side-bot-"+i);
		
	// }
	
	// Start flattening the endclasp
	if (inters.length < 5) {
		console.log("Unable to flatten endclasp shape because there are not enough full ribs under it.");
		return endclasp;
	}
	// Add start point which is current first point but with x=0
	inters.unshift(new Point(0, inters[0].y, inters[0].z));
	bottoms.unshift(new Point(0, bottoms[0].y, bottoms[0].z));
	
	// If any points are beyond start of endclasp end fancyness, remove
	for (var i=inters.length-1; i>0; i--){
		if (inters[i].y >= end){
			inters.pop();
			bottoms.pop();
		}
	}
	
	// Finally calculate 2D points from 3D points to create flattened endclasp template
	var flatg = makegroup(flatribs,"endclasp-flat-template-group");
	var tp,bp;
	var flatclasp = [new Point(0, linelength(bottoms[0], inters[0]))];
	var flatbottom = [new Point(0,0)]; // the soundboard edge of the endclasp
	var flatbottom2 = []; 
	for (var i=1; i<inters.length; i++){
		
		if (inters[i].y <= end ){
		// Distance from top point and bottom point to next top point
		var Tl = linelength(inters[i-1], inters[i]);
		var Bl = linelength(bottoms[i-1], inters[i]);
		var Tc = new Circle(flatclasp[i-1], Tl);
		var Bc = new Circle(flatbottom[i-1], Bl);
		var nT = intersect_circle(Tc,Bc); // Next top point coordinates, choose right one
		
		if (nT[0].x > nT[1].x){
			Tp = nT[0]; 
		} else {
			Tp = nT[1]; 
		}
		flatclasp.push(Tp);
		
		// Distances to bottom next point
		var Tl = linelength(inters[i-1], bottoms[i]);
		var Bl = linelength(bottoms[i-1], bottoms[i]);
		var Tc = new Circle(flatclasp[i-1], Tl);
		var Bc = new Circle(flatbottom[i-1], Bl);
		var nB = intersect_circle(Tc,Bc); // Next top point coordinates, choose right one
		
		if (nB[0].x > nB[1].x){
			Tp = nB[0]; 
		} else {
			Tp = nB[1]; 
		}
		// drawX(flatg, Tp.scale(1,-1), 3, REDSTYLE);
		flatbottom.push(Tp);
		flatbottom2.push(Tp.scale(-1,1));
		}
	}	
	
	// Add round bit after cornerrib, add a point 
	var bez = flatclasp[cornerrib+1].move(7,-5.5).relbezier(-7,2,-5,0.5);
	flatclasp.splice(cornerrib+2,0, bez);
	// After the true flat shape has been found, remove intermediate points to get straigth lines
	flatclasp.splice(1,cornerrib); // just the top part
	flatclasp[0].y = flatclasp[1].y; // Make line horizontal
	
	// Add fancy end to to the endclasp
	var endp = new Point(end,endh);
	var lastp = new Point(getlast(inters).y, getlast(inters).z);
	// Distance from last point to end point
	var dE = linelength(lastp, endp);
	// Angle from flattened last two points
	var aE = -Math.abs(getangle(flatclasp[flatclasp.length-2], getlast(flatclasp)));
	var Ef = getlast(flatclasp).movedist(-dE, aE);
	flatclasp.push(Ef);
	
	var ep = Ef.move(-20*Math.sin(aE), 14*Math.sin(aE));
	var cp1 = ep.move(27*Math.sin(aE), -7*Math.sin(aE));
	var cp2 = ep.move(25*Math.sin(aE), 8*Math.sin(aE));
	ep = ep.bezier(cp1,cp2)
	flatclasp.push(ep);
	// console.log(ep);
	// Last endclasp point touching soundboard
	var fp = ep.move(-10*Math.sin(aE), 11*Math.sin(aE));
	var bepa = trueangle(ep, fp);
	flatbottom.push(fp);
	flatbottom2.push(fp.scale(-1,1));
	// Find endpoint for straight bottom
	var bep = intersectline(fp,ep,new Point(0,0), new Point(10,0), true);
	flatclasp.push(bep);
	
	// Draw flat endclasp template
	flatbottom2.reverse();
	flatbottom = flatbottom2.concat(flatbottom);
	// flatclasp = flatbottom.concat(flatclasp);
	for (var i=0; i<flatbottom.length; i++){
		flatbottom[i] = flatbottom[i].scale(1,-1);
	}
	drawshape(flatg, flatbottom, GUIDESTYLE,"endclasp-flat-bottom", false);
	
	flatclasp.push(new Point(0,0));
	for (var i=0; i<flatclasp.length; i++){
		flatclasp[i] = flatclasp[i].scale(1,-1);
	}
	// console.log(flatclasp);
	
	var endclasp2 = drawshape(flatg, flatclasp, THINSTYLE,"endclasp-flat", true);
	for (var i=0; i<flatclasp.length; i++){
		flatclasp[i] = flatclasp[i].scale(-1,1);
	}
	var endclasp3 = drawshape(flatg, flatclasp, THINSTYLE,"endclasp-flat-left", true);
	// console.log("here ends");
	}
	return endclasp;
}



function neckjoint_3D (points) { // Calculate and draw neck joint and neck block 
	// Find neck joint shape based on ribjoints that have already been calculated
	// console.log(points);
	// TODO: write neck angle
	
	// points contains rib joint points for all ribjoints:
	// Array [ Array[108], Array[108], Array[108], Array[106] ]
	// in which Array[ ] = {x,y,z}
	var p = editorstate.bulge; // bulging of circle editorstate.bulge
	var nbo = NECKBLOCKORIGIN.move(0,-500); //-Ypoints[Ypoints.length-1]);
	var crosslayer = getelid("crosslayer");
	var frontview = getelid("frontview");
	var neckblock = makegroup(crosslayer, "neckblock-group");
	var jointangle = cps.neckjoint_angle;
	var jointlength = cps.neckjoint_length;
	var jointpoint = cps.neckjoint_no_origin.move(0,-RIBTHICKNESS); // x,y --> y,z Change of coordinate space
	var jointend = cps.neckjoint_end_no_origin.move(0,-RIBTHICKNESS);
	// Find first points[i] whose y is over/in the neckjoint area
	
	// console.log(start_i, points[0][start_i].y, jointpoint.y);
	var neckblock3d = []; // Save neckblock shape for later use
	
	var j2 = jointpoint.movedist(200,jointangle);
	// console.log(jointpoint, j2);
	var jointpoints = [];
	var jointpoints_draw = [];
	var jointpoints_drawl = [];
	// for ribline,
	for (var i=0; i < points.length; i++){
		// Find segment that intersects joint plane
		var start_yi=0;
		var yi=points[i].length-1;
		// Start from the end
		while (start_yi==0 && yi>0 ){
			if (points[i][yi].y <= jointpoint.y){ 
				start_yi = yi;
			}
			yi--;
		} 
		// console.log("rib",i);
		for (var yi=start_yi; yi < points[i].length-1; yi++){
			// intersect lines in z,y
			// console.log("yi",yi, points[i][yi]);
			var inter1 = intersectline(jointpoint, j2,
									  {x:points[i][yi].z, y:points[i][yi].y},
									  {x:points[i][yi+1].z, y:points[i][yi+1].y});
			
			if (inter1){
				// console.log("plane",inter1);
				// intersect in x,y
				var inter2 = intersectline({x:-10, y:inter1.y},
										   {x:200, y:inter1.y+0.0000001},
										   {x:points[i][yi].x, y:points[i][yi].y},
										   {x:points[i][yi+1].x, y:points[i][yi+1].y});
				if (inter2){
					// Save intersection point if found
					// console.log("point",inter2);
					jointpoints.push(new Point(inter2.x, inter2.y, inter1.x));
					// Calculate distance from jointpoint to intersection
					var dist = linelength(jointpoint, inter1);
					
					jointpoints_draw.push(new Point(inter2.x,dist).scale(1,-1).addpoint(NECKBLOCKORIGIN));
					jointpoints_drawl.push(new Point(inter2.x,dist).scale(-1,-1).addpoint(NECKBLOCKORIGIN));
					
					break;
				}
			}
		}
	}
	lute3d.neckblock = {};
	lute3d.neckblock.jointpoints = jointpoints;
	// console.log(jointpoints);
	// Draw neckblock joint face
	// Draw tiny lines showing each ribjoint
	jointpoints_drawl.reverse();
	jointpoints_draw = jointpoints_drawl.concat(jointpoints_draw);
	
	var neckjg = makegroup(neckblock, "neckjoint-group");
	var neckj = drawshape(neckjg,jointpoints_draw,"","neckjoint");
	// Draw tiny lines at each rib joint
	for (var i = 1; i<jointpoints_draw.length-1; i++){
		var angle = getangle(NECKBLOCKORIGIN, jointpoints_draw[i]);
		var p = jointpoints_draw[i].movedist(3, angle);
		drawline(neckjg, [jointpoints_draw[i],p]);
	}
	// Find bottom / top surface of neckblock
	var bottom = [new Point(jointpoints[jointpoints.length-1].x,
							jointpoints[jointpoints.length-1].y)];
	var bottoml = [];
	// First point: jointpoints_draw[jointpoints_draw.length-1]
	// Loop backwards in sidepoints until we go over the neckblock back edge
	var yi = start_yi;
	while (points[points.length-1][yi].y >= cps.neckblocky-RIBTHICKNESS){
		bottom.push(new Point(points[points.length-1][yi].x,
							  points[points.length-1][yi].y));
		yi--; // Will end up below cps.neckblocky
	}
	// console.log("cps.neckblocky", cps.neckblocky);
	// console.log("bottom", bottom);
	// Get neck block back shape by intersecting points at cps.neckblocky
	var backy = cps.neckblocky-RIBTHICKNESS ;
	// var p1 = new Point(0, backy); // z,y
	// var p2 = new Point(200, backy); // z,y

	var backshape = [];
	var bottompoints = [];
	var neckblockside = [];
	for (var j=0; j < points.length; j++){
		yi = points[j].length-1;
		while (points[j][yi].y >= backy){
			yi--; // Will end up below cps.neckblocky
		}
		var p1 = points[j][yi];
		var p2 = points[j][yi+1];
		
		// var p3 = new Point(points[j][yi].z, points[j][yi].y);
		// var p4 = new Point(points[j][yi+1].z, points[j][yi+1].y);
		// console.log( "p1",p1,"p2",p2 /*, "p3",p3,"p4",p4 */);
		// Find Z coordinate
		var m1 = (p2.z-p1.z) / (p2.y-p1.y);
		var z = (backy - p1.y)*m1 + p1.z;
		// Find X coordinate
		var m2 = (p2.x-p1.x) / (p2.y-p1.y);
		var x = (backy - p1.y)*m2 + p1.x;
		
		var inter = new Point(x,backy,z);
		// console.log("inter1:", inter);
		
		bottompoints.push(inter);
		backshape.push(new Point(inter.x,inter.z));
		
		if (j == points.length-1){
			// Add last point to bottom shape
			bottom.push(new Point(inter.x,inter.y));
		} else if (j==0){
			yi++;
			neckblockside.push(new Point(cps.neckblocky-RIBTHICKNESS,0)); // y,z --> x,y
			neckblockside.push(new Point(cps.neckblocky-RIBTHICKNESS,inter.z)); // y,z --> x,y
			while (points[j][yi].y < jointpoints[0].y){
				neckblockside.push(new Point(points[j][yi].y, points[j][yi].z));
				yi++; // Will end up below jointendy
			}
			neckblockside.push(new Point(jointpoints[0].y, jointpoints[0].z));
			neckblockside.push(new Point(jointpoint.y, jointpoint.x));
		}
		
		
	}
	lute3d.neckblock.bottompoints = bottompoints;

	var in_origin = [];
	// Gather every point between bottom and neck joint into allpoints for later use
	for (var i=0; i < points.length; i++){
		neckblock3d.push([bottompoints[i]]);
		in_origin.push([bottompoints[i].move(0,-cps.neckblocky+RIBTHICKNESS,0)]);
		// yi is right after neckblock bottom
		for (var y=yi; y < points[i].length; y++){
			if (points[i][y].y > bottompoints[i].y && points[i][y].y < jointpoints[i].y){
				neckblock3d[i].push(points[i][y]);
				in_origin[i].push(points[i][y].move(0,-cps.neckblocky+RIBTHICKNESS,0));
			}
		}
		neckblock3d[i].push(jointpoints[i]);
		try{in_origin[i].push(jointpoints[i].move(0,-cps.neckblocky+RIBTHICKNESS,0));} catch(e){}
	}
	
	lute3d.neckblock.allpoints = neckblock3d;
	lute3d.neckblock.allpoints_inorigin = in_origin;
	
	// Make full bottom shape first before drawing it two ways
	for (var i=0; i<bottom.length;i++){
		bottoml.push(bottom[i].scale(-1,-1));
		bottom[i] = bottom[i].scale(1,-1);
	}
	bottoml.reverse();
	bottom = bottom.concat(bottoml);
	
	// Draw neckblock bottom shape on frontview and crosslayer
	var bf = [];
	var bt = [];
	for (var i=0; i<bottom.length;i++){
		bf.push(bottom[i].addpoint(FRONTVIEWORIGIN).move(0,-RIBTHICKNESS));
		bt.push(bottom[i].addpoint(NECKBLOCKORIGIN).move(0,-bottom[0].y));
	}
	drawshape(frontview,bf,THINSTYLE,"neckblock-bottom");
	drawshape(neckblock,bt,THINSTYLE,"neckblock-bottom-template");
	
	var bsmove = cps.neckblocky-RIBTHICKNESS - jointpoints[jointpoints.length-1].y;
	// Draw neckblock inside shape
	var backshapel = [];
	var backshapeh = backshape[0].y;
	for (var i=0; i<backshape.length;i++){
		backshapel.push(backshape[i].scale(-1,1).move(0,-bsmove).addpoint(NECKBLOCKORIGIN));
		backshape[i] = backshape[i].move(0,-bsmove).addpoint(NECKBLOCKORIGIN);
	}
	backshapel.reverse();
	backshape = backshapel.concat(backshape);
	var backg = makegroup(neckblock, "neckblock-backside-group");

	var backs = drawshape(backg,backshape,"","neckblock-backside");
	// Draw tiny lines at each rib joint
	for (var i = 1; i<backshape.length-1; i++){
		var angle = getangle(backshape[i],NECKBLOCKORIGIN.move(0, -bsmove)) - Math.PI;
		var p = backshape[i].movedist(3, angle);
		drawline(backg, [backshape[i],p]);
	}
	// Draw centerline on neckblock shapes
	// console.log(ribs);
	drawline(neckblock, [{x:NECKBLOCKORIGIN.x, 
						   y:jointpoints_drawl[jointpoints_drawl.length-1].y},
						  {x:NECKBLOCKORIGIN.x, 
						   y:backshapel[backshapel.length-1].y}]);
	// Draw side view of neckblock in the side view of the lute
	// Has distance from body start. Rotate 90deg and mirror
	var nbs = [];
	for (var i = 0; i<neckblockside.length; i++){
		nbs[i] = new Point(-neckblockside[i].y, -neckblockside[i].x).addpoint(SIDEVIEWORIGIN).move(0,-RIBTHICKNESS);
		 
	}
	// console.log("nbs",nbs);
	drawshape(getelid("sideview"), nbs,BEHINDSTYLE,"neckblock-side");
	
	// Draw neck block side template
	var sideo = NECKBLOCKORIGIN.move(-cps.neckblocky-RIBTHICKNESS,backshapeh+30)
	for (var i = 0; i<neckblockside.length; i++){
		neckblockside[i] = neckblockside[i].addpoint(sideo);
	}
	drawshape(crosslayer, neckblockside,null,"neckblock-side-template");
	
}

function pathoffset(xpoints,ypoints,offset,name){
	// console.log("pathoffset");
	// console.log(xpoints);
	// Creates the internal shape of the lute form
	// var offset = editorstate.offset; // Shrink by
	// var accur = 0.01; // for calculating normals, how far to move along path for sampling position
	var orig = FRONTVIEWORIGIN;//.move(-500,0);
	var oldseglist = [{letter:"M", numbers:[orig.x, orig.y]}];
	var seglist = [{letter:"M", numbers:[orig.x, orig.y-offset]}];
	var p,np=new Point(0,offset),op;
	for (var i=1; i<xpoints.length && i<ypoints.length; i++){
		op=np;
		p1 = new Point(xpoints[i-1], ypoints[i-1]);
		p2 = new Point(xpoints[i], ypoints[i]);
		// Find normal of each point
		var a = getangle(p1,p2);
		// var d = linelength(p1,p2);
		var np = p2.movedist(offset,a-Math.PI/2);
		
		// Move point by ribthickness inwards along normal
		oldseglist.push({letter:"l", numbers:[p1.x-p2.x, p1.y-p2.y]});
		// remove final segment if it ends on other side of x=0
		if (np.x>0) seglist.push({letter:"l", numbers:[op.x-np.x, op.y-np.y]});
	}
	
	
	
	// console.log(getlast(seglist));
	// var opath = creel("path", name+"outside", "", ["d",""], NAMESPACE);
	// opath.setAttribute("style",REDSTYLE);
	// opath.setAttribute("d",makedtext(oldseglist));
	// addel(getelid("sideview"),opath);
	
	
	// Hide this later
	var newpath = creel("path", name+"inside", "", ["d",""], NAMESPACE);
	newpath.setAttribute("style",OCTSTYLE);
	newpath.setAttribute("d",makedtext(seglist));
	addel(getelid("sideview"),newpath);
	// drawshape(getelid("formlayer"), displaced, OCTSTYLE,"", false);
	
	return newpath;
}

// 3D body calculations:
function calculateribjoints_plane(Ypoints,sidepoints,midpoints, ribs, widest_i) {
	// Find 3D points for ribs using the plane intersect method (only one half of the form though)
	// console.log(Ypoints,sidepoints,midpoints);
	// return array of arrays of 3d points
	var p = editorstate.bulge; // bulging of circle editorstate.bulge
	// Calculate point based on cross section function, which is a flattened and bulged circle function.
	var yl = Ypoints.length;
	var al = ribs.angles.length;
	var accur = 0.001; // accuracy of cross section calculation
	// Calculate start and end points for ribjoints
	var riblines = []; // These are for the neck end of the body, and end in 0,0
	var center = new Point(0,0);
	// var output_draw = []; // [[point,point,point...], [...], ...]
	var output_real = []; // [[point,point,point...], [...], ...] // threedee
	var output_supports = [];
	var compensations = [];
	var linestarts = [];
	var lineends = [];
	// Calculate actual first point y-positions based on optpoints intersecting edge
	for (var i=0; i<al; i++){
		// Get intersect plane function values for each rib joint

		linestarts.push(ribs.optpoints[i]);
		lineends.push(ribs.endpoints[i]);
		// output_draw.push([new Point(SIDEVIEWORIGIN.x, 
									// SIDEVIEWORIGIN.y)]);
		var starty = 0;
		var x = ribs.optpoints[i].x;
		// Check which segment in sidepoints is intersected by line along x
		for (var j=1; j<widest_i; j++){
			if (sidepoints[j] > x){
				break;
			}
		}
		// intersect line from j-1 to j with line along y axis at x
		starty = (x - sidepoints[j-1])*((Ypoints[j]-Ypoints[j-1])/(sidepoints[j]-sidepoints[j-1])) + Ypoints[j-1]
		// Save ribjoint start point
		output_real.push([	new Point(x,starty,0) ]);
		output_supports.push( [ new Point(0.0,0.0)  ] );
		compensations.push( [] );
	}
	
	// Find intersections at widest point => Z_w, X_w
	// console.log(widest_i);
	// Old method: intersect_shell(width, height, linestarts, lineends)
	var points_widest = intersect_shell(sidepoints[widest_i], midpoints[widest_i], linestarts, lineends, p);
	var points = [CROSSVIEWORIGIN];
	for (var i =0; i<points_widest.length; i++){
		points.push(new Point(CROSSVIEWORIGIN.x-points_widest[i].x, CROSSVIEWORIGIN.y-points_widest[i].z));
	}
	// drawshape(getelid("formlayer"),  points, REDSTYLE,"", true);
	// points_widest produces ok shape
	// console.log("Ribs object:", ribs);
	// console.log("Points at widest", points_widest);
	var planedata = [];
	var k;
	var i;
	for (i=0; i<al; i++){ // For each rib joint
		// calculate 3d plane function values for each rib joint
		// x = body length - k*y , where k is some constant value k=w/l
		// x = w-(w/l)*y // w= rib joint start distance from 0,0,0 along x axis
		k = ribs.optpoints[i].x / Ypoints[Ypoints.length-1];
		var X_aw = ribs.optpoints[i].x - k * Ypoints[widest_i];
		var X_bw = points_widest[i].x - X_aw;
		var angle = Math.atan(points_widest[i].z / X_bw);
		var m = points_widest[i].z / X_bw;
		var s = ribs.optpoints[i].x / sidepoints[widest_i]; // 
		planedata.push({k:k, w:ribs.optpoints[i].x, angle:angle, s:s, m:m});
		// TODO: Calculate where ribjoint hits z=0 first, since 
	}
	// planedata.push({k:k, w:ribs.optpoints[i-1].x, angle:0.0});
	// console.log("planedata", planedata);
	var planefunction = function(pldata,yi, ribi){
		if (ribi >= pldata.length) return {p1:new Point(0,0),p2: new Point(500,0)};
		// return point on soundboard and point beyond shell
		// yi = index along y axis, ribi = rib index
		var p1 = new Point(pldata[ribi].w - pldata[ribi].k * lute3d.ribpaths.Ypoints[yi], 0); // where y is actually z
		var p2 = new Point(p1.x + 1000*Math.cos(pldata[ribi].angle), 
				  1000*Math.sin(pldata[ribi].angle));
		return {p1:p1,p2:p2};
	}
	 
	// console.log("Planedata:",planedata);
	
	for (var i=1; i<yl; i++){
		// At every Y location, calculate cross section
		
		var width = sidepoints[i]; // is [i] always available?
		var height = midpoints[i];
		// var b = height/width;

		
		// bulge less towards neck, calculate a new p here
		// bulge should start going smaller from widest_i
		if (i > widest_i){
			var p = 2+(editorstate.bulge-2)*(1-(i-widest_i)/(yl-widest_i));
		} else {
			var p = editorstate.bulge; // max bulge before widest_i
		}
		
		var inter,p1,M;
		
		// for each rib at this y
		for (var a = 0; a<al; a++){
			// calculate M, s 

			p1 = new Point(planedata[a].w - planedata[a].k * Ypoints[i], 0);
			M = planedata[a].m; // ribjoint angle
			
			if ((width > 10 && height > 10) || i > widest_i){
				inter = intersect_shell_once(width,height, p1.x, M, p, accur);
			} 
			
			
			// Then also find intersection with previous ribs or center
			
			if (inter && i<40 && inter.x <= output_real[a][output_real[a].length-1].x ){
				// console.log(a,i, inter);
				inter = null;
			}
			
			if (inter){
				
				output_real[a].push(new Point(inter.x, Ypoints[i], inter.y));
				// sideview
				// output_draw[a].push(new Point(SIDEVIEWORIGIN.x-inter.y, SIDEVIEWORIGIN.y-Ypoints[i]));
				// Supports 
				var d = Math.sqrt((inter.y)**2 + (inter.x-p1.x)**2) + p1.x*Math.cos(planedata[a].angle);
				// var d = Math.sqrt((inter.y)**2 + (inter.x-p1.x)**2) ;
				var compensation = p1.x*Math.cos(planedata[a].angle);
				
				
				// TODO: Add support point only if it is on the correct side of the z axis
				if (inter.x > 0 && inter.y > 0){
					var supp = new Point(Ypoints[i], d);
					supp["yi"] = i;
					output_supports[a].push(supp);
				}
				
				compensations[a][i] = compensation; // 
				compensations[a].push(compensation);
				
			} 
			
			// if (i == widest_i) console.log(accur);
			
			// console.log();
		} // End while
		
	}
	for (var i=0; i<al; i++){
		// If all rib paths don't terminate at the same point, add it
		if (output_real[i][output_real[i].length-1].y != Ypoints[Ypoints.length-1]){
			output_real[i].push(new Point(0.0, Ypoints[Ypoints.length-1], 0.0));
		}
	}
	
	// rotate every rib point (except edge) downwards to create a deeper body, like on a mandolino
	// var deepened = null;
	// This will cause ribline points to be unsynchronized - should the system be robust enough to not need synchronisation?
	if (editorstate.deepenbody > 0.0){ // This is the angle in degrees
		var deepened = [];
		var tip = getlast(output_real[0]).y;
		console.log("Mandolinizing lute body");
		for (var r=0; r<output_real.length; r++){
			deepened.push([new Point(0,0,0)]);
			for (var i=0; i<output_real[r].length-1; i++){
				var hyp = Math.sqrt((tip-output_real[r][i].y)**2 + output_real[r][i].z**2);
				var alpha = Math.atan(output_real[r][i].z/(tip-output_real[r][i].y)) + editorstate.deepenbody*radtodeg;
				deepened[r].push( new Point( 
				// output_real[r][i]= new Point( 
					output_real[r][i].x,
					tip - hyp * Math.cos(alpha),
					hyp * Math.sin(alpha)
				));
			}
		}
		// TODO: Maybe use more accuracy when calculating ribjoints if doing deepenbody
		// Now resync ribjoints to Ypoints by intersecting at every Ypoint
		// TODO: Does old butt middle point/first point of every ribline need to be forcibly included?
		var synced = [];
		var x,z,m;
		for (var r=0; r<al; r++){
			synced.push([]);
			// TODO: Add first point
			var yi=1;
			for (var i=0; i < Ypoints.length; i++){
				while (deepened[r][yi].y <= Ypoints[i] && yi < deepened[r].length-1) yi++;
				m = (deepened[r][yi-1].x-deepened[r][yi].x) / (deepened[r][yi-1].y-deepened[r][yi].y);
				x = m*(Ypoints[i] - deepened[r][yi].y) + deepened[r][yi].x;
				
				m = (deepened[r][yi-1].z-deepened[r][yi].z) / (deepened[r][yi-1].y-deepened[r][yi].y);
				z = m*(Ypoints[i] - deepened[r][yi].y) + deepened[r][yi].z;

				synced[r].push(new Point(x, Ypoints[i], z));
				
				
			}
		}
		output_real = synced;
	}
	
	
	
	// Add end points for each rib, create soundboard edge points
	// console.log("output_real",output_real);
	var edge = [];
	var lastrib = []; // Add 3D points for the edge of the soundboard
	var lastrib_sup = []; // Add 3D points for the edge of the soundboard
	var start_of_last_x = output_real[output_real.length-1][0].x;
	var start_of_last_y = output_real[output_real.length-1][0].y;

	edge.push(new Point(0.0, 0.0, 0.0));
	lastrib.push(new Point(start_of_last_x, start_of_last_y, 0.0));

	for (var i=0; i<sidepoints.length; i++){
		// edge.push({"x": sidepoints[i],
					// "y": Ypoints[i],
					// "z": 0.0});
		edge.push(new Point(sidepoints[i],Ypoints[i],0.0));		
		var supp = new Point(Ypoints[i], sidepoints[i])
		supp["yi"] = i;
		lastrib_sup.push(supp);
		if (sidepoints[i] > start_of_last_x){
			// lastrib.push({"x": sidepoints[i],
						  // "y": Ypoints[i],
						  // "z": 0.0});
			lastrib.push(new Point(sidepoints[i], Ypoints[i], 0.0));
			
		}
	}
	var lastrib_y = lastrib[lastrib.length-1].y;
	// console.log("lastrib_y",lastrib_y, Ypoints[Ypoints.length-1]);
	// Search in Ypoints for lastrib_y index
	var i = Ypoints.length-1;
	while ( Ypoints[i] > lastrib_y ){
		i--;
	}
	i++;
	// console.log("at Ypoints", i, Ypoints[i]);
	while (Ypoints[i] <= Ypoints[Ypoints.length-1]){
		// console.log("yo", i);
		lastrib.push(new Point(sidepoints[i], Ypoints[i], 0.0));
		
		i++;
	}
	output_real.push(lastrib);
	output_supports.push(lastrib_sup);
	// Add final 0,length,0 point to every ribjoint array
	// for (var i=0; i<output_draw.length; i++){
		// output_draw[i].push(new Point(	SIDEVIEWORIGIN.x, 
										// SIDEVIEWORIGIN.y-Ypoints[Ypoints.length-1]));
	// }
	

	// Sanitize output_real so ribs don't intersect under endclasp
	// TODO: This may lead to unnecessary culling?
	
	if (editorstate.drawingpurpose && editorstate.drawingpurpose.startsWith("technical") && editorstate.bulge > 2){
	// console.log("output_real",output_real);
	// For each rib
	for (var i=1; i< output_real.length; i++){
		// Intersect with each previous rib
		var p = i-1; // Previous rib index to be intersected
		var inter = false;
		var inter_y = 0;
		while (p >= 0){
			var j = 1; // segment of this rib i
			// only if start of rib is less than previous can they intersect
			while (j < 20 && !inter){
				// intersect each segment of this rib with each segment of previous rib
				var k = 1; // segment in previous rib
				while (k < 20 && !inter){
						// Use coordinates x (lute width) and z (lute depth)
						var p11 = new Point(output_real[i][j].x, output_real[i][j].z);
						var p12 = new Point(output_real[i][j-1].x, output_real[i][j-1].z);
						var p21 = new Point(output_real[p][k].x, output_real[p][k].z);
						var p22 = new Point(output_real[p][k-1].x, output_real[p][k-1].z);
						
						inter = intersectline(p11,p12, p21,p22);
						inter_y = output_real[i][j].y;
						// inter_y = 0;
					k++;
				}
				j++;
			}
			p--;
		}
		if (inter) {
			// drawcircle(getelid("crosslayer"), CROSSVIEWORIGIN.minuspoint(inter), 1, REDSTYLE, "rib-inters-"+i+"-"+j+"-"+k);
			
			// Delete points from the start of rib i that have x<inter.x and/or z<inter.y
			while (output_real[i].length > 2 && (output_real[i][0].x < inter.x || output_real[i][0].z < inter.y)){
				output_real[i].shift();
			}
			output_real[i].unshift(new Point(inter.x, inter_y, inter.y));
		}
	}
	}

	// Synchronize ribpaths based on y coordinates, after sanitizing since it changes point indices
	// For each rib joint, find rib joint y coordinate that is Ypoints[widest_i] 
	var offsets = [];
	for (var i=0; i<output_real.length; i++){
		for (var j=0; j<output_real[i].length; j++){
			if (output_real[i][j].y == Ypoints[widest_i]) break;
		}
		offsets.push(j - widest_i);
	}

	var maxoffset = Math.abs(offsets[findmin(offsets)]);

	for (var i=0; i<offsets.length; i++){
		offsets[i] = offsets[i]+maxoffset+1;
	}

	return {/* "sideview":output_draw, */ "threedee":output_real,"soundboard_edge":edge, Ypoints:Ypoints, offsets:offsets, "form_supports":output_supports, "compensations":compensations,"plane":planefunction, "planedata":planedata/* , "deepened":deepened */};
}

// TODO: mode for neckadd'ed ribs that don't all terminate at Z=0
function getribangles(widest, numberofribs){ // Also enclasp points
	// Get angles of ribjoints based on circumference at the widest point of the body, and number of ribs
	// Find where the endclasp corner should be
	// while intersection with z=45 is less than 0.3*(width/2)
	if (isNaN(widest.circumference)) {
		console.log("getribangles: widest.circumference was not calculated correctly. Unable to continue.");
		return;
	}
	// var crosslayer = getelid("crosslayer"); // For debugging only
	var ribadd = editorstate.lastribadd || 0.0; 
	var numberofribs = numberofribs || editorstate.numberofribs;
	var ribwidth = (widest.circumference-ribadd) / (numberofribs/2);
	// console.log("ribwidth",ribwidth);
	var ribdists = [ribwidth/2];
	var fullribs = Math.floor(editorstate.numberofribs/2);
	var cornerrib = false; // Only used by draw_endclasp if set
	for (var i=1; i<fullribs; i++){
		ribdists.push(ribdists[i-1]+ribwidth);
	}
	
	// console.log("widest",widest);
	// console.log(widest.circumference-ribdists[ribdists.length-1]-ribwidth);
	var rib = 0;
	var i = 1;
	var traveled = 0;
	var angles = [];
	var endpoints = [];
	// console.log("ribdists",ribdists);
	while (rib <= fullribs && traveled < widest.circumference){
		// Travel along the cross-section
		traveled += widest.distances[i];
		
		if (traveled > ribdists[rib]){
			
			// TODO: Calculate intersection with line segment.. although if accur is set to 0.1 in circumference(), this is accurate enough
			endpoints.push(new Point(widest.Xpoints[i], widest.Zpoints[i]));
			// Calculate angle
			var angle = Math.atan(widest.Xpoints[i]/ widest.Zpoints[i]);
			angles.push(angle);
			// console.log(rib, angle,new Point(widest.Xpoints[i], widest.Zpoints[i]));
			rib++;
			// Why dis 1.7 from what is drawn in circumference ?? ??
			// drawcircle(getelid("crosslayer"), endpoints[endpoints.length-1].scale(-1,-1).addpoint(CROSSVIEWORIGIN), 1,BLUESTYLE,"nc1-"+i);
		}
		i++;
		
	}
	endpoints.push(new Point(widest.Xpoints[widest.Xpoints.length-1], 
							 widest.Zpoints[widest.Zpoints.length-1]));
	// console.log(widest);
	// console.log(endpoints);
	var minlist = [];
	var maxlist = [];
	var avglist = [];
	var ribstartpoints = [];
	// Find optimal rib layout based on 90deg angles from shell. return point on X-axis where ribs intersect.
	// These will be only used for the back end of the ribs, the neck end will always converge at 0,0
	// console.log("angles",angles);
	var start = new Point(0,0);//new Point(-10000,0);
	var end = new Point(10000, 0.0000000002);//start.move(10000, 0.0000000002);
	for (var i=0; i<angles.length; i++){
		if (i==0){
			var angle1= 0;
		} else {
			var angle1 = getangle(endpoints[i],endpoints[i-1])+Math.PI/2;
		}
		// angle1: 90deg to prev rib surface, 
		// angle2: 90deg to next rib surface
		// console.log(angle1);
		var angle2 = getangle(endpoints[i],endpoints[i+1])+Math.PI/2;
		var avgangle = (angle1+angle2)/2.0;
		var minp = endpoints[i].movedist(-1000, angle2);
		var maxp = endpoints[i].movedist(-1000, angle1);
		var avgp = endpoints[i].movedist(-1000, avgangle);
		// drawline(getelid("crosslayer"), [minp.scale(-1,-1).addpoint(CROSSVIEWORIGIN), endpoints[i].scale(-1,-1).addpoint(CROSSVIEWORIGIN)]);
		// drawline(getelid("crosslayer"), [maxp.scale(-1,-1).addpoint(CROSSVIEWORIGIN), endpoints[i].scale(-1,-1).addpoint(CROSSVIEWORIGIN)]);
		

		minp = intersectline(minp,endpoints[i],  start,end);
		maxp = intersectline(maxp,endpoints[i],  start,end);
		avgp = intersectline(avgp,endpoints[i],  start,end);
		minlist.push(minp || new Point(0,0));
		maxlist.push(maxp || new Point(0,0));
		avglist.push(avgp || new Point(0,0));
		
	}
	// console.log("minlist",minlist);
	var start = minlist[Point.findmax(minlist,"x","min")].x;
	var end =   maxlist[Point.findmax(maxlist,"x","max")].x;
	var len = Math.abs(end-start);
	var div = len / minlist.length;
	var startx = start > div/2 ? start: div/2;
	var optpoints = [];
	// Line of endclasp top
	var clasph = 45;
	
	var start = new Point(-10,clasph);//new Point(-10000,0);
	var end = start.move(10000, 0.0000000002);//start.move(10000,
	var cornerrib = 0;
	var cornermin = 0.4*widest.width;
	var cornermax = 0.45*widest.width;
	
	// Refine ribline placement depending on user choice
	
	/* if (editorstate.ribspacing == "above"){ 
		// Disabled, stuff under endclasp does not work
		// Hoffmann type bodies with really deep bodies.
		// Aim all ribs to 0.5*width below center
		// console.log("widest", widest);
		var targetp = new Point(0, cps.depth-cps.width);
		// console.log("Proposing point ", targetp);
		var neg = new Point(-100000,0);
		var pos = new Point(100000,0);
		for (var i=0; i<maxlist.length; i++){
			var inter = intersectline(neg,pos,	targetp, endpoints[i], true);
			optpoints.push(inter);
			// console.log(targetp, endpoints[i]);
			// console.log(i,": Proposing point ", inter);
			ribstartpoints.push(targetp);
		}
		
	}else */  
	if (editorstate.ribspacing == "evenclasp" || editorstate.ribspacing == "theorbo"){ 
		
		// space ribs respecting min, max
		var cornerx;
		for (var i=0; i<maxlist.length; i++){
			var np = (div*(i) + startx) * editorstate.ribspread;
			if (np < minlist[i].x) np = minlist[i].x;
			if (np > maxlist[i].x) np = maxlist[i].x;
			optpoints.push(new Point(np,0));
			
			// Find corner rib
			var cp = 45*(endpoints[i].x-np)/endpoints[i].y + np;
			if (cp <= cornermax){
				cornerrib = i;
				cornerx = cp;
			}
		}
		// console.log("cornerrib:",cornerrib);
		var ediv = (cornerx / (cornerrib + 0.5))*1.1;
		// Space ribs before corner rib evenly at endclasp height
		for (var i=0; i<=cornerrib; i++){
			// drawline(getelid("crosslayer"), [CROSSVIEWORIGIN.minuspoint(new Point(ediv*(i+0.5),45)), CROSSVIEWORIGIN.minuspoint(endpoints[i])],GREENSTYLE);
			var p = ediv*(i+0.5)*0.95; // 0.95 is a decent approximation of where the ribline actually ends up being at. TODO: affect central ribs more and corner rib not at all.
			var cp = p - 45*(endpoints[i].x-p)/(endpoints[i].y-45) ;
			
			optpoints[i].x = cp;
		}
		// Next rib after corner rib should be between corner and next one
		if (optpoints[cornerrib+2]){ // if 11 or 9 ribs, this does not exist necessarily
			optpoints[cornerrib+1].x = (optpoints[cornerrib].x + optpoints[cornerrib+2].x) / 2;
		}
		
		
		// Evenly space the remaining ribs
		// var remaining = optpoints.length-cornerrib;
		// var rdiv = 
		// for (var i=cornerrib; i<optpoints.length; i++){
			// var p = ediv*(i+0.5);
			// var cp = p - 45*(endpoints[i].x-p)/(endpoints[i].y-45) ;
			
			// optpoints[i].x = cp;
		// }
		for (var i=0; i<maxlist.length; i++){
			
			if (optpoints[i].x < minlist[i].x) {
				// drawcircle(crosslayer , CROSSVIEWORIGIN.minuspoint(optpoints[i]), 2, REDSTYLE);
			}
			if (optpoints[i].x > maxlist[i].x) {
				// drawcircle(crosslayer , CROSSVIEWORIGIN.minuspoint(optpoints[i]), 2, GREENSTYLE);
			}
			
		}
		
	} else { // ribspacing == "even" and others
		
		for (var i=0; i<maxlist.length; i++){

			optpoints.push(new Point((div*(i)+startx)*editorstate.ribspread,0));
			var ip;
			ip = intersectline(optpoints[i],endpoints[i],  start,end);
			if (ip.x <= cornermax){
				cornerrib = i;
			}
		}
	} 
	// Remove extras?
	if (optpoints.length > endpoints.length) optpoints.pop();
	

	var i=0;
	while (ribstartpoints.length < endpoints.length){
		ribstartpoints.push(optpoints[i]);
		i++;
		// why
	}
	
	return {"angles":angles, "endpoints":endpoints, "optpoints":optpoints, "minlist":minlist, "maxlist":maxlist, "cornerrib":cornerrib, ribstartpoints: ribstartpoints };
}



// These have been checked and have no side-effects and do not use global variables and should be ready for Instrument.js



/////////////////////////////////////////////////////////////////////////
// Helper functions

function getpoints(path,yposlist,debug,ignore){
	// Calculate points along svg path. yposlist is an array of y-coordinates. If yposlist is not specified, it will be created and returned. 
	// pathline_intersect() gives a single intersection between two path segments
	// Used for bar lengths and calculating the 3D shape of the body
	// if (path.pathSegList.numberOfItems == 0){console.log("getpoints: Empty pathSegList, does path exist?", path);return;}
	// debug=true;
	var accuracy = 2;
	var t0 = performance.now();
	
	
	if (!yposlist){
		if (debug) console.log("no yposlist supplied");
		var yposlist = [0];
		var reuse = false;
	} else {
		if (debug) console.log("yposlist supplied");
		var reuse = true;
		var posi = 0; // index in yposlist to use, incremented in loop
	}

	var xposlist = []; // This is the output
	var px=[], py=[]; // Control points rearranged for segmemt intersection calculator
	var seglist = interpretpath(extractpath(path.getAttribute("d")));
	// console.log("seglist",seglist);
	if (ignore!==undefined){// ignore first and last points(guitar backs)
		seglist.shift();
		seglist.pop();
		seglist[0].letter="M";
	}
	// console.log("seglist",seglist);
	// TODO: Add method of finding bounding box when built-in method fails
	var bbox,width,height;
	try {
		var bbox = path.getBBox();
		height = bbox.height;
		width = bbox.width;
	} catch (e){
		console.log("getBBox() built-in method failed. Using proprietary method instead.");
		console.log(e);
		var xmin,xmax,ymin,ymax;
		for (var i=0; i<seglist.length; i++){
			if (seglist[i].x < xmin) xmin = seglist[i].x;
			if (seglist[i].y < ymin) ymin = seglist[i].y;
			if (seglist[i].x < xmax) xmax = seglist[i].x;
			if (seglist[i].y < ymax) ymax = seglist[i].y;
		}
		width = xmax-xmin;
		height = ymax-ymin;
		console.log(xmin,xmax,ymin,ymax, width, height);
	}
	
	// var height = bbox.height;
	// var seglist = path.pathSegList; // Go negative from here
	
	// var seglist = path.pathSegList;
	
	
	var pos = yposlist[0]; // Go negative from here
	var endy = pos-height;
	if (debug) console.log("height pos", bbox,pos, endy);
	var startx = -1000; // debug line coordinate, nothing to worry about
	var endx = 1000;

	var seg0 = seglist[0];
	var abspos = new Point(seg0.x, seg0.y);

	// console.log("abspos",abspos);
	var segstart = new Point(0,0);
	var lx = [endx,startx];
	var ly = [pos,pos];
	var LTRS = "MCLHVZSQTA";
	var segends=[0];
	var ab = [ "filler" ];
	var ac = 0.1; // Variable accuracy begins at this value

	// if (debug) console.log("lenseglist",lenseglist, seglist.length);
	for (var i=1; i<seglist.length;i++){
		var seg = seglist[i];
		// Calculate "absolute" coordinates for each segment (relative to 0,0)
		if (LTRS.indexOf(seg.pathSegTypeAsLetter) > 0){
			// Path segment is absolute already
			if (debug) console.log("absolute segment",i);
			segends.push(seg.y - seg0.y);
			if (debug) console.log("segend",seg.y);
			ab.push({px: 
						[segstart.x,
						 seg.x1 - seg0.x,
						 seg.x2 - seg0.x,
						 seg.x - seg0.x],
					 py:
						[segstart.y,
						 seg.y1 - seg0.y,
						 seg.y2 - seg0.y,
						 seg.y - seg0.y]
					 });
			segstart = new Point(seg.x - seg0.x, 
								 seg.y - seg0.y);
		} else {
			// Path segment is relative
			if (debug) console.log("relative segment",i);
			segends.push(segends[i-1]+seg.y);
			ab.push({px: 
						[segstart.x, 
						 segstart.x + seg.x1,
						 segstart.x + seg.x2,
						 segstart.x + seg.x],
					 py:
						[segstart.y,
						 segstart.y + seg.y1,
						 segstart.y + seg.y2,
						 segstart.y + seg.y]
					 });
			segstart = segstart.move(seg.x, seg.y);
		}
		
	}
	if (debug) console.log("segends",segends);
	if (debug) console.log("ab",ab);
	function whichseg (yp){
		for (var i=0; i<segends.length;i++){
			if (yp > segends[i]){
				return i;
			}
		}
		// return 1;
	}
	var shouldbe = whichseg(pos);
	if (debug) console.log("pos", pos, endy,shouldbe );
	while (pos >= endy && shouldbe < seglist.length){
		// if (debug) console.log("pos",pos,"seg", shouldbe);
		// intersect horizontal line with current segment
		ly = [pos,pos]; // Always a horizontal line of standard length
		if (debug) drawline(getelid("debuglayer"),
					[abspos.move(endx, pos),abspos.move(startx, pos)]);
		// Try to get intersection
		// if (debug) console.log(ab[shouldbe]);
		// TODO: For arc segments, use different intersecting method
		
		/* if (seg.pathSegTypeAsLetter == "a" || seg.pathSegTypeAsLetter == "A"){
			if (debug) console.log("pathline A");
			var inter = arc_intersect(ab[shouldbe].px,ab[shouldbe].py,lx,ly, seg);
		} else */
		if (seg.letter == "l" || seg.letter == "L"){
			var inter = intersectline(
				new Point(ab[shouldbe].px[0],ab[shouldbe].py[0]),
				new Point(ab[shouldbe].px[3],ab[shouldbe].py[3]),     
				new Point(lx[0], ly[0]),
				new Point(lx[1], ly[1]/* +0.0000000001 */) );
				if (debug) console.log("line",shouldbe, pos,new Point(ab[shouldbe].px[0],ab[shouldbe].py[0]),
				new Point(ab[shouldbe].px[3],ab[shouldbe].py[3]), "at", inter);
		} else { // Bezier segment
			// var inter = computeIntersections(px,py,lx,ly, true);
			// console.log(ab, shouldbe);
			// console.log(ab[shouldbe].px,ab[shouldbe].py,lx,ly);
			var inter = computeIntersections(ab[shouldbe].px,ab[shouldbe].py,lx,ly);
			if (debug) console.log("bezier",shouldbe, pos, inter);
			if (debug) drawcircle(getelid("debuglayer"), inter, 3, REDSTYLE);
		} 
		
		// var inter = computeIntersections(ab[shouldbe].px,ab[shouldbe].py,lx,ly);
		if (isNaN(inter.x) /* || inter.x > 0.0 */){
			if (debug) console.log("NaN", pos, shouldbe);
			xposlist.push(0.0);
		} else {
			xposlist.push(inter.x);
		}
		
		if (debug) drawcircle(getelid("debuglayer"), abspos.addpoint(inter), 1,"","inters-"+path.id+pos.toFixed(1));

		if (reuse) { // Reuse given yposlist. get next position.
			if (debug) console.log("Did position", posi, shouldbe, yposlist[posi].toFixed(0), inter.x.toFixed(0));
			posi++;
			pos = yposlist[posi];
		} else {
			// calculate y interval to next intersection based on previous intersection distance to the one before that (start tiny, then wide, then go medium towards end)
			if (xposlist.length <= 2 ){
				pos -= ac;
			} else {
				// Vary y interval based on slope of curve
				var i = xposlist.length-1;
				var angle = -Math.abs(Math.atan((xposlist[i-1]-xposlist[i-0])
										       /(yposlist[i-1]-yposlist[i-0])));
				pos = pos - accuracy * Math.cos(angle);
				// console.log("pos",accuracy * Math.cos(angle), pos);
				// TODO: Limit to end of next segment or skip segment(s)? whichseg() already does this?
				// if(pos < ab[shouldbe].py[3]) {
					// shouldbe++;
				// }
				if (pos < endy){ // Limit to end of path
					pos=endy;
				}
			}
			yposlist.push(pos);
		}
		shouldbe = whichseg(pos);
		if (debug) console.log("shouldbe", shouldbe);
	}
	// if last ypos is NaN or same as previous, remove them
	while(yposlist[yposlist.length-1] == yposlist[yposlist.length-2] || isNaN(yposlist[yposlist.length-1])){
		yposlist.pop();
	}
	while (xposlist.length > yposlist.length){ 
		// If this results in an xposlist that's too long, shorten it
		xposlist.pop();
	}
	if (xposlist.length < yposlist.length){
		xposlist.push(0.0); // Make lists the same length and end at 0,height
	}
	
	// console.log((performance.now() - t0).toFixed(0) + "ms to calculate "+xposlist.length+" points along path");
	return {X:xposlist, Y:yposlist};
}

// Check if this is needed with instrument.js and if it needs reworking
function getpoints_new(path,yposlist,debug,ignore){
	// Calculate points along svg path. yposlist is an array of y-coordinates. If yposlist is not specified, it will be created and returned. 
	// pathline_intersect() gives a single intersection between two path segments
	// Used for bar lengths and calculating the 3D shape of the body
	// if (path.pathSegList.numberOfItems == 0){console.log("getpoints: Empty pathSegList, does path exist?", path);return;}
	// debug=true;
	var accuracy = 2; // make parameter maybe
	var t0 = performance.now();
	if (debug) console.log("path to be intersected:", path.getAttribute("d"));
	
	// TODO: Start from butt end with lines along Y until body shape is 45deg, then do X
	// if !yposlist, do along Y, else just use yposlist
	// Change lx, ly
	// Some thought needs to be given to which segment of the path is intersected
	
	if (!yposlist){
		if (debug) console.log("no yposlist supplied");
		var yposlist = [0];
		var reuse = false;
	} else {
		if (debug) console.log("yposlist supplied");
		var reuse = true;
		var posi = 0; // index in yposlist to use, incremented in loop
	}

	var xposlist = []; // This is the output
	var px=[], py=[]; // Control points rearranged for segmemt intersection calculator
	var seglist = interpretpath(extractpath(path.getAttribute("d")));
	if (debug) console.log("seglist",seglist);
	if (ignore!==undefined){// ignore first and last points(guitar backs)
		seglist.shift();
		seglist.pop();
		seglist[0].letter="M";
	}
	// console.log("seglist",seglist);
	// TODO: Add method of finding bounding box when built-in method fails
	var bbox,width,height;
	try { // TODO: provide width and height as parameter`s?
		var bbox = path.getBBox();
		height = bbox.height;
		width = bbox.width;
	} catch (e){
		// console.log("getBBox() built-in method failed. Using proprietary method instead.");
		// console.log(e);
		var xmin,xmax,ymin,ymax;
		for (var i=0; i<seglist.length; i++){
			if (seglist[i].x < xmin) xmin = seglist[i].x;
			if (seglist[i].y < ymin) ymin = seglist[i].y;
			if (seglist[i].x < xmax) xmax = seglist[i].x;
			if (seglist[i].y < ymax) ymax = seglist[i].y;
		}
		width = xmax-xmin;
		height = ymax-ymin;
		// console.log(xmin,xmax,ymin,ymax, width, height);
	}
	
	// var height = bbox.height;
	// var seglist = path.pathSegList; // Go negative from here
	
	// var seglist = path.pathSegList;
	
	
	var pos = yposlist[0]; // Go negative from here
	var endy = pos-height;
	if (debug) console.log("height pos", bbox,pos, endy);
	var startx = 0; // debug line coordinate, nothing to worry about
	var endx = 1000;

	var seg0 = seglist[0];
	var abspos = new Point(seg0.x, seg0.y);

	// console.log("abspos",abspos);
	var segstart = new Point(0,0);
	var lx = [endx,startx];
	var ly = [pos,pos];
	var LTRS = "MCLHVZSQTA";
	var segends=[0];
	var ab = [ "filler" ];
	var ac = 0.1; // Variable accuracy begins at this value

	// if (debug) console.log("lenseglist",lenseglist, seglist.length);
	for (var i=1; i<seglist.length;i++){
		var seg = seglist[i];
		// Calculate "absolute" coordinates for each segment (relative to 0,0)
		if (LTRS.indexOf(seg.letter) > 0){
			// Path segment is absolute already
			if (debug) console.log("absolute segment",i);
			segends.push(seg.y - seg0.y);
			if (debug) console.log("segend",seg.y);
			ab.push({px: 
						[segstart.x,
						 seg.x1 - seg0.x,
						 seg.x2 - seg0.x,
						 seg.x - seg0.x],
					 py:
						[segstart.y,
						 seg.y1 - seg0.y,
						 seg.y2 - seg0.y,
						 seg.y - seg0.y]
					 });
			segstart = new Point(seg.x - seg0.x, 
								 seg.y - seg0.y);
		} else {
			// Path segment is relative
			if (debug) console.log("relative segment",i);
			segends.push(segends[i-1]+seg.y);
			ab.push({px: 
						[segstart.x, 
						 segstart.x + seg.x1,
						 segstart.x + seg.x2,
						 segstart.x + seg.x],
					 py:
						[segstart.y,
						 segstart.y + seg.y1,
						 segstart.y + seg.y2,
						 segstart.y + seg.y]
					 });
			segstart = segstart.move(seg.x, seg.y);
		}
		
	}
	if (debug) console.log("segends",segends);
	if (debug) console.log("ab",ab);
	function whichseg (yp){
		for (var i=0; i<segends.length;i++){
			if (yp > segends[i]){
				return i;
			}
		}
		// return 1;
	}
	var outpoints = [/* new Point() */];
	var shouldbe = whichseg(pos);
	if (debug) console.log("pos", pos, endy,shouldbe );
	while (pos >= endy && shouldbe < seglist.length){
		// if (debug) console.log("pos",pos,"seg", shouldbe);
		// intersect horizontal line with current segment
		ly = [pos,pos]; // Always a horizontal line of standard length
		if (debug) drawline(getelid("debuglayer"),
					[abspos.move(endx, pos),abspos.move(startx, pos)]);
		// Try to get intersection
		// if (debug) console.log(ab[shouldbe]);
		// TODO: For arc segments, use different intersecting method
		
		/* if (seg.pathSegTypeAsLetter == "a" || seg.pathSegTypeAsLetter == "A"){
			if (debug) console.log("pathline A");
			var inter = arc_intersect(ab[shouldbe].px,ab[shouldbe].py,lx,ly, seg);
		} else */
		if (seg.letter == "l" || seg.letter == "L"){
			var inter = intersectline(
				new Point(ab[shouldbe].px[0],ab[shouldbe].py[0]),
				new Point(ab[shouldbe].px[3],ab[shouldbe].py[3]),     
				new Point(lx[0], ly[0]),
				new Point(lx[1], ly[1]),true );
				if (debug) console.log("line",shouldbe, pos,new Point(ab[shouldbe].px[0],ab[shouldbe].py[0]),new Point(ab[shouldbe].px[3],ab[shouldbe].py[3]), "at", inter);
		} else { // Bezier segment
			// var inter = computeIntersections(px,py,lx,ly, true);
			// console.log(ab, shouldbe);
			// console.log(ab[shouldbe].px,ab[shouldbe].py,lx,ly);
			var inter = computeIntersections(ab[shouldbe].px,ab[shouldbe].py,lx,ly);
			if (debug) console.log("bezier",shouldbe, pos, inter);
			if (debug) drawcircle(getelid("debuglayer"), inter, 3, REDSTYLE);
		} 
		
		// var inter = computeIntersections(ab[shouldbe].px,ab[shouldbe].py,lx,ly);
		if (isNaN(inter.x) /* || inter.x > 0.0 */){
			if (debug) console.log("NaN", pos, shouldbe);
			xposlist.push(0.0);
		} else {
			xposlist.push(inter.x);
			outpoints.push(new Point(Math.abs(inter.x), Math.abs(inter.y)));
		}
		
		if (debug) drawcircle(getelid("debuglayer"), abspos.addpoint(inter), 1,"","inters-"+path.id+pos.toFixed(1));

		if (reuse) { // Reuse given yposlist. get next position.
			if (debug && inter) console.log("Did position", posi, shouldbe, yposlist[posi].toFixed(0), inter.x.toFixed(0));
			posi++;
			pos = yposlist[posi];
		} else {
			// calculate y interval to next intersection based on previous intersection distance to the one before that (start tiny, then wide, then go medium towards end)
			if (xposlist.length <= 2 ){
				pos -= ac;
			} else {
				// Vary y interval based on slope of curve
				var i = xposlist.length-1;
				var angle = -Math.abs(Math.atan((xposlist[i-1]-xposlist[i-0])
										       /(yposlist[i-1]-yposlist[i-0])));
				pos = pos - accuracy * Math.cos(angle);
				// console.log("pos",accuracy * Math.cos(angle), pos);
				// TODO: Limit to end of next segment or skip segment(s)? whichseg() already does this?
				// if(pos < ab[shouldbe].py[3]) {
					// shouldbe++;
				// }
				if (pos < endy){ // Limit to end of path
					pos=endy;
				}
			}
			yposlist.push(pos);
		}
		shouldbe = whichseg(pos);
		if (debug) console.log("shouldbe", shouldbe);
	}
	// if last ypos is NaN or same as previous, remove them
	while(yposlist[yposlist.length-1] == yposlist[yposlist.length-2] || isNaN(yposlist[yposlist.length-1])){
		yposlist.pop();
	}
	while (xposlist.length > yposlist.length){ 
		// If this results in an xposlist that's too long, shorten it
		xposlist.pop();
	}
	if (xposlist.length < yposlist.length){
		xposlist.push(0.0); // Make lists the same length and end at 0,height
	}
	
	// console.log((performance.now() - t0).toFixed(0) + "ms to calculate "+xposlist.length+" points along path");
	outpoints[0] = new Point(0,0); // Force this value, apparently it can sometimes (Railich) be an absurd value
	// return {X:xposlist, Y:yposlist};
	return {points:outpoints, X:xposlist, Y:yposlist};
}

function shell_z (w,h,P,x){ // Calculate z given x
	return h*(1 - (x/w)**P)**(1/P);
}
function shell_x (w,h,P,z){ // Calculate x given z
	return w*(1 - (z/h)**P)**(1/P);
}

function hyper_inter (X,Y, w,h, P, m1, s) { // hyperellipse-line intersection
	// Approximate hyperellipse-line intersection given a worse approximation
	// linestart s must be normalized to 0...1 by linestarts[i]/width
	// Find points on hyperellipse vertically and horizontally from x, f(x) and inverse hyperellipse
	var y_top = h*(1 - (X/w)**P)**(1/P); // top secant point y
	var x_right = w*(1 - (Y/h)**P)**(1/P); // right secant point x, inverse function of hyperellipse 
	
	var m2 = (Y - y_top) / (x_right - X); // slope of secant
	var x = (Y - x_right*m2 + m1*s) / (m1 - m2); // intersection x of rib line and secant
	
	return x; // Calculate y from rib line 
}

function intersect_shell_once(w,h, s, M, P, accur){
	// Calculates one rib intersection with the lute shell at a single y-point
	// s must be in range 0...1
	
	// calculate intersection X coordinate of line and ellipse to start close to final point
	var X = (s*w**2*M**2 + w*h*Math.sqrt(w**2*M**2 - M**2*s**2 + h**2)) / (w**2*M**2 + h**2);
	var Y = h * Math.sqrt(1-(X/w)**2);
	
	// If P=2, return this value.
	if (P==2.0) return new Point(X, Y);
	
	var iters = 0;
	var oldX = 0;
	var oldY = h;
	// console.log("shell", s, w,h, M, P, X,Y);
	// Iterate until difference between X1 and X2 is small enough
	while (Math.abs(X-oldX) >= accur && iters < 20){
		oldX = X;
		oldY = Y;
		X = hyper_inter (oldX, oldY, w,h, P, M, s);
		Y = (X - s)*M; 
		iters++; // Prevent infinite loops in case of stupid
		
		// console.log( iters, oldX, oldY, X,Y);
	}
	
	return new Point(X, Y);
}

function intersect_shell(width, height, linestarts, lineends, bulge){
	// Calculates all rib intersections with the lute shell at a single y-point
	var accur = 0.001; // accuracy of cross section calculation
	var al = linestarts.length;
	var P = bulge; // bulging of circle editorstate.bulge
	var outputs = [];
	
	for (var a=0; a<al; a++){
		var s = linestarts[a].x;
		var M = (lineends[a].y - linestarts[a].y)/(lineends[a].x - linestarts[a].x);
		var newp = intersect_shell_once(width,height,s,M,P,accur);
		
		outputs.push(
				{"x": newp.x,
				 "z": newp.y});
		
	}
	
	// console.log(width, height, linestarts, bulge, outputs);
	return outputs;
}

function circumference(Ypoints, side, middle, at,accur) { // 'at' is index in coordlist
	// Returns circumference of half of body at given X coordinate, approximated by breaking the cross section curve into line segments
	// Also returns points X,Z along the curve
	var width = side[at],
		height = middle[at],
		x=0,
		circumference=0;
	var Zpoints = [];// Array of Z points along the X-axis at the widest point
	var Xpoints = []; // Records where the curve was sampled, used for drawing the curve
	var distances = [0]; // Records distances between this and last point
	// cps.depth = height; // TODO: this should not happen here because this function might be called at some other point than the widest point
	// TODO: make parameter or something 
	var p = editorstate.bulge || 2.0; // bulging of circle editorstate.bulge
	var last_accur = accur;
	// console.log(width, height);
	while (x <= width) {
		// Put new Z height in Zpoints
		var g = -(1/(width*width)) * (x*x) +1;
		var f = (Math.abs((1-g)*width + (g*height))**p - Math.abs(x)**p)**(1/p);
		Zpoints.push(f);
		Xpoints.push(x);
		// Calculate distance traveled
		if (Zpoints.length > 1){
			var i = Zpoints.length-1;
			var dist = Math.sqrt((Zpoints[i]-Zpoints[i-1])**2+
								 (Xpoints[i]-Xpoints[i-1])**2);
			circumference += dist;
			distances.push(dist);
		}
		if (x < 1.0+accur ){
			x += accur;
		} else {
			// Vary x interval based on slope of curve
			var i = Zpoints.length-1;
			var angle = Math.abs(Math.atan((Zpoints[i-1]-Zpoints[i])
									/(last_accur)));

			last_accur = accur * Math.cos(angle)
			x += last_accur;
		}
	}
	Zpoints.push(0); // Add final point at lute edge
	Xpoints.push(width);
	var i = Zpoints.length-1; // And then calculate last segment length
	circumference += Math.sqrt((Zpoints[i]-Zpoints[i-1])**2+
							   (Xpoints[i]-Xpoints[i-1])**2);
	// Draw it
	// var points = [CROSSVIEWORIGIN];
	// for (var i =0; i<Zpoints.length; i++){
		// points.push(new Point(CROSSVIEWORIGIN.x-Xpoints[i], CROSSVIEWORIGIN.y-Zpoints[i]));
	// }
	// drawshape(getelid("formlayer"),  points, GREENSTYLE,"", true);
	// console.log(Xpoints.length, Zpoints.length, circumference);
	
	
	return {"Xpoints": Xpoints, "Zpoints": Zpoints, "width": width,
		"distances": distances, "circumference": circumference, "height": height};
	
} 





















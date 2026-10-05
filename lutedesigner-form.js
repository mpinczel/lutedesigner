// Lutedesigner form calculations

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
features_init.push(function(){
	/* var dp = getelid("drawingpurpose");
	var fo = creel("option","","",["value","technicalform"]);
	fo.innerHTML = "Form drawing";
	addel(dp, fo);
	var co = creel("option","","",["value","technicaltemplates"]);
	co.innerHTML = "Technical with templates";
	addel(dp, co);
	 */
	// input for selecting form material thickness (not for foamcore)
	var label = creel("label");
	label.innerHTML = "Form material thickness ";
	var s = creel("input","materialth","",["type","number","value","13","onchange","settingchange(this)","step","0.1"]);
	addel(label, s);
	addel(getelid("metaselector"), label);

	
	
});
var inside_side, inside_middle;

features.push(function drawform(){
	
	if (editorstate.drawingpurpose && editorstate.drawingpurpose.startsWith("technical")) draw_rib_templates();
	if (editorstate.bodyshapefrom=="guitar") {
		guitarform();
		return;
	}
	//////////////////////////////////////////////////////////////
	//// Draw form stuff
	if (editorstate.drawingpurpose && editorstate.drawingpurpose.startsWith("technical")){
		try {
		// Create foamcore mold
		// accuracy = 3;
		// Find inside shapes for the form
		// console.log("doing pathoffset");
		inside_side = pathoffset(lute3d.sidepoints, lute3d.Ypoints,RIBTHICKNESS,"side");
		inside_middle = pathoffset(lute3d.midpoints, lute3d.Ypoints,RIBTHICKNESS,"middle");
		
		// Get points along paths for side and middle
		// 
		var inYpoints = [0];
		var insidepoints = [0];
		var prevy = 0, prevx = 0;
		var inpath = interpretpath(extractpath(inside_side.getAttribute("d")));
		for (var i=1; i<inpath.length; i++){
			prevy = prevy+inpath[i].y;
			prevx = prevx+inpath[i].x;
			inYpoints.push(prevy);
			insidepoints.push(prevx);
			
		}
		// console.log("insidepoints",insidepoints);
		// console.log("inYpoints",inYpoints);
		// TODO: Find X-points at Ypoints for inside middle shape
		// var inpath = interpretpath(extractpath(inside_middle.getAttribute("d")));
		// copyelement(getelid("formlayer"),inside_middle);
		// var cln = inside_middle.cloneNode(true); // debug only
		// cln.id = "inside-middle-clone";
		// addel(getelid("formlayer"), cln);
		var inpath = convertToAbsolute(inside_middle, true);
		// console.log("inside_middle",inpath);
		var y = 0, seg, prevseg = new Point(0,0), j=1;
		// var ypos = ;
		var inmidpoints = [];
		for (var i=0; i<inYpoints.length-1; i++){
			// For each Ypoint, find a segment to intersect
			// j = j-10;
			// if (j<1) j=1;
			j=1;
			while (j < inpath.length-1 && inpath[j].y > inYpoints[i]){
				j++;
			}
			// if (!isbetween(inpath[j-1].y,inYpoints[i] , inpath[j].y)){
				// console.log("not between",i,j,inpath[j-1].y,inYpoints[i] , inpath[j].y);
				// drawcircle(getelid("formlayer"), FRONTVIEWORIGIN.addpoint(seg).move(0,-RIBTHICKNESS), 0.3,REDSTYLE);
			// }
			// Intersect segment
			// seg = new Point(prevseg.x+inpath[j].x, prevseg.y+inpath[j].y);
			seg = inpath[j];
			
			var m1 = (seg.x-inpath[j-1].x) / (seg.y-inpath[j-1].y);
			var x = (inYpoints[i] - inpath[j-1].y)*m1 + inpath[j-1].x;
			inmidpoints.push(x);
			var inter = new Point(x, inYpoints[i]);
			// console.log("intersection",i,j,inpath[j]);
			/* if (inter) {
				// suc_j = j;
				// inmidpoints.push(inter.x);
				
				drawcircle(getelid("formlayer"), FRONTVIEWORIGIN.addpoint(inter).move(0,-RIBTHICKNESS), 1,"","inters-"+"inside"+i.toFixed(1));
			} else {
				drawline(getelid("formlayer"),
					[FRONTVIEWORIGIN.move(-180, inYpoints[j]-RIBTHICKNESS),
					 FRONTVIEWORIGIN.move(10, inYpoints[j]-RIBTHICKNESS)]);
			} */
			// prevseg = seg;
		}
		// Add last point to inside middle shape, so that it has the same number of points
		inmidpoints.push(getlast(insidepoints));
		// Flip every points sign to positive
		inYpoints = flipsign(inYpoints);
		insidepoints = flipsign(insidepoints);
		inmidpoints = flipsign(inmidpoints);
		
		// console.log("inside_side",inside_side);
		// console.log("inside_middle",inside_middle);
		// console.log("insidepoints",insidepoints);
		// console.log("inmidpoints",inmidpoints);
		// console.log("inYpoints",inYpoints);
		
		
		// console.log(insidepoints,inmidpoints,inYpoints);
		// Find 3D points for ribs (only one half of the form though)
		var inwidest_i = findmax(insidepoints);
		// console.log("inwidest_i",inwidest_i);
		var inwidest = circumference(inYpoints,insidepoints,inmidpoints, inwidest_i, 0.1);
		
		// var inribs = getribangles(inwidest);
		var t0 = performance.now();
		// console.log("calculateribjoints_plane",inYpoints,insidepoints,inmidpoints, lute3d.ribs, inwidest_i); 
		var inribpaths = calculateribjoints_plane(inYpoints,insidepoints,inmidpoints, lute3d.ribs, inwidest_i);
		// console.log("lute3d.inribpaths:",inribpaths);
		var t1 = performance.now();
		console.log("It took " + (t1 - t0).toFixed(0) + " ms to calculate ribjoints for the inside shape.")
		lute3d.inribpaths = inribpaths;
		// Find neck joint shape and evenly space ribs on it
		try {
			neckjoint_3D(inribpaths.threedee); 
		} catch (e) {
			console.log("neckjoint math failed");
			console.log(e);
		}
		

		// Hide these here because otherwise can't get BBox before this
		inside_side.style= "display:none;";
		inside_middle.style= "display:none;";
		// Move inside offset paths to debuglayer
		var debuglayer = getelid("debuglayer");
		// TODO: if debug is wanted, inside shapes now must be turned into paths
		// addel(debuglayer,inside_side);
		// addel(debuglayer,inside_middle);
		
		// Arrange body 3d points in slices
		lute3d.slices = slice_body(lute3d.ribpaths.threedee);
		lute3d.inslices = slice_body(lute3d.inribpaths.threedee);
		lute3d.slices.edge = lute3d.ribpaths.soundboard_edge;
		lute3d.inslices.edge = lute3d.inribpaths.soundboard_edge;
		// console.log("lute3d.inslices",lute3d.inslices);
		
		// Create body analysis table
		analyse_lute();	
		if (getelid("keep_drawing_reflection").checked){
			body_normal_map(); 
		}
		// 
			
		// Decide what kind of form to draw
		// if (editorstate.drawingpurpose.startsWith("technicalfoamform")) {
			drawfoamcore();
		// } else if (editorstate.drawingpurpose.startsWith("technicalcarvedform")) {
			drawcarvedform(lute3d.inslices, cps.neckblocky-RIBTHICKNESS);
		// } else if (editorstate.drawingpurpose.startsWith("technicalsimpleform")) {
			drawsimpleform(lute3d.inslices, cps.neckblocky-RIBTHICKNESS);
			drawsimpleform2(lute3d.inslices, cps.neckblocky-RIBTHICKNESS);
		// }
		
		
		} catch(e) {
			console.log("Failed to create form(s):");
			console.log(e);
		}
		
	}
	
	
});

function guitarform(){ // Create guitar form
	var formlayer = getelid("formlayer");
	FORMORIGIN = FORMORIGIN.move(cps.width+100, FRONTVIEWORIGIN.y);
	var formg = makegroup(formlayer, "guitar-form", FORMORIGIN);
	var formth = editorstate.materialth;
	var sideth = 1.5;
	var ribth = 1.4;
	var o = new Point(0,0);
	// Copy guitar outline
	copyelement(formg, currentbody.side, o);
	copyelement(formg, currentbody.trebleside, o);
	// addel(formg, currentbody.side.cloneNode(true));
	// addel(formg, currentbody.trebleside.cloneNode(true));
	// offset side shape inwards for interior mold, use normal shape for exterior mold plans
	inside_side = pathoffset(lute3d.sidepoints, lute3d.Ypoints,sideth,"side");
	movepath(inside_side, o.move(0,-sideth));
	addel(formg,inside_side);
	// copyelement(formg, inside_side, o.move(0,-sideth));
	var cln = inside_side.cloneNode(true);
	addel(formg,cln);
	scalepath_xy(cln, -1, 1);
	console.log(inside_side);
	// inside_middle needs to ne bumped to correct height to be offset all the way
	// side missing last point at neck
	inside_middle = pathoffset(lute3d.midpoints, lute3d.Ypoints,ribth,"middle");
	// Copy from features.push(function drawform() or maybe use that code to avoid duplication
	// offset ribs?
	// for concave ribs, a reverse single rib mold as side shape, middle shape, and concave cross-section shapes along the way
	// Normal round bottoms: cross-sections, top layer made of only
	// Arrange body 3d points in slices
	lute3d.slices = slice_body(lute3d.ribpaths.threedee);
	// lute3d.inslices = slice_body(lute3d.inribpaths.threedee);
	lute3d.slices.edge = lute3d.ribpaths.soundboard_edge;
	// lute3d.inslices.edge = lute3d.inribpaths.soundboard_edge;
	lute3d.inribpaths = {};
	
	var edge = getpoints_new(inside_side);
	var inYpoints = edge.Y;
	// for (var i=0; i<edge.length; i++){edge[i].x = -edge[i].x}
	edge = edge.points;
	lute3d.inribpaths.soundboard_edge = edge;
	console.log(edge);
	// side outline as slot
	// 3-4 cross supports from ribshapes
	// Find cross support locations
	var sups = get_waist(edge, get_bouts(edge)); // TODO: These are already calculated in Instrument
	console.log("sups", sups);
	for (var b=0; b < sups.length; b++){
		var shape = [];
		
		mirrorshape(formg,shape,"","guitarmold-cross-"+b,true);
		// Slot for support in main piece
		console.log(sups[b]);
		var slot = [sups[b].scale(1,-1).move(0, -formth/2), 
					sups[b].scale(1,-1).move(0, formth/2)];
		mirrorshape(formg,slot,"","guitarmold-slot-"+b,true);
		// Draw the support
		// TODO: Need sliced version with all subribs
	}
	// middle of back support following middle rib deepest points
	// Draw middle back support on top view
	var slot = [new Point(formth/2, inYpoints[0]-sideth), 
				new Point(formth/2, getlast(inYpoints)-sideth)];
	mirrorshape(formg,slot,"","guitarmold-slot-center",true);
}

function drawsimpleform(inslices, formlength) {
	// Draws carved or whalebone mould plans
	var materialth = editorstate.materialth || 12; // Material thickness in mm, for bottom and cross supports
	var supportw = 30; // 
	var f = getelid("formlayer");
	var jointdepth = 20; // 20mm 
	// form length is from butt to neckblock
	// Move neckjoint surface of the mold by RIBTHICKNESS because its position is defined by outside ribpaths but the mold is created from insideribpaths
	// var formlength = cps.neckblocky-RIBTHICKNESS;
	
	var shape = inslices.slices;
	var edge = inslices.edge;
	var yvals = inslices.yvals;
	var widest_y = inslices.widest_y;
	// var offsets = lute3d.inribpaths.offsets; // Needed since the ribs begin at different y coordinates
	// console.log(offsets);
	
	
	/////////////////////////////////////////////////////////////////////
	// Draw bottom shape from inribpaths.soundboard_edge because the last rib in inslices is sparsely populated
	var bottomg = makegroup(f, "simple-form-bottom-group");
	var borigin = new Point(DRAWINGWIDTH+200,+800);
	var lpoints = [borigin];
	var rpoints = [];
	
	last_yi = 0;
	// var s_edge = lute3d.inribpaths.soundboard_edge;
	// while(s_edge[last_yi].y < formlength){
	
	for (var yi=0; yi<edge.length; yi++){	
		if (edge[yi].y < formlength){
			last_yi = yi;
			
			lpoints.push(borigin.move(-edge[yi].x, -edge[yi].y));
			rpoints.push(borigin.move(edge[yi].x, -edge[yi].y));
		}
		// lpoints.push(borigin.move(-s_edge[last_yi].x, -s_edge[last_yi].y));
		// rpoints.push(borigin.move(s_edge[last_yi].x, -s_edge[last_yi].y));
		
		// last_yi +=1;		
				
	}
	
	// intersect to get last point in the actual Y position wanted
	// var p1 = new Point(s_edge[last_yi-1].x, s_edge[last_yi-1].y);
	var p1 = edge[last_yi];
	var p2 = edge[last_yi+1];
	// var p2 = new Point(s_edge[last_yi].x, s_edge[last_yi].y);
	var yval = formlength;
	var x = p1.x -(Math.abs(p1.y-yval)*Math.abs(p2.x-p1.x))/Math.abs(p2.y-p1.y)
	var ip = new Point(x,yval);
	lpoints.push(borigin.move(-ip.x,-ip.y));
	rpoints.push(borigin.move(ip.x,-ip.y));
	rpoints.reverse();
	lpoints = lpoints.concat(rpoints);
	drawshape(bottomg, lpoints, NOFILLTHIN,"simple-form-bottom", true);
	
	
	/////////////////////////////////////////////////////////////////////
	// Top shape of bottom plate, somewhere in the middle of the last rib
	var lpoints2 = []; 
	var rpoints2 = [];
	var prevx = -1;
	// var yi = 0;
	var lrib = shape[0].ribs.length-1;
	// console.log("Making top of bottom plate, shape:",shape);
	// while(shape[lrib][yi].y <= formlength){
	for (var yi=0; yi<shape.length; yi++){	
		// TODO: If no intersection with last rib, try previous etc
		if (shape[yi].ribs[lrib] && shape[yi].ribs[lrib].y <= formlength && shape[yi].ribs[lrib-1]){
			// console.log("shape[yi]",shape[yi].ribs);
			 
			var ypos = shape[yi].ribs[lrib].y;
			// console.log(shape[lrib][yi+offsets[lrib]]);
			p1 = new Point(	shape[yi].ribs[lrib].x, 
							shape[yi].ribs[lrib].z);
			p2 = new Point(	shape[yi].ribs[lrib-1].x, 
							shape[yi].ribs[lrib-1].z);
			var ix;
			if (p2.y >= materialth){
				ix = p2.x+((p2.y-materialth)*(p1.x-p2.x))/(p2.y-p1.y);
				// console.log((p2.y-materialth),(p1.x-p2.x),(p2.y-p1.y));
			}
			if (ix && ix != prevx ) {
				lpoints2.push(borigin.move(-ix,-ypos));
				rpoints2.push(borigin.move(ix,-ypos));
				prevx = ix;
			}
			// console.log(ix, ypos);
			
		}	
	}
	drawshape(bottomg, lpoints2, NOFILLTHIN,"simple-form-bottom-ltop", false);
	drawshape(bottomg, rpoints2, NOFILLTHIN,"simple-form-bottom-rtop", false);
	// TODO: Draw inside of bottom shape by moving points inwards or something
	
	
	/////////////////////////////////////////////////////////////////////
	// Draw middle support
	// Follow first rib joint
	var midg = makegroup(f, "simple-form-middle-group");
	var morigin = borigin.move(200);
	var points = [];
	last_yi = 0;
	for (var yi=0; yi<shape.length; yi++){	
		if (shape[yi].ribs[0] && shape[yi].ribs[0].z > materialth ){
			last_yi = yi;
			break;
		}
	}
	// Make a point below the first real point at material thickness
	var mid_start_y = shape[last_yi].ribs[0].y;
	points.push(morigin.move(0,-mid_start_y-jointdepth));
	points.push(morigin.move(materialth,-mid_start_y-jointdepth));
	points.push(morigin.move(materialth,-mid_start_y));
	
	for (var yi=last_yi; yi<shape.length; yi++){	
		if (shape[yi].ribs[0] && shape[yi].ribs[0].y < formlength ){
			points.push(morigin.move(shape[yi].ribs[0].z,
							-shape[yi].ribs[0].y));
			last_yi = yi;
		}
	}

	var p1 = new Point(shape[last_yi-1].ribs[0].z,shape[last_yi-1].ribs[0].y);
	var p2 = new Point(shape[last_yi].ribs[0].z,shape[last_yi].ribs[0].y);
	var yval = formlength;
	var x = p1.x -(Math.abs(p1.y-yval)*Math.abs(p2.x-p1.x))/Math.abs(p2.y-p1.y)
	points.push(morigin.move(x,-yval));
	points.push(morigin.move(x-10,-yval));
	points.push(morigin.move(x-10,-yval+materialth));
	points.push(morigin.move(materialth,-yval+materialth));
	points.push(morigin.move(materialth,-yval+jointdepth));
	points.push(morigin.move(0,-yval+jointdepth));
	// points.push(morigin.move(p2.x,-p2.y));
	drawshape(midg, points, NOFILLTHIN,"simple-form-middle", true);
	
	
	/////////////////////////////////////////////////////////////////
	// Draw position of middle support on bottom plate
	var shoop = [borigin.move(-0.5*materialth, -mid_start_y-jointdepth),
				borigin.move(0.5*materialth, -mid_start_y-jointdepth),
				borigin.move(0.5*materialth, -formlength+jointdepth),
				borigin.move(-0.5*materialth, -formlength+jointdepth)];
	drawshape(bottomg, shoop, NOFILLTHIN,"simple-middle-position", true);
	
	
	/////////////////////////////////////////////////////////////////
	// Draw cross supports
	
	var last_yi = 0; // The last y position visited
	var origin = morigin.move(350);
	
	
	// Functions to create shapes used later
	function makecross (ypos,yi, name, number, ori, inside){
		// console.log("makecross",yi,ypos,name+number);
		// console.log("makecross",shape[yi].ribs,shape[yi-1].ribs);
		var rz,rx; // Where to put the number; Return values
		var points = []; // The cross support shape
		var rpoints = []; // Other side of cross support
		var points2 = [ori]; // cross section of the rest of the mold
		// make a group so the number moves with it
		var g = makegroup(f, name+number);
		// TODO: add if !inside 10mm joint on top side or similar
		// Middle of body at the same height as first rib joint
		var height; 
		if (ypos){
			var p = planey3dline(	shape[yi].ribs[0],
									shape[yi-1].ribs[0], ypos)
			// points.push(new Point(	ori.x+(materialth/2.0), 
									// ori.y-p.z+10));
			// rpoints.push(new Point(	ori.x-(materialth/2.0), 
									// ori.y-p.z+10));
									
			points2.push(new Point(	ori.x, ori.y-p.z));	
			points2.push(new Point(	ori.x+(materialth/2.0), 
									ori.y-p.z));	
			height = p.z;
			
		} else {
			points.push(new Point(	ori.x+(materialth/2.0), 
									ori.y-shape[yi].ribs[0].z));
			rpoints.push(new Point(	ori.x-(materialth/2.0), 
									ori.y-shape[yi].ribs[0].z));
									
			points2.push(new Point(	ori.x, ori.y-shape[yi].ribs[0].z));	
			points2.push(new Point(	ori.x+(materialth/2.0), 
									ori.y-shape[yi].ribs[0].z));	
			height = shape[yi].ribs[0].z;
		}
		points2.push(ori.move(materialth/2.0, -materialth));
		
		rz = points[points.length-1];
		// calculate plane and 3d line intersection between points in list
		for (var i =0; shape[yi].ribs[i].z > materialth && i<shape[yi].ribs.length-1; i++){
			if (ypos){
				var p = planey3dline(	shape[yi-1].ribs[i],
										shape[yi].ribs[i], ypos)
				p = new Point(p.x, -p.z);
			} else {
				p = new Point(shape[yi].ribs[i].x, -shape[yi].ribs[i].z);
			}
			
			points.push(ori.move(p.x,p.y));
			rpoints.push(ori.move(-p.x,p.y));

			// Draw short lines showing corners, maybe angle from the two points that are used in getting the shape
			// var angle = Math.atan2(Math.abs(shape[i][yi+offsets[i]].z-shape[i][yi+offsets[i]-1].z), Math.abs(shape[i][yi+offsets[i]].x-shape[i][yi+offsets[i]-1].x))-0.5*Math.PI;
			// if (shape[i][yi+offsets[i]].z<shape[i][yi+offsets[i]-1].z) angle = angle - Math.PI;
			var angle = getangle(p, new Point (0,0));
			var lp = ori.move(p.x,p.y);
			var rp = ori.move(-p.x,p.y);
			drawline(g,[lp.movedist(0.2,angle), lp.movedist(1.5,angle)]);
			drawline(g,[rp.movedist(0.2,-angle), rp.movedist(1.5,-angle)]);
			
		}
		// planey3dline(p1,p2,yval)
		// Intersect last segment with bottom material
		if (ypos){
			var p = planey3dline(	shape[yi-1].ribs[i],
									shape[yi].ribs[i], ypos)
			var p2 = new Point(ori.x+p.x, ori.y-p.z);
		} else {
			var p2 = new Point(ori.x+shape[yi].ribs[i].x, ori.y-shape[yi].ribs[i].z);
		}
		
		
		
		var p1 = points[points.length-1];
		
		var yval = ori.y-materialth;
		var rx = p1.x +(Math.abs(p1.y-yval)*Math.abs(p2.x-p1.x))/Math.abs(p2.y-p1.y)
		var inter = new Point(rx,yval);
		points.push(inter);
		rpoints.push(new Point(ori.x-(inter.x-ori.x),yval));
		points2.push(inter);
		points2.push(p2);
		var width = p2.x-ori.x-jointdepth;
		// Add joint stuff on the bottom
		
		if (inside) {
			
			points.push(p2.move(-jointdepth,-materialth));
			points.push(p2.move(-jointdepth));
			points.push(ori.move(0.5*materialth));
			points.push(ori.move(0.5*materialth, -0.5*height));
			// Other side
			var rp2 = new Point(ori.x-width, p2.y);
			rpoints.push(rp2.move(0,-materialth));
			rpoints.push(rp2);
			rpoints.push(ori.move(-0.5*materialth));
			rpoints.push(ori.move(-0.5*materialth, -0.5*height));
		} else {
			// Small slot on top
			var s = [ori.move(-materialth*0.5, -height-2),
					 ori.move(materialth*0.5, -height-2),
					 ori.move(materialth*0.5, -height+10),
					 ori.move(-materialth*0.5, -height+10)];
			drawshape(g, s, NOFILLTHIN,name+number+"slot", true);
		}
		
		
		if (i < shape[yi].ribs.length-1){
			// If the last rib joint wasn't reached, also draw it in cross2
			if (ypos){
				var p = planey3dline(	getlast(shape[yi-1].ribs),
										getlast(shape[yi].ribs), ypos)
				p = new Point(ori.x+p.x, ori.y-p.z);
			} else {
				p = new Point(	ori.x+getlast(shape[yi].ribs).x, 
								ori.y-getlast(shape[yi].ribs).z);
			}
			points2.push(p);
			
		}
		// Draw bottom and joint stuff of support
		
		
		// Add rpoints /left side of shape
		rpoints.reverse();
		points = points.concat(rpoints);
		
		// Draw it
		// make a group so the number moves with it
		// var g = makegroup(f, name+number);
		var cross = drawshape(g, points, NOFILLTHIN,name+number+"out", true);
		// var cross2 = drawshape(g, points2, NOFILLTHIN,name+number+"other", true);
		// Create a number text box
		// drawtext(g, rz.move(2,10), ""+number)
		// Return actual x,z coordinates for where support touches bottom shape
		return ({width:width, height:0.5*height});
	}
	
	function markpos(fp, place,number,inside){
		var rfootreach = materialth*0.5;
		var lfootreach = -materialth*0.5;
		var shoulderreach = materialth;
		if (inside) {
			rfootreach = fp.width-supportw;
			lfootreach = -fp.width+supportw;
			shoulderreach = -fp.height-supportw;
		}
		var foot = [borigin.move(fp.width,place),
					borigin.move(fp.width,place-materialth),
					borigin.move(-fp.width,place-materialth),
					borigin.move(-fp.width,place)];
		drawshape(bottomg, foot, NOFILLTHIN,"simple-cross-support-foot-r-"+number, true);
		
		var shoulder = [morigin.move(fp.height,place),
					morigin.move(fp.height,place-materialth),
					morigin.move(fp.height*2+2,place-materialth),
					morigin.move(fp.height*2+2,place)];
		drawshape(midg, shoulder, NOFILLTHIN,"simple-cross-support-shoulder-"+number, true);
		

	}
	
	
	//////////////////////////////////////////////////////////////////////////////
	// Split body at regular intervals 
	// Make support at widest_i, and one before that, and one after that at every interval
	// Find (first) widest point (where next x value would be smaller), it might not actually be at widest_i since that refers to outside shape, not mould shape
	var lw = 0, widest_yi,widest_y;
	
	for (var yi=0; yi<shape.length; yi++){	
		if (getlast(shape[yi].ribs) && getlast(shape[yi].ribs).x ){
			if (lw && getlast(shape[yi].ribs).x < lw){

				widest_yi = yi-1;
				widest_y = getlast(shape[widest_yi].ribs).y;
				break;
			}
			lw = getlast(shape[yi].ribs).x;
		}
	}
	
	var fp = makecross(widest_y, widest_yi, "simple-cross-support-widest-",1, origin, true); 
	markpos(fp, -widest_y+(0.5*materialth),1,true);
	
	
	
	/////////////////////////////////////////////////////////////////////////////
	// Last cross section is the neckblock face, before that is -materialth
	
	for (var yi=0; yi<shape.length; yi++){	
		if (getlast(shape[yi].ribs) && getlast(shape[yi].ribs).y ){
			if (getlast(shape[yi].ribs).y > formlength){
				var fp = makecross(formlength, yi, "simple-neckblock-face-",2, origin.move(0,-200), false);
				// markpos(fp, -formlength+materialth,2,true);
				break;
			}
		}
	}
	
	
	
}

function drawsimpleform2(inslices, formlength) {
	// Draws carved or whalebone mould plans
	var materialth = editorstate.materialth || 12; // Material thickness in mm, for bottom and cross supports
	var supportw = 30; // 
	var f = getelid("formlayer");
	var jointdepth = 10; // 20mm 
	// form length is from butt to neckblock
	// Move neckjoint surface of the mold by RIBTHICKNESS because its position is defined by outside ribpaths but the mold is created from insideribpaths
	// var formlength = cps.neckblocky-RIBTHICKNESS;
	
	var shape = inslices.slices;
	var edge = inslices.edge;
	var yvals = inslices.yvals;
	var widest_y = inslices.widest_y;
	// var offsets = lute3d.inribpaths.offsets; // Needed since the ribs begin at different y coordinates
	// console.log(offsets);
	
	
	/////////////////////////////////////////////////////////////////////
	// Draw bottom shape from inribpaths.soundboard_edge because the last rib in inslices is sparsely populated
	var bottomg = makegroup(f, "simple-form2-bottom-group");
	var borigin = new Point(DRAWINGWIDTH+200,+800+700);
	var lpoints = [borigin];
	var rpoints = [];
	
	last_yi = 0;
	// var s_edge = lute3d.inribpaths.soundboard_edge;
	// while(s_edge[last_yi].y < formlength){
	
	for (var yi=0; yi<edge.length; yi++){	
		if (edge[yi].y < formlength){
			last_yi = yi;
			
			lpoints.push(borigin.move(-edge[yi].x, -edge[yi].y));
			rpoints.push(borigin.move(edge[yi].x, -edge[yi].y));
		}
		// lpoints.push(borigin.move(-s_edge[last_yi].x, -s_edge[last_yi].y));
		// rpoints.push(borigin.move(s_edge[last_yi].x, -s_edge[last_yi].y));
		
		// last_yi +=1;		
				
	}
	
	// intersect to get last point in the actual Y position wanted
	// var p1 = new Point(s_edge[last_yi-1].x, s_edge[last_yi-1].y);
	var p1 = edge[last_yi];
	var p2 = edge[last_yi+1];
	// var p2 = new Point(s_edge[last_yi].x, s_edge[last_yi].y);
	var yval = formlength;
	var x = p1.x -(Math.abs(p1.y-yval)*Math.abs(p2.x-p1.x))/Math.abs(p2.y-p1.y)
	var ip = new Point(x,yval);
	lpoints.push(borigin.move(-ip.x,-ip.y));
	rpoints.push(borigin.move(ip.x,-ip.y));
	rpoints.reverse();
	lpoints = lpoints.concat(rpoints);
	drawshape(bottomg, lpoints, NOFILLTHIN,"simple-form2-bottom", true);
	
	
	/////////////////////////////////////////////////////////////////////
	// Top shape of bottom plate, somewhere in the middle of the last rib
	var lpoints2 = []; 
	var rpoints2 = [];
	var prevx = -1;
	// var yi = 0;
	var lrib = shape[0].ribs.length-1;
	// console.log("Making top of bottom plate, shape:",shape);
	// while(shape[lrib][yi].y <= formlength){
	for (var yi=0; yi<shape.length; yi++){	
		// TODO: If no intersection with last rib, try previous etc
		if (shape[yi].ribs[lrib] && shape[yi].ribs[lrib].y <= formlength && shape[yi].ribs[lrib-1]){
			// console.log("shape[yi]",shape[yi].ribs);
			 
			var ypos = shape[yi].ribs[lrib].y;
			// console.log(shape[lrib][yi+offsets[lrib]]);
			p1 = new Point(	shape[yi].ribs[lrib].x, 
							shape[yi].ribs[lrib].z);
			p2 = new Point(	shape[yi].ribs[lrib-1].x, 
							shape[yi].ribs[lrib-1].z);
			var ix;
			if (p2.y >= materialth){
				ix = p2.x+((p2.y-materialth)*(p1.x-p2.x))/(p2.y-p1.y);
				// console.log((p2.y-materialth),(p1.x-p2.x),(p2.y-p1.y));
			}
			if (ix && ix != prevx ) {
				lpoints2.push(borigin.move(-ix,-ypos));
				rpoints2.push(borigin.move(ix,-ypos));
				prevx = ix;
			}
			// console.log(ix, ypos);
			
		}	
	}
	drawshape(bottomg, lpoints2, NOFILLTHIN,"simple-form2-bottom-ltop", false);
	drawshape(bottomg, rpoints2, NOFILLTHIN,"simple-form2-bottom-rtop", false);
	// TODO: Draw inside of bottom shape by moving points inwards or something
	
	
	/////////////////////////////////////////////////////////////////////
	// Draw middle support
	// Follow first rib joint
	var midg = makegroup(f, "simple-form2-middle-group");
	var morigin = borigin.move(200);
	var points = [];
	last_yi = 0;
	for (var yi=0; yi<shape.length; yi++){	
		if (shape[yi].ribs[0] && shape[yi].ribs[0].z > materialth ){
			last_yi = yi;
			break;
		}
	}
	// Make a point below the first real point at material thickness
	var mid_start_y = shape[last_yi].ribs[0].y;
	points.push(morigin.move(0,-mid_start_y-20));
	points.push(morigin.move(materialth,-mid_start_y-20));
	points.push(morigin.move(materialth,-mid_start_y));
	
	for (var yi=last_yi; yi<shape.length; yi++){	
		if (shape[yi].ribs[0] && shape[yi].ribs[0].y < formlength ){
			points.push(morigin.move(shape[yi].ribs[0].z,
							-shape[yi].ribs[0].y));
			last_yi = yi;
		}
	}

	var p1 = new Point(shape[last_yi-1].ribs[0].z,shape[last_yi-1].ribs[0].y);
	var p2 = new Point(shape[last_yi].ribs[0].z,shape[last_yi].ribs[0].y);
	var yval = formlength;
	var x = p1.x -(Math.abs(p1.y-yval)*Math.abs(p2.x-p1.x))/Math.abs(p2.y-p1.y)
	points.push(morigin.move(x,-yval));
	// points.push(morigin.move(x-10,-yval));
	points.push(morigin.move(x,-yval+materialth));
	points.push(morigin.move(materialth,-yval+materialth));
	points.push(morigin.move(materialth,-yval+20));
	points.push(morigin.move(0,-yval+20));
	// points.push(morigin.move(p2.x,-p2.y));
	drawshape(midg, points, NOFILLTHIN,"simple-form2-middle", true);
	
	
	/////////////////////////////////////////////////////////////////
	// Draw position of middle support on bottom plate
	var shoop = [borigin.move(-0.5*materialth, -mid_start_y-20),
				borigin.move(0.5*materialth, -mid_start_y-20),
				borigin.move(0.5*materialth, -formlength+20),
				borigin.move(-0.5*materialth, -formlength+20)];
	drawshape(bottomg, shoop, NOFILLTHIN,"simple2-middle-position", true);
	
	
	/////////////////////////////////////////////////////////////////
	// Draw cross supports
	
	var last_yi = 0; // The last y position visited
	var origin = morigin.move(350);
	
	
	// Functions to create shapes used later
	function makecross (ypos,yi, name, number, ori, inside){
		// console.log("makecross",yi,ypos,name+number);
		// console.log("makecross",shape[yi].ribs,shape[yi-1].ribs);
		var rz,rx; // Where to put the number; Return values
		var points = []; // The cross support shape
		var rpoints = []; // Other side of cross support
		// var points2 = [ori]; // cross section of the rest of the mold
		// make a group so the number moves with it
		var g = makegroup(f, name+number);
		// TODO: add if !inside 10mm joint on top side or similar
		// Middle of body at the same height as first rib joint
		var height; 
		if (ypos){
			var p = planey3dline(	shape[yi].ribs[0],
									shape[yi-1].ribs[0], ypos)
			// points.push(new Point(	ori.x+(materialth/2.0), 
									// ori.y-p.z+10));
			// rpoints.push(new Point(	ori.x-(materialth/2.0), 
									// ori.y-p.z+10));
									
	
			height = p.z;
			
		} else {
			points.push(new Point(	ori.x+(materialth/2.0), 
									ori.y-shape[yi].ribs[0].z));
			rpoints.push(new Point(	ori.x-(materialth/2.0), 
									ori.y-shape[yi].ribs[0].z));
										
			height = shape[yi].ribs[0].z;
		}
		
		
		rz = points[points.length-1];
		// calculate plane and 3d line intersection between points in list
		for (var i =0; shape[yi].ribs[i].z > materialth && i<shape[yi].ribs.length-1; i++){
			if (ypos){
				var p = planey3dline(	shape[yi-1].ribs[i],
										shape[yi].ribs[i], ypos)
				p = new Point(p.x, -p.z);
			} else {
				p = new Point(shape[yi].ribs[i].x, -shape[yi].ribs[i].z);
			}
			
			points.push(ori.move(p.x,p.y));
			rpoints.push(ori.move(-p.x,p.y));

			// Draw short lines showing corners, maybe angle from the two points that are used in getting the shape
			var angle = getangle(p, new Point (0,0));
			var lp = ori.move(p.x,p.y);
			var rp = ori.move(-p.x,p.y);
			drawline(g,[lp.movedist(0.2,angle), lp.movedist(1.5,angle)]);
			drawline(g,[rp.movedist(0.2,-angle), rp.movedist(1.5,-angle)]);
			
		}
		// planey3dline(p1,p2,yval)
		// Intersect last segment with bottom material
		if (ypos){
			var p = planey3dline(	shape[yi-1].ribs[i],
									shape[yi].ribs[i], ypos)
			var p2 = new Point(ori.x+p.x, ori.y-p.z);
		} else {
			var p2 = new Point(ori.x+shape[yi].ribs[i].x, ori.y-shape[yi].ribs[i].z);
		}
		
		// console.log("simple form2 leg height",number,p2.y);
		
		var p1 = points[points.length-1];
		// drawcircle(formlayer, p2, 0.5, REDSTYLE);
		var yval = ori.y-materialth;
		var rx = p1.x +(Math.abs(p1.y-yval)*Math.abs(p2.x-p1.x))/Math.abs(p2.y-p1.y)
		var inter = new Point(rx,yval);
		points.push(inter);
		rpoints.push(new Point(ori.x-(inter.x-ori.x),yval));
		
		// Get real bottom corner
		if (ypos){
			var p = planey3dline(	getlast(shape[yi-1].ribs),
									getlast(shape[yi].ribs), ypos)
			var p2 = new Point(ori.x+p.x, ori.y);
		} else {
			var p2 = new Point(ori.x+getlast(shape[yi].ribs).x, ori.y);
		}
		// drawcircle(formlayer, p2, 0.5, BLUESTYLE);
		
		var width = p2.x-ori.x-jointdepth;
		// Add joint stuff on the bottom
		
		if (inside) {
			
			points.push(p2.move(-jointdepth,-materialth));
			points.push(p2.move(-jointdepth));
			points.push(p2.move(-jointdepth*2));
			points.push(p2.move(-jointdepth*2, -materialth));
			var bz1 = p2.move(-jointdepth*3, -materialth);
			var bz2 = ori.move(0.5*materialth, -height+30);
			points.push(bz1);
			// make control points for underside bezier
			var mp = midpoint(bz1,bz2);
			var cp1 = new Point(bz1.x, mp.y);
			var cp2 = new Point(mp.x, bz2.y);
			points.push(bz2.bezier(cp1,cp2));
			points.push(ori.move(0.5*materialth, -height+20));
			
			// Other side
			var rp2 = new Point(ori.x-width, p2.y);
			
			rpoints.push(rp2.move(0,-materialth));
			rpoints.push(rp2);
			rpoints.push(rp2.move(jointdepth));
			rpoints.push(rp2.move(jointdepth, -materialth));
			var bz1 = rp2.move(jointdepth*2, -materialth);
			var bz2 = ori.move(-0.5*materialth, -height+30);
			var mp = midpoint(bz1,bz2);
			var cp1 = new Point(bz1.x, mp.y);
			var cp2 = new Point(mp.x, bz2.y);
			rpoints.push(bz1.bezier(cp2,cp1)); // Different order since this array gets reversed
			
			rpoints.push(bz2);
			rpoints.push(ori.move(-0.5*materialth, -height+20));
		} else {
			// Small slot on top
			// var s = [ori.move(-materialth*0.5, -height-2),
					 // ori.move(materialth*0.5, -height-2),
					 // ori.move(materialth*0.5, -height+10),
					 // ori.move(-materialth*0.5, -height+10)];
			// drawshape(g, s, NOFILLTHIN,name+number+"slot2", true);
		}
		
		
		if (i < shape[yi].ribs.length-1){
			// If the last rib joint wasn't reached, also draw it in cross2
			if (ypos){
				var p = planey3dline(	getlast(shape[yi-1].ribs),
										getlast(shape[yi].ribs), ypos)
				p = new Point(ori.x+p.x, ori.y-p.z);
			} else {
				p = new Point(	ori.x+getlast(shape[yi].ribs).x, 
								ori.y-getlast(shape[yi].ribs).z);
			}
			
			
		}
		// Draw bottom and joint stuff of support
		
		
		// Add rpoints /left side of shape
		rpoints.reverse();
		points = points.concat(rpoints);
		
		// Draw it
		// make a group so the number moves with it
		// var g = makegroup(f, name+number);
		var cross = drawshape(g, points, NOFILLTHIN,name+number+"out2", true);
		// var cross2 = drawshape(g, points2, NOFILLTHIN,name+number+"other", true);
		// Create a number text box
		// drawtext(g, rz.move(2,10), ""+number)
		// Return actual x,z coordinates for where support touches bottom shape
		return ({width:width, height:height-20});
	}
	
	function markpos(fp, place,number,inside){
		var rfootreach = materialth*0.5;
		var lfootreach = -materialth*0.5;
		var shoulderreach = materialth;
		if (inside) {
			rfootreach = fp.width-supportw;
			lfootreach = -fp.width+supportw;
			shoulderreach = -fp.height-supportw;
		}
		var foot = [borigin.move(-fp.width,place),
					borigin.move(-fp.width,place-materialth),
					borigin.move(-fp.width+jointdepth,place-materialth),
					borigin.move(-fp.width+jointdepth,place)];
		drawshape(bottomg, foot, NOFILLTHIN,"simple2-cross-support-foot-l-"+number, true);
		
		var rfoot = [borigin.move(fp.width,place),
					borigin.move(fp.width,place-materialth),
					borigin.move(fp.width-jointdepth,place-materialth),
					borigin.move(fp.width-jointdepth,place)];
		drawshape(bottomg, rfoot, NOFILLTHIN,"simple2-cross-support-foot-r-"+number, true);
		
		var shoulder = [morigin.move(fp.height,place),
					morigin.move(fp.height,place-materialth),
					morigin.move(fp.height+40,place-materialth),
					morigin.move(fp.height+40,place)];
		drawshape(midg, shoulder, NOFILLTHIN,"simple2-cross-support-shoulder-"+number, true);
		

	}
	
	
	//////////////////////////////////////////////////////////////////////////////
	// Split body at regular intervals 
	// Make support at widest_i, and one before that, and one after that at every interval
	// Find (first) widest point (where next x value would be smaller), it might not actually be at widest_i since that refers to outside shape, not mould shape
	var lw = 0, widest_yi,widest_y;
	
	for (var yi=0; yi<shape.length; yi++){	
		if (getlast(shape[yi].ribs) && getlast(shape[yi].ribs).x ){
			if (lw && getlast(shape[yi].ribs).x < lw){

				widest_yi = yi-1;
				widest_y = getlast(shape[widest_yi].ribs).y;
				break;
			}
			lw = getlast(shape[yi].ribs).x;
		}
	}
	
	var fp = makecross(widest_y, widest_yi, "simple2-cross-support-widest-",3, origin, true); 
	markpos(fp, -widest_y+(0.5*materialth),3,true);
	
	// Do two between widest and last of the butts
	try {
	var fourth_yi = parseInt(widest_yi*0.4);
	var fourth_y = getlast(shape[fourth_yi].ribs).y;
	var fp = makecross(fourth_y, fourth_yi, "cross2-support-1",1, origin, true); 
	markpos(fp, -fourth_y,1,true);
	var fourth_yi = parseInt(widest_yi*0.7);
	var fourth_y = getlast(shape[fourth_yi].ribs).y;
	var fp = makecross(fourth_y, fourth_yi, "cross2-support-2",2, origin, true); 
	markpos(fp, -fourth_y,2,true);
	} catch(e){console.log("Failed fourth_y");}
	
	//////////////////////////////////////////////////////////////////////////////
	// Draw the rest of the cross supports
	try {
	var wanted_interval = 80;
	var intervals = Math.floor((formlength-widest_y+materialth)/wanted_interval);
	var interval = Math.floor((formlength-widest_y+materialth)/intervals); // even mm's
	// console.log("simple2 form interval", interval);
	var last_yi = fourth_yi;
	for (var i=1; i<intervals; i++){
		// TODO: Consider changing this while to for,if too
		while(shape[last_yi].ribs[0].y < widest_y+interval*i){
			last_yi +=1;
		}
		// Make a cross support here
		var fp = makecross(widest_y+interval*i, last_yi, "cross2-support-main-",i+5, origin, true); // .move(i*50.0, -supportw*i-20)
		// Mark its position on bottom and middle
		markpos(fp,-widest_y-interval*i+materialth,i+5,true);

	}
	} catch(e){console.log("Failed a cross support");}
	
	/////////////////////////////////////////////////////////////////////////////
	// Last cross section is the neckblock face, before that is -materialth
	
	for (var yi=0; yi<shape.length; yi++){	
		if (getlast(shape[yi].ribs) && getlast(shape[yi].ribs).y ){
			if (getlast(shape[yi].ribs).y > formlength){
				var fp = makecross(formlength, yi, "simple2-neckblock-face-",2, origin.move(0,-200), false);
				// markpos(fp, -formlength+materialth,2,true);
				break;
			}
		}
	}
	
	
	
}

function drawcarvedform(inslices, formlength) {
	// Draws carved or whalebone mould plans
	var materialth = editorstate.materialth || 12; // Material thickness in mm, for bottom and cross supports
	var supportw = 30; // 
	var f = getelid("formlayer");
	var wanted_interval = 70; // Max distance between cross supports
	// form length is from butt to neckblock
	// Move neckjoint surface of the mold by RIBTHICKNESS because its position is defined by outside ribpaths but the mold is created from insideribpaths
	// var formlength = cps.neckblocky-RIBTHICKNESS;
	
	var shape = inslices.slices;
	var edge = inslices.edge;
	var yvals = inslices.yvals;
	var widest_y = inslices.widest_y;
	// var offsets = lute3d.inribpaths.offsets; // Needed since the ribs begin at different y coordinates
	// console.log(offsets);
	
	
	/////////////////////////////////////////////////////////////////////
	// Draw bottom shape from inribpaths.soundboard_edge because the last rib in inslices is sparsely populated
	var bottomg = makegroup(f, "carved-form-bottom-group");
	var borigin = new Point(DRAWINGWIDTH+100,-100);
	var lpoints = [borigin];
	var rpoints = [];
	
	last_yi = 0;
	// var s_edge = lute3d.inribpaths.soundboard_edge;
	// while(s_edge[last_yi].y < formlength){
	
	for (var yi=0; yi<edge.length; yi++){	
		if (edge[yi].y < formlength){
			last_yi = yi;
			
			lpoints.push(borigin.move(-edge[yi].x, -edge[yi].y));
			rpoints.push(borigin.move(edge[yi].x, -edge[yi].y));
		}
		// lpoints.push(borigin.move(-s_edge[last_yi].x, -s_edge[last_yi].y));
		// rpoints.push(borigin.move(s_edge[last_yi].x, -s_edge[last_yi].y));
		
		// last_yi +=1;		
				
	}
	
	// intersect to get last point in the actual Y position wanted
	// var p1 = new Point(s_edge[last_yi-1].x, s_edge[last_yi-1].y);
	var p1 = edge[last_yi];
	var p2 = edge[last_yi+1];
	// var p2 = new Point(s_edge[last_yi].x, s_edge[last_yi].y);
	var yval = formlength;
	var x = p1.x -(Math.abs(p1.y-yval)*Math.abs(p2.x-p1.x))/Math.abs(p2.y-p1.y)
	var ip = new Point(x,yval);
	lpoints.push(borigin.move(-ip.x,-ip.y));
	rpoints.push(borigin.move(ip.x,-ip.y));
	rpoints.reverse();
	lpoints = lpoints.concat(rpoints);
	drawshape(bottomg, lpoints, NOFILLTHIN,"carved-form-bottom", true);
	
	
	/////////////////////////////////////////////////////////////////////
	// Top shape of bottom plate, somewhere in the middle of the last rib
	var lpoints2 = []; 
	var rpoints2 = [];
	var prevx = -1;
	// var yi = 0;
	var lrib = shape[0].ribs.length-1;
	// console.log("Making top of bottom plate, shape:",shape);
	// while(shape[lrib][yi].y <= formlength){
	for (var yi=0; yi<shape.length; yi++){	
		
		if (shape[yi].ribs[lrib] && shape[yi].ribs[lrib].y <= formlength && shape[yi].ribs[lrib-1]){
			// console.log("shape[yi]",shape[yi].ribs);
			 
			var ypos = shape[yi].ribs[lrib].y;
			// console.log(shape[lrib][yi+offsets[lrib]]);
			p1 = new Point(	shape[yi].ribs[lrib].x, 
							shape[yi].ribs[lrib].z);
			p2 = new Point(	shape[yi].ribs[lrib-1].x, 
							shape[yi].ribs[lrib-1].z);
			var ix;
			if (p2.y >= materialth){
				ix = p2.x+((p2.y-materialth)*(p1.x-p2.x))/(p2.y-p1.y);
				// console.log((p2.y-materialth),(p1.x-p2.x),(p2.y-p1.y));
			}
			if (ix && ix != prevx ) {
				lpoints2.push(borigin.move(-ix,-ypos));
				rpoints2.push(borigin.move(ix,-ypos));
				prevx = ix;
			}
			// console.log(ix, ypos);
			
		}	
	}
	drawshape(bottomg, lpoints2, NOFILLTHIN,"carved-form-bottom-ltop", false);
	drawshape(bottomg, rpoints2, NOFILLTHIN,"carved-form-bottom-rtop", false);
	
	
	/////////////////////////////////////////////////////////////////////
	// Draw middle support
	// Follow first rib joint
	var midg = makegroup(f, "carved-form-middle-group");
	var morigin = new Point(DRAWINGWIDTH-300,-100);
	var points = [];
	last_yi = 0;
	for (var yi=0; yi<shape.length; yi++){	
		if (shape[yi].ribs[0] && shape[yi].ribs[0].z > materialth ){
			last_yi = yi;
			break;
		}
	}
	// Make a point below the first real point at marerial thickness
	var mid_start_y = shape[last_yi].ribs[0].y;
	points.push(morigin.move(materialth,-mid_start_y));
	
	for (var yi=last_yi; yi<shape.length; yi++){	
		if (shape[yi].ribs[0] && shape[yi].ribs[0].y < formlength ){
			points.push(morigin.move(shape[yi].ribs[0].z,
							-shape[yi].ribs[0].y));
			last_yi = yi;
		}
	}
	
	var yval = formlength;
	if (shape[last_yi-1].ribs[0] !== null){
		var p1 = new Point(shape[last_yi-1].ribs[0].z, shape[last_yi-1].ribs[0].y);
		var p2 = new Point(shape[last_yi].ribs[0].z,shape[last_yi].ribs[0].y);
		var x = p1.x -(Math.abs(p1.y-yval)*Math.abs(p2.x-p1.x))/Math.abs(p2.y-p1.y)
			points.push(morigin.move(x,-yval));
	}
	
	
	
	points.push(morigin.move(materialth,-yval));
	// points.push(morigin.move(p2.x,-p2.y));
	drawshape(midg, points, NOFILLTHIN,"carved-form-middle", true);
	
	
	/////////////////////////////////////////////////////////////////
	// Draw position of middle support on bottom plate
	var shoop = [borigin.move(-0.5*materialth, -mid_start_y),
				borigin.move(0.5*materialth, -mid_start_y),
				borigin.move(0.5*materialth, -formlength),
				borigin.move(-0.5*materialth, -formlength)];
	drawshape(bottomg, shoop, NOFILLTHIN,"middle-position", true);
	
	
	/////////////////////////////////////////////////////////////////
	// Draw cross supports
	
	var last_yi = 0; // The last y position visited
	var origin = new Point(DRAWINGWIDTH+100,20);
	
	
	// Functions to create shapes used later
	function makecross (ypos,yi, name, number, ori, inside){
		// console.log("makecross",yi,ypos,name+number);
		// console.log("makecross",shape[yi].ribs,shape[yi-1].ribs);
		var rz,rx; // Where to put the number; Return values
		var points = []; // The cross support shape
		var points2 = [ori]; // cross section of the rest of the mold
		// make a group so the number moves with it
		var g = makegroup(f, name+number);
		if (!inside) { // Full plate, draw center point
			points.push(ori.move(materialth/2.0, -materialth));
		} 
		// Middle of body at the same height as first rib joint
		if (ypos){
			var p = planey3dline(	shape[yi].ribs[0],
									shape[yi-1].ribs[0], ypos)
			points.push(new Point(	ori.x+(materialth/2.0), 
									ori.y-p.z));	
			points2.push(new Point(	ori.x, ori.y-p.z));	
			points2.push(new Point(	ori.x+(materialth/2.0), 
									ori.y-p.z));	
			
		} else {
			points.push(new Point(	ori.x+(materialth/2.0), 
									ori.y-shape[yi].ribs[0].z));	
			points2.push(new Point(	ori.x, ori.y-shape[yi].ribs[0].z));	
			points2.push(new Point(	ori.x+(materialth/2.0), 
									ori.y-shape[yi].ribs[0].z));							
		}
		points2.push(ori.move(materialth/2.0, -materialth));
		
		rz = points[points.length-1];
		// calculate plane and 3d line intersection between points in list
		for (var i =0; shape[yi].ribs[i].z > materialth && i<shape[yi].ribs.length-1; i++){
			if (ypos){
				var p = planey3dline(	shape[yi-1].ribs[i],
										shape[yi].ribs[i], ypos)
				p = new Point(ori.x+p.x, ori.y-p.z);
			} else {
				p = new Point(	ori.x+shape[yi].ribs[i].x, 
								ori.y-shape[yi].ribs[i].z);
			}
			
			points.push(p);

			// Draw short lines showing corners, maybe angle from the two points that are used in getting the shape
			// var angle = Math.atan2(Math.abs(shape[i][yi+offsets[i]].z-shape[i][yi+offsets[i]-1].z), Math.abs(shape[i][yi+offsets[i]].x-shape[i][yi+offsets[i]-1].x))-0.5*Math.PI;
			// if (shape[i][yi+offsets[i]].z<shape[i][yi+offsets[i]-1].z) angle = angle - Math.PI;
			var angle = getangle(p, ori);
			drawline(g,[p, p.movedist(1.5,angle)]);
			
		}
		// planey3dline(p1,p2,yval)
		// Intersect last segment with bottom material
		if (ypos){
			var p = planey3dline(	shape[yi-1].ribs[i],
									shape[yi].ribs[i], ypos)
			var p2 = new Point(ori.x+p.x, ori.y-p.z);
		} else {
			var p2 = new Point(ori.x+shape[yi].ribs[i].x, ori.y-shape[yi].ribs[i].z);
		}
		
		
		
		var p1 = points[points.length-1];
		
		var yval = ori.y-materialth;
		var rx = p1.x +(Math.abs(p1.y-yval)*Math.abs(p2.x-p1.x))/Math.abs(p2.y-p1.y)
		var inter = new Point(rx,yval);
		points.push(inter);
		points2.push(inter);
		points2.push(p2);
		if (i < shape[yi].ribs.length-1 && getlast(shape[yi-1].ribs)){
			// If the last rib joint wasn't reached, also draw it in cross2
			if (ypos){
				// console.log(getlast(shape[yi-1]));
				var p = planey3dline(	getlast(shape[yi-1].ribs),
										getlast(shape[yi].ribs), ypos)
				p = new Point(ori.x+p.x, ori.y-p.z);
			} else {
				p = new Point(	ori.x+getlast(shape[yi].ribs).x, 
								ori.y-getlast(shape[yi].ribs).z);
			}
			points2.push(p);
		}
		// Curved inside 
		if (inside) { 
			var lip = points[points.length-1].move(-supportw) // lower inside point
			points.push(lip);
			var curve = points[0].move(0,supportw) // End of curve
			var h = 0.5*Math.abs(lip.y-curve.y)*(editorstate.bulge-1);
			var w = 0.6*Math.abs(lip.x-curve.x);
			
			var cp1 = lip.move(0,-h);
			var cp2 = curve.move(w);
			curve.bezier(cp1,cp2);
			points.push(curve);
		} 
		// Draw it
		// make a group so the number moves with it
		var g = makegroup(f, name+number);
		var cross = drawshape(g, points, NOFILLTHIN,"", true);
		var cross2 = drawshape(g, points2, NOFILLTHIN,"", true);
		// Create a number text box
		drawtext(g, rz.move(2,10), ""+number)
		// Return actual x,z coordinates for where support touches bottom shape
		return (new Point(rx-ori.x,yval,rz.y-ori.y));
	}
	function markpos(fp, place,number,inside){
		var rfootreach = materialth*0.5;
		var lfootreach = -materialth*0.5;
		var shoulderreach = materialth;
		if (inside) {
			rfootreach = fp.x-supportw;
			lfootreach = -fp.x+supportw;
			shoulderreach = -fp.z-supportw;
		}
		var foot = [borigin.move(fp.x,place),
					borigin.move(fp.x,place-materialth),
					borigin.move(rfootreach,place-materialth),
					borigin.move(rfootreach,place)];
		drawshape(bottomg, foot, NOFILLTHIN,"cross-support-foot-r-"+number, true);
		
		var foot = [borigin.move(-fp.x,place),
					borigin.move(-fp.x,place-materialth),
					borigin.move(lfootreach,place-materialth),
					borigin.move(lfootreach,place)];
		drawshape(bottomg, foot, NOFILLTHIN,"cross-support-foot-l-"+number, true);
		
		var shoulder = [morigin.move(-fp.z,place),
					morigin.move(-fp.z,place-materialth),
					morigin.move(shoulderreach,place-materialth),
					morigin.move(shoulderreach,place)];
		drawshape(midg, shoulder, NOFILLTHIN,"cross-support-shoulder-"+number, true);
		
		drawtext(bottomg, borigin.move(fp.x-10,place-3), ""+number)
		drawtext(midg, morigin.move(-fp.z-10,place-3), ""+number)
	}
	
	///////////////////////////////////////////////////////////////////////
	// First split body at the butt end at three points for a solid butt
	for (var i=1; i<=3; i++){ // Do three times
		// Find correct position in y
		for (var yi=0; yi<shape.length; yi++){	
			if (shape[yi].ribs[0] && shape[yi].ribs[0].y > materialth*i ){
				last_yi = yi;
				break;
			}
		}

		// Make a cross support here
		var fp = makecross(materialth*i, last_yi, "cross-support-butt-",i, origin, false);
		markpos(fp, -materialth*(i-1),i,false);
	}
	var third_yi = last_yi;
	
	
	//////////////////////////////////////////////////////////////////////////////
	// Split body at regular intervals 
	// Make support at widest_i, and one before that, and one after that at every interval
	// Find (first) widest point (where next x value would be smaller), it might not actually be at widest_i since that refers to outside shape, not mould shape
	var lw = 0, widest_yi,widest_y;
	
	for (var yi=last_yi; yi<shape.length; yi++){	
		if (getlast(shape[yi].ribs).x ){
			if (lw && getlast(shape[yi].ribs).x < lw){

				widest_yi = yi-1;
				widest_y = getlast(shape[widest_yi].ribs).y;
				break;
			}
			lw = getlast(shape[yi].ribs).x;
		}
	}
	
	var fp = makecross(widest_y, widest_yi, "cross-support-widest-",5, origin, true); 
	markpos(fp, -widest_y+(0.5*materialth),5,true);
	
	// Do one between widest and last of the butts
	var fourth_yi = parseInt(widest_yi-(widest_yi-third_yi)*0.6);
	// console.log("fourth_yi",fourth_yi);
	var fourth_y = getlast(shape[fourth_yi].ribs).y;
	// console.log("fourth_yi",fourth_yi)
	// It occupies materialth after fourth_y; on a short body move it back so it does not overlap the widest support
	var fourth_room = widest_y - 1.5*materialth;
	if (fourth_y > fourth_room){
		fourth_y = fourth_room;
		while (fourth_yi > 1 && shape[fourth_yi-1].ribs[0] && shape[fourth_yi-1].ribs[0].y >= fourth_y) fourth_yi--;
	}
	if (fourth_y >= 3*materialth){ // Leave it out if there is no room after the butt supports
		var fp = makecross(fourth_y, fourth_yi, "cross-support-",4, origin, true); 
		markpos(fp, -fourth_y,4,true);
	}
	
	
	//////////////////////////////////////////////////////////////////////////////
	// Draw the rest of the cross supports
	var intervals = Math.abs((formlength-widest_y)/wanted_interval);
	var interval = Math.abs((formlength-widest_y)/intervals); // even mm's
	// A main support occupies materialth before its station and the last support the last materialth of the form,
	// so stop where they would overlap or touch
	for (var i=1; i<intervals && widest_y+interval*i <= formlength-2*materialth; i++){
		// TODO: Consider changing this while to for,if too
		while(shape[last_yi].ribs[0].y < widest_y+interval*i){
			last_yi +=1;
		}
		// Make a cross support here
		var fp = makecross(widest_y+interval*i, last_yi, "cross-support-main-",i+5, origin, true); // .move(i*50.0, -supportw*i-20)
		// Mark its position on bottom and middle
		markpos(fp,-widest_y-interval*i+materialth,i+5,true);

	}
	
	
	/////////////////////////////////////////////////////////////////////////////
	// Last cross section is the neckblock face, before that is -materialth
	while(shape[last_yi].ribs[0].y < formlength-materialth){
		last_yi +=1;
	}
	var fp = makecross(formlength-materialth, last_yi, "last-support-",i+5, origin.move(0,100), false);
	markpos(fp, -formlength+materialth, i+5,false);
	
	
	while(shape[last_yi].ribs[0].y < formlength){
		last_yi +=1;
	}
	var fp = makecross(formlength, last_yi, "necblock-face-",i+6, origin.move(0,100), false);
	
	// Adaptor piece between form and neckblock for using a 10c form to make a 7c or 6c lute
	if (cps.neckwidth >= 90){
		var fp = makecross(formlength, last_yi, "adaptor-face-",i+6, origin.move(0,200), false);
		while(shape[last_yi].ribs[0].y < formlength+20){
			last_yi +=1;
		}
		var fp = makecross(formlength+20, last_yi, "adaptor-face-",i+7, origin.move(0,200), false);
		// Make a helper for the 6c neckblock
		while(shape[last_yi].ribs[0].z > 27){
			last_yi +=1;
		}
		// var fp = makecross(shape[0][last_yi+offsets[0]].y, last_yi, "helper-face-",i+8, origin.move(0,250), false);
		
	}
	
}

function drawfoamcore() {
	// Draws foamcore mould plans
	
	var startheight = 50; // space for end block
	var endheight = 50 ; // space for neckblock
	var blockwidth = 24;
	var plywood = 3.8;
	var jointdepth = 4.0;
	var supports = 2;
	var ribheight = 15.0;
	var formlayer = getelid("formlayer");
	var r = lute3d.inribpaths.form_supports;
	var form3d = {};
	// console.log(r);
	// r = r.concat([lute3d.ribpaths.soundboard_edge]);
	// console.log(r);
	var startheights = []; // Actually list of points
	var endheights = []; // Just heights
	var buttblockshape = []; // Thick end blocks are drawn based on these
	var neckblockshape = [];
	// Quickhand functions
	function makejoint(){
		
		s.push(s[s.length-1].move(0,jointdepth));
		var jp = new Point(s[s.length-1].x, s[s.length-1].y);
		s.push(s[s.length-1].move(-plywood,0));
		s.push(s[s.length-1].move(0,-jointdepth));
		// Return distance from soundboard to joint
		return jp;
	}
	function followrib(endp,distance){
		// Follow rib joint on the inside of the mold
		// Go to endp, then convert line to arc that attempts to follow the rib surface above it.
		// TODO: Find distance from ribjoint surface at this x coordinate
		// s.push(endp);
		var p1 = s[s.length-1];
		// var ny = findy(s[s.length-1].x -dist).move(0,-20);
		s.push(endp);
		var p2 = s[s.length-1];
		// Arc segment method - convert the line that was just made into an arc
		// Find line perpendicular to previous line and crossing it in the middle
		var angle = Math.atan2((p2.x-p1.x),(p2.y-p1.y));
		var midp = p1.movedist(linelength(p1,p2)/2, angle);
		// drawcircle(ribg, midp, 3, HANDLESEGPOINTSTYLE);
		var midp2 = midp.movedist(1000,angle+Math.PI/2);
		// drawcircle(ribg, midp2, 3, HANDLESEGPOINTSTYLE);
		// intersect the ribjoint with line midp,midp2
		var inter=null;
		var k = 1;
		// drawline(ribg,[midp, midp2]);
		while (!inter && k<r[i].length){
			inter = intersectline(r[i][k-1],r[i][k], midp,midp2);
			k++;
		}
		// console.log(i,k,inter);
		
		var targetp;
		if (inter){
			targetp=inter.movedist(-distance,angle+Math.PI/2);
		} else {
			console.log("using midp as targetp", midp);
			targetp=midp;
		}
		// drawcircle(ribg, targetp, 3, HANDLESEGPOINTSTYLE);
		// console.log(p1,targetp,p2);
		s[s.length-1].arcthru(p1,targetp,p2, ribg);
		// return yi, index in Ypoints
		// console.log()
		// return 
	}
	function followrib_loop(endp, repeats){
		// TODO:
		var incr = linelength(endp, s[s.length-1]) / repeats;
		for (var i=0; i<repeats; i++){
			followrib(endp);
		}
	}
	function findy(fx){
		// Find point in s given x coordinate; Might this fail after some points have been appended to s?
		var i=0;
		while (s[i].x < fx && i < s.length){
			i++;
		}
		return s[i];
	}
	// Decide where underside supports are and how many there are
	// var formlength = r[0][r[0].length-1].x;
	var formlength = cps.neckblocky-RIBTHICKNESS;
	var lastsupport = formlength*0.7; // Support near butt end
	var supports = Math.floor(lastsupport / 110);
	// console.log("supports",supports);
	var supportdist = lastsupport/supports;
	var supportlist = []; // Stores support joint locations
	// var buttblock = [];
	// var neckblock = [];
	
	for (var i=0; i < supports+2; i++){ // Prepopulate supportlist
		supportlist.push({yi:0, posns:[], coords:[]});
	}
	var startl = [new Point(-1000,startheight),new Point(1000, startheight)];
	// for each rib, get rib joint support shape
	for (var i=0; i<r.length; i++){
		
		// Determine start point
		var startj=0;
		var comp = 0;
		if (i < r.length-1){ // Except soundboard edge, which is a full shape
			// x: how far along the body, y: height of body at point
			while (r[i][startj].y - (lute3d.inribpaths.compensations[i][startj] || 0) < startheight
			/* && r[i][startj].x < blockwidth*0.3 */){
				// console.log(i, startj, r[i][startj].y, lute3d.inribpaths.compensations[i][startj]);
				startj++
			}
		}
		var ribg = makegroup(formlayer, "ribsupportg-"+i)
		var s = [];
		var j=startj;
		// TODO: Intersect start points for precision at butt block
		// console.log(r[i][j-1].y, r[i][j].y);
		// if (startj>0){
			// var inter = intersectline(startl[0],startl[1],   
				// r[i][j-1].move(0,-lute3d.inribpaths.compensations[i][j-1]), 
				// r[i][j].move(0,-lute3d.inribpaths.compensations[i][j]));
			// if (inter) {s.push(inter); console.log(i, inter);}
		// }
		
		
		// Follow rib support path from buttblock to neckblock
		
		// console.log("j",j, r);
		// Store point for numbering the rib supports later
		var tp,b=0,barli=[];
		while ((r[i][j].x <= formlength ) 
				&& (j < r[i].length) 
				/* && r[i][j].x > 40 */){
			// s.push(r[i][j].move(p1.x*Math.cos(planedata[a].angle)));
			
			// Add rib support top side shape to s[], but limit start height of each rib support to 40mm, except last rib support = soundboard edge should have the complete shape
			if (!(r[i][j].y < 40 && i < r.length-1)) s.push(r[i][j]);
			
			if (r[i][j].yi == lute3d.widest_i) tp = r[i][j].y;
			j++;
			// If edge support and matches soundboard bar location, draw a line
			if (i==r.length-1 && r[i][j].x > barlist[b].pos){ 
				barli.push([r[i][j],r[i][j].move(0,-20)]);
				b++;
			}
		}
		// if the last one fell short, intersect vertical line with ribjoint segment
		// TODO:
		var necki = intersectline(	new Point(cps.neckblocky-RIBTHICKNESS,0),
									new Point(cps.neckblocky-RIBTHICKNESS,100000),
									r[i][j-1],r[i][j]);
		if (necki) s.push(necki);
		startheights.push(s[0]);
		// Figure out endheight: Should be below each necki
		var endp = s[s.length-1].move(0,-3);
		s.push(endp)
		endheights.push(endp);
		// Do neckblock area
		if (i == r.length-1) {
			s.push(endp.move(0, -endp.y));
			s.push(endp.move(-blockwidth, -endp.y));
		}
		s.push(endp.move(-blockwidth,0)); // left by blockwidth
		var comp = 0;
		var yi = findy(s[s.length-1].x).yi;
		var njp = makejoint();
		if (lute3d.inribpaths.compensations[i]){
			// console.log(i, lute3d.inribpaths.compensations[i][yi]);
			comp = lute3d.inribpaths.compensations[i][yi] || 0;
		} else {
			comp = 0;
		}
		supportlist[0].posns[i] = njp.y - comp;
		supportlist[0].coords[i] = njp;
		supportlist[0].yi = yi;
		// startheights.push(new Point(0,njp.y - comp ));
		
		// console.log(r);
		// Make underside with joints
		for (var sup=1; sup<=supports; sup++){
			var ny = findy(s[s.length-1].x -supportdist);
			
			followrib(ny.move(0,-20),20);
			var jp = makejoint();
			// Store joint points in arrays for making cross supports later
			// Compensate y coordinate for rib support tilt
			if (lute3d.inribpaths.compensations[i]){
				// console.log(i, lute3d.inribpaths.compensations[i][ny.yi]);
				comp = lute3d.inribpaths.compensations[i][ny.yi] || 0;
			} else {
				comp =0;
			}
			
			supportlist[sup].posns[i] = jp.y - comp;
			supportlist[sup].coords[i] = jp;
			supportlist[sup].yi = ny.yi;
		}

		
		// Startblock area
		// For the last rib support (soundboard edge) find the point below the previous startpoint for a nicely shaped startblock.
		if (i == r.length-1) {
			// var yi = findy(s[s.length-1].x).yi;
			// var points = lute3d.plane(yi, i-1);
			// var adj = (startheights[i-1].y+jointdepth)*Math.cos(lute3d.planedata[i-1].angle);
			// console.log(points);
			// startheights[i] = new Point(0, points.p1.x + adj);
			startheights[i] = startheights[i-1];
		}
		var eh = startheights[i].y;
		// var eh = startheights[i].y > 40 ? startheights[i].y : 40; // Limit butt block shape
		var e = new Point(blockwidth+plywood+3, eh);
		followrib(e,21); 
		s.push(e.move(-3,0));
		var yi = findy(s[s.length-1].x).yi;
		var jp = makejoint();
		if (lute3d.inribpaths.compensations[i]){
			// console.log(i, lute3d.inribpaths.compensations[i][ny.yi]);
			comp = lute3d.inribpaths.compensations[i][yi] || 0;
		} else {
			comp =0;
		}
		supportlist[supportlist.length-1].posns[i] = jp.y - comp;
		supportlist[supportlist.length-1].coords[i] = jp;
		supportlist[supportlist.length-1].yi = yi;
		// endheights.push(jp.y - comp);
		if (i == r.length-1) {
			s.push(new Point(blockwidth,0));
			s.push(new Point(0,0));
		}
		
	
		// Draw the rib support
		var ribsup = drawshape(ribg, s, "", "ribsupport-"+i,true);
		// Color the rib support for debugging
		if (i>0 && i < r.length-1) {
			var gre = Math.round(255-(i/r.length)*255).toString(16);
			var blu = Math.round((i/r.length)*255).toString(16);
			// console.log(gre, blu);
			ribsup.setAttribute("style",  "stroke:#00"+gre+blu+";stroke-width:0.4; fill:none;");
		}
		
		// if debug and last ribsupport, also draw on the frontview
		if (i==r.length-1){
			// var ns = [];
			// for (var j=0;j<s.length ;j++){
				// ns.push(s[j].addpoint(FRONTVIEWORIGIN));
			// }
			// var ribsup2 = drawshape(getelid("debuglayer"), s, REDSTYLE, "ribsupportdebug-"+i,true);
			// var tr = "translate("+FRONTVIEWORIGIN.x+" "+(FRONTVIEWORIGIN.y-RIBTHICKNESS)+") rotate (-90) ";
			// ribsup2.setAttribute("transform", tr);
		}
		tp = new Point(lute3d.inribpaths.Ypoints[lute3d.widest_i], tp-5);
		// console.log("textpos: ", lute3d.widest_i);
		var te="";
		if (i==0) te = " ("+_t("center")+")";
		if (i==r.length-1) te = " ("+_t("edge")+")";
		drawtext(ribg, tp, i+te);
		
		
		// Add soundboard bar positions to last rib support
		if(i==r.length-1){
			for (var b=0; b< barli.length-1; b++){
				drawline(ribg, barli[b]);
				if (barlist[b].type=="rosette") drawtext(ribg, barli[b][0].move(0,-8), "R");
			}
		}
		// Add joint numbering to every rib
		
		for (var a=0; a< supportlist.length; a++){
			drawtext(ribg, supportlist[a].coords[i].move(-4.5,9), a);
		}
		
		// var sca = " scale(1,-1)";
		var tra = " translate(10 "+ (10+i*90) +")";
		ribg.setAttribute("transform",tra);
		// console.log(ribsup);
		// Number rib supports
	}
	// Draw end and start cross supports
	// var startg = makegroup(formlayer, "butt-support");
	function jointhole(pos,angle,rev){
		// Make a joint shape at an angle
		var p2 = pos.movedist(plywood/2,angle-Math.PI/2);
		var p1 = p2.movedist(jointdepth,angle);
		var p3 = pos.movedist(plywood/2,angle+Math.PI/2);
		var p4 = p3.movedist(jointdepth,angle);
		if (!rev) return [p1,p2,p3,p4];
		return [p4,p3,p2,p1];
	}
	function support(yi,posns,iivari,follow, last){
		var lpoints = [];
		var rpoints = [];
		var posnsr = posns;
		var supg = makegroup(formlayer, "supportg-"+iivari);
		posnsr.reverse();
		var posns = posns;
		// console.log(posns);
		var midp,s;
		if (follow) s = Math.floor(posns.length/2); 
		// console.log("posns",posns);
		for (var i=0; i< posns.length-1; i++){
			// Calculate point on soundboard with lute3d.planedata[i] and startheights[i].x and lute3d.plane
			var points = lute3d.inribpaths.plane(lute3d.inribpaths.planedata,yi,i);
			// var points = lute3d.plane(yi,i);
			
			
			var angle = Math.abs(getangle(points.p1, points.p2) || 0.0);
			// console.log("angle",angle,"points",points.p1, points.p2);
			lpoints = lpoints.concat(jointhole(points.p1.scale(-1,1).movedist(posns[posns.length-1-i],-angle), -angle,true));
			rpoints = rpoints.concat(jointhole(points.p1.movedist(posns[posns.length-1-i],angle), angle));
			
			// Draw helper debuggery lines from soundboard to shell
			drawline(supg,[points.p1,points.p1.movedist(posns[posns.length-1-i],angle)],OCTSTYLE,"debglh-"+iivari+"-"+i);
			if (follow && i==s){ // Save point for drawing a nice underside later
				midp = points.p1.movedist(posns[posns.length-1-i]-24,angle);
			}
			// drawline(startg, [,]);
		}
		// Manually add soundboard edge joints
		if (last) {
			// buttblock
			// console.log("last");
			rpoints.push(new Point(rpoints[rpoints.length-1].x,plywood));
			lpoints.push(new Point(lpoints[lpoints.length-1].x,plywood));	
		} else {
			rpoints.push(new Point(posns[0]+jointdepth,plywood));
			lpoints.push(new Point(-posns[0]-jointdepth,plywood));
		}
		rpoints.push(new Point(posns[0],plywood));
		lpoints.push(new Point(-posns[0],plywood));
		rpoints.push(new Point(posns[0],0));
		lpoints.push(new Point(-posns[0],0));
		
		lpoints.reverse();
		rpoints = lpoints.concat(rpoints);
		// Do round underside
		if (follow) {
			// start and end point
			var p1 = new Point(posns[0]-24,0);
			var p5 = new Point(-posns[0]+24,0);
			// point in the middle
			var p3 = new Point(0, posns[posns.length-1]-24);
			// points at about 45deg
			
			var p2 = midp;
			var p4 = midp.scale(-1,1);
			p3.arcthru(p1,p2,p3);
			p5.arcthru(p3,p4,p5);
			rpoints.push(p1);
			rpoints.push(p3);
			rpoints.push(p5);
		}
		drawshape(supg, rpoints);
		drawtext(supg, new Point(-3,posns[posns.length-1]) ,iivari);
		return supg;
	}
	function block(posns,yi,nam){
		// end blocks of inch thick pine
		var lpoints = [];
		var rpoints = [];
		var riblines = [];
		var supg = makegroup(formlayer, "formblock-"+nam);
		var midp,s,p;
		
		for (var i=0; i< posns.length-1; i++){
			var points = lute3d.inribpaths.plane(lute3d.inribpaths.planedata,yi,i);
			// eangle, epoints: The very final rib points to hit
			var epoints = lute3d.inribpaths.plane(lute3d.inribpaths.planedata,0,i);
			var angle = Math.abs(getangle(points.p1, points.p2) || 0.0);
			var eangle = Math.abs(getangle(epoints.p1, epoints.p2) || 0.0);
			
			p = points.p1.scale(-1,1).movedist(posns[posns.length-1-i]-plywood ,-angle);
			

			if (nam=="butt") {riblines.push([epoints.p1.scale(-1,1),p]);}
			else {riblines.push([points.p1,p]);}
			// Riblines don't (and shouldn't) match debuglines drawn on last plywood cross support, since these ones go to the very end and the plywood is 24mm from the end.
			
			lpoints.push(p);
			// Flip for other side
			p = p.scale(-1,1);
			rpoints.push(p);
			
			if (nam=="butt") {riblines.push([epoints.p1,p]);}
			else {riblines.push([points.p1,p]);}

		}
		lpoints.push(new Point(-p.x, plywood)); // final points close to soundboard
		rpoints.push(new Point(p.x, plywood));
		lpoints.reverse();
		rpoints = lpoints.concat(rpoints);
		drawshape(supg, rpoints);
		// Draw rib lines
		if (nam=="butt"){
			for (var i=0; i< riblines.length; i++){
				drawline(supg,riblines[i]);
			}
		}
		
		return supg;
	}
	for (var i=0; i< supportlist.length; i++){
		// Draw cross supports to the right of the rib supports neatly spaced out
		// console.log("supportlist[i].yi", supportlist[i].yi);
		var follow = false, last = false;
		if (i != 0 && i != supportlist.length-1) follow = true;
		if (i == supportlist.length-1) last = true;
		var supg = support(supportlist[i].yi,supportlist[i].posns,i,follow,last);
		// var startsupport = drawshape(startg, ssshape);
		var sca = " scale(1,-1)";
		var tra = " translate("+(formlength+120)+" "+ (i*150) +")";
		supg.setAttribute("transform",tra);
	}
	
	i--;
	// console.log(startheights);
	var supg = block(supportlist[supportlist.length-1].posns,supportlist[supportlist.length-1].yi, "butt");
	var sca = " scale(1,-1)";
	var tra = " translate("+(formlength+120)+" "+ (i*150) +")";
	supg.setAttribute("transform",tra);
	i++;
	
	
	var supg = block(supportlist[0].posns,supportlist[0].yi, "neck");
	var sca = " scale(1,-1)";
	var tra = " translate("+(formlength+120)+" "+ (0*150) +")";
	supg.setAttribute("transform",tra);
	// console.log("supportlist",supportlist); 
	// supportlist: joint depth needs to be added to y values
	var layertr = " translate("+ DRAWINGWIDTH +")";
	formlayer.setAttribute("transform", layertr)
}

function draw_rib_templates (){
	// Flatten calculated ribs to templates
	// Add flipped copy of center rib as the first in r
	var center_left = [];
	for (var i=0; i<lute3d.ribpaths.threedee[0].length; i++){
		// center_left[i] = center_left[i].flipsign("x");
		center_left.push(new Point(-lute3d.ribpaths.threedee[0][i].x,
									lute3d.ribpaths.threedee[0][i].y,
									lute3d.ribpaths.threedee[0][i].z));
	}
	var r = [center_left].concat(lute3d.ribpaths.threedee);
	var necktan = Math.tan(cps.neckjoint_angle);
	var necky = cps.neckjoint_no_origin.y;
	// var offsets = lute3d.ribpaths.offsets;
	var flatribs = getelid("flatribs-layer");
	var widest_y = lute3d.ribpaths.Ypoints[lute3d.widest_i];
	// console.log("flattening ribs, r:", r);
	
	var debugthis=false;
	var i=0;
	var j = 0;
	function de(thing){ // debuggery function
		if (debugthis && j<10){ // || j > r.length-10
			console.log(thing);
		}
	}
	var traby = -cps.width*Math.PI*0.5-100 -5*r.length; // Y coordinate to draw rib at
	
	
	function flatpoint(p1,p2,p3,p4){
		// Distances between 3d points
		var Ll = linelength(p1, p2);
		var Rl = linelength(p3, p4);
		// Circles in 2d space
		var cL = new Circle(leftpoints[j-1], Ll);
		var cR = new Circle(rightpoints[j-1], Rl);
		
		// if (i==2) console.log("C",j, cL,cR);
		var nL = intersect_circle(cL,cR); // Next left point coordinates, choose higher
		// de(j+ " nL "+nL[0].x+" "+nL[0].y);
		if (nL === false) { // Circles don't intersect
			// console.log(j, leftpoints[j-1], rightpoints[j-1],leftpoints[j-1].avg(rightpoints[j-1]));
			return leftpoints[j-1].avg(rightpoints[j-1]); // return average - may cause distortion but keeps things rolling
			/* if (Math.sqrt((c1.x-c2.x)**2 + (c1.y-c2.y)**2) < Math.abs(c1.r - c2.r)) {
				// One circle inside the other
				
			} else {
				return undefined;
			} */
			
		} else if (nL[0].y > nL[1].y){
			var Lp = nL[0]; 
		} else {
			var Lp = nL[1]; 
		}
		return Lp;
	}
	
	if (editorstate.bodyshapefrom=="guitar"){
		var rnum = 2;
	} else {
		var rnum = r.length;
	}
	
	for (i=1; i<rnum; i++){
		var left = r[i-1];
		var right = r[i];
		// console.log("Flattening rib",i,"left",left[0]);
		var wl1, wl2; // Mark widest_i with a line on the flattened rib
		// var smallestx=10000; // For finding width of a flattened rib for neat display
		// var biggestx=0;
		
		// var ribg = makegroup(flatribs, "flatribg-"+i);
		
		// Draw first two points of each rib as seen from behind using x & z coordinates. This might introduce a tiny error, but could be countered by running the 3D calculation and adjusting the second point.
		// Find linelengths, angles, lp2, rp1,2 get calculated from lp1
		var ori = new Point(0,0);
		var l_j = 0;
		var r_j = 0;
		var skippy = 0;
		if (editorstate.bodyshapefrom=="guitar"){
			// Since guitar ribs have added points from side shape, ignore these on the previous rib by finding first shared Y coordinate.
			while (left[l_j].y < right[0].y){
				l_j++;
			}
			// console.log("lp1", l_j, left[l_j]);
			// console.log("rp1", right[0]);
			var lp1 = new Point(left[l_j].x, left[l_j].y);
			var rp1 = new Point(right[0].x, right[0].y);
		} else { // else lute
			// Skip first points if they are equal
			while (left[skippy].x == right[skippy].x 
				&& left[skippy].y == right[skippy].y 
				&& left[skippy].z == right[skippy].z){
				skippy++;
			}
			if (skippy>0) skippy--;
			l_j = skippy;
			r_j = skippy;
			var lp1 = new Point(left[l_j].x, left[l_j].z);
			var rp1 = new Point(right[r_j].x, right[r_j].z);
		}
		
		// console.log("lp1",i,lp1);
		// console.log("rp1",i,rp1);
		// Synchronize Y-coordinates on left and right; Skip some points probably
		
		if (left[1+l_j].y != right[1].y){
			// console.log("First points dont match, attempting to synchronize", i);
			if (left[1+l_j].y <= right[1].y){
				// console.log("dong");
				// find the first left point with the same y coordinate
				while (left[1+l_j].y < right[1].y && l_j < 20){
					
					l_j++;
				}
			} else {
				// find the first right point with the same y coordinate
				while (right[1+r_j].y < left[1].y && r_j < 20){
					r_j++;
				}
			}
		}
		
			
		
		// console.log("l_j:",l_j, "r_j:",r_j, left[1+l_j].y, right[1+r_j].y);
		if (editorstate.bodyshapefrom=="guitar"){
			var lp2 = new Point(left[1+l_j].x, left[1+l_j].y);
			var rp2 = new Point(right[1+r_j].x, right[1+r_j].y);
		} else {
			var lp2 = new Point(left[1+l_j].x, left[1+l_j].z);
			var rp2 = new Point(right[1+r_j].x, right[1+r_j].z);
		}

		// console.log("lp2",l_j, lp2);
		// console.log("rp2",r_j, rp2);
		
		var leftpoints = [lp1, lp2]; // Flattened points		
		var rightpoints = [rp1, rp2];
		
		var lefttip_j, righttip_j; 
		
		// console.log(i, lp1,lp2,rp1,rp2);
		var Lwidest, Rwidest, neckL, neckR;
		// Flatten ribs
		for (j=2; j+r_j<right.length && j+l_j<left.length; j++){ // Until either one runs out
			
			de("doing "+ordinal(j)+" while for rib "+i);
			// Find new left point
			// if (i==2)console.log("L",j,left[j-1+l_j], left[j+l_j], right[j-1+r_j], left[j+l_j]);
			// drawcircle(getelid("frontview"), FRONTVIEWORIGIN.move(left[j+l_j].x,-left[j+l_j].y),0.5,REDSTYLE);
			// drawcircle(getelid("frontview"), FRONTVIEWORIGIN.move(right[j+r_j].x,-right[j+r_j].y),0.5,GREENSTYLE);
			var Lp = flatpoint(left[j-1+l_j], left[j+l_j], right[j-1+r_j], left[j+l_j]);
			// console.log(Lp);
			// Find new right point
			// if (i==2)console.log("R",j,left[j-1+l_j], right[j+r_j], right[j-1+r_j], right[j+r_j]);
			var Rp = flatpoint(left[j-1+l_j], right[j+r_j], right[j-1+r_j], right[j+r_j]);
			// console.log(Rp);
			// After neck joint has been found, store points in tip instead
			leftpoints.push(Lp);
			rightpoints.push(Rp);
			
			
			
			// Find and draw neckjoint on rib templates
			// If higher than cps.neckblocky, check if rib intersects neckjoint plane
			// if (j+l_j < left.length){
			if (left[j+l_j].y >= necky){
				// console.log("greater than necky",i,j+l_j);
				// intersect with rib segment in y,z space
				var m1 = (left[j+l_j].z-left[j-1+l_j].z)/(left[j+l_j].y-left[j-1+l_j].y); 
				// This is the intersection for two lines, one with two known points (rib), the other with a known point on the y axis and an angle (neck joint):
				var y = (left[j-1+l_j].y*m1 - necktan*necky - left[j-1+l_j].z) / (m1-necktan);
				
				// if y between p1 & p2, find z and x 
				if (left[j-1+l_j].y < y && y < left[j+l_j].y){
					var z = (y - necky) * necktan;
					var m = (left[j+l_j].x-left[j-1+l_j].x)/(left[j+l_j].y-left[j-1+l_j].y); 
					var x = m * (y - left[j-1+l_j].y) + left[j-1+l_j].x;
					// Find distance from previous point. On the flat rib it will be the same distance from the previous flat point.
					var np = new Point(x,y,z);
					var d = linelength(left[j-1+l_j], np);
					// Move from previous flat point towards the one just created by d
					neckL = leftpoints[leftpoints.length-2].movedist(d, getangle(leftpoints[leftpoints.length-2],leftpoints[leftpoints.length-1]));
					// console.log("Left neckjoint on rib ",i, np, neckL);
					lefttip_j = leftpoints.length-1;
				}
				
			}
			// if (j+r_j < right.length){
			if (right[j+r_j].y >= necky){
				// intersect with rib segment in y,z space
				var m1 = (right[j+r_j].z-right[j-1+r_j].z)/(right[j+r_j].y-right[j-1+r_j].y); 
				// This is the intersection for two lines, one with two known points (rib), the other with a known point on the y axis and an angle (neck joint):
				var y = (right[j-1+r_j].y*m1 - necktan*necky - right[j-1+r_j].z) / (m1-necktan);
				
				// if y between p1 & p2, find z and x 
				if (right[j-1+r_j].y < y && y < right[j+r_j].y){
					var z = (y - necky) * necktan;
					var m = (right[j+r_j].x-right[j-1+r_j].x)/(right[j+r_j].y-right[j-1+r_j].y); 
					var x = m * (y - right[j-1+r_j].y) + right[j-1+r_j].x;
					// Find distance from previous point. On the flat rib it will be the same distance from the previous flat point.
					var np = new Point(x,y,z);
					var d = linelength(right[j-1+r_j], np);
					// Move from previous flat point towards the one just created by d
					neckR = rightpoints[rightpoints.length-2].movedist(d, getangle(rightpoints[rightpoints.length-2],rightpoints[rightpoints.length-1]));
					righttip_j = rightpoints.length-1;
					// console.log("Right neckjoint on rib ",i, np, neckR);
				}
				
			}
			  
			// Find widest_i location so it can be marked on the rib templates
			if (j+l_j < left.length){if (left[j+l_j].y <= widest_y) Lwidest = Lp};
			if (j+r_j < right.length){if (right[j+r_j].y <= widest_y) Rwidest = Rp};
			
			
		}
		// console.log("leftpoints",i,leftpoints);
		// console.log("rightpoints",i,rightpoints);
		
		// Rotate and translate each ribgroup for nice viewing
		var firstp = leftpoints[0];
		firstp = midpoint(firstp, rightpoints[0]);
		var lastp = getlast(leftpoints);
		
		// var angle = Math.abs(getangle(firstp,lastp)|| 0.0) ;
		var angle = Math.atan2((lastp.y-firstp.y), (lastp.x-firstp.x))
		var deg = angle / 0.01745329252; // rad to deg
		// var rot = " rotate("+deg+" "+(firstp.x) +" "+(firstp.y) +")";
		var rot = " rotate("+deg+" "+(firstp.x) +" "+(firstp.y) +")";
		var tra = " translate("+ (-firstp.x -firstp.y) +" "+ traby +")";
		// Use midpoint of first points later
		// console.log(linelength(Lwidest,Rwidest));
		traby += linelength(Lwidest,Rwidest)+5;
		// console.log("leftpoints",i,leftpoints);
		// return;
		// Draw rib, flip rightpoints around and separate tip to another path
		var righttip, lefttip;
		if (lefttip_j !== undefined && righttip_j !== undefined){
			righttip = [neckR].concat(rightpoints.splice(righttip_j));
			lefttip = [neckL].concat(leftpoints.splice(lefttip_j));
		}
		
		
		leftpoints.push(neckL);
		
		rightpoints.push(neckR);
		
		rightpoints.reverse();
		
		leftpoints=leftpoints.concat(rightpoints);
		
		
		
		// Color the rib support for debugging
		// var gre = Math.round(254-(i/r.length)*255).toString(16);
		// var blu = Math.round((i/r.length)*255).toString(16);
		// var styl ="stroke:#00"+gre+blu+";stroke-width:0.4; fill:none;";
		// var styl ="stroke:#000000;stroke-width:0.4; fill:none;";

		// Add rib number as text to group
		var ribulig = makegroup(flatribs, "flatribg-"+i);
		var textp = midpoint(Lwidest.scale(1,-1),Rwidest.scale(1,-1));
		
		
		var tlp = [];
		
		for (var p=0; p<leftpoints.length; p++){
			// console.log(p);
			// console.log(p, leftpoints[p],new Point(leftpoints[p].x, -leftpoints[p].y));
			if (leftpoints[p]) tlp.push(new Point(leftpoints[p].x, -leftpoints[p].y));
			
		}
		if (righttip && lefttip){
			righttip.reverse();
			lefttip = lefttip.concat(righttip);
			for (var p=0; p<lefttip.length; p++){
				lefttip[p] = new Point(lefttip[p].x, -lefttip[p].y);
			}
			var ribulitip = drawshape(ribulig, lefttip, RIBSTYLE,"flatrib-tip-"+i, true);
		}
		
		var ribulioo = drawshape(ribulig, tlp, RIBSTYLE,"flatrib-"+i, true);
		
		var ribulil = drawline(ribulig, [Lwidest.scale(1,-1),Rwidest.scale(1,-1)], NOFILLTHIN,"flatribw-"+i, true);
		// var ribulitipl = drawline(ribulig, [neckL.scale(1,-1),neckR.scale(1,-1)], REDSTYLE,"flatribnj-"+i, true);
		// var ribulih = drawline(ribulig, [firstp.scale(1,-1),lastp.scale(1,-1)], GUIDESTYLE,"flatribh-"+i, true);
		drawtext(ribulig, textp.move(0, 0), i==1?"C":i-1, "","flatribootext-"+i);
		// ribulig.setAttribute("transform",tra ); // Move group
		// ribulioo.setAttribute("transform",rot); // Rotate rib shape
		
		var displaystyle = "horizontal"; // fan or horizontal
		if (displaystyle == "horizontal"){
			// ribulig.setAttribute("transform",tra ); // Move group
			ribulig.setAttribute("transform",tra+rot); // Rotate rib shape
		}
		
		
	}
	// Move flat ribs North so it's not on top of the drawing
	var layertr = " translate(0 "+ 0 +")";
	flatribs.setAttribute("transform", layertr)
}

function slice_body (threedee) {
	// Arrange body data thusly:
	// [{y:yvalue, p:[every ribline or null as Point]}]
	var slices = [], yvals = [0];
	// Find all possible values of the Y coordinate
	// console.log("sample",threedee[2][10].y);
	for (var ri=0; ri < threedee.length; ri++){
		for (var yi=0; yi < threedee[ri].length; yi++){
			if (threedee[ri][yi]!==null && yvals.indexOf(threedee[ri][yi].y) == -1){
				yvals.push(threedee[ri][yi].y);
			}
		}
	}
	// console.log("yvals",yvals);
	// Arrange yvals in ascending numerical order
	yvals.sort(function(a, b){return a-b}); // Specifying compareFunction because otherwise the numbers would be sorted alphabetically
	
	
	// Initiate slices with all null values
	for (var yv=0; yv < yvals.length; yv++){
		
		var rs = []; 
		for (var i=0; i < threedee.length; i++){
			rs.push(null);
		}
		var slice = {y:yvals[yv], ribs:rs};
		slices.push(slice);
	}
	// console.log("slices", slices);
	// For each point in threedee, find where to put it in slices
	var widest_y, width = 0;
	for (var ri=0; ri < threedee.length; ri++){
		// on each ribline, the points are in Y order but may not contain all possible Y values
		for (var yi=0; yi < threedee[ri].length; yi++){
			// Find this yval in yvals. ribpath.threedee[ri][yi]
			
			
			if (threedee[ri][yi]!==null) {
				var yvali = yvals.indexOf(threedee[ri][yi].y);
				slices[yvali].ribs[ri] = threedee[ri][yi];
				// Find widest point (x)
				if (threedee[ri][yi].x > width){
					width = threedee[ri][yi].x;
					widest_y = yvali;
				}
			}
			
			
		}
		
	}
	
	
	return {slices:slices, yvals:yvals, widest_y:widest_y};	
}

function slice_body_new_idea (threedee) {
	// Arrange body data thusly:
	// [{y:yvalue, p:[every ribline or null as Point]}]
	var slices = [], yvals = [0];
	// Find all possible values of the Y coordinate
	// console.log("sample",threedee[2][10].y);
	// for (var ri=0; ri < threedee.length; ri++){
		// for (var yi=0; yi < threedee[ri].length; yi++){
			// if (yvals.indexOf(threedee[ri][yi].y) == -1){
				// yvals.push(threedee[ri][yi].y);
			// }
		// }
	// }
	for (var i=0; i < lute3d.Ypoints.length; i++){
		yvals.push(lute3d.Ypoints[i]);
	}
	console.log("yvals",yvals);
	// Arrange yvals in ascending numerical order
	// yvals.sort(function(a, b){return a-b}); // Specifying compareFunction because otherwise the numbers would be sorted alphabetically
	
	
	// Initiate slices with all null values
	for (var yv=0; yv < yvals.length; yv++){
		
		var rs = []; 
		for (var i=0; i < threedee.length; i++){
			rs.push(null);
		}
		var slice = {y:yvals[yv], ribs:rs};
		slices.push(slice);
	}
	// console.log("slices", slices);
	// For each point in threedee, find where to put it in slices
	var widest_y, width = 0;
	for (var ri=0; ri < threedee.length; ri++){
		// on each ribline, the points are in Y order but may not contain all possible Y values
		var yvali = 0;
		for (var yi=0; yi < threedee[ri].length; yi++){
			// Find this yval in yvals. ribpath.threedee[ri][yi]
			// Probably gotta calculate y value between points
			// Find first point that is larger than yval in y
			while (threedee[ri][yi].y <= yvals[yvali].y){ yvali++;}
			// var yvali = yvals.indexOf(threedee[ri][yi].y);
			console.log(ri,yi,yvali);
			
			slices[yvali].ribs[ri] = threedee[ri][yi];
			// Find widest point (x)
			if (threedee[ri][yi].x > width){
				width = threedee[ri][yi].x;
				widest_y = yvali;
			}
			
			
			
		}
		
	}
	console.log(slices);
	// TODO: Either do deepenbody differently or fix problems caused by it to point order here
	// Why not use Ypoints...
	
	return {slices:slices, yvals:yvals, widest_y:widest_y};	
}

function body_analysis(slices, neckblock){
	// Calculate volume, area, max rib length
	var edge = slices.edge;
	var slices = slices.slices;
	
	
	// Find first y with all non-null coordinates on every rib. (This assumes every point after is non-null, which is probably always true)
	var last_null = 0;
	for (var first_i=0; first_i < slices.length; first_i++){
		var this_ok = true;
		for (var r=1; r < slices[first_i].ribs.length; r++){
			var rib = slices[first_i].ribs[r];
			if (rib === null) {
				// this_ok = false; 
				last_null = first_i;
				break;
			}
			
		}
		// if (this_ok){
			// break;
		// }
		
	}
	// console.log("First full i: ",first_i, slices[first_i].ribs);
	// console.log("Last null i: ",last_null, slices[last_null].ribs);
	
	// Calculate butt area as pizza slices
	
	var volume = 0.0; // mm^3
	var area = 0.0; // mm^2
	var sb_area = 0.0; // mm^2
	var area2 = 0.0; // mm^2
	
	var p1,p2,p3,p4, slice_length, slice_volume;
	for (var i=last_null+2; i < slices.length; i++){
		var y = slices[i].y;
		var py = slices[i-1].y;
		// slices[i].ribs[i] may be null
		// var slice_length = slices[i].ribs[0].x || 0.0;
		var slice_length2 = slices[i].ribs[0].x || 0.0;
		
		p2 = slices[i-1].ribs[0];
		p1 = new Point(0, p2.y, p2.z)
		
		p4 = slices[i].ribs[0];
		p3 = new Point(0, p4.y, p4.z)
		
		
		slice_length = triangle_area_3d(p1,p2,p3) + triangle_area_3d(p2,p3,p4);
		if (y < neckblock) slice_volume = triangle_volume(p1,p2,p3) + triangle_volume(p2,p3,p4);
		
		for (var r=1; r < slices[i].ribs.length; r++){
			p1 = slices[i-1].ribs[r-1];
			p2 = slices[i-1].ribs[r];
				
			p3 = slices[i].ribs[r-1];
			p4 = slices[i].ribs[r];
			
			slice_length2 += Math.sqrt((p3.x-p4.x)**2 + (p3.z-p4.z)**2);
			// if (p4 === null){
				// console.log("null point", i, r,slices[i] );
			// }

			slice_length += triangle_area_3d(p1,p2,p3) + triangle_area_3d(p2,p3,p4);
			if (y < neckblock) slice_volume += triangle_volume(p1,p2,p3) + triangle_volume(p2,p3,p4);
		}
		// TODO: Perhaps the angle calculation is not very accurate without taking into account the angle towards the next slice's points
		area += slice_length;
		area2 += slice_length2 * (y-py) ;
		if (y < neckblock) volume += slice_volume;
	}
	// console.log("areas", area*2, 2*area2, Math.abs(area-area2));
	
	
	if (last_null !=0){
		var zerop = new Point(0,0,0);
		var p3 = slices[last_null+1].ribs[0];
		area += triangle_area_3d(zerop,new Point(0,p3.y,p3.z),p3); // half of mid rib
		// volume += triangle_volume(zerop,new Point(0,p3.y,p3.z),p3); // half of mid rib
		// For volume of the butt, triangle_volume() is oriented wrong
		for (var r=1; r < slices[last_null+1].ribs.length; r++){
			var p2 = slices[last_null+1].ribs[r-1];
			var p3 = slices[last_null+1].ribs[r];
			area += triangle_area_3d(zerop,p2,p3);
		}
	}
	// Soundboard area
	for (var i=1; i < edge.length && edge[i].y < neckblock; i++){
		sb_area += ((edge[i].x + edge[i-1].x)/2) * (edge[i].y - edge[i-1].y);
	}
	
	// TODO: Calculate butt area separately somehow, since there may be null values there
	return {volume:2*volume/(1000**2), area:2*area/(1000**2), sb_area:2*sb_area/(1000**2)};
}

function triangle_area_3d(p,q,r){
	// Rational trigonometry
	var A = (q.x-p.x)**2 + (q.y-p.y)**2 + (q.z-p.z)**2;
	var B = (r.x-q.x)**2 + (r.y-q.y)**2 + (r.z-q.z)**2;
	var C = (p.x-r.x)**2 + (p.y-r.y)**2 + (p.z-r.z)**2;
	return Math.sqrt((4*A*B - (C-A-B)**2)/16);
}

function triangle_volume(p,q,r){
	// Volume under triangle
	// return (z1+z2+z3)(x1*y2-x2*y1+x2*y3-x3*y2+x3*y1-x1*y3)/6;
	var avg_z = (p.z+q.z+r.z)/3;
	var A = (q.x-p.x)**2 + (q.y-p.y)**2;
	var B = (r.x-q.x)**2 + (r.y-q.y)**2;
	var C = (p.x-r.x)**2 + (p.y-r.y)**2;
	return avg_z * Math.sqrt((4*A*B - (C-A-B)**2)/16);
}

function analyse_lute (){
	// Body size analysis
		// V volume
		// V surface area
		// - P vs. P=2.0 ?
		// - Rib length (max)
		// V Soundboard area
		// - map of where normals of rib segments point to. as image embedded in svg
		// - map of reflections of z-axis rays towards body. How many times have the rays collided? Maybe it makes sense to create rays only around bridge?
	// Create global analysis array, which allows many lutes to be shown in table side by side.
	// analyses
	
	var anl = body_analysis(lute3d.slices, cps.neckblocky);
	var inanl = body_analysis(lute3d.inslices, cps.neckblocky-RIBTHICKNESS);
	
	var curname;
	if (editorstate.pagetitle != ""){
		curname = editorstate.pagetitle;
	} else if (editorstate.bodyshapefrom == "fromlist"){
		curname = editorstate.bodyshapefromlist;
	} else {
		curname = "constructed";
	}
	analysis =[curname, anl.area.toFixed(4), inanl.volume.toFixed(3), inanl.sb_area.toFixed(4)];
	
	draw_analysis_table();
}

function draw_analysis_table(){
	
	var ar = [["","Body Area m&sup2;", "B. Volume l", "SB Area m&sup2"]];
	// ar[0] contains table headers
	// ar[1] contains current instrument
	// Add analyses to ar. ar[2++] then contain saved instruments
	ar = ar.concat(analyses);
	// Save current to global analysis
	
	ar.push(analysis);
	// Create table of values

	var table = getelid("analysis_table");
	delchildren(table);
	var htr = creel("tr"); // title row
	var tbody = creel("tbody");
	addel(table,htr);
	addel(table,tbody);
	
	for (var i=0; i< ar.length; i++){
		if (i==0) { // table headers, first row
			for (var j=0; j< ar[i].length; j++){
				var th = creel("th");
				th.innerHTML = ar[i][j];
				addel(htr,th);
			}
		} else {
			var tr = creel("tr");
			addel(tbody,tr);
			for (var j=0; j< ar[i].length; j++){
				var td = creel("td");
				if (i==ar.length-1 && j==0){
					td.innerHTML = "&#x25B6;"+ar[i][j];
				} else {
					td.innerHTML = ar[i][j];
				}
				
				addel(tr,td);
			}
		}
	}
	// Make sure options areas are correctly sized if opened
	var els = document.getElementsByClassName("options_area");
	for (var i=0; i< els.length; i++){
		if (els[i].style.maxHeight) els[i].style.maxHeight = els[i].scrollHeight + "px";
	}
}

function save_analysis(){
	// Save analysis made on current lute body to analyses
	analyses.push(analysis);
	// TODO: Update table
	draw_analysis_table();
}

function export_analysis_csv(){
	// TODO: export csv and offer it for download
}

function body_normal_map(source, cull) {
	// Where do the perpendiculars, or normals, of each ribs segment point to on the soundboard
	var t0 = performance.now();
	var slices = lute3d.inslices.slices;
	var source = source || reflection_type || "normal";
	var cull = cull || false; // Don't show reflections outside of soundboard area
	var p1,p2,p3,p4;
	var nulls = 0;
	var dc = getelid("designer-canvas");
	delel(getelid("analysis-normals"));
	var db = makegroup(dc, "analysis-normals", "Analysis normals");
	var pos = FRONTVIEWORIGIN.move(0,-RIBTHICKNESS);
	var bridgepos= new Point(0,FRONTVIEWORIGIN.y-cps.bridgey,0);
	
	for (var i=1; i < slices.length; i+=1){
	
		for (var r=1; r <  slices[i].ribs.length ; r++){
			p1 = slices[i-1].ribs[r-1];
			p2 = slices[i-1].ribs[r];
				
			p3 = slices[i].ribs[r-1];
			p4 = slices[i].ribs[r];
			
			if (p2 !== null && p3 !== null){ // Checking for nulls
				if (p1 !== null){ // Can calculate first triangle
					var N1 = triangle_normal(p1,p2,p3);
					// Calculate where normal ray from p1 hits soundboard (xy-plane). Really should first find triangle center point.
					// console.log(p1);
					var fp = new Point(p1.x,-p1.y).addpoint(pos)
					// drawcircle(db, fp, 2, REDSTYLE);
					if (source == "straight"){ // find reflections against straight rays
						var h1 = find_reflection_hitpoint(p1, N1, new Point(p1.x,p1.y,0));
						var h2 = find_reflection_hitpoint(p2, N1, new Point(p2.x,p2.y,0));
						var h3 = find_reflection_hitpoint(p3, N1, new Point(p3.x,p3.y,0));
					} else if (source == "bridge"){
						var h1 = find_reflection_hitpoint(p1, N2, bridgepos);
						var h2 = find_reflection_hitpoint(p2, N2, bridgepos);
						var h3 = find_reflection_hitpoint(p3, N2, bridgepos);
					} else { // normals
						var h1 = find_normal_hitpoint(N1, p1);
						var h2 = find_normal_hitpoint(N1, p2);
						var h3 = find_normal_hitpoint(N1, p3);
					}
					
					// var ip = new Point(x,-y).addpoint(pos);
					// var ip2 = new Point(-x,-y).addpoint(pos);
					// drawcircle(db, h1, 0.2, REDSTYLE);
					// drawcircle(db, h2, 0.2, BLUESTYLE);
					// drawcircle(db, h3, 0.2, GREENSTYLE);
					drawshape(db, [h1.scale(1,-1).addpoint(pos),h2.scale(1,-1).addpoint(pos),h3.scale(1,-1).addpoint(pos)], NORMALSTYLE);
					drawshape(db, [h1.scale(-1,-1).addpoint(pos),h2.scale(-1,-1).addpoint(pos),h3.scale(-1,-1).addpoint(pos)], NORMALSTYLE);
					// drawline(db, [fp,ip],GREENSTYLE );
				} else {
					nulls ++;
				}
				if (p4 !== null){ // Can calculate second triangle
					var N2 = triangle_normal(p2,p3,p4);
					var fp = new Point(p4.x,-p4.y).addpoint(pos)
					// drawcircle(db, fp, 2, REDSTYLE);
					if (source == "straight"){ // find reflections against straight rays
						var h1 = find_reflection_hitpoint(p4, N2, new Point(p4.x,p4.y,0));
						var h2 = find_reflection_hitpoint(p2, N2, new Point(p2.x,p2.y,0));
						var h3 = find_reflection_hitpoint(p3, N2, new Point(p3.x,p3.y,0));
					} else if (source == "bridge"){
						var h1 = find_reflection_hitpoint(p4, N2, bridgepos);
						var h2 = find_reflection_hitpoint(p2, N2, bridgepos);
						var h3 = find_reflection_hitpoint(p3, N2, bridgepos);
					} else { // normals
						var h1 = find_normal_hitpoint(N2, p4);
						var h2 = find_normal_hitpoint(N2, p2);
						var h3 = find_normal_hitpoint(N2, p3);
					}
					
					// var ip = new Point(x,-y).addpoint(pos);
					// var ip2 = new Point(-x,-y).addpoint(pos);
					// drawcircle(db, h1, 0.2, REDSTYLE);
					// drawcircle(db, h2, 0.2, BLUESTYLE);
					// drawcircle(db, h3, 0.2, GREENSTYLE);
					// drawshape(db, [h1,h2,h3], NORMALSTYLE);
					if (!cull ) {
						// If one point is inside soundboard, allow draw
						
					}
					// RODO: color depending on wich rib
					drawshape(db, [h1.scale(1,-1).addpoint(pos),h2.scale(1,-1).addpoint(pos),h3.scale(1,-1).addpoint(pos)], NORMALSTYLE);
					drawshape(db, [h1.scale(-1,-1).addpoint(pos),h2.scale(-1,-1).addpoint(pos),h3.scale(-1,-1).addpoint(pos)], NORMALSTYLE);
				} else {
					nulls ++;
				}
			} else {
				if (p2 === null) nulls ++;
				if (p3 === null) nulls ++;
				
			}
		}
	}
	// console.log(slices);
	var totalp = slices.length*slices[5].ribs.length;
	console.log("Encountered",nulls,"/",totalp, "(=",(nulls/totalp*100).toFixed(1) ,"%) null points in body while calculating reflection map.");
	var t1 = performance.now();
	console.log("It took " + (t1 - t0).toFixed(1) + " milliseconds to calculate and draw reflections.");
}

function triangle_normal(p1,p2,p3){
	// Calculate triangle normal
	
	// https://stackoverflow.com/questions/19350792/calculate-normal-of-a-single-triangle-in-3d-space
	// A surface normal for a triangle can be calculated by taking the vector cross product of two edges of that triangle. The order of the vertices used in the calculation will affect the direction of the normal (in or out of the face w.r.t. winding).

	// So for a triangle p1, p2, p3, if the vector A = p2 - p1 and the vector B = p3 - p1 then the normal N = A x B and can be calculated by:
	var Ax = p2.x - p1.x;
	var Ay = p2.y - p1.y;
	var Az = p2.z - p1.z;
	
	var Bx = p3.x - p1.x;
	var By = p3.y - p1.y;
	var Bz = p3.z - p1.z;

	var Nx = Ay * Bz - Az * By;
	var Ny = Az * Bx - Ax * Bz;
	var Nz = Ax * By - Ay * Bx;
	// if (isNaN(Nz)) Nz = 0.0; // Sometimes this is NaN for some reason. Nx,Ny are then 0
	
	return new Point(Nx,Ny,Nz);
}

function find_normal_hitpoint(N1, p1){
	// Displacement in x
	var m1 = (N1.z) / (N1.x); // Normal vector
	// var m2 = 0; // xy-plane
	var x = p1.x - p1.z/m1; // and z=0 of course
	// Displacement in z
	var m1 = (N1.z) / (N1.y); // Normal vector
	// var m2 = 0; // xy-plane
	var y = p1.y - p1.z/m1; // and z=0 of course
	return new Point(x,y); // Point on soundboard
}

function find_reflection_hitpoint(P, N, R){
	// on z=0 plane. p1,2,3 are vertices of triangle, pr is source of ray hitting triangle
	// TODO: y direction should come from p3...? from midpoint between p1,p2 to p3?
	var N = new Point(P.x+N.x, P.y+N.y, P.z+N.z); // N is suplied relative to P, so absolutize it
	var aRx = Math.atan((P.z-R.z)/(P.x-R.x));
	var aRy = Math.atan((P.z-R.z)/(P.y-R.y));
	var anx = Math.atan((N.z-P.z)/(N.x-P.x));
	var any = Math.atan((N.z-P.z)/(N.y-P.y));
	var x = (-P.z)/Math.tan(2*anx - aRx) + P.x;
	var y = (-P.z)/Math.tan(2*any - aRy) + P.y;
	return new Point(x,y,0);
}

function find_reflection_hitpoint_(p1,p2,p3, pr) {
	// on z=0 plane. p1,2,3 are vertices of triangle, pr is source of ray hitting triangle
	// TODO: y direction should come from p3...? from midpoint between p1,p2 to p3?
	var aRx = Math.atan((p1.z-pr.z)/(p1.x-pr.x));
	var aRy = Math.atan((p1.z-pr.z)/(p1.y-pr.y));
	var anx = Math.atan((p2.z-p1.z)/(p2.x-p1.x)) +Math.PI/2;
	var any = Math.atan((p2.z-p1.z)/(p2.y-p1.y)) +Math.PI/2;
	var x = (-p1.z)/Math.tan(2*anx -aRx) + p1.x;
	var y = (-p1.z)/Math.tan(2*any -aRy) + p1.y;
	return new Point(x,y,0);
}

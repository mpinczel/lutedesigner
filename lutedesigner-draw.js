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
// High level drawing functions for lutes
// - Lute calculations
// - Functions for drawing the lute in SVG


///////////////////////////////////////////////////////////////////////////////
// Lute calculations
///////////////////////////////////////////////////////////////////////////////

function drawtest_circle(f){
	console.log("Begin drawtest");
	var r = 50;
	var d = 30;
	var p0 = new Point(0,0);
	var north = p0.move(0,-r);
	var south = p0.move(0,r);
	var east = p0.move(r);
	var west = p0.move(-r);
	
	var ne = p0.move(d,-d);
	var se = p0.move(d,d);
	var sw = p0.move(-d,d);
	var nw = p0.move(-d,-d);
	var ar = [north,ne,east,se,south,sw,west,nw];
	// drawshape(getelid("frontview"),[startp,cp1],GREENSTYLE);
	drawcircle(getelid("frontview"), p0, 2, BLUESTYLE);
	
	for (var i=0; i< ar.length; i++){
		drawcircle(getelid("frontview"), ar[i], 1, BLUESTYLE);
		var a = normangle(p0,ar[i])-Math.PI*8;
		var np = p0.moveangle(r*((i+1)/10), a);
		drawshape(getelid("frontview"),[p0,np],GREENSTYLE);
		console.log(i,a,np);
	}

}
function drawtest(){
	// Draw cross-section as a bezier curve
	// Finding body 3d shape based on this might be faster than using line segments?
	console.log("Begin drawtest");
	var p0 = CROSSVIEWORIGIN;
	var cr = getelid("crosslayer");
	var d3 = lute3d.ribpaths.threedee;
	var o = lute3d.ribpaths.offsets;
	var w = getlast(lute3d.ribs.endpoints).x;
	var h = cps.depth;
	// Perfect circle quadrant as a bezier command, radius 100:
	// m 0,0 c 0,-55.228474		44.77152,-100	100,-100
	var cpl = 0.55228474; // cplength*radius if 90deg circle segment
	var cpa = 0.3212368916123159; // percentage of angle
	var hc = editorstate.bulge-1.0; // A decent match except for absurd values of bulge, like > 2.6
	// should be affected by h? h/w?
	var wc = 1.0;
	var p1 = p0.move(-w);
	var cp1 = p1.move(0,-h*cpl*hc);
	var p2 = p0.move(0,-h);
	var cp2 = p1.move(w*(1-cpl*wc), -h);

	var d = [p1, p2.bezier(cp1,cp2)];
	drawshape(cr,d,GREENSTYLE,"cross-section-bezier",false);
	
	// Semicircle radius 50
	// m 0,0 c 0,-27.614237 22.385759,-50 50,-50 c 27.61423,3e-6 50,22.385763 50,50
	
	// Flattened to 40 on y axis
	// m 0,0 c 0,-22.09139 22.385759,-40 50,-40 c 27.61423,2e-6 50,17.90861 50,40
	
	
	
}



function calcfrets(mensur,temp, number_of_frets){
	//15
	var temp = 0; // Only equal in this version
	var temps = [];
	temps[0] = ["none",5612.5,10910,15910.5,20630,25084.5,29289.5,33258,37004,40539.5,43877,47027,50000];
	var number_of_frets = number_of_frets ? number_of_frets : 12;
	var fretlist = [];
	for (var i=0;i<=number_of_frets;i++){
		// console.log(i);
		// Write resulting fret positions
		if (i <= 12){
			v = Math.floor((mensur * temps[temp][i]) /1000)/100;
			if (isNaN(v)) {v = " ";}
			fretlist.push(v);
		} else {
			v = Math.floor((mensur * temps[temp][i-12]) /1000)/200+fretlist[12];
			if (isNaN(v)) {v = " ";}
			fretlist.push(v);
		}
	}
	return fretlist;
}

function calculatestrings(e){// Calculate string spacings at the nuts and bridge
	
	var e = e || editorstate;
	// return an array, [fingerboard, nut1, nut2, nut3] one for nut, one for bridge
	var bridge = [[]];
	var nuts = [[]];
	
	// Number of courses per each nut, are they single
	var s = [{courses:e.fingerboardcourses,
			  single:e.singlestrings}]; 
	var bnut = 1;
	// Find the bass string groups/nuts from editorstate
	while (e["courses_" + bnut] && bnut < e.numbernuts){
		var singles = e["singles_" + bnut] === true ? true: false;
		s.push({courses : e["courses_" + bnut],
				single: singles});
		bnut++;
	}
	// TODO: If distance between chanterelles is less than normal between courses, effect is reversed and the chant.dist. can't go below the normal distance.
	// console.log(s);
	// Do fingerboard courses first
	for (var i=0; i<parseInt(e.fingerboardcourses); i++){
		if (i>0){
			var prevb = getlast(bridge[0]);
			var prevn = getlast(nuts[0]);
			if (i <= e.chanterelles) {
				prevb += Math.abs(e.distchanterellesbridge-e.distcoursesbridge);
				prevn += Math.abs(e.distchanterellesnut-e.distcoursesnut);
			}
			if (i < e.chanterelles || e.singlestrings){
				// if single string
				bridge[0].push(prevb + e.distcoursesbridge);
				nuts[0].push(prevn + e.distcoursesnut);
				// console.log("chanterelle",i);
			} else {
				// Double strings
				bridge[0].push(prevb+e.distcoursesbridge);
				bridge[0].push(prevb+e.distcoursesbridge+e.diststringsbridge);
				if (i > 6){
					nuts[0].push(prevn+e.distbasscoursesshortnut);
					nuts[0].push(prevn+e.distbasscoursesshortnut+e.diststringsnut);
				} else {
					nuts[0].push(prevn+e.distcoursesnut);
					nuts[0].push(prevn+e.distcoursesnut+e.diststringsnut);
				}
				
			}
		} else { // First string i=0
			if (i < parseInt(e.chanterelles) || e.singlestrings){
				// if single string
				bridge[0].push(0);
				nuts[0].push(0);
				// console.log("chanterelle first",i);
			} else {
				bridge[0].push(0);
				bridge[0].push(e.diststringsbridge);
				nuts[0].push(0);
				nuts[0].push(e.diststringsnut);
				// console.log("double first",i);
			}
		}
	
	}
	var bridgelastfingerboardcourse = getlast(bridge[0]);
	// Do all bass nuts
	for (var b=1; b < s.length; b++){	
		// nut distances should not be relative to fingerboard courses, but the first bass course on each nut
		nuts.push([]);
		bridge.push([]);
		for (var i=0; i<s[b].courses; i++){
			
			
			if (i == 0){ // First of this set
				var prevb = getlast(bridge[b-1]); // Get previous string positions from previous set
				var prevn = 0; // nuts start from 0 since they are not right next to each other
				bridge[b].push(prevb + e.distbasscoursesbridge);
				nuts[b].push(prevn);
				if (!s[b].single){
					bridge[b].push(prevb + e.distbasscoursesbridge + e.diststringsbridge);
					nuts[b].push(prevn + e.diststringsnut);
				}
				
			} else { // other courses
				var prevb = getlast(bridge[b]);
				var prevn = getlast(nuts[b]);
				bridge[b].push(prevb + e.distbasscoursesbridge);
				nuts[b].push(prevn + e.distbasscoursesnut);
				if (!s[b].single){
					bridge[b].push(prevb + e.distbasscoursesbridge + e.diststringsbridge);
					nuts[b].push(prevn + e.distbasscoursesnut + e.diststringsnut);
				}
			}
			
			
		}
		
	}
	// console.log({"bridgewidth" : getlast(getlast(bridge)),
			// "nuts" : nuts, 
			// "bridge" : bridge});
	return {"bridgewidth" : getlast(getlast(bridge)),
			"nuts" : nuts, 
			"bridge" : bridge};
}

///////////////////////////////////////////////////////////////////////////////
// High level drawing functions
///////////////////////////////////////////////////////////////////////////////
function decidesize(drawing, frontview,sideview){
	// Gather information about the instrument to be drawn and set origins and drawing dimensions accordingly. Choose side and middle shapes.

	var zeropoint = new Point(0,0);
	// Get body element from the svg or create it, and redraw it

	var name = editorstate.bodyshapefromlist || "venere";
	
	if (editorstate.bodyshapefrom == "fromlist"){

		var edge = bodylist[name].side;
		var mid = bodylist[name].middle;
		
	} else if (editorstate.bodyshapefrom == "svgpath"){
		
		var edge = bodylist[name].side;
		var mid = bodylist[name].middle;
		// Apply midshape scaling and skewing
		// editorstate.constructiondepthratio
		// editorstate.constructionshapeshift
		
		// These were for direct svg path input into body shapes
		// if (editorstate.freemodeside) edge.setAttribute("d", editorstate.freemodeside);
		// if (editorstate.freemodemiddle) mid.setAttribute("d", editorstate.freemodemiddle);
	} else if (editorstate.bodyshapefrom == "guitar") { // Guitar mode
		var name = editorstate.guitarfromlist || "JeanVoboam1687";
		var edge = bodylist[name].guitar;
		// create mid. It is either a straight line or an arc
		// console.log(SIDEVIEWORIGIN.y);
		var bodylength = edge.getBBox().height;
		// TODO: Middle shape should be made of relative segments probably?
		var startp = new Point(-editorstate.guitardepth,0);
		
		var endp = new Point(-editorstate.guitardepth+bodylength*Math.tan(editorstate.guitarangle*radtodeg),-bodylength);
		console.log("guitar endp", endp, "from", -editorstate.guitardepth, bodylength,editorstate.guitarangle,radtodeg,-bodylength);
		var endpp = new Point(0,endp.y);
		
		if (editorstate.guitarroundl > 0) {
			// Round back
			var arcend = arclinedev(startp,endp, editorstate.guitarroundl,true, 10);
			// console.log(arcend);
			var shape = [new Point(0,0),startp].concat(arcend,[endpp]);
			// console.log("shape",shape);
			var mid = makerelative(drawshape(sideview,shape,THINSTYLE,editorstate.guitarfromlist+"-middle"));
		} else {
			// Straight, perhaps angled, back
			var mid = makerelative(drawshape(sideview,[new Point(0,0),startp, endp, endpp],THINSTYLE,editorstate.guitarfromlist+"-middle"));
		}
		
		delel(getelid(editorstate.guitarfromlist+"-middle"));
		cps.guitarbodyend = endpp;
		cps.guitarheel = endp;
		
	} else { // Classical construction
		var shapes = makeclassicalpreset();
		var edge = shapes.side;
		var mid = shapes.middle;
		
	}
	// console.log(mid);
	// apply body scaling
	// console.log(edge);
	var side = copyelement(frontview, edge, zeropoint,THINSTYLE); 
	scalepath(side, editorstate.bodyscale);
	var trebleside = mirrorpath(frontview,side); // Mirror path d coordinates, maintain first point, return new path
	// console.log("mid",mid);
	if (editorstate.bodyshapefrom!="guitar" && editorstate.usesideasmiddle){
		var middle = copyelement(sideview, edge, zeropoint,THINSTYLE); 
	} else {
		var middle = copyelement(sideview, mid, zeropoint,THINSTYLE); 
	}
	if (editorstate.bodyshapefrom=="guitar"){
		scalepath_xy(middle, 1, editorstate.bodyscale);
	} else {
		scalepath(middle, editorstate.bodyscale);
	}
	// console.log(middle);
	
	// console.log("middle",middle);
	currentbody = {"side":side,"trebleside":trebleside,"middle":middle};
	// Delete handles
	editable_paths = {};
	// var handles = getelid("handlelayer");
	// delchildren(handles);
	cps.height = side.getBBox().height;
	cps.width = side.getBBox().width;
	// console.log("side", side);

	// Mensur business
	var n = 1;
	while (editorstate["mensur_"+n] && n < parseInt(editorstate.numbernuts)){
		// Validate bass mensurs; Should exist and be longer than fingerboard strings
		console.log("Checking bass lengths");
		if (getmensur(n) < editorstate["mensur"]) {
			console.log("short basses detected");
			alter_editorstate ("mensur_"+n, editorstate["mensur"]*1.5, false);
			alter_editorstate ("nutunit_"+n, "mm", false);
		}
		n++;
	}
	DRAWINGHEIGHT = editorstate.mensur+160;
	if (editorstate.pegboxstyle=="mandolino" || editorstate.pegboxstyle=="curvy" ) {
		DRAWINGHEIGHT = editorstate.mensur+280;
	} else if (editorstate.bodyshapefrom=="guitar"){
		DRAWINGHEIGHT = editorstate.mensur+360;
	}
	var m=1;
	while (editorstate["mensur_"+m] && m < parseInt(editorstate.numbernuts)){
		DRAWINGHEIGHT = getmensur(m)+250;
		m++;
	}

	DRAWINGWIDTH = 100+cps.width*4
	FRONTVIEWORIGIN = new Point(80+cps.width,DRAWINGHEIGHT-20);
	SIDEVIEWORIGIN = FRONTVIEWORIGIN.move(cps.width*3+20);
	INFOBOXORIGIN = new Point(-cps.width, 20);
	// Test how good draw_fast_body actually is
	// var g = makegroup(sideview);
		// translate(g, SIDEVIEWORIGIN);
		// draw_fast_body (g, editorstate, mid, editorstate.numberofribs, false,true);
	// var g = makegroup(sideview);
		// translate(g, SIDEVIEWORIGIN);
		// draw_fast_body (g, editorstate, side, editorstate.numberofribs, false,true);
	if (parseInt(editorstate.numbernuts) > 1){
		// More space for weird pegboxes?
		// INFOBOXORIGIN = new Point(FRONTVIEWORIGIN.x+70,10);
		// CROSSVIEWORIGIN = new Point(FRONTVIEWORIGIN.x+cps.width+70,170+cps.width);
		CROSSVIEWORIGIN = new Point((FRONTVIEWORIGIN.x+SIDEVIEWORIGIN.x)/2,170+cps.width);
	} else {
		// CROSSVIEWORIGIN = new Point(FRONTVIEWORIGIN.x+cps.width+100,70+cps.width);
		CROSSVIEWORIGIN = new Point((FRONTVIEWORIGIN.x+SIDEVIEWORIGIN.x)/2,70+cps.width);
		// INFOBOXORIGIN = new Point(10,10);
	}
	DETACHEDORIGIN = new Point(70,150);
	NECKBLOCKORIGIN = CROSSVIEWORIGIN.move(0,60);
	FORMORIGIN = new Point(SIDEVIEWORIGIN.x+20, 10);
	
	// Put side and middle in their proper places
	// console.log("before movepath in decidesize",middle);
	// console.log("before movepath in decidesize",middle.pathSegList);
	movepath(middle,SIDEVIEWORIGIN);
	// console.log("after movepath in decidesize",middle);
	movepath(trebleside,FRONTVIEWORIGIN);
	movepath(side,FRONTVIEWORIGIN);
	// Move a copy of the side shape on top of the sideview for comparison
	if (editorstate.bodyshapefrom!="guitar"){
		var midcompare = copyelement(getelid("drawinglayer"), side, zeropoint,COMPARESTYLE); 
		movepath(midcompare,SIDEVIEWORIGIN);
	}
	
	// Move classical construction debug layer on top of frontview if it exists
	var debl = getelid("construction-debug");
	if (debl !== null){
		move(debl, FRONTVIEWORIGIN);
	}
	// Add existing lute frontview for comparison
	if (editorstate.presetoverlay){
		var comparison = bodylist[name].side;
		var sidecompar = copyelement(frontview, comparison, zeropoint,REDSTYLE); 
		movepath(sidecompar,FRONTVIEWORIGIN);
	}
	BOTTOMVIEWORIGIN = FRONTVIEWORIGIN.move(-cps.width*3+20);
	// Does this need to be enabled the first time the editor is run?:
	// drawing.setAttribute("viewBox","0 0 "+DRAWINGWIDTH+" "+DRAWINGHEIGHT);
	// For drawing coordinates next to mouse cursor
	pt = drawing.createSVGPoint();
	zpt = drawing.createSVGPoint();
	touchzpt = drawing.createSVGPoint();
	// TODO: Get uunits (mm) to px scale for drawing text in a legible size
	// svg element height vs DRAWINGHEIGHT
	drawing.onmousemove = mousecoords;
	drawing.onmousedown = mousecoords;
	drawing.onmouseup = mousecoords;
	// Touch equivlaents for mobile users
	drawing.ontouchstart = mousecoords;
	drawing.ontouchend = mousecoords;
	drawing.ontouchmove = mousecoords;
	// Adjust viewbox to current zoom level
	// console.log(zoom_data);
	if (!drawing.getAttribute("viewBox")) {
		drawing.setAttribute("viewBox","-10 -10 "+(DRAWINGWIDTH+10)+" "+(DRAWINGWIDTH+10));
	}
	
}

function makeclassicalpreset(){
	// Classical construction
	// Create editable paths made up of circle segments to be used as the body front view in the editor
	
	// TODO: Body size depends on string length, but should also be separable from it -> Option for how many frets on neck. editorstate.fretsonneck
	
	// TODO: Different presets Zwolle, Frei, Archlute...
	// HistoricalLuteConstruction007.png, 033
	
	// Zwolle: bridge at 1/6 of body length, rosette halfway between bridge and end of body, 
	// Mersenne: Divide body by 8. Neck length is 5/8 or from butt end to middle of rosette.
	
	
	// Note that calculations are made first with the centerline on the X axis of a regular Cartesian coordinate system where up is +y, right is +x, as opposed to svg coordinates. The bottom touches the origin.
	// console.log("Making a renaissance body");
	// integer ratios from the golden age of numerology
	var debugl = makegroup(getelid("frontview"), "construction-debug"); // This group will be moved to its correct position later
	var debugname ="cl-debug-";
	function debugcircle (p, name){
		// name is required
		if (p){
			drawcircle(debugl, new Point(-p.y, -p.x) /* FRONTVIEWORIGIN.move(-p.y, -p.x).move(27,-49) */, 2, REDSTYLE, name?debugname+name:"");
		}
	}
	function debugline(p1,p2, name){
		// name is required
		drawline (debugl,[new Point(-p1.y, -p1.x), new Point(-p2.y, -p2.x)], BLUESTYLE, name?debugname+name:"");
	}
	
	// Full length of instrument divided in 9, or string length divided in 8
	var mensur = parseFloat(editorstate.constructionmensur) || parseFloat(editorstate.mensur) || 600;
	var unit = mensur/8.0;
	var total_length = mensur + unit; // 9 units
	var eighth = unit*6.0; // 8th fret from p1
	var bottomr = unit*parseFloat(editorstate.constructionbottom) || 9.0*unit; // TODO: Make adjustable, 5--inf
	var sider = unit*parseFloat(editorstate.constructionside) || 6.0*unit; // TODO: make adjustable, 5--7
	var smallr = unit*parseFloat(editorstate.constructionsmall) || unit * 5/4.0; // TODO: make adjustable, 1--2
	var shoulderr = unit*parseFloat(editorstate.constructionshoulder) || 0.0; 
	var shoulderl = unit*parseFloat(editorstate.constructionshoulderlength) || 0.0; // actually reduction
	// var helperc = 5.0*unit; // circle centered on this division is used to find center of side circle
	var bodywidth = unit*parseFloat(editorstate.constructionwidth) || 4.0*unit;
	var bodylength = unit*parseFloat(editorstate.constructionlength) || 6.5*unit;
	var wedge = parseFloat(editorstate.constructionwedge) || 0.0; // wedge angle in degrees
	var doshoulder = false;
	if (shoulderr > 0.0 && shoulderl > 0.0){
		doshoulder = true;
	}
	
	// Circle centers:

	// Side long segment with radius sider: End at (0, 6.5), find center: Where circle with this point as center intersects y= width/2 - sider
	var y = bodywidth/2 - sider;
	var x = bodylength - Math.sqrt(sider**2-y**2);
	var widestp = new Point(x, bodywidth/2); // Not really
	var sidec = new Point(x, y); 
	
	var bottomc = new Point(bottomr, 0.0); // radius of bottom circle determines its center position
	// console.log("side circle center:", sidec);
	
	// Calculate center of small circle. Its center is where side and bottom arcs reduced by small arc radius intersect.
	var siderr = sider-smallr; // These are used to calculate center of small circle
	var bottomrr = bottomr-smallr;
	var sidecircles = new Circle(sidec, siderr); 
	var bottomcircles = new Circle(bottomc, bottomrr);
	var smallc = intersect_circle_above(sidecircles,bottomcircles);
	// console.log(bottomcircles,sidecircles);
	var smallcircle = new Circle(smallc, smallr);
	var sidecircle = new Circle(sidec, sider); 
	var bottomcircle = new Circle(bottomc, bottomr);	
	
	// TODO: Shoulder does not work properly with body lengths above 6+shoulder_reduction
	
	if (doshoulder) {
		// Find shoulder arc termination point and center, and redefine side arc endpoint
		var shoulderp = new Point(bodylength-shoulderl, 0); // Point I
		var sideshoulderr = sider - shoulderr;
		var sideshouldercircle = new Circle(sidec, sideshoulderr);
		var shouldercircle = new Circle(shoulderp, shoulderr);
		var shoulderc = intersect_circle(sideshouldercircle, shouldercircle);
		// circle intersection, but alter so that one circle is above the other
		// var d = Math.sqrt((sidec.x-shoulderp.x)**2 + (sidec.y-shoulderp.y)**2);
		// TODO: Choose higher shoulder intersection
		if (shoulderc[0].y > shoulderc[1].y){
			shoulderc = shoulderc[0];
		} else {
			shoulderc = shoulderc[1];
		}
		debugcircle(shoulderc, "shoulderc");
		debugcircle(shoulderp, "shoulderp");
		// console.log("shoulder circles:", sideshouldercircle, shouldercircle);
		// console.log("shoulder arc center:", shoulderc);
		// console.log("small", smallc);
		var shouldercircle = new Circle(shoulderc, shoulderr);
		// Intersection of side and shoulder circles
		// var shoulderstart = intersect_circle(sidecircle, shouldercircle);
		// line from sidec through shoulderc intersects side arc
		var m = (shoulderc.y-sidec.y) / (shouldercircle.x-sidec.x);
		var k = (-m*shoulderc.x + shoulderc.y - sidec.y);
		var a = m**2+1; // abc of quadratic formula
		var b = 2*k*m - 2*sidec.x;
		var c = k**2 - sider**2 + sidec.x**2;
		var x2 = (-b + Math.sqrt(b**2 - 4*a*c)) / (2*a);
		var y2 = m*x2 - m*shoulderc.x + shoulderc.y;
		var shoulderstart = new Point(x2,y2); // side arc ends here, shoulder starts
		
		// console.log("shoulder arc start:", shoulderstart);
		debugcircle(shoulderstart, "shoulderstart0");
	}
	
	
	
	
	// debugcircle(shoulderstart[1], "shoulderstart1");
	// Calculate intersection of bottom and small circle
	// TODO: It is possible that rounding errors will cause these circles to not actually touch by just a little bit, so maybe use lines instead?

	// bottom circle end point: Where line from bottomc through smallc intersects bottom circle. Create line function.
	var m = (smallc.y-bottomc.y) / (smallc.x-bottomc.x);
	var k = (-m*smallc.x + smallc.y - bottomc.y);
	var a = m**2+1; // abc of quadratic formula
	var b = 2*k*m - 2*bottomc.x;
	var c = k**2 - bottomr**2 + bottomc.x**2;
	var x2 = (-b - Math.sqrt(b**2 - 4*a*c)) / (2*a);
	var y2 = m*x2 - m*smallc.x + smallc.y;
	var ibs = new Point(x2,y2);
	// debugcircle(ibs2);
	// var ibs = intersect_circle_above(bottomcircle,smallcircle);
	// Get intersection of line from sidec thru  with side circle
	var m = (smallc.y-sidec.y) / (smallc.x-sidec.x);
	var k = (-m*smallc.x + smallc.y - sidec.y);
	var a = m**2+1; // abc of quadratic formula
	var b = 2*k*m - 2*sidec.x;
	var c = k**2 - sider**2 + sidec.x**2;
	var x3 = (-b - Math.sqrt(b**2 - 4*a*c)) / (2*a);
	var y3 = m*x3 - m*smallc.x + smallc.y;
	var iss = new Point(x3,y3);
	// var iss = intersect_circle_above(sidecircle,smallcircle);
	// debugcircle(ibs);
	
	// console.log("ibs", ibs);
	// console.log("iss2", iss2);
	// console.log("iss", iss);
	// Calculate where side circle intersects X axis; Should be around (6.5, 0) or just right of 8th fret. Use higher x coordinate from two possibilities
	var x4 = sidec.x + Math.sqrt(sider**2-(0-sidec.y)**2);
	var endp = new Point(x4, 0);
	
	
	// insert wedge between sides to get a wider body, rotate all numbers except first. Use bottomc point as rotation origin.
	/* for (var i=1; i< body.length; i++){
		// Calculate distance from bottomc to each point	
		var d = Math.sqrt((bottomc.x-body[i].x)**2+()**2);
		// Make array? Do after converting to svg coordinates?

	} */
	function rotp(center, point, deg){
		if (deg==0.0) return new Point(point.x, point.y);
		// Rotate a point around a center point by angle 
		// Calculate distance from center to point
		var d = Math.sqrt((center.x-point.x)**2 + (center.y-point.y)**2);
		// Find current angle to point
		var angle = Math.asin((point.y-center.y) / d);
		angle += deg*radtodeg; // 0.01745329252
		// Find new coordinates
		if (center.x > point.x){ // normal case with flat bottom
			var yd = center.y + d*Math.sin(angle);
			var xd = center.x - d*Math.cos(angle);
		} else {
			var yd = center.y + d*Math.sin(angle);
			var xd = center.x + d*Math.cos(angle);
		}
		
		return new Point(xd,yd);
		
	}
	// body2 is a non wedge rotated version of the body for debug purposes
	var p1 = new Point(0.0,0.0);//FRONTVIEWORIGIN; // bottom of body
	var body2 = [p1];
	var p2 = new Point(-ibs.y, -ibs.x); // where bottom meets small circle
	body2 = body2.concat(arctobezier(p1,p2,bottomr,true));
	var p3 = new Point(-iss.y, -iss.x); //where small circle meets side
	body2 = body2.concat(arctobezier(p2,p3,smallr,true));
	if (doshoulder){
		var p4 = new Point(-shoulderstart.y, -shoulderstart.x); // where side meets shoulder
		body2 = body2.concat(arctobezier(p3,p4,sider,true));
		var p5 = new Point(-shoulderp.y, -shoulderp.x); // where shoulder meets centerline; endpoint
		body2 = body2.concat(arctobezier(p4,p5,shoulderr,true));
	} else {
		var p4 = new Point(-endp.y, -endp.x); // where side meets centerline; endpoint
		body2 = body2.concat(arctobezier(p3,p4,sider,true));
	}
	drawcircle(getelid("frontview"), new Point(-bottomc.y, -bottomc.x), 2, REDSTYLE, "hello");
	
	// point to rotate around: bottomc. needs to be translated into svg coordinates too.
	// var rp = new Point(-bottomc.y, -bottomc.x);
	
	ibs = rotp(bottomc, ibs, wedge);
	iss = rotp(bottomc, iss, wedge);
	sidep = rotp(bottomc, sidec, wedge);
	smallc = rotp(bottomc, smallc, wedge);
	var wedgep = rotp(bottomc, new Point(0,0), wedge)
	// center point for bottom arc is bottomc
	if (doshoulder){
		shoulderstart = rotp(bottomc, shoulderstart, wedge);
		shoulderp = rotp(bottomc, shoulderp, wedge); // TODO : Disabled this because it was buggy for some reason when no wedge was set
	} else {
		// For bottom radiuses less than 6.5 units, a new end point must be calculated because it will go over the centerline otherwise and rotp() doesn't handle that case correctly
		var x4 = sidep.x + Math.sqrt(sider**2-(0-sidep.y)**2);
		endp = new Point(x4, 0);
	}
	
	// Create svg curves in svg coordinates
	var p1 = new Point(0.0,0.0);//FRONTVIEWORIGIN; // bottom of body
	var body = [p1];
	var p2 = new Point(-ibs.y, -ibs.x); // where bottom meets small circle
	body = body.concat(arctobezier(p1,p2,bottomr,true,true));
	var p3 = new Point(-iss.y, -iss.x); //where small circle meets side
	body = body.concat(arctobezier(p2,p3,smallr,true,true,2));
	if (doshoulder){
		var p4 = new Point(-shoulderstart.y, -shoulderstart.x); // where side meets shoulder
		body = body.concat(arctobezier(p3,p4,sider,true,true,3));
		var p5 = new Point(-shoulderp.y, -shoulderp.x); // where shoulder meets centerline; endpoint
		body = body.concat(arctobezier(p4,p5,shoulderr,true,true,2));
		debugline(sidep,shoulderstart, "sidectoshoulder");
		debugline(shoulderc,shoulderp, "shoulderline");
	} else {
		var p4 = new Point(-endp.y, -endp.x); // where side meets centerline; endpoint
		body = body.concat(arctobezier(p3,p4,sider,true,true,3));
		debugline(sidep,endp, "shoulderline");
	}
	
	// arctobezier = function (p1,p2,radius_or_center, clockwise, largearc)
	// how to draw arc when its end is not known yet
	
	// Do debug points and lines
	debugcircle(new Point(sidep.x, widestp.y), "widestp");
	debugcircle(wedgep, "wedgep");
	debugcircle(iss, "iss");
	debugcircle(ibs, "ibs");
	// debugcircle(bottomc, "bottomc");
	debugcircle(smallc, "smallcenter");
	debugcircle(sidep, "sidecenter");
	debugcircle(new Point(0,0), "zeropoint");
	
	debugline(bottomc,ibs, "bottomctoibs");
	debugline(bottomc,wedgep, "bottomctowedgep");
	debugline(sidep,iss, "sidectoside");
	
	
	
	// Create sideview too. 
	var bmid = [new Point(body[0].x, body[0].y)];
	// console.log("Body",body);
	// var Panchor = body[0];
	var Panchor = body[0].move(0,-bodylength/2);

	var Pgrab = body[0].move(-bodywidth,-bodylength);
	var Vskew = new Point(0, -bodylength*editorstate.constructionshapeshift);
	var skew = editorstate.constructionshapeshift || 0.0;
	var depthratio = editorstate.constructiondepthratio || 1;
	console.log("depth ratio", editorstate.constructiondepthratio , depthratio);
	for (var i=1; i<body.length; i++){
		var newel = body[i].scale(depthratio, 1);
		// editorstate.constructionshapeshift
		// skew ,parallellogram...
		// newel = newel.skew(Panchor,Pgrab,Vskew,2);
		console.log(body[i]); 
		console.log(newel.x);
		newel.x = newel.x - ((Panchor.x-newel.x)/bodywidth) * ((Panchor.y-newel.y)/bodylength) * skew*bodylength;
		newel.x1 = newel.x1 - ((Panchor.x-newel.x1)/bodywidth) * ((Panchor.y-newel.y1)/bodylength) * skew*bodylength;
		newel.x2 = newel.x2 - ((Panchor.x-newel.x2)/bodywidth) * ((Panchor.y-newel.y2)/bodylength) * skew*bodylength;
		console.log(newel.x);
		bmid.push(newel);
	}
	console.log(bmid);
	
	var el2 = drawshape(getelid("frontview"),body2,GREENSTYLE,"side2debg",false);
	var el3 = drawshape(getelid("frontview"),bmid,REDSTYLE,"bmiddebg",false);
	var el = drawshape(getelid("frontview"),body,THINSTYLE,"side",false);
	// debugpath(el); 
	console.log("classical construction shape",el3.getAttribute("d"));
	makerelative(el);
	makerelative(el3);
	// debugpath(el3); 
	
	// TODO: Create circle segments from two or more beziers depending on length
	// TODO: side circle seems to be altered slightly by shoulder, perhaps because shoulderstart is calculated a little bit outside of side arc
	// TODO: Editable register_editable()
	// TODO: Make circle segments editable
	// TODO: Allow a preset body shape to be under/overlaid on classical construction
	console.log("classical construction shape",el);
	return {side:el, middle:el3};
}
function drawfront(frontview,bars){
	var bx=FRONTVIEWORIGIN.x;
	var by=FRONTVIEWORIGIN.y;

	
	barlist=[]; // Reset this global variable between draws
	

	// Draw bars and neck
	if (editorstate.bodyshapefrom=="guitar"){
		// Sellas Guitar bridge at 0.174, rosette at 0.678
		// Voboam guitar bridge at 0.269, rosette at 0.684
		var L = cps.height;
		var div = cps.height/10;
		barlist[0] = {type:"bridge",pos:L/4};
		barlist[1] = {type:"normal",pos:L/4+div+editorstate.bridgeoffset,thickness:4.0,height:12};
		barlist[2] = {type:"normal",pos:2*L/3-50,thickness:5,height:19};
		barlist[3] = {type:"rosette",pos:2*L/3};
		barlist[4] = {type:"normal",pos:2*L/3+50,thickness:5,height:17};
		barlist[5] = {type:"normal",pos:2*L/3+50+div,thickness:4.0,height:12};
		// Draw string band and neck
		var neckjointy = drawneck(frontview);
		// Calculate neckblock lower edge at neckjointy-14
		cps.neckblocky = by-neckjointy-14;
		cps.rosettefromzero = 2*L/3;
	} else { // Lutes
		var div = cps.height/9;
		var sma = (div*2)/3;
		barlist[0] = {type:"bridge",pos:sma*2};
		barlist[1] = {type:"normal",pos:div*2,thickness:4.5,height:12};
		barlist[2] = {type:"normal",pos:div*3,thickness:4.5,height:12};
		barlist[3] = {type:"normal",pos:div*4,thickness:4.8,height:20};
		barlist[4] = {type:"rosette",pos:div*5,thickness:3.0,height:12};
		barlist[5] = {type:"normal",pos:div*6,thickness:4.5,height:17};
		
		// Draw string band and neck
		var neckjointy = drawneck(frontview);
		// Calculate neckblock lower edge at neckjointy-14
		cps.neckblocky = by-neckjointy-14;
		
		// The placement of the last few bars depend on neckjoint position in lutes
		var dist = Math.abs(cps.neckblocky-barlist[5].pos)/3;
		barlist[6] = {"type":"normal","pos":div*6+dist,thickness:4.0,height:14};
		barlist[7] = {"type":"normal","pos":div*6+dist*2,thickness:4.0,height:12};
		barlist[8] = {"type":"neckblock","pos":cps.neckblocky};
		barlist[9] = {"type":"bassbar","pos":sma};
		// Small rosette bars
		barlist[10] = {type:"rosette-small",pos:div*4.5,thickness:3.0,height:9};
		barlist[11] = {type:"rosette-small",pos:div*5.5,thickness:3.0,height:9};
	}
	
	drawbars(bars,cps.width+100);

	// Draw rosette circle
	var rosettebar = getelid("bar-rosette");
	var rosettew = rosettebar.getBBox().width; 
	var rosettey = rosettebar.getBBox().y;
	// If large body, draw triple rosette instead
	if (editorstate.bodyshapefrom == "guitar"){
		rosettew = editorstate.rosettescale*(rosettew/4.9)*0.01;
		var rosette = drawcircle(frontview, {x:bx, y:rosettey}, rosettew, THINSTYLE);
		rosette.id = "rosette-circle";
		addelafter(getelid("neck"), rosette);
		// Extra rosette circles to simulate guitar outer rosette
		drawcircle(frontview, {x:bx, y:rosettey}, rosettew*1.1, THINSTYLE);
		drawcircle(frontview, {x:bx, y:rosettey}, rosettew*1.13, THINSTYLE);
		drawcircle(frontview, {x:bx, y:rosettey}, rosettew*1.47, THINSTYLE);
		drawcircle(frontview, {x:bx, y:rosettey}, rosettew*1.5, THINSTYLE);
		rosettew = rosettew*2;
	} else if (editorstate.rosettelist == "triple" ){//rosettew > 300){
		
		var radius = editorstate.rosettescale*(rosettew / 9.0)*0.01;
		var rosetteg = makegroup(frontview, "rosettegroup");
		var rosette1 = drawcircle(rosetteg, {x:bx-radius, y:rosettey}, radius-2, THINSTYLE);
		var rosette2 = drawcircle(rosetteg, {x:bx+radius, y:rosettey}, radius-2, THINSTYLE);
		var rosette3 = drawcircle(rosetteg, {x:bx, y:rosettey-radius*1.5-2}, radius*0.8, THINSTYLE);
		rosettew = (editorstate.rosettescale*(rosettew / 9.0)*0.01)*4;
	} else {
		rosettew = editorstate.rosettescale*(rosettew/6.0)*0.01;
		var rosette = drawcircle(frontview, {x:bx, y:rosettey}, rosettew, THINSTYLE);
		rosette.id = "rosette-circle";
		addelafter(getelid("neck"), rosette);
		rosettew = rosettew*2;
		cps.rosettefromzero = div*5;
	}
	cps.rosettewidth = rosettew;
	cps.rosettepos = new Point(FRONTVIEWORIGIN.x,rosettey);
	
	// Draw body centerline
	if (editorstate.drawingpurpose && editorstate.drawingpurpose.startsWith("technical")){
		drawline(frontview, [{x:FRONTVIEWORIGIN.x, y:BORDERWIDTH},
							{x:FRONTVIEWORIGIN.x, y:DRAWINGHEIGHT}], 
							GUIDESTYLE,"centerline");
		
	}
	
	// if (editorstate.drawingpurpose && !editorstate.drawingpurpose.startsWith("technical")){
		// bars.style= "display:none";
		
	// }
	// register_editable(currentbody.middle,currentbody.side,currentbody.trebleside);
}
function drawside(sideview){
	// Draw lute side view
	var bx=SIDEVIEWORIGIN.x;
	var by=cps.bridgey;
	var neckthick = 28;
	var neckendthick = 21;
	if (editorstate.pegboxstyle=="mandolino") {neckthick = 20;neckendthick = 15;}
	
	// Draw soundboard side view with 3mm dip in the middle beginning at barlist[0]
	var seglist = interpretpath(extractpath(currentbody.middle.getAttribute("d")));
	var start = new Point(bx, seglist[0].y+1);
	var bridge = new Point(bx, FRONTVIEWORIGIN.y-barlist[0].pos);
	if (editorstate.bodyshapefrom=="guitar"){
		var rosette = new Point(bx-3, FRONTVIEWORIGIN.y-barlist[3].pos);
	} else {
		var rosette = new Point(bx-3, FRONTVIEWORIGIN.y-barlist[4].pos);
	}
	
	var end = new Point(bx, cps.neckjointy);
	var handlel = Math.abs(bridge.y-end.y)/6;
	
	// Define soundboard sideview path
	var sbpath = [
		start, 
		bridge,
		rosette.bezier(bridge.move(0,-handlel), rosette.move(0,handlel)),
		end.bezier(rosette.move(0,-handlel), end.move(0,handlel)),
		// Same backwards to create top side
		end.move(1.8),
		rosette.move(1.5).bezier(end.move(1.5,handlel), rosette.move(1.5,-handlel)),
		bridge.move(1.5).bezier(rosette.move(1.5,handlel), bridge.move(1.5,-handlel)),
		start.move(1.5)
		]
	var sbtop = drawshape(sideview, sbpath, "","soundboard-side", true);
	
	
	// Intersect middle with neck height
	var tneck = [{x:bx-neckthick, y:by-editorstate.mensur}, 
				 {x:bx-neckthick+0.00000001, y:by}];
	// console.log("drawside", tneck);
	var inter = pathline_intersect(currentbody.middle, tneck);
	// console.log("tneck",tneck,inter);
	if (inter && inter.y > cps.neckjointy) { // neck must be thinner
		drawline(sideview,[new Point(bx-1000, cps.neckjointy),new Point(bx+1000, cps.neckjointy)],REDSTYLE);
		var inter2 = pathline_intersect(currentbody.middle, [new Point(bx-1000, cps.neckjointy),new Point(bx+1000, cps.neckjointy)]);
		console.log("1");
		var neckmid = inter2;
	} else if (isNaN(inter.x) || isNaN(inter.y) || (inter && inter.y > cps.neckjointy)) { // No intersection, draw 90 joint
		var neckmid = new Point(bx-neckthick,cps.neckjointy);
	} else { //  Found intersection
		var neckmid = inter;
	}
	// console.log("neckmid",neckmid);
	cps.neckmid = neckmid; // Save neck intersection for later use
	// Draw bridge sideview
	var brp = new Point(bx+1.5, by);
	var bridge = drawshape(sideview, 
		   [brp,
			brp.move(8,0),
			brp.move(8,8),
			brp.move(1.5,16),
			brp.move(0,16)],
			null,"bridgeside", false);
	// Find height 3.5mm at neck joint
	var neckp = new Point(bx,cps.neckjointy); // neck joint / corner of neck touching soundboard
	// console.log("neckp",neckp);
	// Save for prosperity
	cps.neckjoint_angle = getangle(neckp,neckmid);
	cps.neckjoint_length = linelength(neckp,neckmid);
	cps.neckjoint_no_origin = neckp.minuspoint(SIDEVIEWORIGIN).scale(1,-1);
	cps.neckjoint_end_no_origin = neckmid.minuspoint(SIDEVIEWORIGIN).scale(1,-1);
	
	var stringstart = brp.move(5.5);
	var strmidp = neckp.move(1.7+3.5);
	var angletomidp = getangle(stringstart, strmidp);
	var stringend = stringstart.movedist(-editorstate.mensur, angletomidp);
	// Draw strings sideview
	// var stringend = new Point(bx+3.5, by-editorstate.mensur);
	var strings = drawline (sideview, [stringstart, stringend], NOFILLTHIN,"strings_side");
	// Draw fingerboard top surface
	var fbend = stringend.move(-0.9)
	drawline(sideview, [neckp.move(1.8), fbend],"", "fingerboard-side");
	
	// Draw neck side shape
	
	var neckep = fbend.move(-2, -4.5); // Neck end point that never gets drawn
	var neckangle = getangle(neckp, neckep);
	var nutstart = neckep.move(-1.5,-0.2);
	var nuttip = stringend.move(0.2);
	var nutcorner = fbend.move(-3.5);
	
	
	// Draw neck side
	if (editorstate.bodyshapefrom=="guitar"){
		var gbend = SIDEVIEWORIGIN.addpoint(cps.guitarbodyend.scale(1,editorstate.bodyscale));
		var heel = SIDEVIEWORIGIN.addpoint(cps.guitarheel.scale(1,editorstate.bodyscale));
		var neckside = drawshape(sideview, 
		   [gbend, // Neck joint soundboard
			heel, // Neck joint middle rib
			heel.move(0,-6),
			gbend.move(-22,-23),
			neckep.move(-18,-19), // a point hidden by the pegbox
			nutstart.move(0,0.2),
			nutcorner,
			nutcorner.move(2)], // neck end point
			COVERSTYLE,"neckside", true);
	} else {
		var neckside = drawshape(sideview, 
		   [neckp, // Neck joint soundboard
			neckmid, // Neck joint middle rib
			neckep.move(-neckendthick,0), // a point hidden by the pegbox
			nutstart.move(0,0.2),
			nutcorner,
			nutcorner.move(2)], // neck end point
			COVERSTYLE,"neckside", true);
	}
	
	
	// Draw nut side
	var nutpath = [
		nutstart,
		nuttip.bezier(nutstart.move(2), nuttip.move(0,-3)),
		nutcorner
	]
	var nut = drawshape(sideview, nutpath, COVERSTYLE, "nut-side", true);
	
	// TODO: Loop draw other nuts and strings
	
	
	
	// Add endclasp on top of body sideview
	if (editorstate.bodyshapefrom != "guitar"){
		var e = new Point(SIDEVIEWORIGIN.x, SIDEVIEWORIGIN.y);
		// Scale depending on end.y or side height
		var m = new Point(SIDEVIEWORIGIN.x-0.5, by-40);
		// Intersect middle with neck height
		var templ = [{x:e.x-45, y:0}, 
					 {x:e.x-45, y:DRAWINGHEIGHT}];
		// console.log("drawside templ ",templ);
		var ip = pathline_intersect(currentbody.middle, templ);
		// console.log("drawside templ ip",ip);
		// TODO: Find intersection with ~4th rib and match that point with end clasp point
		var cu = ip.move(5,-7)
		var endclasp = drawshape(sideview, 
			   [e.move(0,1),
				ip.move(0,1).bezier(e.move(-10,1), ip.move(10,2.5)),
				ip.move(0,-4),
				cu.bezier(ip.move(1,-4),cu.move(-1,3)),
				m.move(-27,30), //.relbezier(-6,40,-8,40), // TODO: move a bit so nice
				m.move(-13,10).relbezier(-7,27,8,25),	m],
				COVERSTYLE,"endclasp-side", true);
	}
	
	
}

function drawpegbox(frontview,sideview,detached){
	// Draw pegbox front and side depending on chosen style
	var side = new Point(SIDEVIEWORIGIN.x-5, cps.bridgey-editorstate.mensur-4.5);
	var front = new Point(FRONTVIEWORIGIN.x, cps.bridgey-editorstate.mensur-4.5);
	var dstyle = editorstate.numbernuts > 2 ? "doublehead": "theorbo";
	var style = editorstate.pegboxstyle || (editorstate.numbernuts==1?"renaissance":dstyle);
	console.log("style",style);
	

	var n = 1;
	while (editorstate["mensur_"+n] && n < parseInt(editorstate.numbernuts)){
		// Validate bass mensurs; Should exist and be longer than fingerboard strings
		// console.log("Checking bass lengths");
		// if (getmensur(n) < editorstate["mensur"]) {
			// console.log("short basses detected");
			// alter_editorstate ("mensur_"+n, editorstate["mensur"]*1.5, false);
			// alter_editorstate ("nutunit_"+n, "mm", true);
		// }
		
		// Draw bass string on sideview
		// TODO: Should maybe be done elsewhere
		var bx=SIDEVIEWORIGIN.x;
		var by=cps.bridgey;
		var bo = new Point(SIDEVIEWORIGIN.x+7, cps.bridgey);
		var stringend = new Point(bo.x, cps.bassnuts[n-1].y);
		var stringb = drawline (sideview,[bo,stringend], "","bass_strings_side_"+n);
		n++;
	}
	
	if (editorstate.singlestrings){
		var doubl = 1;
	} else {
		var doubl = 2;
	}
	var lower_hole_count = (editorstate.fingerboardcourses*doubl-editorstate.chanterelles);
	
	// console.log(style, style.startsWith("theorbo"));
	if (style == "renaissance" || style == "doublehead" || style == "chanterelle" || style.startsWith("bassrider")){
		// console.log(style);
		// Regular renaissance pegbox

		
		
		try {
			if (style == "doublehead"){
				var pangle_deg = editorstate.pegboxangle || 12;
				var width = linelength(cps.nuts[0].bass_upper, cps.nuts[0].treble_upper);
				var pegboxes = draw_renaissance_pegbox(lower_hole_count, pangle_deg, width,
								style == "chanterelle", "doublehead", editorstate.pegboxcurve !== 0 ? editorstate.pegboxcurve :0);
				var heads = draw_doublehead();
				translate(heads.side, SIDEVIEWORIGIN);
				translate(heads.front, FRONTVIEWORIGIN);
			} else {
				var pangle_deg = editorstate.pegboxangle || 8;
				var width = linelength(cps.ext1, cps.ext2);
				var pegboxes = draw_renaissance_pegbox(lower_hole_count, pangle_deg, width,
								style == "chanterelle",
								style == "bassrider" 
								|| style == "bassriderEdlinger", 
								editorstate.pegboxcurve ? editorstate.pegboxcurve :0);
			}
		
			translate(pegboxes.side, side.move(0,21));
			rotate(pegboxes.side, pangle_deg );
			
			translate(pegboxes.front, cps.ext1);
			rotate(pegboxes.front, -cps.neck.angle/radtodeg);
			
			translate(pegboxes.top, DETACHEDORIGIN);
			
			cps.pegbox = pegboxes.pegbox; // Save points for 3D parts
		} catch(e){
			console.log("Pegbox creation failed",e);
		}
	
	} else if (style.startsWith("theorbo") && editorstate.mensur_1){
		try {
			var pegboxes = draw_theorbo_ext();
		} catch (e) {
			console.log(e);
		}
		return;
	} else if (style == "mandolino") {
		insert_drawing("", "pegbox-mandolino-front", frontview, front);
		insert_drawing("", "pegbox-mandolino-side", sideview, side.move(2));
		cps.pegboxend = side.move(-60,-140);
		// TODO: Adjust pegbox length to fit requested number of strings
	} else if (style == "hoffmann1740") {
		insert_drawing("", "pegbox-hoffmann1740-front", frontview, cps.nutmid, -cps.neck.angle/radtodeg);
		insert_drawing("", "pegbox-hoffmann1740-side", sideview, side.move(2));
		cps.pegboxend = side.move(-60,-235);
		// TODO: Adjust pegbox length to fit requested number of strings
	} else if (style == "Rauche") {
		insert_drawing("", "pegbox-Rauche-front", frontview, cps.nutmid, -cps.neck.angle/radtodeg);
		insert_drawing("", "pegbox-Rauche-side", sideview, side.move(2));
		cps.pegboxend = side.move(-60,-235);
		// TODO: Adjust pegbox length to fit requested number of strings
	} else if (style == "jauck") {
		insert_drawing("", "pegbox-jauckmandora-front", frontview, cps.nutmid, -cps.neck.angle/radtodeg);
		insert_drawing("", "pegbox-jauckmandora-side", sideview, side.move(2));
		cps.pegboxend = side.move(-60,-235);
		// TODO: Adjust pegbox length to fit requested number of strings
	} else if (style == "colascione") {
		insert_drawing("", "pegbox-colascione-front", frontview, front);
		insert_drawing("", "pegbox-colascione-side", sideview, side.move(2));
		cps.pegboxend = side.move(-60,-140);
		// TODO: Adjust pegbox length to fit requested number of strings
	} else /* if (!style.startsWith("theorbo")) */{ // Guitars
		try {
		var fro = insert_drawing("", "pegbox-"+style+"-front", frontview, front);
		// console.log("fro", fro.firstElementChild);
		var ps = insert_drawing("", "pegbox-"+style+"-side", sideview, side.move(4));
		ps.firstElementChild.setAttribute("style",COVERSTYLE);
		cps.pegboxend = side.move(-60,-150);
		// if (fro.firstElementChild.getAttribute("d")){
			// cps.pegbox_shape = fro.firstElementChild.getAttribute("d");
		// }
		} catch(e) {
			console.log("failed to load pegbox asset: ",style);
			console.log("error: ",e);
		}
	}
	
	// If there are bassnuts, move cps.pegboxend.y to match longest
	/* try {
		var m=1;
		var longest =0;
		while (editorstate["mensur_"+m] && m < parseInt(editorstate.numbernuts)){
			var l = getmensur(m)-editorstate.mensur;
			if (l > longest) longest = l;
			m++;
		}
		cps.pegboxend = side.move(0,-longest);
	} catch(e) {
		console.log("There were no bass nuts. That's cool. Just letting you know.");
	} */
}
function drawbars(bars,w){
	// Draw soundboard bars based on barlist
	var edge = currentbody.side;
	
	var bardistances = [];
	var bl = [];
	for (var i=0; i<barlist.length; i++){ // 9th one is bass bar
		if (i !=9) {
			bardistances.push(-barlist[i].pos);
			bl.push(barlist[i]);
		}
	}
	
	// var t0 = performance.now();
	var intersections = getpoints(edge, bardistances,false).X;
	// var t1 = performance.now();
	// console.log("It took " + (t1 - t0).toFixed(0) + " ms to calculate bar intersections.")
	// console.log("bardistances",bardistances);
	// console.log("intersections",intersections);
	
	for (var i=1; i<intersections.length; i++){
		var leftx = FRONTVIEWORIGIN.x + intersections[i];
		var rightx = FRONTVIEWORIGIN.x - intersections[i];
		var line = drawline(bars, 
					[{x:leftx+1.6, y:FRONTVIEWORIGIN.y+bardistances[i]},
					 {x:rightx-1.6, y:FRONTVIEWORIGIN.y+bardistances[i]}]);
		if (barlist[i].type=="rosette"){
			line.id="bar-rosette";
		} else {
			line.id="bar-"+i;
		}
		var tadd="";
		if (bl[i].thickness !== undefined){
			var thickness=bl[i].thickness.toFixed(1);
			var height=bl[i].height.toFixed(0);
			tadd = " "+thickness+"x"+height
		}
		// if (editorstate.drawingpurpose == "technicalformplanmaker"){ 
			// Draw bar size information text
			var te = bl[i].pos.toFixed(0)+tadd;
			var t = drawtext(bars, 
						{x:rightx+5, y:FRONTVIEWORIGIN.y-bl[i].pos+2}, 
						te);
			t.id = "bar-pos-"+i; 
		// }
		if (i==8) line.id = "neckblock-lower"; // Last bar is actually neckblock lower/inside edge
	}
	
	// Draw J-bar
	if (barlist[9]){
		var p1 = FRONTVIEWORIGIN.move(10, -barlist[9].pos);
		var p2 = FRONTVIEWORIGIN.move(intersections[0]*0.5, -barlist[9].pos);
		var p3 = FRONTVIEWORIGIN.move(intersections[0]+1, -barlist[0].pos-5)
		var cp1 = FRONTVIEWORIGIN.move(intersections[0]*0.85, -barlist[9].pos);
		var cp2 = new Point(p3.x, p3.y);
		var p3 = p3.bezier(cp1,cp2);
		var jbar = [p1, p2, p3 ];
		drawshape(bars, jbar, "", "bassbar", false);
	}
	
	if(editorstate.bodyshapefrom!="guitar"){
		// Treble bar 1 goes to (bridgewidth+20)/2, 2 to bridgewidth/3
		var barstart = FRONTVIEWORIGIN.move(0, -(2*barlist[1].pos+barlist[2].pos)/3);
		
		
		var thru1 = FRONTVIEWORIGIN.move((cps.bridgewidth)/2+25, -barlist[0].pos);
		var bar1a = getangle(barstart,thru1);
		var bar1 = [barstart, barstart.movedist(1000, bar1a)];
		var bar1end = pathline_intersect(currentbody.trebleside, bar1);
		bar1end = bar1end.movedist(-2.5,bar1a);
		bar1 = [thru1, bar1end];
		drawline(bars, bar1,"","treble-bar-1");


		var thru2 = FRONTVIEWORIGIN.move((cps.bridgewidth)/3, -barlist[0].pos);
		var bar2a = getangle(barstart,thru2);
		var bar2 = [barstart, barstart.movedist(1000, bar2a)];
		var bar2end = pathline_intersect(currentbody.trebleside, bar2);
		bar2end = bar2end.movedist(-6.5,bar2a);
		bar2 = [thru2, bar2end];
		drawline(bars, bar2,"","treble-bar-2");
	}
	

	
	// Position bars on top of body shape
	addel(getelid("frontview"),bars);
}
	
function drawneck(frontview,edge,trebleside){// Draws neck, strings, bridge, nut
	
	// First attempt to make neck symmetrically, but if intersection point is wider than neck width limit, use advanced method with neck width limit
	// Return useful calculated points for further use in main draw function
	stringbandws = calculatestrings();
	// console.log(stringbandws);
	var bridgewidth = stringbandws.bridgewidth;
	cps.bridgewidth = bridgewidth;
	var nutwidth = getlast(stringbandws.nuts[0]) + 8;
	var neckwidth2 = nutwidth + (parseFloat(editorstate.neckadd) || 0);
	cps.nutwidth = neckwidth2;
	// cps.nutwidth = nutwidth;
	var bridgelastfingerboardcourse = getlast(stringbandws.bridge[0]);
	
	var mensur = editorstate.mensur || 600;
	var bx=FRONTVIEWORIGIN.x;
	var by=FRONTVIEWORIGIN.y;
	var edge = currentbody.side;
	var trebleside = currentbody.trebleside;
	// var bridgetreblex = bx+bridgewidth/2; // Add 4.5 for some calculations
	var bridgetreblex = bx+bridgewidth/2 /* - editorstate.bridgeoffsetx */; 
	// var bridgebassx = bx-bridgewidth/2;
	
	var bridgeoffsety = parseFloat(editorstate.bridgeoffset) || 0.0;
	var bridgey = by-barlist[0]["pos"]-bridgeoffsety;
	var neckjointy = 0; // This is returned
	var firststringbridge = new Point (bridgetreblex, bridgey);
	cps.bridgefirststring = firststringbridge;
	
	// Intersect first string+4.5mm with otherside to find neck width
	var tneck = [new Point(bx+nutwidth/2, bridgey-mensur), 
				 new Point(bridgetreblex+4.5, bridgey)];
	var inter = pathline_intersect(currentbody.trebleside, tneck);
	// drawcircle(frontview, tneck[0],2, REDSTYLE);
	// drawcircle(frontview, tneck[1],2, REDSTYLE);
	// drawcircle(frontview, inter,2, PURPLESTYLE);
	// drawline(frontview, tneck, GREENSTYLE);
	// TODO: having no intersection points causes error, handle each case separately or return default value?
	if (!inter) {console.log("No intersection for string band");return;}
	// console.log("tneck inter",inter);
	var neckwidth = (inter.x-bx)*2 /* +5 */ ; // TODO: Why +5?
	// Is neck width wider than neck width limit?

	// console.log("Neck would be quite wide, limiting width, drawing asymmetric neck");
	// If it is, intersect vertical line at bx + editorstate.neckwidthlimit/2
	// this neckwidth refers to the width at the body joint, not at the nut
	var neckwidthlimit = editorstate.neckwidthlimit || 100
	if (neckwidth > neckwidthlimit){
		neckwidth = neckwidthlimit;
	}
	if (editorstate.limitorset == "set"){
		neckwidth = neckwidthlimit;
	}
	cps.neckwidth = neckwidth;
	var vertline = [new Point(bx+neckwidth/2/* +editorstate.bridgeoffsetx */, bridgey-mensur), 
					new Point(bx+neckwidth/2/* +editorstate.bridgeoffsetx */, bridgey)];
	// var inter = intersectpaths(vertline,trebleside,10,null,null,true)[0].intersectpoint;
	var inter = pathline_intersect(currentbody.trebleside, vertline);
	// drawcircle(frontview, vertline[0],2, REDSTYLE);
	// drawcircle(frontview, vertline[1],2, REDSTYLE);
	// drawcircle(frontview, inter,2, REDSTYLE);
	// drawline(frontview, vertline, BLUESTYLE);
	// delel(vertline);
	// console.log("vertline inter",inter);
	var bridgeoffsetx = parseFloat(editorstate.bridgeoffsetx) || 0;
	bridgetreblex -= bridgeoffsetx; 
	// Find angle of line from bridge treble end+4.5 to intersection (neck joint)
	// var angle = Math.atan((bridgetreblex+4.5-inter.x) / (bridgey-inter.y));
	// console.log((bx+bridgewidth/2+4.5-inter.x),(by-barlist[0]["pos"]-inter.y));
	var bridger = new Point(bridgetreblex+4.5, bridgey)
	var angle = trueangle(bridger, inter);
	var nutr = bridger.movedist(-(mensur+4.5), angle);
	// drawcircle(frontview, bridger,2, BLUESTYLE);
	// drawcircle(frontview, nutr,2, BLUESTYLE);
	
	//////////////////////////////////////////////////////////////////
	// console.log(neckwidth2, nutwidth, editorstate.neckadd);
	// Find line starting at neckC(center of neck at body joint) which is tangential to circle at point O (nutr.x,nutr.y) with radius r=nutwidth/2, at point P1, (center of neck at nut).
	var neckC = new Point(bx, inter.y); // centerline of instrument, y coordinate at neck joint
	var d = linelength(nutr, neckC);
	var r1 = (neckwidth2)/2;
	var AP = Math.sqrt((d)**2-r1**2);
	var bob=(AP**2-r1**2+d**2)/(2*d);
	var h=Math.sqrt(AP**2-bob**2);
	var x2=neckC.x+bob*(nutr.x-neckC.x)/d;   
	var y2=neckC.y+bob*(nutr.y-neckC.y)/d;   
	var nutC = new Point(x2+h*(nutr.y-neckC.y)/d,       // also nutC.x=x2-h*(y1-y0)/d
						 y2-h*(nutr.x-neckC.x)/d);      // also nutC.y=y2+h*(x1-x0)/d
	// console.log(neckC.x,neckC.y,nutC.x,nutC.y);
	cps.nutfrombody = nutC.minuspoint(FRONTVIEWORIGIN); // Middle of nut
	// console.log("nutC",cps.nutfrombody);
	
	
	// Find coordinates for bass end of nut
	var nutangle = Math.atan((nutr.x-nutC.x)/(nutr.y-nutC.y));
	nutangle = -Math.abs(nutangle);
	// console.log(nutangle);
	var nutbass = new Point(nutr.x - Math.abs((nutwidth) * Math.sin(nutangle)),
				   nutr.y + Math.abs((nutwidth) * Math.cos(nutangle)));
	// Bass top corner of neck
	var neckbass = new Point(nutr.x - Math.abs((neckwidth2) * Math.sin(nutangle)),
				   nutr.y + Math.abs((neckwidth2) * Math.cos(nutangle)));
	// drawcircle(frontview, neckbass, 2,REDSTYLE);
	cps.neck = {};
	cps.neck.treble_end = nutr.minuspoint(FRONTVIEWORIGIN);
	cps.neck.bass_end = neckbass.minuspoint(FRONTVIEWORIGIN);
	
	// console.log("neckC,nutC",neckC,nutC);
	cps.neck.angle = trueangle(neckC,nutC);
	cps.neck.length = linelength(neckC,nutC);
	neckjointy = inter.y;
	// Draw neck; With fangs or not
	
	var bass_inter = new Point(bx-(inter.x-bx), inter.y);
	cps.neck.treble_joint = inter.minuspoint(FRONTVIEWORIGIN);
	cps.neck.bass_joint = bass_inter.minuspoint(FRONTVIEWORIGIN);
	
	if (editorstate.fingerboardstyle=="fangs" || editorstate.fingerboardstyle=="smallfangs" || editorstate.fingerboardstyle=="longsmallfangs"){
		// Neck frontview fangs
		
		var fangw = (20 +neckwidth/5.0)/2.0; // width of fang
		var fangd = 10; // How far fang pokes in to soundboard
		var sb_e = 20; // How far the soundboard extends in the middle
		if (editorstate.fingerboardstyle=="smallfangs"){
			fangw = 8;
			fangd = 6;
			sb_e = 10;
		} else if (editorstate.fingerboardstyle=="longsmallfangs"){
			fangw = 9;
			fangd = 14;
			sb_e = 18;
		}
		var bassfang = bass_inter.move(fangw, fangd);
		var bassp = bass_inter.move(fangw, -sb_e);
		var trebfang = inter.move(-fangw, fangd);
		var trebp = trebfang.movedist(fangd+sb_e, (angle/2-Math.PI));
		
		var neck = drawshape(frontview, 
				[nutr,neckbass,bass_inter,
				bassfang.relbezier(-fangw*0.6,-fangd,-fangw*0.3,-fangd),
				bassp,
				trebp,
				trebfang,
				inter.relbezier(-fangw*0.7,0,-fangw*0.4,0)], 
				THINSTYLE, "neck", true);
		
	} else {
		// Flat fingerboard joint
		var neck = drawshape(frontview, 
				[nutr,neckbass,bass_inter,inter], 
				COVERSTYLE, "neck", true);
	}
	
	if (editorstate.drawingpurpose && editorstate.drawingpurpose.startsWith("technical")){
		// console.log(neckC,nutC);
		drawline(frontview,[neckC,nutC],GUIDESTYLE,"neckcenter");
		
	}
	cps.nutmid =  new Point(nutC.x,nutC.y);
	
	// Draw all strings here, if wanted, but do calculations for nut and bridge extremes above
	if (nutbass.y != nutr.y){
		// Limited neck width
		var nut =  new Point (nutr.x + Math.abs((4.5) * Math.cos(nutangle)),
					nutr.y + Math.abs((4.5) * Math.sin(nutangle)));
		var chan = new Point (nut.x - Math.abs((4.5) * Math.sin(nutangle)),
					nut.y + Math.abs((4.5) * Math.cos(nutangle)));
		var bass = new Point (nut.x - Math.abs((nutwidth-3.5)*Math.sin(nutangle)),
					nut.y + Math.abs((nutwidth-3.5)*Math.cos(nutangle)));
		var nut2 = new Point (nut.x - Math.abs((nutwidth) * Math.sin(nutangle)),
					nut.y + Math.abs((nutwidth) * Math.cos(nutangle)));
	} else {
		// Symmetrical neck
		var nut =  new Point (nutr.x, 		nutr.y+4.5);
		var chan = new Point (nutr.x-4.5, 	nutr.y+4.5);
		var bass = new Point (nutbass.x+2,	chan.y);
		var nut2 = new Point (nutbass.x, 	nut.y);
		
	}
	// Find pegbox or extension start points, for drawing later by drawpegbox()
	if (editorstate.pegboxstyle == "theorbo"){
		var dist = 5;
	} else {
		var dist = 3;
	}
	
	var ext1 = new Point(nutr.x-dist + Math.abs((dist) * Math.cos(nutangle)),
				 nutr.y-dist + Math.abs((dist) * Math.sin(nutangle)));
	var ext2 = new Point(nutr.x - Math.abs((neckwidth2-dist) * Math.sin(nutangle)),
				nutr.y + Math.abs((neckwidth2-dist) * Math.cos(nutangle)));
	cps.ext1 = ext1;
	cps.ext2 = ext2;
	// Make sure nutangle is negative (because some parts of the code have been written in such neckC way taht they expect neckC negative angle)
	cps.nutangle = -Math.abs(nutangle);
	// function makegroup(c, groupname, inkscapelayer)
	var stringgroup = makegroup(frontview,"stringgroup");
	// addel(frontview,stringgroup);
	// console.log(bridgetreblex, bridgewidth);
	var bridgebassx = bridgetreblex-bridgewidth;
	var fingerboardstringsbassx = bridgetreblex-bridgelastfingerboardcourse;
	var bassstring = new Point(fingerboardstringsbassx, bridgey);
	var chanstring = new Point(bridgetreblex, bridgey);
	drawline(stringgroup, [bass,bassstring], 
			STRINGSTYLE, "lowestfingerboardstring");
	drawline(stringgroup, [chan,chanstring], 
			STRINGSTYLE, "chanterelle");
	drawline(frontview, [nut,nut2], THINSTYLE, "nutline");
	cps.strings = []; // A very unorganized list of string start and end positions
	cps.strings.push([bassstring.minuspoint(FRONTVIEWORIGIN).scale(-1,-1),
					  bass.minuspoint(FRONTVIEWORIGIN).scale(-1,-1)]);
	cps.strings.push([chanstring.minuspoint(FRONTVIEWORIGIN).scale(-1,-1),
					  chan.minuspoint(FRONTVIEWORIGIN).scale(-1,-1)]);
	var nutgroup = makegroup(frontview, "nutgroup");
	drawshape(nutgroup, [nutr,nutbass,nut2,nut], THINSTYLE, "nut_outline");
	cps.nuts = [];
	cps.nuts.push({
		treble_lower: nut.minuspoint(FRONTVIEWORIGIN).scale(-1,-1),
		treble_upper: nutr.minuspoint(FRONTVIEWORIGIN).scale(-1,-1),
		bass_upper: nutbass.minuspoint(FRONTVIEWORIGIN).scale(-1,-1),
		bass_lower: nut2.minuspoint(FRONTVIEWORIGIN).scale(-1,-1)
	});
	cps.nuts[0].treble_lower.z = 0;
	cps.nuts[0].treble_upper.z = 0;
	cps.nuts[0].bass_upper.z = 0;
	cps.nuts[0].bass_lower.z = 0;
		
	// drawline(frontview, fingerboardstringsbassx,bridgey,bridgetreblex,bridgey, THINSTYLE, "bridgeline");
	if (editorstate.drawingpurpose && editorstate.drawingpurpose.startsWith("technical")){
		// var nutC.x = nutC.x | bx; // Not reliable 
		// drawtext(c, coords, inner, style,id)
		var neckwidth = 2*(inter.x-bx);
		var neckheight = inter.y-nutr.y;
		// Make text boxes for neck width, bridge position
		drawtext(frontview,{x:bx-neckwidth/2-30, y:inter.y-neckheight/2}, 
				neckheight.toFixed(0));
		drawtext(frontview,{x:bx, y:inter.y+TEXTH}, 
				neckwidth.toFixed(0));
		drawtext(frontview,{x:bx, y:nut.y-8},
				neckwidth2.toFixed(1));
		drawtext(frontview,{x:bx+2, y:bridgey-3},
				bridgewidth.toFixed(1));
		drawtext(frontview,{x:bridgetreblex+4, y:bridgey-4},
				(barlist[0]["pos"]+bridgeoffsety).toFixed(0));
	}
	
	// Drawbridge (lol)
	cps.bridge = {}; // Store for 3d
	
	var bgroup = makegroup(frontview, "bridge-group");
	var bfrontg = makegroup(frontview, "bridge-front-group");
	bfrontg.style = "display:none;";
	// Get selected bridge style or if editorstate.bridgestyle is not available, use a default
	if (editorstate.bridgestyle){
		var bridgeend = bridgelist[editorstate.bridgestyle].cloneNode(true);
	} else { // default case for first time run
		var bridgeend = bridgelist["renaissance"].cloneNode(true);
	}
	
	bridgeend.setAttribute("transform",""); // Remove any transforms from group
	var bassend = bridgeend.cloneNode(true);
	bassend.id = bridgeend.id+"-bass";
	addel(bgroup, bridgeend);
	move(bridgeend, {x:bridgetreblex+0.5, y:bridgey});
	// Other end of bridge
	addel(bgroup, bassend);
	move(bassend, new Point(bridgebassx-bassend.getBBox().width-7.5, bridgey));
	mirror(bassend,"h");
	// console.log("bridgepos", bridgebassx,bassend.getBBox(), bridgey);
	// Scale bridge ends
	if (editorstate.bodyshapefrom!="guitar"){
		bridgeend.setAttribute("transform",bridgeend.getAttribute("transform")+" scale(0.9375)"); 
		bassend.setAttribute("transform",bassend.getAttribute("transform")+" scale(1.0315)"); 
	}
	// Draw bridge horizontal lines
	var brtopba = new Point (bridgebassx-8, bridgey);
	var brtoptr = new Point (bridgetreblex+8, bridgey);
	
	var brmidba = new Point (bridgebassx-8, bridgey+8.3);
	var brmidtr = new Point (bridgetreblex+7.9, bridgey+7.5);
	
	var brbotba = new Point (bridgebassx-4.5, bridgey+16.5);
	var brbottr = new Point (bridgetreblex+4.5, bridgey+15);
	
	if (editorstate.bridgestyle=="monzino" || editorstate.bridgestyle=="vihuela"){ // smaller mandolino bridge
		var brbotba = new Point (bridgebassx-4.5, bridgey+13.1);
		var brbottr = new Point (bridgetreblex+4.5, bridgey+12);
	} else if (editorstate.bodyshapefrom=="guitar"){
		var brbotba = new Point (bridgebassx-4.5, bridgey+16);
		var brbottr = new Point (bridgetreblex+4.5, bridgey+16);
		var brmidba = new Point (bridgebassx-8, bridgey+8);
		var brmidtr = new Point (bridgetreblex+7.9, bridgey+8);
		
	} 
	
	drawline(bgroup, [brtopba,brtoptr], THINSTYLE, "bridgetop");
	drawline(bgroup, [brmidba,brmidtr], THINSTYLE, "bridgemiddle");
	drawline(bgroup, [brbotba,brbottr], THINSTYLE, "bridgebottom");
	
	cps.bridge.bottombass = brbotba.minuspoint(FRONTVIEWORIGIN);
	cps.bridge.bottomtreble = brbottr.minuspoint(FRONTVIEWORIGIN);
	cps.bridge.middlebass = brmidba.minuspoint(FRONTVIEWORIGIN);
	cps.bridge.middletreble = brmidtr.minuspoint(FRONTVIEWORIGIN);
	cps.bridge.topbass = brtopba.minuspoint(FRONTVIEWORIGIN);
	cps.bridge.toptreble = brtoptr.minuspoint(FRONTVIEWORIGIN);
	
	// Make hidden size legend for bridge
	var blegend = makegroup(bgroup, "bridge_size_legend");
	drawshape(blegend, [brbotba.move(-20), brbotba.move(-30), brbotba.move(-30,-16.5), brbotba.move(-20,-16.5) ], BEHINDSTYLE, "basslegend", false);
	drawtext(blegend, brbotba.move(-50, -5), "16.5" );
	
	drawshape(blegend, [brbottr.move(20), brbottr.move(30), brbottr.move(30,-15), brbottr.move(20,-15) ], BEHINDSTYLE, "treblelegend", false);
	drawtext(blegend, brbottr.move(30, -5), "15" );
	blegend.style = "display:none;";
	
	// Draw bridge from the front and hide it
	var bodyb = new Point(bridgebassx-8, 0);
	var bodytopb = bodyb.move(0,9);
	var bodytr = new Point(bridgetreblex+8, 0);
	var bodytoptr = bodytr.move(0,7);
	drawshape(bfrontg, [bodyb, bodytopb, bodytoptr, bodytr], THINSTYLE, "bridgebody", true);
	
	var inb = new Point(bridgebassx-4.5, 0);
	var intopb = inb.move(0.4,7.5);
	var intr = new Point(bridgetreblex+4.5, 0);
	var intoptr = intr.move(-0.4,5.5);
	drawshape(bfrontg, [inb, intopb, intoptr, intr], THINSTYLE, "bridgeinner", false);
	// Bridge ends from the front
	drawshape(bfrontg, [bodyb, bodyb.move(-23), bodyb.move(-23,3), bodytopb.bezier(bodyb.move(-15, 3), bodytopb.move(-5, -5))], THINSTYLE, "", false);
	drawshape(bfrontg, [bodytr, bodytr.move(23), bodytr.move(23,2.5), bodytoptr.bezier(bodytr.move(15, 2.5), bodytoptr.move(5, -5))], THINSTYLE, "", false);
	
	// Legend for front view of bridge
	drawshape(bfrontg, [bodyb.move(-15), bodyb.move(-25), bodyb.move(-25,9), bodyb.move(-15,9) ], BEHINDSTYLE, "", false);
	drawtext(bfrontg, bodyb.move(-32,7.5), "9" );
	
	drawshape(bfrontg, [bodytr.move(15), bodytr.move(25), bodytr.move(25,7), bodytr.move(15,7) ], BEHINDSTYLE, "", false);
	drawtext(bfrontg, bodytr.move(32,6.5), "7" );
	
	var holangle = getangle(intoptr, intopb);
	var fhole = new Point(bridgetreblex, 5);
	// Draw string positions on bridge: // TODO: Consider enabling this
	/* for (var i=0; i<stringbandws.bridge.length;i++) {
		for (var j=0; j<stringbandws.bridge[i].length;j++) {
			var strstart = {x:bridgetreblex-stringbandws.bridge[i][j], y:bridgey};
			var strend = {x:bridgetreblex-stringbandws.bridge[i][j], y:bridgey+3};
			drawline(bgroup, [strstart,strend], THINSTYLE, "bridgestring-"+i+"-"+j);
			// Draw holes in bridge front view
			var hole = fhole.movedist(stringbandws.bridge[i][j], holangle);
			drawcircle(bfrontg, hole, 0.7);
		}
	} */
	
	cps.bassnuts = []; // Stores first string on nut only
	
	// Draw string positions on the fingerboard nut, draw string bands, draw bass nuts
	for (var n=0; n<stringbandws.nuts.length; n++) {
		if (n > 0){
			// Find angle by drawing line through a point 5mm(?) from previous nut's lowest string, with length editorstate["mensur_"+i]
			// Less distance the fewer nuts there are
			// console.log(firststringbridge);
			var bridgefirst = firststringbridge.move(-stringbandws.bridge[n][0]-bridgeoffsetx);
			// console.log("bridgefirst",bridgefirst);
			var thru = s.movedist(9-stringbandws.nuts.length, nutangle);
			var bangle = getangle(bridgefirst, thru);
			// console.log(getmensur(n));
			// Difference of mensurs should affect spacing between nuts 
			var dif = Math.abs(getmensur(n) - getmensur(n-1)) / getmensur(0);
			// console.log("dif",n,getmensur(n), dif);
			var nutfirst = bridgefirst.movedist(-getmensur(n), bangle).move(-1-dif*5);
			// console.log(bridgefirst,nutfirst);
			drawline(stringgroup, [bridgefirst,nutfirst], STRINGSTYLE, "bassstring-"+n+"-first");
			cps.strings.push([bridgefirst.minuspoint(FRONTVIEWORIGIN).scale(-1,-1),
							  nutfirst.minuspoint(FRONTVIEWORIGIN).scale(-1,-1)]);
			// Last string on this nut
			var bridgelast = firststringbridge.move(-getlast(stringbandws.bridge[n])-bridgeoffsetx);
			var nutlast = nutfirst.movedist(getlast(stringbandws.nuts[n]), nutangle);
			drawline(stringgroup, [bridgelast,nutlast], STRINGSTYLE, "bassstring-"+n+"-last");
			cps.strings.push([bridgelast.minuspoint(FRONTVIEWORIGIN).scale(-1,-1),
							  nutlast.minuspoint(FRONTVIEWORIGIN).scale(-1,-1)]);
			
			// Draw the nut itself
			
			var tr1 = nutfirst.movedist(-2,nutangle);
			var tr2 = tr1.movedist(4.5, nutangle-Math.PI/2);
			var b1 = nutlast.movedist(2,nutangle);
			var b2 = b1.movedist(4.5,nutangle-Math.PI/2);
			
			if (editorstate.pegboxstyle != "theorbo" || n != stringbandws.nuts.length-1){
				drawshape(frontview, [tr1,tr2,b2,b1], THINSTYLE, "nut_outline_"+n);
			}
			cps.nuts.push({
				treble_lower: tr1.minuspoint(FRONTVIEWORIGIN).scale(-1,-1).setz(0),
				treble_upper: tr2.minuspoint(FRONTVIEWORIGIN).scale(-1,-1).setz(0),
				bass_upper: b2.minuspoint(FRONTVIEWORIGIN).scale(-1,-1).setz(0),
				bass_lower: b1.minuspoint(FRONTVIEWORIGIN).scale(-1,-1).setz(0)
			});
			
			// Draw text showing this nut's mensur in mm
			drawtext(nutgroup, nutfirst.move(15), _t("Nut "+n+": "+getmensur(n).toFixed(0)));
			
			// Store for posterity
			cps.bassnuts.push(nutfirst);
			
		} else {
			var nutfirst = chan;
			drawtext(nutgroup, nutfirst.move(15), _t("Nut: "+getmensur(n).toFixed(0)));
		}
		// Draw intervening strings on all nuts if chosen
		
		for (var i=1; i < stringbandws.nuts[n].length-1; i++){
			var br = firststringbridge.move(-stringbandws.bridge[n][i]-bridgeoffsetx);
			var nu = nutfirst.movedist(stringbandws.nuts[n][i], nutangle);
			// Store for later
			cps.strings.push([br.minuspoint(FRONTVIEWORIGIN).scale(-1,-1),
							  nu.minuspoint(FRONTVIEWORIGIN).scale(-1,-1)]);
			if (editorstate.drawallstrings !== false){
				drawline(stringgroup, [br,nu], STRINGSTYLE, "bassstring-"+n+"-"+i);
			}
		}		
		
		for (var i=0; i<stringbandws.nuts[n].length; i++) {
			// Draw string grooves on nut
			// console.log("nutbass.y != nutr.y");
			var s = nutfirst.movedist(stringbandws.nuts[n][i], nutangle);
			if (n>0 && editorstate.pegboxstyle == "theorbo"){
				var s2 = s.movedist(1.5, nutangle-Math.PI/2);
			} else {
				var s2 = s.movedist(4.5, nutangle-Math.PI/2);
			}
			if (n==0) {
				drawline(nutgroup, [s,s2], THINSTYLE, "nutstring-"+n+"-"+i);
				
			} else {
				drawline(frontview, [s,s2], THINSTYLE, "bridgestring-"+n+"-"+i);
			}
		}		
	}
	
	// ////////////////////////////////////////////////
	// Draw frets
	// TODO: Add fret limit?
	var treblefrets = calcfrets(mensur,0,12);
	var bassfrets = calcfrets(mensur*0.995,0,12); // Compensate for metal wounds
	// var trangle = angle;
	var trangle = Math.atan((bridgetreblex+4.5-inter.x) / (bridgey-inter.y));
	// var bangle = angle;
	// Bass angle should aim for bass edge for fingerboard, not last string
	var basside = new Point(neckbass.x, neckbass.y+4.5); // Not 100% correct, should move 4.5 along bass side of neck
	var fretlist = [];
	// var bangle = -Math.atan((nut2.x-(bx-(inter.x-bx))) / (nut2.y-inter.y));
	var bangle = -Math.atan((basside.x-(bx-(inter.x-bx))) / (basside.y-inter.y));
	// var bangle = Math.asin(((B-neckC)/2.0) / (bassfrets[12]*2.0));
	var frets = makegroup(frontview, "frets");
	for (var i=1; i <treblefrets.length; i++){
		// The actual coordinates of each fret end must be calculated
		// Bass end
		
		var Bx = bassfrets[i] * Math.sin(bangle);
		var By = bassfrets[i] * Math.cos(bangle);
		// 12th fret is under first two strings, 11th under three etc.
		// avg of bridge and nut distance
		// stringbandws
		
		// Treble end
		var Tx = treblefrets[i] * Math.sin(trangle);
		var Ty = treblefrets[i] * Math.cos(trangle);
		// if (nut.y+Ty < inter.y) {
		if (i==12){
			var st = THICKSTYLE;
		} else if (i==5 || i==7){
			var st = THICKSTYLE;
		} else {
			var st = THINSTYLE;
		}
		var sp = new Point(nut.x+Tx, nut.y+Ty);
		var ep = new Point(basside.x-Bx, basside.y+By);
		// fretlist.push([new Point(Tx,Ty), new Point(Bx,By)]);
		
		if (nut.y+Ty > inter.y && i>8 ){
			var indx = (14-i); // * 2 ;//- parseInt(editorstate.chanterelles);
			if (!editorstate.singlestrings) indx = indx*2;

			if (stringbandws.nuts[0][indx] === undefined) {
				indx = stringbandws.nuts[0].length-1;
			}
			// if on the soundboard, draw shorter
			var dir = getangle(ep,sp);
			var len = (stringbandws.nuts[0][indx]+stringbandws.bridge[0][indx])/2;
			// console.log(i, len,dir);
			if (dir < 0) dir += Math.PI; // Forces direction to be correct, otherwise sometimes drawn outside body
			ep = sp.movedist(-len,dir);
			
			drawline(frets,[sp,ep],THINSTYLE, "fret-"+i);
			
		} else {
			drawline(frets,[sp,ep],THINSTYLE, "fret-"+i);
		}
		// Store for 3D
		fretlist.push([sp.minuspoint(FRONTVIEWORIGIN), ep.minuspoint(FRONTVIEWORIGIN)]);
		
		if (editorstate.drawingpurpose && editorstate.drawingpurpose.startsWith("technical")){
			// Fret positions 
			var postext = parseFloat(Math.round(treblefrets[i] * 10) / 10).toFixed(1);
			var postext2 = (mensur-postext).toFixed(1);
			var ord = i+"th";
			if (i==1){
				ord = "1st";
			} else if (i==2) {
				ord = "2nd";
			}else if (i==3) {
				ord = "3rd";
			}
			drawtext(frets, {x:nut.x+Tx+3.0, y:nut.y+Ty+3}, _t(ord+": "+postext), SMALLTEXT);//+" - "+postext2);
		}
		// }
	}
	cps.fretlist = fretlist;
	cps.neckjointy = neckjointy;
	cps.bridgey = bridgey;
	return neckjointy;
}

function drawborder(border){
	// Draw neckC border around the plan that has lines of neckC certain length, so that when the plan is printed the scale can be checked
	drawrect(border, {x:0,y:0}, {w:BORDERWIDTH,h:BORDERWIDTH}, BORDERSTYLEWHITE);
	// Make 10 short ones first
	for (var i=0;i<10;i+=2){
		// Horizontally
		var hsize = {w:10, h:BORDERWIDTH};
		var vsize = {w:BORDERWIDTH, h:10};
		drawrect(border, {x:BORDERWIDTH+i*10, y:0}, hsize, BORDERSTYLEBLACK);
		drawrect(border, {x:BORDERWIDTH+i*10+10, y:0}, hsize, BORDERSTYLEWHITE);
		// Vertically
		drawrect(border, {x:0, y:BORDERWIDTH+i*10},vsize, BORDERSTYLEBLACK);
		drawrect(border, {x:0, y:BORDERWIDTH+i*10+10},vsize	, BORDERSTYLEWHITE);
	}
	var borderlengthx = 100;
	var borderlengthy = 100;
	var white = false;
	
	var blen = {w:100, h:BORDERWIDTH};
	while(borderlengthx < DRAWINGWIDTH){
		var bpos = {x:BORDERWIDTH+borderlengthx, y:0};
		if (white){
			drawrect(border, bpos,blen, BORDERSTYLEWHITE);
			white=false;
		} else {
			drawrect(border, bpos,blen, BORDERSTYLEBLACK);
			white=true;
		}
		borderlengthx+=100;
	}
	var white = false;
	
	var blen = {w:BORDERWIDTH, h:100};
	while(borderlengthy < DRAWINGHEIGHT){
		var bpos = {x:0, y:BORDERWIDTH+borderlengthy};
		if (white){
			drawrect(border, bpos,blen, BORDERSTYLEWHITE);
			white=false;
		} else {
			drawrect(border, bpos,blen, BORDERSTYLEBLACK);
			white=true;
		}
		borderlengthy+=100;
	}
}
function drawinfobox(infobox){
	
	var z = new Point(0,0);
	var textw = 3.6; // Font size
	var h = 0; //80
	var lh = 10;
	var ed = editorstate;
	var d = new Date();
	
	var width = cps.width*2;
	var height = cps.depth; // Or pegbox length if lute and bigger
	var length = 0; // Depends on pegbox, but largest mensur is a good starting point, use folded length if available
	var flength = null; // folded length
	
	var content = [
	["Model", ed.bodyshapefromlist.substr(0,1).toUpperCase()+ed.bodyshapefromlist.substr(1).toLowerCase()+" "+(ed.bodyscale*100).toFixed(0)+"% with "+ed.numberofribs+" ribs"+(ed.foldable?", foldable":"")],
	["Stringing",stringing()],
	["Mensur", [ed.mensur,ed.mensur_1,ed.mensur_2,ed.mensur_3,ed.mensur_4].filter(Boolean).join(", ")+" mm"],
	["Neck Size", cps.neckwidth.toFixed(0)+" x "+cps.neck.length.toFixed(0)+" mm"],
	["Neckjoint Angle", (cps.neckjoint_angle/radtodeg).toFixed(1)+" deg"],
	cps.extension!==undefined ? (["Extension Length", cps.extension.total_length.toFixed(0)+" mm" + 
	(cps.extension.lower_length!==undefined ? (" ("+cps.extension.lower_length.toFixed(0)+" and ") :"") + 
	(cps.extension.upper_length!==undefined ? cps.extension.upper_length.toFixed(0)+" mm)" :"")]): undefined,
	["Rosette Width", cps.rosettewidth.toFixed(0)+" mm"],
	["Body Size", "w: "+ width.toFixed(0)+
				 " l: "+ cps.neckjoint_no_origin.y.toFixed(0)+
				 " d: "+ height.toFixed(0) +" mm"],
	["Shipping Size", "w: "+ ((width+7)/10).toFixed(0)+
				 " h: "+ ((height+7)/10).toFixed(0)+
				 " l: "+ ((flength!==undefined?flength:length)/10).toFixed(0) +" cm"],
	["Total Length", length],
	flength?["Folded Length", flength + "mm"]:undefined,
	];
	
	for (const line of content){
		if (line!==undefined && line[0]!==undefined && line[1]!==undefined){
		var label = _t(line[0]);
		var w = label.length * textw +10;
		drawtext(infobox, z.move(-w,h), label, GRAYTEXT);
		drawtext(infobox, z.move(0,h), typeof line[1] == "string" ? _t(line[1]) : line[1]);
		// console.log(line[0],line[1]);
		h+=lh; // next line
		}
		
	}
	infobox.setAttribute("transform", "translate("+(INFOBOXORIGIN.x)+" "+(INFOBOXORIGIN.y)+")");
}
function draw_measures(){
	
}



///////////////////////////////////////////////////////////////////////
// New part drawing functions
function draw_renaissance_pegbox(lower_hole_count,pangle_deg, width,trebler,bassr, curve){
	// Draws pegbox from a few angles, returns all of them for positioning
	var curve = curve || 0.0; // How much of an S-curve should the pegbox have in 0...1 of halfpi
	var front,side,top; // returned
	var wideblocklength = 18;
	var endblocklength = 12;
	var spacing = 11.5; // for holes
	var wideblockheight = 21;
	var endblockheight = 16;
	var endblockwidth = 20;
	var pangle_deg = pangle_deg || 8;
	var pangle = pangle_deg * radtodeg; // Convert 8 deg to radians. Pegbox angle.
	if (trebler || bassr) lower_hole_count--;
	var plength = wideblocklength+endblocklength+spacing*(lower_hole_count+0.5);
	// console.log("pangle", pangle);
	//////////////////////////////////////////////////////////////////////
	// Sideview of pegbox
	
	side = makegroup(getelid("sideview"),"pegboxside");
	var side_DR = new Point(0,0);
	var tipbot = side_DR.move(-plength);
	var side_UR = side_DR.movedist(-wideblockheight, pangle);
	var tiptop = tipbot.move(0,-endblockheight);
	var ph1 = side_DR.move(-(wideblocklength+spacing-2),-wideblockheight/2);
	var topangle = trueangle(side_UR,tiptop) ;
	var sidepath = [];
	var veneerpath = [];
	if (curve > 0){ // Curvy pegbox
		var tipangle = -curve * halfpi;
		var tipbot = side_DR.movedist(-plength,-curve*halfpi/8+halfpi);
		var tiptop = tipbot.movedist(-endblockheight, tipangle);
		
		var cp1 = side_DR.movedist(plength*0.6, -halfpi -curve*0.1);
		var cp4 = side_UR.movedist(plength*0.5, -halfpi -curve*0.1);
		
		var cp2 = tipbot.movedist(-plength*0.412*curve, tipangle-halfpi);
		var cp3 = tiptop.movedist(-plength*0.293*curve, tipangle-halfpi);
		
		sidepath = [side_DR, tipbot.bezier(cp1,cp2), tiptop, side_UR.bezier(cp3,cp4)];
		var side_outline = drawshape(side, sidepath, COVERSTYLE);
		// debug
		// drawhandles(side, [[side_DR, cp1], [tipbot, cp2], [tiptop, cp3], [side_UR, cp4]] );
		// Pegbox bottom veneer
		var VR = side_DR.movedist(-2,pangle);
		var VL = tipbot.movedist(-2,tipangle);
		var v1 = VR.movedist(plength*0.6, -halfpi -curve*0.1);
		var v2 = VL.movedist(-plength*0.396*curve, tipangle-halfpi);
		veneerpath = [VR,VL.bezier(v1,v2)];
		var veneer = drawshape(side, veneerpath, THINSTYLE,false,false,false);
		// Pegholes
		var peg1 = midpoint(side_DR, side_UR);
		var peg2 = midpoint(tipbot, tiptop);
		var c1 = midpoint(cp1, cp4);
		var c2 = midpoint(cp2, cp3);
		var pegline = drawshape(side, [peg1,peg2.bezier(c1,c2)],false,false,false);
		var pegpos = evenly_divide_path(pegline, lower_hole_count,25,21);
		draw_pegholes_pos(side,new Point(0,0),pegpos,false,false);
		delel(pegline);
		
	} else { // Straight pegbox
		sidepath = [side_DR, tipbot, tiptop, side_UR];
		var side_outline = drawshape(side, sidepath, COVERSTYLE);
		veneerpath = [tipbot.move(0,-2), side_DR.move(-2*Math.tan(pangle),-2)];
		var veneer = drawshape(side, veneerpath, THINSTYLE,false,false,false);
		// Pegbox endblock
		drawshape(side,[side_DR.move(-wideblocklength),side_DR.move(-wideblocklength, -wideblockheight/2), side_UR],GUIDESTYLE,false,false);
		// Pegbox neckblock
		drawshape(side,[tipbot.move(endblocklength,-2),tiptop.move(endblocklength)],GUIDESTYLE,false,false);
		// Pegbox side holes
		
		var pegrowa = (topangle+trueangle(side_DR,tipbot))/2;
		
		var radius;
		for (var i=0; i< lower_hole_count; i++){
			if (i%2==0){radius=3.5} else {radius=2.5}
			drawcircle(side, ph1.movedist(-spacing*i, pegrowa),radius,THINSTYLE,false);
		}
		
	}
	
	
	//////////////////////////////////////////////////////////////////////
	// Simplified shape for the frontview
	
	front = makegroup(getelid("frontview"),"pegboxfront");
	// var toph = plength*Math.sin(pangle)-3;
	var toph = (side_UR.y-tiptop.y) + (side_UR.x-tiptop.x) * Math.tan(pangle);
	var endp = side_DR.move(-width);
	var topmid = side_DR.move(-width/2, -toph);
	var topR = topmid.move(endblockwidth/2);
	var r1 = midpoint(side_DR, topR);
	var r2 = topR.move(0,toph*0.3*curve);
	var topL = topmid.move(-endblockwidth/2);
	var r3 = midpoint(endp, topL);
	var r4 = topL.move(0,toph*0.3*curve);
	
	var toppath = [side_DR,topR.bezier(r1,r2),topL,endp.bezier(r4,r3)];
	drawshape(front, toppath,THINSTYLE,false,false);
	
	//////////////////////////////////////////////////////////////////////
	// detached view, top 
	top = makegroup(getelid("frontview"),"pegboxdetached");
	var edgew = plength-linelength(side_UR, tiptop); // height of glue surface
	var top_UL = new Point(-width/2,0);
	var top_UR = new Point(width/2,0);
	var top_DL = new Point(-endblockwidth/2,plength-edgew);
	var top_DR = new Point(endblockwidth/2,plength-edgew);
	var sideangle = trueangle(top_UL, top_DL);
	
	// pegbox top outline
	drawshape(top, [top_UL, top_UR, top_DR, top_DL],COVERSTYLE,false,true);
	// Pegbox top glue surface
	drawshape(top, [top_UL, top_UR, top_UR.move(0,-edgew), top_UL.move(0,-edgew)],COVERSTYLE,false,true);
	// Pegbox top sides
	var sidew_U = 9.5;
	var sidew_D = 5.5;
	var inside_UL = top_UL.move(sidew_U);
	var inside_UR = top_UR.move(-sidew_U);
	var inside_DL = top_DL.move(sidew_D);
	var inside_DR = top_DR.move(-sidew_D);
	var insideangle = trueangle(inside_UL, inside_DL);
	// console.log("insideangle",insideangle);
	drawshape(top,[inside_UL.move(0,-edgew), inside_UL, inside_DL], THINSTYLE, false, false);
	drawshape(top,[inside_UR.move(0,-edgew), inside_UR, inside_DR], THINSTYLE, false, false);
	// Pegbox top, find block intersections
	inside_UL = line_x_from_y(inside_UL,inside_DL,wideblocklength);
	inside_DL = line_x_from_y(inside_UL,inside_DL,top_DL.y-endblocklength);
	inside_DR = inside_DL.scale(-1,1)
	inside_UR = inside_UL.scale(-1,1)
	drawline(top,[inside_UL, inside_UR],THINSTYLE);
	drawline(top,[inside_DL, inside_DR],THINSTYLE);
	// Pegbox top, lines representing pegs
	var ph2 = new Point(0, Math.abs(ph1.x));
	for (var i = 0; i<lower_hole_count; i++){
		var peg_L = line_x_from_y(top_UL,top_DL,ph2.y+i*spacing);
		var peg_R = line_x_from_y(top_UR,top_DR,ph2.y+i*spacing);
		if (i%2==0){
			peg_R = peg_R.move(5);
		} else {
			peg_L = peg_L.move(-5);
		}
		var pegline = drawline(top, [peg_L,peg_R],"",false);
	}
	
	// Save points for 3D rendering of the pegbox. These define one side only and will get mirrored by the 3D part maker.
	var pegbox = {outside:{}, inside:{}};
	pegbox.outside.endlower = top_DR.setz(0);
	pegbox.outside.endupper = top_DR.setz(endblockheight);
	pegbox.outside.startupper = top_UR.setz(wideblockheight);
	pegbox.outside.startlower = top_UR.move(0,-edgew).setz(0);
	
	pegbox.inside.endlower = inside_DR.setz(2);
	var endheight = (-4/plength)*(plength-10)+20;
	pegbox.inside.endupper = inside_DR.setz(endheight);
	pegbox.inside.startupper = top_UR.move(-sidew_U).setz(wideblockheight);
	pegbox.inside.startlower = inside_UR.setz(2);
	pegbox.inside.startmid = pegbox.inside.startlower.move(0,0,8);
	
	// Pegbox: Then draw riders if needed
	
	// Draw the chanterelle rider
	try {if (trebler || bassr){
		var theorbosvgdoc = getelid("svg-theorbos").getSVGDocument();
		var chantrfront = theorbosvgdoc.getElementById("chanterellerider-front").cloneNode(true);
		var chantrtop = theorbosvgdoc.getElementById("chanterellerider-top").cloneNode(true);
		// var chantrside = theorbosvgdoc.getElementById("chanterellerider-side").cloneNode(true);
		chantrfront.setAttribute("transform",""); // Clear transforms
		chantrtop.setAttribute("transform","");
		// chantrside.setAttribute("transform","");
		
		// var topcha = creel("path", "", "", ["d",chanterelle_top,"style",NOFILLTHIN], NAMESPACE);
		addel(top, chantrtop);
		// movepath(topcha, top_UL);
		translate(chantrtop, inside_UL.movedist(24, insideangle));
		rotate(chantrtop,(Math.PI-insideangle)/radtodeg);
		// chanterelle rider from the side
		var sicha = creel("path", "", "", ["d",chanterelle_side,"style",NOFILLTHIN], NAMESPACE);
		addelfirst(side, sicha);
		movepath(sicha, side_UR.move(-5,-2));
		// console.log("topangle", topangle);
		rotate(sicha,(halfpi-topangle)/radtodeg);
		// Chanterelle rider from the front
		addel(front,chantrfront);
		translate(chantrfront,side_DR.movedist(-4,trueangle(side_DR,topmid.move(endblockwidth/2))));
	}} catch(e) {
		console.log(e);
	}
	// Bass rider but not doublehead
	try {if (bassr === true){
		
		if (editorstate.pegboxstyle == "bassriderEdlinger"){
			var theorbosvgdoc = getelid("svg-general").getSVGDocument();
			var briderside = theorbosvgdoc.getElementById("bassrider-Edlinger-side").cloneNode(true);
			// Sideview bass rider
			addel(side, briderside);
			translate(briderside, side_UR.movedist(0, topangle));
			rotate(briderside,(halfpi-topangle)/radtodeg );
		// } else if (editorstate.pegboxstyle == "doublehead"){
			
		} else {
			var theorbosvgdoc = getelid("svg-theorbos").getSVGDocument();
			var briderfront = theorbosvgdoc.getElementById("bassrider-front").cloneNode(true);
			var bridertop = theorbosvgdoc.getElementById("bassrider-top").cloneNode(true);
			var briderside = theorbosvgdoc.getElementById("bassrider-side").cloneNode(true);
			briderfront.setAttribute("transform",""); // Clear transforms
			bridertop.setAttribute("transform","");
			briderside.setAttribute("transform","");

			// Top view bass rider
			addel(top, bridertop);
			translate(bridertop,inside_UR);
			rotate(bridertop,(Math.PI-trueangle(inside_UR,inside_DR))/radtodeg);
			// Front view bass rider
			addel(front, briderfront);
			translate(briderfront,endp.move(sidew_U));
			// Sideview bass rider
			addel(side, briderside);
			translate(briderside, side_UR.movedist(-14.5, topangle));
			rotate(briderside,(halfpi-topangle)/radtodeg );
		}
		
		
		
		
		
		
		
		// TODO: front view size or angle doesn't match, sometimes looks weird
		// cps.pegboxend = cps.pegboxend.move(0,-50);
	
	}} catch(e) {
		console.log(e);
	}
	return {front:front, side:side, top:top, pegbox:pegbox};
}

function draw_doublehead(){ // Only does the bass pegbox
	front = makegroup(getelid("frontview"),"bass-pegbox-front");
	side = makegroup(getelid("sideview"),"bass-pegbox-side");
	// TODO: set defaults in case editorstate deos not have necessary information
	
	var firstpeg = cps.bassnuts[0].move(0,-12); // TODO: This fails when no bass nuts exist... Should nuts be added where bassnuts are drawn if not renaissance pegbox?
	var npegs = 0;
	// Draw main shape
	var bangle = trueangle(getlast(cps.nuts).bass_upper,getlast(cps.nuts).bass_lower);
	var extangle = cps.nutangle - Math.PI*1.5;
	var t1 = cps.nuts[0].bass_upper.scale(-1,-1).movedist(-3,cps.nutangle);
	var b2 = getlast(cps.nuts).bass_upper.scale(-1,-1).movedist(-50,bangle);
	// var b1 = t1.movedist(30, cps.nutangle);
	var b1 = intersectline(t1, cps.nuts[0].treble_upper.scale(-1,-1),
			b2, b2.movedist(100,bangle), true);
	if (linelength(t1,b1)<32) b1 = t1.movedist(32,cps.nutangle);
	b1 = b1.movedist(-20,bangle);
	var t2 = b2.movedist(-23,cps.nutangle);
	var tangle = trueangle(t1,t2);
	var length = linelength(t1,t2);
	
	// Do squigly thing at pegbox-neck joint
	// intersect with neck bass side
	var endp = line_x_from_y(cps.neck.bass_end, cps.neck.bass_joint, b1.y+40);
	var w = Math.abs(endp.x - b1.x);
	var prendp = endp.move(-w/4, -w/4);
	var curvestart = b1.move(w/5, w/5);
	var cp1 = b1.movedist(17, bangle-0.3);
	var cp2 = prendp.movedist(-17, bangle-0.2);
	var frontshape = [t1,t2,b2,b1,curvestart, prendp.bezier(cp1,cp2),endp];
	
	var pegs = 0; //Count pegs
	
	// Draw slots above each nut
	for (var i=1; i<editorstate.numbernuts-1; i++ ){
		
		var cnut = cps.nuts[i];
		var slotleft = cnut.bass_upper.scale(-1,-1);
		var slotright = cnut.treble_upper.scale(-1,-1);
		slotright = intersectline(slotleft, slotright, t1,t2, true);
		var slottop = slotright.movedist(-30,tangle);
		
		var slotw = linelength(slotleft,slotright);
		var slota = trueangle(slotright, slotleft);
		if (slotw < 12){
			slotw = 12;
			slotleft = slotright.movedist(-12, slota);
		}
		
		var cp1 = slottop.movedist(slotw, tangle-halfpi);
		var cp2 = slotleft.movedist(-15,tangle);
		frontshape.push(null,slotright, slotleft, slottop.bezier(cp2,cp1));
		
		// Draw nuts on the side of the 12c pegbox
		var sidenut = new Point(3, slotleft.y);
		var sidenut2 = sidenut.move(0, 3.8) ;
		var sidenut3 = sidenut2.move(3.8);
		var s1 = sidenut.move(1.9);
		var s2 = sidenut3.move(0,-1.9);
		drawshape(side, [sidenut,sidenut3.bezier(s1,s2),sidenut2], false);
		
		// Count pegs
		pegs += editorstate["singles_"+i] ? editorstate["courses_"+i]:editorstate["courses_"+i]*2; 
	}
	pegs += editorstate["singles_"+i] ? editorstate["courses_"+i]:editorstate["courses_"+i]*2; 
	// frontshape.push(t2,b2); // Tip of pegbox
	// Last nut slot on the bass side
	var lnut = getlast(cps.nuts);
	// var nangle = trueangle(lnut.bass_upper, lnut.treble_upper);
	var slotright = lnut.treble_lower.scale(-1,-1);
	var slotleft = intersectline(lnut.bass_lower.scale(-1,-1), slotright, b1,b2, true);
	var slottop = slotleft.movedist(-30,trueangle(b1,b2));
	
	var cp1 = slottop.movedist(linelength(lnut.bass_lower, lnut.treble_lower), bangle+halfpi);
	var cp2 = slotright.movedist(-15,bangle);
	frontshape.push(null, slottop, slotright.bezier(cp1,cp2), slotleft);

	drawshape(front, frontshape,false,false);
	
	// console.log(front);
	
	
	//////////////////////////////////////////////////////////////
	// Side of 12c pegbox
	// top plate
	var DR = new Point(3, cps.bridge.toptreble.y-editorstate.mensur+20);
	var DL = DR.move(-2);
	var UR = new Point(DR.x, t2.y);
	var UL = UR.move(-2);
	
	
	
	var sideshape = [DR,UR,UL,DL];
	var plate = drawshape(side, sideshape,false,false);
	
	// Curly 12c pegbox part
	var topstart = DL.move(0,-80);
	var bottom = UL.move(-50,50);
	var be1 = UL.move(-30);
	var be2 = bottom.move(0,-30);
	var topmid = bottom.move(20);
	
	var pretip = UL.move(0,24);
	var pr1 = topmid.move(0,-20);
	var pr2 = pretip.move(-17,-7);
	
	var end = DL.move(-17);
	var prend = end.move(0,-40);
	// console.log("length", length);
	
	if (length < 210){ // Adjust bottom curvy part start
		prend = end.move(0,-5-35*(length/210)**2);
		topstart = DL.move(0,-10-70*(length/210)**2);
	}
	
	var bottomtip = prend.move(-10,-12);
	
	
	
	var e1 = bottomtip.move(6);
	var e2 = prend.move(0,-9);
	// TODO: t1,t2 and bt1,bt2 should be scaled according to pegbox length
	// length-50
	var dif = Math.abs(topmid.y-topstart.y);
	// console.log("dif",dif);
	if (dif < 120){
		var t1 = topstart.move(0,-80*(dif/120));
		var t2 = topmid.move(0,30*(dif/120));
		var bt1 = bottom.move(0,10+30*(dif/120));
		var bt2 = bottomtip.move(10*(dif/120)**2,-90*(dif/120));
	} else {
		var t1 = topstart.move(0,-80);
		var t2 = topmid.move(0,30);
		var bt1 = bottom.move(0,40);
		var bt2 = bottomtip.move(10,-90);
	}
	
	
	sideshape = [null, DL, topstart, 
		topmid.bezier(t1,t2), 
		pretip.bezier(pr1,pr2), 
		UL, 
		bottom.bezier(be1,be2), 
		bottomtip.bezier(bt1,bt2), 
		prend.bezier(e1,e2), end
	];
	
	var sidedrawn = drawshape(side, sideshape,false,false);
	
	// Draw pegs on the side of the 12c pegbox
	var p1 = bottomtip.move(15,-25);
	var p2 = topmid.move(-10);
	var p3 = pretip.move(-32);
	
	var cp1 = midpoint(t1,bt2); //p1.move(0,-80);
	var cp2 = midpoint(t2,bt1); //p2.move(0,35);
	var cp3 = p2.move(0,-10);
	var cp4 = p3.move(-6,7);
	
	// debug
	// drawhandles(side, [[bottom, bt1], [bottomtip, bt2],
					   // [topstart,t1], [topmid, t2],
					   // [p1,cp1], [p2, cp2]]);
	var pegline = drawshape(side, [p1,p2.bezier(cp1,cp2),p3.bezier(cp3,cp4)],false,false,false);
	var pegpos = evenly_divide_path(pegline, pegs);
	draw_pegholes_pos(side,new Point(0,0),pegpos,false,true);
	delel(pegline);
	
	// Draw pegs on the front of the 12c pegbox
	for (var p=0; p<pegpos.length; p++ ){
		var pos = line_x_from_y(b1,b2, pegpos[p].y);
		drawpeg(front, pos, null, 1.5*Math.PI-bangle);
	}
	
	// Draw last nut sideview
	var sidenut = new Point(3, lnut.bass_upper.scale(-1,-1).y);
	var sidenut2 = sidenut.move(0, 3.8) ;
	var sidenut3 = sidenut2.move(3.8);
	var s1 = sidenut.move(1.9);
	var s2 = sidenut3.move(0,-1.9);
	drawshape(side, [sidenut,sidenut3.bezier(s1,s2),sidenut2], false);
	
	// Place support sticks under nuts in the sideview
	try{
	for (var i = 1; i < editorstate.numbernuts; i++){
		var cnut = cps.nuts[i];
		var y = cnut.bass_upper.scale(-1,-1).y;
		var p1 = pathline_intersect (sidedrawn, [new Point(-1000,y),new Point(1000,y)]);
		var p2 = pathline_intersect (sidedrawn, [new Point(-1000,y+4),new Point(1000,y+4)]);
		drawshape(side, [p1,p1.setx(1),p2.setx(1),p2], false,false,false);
	}} catch(e){console.log("Failed to create nut supports for 12c pegbox",e);}
	// TODO: Also draw curvy main pegbox - separate function for that so it can be drawn without the 12c pegbox
	return {front:front, side:side};
}

function draw_theorbo_ext(){
	// console.log("draw_theorbo_ext");
	var side = new Point(SIDEVIEWORIGIN.x-5, cps.bridgey-editorstate.mensur-4.5);
	var front = new Point(FRONTVIEWORIGIN.x, cps.bridgey-editorstate.mensur-4.5);
	var extfront = makegroup(frontview, "ext-front");
	function translate_around(outp, centerp,rotp,angle){
		var a = Math.atan2((centerp.y-rotp.y), (centerp.x-rotp.x))-Math.PI*0.5;
		// var a = Math.atan((centerp.y-rotp.y)/(centerp.x-rotp.x))+Math.PI*0.5;
		var d = Math.sqrt((centerp.y-rotp.y)**2+(centerp.x-rotp.x)**2);
		return outp.movedist(-d,a+angle);
	}
	try { // Looking for abs coordinate of last bass nut
		var lastnut = cps.bassnuts[parseInt(editorstate.numbernuts)-2];
	} catch(e){
		var lastnut = new Point(150, 150);
	}
	cps.extension = {};
	cps.pegboxend = lastnut.move(0,-100);
	
	///////////////////////////////////////////////////////////////////////
	// Draw extension front
	
	var ext1 = cps.ext1;
	var ext2 = cps.ext2;
	
	///////////////////////////////////////////////////////////////////////
	// Draw head front
	
	var offset = new Point(0,9);
	var sideoffset = new Point(49.877,-10.8);
	var width = 30;
	var pegspacing = 11.5;
	var pegoffset = new Point(0,0);
	var headname = "basictheorbo";
	// Hard-code offsets for different theorbo heads here, like a professional coder
	// Could be parametrized later?
	if (editorstate.pegboxstyle == "theorboKoch") {
		headname = "Koch";
		offset = new Point(14,35.5);
		width = 32.7;
		pegspacing = 15;
		sideoffset = new Point(28.35,-40);
		// Koch also has a different angle set for foldable neck later
	} else if (editorstate.pegboxstyle == "theorboSmallKoch") {
		headname = "smallKoch";
		offset = new Point(15.3,37.5);
		width = 32.7;
		pegspacing = 15;
		sideoffset = new Point(18.49,-38);
	} else if (editorstate.pegboxstyle == "theorboHarz"){
		headname = "Harz";
		offset = new Point(9.5,16.44);
		pegspacing = 13;
		sideoffset = new Point(47.25,-45);
	} else if (editorstate.pegboxstyle == "theorboSmallFrench"){
		headname = "smallfrench";
		// offset = new Point(11.8,22);
		offset = new Point(-2.1,71.2);
		width = 27.5;
		sideoffset = new Point(44.5,-49.4);
		pegoffset = new Point(-14,10);
	} else if (editorstate.pegboxstyle == "theorboEnglish"){
		headname = "englishtheorbo";
		// offset = new Point(11.8,22);
		offset = new Point(-7,31);
		width = 25.2;
		sideoffset = new Point(17.13,-28);
		pegoffset = new Point(-14,10);
	}
	// TODO: Lengthen basic theorbo head by 11.5mm per string
	var extangle = Math.atan((cps.nutmid.x-lastnut.x)/(cps.nutmid.y-lastnut.y));
	var midp = lastnut.movedist(offset.y,extangle);
	midp = midp.movedist(offset.x, extangle-Math.PI/2);
	extangle = Math.atan((cps.nutmid.x-midp.x)/(cps.nutmid.y-midp.y));
	
	
	var deg = -extangle / radtodeg; // rad to deg
	var hfront = insert_drawing("", headname+"-front", extfront, lastnut,  deg );
	
	var extend1 = midp.movedist(width/2, extangle+Math.PI/2);
	var extend2 = midp.movedist(width/2, extangle-Math.PI/2);
	cps.extension.treble_upper = extend1.minuspoint(FRONTVIEWORIGIN).scale(-1,-1).setz(54);
	cps.extension.bass_upper = extend2.minuspoint(FRONTVIEWORIGIN).scale(-1,-1).setz(54);
	cps.extension.angle_sideways = extangle;
	cps.extension.treble_lower = ext1.minuspoint(FRONTVIEWORIGIN).scale(-1,-1).setz(4);
	cps.extension.bass_lower = ext2.minuspoint(FRONTVIEWORIGIN).scale(-1,-1).setz(4);;
	
	
	
	
	
	
	// Draw pegbox inside on the extension frontview
	// Follow extension side angles
	var exttangle = trueangle(ext1,extend1);
	var extbangle = trueangle(ext2,extend2);
	var spacing = 14;
	console.log(editorstate.singlestrings);
	if (editorstate.singlestrings){
		var plength = 30+10+spacing*(editorstate.fingerboardcourses-1);
	} else {
		var plength = 30+10+spacing*(editorstate.fingerboardcourses*2-editorstate.chanterelles-1);
	}
	
	var t = ext1.movedist(12,cps.nutangle).movedist(-5,exttangle);
	var b = ext2.movedist(-20,cps.nutangle).movedist(-5,extbangle);
	// var hmid = midpoint(t,b).movedist(-plength,extangle);
	var t2 = t.movedist(-plength,exttangle);
	var b2 = b.movedist(-plength-100,extbangle);
	
	var b22 = t2.movedist(plength,extangle-Math.PI/2);
	// Intersect lines to find correct b2
	// console.log(t2, b22,	  b, b2);
	var b2 = intersectline(t2, b22,	  b, b2, true);
	console.log(plength);
	// Points for treble cutout
	var c1 = ext1.movedist(5,cps.nutangle).movedist(-5,exttangle);
	var c2 = c1.movedist(-65,exttangle);
	var c3 = t.movedist(-75,exttangle);
	var cp1 = c3.movedist(-3,exttangle-halfpi);
	var cp2 = c2.movedist(-5,exttangle);
	// Points for angled front edge of hole
	var hb = b.movedist(-15,extbangle);
	var ht = t.movedist(-15,exttangle);
	var ht2 = t.movedist(-7,exttangle);
	
	// ,hb,ht,ht2,c1,ht2,t2
	var pegboxfront = drawshape(extfront,
		[c3,c2.bezier(cp1,cp2),c1,b,b2,t2,ht2, null, c1,ht2, null, hb,ht],
		THINSTYLE,"extension-lower-pegbox", false);
	// Rearrange elements to put strings on top
	addelbefore(getelid("neck"), pegboxfront);
	
	// draw extension front view
	var tshape = [ext1,extend1];
	var bshape = [ext2,extend2];
	if (editorstate.pegboxstyle == "theorboHarz"){
		var t3 = ext1.movedist(-plength-60, exttangle);
		var t4 = t3.movedist(6, exttangle- (140*radtodeg));
		var b3 = ext2.movedist(-plength-35, extbangle);
		var b4 = b3.movedist(6, extbangle- (140*radtodeg));
		tshape = [ext1,t3,t4,extend1];
		bshape = [ext2,b3,b4,extend2];
	}  else if (editorstate.pegboxstyle == "theorboSmallFrench" 
			||editorstate.pegboxstyle == "theorboEnglish"){
		var t3 = ext1.movedist(-plength-29, exttangle);
		var t4 = t3.movedist(5.5, exttangle- (145*radtodeg));
		var cp1 = t3.movedist(-2.5,exttangle);
		var cp2 = t4.movedist(-1.5,exttangle-halfpi);
		var t5 = ext1.movedist(-plength-38, exttangle);
		var cp3 = t5.movedist(2,exttangle);
		var t6 = t5.movedist(12, exttangle- (150*radtodeg));
		var cp4 = t5.movedist(2.5,exttangle-halfpi);
		var cp5 = t6.movedist(5,exttangle);
		tshape = [ext1,t3,t4.bezier(cp1,cp2),
					   t5.bezier(cp2,cp3),
					   t6.bezier(cp4,cp5),extend1];
	} 
	drawshape(extfront,tshape,THINSTYLE,false,false);				
	drawshape(extfront,bshape,THINSTYLE,false,false);
	
	cps.extension.hole = {};
	cps.extension.hole.treble_upper = t2.minuspoint(FRONTVIEWORIGIN).scale(-1,-1);
	cps.extension.hole.bass_upper = b2.minuspoint(FRONTVIEWORIGIN).scale(-1,-1);
	cps.extension.hole.treble_lower = t.minuspoint(FRONTVIEWORIGIN).scale(-1,-1);
	cps.extension.hole.bass_lower = b.minuspoint(FRONTVIEWORIGIN).scale(-1,-1);
	
	
	///////////////////////////////////////////
	// Draw peg centerlines on the extension frontview, maybe even pegs
	if (editorstate.singlestrings){
		var pegs = editorstate.fingerboardcourses;
	} else {
		var pegs = editorstate.fingerboardcourses*2-editorstate.chanterelles;
	}
	// Pegs on the frontview
	var lopegs = makegroup(extfront, "lower-pegs");
	draw_pegs_front(lopegs,spacing,pegs,extbangle, exttangle,ext2.movedist(-25,extbangle), ext1, b, t);
	
	//////////////////////////////////////////////////////
	// Draw extension side view
	//////////////////////////////////////////////////////
	
	function translate_around2(outp, centerp,rotp,angle){
		// var a = Math.atan2((centerp.y-rotp.y), (centerp.x-rotp.x))-Math.PI*0.5;
		var a = Math.atan((centerp.y-rotp.y)/(centerp.x-rotp.x))+Math.PI*0.5;
		var d = Math.sqrt((centerp.y-rotp.y)**2+(centerp.x-rotp.x)**2);
		return outp.movedist(d,-a-angle);
	}
	// Place head on drawing
	
	var exg = makegroup(sideview, "ext-side");
	
	
	// Find extension drawing endpoints (these do not represent the full length)
	// where pegbox meets extension
	var stringend = new Point(SIDEVIEWORIGIN.x+7, lastnut.y);
	var points = circle_tangent(side, new Circle(stringend, sideoffset.x));
	var exttip = points[0].x < points[1].x ? points[0]: points[1];
	var headangle = trueangle(stringend, exttip);
	exttip = exttip.movedist(sideoffset.y, headangle+halfpi);
	var extsideangle = trueangle(side,exttip);
	var exttip2 = exttip.movedist(20, extsideangle-halfpi);
	var side2 = side.move(-25,-10); // end of backside of extension, where curve begins
	var extbacksideangle = trueangle(side2,exttip2);
	var sdeg = -extsideangle / 0.01745329252; // rad to deg
	var exttip3 = exttip.movedist(19, extsideangle-halfpi);
	
	// Draw extension head
	var hside = insert_drawing("", headname+"-side", exg, stringend, sdeg );
	// Draw pegholes on head
	// editorstate["singles_"+editorstate.numbernuts]
	if (editorstate["singles_"+(editorstate.numbernuts-1)]){
		var num = editorstate["courses_"+( editorstate.numbernuts-1)];
	} else {
		var num = editorstate["courses_"+(editorstate.numbernuts-1)]*2;
	}
	// console.log("num",num);
	var pegline = insert_drawing("", headname+"-pegline", exg, stringend, sdeg );
	var pegpos = evenly_divide_path(pegline, num);
	for (var i=0; i <pegpos.length; i++){
		pegpos[i] = pegpos[i].rotate(new Point(0,0), extsideangle);
	}
	draw_pegholes_pos(exg,stringend,pegpos,false);
	delel(pegline);
	// Draw pegs on the upper pegbox front
	var uppegs = makegroup(extfront, "upper-pegs");
	var frontpegstart = lastnut.movedist(offset.x, extangle-halfpi).addpoint(pegoffset);
	
	for (var i=0; i<pegpos.length ; i++){
		
		var leftp = frontpegstart.movedist(pegpos[i].y,extangle).movedist(19-i*0.9,extangle+Math.PI*1.5);
		var rightp = frontpegstart.movedist(pegpos[i].y,extangle).movedist(-19+i*0.95,extangle+Math.PI*1.5);
		
		if (i%2==0){
			var shank = [leftp, rightp];
			drawpeg(uppegs, leftp, shank, -extangle+Math.PI*1.5);
			
		} else { // treble side
			var shank = [rightp, leftp];
			drawpeg(uppegs, rightp, shank, -extangle+Math.PI/2);
		}
	}
	// Reorder extension elements on the front view to get strings on top of everything
	addelbefore(getelid("stringgroup"), uppegs);
	addelbefore(uppegs, hfront);
	
	// Calculate extension total length
	var headlength = (hside.getBBox().height? hside.getBBox().height: 100)
	cps.extension.total_length = flatlinelength(side,exttip) + headlength;
	var heady = exttip.y-headlength;
	
	var extbackstart = side.move(-25,-10);
	var extbacksideangle = -getangle(extbackstart,exttip2);
	// But also make some adjustment so the hinge doesn't intersect the lower pegs
	// Find hinge center by intersecting extension backside
	
	// Draw folded sideview extension	
	if (editorstate.foldable){
		var extlen = cps.neckmid.y-heady;
		var haf = extlen/2; 
		var hy = cps.neckmid.y-haf; // This is where the hinge is located
		// Limit hinge position by pegbox cutaway size
		var limitedy = side.y-plength-90;
		if (limitedy < hy){hy=limitedy;}
		// console.log(hy);
		// Hinge center to end of extension part 73.50mm
		var hinge = intersectline(new Point(0, hy), 
								new Point(DRAWINGWIDTH, hy+0.0000000001),  
								exttip2,
								extbackstart);
		// Find hinge on top surface of extension
		var hp = intersectline(hinge, 
							   hinge.movedist(200,extsideangle-halfpi),  
							   exttip,
							   side, true);
		// drawcircle(sideview, hp,5, REDSTYLE,"");
		
		// Find hinge joint shape points
		var p4 = hp.movedist(73.5, extsideangle);
		var p3 = p4.movedist(6, extsideangle-halfpi);
		var p2 = p3.movedist(-10, extsideangle);
		var p1 = p2.movedist(10,extsideangle-halfpi);
		var p0 = p1.movedist(-58.5, extsideangle);
		var pa = hinge.movedist(5, -extbacksideangle);
		var pb = hinge.movedist(-5, -extbacksideangle);
		var pc = p1.movedist(-58.5-10, extsideangle);
		// console.log(hp,p4,p3,p2,p1,p0,pa,pb,pc);
		// Draw hinge tube
		var hingetube = drawcircle(extg, hinge,5, null,"hinge-tube");
		marklength (exg, side, p4,false); // Squigly line showing lower pegbox part length
		cps.extension.lower_length = flatlinelength(side,p4);
		// Sideview of lower extension part
		var path = [
			side, p4,p3,p2,p1,p0,pa,
			extbackstart,
			side.move(-16,30).bezier(side.move(-23.5,10), side.move(-20,20)),
			side.move(-1,40)
		];
		drawshape(exg, path, COVERSTYLE,"ext-side-pegbox", true);
		
		// sideview of upper part of extension
		var path = [
			
			exttip2,
			pb,pc,p0,p1,p2,p3,p4,exttip
		];
		var extside2 = drawshape(exg, path, COVERSTYLE,"ext-side-extension", false);
		
		// Squigly line showing lower pegbox part length
		marklength (exg, p4, exttip ,false); 
		cps.extension.upper_length = flatlinelength(p4,exttip);
		
		// Copy extension long part and rotate
		var extg = makegroup(sideview, "extension-rotate");
		addel(extg,extside2.cloneNode(true));// Add to extension rotate group
		var deg = -177.5; 
		if (editorstate.pegboxstyle == "theorboKoch") deg = -175;
		var transf = "rotate("+deg+" "+hinge.x +" "+hinge.y +")";
		// console.log(transf); // t
		extg.setAttribute("transform",transf);
		
		// Add head to extension rotate group
		addel(extg, hside.cloneNode(true));
		// addel(extg,headg.cloneNode(true));
		// addel(extg,bassnut.cloneNode(true));
		
		addel(exg, extg);
		
		// Mark instrument folded length on the drawing
		var foldedlength = SIDEVIEWORIGIN.y - (hinge.y-74) + 10; // +10 for strap pin
		var inner ="Folded length: "+((foldedlength/10).toFixed(0))+" cm";
		var point = hinge.move(-110,-80);
		drawtext(exg, point, inner,"","folded-length-info");
		
		// Draw split line between lower part of extension and upper
		var splitt = line_x_from_y(ext1,extend1, p4.y);
		var guess = splitt.movedist(100,extangle-halfpi);
		var splitb = intersectline(extend2,ext2, splitt, guess);
		drawline(extfront, [splitt, splitb]);
		
	} else { // Draw extension sideview without hinge
		var path = [
			side, exttip,null,
			exttip2,//.bezier(extc1,extc2),
			side2,
			side.move(-16,30).bezier(side.move(-23.5,10), side.move(-20,20)),
			side.move(-1,40),side
		];
		drawshape(exg, path, COVERSTYLE,"ext-side-outline", false);
	}
	
	var extline = [	exttip2.move(0.5),
					side.move(-22,-15),
					side.move(-1,40).bezier(	side.move(-20,15),side.move(-10,30))
	];
	drawshape(exg, extline, NOFILLTHIN,"ext-side-edgeline", false);

	
	// Pegs on the sideview
	// TODO: if find headname+"pegline" in generel.svg, place pegholes on that line
	var sidepegs = makegroup(exg, "lower-peg-holes");
	draw_pegholes(sidepegs,pegs,spacing,new Point(0,side.y-19,side.x-12),extsideangle,false);
	
	
	
	// Calculate extension total length
	cps.extension.total_length = flatlinelength(side,exttip) 
		+ (hside.getBBox().height? hside.getBBox().height: 100);
	
	////////////////////////////////////////////////////////////////
	// Draw additional pegbox slots if English theorbo
	
	if (editorstate.numbernuts > 2){
		for (var i=1; i<editorstate.numbernuts-1; i++ ){
			var pg = makegroup(extfront, "lower-pegs-"+i);
			console.log(i-1);
			var nut = cps.bassnuts[i-1];
			console.log(i, nut);
			var npegs = editorstate["singles_"+i] ? editorstate["courses_"+i] : editorstate["courses_"+i] * 2;
			var slotlen = npegs * 22 ;
			// Draw slot
			var nb = line_x_from_y(ext2,extend2, nut.y).move(7,-12);
			var nt = nb.movedist(14,extbangle+halfpi);

			// var nb = nc.movedist(-10,extangle-halfpi);
			var shape = [nt,
						 nt.movedist(-slotlen, extangle),
						 nb.movedist(-slotlen, extbangle),
						 nb];
			drawshape(pg,shape,THINSTYLE,false,true);		
			// Draw pegs
			// var pegstart = nut.movedist(-12,extangle);
			for (var j=0; j<npegs; j++){
				
				var leftp = nb.movedist(-12-22*j, extbangle);
				var rightp = nt.movedist(-12-22*j, extangle);
				var shank = [leftp, rightp];
				var outhole = intersectline(ext2,extend2, leftp,rightp,true);
				console.log(outhole,leftp,rightp);
				drawpeg(pg, outhole, shank, -extbangle+Math.PI*1.5);
				// Pegholes for these nuts
				var hole = line_x_from_y(side,exttip, outhole.y).move(-10);
				drawcircle(exg,hole,3.5);
			}
			// Draw nuts on the side view
			var top = nut.setx(stringend.x);
			var bot = line_x_from_y(side,exttip, nut.y);
			var bot2 = line_x_from_y(side,exttip, nut.y-5);
			var top2 = top.move(-4,-4);
			var cp1 = top.move(0,-2);
			var cp2 = top2.move(2);
			drawshape(exg,[bot2,bot,top,top2.bezier(cp1,cp2)],THINSTYLE,false,true);	
			//TODO: Make nicer nuts
			
			
			
		}
	}
	
}
/* 
function draw_englishtheorbo_ext(){
	var eg = makegroup(getelid("frontview"),"extension-front");
	var ext_DL = FRONTVIEWORIGIN.addpoint(cps.neck.bass_end).movedist(3.5,cps.neck.angle+halfpi);
	var ext_DR = FRONTVIEWORIGIN.addpoint(cps.neck.treble_end).movedist(3.5,cps.neck.angle-halfpi);
	drawX(eg,ext_DL,5,REDSTYLE);
	drawX(eg,ext_DR,5,REDSTYLE);
	
	var ext_UL = getlast(cps.bassnuts);
	var ext_UR = getlast(cps.bassnuts).move(20);
	
	// Lower pegbox inside shape
	var spacing = 14;
	if (editorstate.singlestrings){
		var plength = 30+10+spacing*(editorstate.fingerboardcourses-1);
	} else {
		var plength = 30+10+spacing*(editorstate.fingerboardcourses*2-editorstate.chanterelles-1);
	}
	var Rangle = trueangle(ext_DR,ext_UR);
	var Langle = trueangle(ext_DL,ext_UL);
	var ins_DL = ext_DL.movedist(20,cps.neck.angle+halfpi);
	var ins_DR = ext_DR.movedist(9,cps.neck.angle-halfpi);
	var ins_UL = ins_DL.movedist(-plength,Langle);
	var ins_UR = ins_DR.movedist(-plength,Rangle);
	drawshape(eg,[ins_DL,ins_UL,ins_UR,ins_DR]);
	
	
	
	
	
	if (editorstate.singlestrings){
		var pegs = editorstate.fingerboardcourses;
	} else {
		var pegs = editorstate.fingerboardcourses*2-editorstate.chanterelles;
	}
	var lopegs = makegroup(eg, "lower-pegs");
	draw_pegs_front(lopegs,spacing,pegs, Langle,Rangle,ext_DL.movedist(-25,Langle), ext_DR, ins_DL, ins_DR);
	
	// Do a little curly thing on top of lower pegbox
	var d1 = ext_DR.movedist(-plength-12, Rangle);
	var cp1 = d1.movedist(-4,Rangle);
	var cp2 = d1.movedist(-5,Rangle).movedist(-2,Rangle+halfpi);
	var d2 = d1.movedist(-6,Rangle).movedist(-4,Rangle+halfpi).bezier(cp1,cp2);
	var d3 = d1.movedist(-10,Rangle);
	var d4 = d3.movedist(-25,Rangle).movedist(-6,Rangle+halfpi);
	
	var outline = [ext_DR, d1,d2,d3,d4,getlast(cps.bassnuts).move(20), getlast(cps.bassnuts),ext_DL];
	drawshape(eg,outline);
	
	var bassnuts = cps.bassnuts; // coordinates of first string on nut
	// Draw pegbox slots behind each nut (except last) on the front view
	for (var n=0; n < bassnuts.length; n++){
		var bridgefirst = cps.bridgefirststring.move(-stringbandws.bridge[n][0]);
		var bangle = getangle(bridgefirst, bassnuts[n]);
		console.log("bangle",bangle);
		drawX(eg,bassnuts[n],2,REDSTYLE);
		
		 
	}
}
 */
function draw_pegs_front(g,spacing,pegs, Langle,Rangle,ext_DL, ext_DR, ins_DL, ins_DR){
	// Draw pegs on frontview. ext_DL defines pos of lowest peg.
	var pangle = (Langle+Rangle)/2-halfpi;
	var ext_UL = ext_DL.movedist(-100,Langle);
	var ext_UR = ext_DR.movedist(-100,Rangle);
	var ins_UL = ins_DL.movedist(-100,Langle);
	var ins_UR = ins_DR.movedist(-100,Rangle);
	
	for (var i = 0; i<pegs; i++){
		var pos = spacing*i;
		var p1 = ext_DL.movedist(-pos, Langle);
		var p2 = p1.movedist(-200,pangle);
		
		var ib = intersectline(p1, p2, ext_DL,ext_UL, true);
		var it = intersectline(p1, p2, ext_DR,ext_UR, true);
		// Intersect for visible part of shank
		var pbi = intersectline(p1, p2, ins_DL,ins_UL, true); 
		var pti = intersectline(p1, p2, ins_DR,ins_UR, true);

		// Draw peg, choose which side
		if (i%2==0){
			drawpeg(g, ib, [pbi, pti], Math.PI-pangle);
		} else {
			drawpeg(g, it, [pti, pbi], -pangle);
		}
	}
}

function draw_pegs_front_(g,spacing,pegs, Langle,Rangle, pangle,ext_DL, ext_DR, ins_DL, ins_DR,style){
	// Draw pegs on frontview. ext_DL defines pos of lowest peg.
	// console.log(g,spacing,pegs, Langle,Rangle,ext_DL, ext_DR, ins_DL, ins_DR);
	// var pangle = (Langle+Rangle)/2-halfpi;
	var ext_UL = ext_DL.movedist(-100,Langle);
	var ext_UR = ext_DR.movedist(-100,Rangle);
	var ins_UL = ins_DL.movedist(-100,Langle);
	var ins_UR = ins_DR.movedist(-100,Rangle);
	
	for (var i = 0; i<pegs; i++){
		var pos = spacing*i;
		var p1 = ext_DL.movedist(-pos, Langle);
		var p2 = p1.movedist(-200,pangle);
		
		var ib = intersectline(p1, p2, ext_DL,ext_UL, true);
		var it = intersectline(p1, p2, ext_DR,ext_UR, true);
		// Intersect for visible part of shank
		var pbi = intersectline(p1, p2, ins_DL,ins_UL, true); 
		var pti = intersectline(p1, p2, ins_DR,ins_UR, true);

		// Draw peg, choose which side
		if (i%2==0){
			drawpeg(g, ib, [pbi, pti], -pangle,style);
		} else {
			drawpeg(g, it, [pti, pbi], -pangle-Math.PI,style);
		}
	}
}
















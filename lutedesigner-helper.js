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
// Basic HTML and SVG helper functions
// - Accessing and creating elements in DOM easily
// - Path intersections
// - 

var features_init = []; // To be run at body.onload
var features = []; // To be run at makedrawing(). push new features that should be added if a certain file is present into this array as functions. This is here because helper is the first js file to be included.

function getlast(ar){
	return ar[ar.length-1];
}
function penult(ar){
	try {
		return ar[ar.length-2];
	}catch (e) {
		console.log("penult(): Attempted to access second to last array member, but it does not exist.");
	}
}
function foreach(ar, func) {
	for (var i=0; i < ar.length; i++){
		func(ar[i]);
	}
}
///////////////////////////////////////////////////////////////////////////////
// Debug
///////////////////////////////////////////////////////////////////////////////
function debug(what, father){
	// what should be a string of variable names separated by spaces
	// father is the object that the variables belong to, or global scope if not provided 
	var vars = what.split(" ");
	var out = "";
	for (var i=0; i<vars.length; i++){
		// console.log("debug", vars[i]);
		if (father && vars[i].startsWith("this.")){
			out += vars[i] + " = " + eval(father+vars[i].replace("this","")) + "\n";
		} else {
			out += vars[i] + " = " + eval(vars[i]) + "\n";
		}
		
	}
	console.log(out);
}
function debugpath(p){
	// TODO: Also needs to support relative paths
	console.log("debugpath",p);
	// Draw control points and points
	var segs = interpretpath(extractpath(p.getAttribute("d")));
	var parel = p.parentNode;
	var prevp = segs[0];
	for (var i=0; i < segs.length; i++){
		var seg = segs[i];
		if (seg.x && seg.y) drawcircle(parel, new Point(seg.x, seg.y), 1, REDSTYLE);
		if (seg.x1 && seg.y1) {
			drawcircle(parel, new Point(seg.x1, seg.y1), 1, BLUESTYLE);
			drawline(parel, [new Point(prevp.x, prevp.y),new Point(seg.x1, seg.y1)], THINBLUE);
		}
		if (seg.x2 && seg.y2) {
			drawcircle(parel, new Point(seg.x2, seg.y2), 1, BLUESTYLE);
			drawline(parel, [new Point(seg.x, seg.y),new Point(seg.x2, seg.y2)], THINBLUE);
		}
		prevp = segs[i];
	}
}
///////////////////////////////////////////////////////////////////////////////
// JS and SVG related helper functions
///////////////////////////////////////////////////////////////////////////////
// Point is the workhorse of Lute Designer. There's no harm in packing extra fields, like i or angle in a Point, but usually it only has x and y, maybe z too.
function Point(cx,cy, cz){
	// Point class for easier drawing
	this.x = cx || 0.0;
	this.y = cy || 0.0;
	if (cz !== undefined) this.z = cz;
	return this;
}

function Circle(cp, radius){
	// circle class, contains center point and radius
	this.iscircle = true;
	this.center = new Point(cp.x,cp.y);
	this.x = cp.x;
	this.y = cp.y;
	this.r = radius;
	return this;
}

function intersect_circle_above(c1,c2){
	// intersect two circle objects, actually positive semicircles
	
	var d = Math.sqrt((c1.x-c2.x)**2 + (c1.y-c2.y)**2);
	var l = (c1.r**2 - c2.r**2 + d**2) / (2*d);
	var h = Math.sqrt(c1.r**2 - l**2);
	var ix = (l/d)*(c2.x-c1.x) - (h/d)*(c2.y-c1.y) + c1.x;
	var iy = (l/d)*(c2.y-c1.y) + (h/d)*(c2.x-c1.x) + c1.y;
	// console.log(ix,iy);
	return new Point(ix,iy);
}
function intersect_circle(c1,c2){
	// intersect two circle objects
	// console.log("intersecting circles",c1.x,c1.y,c2.x,c2.y);
	var d = Math.sqrt((c1.x-c2.x)**2 + (c1.y-c2.y)**2); // distance between circle centers
	if (d > c1.r + c2.r){console.log("circles don't touch");return false;} // 
	if (d == 0 && c1.r == c2.r){console.log("same circle");return false;} // 
	if (d < Math.abs(c1.r - c2.r)){console.log("circle inside the other");return false;} // 
	
	
	var a = (c1.r**2 - c2.r**2 + d**2) / (2*d); // distance from c1 to line between intersections
	var h = Math.sqrt(c1.r**2 - a**2); // distance to intersection from line connecting centers
	// var bp = c2.sub(c1).scale(a/d).add(c1); // point between circles
	var xb = c1.x + a * (c2.x-c1.x) / d;
	var yb = c1.y + a * (c2.y-c1.y) / d; // xb,yb is exactly between intersections
	// console.log(xb,yb,d);
	var x3 = xb + h*(c2.y - c1.y)/d;
	var y3 = yb - h*(c2.x - c1.x)/d;
	var x4 = xb - h*(c2.y - c1.y)/d;
	var y4 = yb + h*(c2.x - c1.x)/d;
	
	return [new Point(x3,y3), new Point(x4,y4)];
}
function circle_line(c, p1, p2,bounds){ // Intersect line with circle. bounds does nothing
	// 
	if (bounds === undefined) bounds = false;
	if (p1.x==p2.x && Math.abs(p1.x-c.x) < c.r){ // TODO: Check distance logic
		// return point on both positive and negative semicircle
		var inter1 = new Point(p1.x, Math.sqrt(c.r**2-(p1.x-c.x)**2)+c.y);
		var inter2 = new Point(p1.x, Math.sqrt(c.r**2-(p1.x-c.x)**2)+c.y);
		return [inter1,inter2];
	}
	var m = (p2.y-p1.y)/(p2.x-p1.x);
	var u = (p1.y-c.y) - m*(p1.x-c.x);
	var a = m**2+1;
	var b = 2*u*m;
	var x1 = (-b+Math.sqrt(b**2-4*a*(u**2-c.r**2))) / (2*a) + c.x;
	var x2 = (-b-Math.sqrt(b**2-4*a*(u**2-c.r**2))) / (2*a) + c.x;
	var y1 = m*(x1 - p1.x) + p1.y;
	var y2 = m*(x2 - p1.x) + p1.y;
	// Check if inside line points
	console.log("circle inters",x1,x2);
	var out=[];
	// if (!bounds) {
		// out.push(new Point(x1,y1));
		// out.push(new Point(x2,y2));
	// } else {
		if (isbetween(p1.x, x1, p2.x)) out.push(new Point(x1,y1));
		if (isbetween(p1.x, x2, p2.x)) out.push(new Point(x2,y2));
	// }
	
	return out;
}

Point.prototype.move = function (movex,movey,movez){
	// Add coordinates to old coordinates and return new Point
	var movey = movey || 0.0;
	if (this.z === undefined) {
		if (movez === undefined){
			return new Point(this.x+movex, this.y+movey);
		} else {
			return new Point(this.x+movex, this.y+movey, movez);
		}
	} else {
		if (movez === undefined){
			return new Point(this.x+movex, this.y+movey, this.z);
		} else {
			return new Point(this.x+movex, this.y+movey, this.z+movez);
		}
	}
	
}

Point.prototype.addpoint = function (newpoint){
	// Add coordinates of another point object to old coordinates and return new Point
	if (newpoint===undefined) return this;
	// return new Point(this.x+newpoint.x,this.y+newpoint.y);
	return this.move(newpoint.x,newpoint.y,newpoint.z);
}
Point.prototype.minuspoint = function (newpoint){
	// Find distance between points in x and y
	// return new Point(this.x-newpoint.x,this.y-newpoint.y);
	return this.move(-newpoint.x,-newpoint.y,-newpoint.z);
}
Point.prototype.flip = function (){
	// Flip x and y
	// TODO: specify axes to flip for 3D
	var oldx = this.x;
	this.x = y;
	this.y = oldx;
}
Point.prototype.rotate = function (rotpoint,angle){ // TODO: not tested yet
	// Rotate around specified rotation point
	// TODO: Perhaps needs to check if angle is negative or this.x < rotpoint.x
	var oa = Math.atan2((this.y-rotpoint.y),(this.x-rotpoint.x));//(rotpoint, this);
	var r = linelength(this, rotpoint);
	var x = rotpoint.x+r*Math.cos(oa-angle);
	var y = rotpoint.y+r*Math.sin(oa-angle);
	return new Point(x,y,this.z);
}
Point.prototype.scale = function (xscale,yscale,zscale){
	// Multiply coordinates by scale
	var x = this.x*xscale;
	var yscale = yscale || xscale;
	var y = this.y*yscale;
	if (this.isbezier){
		// console.log("scaling a bezier");
		var x1 = (this.x1 - this.x)*xscale;
		var x2 = (this.x2 - this.x)*xscale;
		var y1 = (this.y1 - this.y)*yscale;
		var y2 = (this.y2 - this.y)*yscale;
		return new Point(x,y).relbezier(x1,y1,x2,y2);
	}
	if (this.z !== undefined){
		var zscale = zscale || yscale;
		var z = this.z*zscale;
		return new Point(x,y,z);
	} else {
		return new Point(x,y);
	}
	
}
Point.prototype.avg = function (p2 ,w) { // average / middle of two Points. Also weighted avg.
	// var w = w || 0.5;
	if (w === 0) return this.move(0);
	if (w === undefined) var w = 0.5;
	
	var m = 1-w;
	var z = (m*(this.z ? this.z: 0) + w*(p2.z ? p2.z: 0));
	return new Point((m*this.x+w*p2.x),(m*this.y+w*p2.y),z);
}

/* Point.prototype.movedist = function (dist,angle, around_axis){
	// Move from point coordinates by a certain length and angle and return new point
	// TODO: around_axis
	// upwards (negative y) is 0.0, right (positive y) is Math.PI/2
	return new Point(this.x+dist*Math.sin(angle), 
				     this.y-dist*Math.cos(angle));
}
*/
Point.prototype.movedist = function (dist,angle){
	// Move from point coordinates by a certain length and angle and return new point
	return new Point(this.x+dist*Math.sin(angle), 
				     this.y+dist*Math.cos(angle),
					 this.z || null);
}
Point.prototype.moveangle = function (dist,angle){
	// Move from point coordinates by a certain length and angle and return new point
	// Normalized angle function where north is 0 and + is clockwise
	while (angle >= 2*Math.PI){
		angle -= 2*Math.PI;
	}
	while (angle < 0){
		angle += 2*Math.PI;
	}
	if (angle < 0.5*Math.PI){
		return this.move(dist*Math.sin(angle), 
						-dist*Math.cos(angle));
	} else if (angle < Math.PI){
		return this.move(dist*Math.cos(angle-0.5*Math.PI), 
						dist*Math.sin(angle-0.5*Math.PI));
	} else if (angle < 1.5*Math.PI){
		return this.move(-dist*Math.sin(angle-Math.PI), 
						dist*Math.cos(angle-Math.PI));
	} else {
		return this.move(-dist*Math.cos(angle-1.5*Math.PI), 
						-dist*Math.sin(angle-1.5*Math.PI));
	}
}
Point.prototype.move3d = function (yaw, pitch, dist){
	// Yaw = angle around y
	// Pitch angle around x
	var Px = dist * Math.sin(yaw) * Math.cos(pitch);
	var Py = dist * Math.sin(pitch);
	var Pz = dist * Math.cos(yaw) * Math.cos(pitch);
	return this.move(Px, Py, Pz);
}
Point.prototype.vectormove = function (dist,v){ // gets angles for and uses move3d()
	// Yaw = angle around y
	var yaw = trueangle(this.xz(), v.xz());
	// Pitch angle around x
	var pitch = trueangle(this.yz(), v.yz());
	return this.move3d(yaw, -pitch, dist);
}
Point.prototype.unitvector = function (){
	// Get unit vector from Point interpreted as origin-to-point vector
	var m = Math.sqrt((this.x || 0.0)**2 
					+ (this.y || 0.0)**2 
					+ (this.z || 0.0)**2); // norm or magnitude
	return new Point(this.x/m,this.y/m,this.z/m);
}

Point.prototype.vectorgrow = function (dist, midp){
	// Move dist away from Point in the direction away from origin
	var midp = midp || new Point(0,0,0);
	var x = this.x - midp.x;
	var y = this.y - midp.y;
	var z = this.z - midp.z;
	var m = Math.sqrt(x**2 + y**2 + z**2); // norm or magnitude
	return this.move(dist*x/m,
					 dist*y/m,
					 dist*z/m);
}

Point.prototype.zy = function (){ // Reorder dimensions
	return new Point(this.z || 0.0, this.y || 0.0);
}
Point.prototype.yz = function (){ // Reorder dimensions
	return new Point(this.y || 0.0, this.z || 0.0);
}
Point.prototype.xz = function (){ // Reorder dimensions
	return new Point(this.x || 0.0, this.z || 0.0);
}
Point.prototype.zx = function (){ // Reorder dimensions
	return new Point(this.z || 0.0, this.x || 0.0);
}
Point.prototype.xzy = function (){ // Reorder dimensions
	return new Point(this.x || 0.0, this.z || 0.0, this.y || 0.0);
}

Point.prototype.setx = function (v){ // Change one coordinate, return new Point
	return new Point(v, this.y, this.z);
}
Point.prototype.sety = function (v){
	return new Point(this.x, v, this.z);
}
Point.prototype.setz = function (v){
	return new Point(this.x, this.y, v);
}
// These objects only have enough data for drawing paths if the starting point is known
Point.prototype.bezier = function (cp1,cp2){
	// Convert this point into a bezier object
	var np = new Point(this.x, this.y);
	np.isbezier = true;
	np.x1 = cp1.x;
	np.y1 = cp1.y;
	np.x2 = cp2.x;
	np.y2 = cp2.y;
	
	// return this;
	
	
	return np;
}
// TODO: return new point instead of changing this
Point.prototype.relbezier = function (x1,y1,x2,y2){
	// Convert this point into a bezier object using coordinates relative to the end node
	this.isbezier = true;
	this.x1 = this.x + (x1 || 0);
	this.y1 = this.y + (y1 || 0);
	this.x2 = this.x + (x2 || 0);
	this.y2 = this.y + (y2 || 0);
	
	return this;
}
Point.prototype.smartbezier = function (x1,y1,x2,y2){
	// TODO: No access to previous segment....
	// Convert this point into a bezier object 
	// First coordinate is relative to start point, second relative to the end node
	this.isbezier = true;
	this.x1 = this.x + (x1 || 0);
	this.y1 = this.y + (y1 || 0);
	this.x2 = this.x + (x2 || 0);
	this.y2 = this.y + (y2 || 0);
	
	return this;
}
Point.prototype.arcthru = function (p1,p2,p3, f){ 
	// Draw arc that goes through all three points, return Point.arc for drawing an svg arc path segment. p1 should be the previous segment's end. p3 is this segment's end, and p2 is a point on the arc between p3 and p1.
	var chord1 = linelength(p1,p2);
	var chord2 = linelength(p2,p3);
	var angle1 = Math.atan2((p2.x-p1.x),(p2.y-p1.y));
	var angle2 = Math.atan2((p3.x-p2.x),(p3.y-p2.y));
	var p11 = p1.movedist(chord1/2,angle1);
	var p12 = p11.movedist(1000000,angle1+Math.PI/2);
	var p11 = p12.movedist(2000000,angle1-Math.PI/2);
	var p21 = p2.movedist(chord2/2,angle2);
	var p22 = p21.movedist(1000000,angle2+Math.PI/2);
	var p21 = p22.movedist(2000000,angle2-Math.PI/2);
	var cp = intersectline(p11,p12,p21,p22);
	// console.log("center",cp);
	var r = linelength(p1,cp);
	// var f = getelid("formlayer");
	var st = OCTSTYLE;
	var st2 = SEVENTHSTYLE;
	
	if (!cp) {
		// drawline(f,[p1,p2],st);
		// drawline(f,[p2,p3],st);
		// drawline(f,[p12,p11],st2);
		// drawline(f,[p22,p21],st2);
		
		return p3;
	}
	
	
	
	// console.log(cp);
	return p3.arc(r,r,0,0,1);
}
Point.prototype.arc = function (rx, ry, xrot, largearc, sweep){
	// Convert this point into an arc for drawing svg paths. this.x,y are the endpoint
	// xrot, largearc, sweep should be 0 or 1
	this.isarc = true;
	this.rx = rx; // radius on x-axis
	this.ry = ry;
	this.xrot = xrot; // direction of x-axis
	this.largearc = largearc;
	this.sweep = sweep;
	
	return this;
}
Point.prototype.flipsign = function (axis) {
	if (axis=="x"){
		if (this.z === undefined){
			return new Point(-this.x, this.y);
		} else {
			return new Point(-this.x, this.y, this.z);
		}
	} else if (axis=="y"){
		if (this.z === undefined){
			return new Point(this.x, -this.y);
		} else {
			return new Point(this.x, -this.y, this.z);
		}
	} else if (axis=="z"){
		return new Point(this.x, this.y, -this.z || 0.0);
	} 
}

function Arc (center,radius,a1,a2){
	// Create Arc object. Default is the above X axis part of the unit circle centered at origin.
	// The filled part of the arc is understood to be clockwise from a1 to a2
	this.center = center || new Point(0,0);
	this.radius = this.radius || 1;
	this.a1 = a1 || Math.PI/2*3;
	this.a2 = a2 || Math.PI/2;
}
arctobezier = function (p1,p2,radius_or_center, clockwise, largearc,segments){
	if (largearc) console.log("arctobezier: largearc is not implemented yet but it shouldn't be too hard to do.",p1,p2,radius_or_center, clockwise, largearc,segments);
	var segments = segments || 1 ; // returns an array of bezier segments if larger than 1
	// TODO: method for using center point sometimes fails
	// Always returns an array of bezier objects
	// Perfect circle quadrant as a bezier command, radius 100:
	// m 0,0 c 0,-55.228474		44.77152,-100	100,-100
	// tangent to circle
	// each control point is located at almost 1/3 the angle of the arc segment
	// 1/8 of a circle as bezier, radius 100
	// m 0,0 c 0,-27.558474 	11.147721,-52.513259 	29.179775,-70.600964
	// Math.atan(55.228747 / 100)
	// 0.5045977293756361
	var radius, center;
	if (typeof radius_or_center == "number"){
		// We got a radius, so find center
		// TODO: Currently this assumes smaller possible circle
		radius = radius_or_center;
		// Location of center depends on clockwise
		var a = normangle(p1,p2);
		var ll = 0.5*linelength(p1,p2);
		var mp = p1.moveangle(ll, a); // Point between p1 & p2
		// drawcircle(getelid("frontview"), mp, 2, REDSTYLE);
		// drawshape(getelid("frontview"),[p1,p2],REDSTYLE);
		var b = Math.sqrt(radius**2-ll**2);
		if (clockwise) {
			center = mp.moveangle(b, a+Math.PI*0.5);
		} else {
			center = mp.moveangle(b, a-Math.PI*0.5);
		}
		// drawcircle(getelid("frontview"), center, 1, REDSTYLE);
	} else { // We got a center Point so calculate the radius
		center = radius_or_center;
		radius = linelength(center,p1);
		var radius2 = linelength(center,p2);
		
		if (radius2.toFixed(4) != radius.toFixed(4)) {
			console.log("arctobezier: radiuses do not match. Using average. ",radius,radius2);
			radius = radius+radius2/2.0;
		}
	}
	// var clockwise = clockwise || true;
	// console.log(clockwise);
	var cplength = 0.55228474; // cplength*radius if 90deg circle segment
	var cpangle = 0.3212368916123159; // percentage of angle of circle segment
	var beziers = [];
	
	 
	// if angle between points is larger than 90deg, break into segments
	// Find new points along the circumference every 90deg
	var a1 = normangle(center,p1); // Normalize angles to positive numbers
	var a2 = normangle(center,p2);
	
	// console.log("angles at first",a1,a2);
	if (clockwise && (a1 > a2)) { 
		// a2 must be larger than a1, so if it isn't, make it so
		a2 += Math.PI*2;
	} //else if (!clockwise && a1 < a2){
		// a1 += Math.PI*2;
	// }
	var angledelta = a2-a1; // Size of arc in radians
	var maxsegangle = angledelta/segments;
	// console.log(!clockwise);
	if (!clockwise) {angledelta = 2*Math.PI - angledelta;}
	// TODO: if clockwise and angledelta = a2-a1 ==> largesweep
	
	// console.log("angles",a1,a2, "angledelta",angledelta);
	var outp = [];
	
	function makesegment(startp,endp,ang){
		
		var ca1 = normangle(center,startp);
		var ca2 = normangle(center,endp);
		var cple = radius*Math.tan(cpangle*ang);
		// if (clockwise) {
			var cp1 = startp.moveangle(cple, ca1+0.5*Math.PI*dir);
			var cp2 = endp.moveangle(cple, ca2-0.5*Math.PI*dir);
		// } else {
			// var cp1 = startp.moveangle(cple, ca1-0.5*Math.PI);
			// var cp2 = endp.moveangle(cple, ca2+0.5*Math.PI);
		// }
		
		// drawcircle(getelid("drawing"), startp, 1, PURPLESTYLE);
		// drawcircle(getelid("drawing"), cp1, 10, GREENSTYLE);
		// drawshape(getelid("drawing"),[startp,cp1],GREENSTYLE);
		// drawcircle(getelid("drawing"), cp2, 10, BLUESTYLE);
		// drawshape(getelid("drawing"),[endp,cp2],BLUESTYLE);
		outp.push(endp.bezier(cp1,cp2));
		// console.log("makesegment",ang,ca1,ca2,cple,cp1,cp2);
		
	}
	// Split arc into max 90deg segments
	var dir = 1;
	// if (!clockwise ) dir = -1; // && largearc ???
	var incr_a = 0.5*Math.PI;
	if (incr_a > maxsegangle) incr_a = maxsegangle;
	var cur_a = incr_a;
	var curp = p1;
	var endp;
	var seg = 0;
	while (cur_a < angledelta && seg < segments ){
		// Calculate a point along the circle
		// console.log("in while",cur_a, angledelta);
		var endp = center.moveangle(radius, a1+cur_a*dir);
		makesegment(curp,endp,incr_a);
		cur_a += incr_a;
		curp = endp;
		seg++;
	}
	// Make the last segment from curp to p2. This might also be the only one that gets made, if the specified arc was less than 90deg
	if (clockwise ) {
		// TODO: Dropping this looses last segment sometimes, but perhaps makes an unnecessary one sometimes?
		makesegment(curp, p2,angledelta-cur_a+incr_a);
	} else {
		// makesegment(curp, p2,angledelta+cur_a-incr_a);
	}
	
	// console.log("final angles",angledelta,cur_a,incr_a);
	// console.log("outp",outp);
	return outp;
}
function arclinedev(p1,p2,deviation, clockwise, segments){
	// Draw arc (consisting of bezier segments) between points defined by deviation from a straight line.
	// Returns an array of Bezier objects
	var radius = deviation + (linelength(p1, p2)**2 - 4*deviation**2)/(8*deviation);
	return arctobezier(p1,p2,radius, clockwise, false, segments);
}

function normangle(p1,p2){
	// Normalized angle function where north is 0 and + is clockwise
	var x = Math.abs(p2.x - p1.x);
	var y = Math.abs(p2.y - p1.y);
	
	if (p2.y <= p1.y && p2.x >= p1.x){ // up right
		// console.log("up right");
		return Math.atan(x/y);
	} else if (p2.y >= p1.y && p2.x >= p1.x){ // down right
		// console.log("down right");
		return 0.5*Math.PI+Math.atan(y/x);
	} else if (p2.y >= p1.y && p2.x <= p1.x){ // down left
		// console.log("down left");
		return Math.PI+Math.atan(x/y);
	} else { // up left
		// console.log("up left");
		return 1.5*Math.PI+Math.atan(y/x);
	}
	
}
function getangle(p1,p2){ // rather use trueangle
	// return Math.atan2(p1,p2);
	return Math.atan((p1.x-p2.x)/(p1.y-p2.y));
}
// TODO: Replace all instances of getangle with trueangle
function trueangle(p1,p2){
	// This replaces getangle, except does all angles correctly.
	// Due to convention, starts from zero at North and goes positive counter-clockwise
	return -Math.PI/2-Math.atan2((p2.y-p1.y),(p2.x-p1.x));
}
function linelength(p1,p2){
	if (p1 === undefined || p2 === undefined) return undefined;
	if (p1.z !== undefined && isNaN(p1.z)) p1.z = 0.0;
	if (p2.z !== undefined && isNaN(p2.z)) p2.z = 0.0;
	if (p1.z === undefined && p2.z === undefined){
		// console.log("linelength no z",p1,p2);
		return Math.sqrt((p2.x-p1.x)**2 + (p2.y-p1.y)**2);
	} else if (p1.z === undefined && !(p2.z === undefined)){
		return Math.sqrt((p2.x-p1.x)**2 + (p2.y-p1.y)**2 + (p2.z)**2);
	} else if (p2.z === undefined && !(p1.z === undefined)){
		return Math.sqrt((p2.x-p1.x)**2 + (p2.y-p1.y)**2 + (0-p1.z)**2);
	} else {
		// console.log("linelength has z",p1,p2);
		return Math.sqrt((p2.x-p1.x)**2 + (p2.y-p1.y)**2 + (p2.z-p1.z)**2);
	}
}

function flatlinelength(p1,p2){// Ignore z coordinates
	
	return Math.sqrt((p2.x-p1.x)**2 + (p2.y-p1.y)**2);
}
function midpoint(p1,p2){
	// TODO: Z axis
	return new Point((p1.x+p2.x)/2, (p1.y+p2.y)/2);
}
function line_x_from_y(p1,p2, y){
	var m = (p2.y-p1.y)/(p2.x-p1.x);
	return new Point(p1.x+ (y-p1.y)/m, y);
}
function line_y_from_x(p1,p2, x){
	var m = (p2.y-p1.y)/(p2.x-p1.x);
	return new Point(x, m*(x-p1.x)+p1.y);
}
function line_from_z(p1,p2, z){ // 3D line intersection with z plane
	var m1 = (p2.z-p1.z)/(p2.y-p1.y);
	var m2 = (p2.z-p1.z)/(p2.x-p1.x);
	return new Point(p1.x+ (z-p1.z)/m2, p1.y+ (z-p1.z)/m1, z);
}
function circle_tangent(p,c){ // find point on line tangent to circle given point on line
	// from math import sqrt
	// # Data Section, change as you need #
	// Cx, Cy = -2, -7                    #
	// r = 5                              #
	// Px, Py =  4, -3                    #
	// # ################################ #
	// dx, dy = Px-Cx, Py-Cy
	var dx = p.x-c.x;
	var dy = p.y-c.y
	// dxr, dyr = -dy, dx
	var dxr = -dy;
	var dyr = dx;
	// d = sqrt(dx**2+dy**2)
	var d = Math.sqrt(dx**2 + dy**2);
	// if d >= r :
	if (d >= c.r){
		// rho = r/d
		var rho = c.r/d;
		// ad = rho**2
		var ad = rho**2;
		// bd = rho*sqrt(1-rho**2)
		var bd = rho*Math.sqrt(1-rho**2)
		// T1x = Cx + ad*dx + bd*dxr
		var T1x = c.x + ad*dx + bd*dxr;
		// T1y = Cy + ad*dy + bd*dyr
		var T1y = c.y + ad*dy + bd*dyr;
		// T2x = Cx + ad*dx - bd*dxr
		var T2x = c.x + ad*dx - bd*dxr;
		// T2y = Cy + ad*dy - bd*dyr
		var T2y = c.y + ad*dy - bd*dyr;
		// console.log("tangent",T1x, T1y ,T2x, T2y);
		return [new Point(T1x, T1y), new Point(T2x, T2y)];

		// print('The tangent points:')
		// print('\tT1≡(%g,%g),  T2≡(%g,%g).'%(T1x, T1y, T2x, T2y))
		// if (d/r-1) < 1E-8:
			// print('P is on the circumference')
		// else:
			// print('The equations of the lines P-T1 and P-T2:')
			// print('\t%+g·y%+g·x%+g = 0'%(T1x-Px, Py-T1y, T1y*Px-T1x*Py))
			// print('\t%+g·y%+g·x%+g = 0'%(T2x-Px, Py-T2y, T2y*Px-T2x*Py))
	// else:
	} else {
		
		return false;
		// print('''\
	// Point P≡(%g,%g) is inside the circle with centre C≡(%g,%g) and radius r=%g.
	// No tangent is possible...''' % (Px, Py, Cx, Cy, r))
	}
}
function circle_circle_tangent(c1, c2) {
    var tangents = [];
    
    // Calculate the distance between the centers of the two circles
    var d = Math.sqrt(Math.pow(c2.x - c1.x, 2) + Math.pow(c2.y - c1.y, 2));
     
    // Check if one circle is inside the other; d+r2 < r1 || d+r1 < r2
    if (d < Math.max(c1.r, c2.r)) {
        // Circles are either disjoint or one is contained within the other, no common tangents
        console.log("Circles inside each other",d);
		return false;
    }
    
    // Compute the angle between the centers of the circles
    var angle = Math.atan2(c2.y - c1.y, c2.x - c1.x);
    
    // Compute the angles of the tangents from the center of each circle
    var alpha1 = Math.acos((c1.r - c2.r) / d);
    // var alpha2 = Math.acos((c1.r + c2.r) / d);
    
    // Calculate the points where the tangents intersect with each circle
    var p1 = new Point(c1.x + c1.r * Math.cos(angle + alpha1),
					   c1.y + c1.r * Math.sin(angle + alpha1));
    var p2 = new Point(c1.x + c1.r * Math.cos(angle - alpha1),
					   c1.y + c1.r * Math.sin(angle - alpha1));
    var p3 = new Point(c2.x + c2.r * Math.cos(angle + alpha1),
					   c2.y + c2.r * Math.sin(angle + alpha1));
    var p4 = new Point(c2.x + c2.r * Math.cos(angle - alpha1),
					   c2.y + c2.r * Math.sin(angle - alpha1));
    
    // Add the intersection points to the array of tangents
    tangents.push( p2, p4, p1, p3);
    // tangents.push([  ]);
    
    return tangents;
}

Point.findmax = function(array,coord,minmax){ 
	// find coordinate in an array of points, return index
	// TODO: Why is this Point.findmax()?
	var max = 0,
		mini = 1000000000,
		a = array.length,
		counter,
		maxcounter= 0,
		minmax = minmax || "max",
		coord = coord || "x";
	
	for (counter=0;counter<a;counter++){
		if (minmax=="max"){
			if (array[counter][coord] > max){
			  max = array[counter][coord];
			  maxcounter = counter;
			}
		} else {
			if (array[counter][coord] < mini){
			  mini = array[counter][coord];
			  maxcounter = counter;
			}
		}
		
	}
	return maxcounter;
}
/////////////////////////////////////////////////////////////
// TODO: Remove neckbeardlib functions here and use .js in root folder
function getelid(id){
	if (id){
		return document.getElementById(id);
	} else {
		return false;
	}
}
function delelid(elid){
	var d = document.getElementById(elid);
	delel(d);
}
function delel(el){
	// console.log(el);
	if (el){el.parentNode.removeChild(el);}
}
function addel(to,newel){
	to.appendChild(newel);
	return newel;
}
function addelafter(to,newel){
	to.parentNode.insertBefore(newel, to.nextSibling);
	return newel;
}
function addelbefore(to,newel){
	to.parentNode.insertBefore(newel, to);
	return newel;
}
function makefirst(el) {
	el.parentNode.insertBefore(el, el.parentNode.firstElementChild);
	return el;
}
function addelfirst(to,newel) {
	to.insertBefore(newel, to.firstElementChild);
	return newel;
}
function delchildren(el){
	while (el.children.length>0){
		el.removeChild(el.children[0]);
	}
}
function creel(tagname, id, cla, attrs, NS, del){
	var exists = getelid(id);
	if (exists){
		var n = exists;
		if (del){
			delchildren(n);
		}
	} else {
		if (NS){
			var n = document.createElementNS(NS, tagname);
		} else {
			var n = document.createElement(tagname);
		}
		if (id){ n.id = id;}
	}
	if (cla) {n.className=cla;}
	if (attrs){
		for (var i=0; i<attrs.length; i=i+2){
			// console.log(tagname,id,cla,attrs[i],attrs[i+1]);
			// if (attrs[i] == "cx"){
				// console.log(id, attrs[i+1]);
			// }
			n.setAttribute(attrs[i],attrs[i+1]);
		}
	}
	return n;
}
function creel_empty(tagname, id, cla, attrs, NS){
	// Create element, or use existing one if it exists already, but delete its contents
	if (NS){
		var n = document.createElementNS(NS, tagname);
	} else {
		var n = document.createElement(tagname);
	}
	return creel(tagname, id, cla, attrs, NS, true);
}

function create_select_options(el, obj,selected){ // Fill html select tag with options from object
	
	delchildren(el);
	var newoption = creel("option", "", "", ["value", "select"]);
	newoption.innerHTML = "Select...";
	addel(el, newoption);
	
	var names = Object.getOwnPropertyNames(obj);
	for (var i=0; i<names.length; i++){
		var newoption = creel("option", "", "", ["value", names[i]]);
		newoption.innerHTML = names[i];
		addel(el, newoption);
		if (names[i] == selected) newoption.selected=true;
	}
}

//////////////////////////////////////////////////////////////////////////////
// SVG element insertion
function insert_drawing(fromsvg, id, togroup, topoint, rotate, rotpoint){
	// Insert an svg group from technical drawing presets into the drawing
	var fromsvg = fromsvg || getelid("svg-general").getSVGDocument();
	
	if (fromsvg.getElementById(id) === null){
		console.log("did not find " + id);
		return;
	}
	var item = fromsvg.getElementById(id).cloneNode(true);
	
	var t = "translate("+topoint.x+" "+topoint.y+")";
	if (rotate) {
		// var rotpoint = rotpoint || new Point(0,0)
		t += " rotate("+rotate+")";
	}
	item.setAttribute("transform", t);
	
	addel(togroup, item);
	return item;
}

function drawpeg(gr, stempos, shank, angle,style){
	// shank is [Point, Point] representing visible part of shank inside pegbox, or null
	// Peg sticks out 37mm usually
	try {
	if (editorstate.pegboxstyle != "renaissance"){
		var p = insert_drawing(null, "peg-baroque", gr, stempos, angle/radtodeg, new Point(0,0));
	} else {
		var p = insert_drawing(null, "peg-renaissance", gr, stempos, angle/radtodeg, new Point(0,0));
	}
	p.setAttribute("style", style || PEGSTYLE);
	if (shank  !== null){
	var startw = (7.11 - linelength(stempos, shank[0])/30) * 0.5;
	var endw = (7.11 - linelength(stempos, shank[1])/30) * 0.5;

	drawline(gr, [shank[0].move(startw*Math.cos(angle),startw*Math.sin(angle)), 
			      shank[1].move(endw*Math.cos(angle),endw*Math.sin(angle))], PEGSTYLE);
	drawline(gr, [shank[0].move(-startw*Math.cos(angle),-startw*Math.sin(angle)), 
			      shank[1].move(-endw*Math.cos(angle),-endw*Math.sin(angle))], PEGSTYLE);
	}
	} catch (e){
		console.log("peg insertion failed",e);
	}
}


//////////////////////////////////////////////////////////////////////////////
// Functions for paths
//////////////////////////////////////////////////////////////////////////////

function xz(ar){ // convert array of points xz --> xy
	var out = [];
	for (var i=0; i < ar.length; i++){
		if (ar[i] !== undefined) out.push(ar[i].xz());
	}
	return out;
}
function zy(ar){ // convert array of points xz --> xy
	var out = [];
	for (var i=0; i < ar.length; i++){
		if (ar[i] !== undefined) {
			out.push(ar[i].zy());
		}
	}
	return out;
}

function drawline (c,points, style,id){
	// Method for svg paths
	try {
	var d = "M"+points[0].x.toFixed(DIGITS)+","+points[0].y.toFixed(DIGITS)+" L"+points[1].x.toFixed(DIGITS)+","+points[1].y.toFixed(DIGITS);
	var p = creel("path", id, "", ["d",d], NAMESPACE);
	if (style){
		p.setAttribute("style",style);
	} else {
		p.setAttribute("style",THINSTYLE);
	}
	addel(c, p);
	return p;
	}catch(e){console.log("Error drawing line",e);}
}
function drawarc (c, p1, p2, rx,ry, xrot, largearc, sweep, style, id){
	try{
	var ry = ry || rx;
	var xrot = xrot || 0;
	var largearc = largearc || 0;
	var sweep = sweep || 0;
	
	// Method for drawing a single arc segment path
	var d = "M"+p1.x.toFixed(DIGITS)+","+p1.y.toFixed(DIGITS)+" A"+rx.toFixed(DIGITS)+","+ry.toFixed(DIGITS)+ " " + xrot + " " + largearc + "," + sweep + " " + +p2.x.toFixed(DIGITS)+","+p2.y.toFixed(DIGITS);
	var p = creel("path", id, "", ["d",d], NAMESPACE);
	if (style){
		p.setAttribute("style",style);
	} else {
		p.setAttribute("style",NOFILLTHIN);
	}
	addel(c, p);
	return p;
	}catch(e){console.log("Error drawing arc",e);}
}
function drawshape(c, points,style,id, z){
	try{
	if (z === undefined) z = true;
	// Draw path composed of many straight line segments, z= close path
	// Or beziers with two control points
	// If one or more null values are encountered in points, they are interpreted as a move command to the next non-null point.
	// if (!points || !points[0]) {console.log("drawshape: points[0] is empty");return;}
	// Find first non-null point to use as first move command
	var d = "";
	for (var istart = 0; istart< points.length; istart++){
		if (points[istart]){
			d = "M"+points[istart].x.toFixed(DIGITS)+","+points[istart].y.toFixed(DIGITS);
			break;
		}
	}
	for (var i = istart+1; i< points.length; i++){
		var doM = false;
		if (!points[i]) {
			// console.log("drawshape: points["+i+"] is empty, skipping");
			doM = true;
			while(!points[i] && i< points.length){
				i++;
			}
			
		}
		if (points[i] && points[i].isbezier){ // Bezier if 
			d += " C"+points[i].x1.toFixed(DIGITS)+","+points[i].y1.toFixed(DIGITS) +" "
					 +points[i].x2.toFixed(DIGITS)+","+points[i].y2.toFixed(DIGITS) +" "
					 +points[i].x.toFixed(DIGITS) +","+points[i].y.toFixed(DIGITS)  +" ";
		} else if (points[i] && points[i].isarc){
			d += " A"+points[i].rx.toFixed(DIGITS)+","
					+points[i].ry.toFixed(DIGITS)+ " " 
					+ points[i].xrot + " " + points[i].largearc 
					+ "," + points[i].sweep + " " 
					+points[i].x.toFixed(DIGITS)+","
					+points[i].y.toFixed(DIGITS);
		} else if (points[i]) {
			if (doM) {
				d += " M"+points[i].x.toFixed(DIGITS)+","+points[i].y.toFixed(DIGITS);
			} else {
				d += " L"+points[i].x.toFixed(DIGITS)+","+points[i].y.toFixed(DIGITS);
			}
			
		}
		
	}
	if (z) d += "z";
	
	var p = creel("path", id, "", ["d",d], NAMESPACE);
	if (style){
		p.setAttribute("style",style);
	} else {
		p.setAttribute("style",THINSTYLE);
	}
	addel(c, p);
	return p;
	}catch(e){console.log("Error drawing shape",e);}
}
function mirrorshape(c, rpoints,style,id, z){ // mirrors and joins path around y
	var lpoints = [];
	for (var i=0; i<rpoints.length; i++){
		var p = rpoints[i];
		// TODO: Handle beziers by moving bezier data to next point
		
		// Check if next point is an arc, copy arc data to current point
		// TODO: Do same for beziers
		if (rpoints[i+1] && rpoints[i+1].isarc){
			// console.log("Mirroring arc", rpoints[i+1]);
			lpoints.push(new Point(-p.x, p.y).arc(rpoints[i+1].rx, rpoints[i+1].ry, rpoints[i+1].xrot, rpoints[i+1].largearc, rpoints[i+1].sweep));
			// console.log("Mirroring arc", getlast(lpoints));
		} else {
			lpoints.push(new Point(-p.x, p.y));
		}

	}
	lpoints.reverse();
	rpoints = lpoints.concat(rpoints);
	return drawshape(c, rpoints,style,id, z);
}
function drawshaperel(c, points,style,id, z){
	try{
	if (z === undefined) z = true;
	// Draw path composed of many straight line segments, z= close path
	// Or beziers with two control points
	// Relative mode, so each 
	var running = new Point(points[0].x,points[0].y);
	// TODO: this function
	var d = "M"+points[0].x.toFixed(DIGITS)+","+points[0].y.toFixed(DIGITS);
	for (var i = 1; i< points.length; i++){
		
		if (points[i].isbezier){ // Bezier if 
			d += " c"+points[i].x1.toFixed(DIGITS)+","+points[i].y1.toFixed(DIGITS) +" "
					 +points[i].x2.toFixed(DIGITS)+","+points[i].y2.toFixed(DIGITS) +" "
					 +points[i].x.toFixed(DIGITS) +","+points[i].y.toFixed(DIGITS)  +" ";
		} else if (points[i].isarc){
			d += " a"+points[i].rx.toFixed(DIGITS)+","
					+points[i].ry.toFixed(DIGITS)+ " " 
					+ points[i].xrot + " " + points[i].largearc 
					+ "," + points[i].sweep + " " 
					+points[i].x.toFixed(DIGITS)+","
					+points[i].y.toFixed(DIGITS);
		} else {
			d += " l"+points[i].x.toFixed(DIGITS)+","+points[i].y.toFixed(DIGITS);
		}
		
	}
	if (z) d += "z";
	
	var p = creel("path", id, "", ["d",d], NAMESPACE);
	if (style){
		p.setAttribute("style",style);
	} else {
		p.setAttribute("style",THINSTYLE);
	}
	addel(c, p);
	return p;
	}catch(e){console.log("Error drawing relative shape",e);}
}
function drawtext(c, point, inner, style,id){
	try{
	var t = creel("text",id,"",["x",point.x.toFixed(DIGITS),"y",point.y.toFixed(DIGITS)], NAMESPACE);
	if (style){
		t.setAttribute("style",style);
	} else {
		t.setAttribute("style",TEXTSTYLE);
	}
	t.innerHTML = inner;
	addel(c, t);
	return t;
	}catch(e){console.log("Error drawing text",e);}
}
function drawrect(c, point, size, style,id){
	try{
	var t = creel("rect",id,"",
		["x",point.x.toFixed(DIGITS),
		"y",point.y.toFixed(DIGITS),
		"width",size.w.toFixed(DIGITS),
		"height",size.h.toFixed(DIGITS)], NAMESPACE);
	if (style){
		t.setAttribute("style",style);
	} else {
		t.setAttribute("style",BOXSTYLE);
	}
	var c = c || getelid("debuglayer");
	addel(c, t);
	return t;
	}catch(e){console.log("Error drawing rectangle",e);}
}
function drawcircle(c, point, radius, style,id){
	try{
	var t = creel("circle",id,"",
		["cx",point.x.toFixed(DIGITS),
		"cy",point.y.toFixed(DIGITS),
		"r",(point.iscircle ? point.r.toFixed(DIGITS) : radius.toFixed(DIGITS))], NAMESPACE);
	if (style){
		t.setAttribute("style",style);
	} else {
		t.setAttribute("style",BOXSTYLE);
	}
	
	var c = c || getelid("debuglayer");
	addel(c, t);
	return t;
	}catch(e){console.log("Error drawing circle",e);}
}
function drawtriangle(c, point, edgew, dir, style,id){
	try{
	var d = "M "+(point.x)+" "+(point.y);
	var p1 = point.movedist(edgew, dir-halfpi*0.5);
	var p2 = point.movedist(edgew, dir+halfpi*0.5);
	d+= "L "+(p1.x)+" "+(p1.y);
	d+= "L "+(p2.x)+" "+(p2.y);
	d+= "Z";

	var t = creel("path", id, "", ["d",d], NAMESPACE);
	if (style){
		t.setAttribute("style",style);
	} else {
		t.setAttribute("style",BOXSTYLE);
	}
	
	var c = c || getelid("debuglayer");
	addel(c, t);
	return t;
	}catch(e){console.log("Error drawing triangle",e);}
}
function drawX(c, point, radius, style,id){
	try{
	var d = "M "+(point.x-radius)+" "+(point.y-radius);
	d+= "L "+(point.x+radius)+" "+(point.y+radius);
	d+= "M "+(point.x+radius)+" "+(point.y-radius);
	d+= "L "+(point.x-radius)+" "+(point.y+radius);
	
	var t = creel("path", id, "", ["d",d], NAMESPACE);
	if (style){
		t.setAttribute("style",style);
	} else {
		t.setAttribute("style",BOXSTYLE);
	}
	
	var c = c || getelid("debuglayer");
	addel(c, t);
	return t;
	}catch(e){console.log("Error drawing X",e);}
}
function drawellipse(c, point, rx, ry, style,id){
	try{
	var t = creel("ellipse",id,"",
		["cx",point.x.toFixed(DIGITS),
		"cy",point.y.toFixed(DIGITS),
		"rx",rx.toFixed(DIGITS),
		"ry",ry.toFixed(DIGITS)], NAMESPACE);
	if (style){
		t.setAttribute("style",style);
	} else {
		t.setAttribute("style",BOXSTYLE);
	}
	
	var c = c || getelid("debuglayer");
	addel(c, t);
	return t;
	}catch(e){console.log("Error drawing ellipse",e);}
}
function makegroup(c, groupname, translatep){
	var p = creel("g", groupname, "", [], NAMESPACE, true);
	if (translatep && translatep.hasOwnProperty("x") && translatep.hasOwnProperty("y")) { // Is a Point object or similar
		p.setAttribute("transform","translate("+translatep.x+","+translatep.y+")");
	} else if (translatep){ // Is name of inkscapelayer data
		p.setAttribute("inkscape:label",translatep);
		p.setAttribute("inkscape:groupmode","layer");
	} 
	addel(c, p);
	return p;
}
function rotate(el, a){ // setAttribute(transform,rotate(a))
	var orig = "";
	if (el.getAttribute("transform") !== null) orig = el.getAttribute("transform");
	el.setAttribute("transform", orig+" rotate("+a+")");
	return el;
}
function translate(el, p){ // usually, translate first, then rotate
	var orig = "";
	if (el.getAttribute("transform") !== null) orig = el.getAttribute("transform");
	el.setAttribute("transform", orig+" translate("+(p.x)+" "+p.y+")");
	return el;
}
function parse_transform(hg){ // Only does translate
	if (hg){
		var tr = hg.getAttribute("transform");
		console.log("transform",tr);
		tr = tr.substr(tr.lastIndexOf("translate")).match(/\-*\d+\.*\d*/g); // returns array of any digit followed optionally by . and optional digits, after last "translate"
		// "translate(944.09375 244.96612592592578)"
		if (tr[0] && tr[1]){
			return new Point(parseFloat(tr[0]),parseFloat(tr[1]));
		}
	}
	return new Point(0,0);
}
function makeimage(to, id, source, pos,size, preserveAspectRatio){
	// Make image tag
	if (preserveAspectRatio === true) {preserveAspectRatio = "xMinYMin";}
	
	var p = creel("image", id, "", ["href",source,"x",pos.x.toFixed(DIGITS),"y",pos.y.toFixed(DIGITS),"width",size.w.toFixed(DIGITS),"height",size.h.toFixed(DIGITS), "preserveAspectRatio",preserveAspectRatio], NAMESPACE);
	addel(to, p);
	return p;
}
function drawhandles(g, points){ // Put inkscape like handles on path (not editable)
	// points should be an array of arrays where ar[0] is the path point and ar[1] is the control point
	for (var line of points){
		drawline(g, line, BLUESTYLE);
		drawcircle(g, line[1], 2, REDSTYLE);
	}
}

function movetext(t){ // Move text left by its width
	var w = t.getBBox().width;
	var x = parseFloat(t.getAttribute("x"));
	// console.log("movetext",w,x, x-w);
	t.setAttribute("x", x-w);
}

function marklength (group, fro, to, side){
	// Do squigly curvy length marker on the drawing
	var g = makegroup(group,"");
	var mlength = flatlinelength(fro,to);
	var mangle = trueangle(fro,to) + (side ? -1 : 1)*Math.PI/2; // default to the right
	// console.log("Length to be marked:", mlength,mangle);
	var midp = midpoint(fro,to);
	var frocp = fro.movedist(10,mangle);
	var tocp = to.movedist(10,mangle);
	var midcp = midp.movedist(10,mangle);
	
	drawtext(g, midcp.move(0,2), mlength.toFixed(0)+"mm", SMALLTEXT);
	
	var path = [
		fro,
		midcp.bezier(frocp, midp),
		to.bezier(midp,tocp)
	];
	drawshape(g, path, MARKLENGTH,"", false)
	
}
///////////////////////////////////////////////////////////////////////////////
// SVG Path and object operations
///////////////////////////////////////////////////////////////////////////////
var pathsegtypes = {
	"M":["x","y"],
	"m":["x","y"],
	"L":["x","y"],
	"l":["x","y"],
	"H":["x"],
	"h":["x"],
	"V":["y"],
	"v":["y"],
	"Z":[],
	"z":[],
	"C":["x1","y1","x2","y2","x","y"],
	"c":["x1","y1","x2","y2","x","y"],
	"A":["r1","r2","angle","largeArcFlag","sweepFlag","x","y"],
	"a":["r1","r2","angle","largeArcFlag","sweepFlag","x","y"]

};
function getseglist (path){ // Use this to get SVG path segments
	return interpretpath(extractpath(path.getAttribute("d")));
}
function saveseglist(path, seglist){
	path.setAttribute("d", makedtext(seglist));
	return path;
}
function extractpath(d){
	// returns path as an array of command letters with their coords
	// Usage: var seglist = interpretpath(extractpath(path.getAttribute("d")));
	// Or just use getseglist();
	// Save: newpath.setAttribute("d",makedtext(seglist));
	// TODO: Legally omitted segment type letters cause many segments to be lumped together; De-lumpify here.
	// TODO: This probably breaks circle arc segments; Add capability
	// d = d.replace(/\s+/g, " "); // Normalize whitespace
	// console.log("extract",d);
	var ltrs = "MmCcLlHhVvZzSsQqTtAa";
	var p = pathsegtypes;
	
	var nmbrs = "0123456789-.";
	var output = [];
	var numbers= [];
	
	for (var i=0; i < d.length; i++){
	// while (i < d.length) {
		if (ltrs.indexOf(d[i]) >= 0 ){
			// Letter begins a new segment
			var seg = {"letter": d[i] , "numbers": [] };
			output.push(seg);
			
		} else if (nmbrs.indexOf(d[i]) >= 0 ){
			// if character is a number-., seek end of number and store
			var number = "";
			while (i < d.length && nmbrs.indexOf(d[i]) >= 0 ){
				number += d[i];
				i++;
			}
			seg.numbers.push(parseFloat(number));
		}
	}
	// De-lumpify segments; In case letters were omitted in the original path
	var delumped = [];
	for (var i=0; i < output.length; i++){
		if (p[output[i].letter] && output[i].numbers.length > p[output[i].letter].length){
			while(output[i].numbers.length){
				delumped.push({"letter": output[i].letter , 
					"numbers": output[i].numbers.splice(0,p[output[i].letter].length) });
			}

		} else {
			delumped.push({"letter": output[i].letter, "numbers": output[i].numbers });
		} 
	}
	
	// console.log("extracted",output);
	// console.log("delumped",delumped);
	return delumped;
}

function interpretpath(d){ // TODO: misinterprets when coords omitted
	// Turn numbers lists created by extractpath into full objects
	var out=[];
	// console.log("interpreting",d);
	var p = pathsegtypes; // Global list of segment types and their attributes (x,y,x1,...)
	for (var i=0; i < d.length; i++){
		if (p[d[i].letter]){
			var obj = {"letter": d[i].letter};
			for (var j=0; j < d[i].numbers.length; j++){
				obj[p[d[i].letter][j]] = d[i].numbers[j];
			}
			out.push(obj);
		}
	}
	// console.log("interpreted as",out);
	return out;
}
function makedtext(d){
	// output usable d string for svg path
	var output = "";
	var p = pathsegtypes; // Global list of segment types and their attributes (x,y,x1,...)
	// console.log("makedtext",d);
	// incomplete
	for (var i=0; i < d.length; i++){
		output += d[i].letter+ " ";
		// console.log(d);
		// z commands don't have numbers
		if (d[i].numbers){
			if (d[i].numbers.length>1){
				for (var j=0; j < d[i]["numbers"].length; j++){
					// console.log(i,j,d[i]["numbers"][j]);
					if (d[i]["numbers"][j] !== ""){
						output += d[i]["numbers"][j].toFixed(4);
					}

					if (j%2==0){
						output += ",";
					}
					output += " ";
				}
			// } else if ("HhVv".indexOf(d[i].letter)){
			} else if (d[i].numbers.length==1){
				// console.log("HHHHVVVV",d[i]);
				output += d[i]["numbers"][0].toFixed(4);
			} else {
				// console.log("ZZZZZZZ",d[i]);
				// output += d[i]["numbers"][0].toFixed(4);
			}
		} else { // An interpreted array
			if (p[d[i].letter].indexOf("x1")>=0) output += d[i].x1.toFixed(4)+", ";
			if (p[d[i].letter].indexOf("y1")>=0) output += d[i].y1.toFixed(4)+" ";
			if (p[d[i].letter].indexOf("x2")>=0) output += d[i].x2.toFixed(4)+", ";
			if (p[d[i].letter].indexOf("y2")>=0) output += d[i].y2.toFixed(4)+" ";
			if (p[d[i].letter].indexOf("x")>=0) output += d[i].x.toFixed(4);
			if (p[d[i].letter].indexOf("x")>=0 && p[d[i].letter].indexOf("y")>=0) output += ", ";
			if (p[d[i].letter].indexOf("y")>=0) output += d[i].y.toFixed(4)+" ";
			output += " ";
			// TODO: Arc functionality
		}
		
	}
	return output;
}
function beautifypath(pel){
	var seglist = getseglist(pel);
	var text = "";
	for (seg of seglist){
		if ("MmLlHhVvZzCc".indexOf(seg.letter) >= 0){
			text += seg.letter +" "+ seg.x.toFixed(2) +", "+ seg.y.toFixed(2);
			if (seg.x1 && seg.y1) text += "\n "+ seg.x1.toFixed(2) +", "+ seg.y1.toFixed(2);
			if (seg.x2 && seg.y2) text += "\n "+ seg.x2.toFixed(2) +", "+ seg.y2.toFixed(2);
			text += "\n";
		}
	}
	return text;
}
function pack_path(seglist){ // compress path for url storage
	// compress numbers into bytes? Then base64
	if (seglist.length == 0) return "";
	console.log("pack",seglist);
	var text = "";
	for (seg of seglist){
		if ("MmLlHhVvZzCc".indexOf(seg.letter) >= 0){
			text += seg.letter +""+ seg.x.toFixed(2) +"t"+ seg.y.toFixed(2);
			if (seg.x1 && seg.y1) text += "s"+ seg.x1.toFixed(2) +"t"+ seg.y1.toFixed(2);
			if (seg.x2 && seg.y2) text += "s"+ seg.x2.toFixed(2) +"t"+ seg.y2.toFixed(2);
		}
	}
	return text;
}
function makerelative_(el){
	var d = extractpath(el.getAttribute("d"));
	var segs = interpretpath(d);
	console.log("seg list", segs);
	// TODO: Convert to relative by substracting previous point
	// console.log("abs in",path.getAttribute("d"));
  var x0,y0,x1,y1,x2,y2;
  for (var x=segs[0].x,y=segs[0].y,i=1; i<segs.length; ++i){
    var seg = segs[i], c=seg.letter;
    if (/[mlhvcsqta]/.test(c)){ // If is relative already
      if ('x' in seg) x=seg.x;
      if ('y' in seg) y=seg.y;
    }else{ // if is absolute and needs converting
      if ('x1' in seg) x1=x+seg.x1;
      if ('x2' in seg) x2=x+seg.x2;
      if ('y1' in seg) y1=y+seg.y1;
      if ('y2' in seg) y2=y+seg.y2;
      if ('x'  in seg) x += seg.x;
      if ('y'  in seg) y += seg.y;

      switch(c){

        case 'M': seg.letter='M'; seg.x=x; seg.y=y; break;
        case 'L': seg.letter='L'; seg.x=x; seg.y=y; break;
        case 'H': seg.letter='H'; seg.x=x; break;
        case 'V': seg.letter='V'; seg.y=y; break;
        case 'C': seg.letter='C'; seg.x1=x1; seg.y1=y1; seg.x2=x2; seg.y2=y2; seg.x=x; seg.y=y; break;
        case 'S': seg.letter='S'; seg.x2=x2; seg.y2=y2; seg.x=x; seg.y=y; break;
        case 'Q': seg.letter='Q'; seg.x1=x1; seg.y1=y1; seg.x=x; seg.y=y; break;
        case 'T': seg.letter='T'; seg.x=x; seg.y=y; break;
        case 'A': seg.letter='A'; seg.x=x; seg.y=y; break; // Don't need to change flags or nuthin
       
        case 'Z': case 'Z': x=x0; y=y0; break;
      }
    }
    if (c=='M' || c=='m') x0=x, y0=y;
  }
  // console.log("abs out",segs);
  var out= makedtext(segs);
  // console.log("abs text",out);
  // path.setAttribute("d",makedtext(segs));
  el.setAttribute("d",out);
  return segs;
}

function makerelative(el){
	// TODO: Use path.pathSegList[], probably more difficult to break. And they broke it!
	// console.log(el);
	var d = extractpath(el.getAttribute("d"));
	var segs = interpretpath(d);
	// console.log("seg list", segs);
	// var d = el.pathSegList;
	// Makes a path relative
	//TODO: Probably destroys arcs, and is not otherwise complete anyway
	var ltrs = "MCLHVZSQTA";
	// var d = extractpath(d);
	// var p0 = new Point(d.getItem(0).x,d.getItem(0).y);
	// console.log(x,y);
	// var firstp = d.getItem(0);
	var firstp = segs[0];
	var prevseg = new Point(firstp.x, firstp.y);
	// for (var i=1; i < d.numberOfItems; i++){
	for (var i=1; i < segs.length; i++){
		
		// var seg = d.getItem(i);
		var seg = segs[i];
		var thisp = new Point(seg.x, seg.y);
		
		if (ltrs.indexOf(seg.letter) >= 0){
			
			// var relp = new Point(seg.x-prevseg.x, seg.y-prevseg.y);
			var relp = new Point(thisp.x-prevseg.x, thisp.y-prevseg.y);

			
			if (seg.letter == "A"){
				//undefined, some numbers are booleans
				console.log("Found an arc in path and don't know how to make it relative.");
			} else if (seg.letter == "C"){

				seg.letter = "c";
				seg.x = relp.x;
				seg.y = relp.y;
				seg.x1 = seg.x1-prevseg.x;
				seg.x2 = seg.x2-prevseg.x;
				seg.y1 = seg.y1-prevseg.y;
				seg.y2 = seg.y2-prevseg.y;
				

				// d.replaceItem(el.createSVGPathSegCurvetoCubicRel(relp.x, relp.y, cp1.x, cp1.y, cp2.x, cp2.y), i);
			} else if (seg.letter == "L"){
				// d.replaceItem(el.createSVGPathSegLinetoRel(relp.x, relp.y), i);
				seg.letter = "l";
				seg.x = relp.x;
				seg.y = relp.y;
			}
			prevseg = new Point(thisp.x, thisp.y); // For next segment
		} else {
			// already relative segment so... probably increment running?
			console.error("Encountered relative path segment when converting to a relative path. This is not yet supported. Your path might look a bit funny now. ",seg);
		}
		
	}
	// creel_empty(tagname,id,cla,attrs,NS);
	// return d;
	// console.log("output segs",segs);
	var out= makedtext(segs);
	
	el.setAttribute("d",out);
	// saveseglist(path, segs)
	return el;
}
/* function positionpath(pathd, tocoords){
	// Change path d so that the M command points to tocoords
	var d = extractpath(pathd);
	// console.log("before rel", d);
	// console.log("before", makedtext(d));
	d = makerelative(d);
	// console.log("after rel", d);
	// console.log("after", makedtext(d));
	var x = d[0]["numbers"][0];
	var y = d[0]["numbers"][1];
	d[0]["numbers"][0] = tocoords[0];
	d[0]["numbers"][1] = tocoords[1];
	// console.log("made", makedtext(d));
	return makedtext(d);
	// return output;
	// TODO: This is not in use because some paths become warped byt his
	
} */
function movepath(path, point){
	// Change path starting coordinates
	//
	// console.log("movepath", path.getAttribute("d"), point);
	// console.log(path.getAttribute("d"));
	// var p = path.pathSegList.getItem(0);
	// p.x = point.x;
	// p.y = point.y;
	var d = extractpath(path.getAttribute("d"));
	d[0].numbers[0] = point.x;
	d[0].numbers[1] = point.y;
	path.setAttribute("d", makedtext(d));
	
}


function scalepath(pa, s){
	// Scale path by applying scale to all points of the path
	// Ignore first point
	var seglist = extractpath(pa.getAttribute("d"));
	// console.log(seglist);
	for (var i=1; i < seglist.length; i++){
		var seg = seglist[i];
		var p = new Point(seg.x*s, seg.y*s);
		if (seg.numbers.length>1){
			for (var j=0; j < seg.numbers.length; j++){
				seg.numbers[j] = seg.numbers[j]*s
			}
		}
	}
	pa.setAttribute("d", makedtext(seglist));
}
function scalepath_xy(pa, xs, ys){
	// Scale path by applying scale to all points of the path
	// Ignore first point
	// TODO: Doesn't work with arcs probably
	var seglist = extractpath(pa.getAttribute("d"));
	// console.log(seglist);
	for (var i=1; i < seglist.length; i++){
		var seg = seglist[i];
		// var p = new Point(seg.x*xs, seg.y*ys);
		if (seg.numbers.length>1){
			for (var j=0; j < seg.numbers.length; j++){
				if (j%2==0){
					seg.numbers[j] = seg.numbers[j] * xs;
				} else {
					seg.numbers[j] = seg.numbers[j] * ys;
				}
				
			}
		}
	}
	pa.setAttribute("d", makedtext(seglist));
}

function positionpath_transform(el,point){
	// Position group element using transform
	// Get path start point
	var d = extractpath(el.getAttribute("d"));
	var x = (-d[0]["numbers"][0]+point.x).toFixed(4);
	var y = (-d[0]["numbers"][1]+point.y).toFixed(4);
	var t = "translate("+x+","+y+")";
	el.setAttribute("transform",t);
	
}

function copyelement(group, el, point, style){
	// Copies the given svg element into the specified group
	// console.log(group, el, point, style);
	// console.log("before clone in copyelement",el);
	var cln = el.cloneNode(true);
	// console.log("after clone in copyelement",cln);
	// position path by replacing its M command
	// cln.setAttribute("d",positionpath(cln.getAttribute("d"), coords));
	addel(group, cln);
	// console.log("before movepath in copyelement",cln);
	movepath(cln, point);
	// console.log("after movepath in copyelement",cln);
	// positionpath_transform(cln, coords);
	if (style){
		cln.setAttribute("style",style);
	}
	
	// put in svg in group
	// console.log("before addel in copyelement",cln);
	
	// console.log("after addel in copyelement",cln);
	return cln;
	
}
function mirror(p, orientation){
	// Mirrors svg element in place
	var orig_t = p.getAttribute("transform") || "";
	var bb = p.getBBox();
	if (orientation.indexOf("h") >= 0){
		// Flip horizontally
		var w = bb.x*2+bb.width;
		var t = "translate("+w.toFixed(3)+",0) scale(-1, 1)";
	} else {
		var h = bb.y*2+bb.height;
		var t ="translate("+h.toFixed(3)+",0) scale(1, -1)";
	}
	p.setAttribute("transform",orig_t+" "+t+" ");
	
}
function move(el,point) {
	// Move element by adding transform
	var orig_t = el.getAttribute("transform") ? el.getAttribute("transform"):"" ;
	// console.log(orig_t);
	var bb = el.getBBox();
	if (point == "width"){
		var point = new Point(-bb.width,0);
		// point.x = bb.width;
	} 
	if (point == "height"){
		var point = new Point(0,-bb.width);
		// point.y = bb.height;
	} 
	var t ="translate("+point.x.toFixed(3)+","+point.y.toFixed(3)+") ";
	el.setAttribute("transform",orig_t+" "+t);
	// el.setAttributeNS(NAMESPACE,"transform",orig_t+" "+t);
}
function mirrorpath(group, path, vertical){
	// Mirror path d coordinates, maintain first point, return new path

	// Clone new element from path
	var cln = path.cloneNode(true);

	var ltrs = "CLHVZSQTA"; // Absolute coordinate commands
	var seglist = extractpath(cln.getAttribute("d"));
	
	for (var i=1; i<seglist.length;i++ ){
		var seg = seglist[i];
		if (ltrs.indexOf(seg.letter) >=0){
			console.log("mirrorpath(): Path contains absolute segment:",path);
		}
		if (vertical){
			// Mirror vertically
			// console.log("mirrorpath(): Vertical mirror not implemented yet:",path);
			seg.numbers[1] = -seg.numbers[1];
			if (seg.numbers[3]) seg.numbers[3] = -seg.numbers[3];
			if (seg.numbers[5]) seg.numbers[5] = -seg.numbers[5];
		} else {
			if (seg.letter == "a"){
				// Mirroring an arc segment
				console.log("mirrorpath(): Arc segment, arcs not implemented:",seg);
				// console.log(seg.sweepFlag);
				// seg.sweepFlag = false;
				// console.log(seg.sweepFlag);
			}
			// Mirror horizontally
			seg.numbers[0] = -seg.numbers[0];
			if (seg.numbers[2]) seg.numbers[2] = -seg.numbers[2];
			if (seg.numbers[4]) seg.numbers[4] = -seg.numbers[4];
			
		}
	}
	// put in svg in group
	cln.id += "-mirrored";
	addel(group, cln);
	cln.setAttribute("d", makedtext(seglist));
	return cln;
}

function breakpath(path){
	// TODO: Not finished
	// Break every segment into a separate path, return list of paths
	var seglist = path.pathSegList;
	var pathlist = [];
	console.log(seglist);
	var a = ["x","y","x1","y1","x2","y2"];
	
	function makecommand(seg){
		var out= "";
		for (var property in seg) {
			if (a.indexOf(property)>=0) {
				out += " " + property;
			}
		}
		return out;
	}
	var curx = seglist[0].x;
	var cury = seglist[0].y;
	// First new path is just first m and second command from original path
	var m = seglist[0].pathSegTypeAsLetter + " " + seglist[0].x
	pathlist.push();
	for (var i=1; i<seglist.length;i++){
		var m =0;
		pathlist.push();
		
		curx += seglist[i].x;
		cury += seglist[i].y;
	}
	return pathlist;
}
function path_calculate_cursor_pos(path){
	// Calculate svg virtual paintbrush/cursor position given path and number of segments moved along it. Return list of positions, one per segment.
	var seglist = path.pathSegList;
	var ltrs = "clhvzsqta";
	var absltrs = "CLHVZSQTA";
	var output = [];
	var last_abs = 0;
	// var handles = getelid("handlelayer");
	for (var i=0; i<seglist.length; i++){
		var seg = seglist[i];
		if (ltrs.indexOf(seg.pathSegTypeAsLetter)>=0){
			// relative movement
			output.push({"x": output[output.length-1].x+seg.x, 
						 "y": output[output.length-1].y+seg.y});
		} else if (seg.pathSegTypeAsLetter =='m' 
				|| seg.pathSegTypeAsLetter =='M'){
			output.push({"x": seg.x, "y": seg.y});
		}  else if (absltrs.indexOf(seg.pathSegTypeAsLetter)>=0){
			// Absolute segment
			// console.log("abs",i,seg.x,seg.y);
			output.push({"x": seg.x, "y": seg.y});
			last_abs = i;
		} 
		// drawcircle(handles, [output[i].x,output[i].y,4], SEVENTHSTYLE,"point-"+i);
	}
	// console.log("cursor",output);

	return output;
}
function greaterof(a,b){if (a>=b){return a;} else {return b;}}
function smallerof(a,b){if (a<=b){return a;} else {return b;}}
function isbetween(a,b,c){
	// var greater = greaterof(a,c);
	// var smaller = smallerof(a,c);
	// return (b >= smaller && b <= greater);
	if (a <= b && b <= c) return true;
	if (c <= b && b <= a) return true;
	// if (a == b && b== c) return true;
	return false;
}
function intersectline(p1,p2,     p3,p4,	dontcheckbounds) {
	// p1 and p2 are the start end end points of one line, likewise for p3 and p4
	// Return intersect coordinates of two lines
	// TODO: If one line is straight, returns value only if doncheckbounds is used
	var m1 = (p2.y-p1.y) / (p2.x-p1.x);
	var m2 = (p4.y-p3.y) / (p4.x-p3.x);

	// var b1 = p1.y-m1*p1.x;
	// var b2 = p3.y-m2*p3.x;

	var y,x;
	if (p1.y == p2.y && p3.x == p4.x){ // l1 is horizontal, l2 is vertical
		y = p1.y;
		x = p3.x;
		if (!dontcheckbounds && isbetween(p1.x,x,p2.x) && isbetween(p3.y,y,p4.y)) return new Point(x,y);
	} else if (p1.x == p2.x && p3.y == p4.y){ // l1 vertical, l2 horizontal
		y = p3.y;
		x = p1.x;
		if (!dontcheckbounds && isbetween(p3.x,x,p4.x) && isbetween(p1.y,y,p2.y)) return new Point(x,y);
	} else if (m1 == m2){ // parallel lines never meet, or intersect evrywhere, in which case, why are you bothering this function?
		return false;
	} else if (!isFinite(m1)){ // line 1 is vertical
		x = p1.x;
		y = m2*(p1.x - p3.x) + p3.y;
	} else if (!isFinite(m2)){ // line 2 is vertical
		// TODO: still does not work?
		x = p3.x;
		y = m1*(p3.x - p1.x) + p1.y;
	} else { // Normal case
		x = (p1.x*m1 - m2*p3.x - p1.y + p3.y)/(m1-m2);
		y = (x - p1.x)*m1 + p1.y;
		
	}
	

	if (dontcheckbounds){
		return new Point(x,y);
	}
	if (isbetween(p1.x,x,p2.x) && isbetween(p1.y,y,p2.y) 
		&& isbetween(p3.x,x,p4.x) && isbetween(p3.y,y,p4.y)){
		return new Point(x,y);
	} else { return false;}
};


function intersectBBox(r1, r2) {

	r1.right = (r1.x + r1.width);
	r1.bottom = r2.y+ r1.height;
	r2.right = r2.x + r2.width;
	r2.bottom = r2.y+ r2.height;
	// Is some part of rectangles on top of each other?
	var intersects = !(r2.x > r1.right || 
			 r2.right < r1.x || 
			 r2.y > r1.bottom ||
			 r2.bottom < r1.y);
	// Then get points
	
	function greaterof(a,b){if (a>=b){return a;} else {return b;}}
	function smallerof(a,b){if (a<=b){return a;} else {return b;}}
	if (intersects){
		var ir = {};
		ir.x = greaterof(r1.x, r2.x);
		ir.y = greaterof(r1.y, r2.y);
		ir.right = smallerof(r1.right, r2.right);
		ir.bottom = greaterof(r1.bottom, r2.bottom);
		ir.width = ir.right - ir.x;
		ir.height = ir.bottom - ir.y;
		return ir;
	} else {
		return false;
	}
}
function convertToAbsolute(path, fromzero){
	var fromzero = fromzero || false; 
	// https://embed.plnkr.co/a4GIp0/
	var segs = interpretpath(extractpath(path.getAttribute("d")));
	if (fromzero){ // Start from zero
		// console.log("starting from zero");
		segs[0].x =0;
		segs[0].y =0;
	}
	// console.log("abs in",path.getAttribute("d"));
  var x0,y0,x1,y1,x2,y2;
  for (var x=0,y=0,i=0; i<segs.length; ++i){
    var seg = segs[i], c=seg.letter;
    if (/[MLHVCSQTA]/.test(c)){
      if ('x' in seg) x=seg.x;
      if ('y' in seg) y=seg.y;
    }else{
      if ('x1' in seg) x1=x+seg.x1;
      if ('x2' in seg) x2=x+seg.x2;
      if ('y1' in seg) y1=y+seg.y1;
      if ('y2' in seg) y2=y+seg.y2;
      if ('x'  in seg) x += seg.x;
      if ('y'  in seg) y += seg.y;
	// TODO: This might not quite work? Even if it does, it would be preferrable to not use pathseglist or the path API just in case
		// seg.x=x; seg.y=y; // Always the same, except h,v....
      switch(c){
        // case 'm': segs.replaceItem(path.createSVGPathSegMovetoAbs(x,y),i);                   break;
        case 'm': seg.letter='M'; seg.x=x; seg.y=y; break;
        case 'l': seg.letter='L'; seg.x=x; seg.y=y; break;
        case 'h': seg.letter='H'; seg.x=x; break;
        case 'v': seg.letter='V'; seg.y=y; break;
        case 'c': seg.letter='C'; seg.x1=x1; seg.y1=y1; seg.x2=x2; seg.y2=y2; seg.x=x; seg.y=y; break;
        case 's': seg.letter='S'; seg.x2=x2; seg.y2=y2; seg.x=x; seg.y=y; break;
        case 'q': seg.letter='Q'; seg.x1=x1; seg.y1=y1; seg.x=x; seg.y=y; break;
        case 't': seg.letter='T'; seg.x=x; seg.y=y; break;
        case 'a': seg.letter='A'; seg.x=x; seg.y=y; break; // Don't need to change flags or nuthin
       
        case 'z': case 'Z': x=x0; y=y0; break;
      }
    }
    if (c=='M' || c=='m') x0=x, y0=y;
  }
  // console.log("abs out",segs);
  var out= makedtext(segs);
  // console.log("abs text",out);
  // path.setAttribute("d",makedtext(segs));
  path.setAttribute("d",out);
  return segs;
}

function planey3dline (p1,p2, yval){
	// p1,p2 should be Point objects with 3 axes
	// yval 
	// var axis = axis || "y";
	// First find x coordinate
	// var x = intersectline(p1,p2,  new Point(p1.x));
	var x = p1.x +((p1.y-yval)*(p2.x-p1.x))/(p1.y-p2.y)
	var z = p1.z +((p1.y-yval)*(p2.z-p1.z))/(p1.y-p2.y)
	
	// Find z coordinate
	
	return new Point(x,yval,z);
}



////////////////////////////////////////////////////////////////////////////////
// Fast path intersections using some higher level math
function pathline_intersect (path,line,debug){
	// Intersect any svg path and a line segment, where line is an array of two Point objects, whose coordinates are absolute
	// Loops through the whole path but stops when the first intersection is found, returns false if nothing was found
	var seglist = interpretpath(extractpath(path.getAttribute("d")));
	
	var lx = [line[0].x,line[1].x];
	var ly = [line[0].y,line[1].y];
	var LTRS = "MCLHVZSQTA";
	var sge = seglist[0];
	var segend = new Point(sge.x, sge.y);
	// console.log("pathline list length", seglist.numberOfItems);
	
	for (var i=1; i<seglist.length;i++){
		// Get absolute coordinates for path segment control points
		var seg = seglist[i];
		if (LTRS.indexOf(seg.letter) > 0){
			// Path segment is absolute already
			if (debug) console.log("absolute segment",i);
			var px = [segend.x, // last segend = start of this one
					  (seg.x1 || 0), // if line segment, there's no x1
					  (seg.x2 || 0), // but does this produce correct results
					  seg.x]; // in those cases?
			var py = [segend.y,
					  (seg.y1 || 0),
					  (seg.y2 || 0),
					  seg.y];
			segend = new Point(seg.x, seg.y);
		} else {
			// Path segment is relative
			if (debug) console.log("relative segment",i);
			var px = [segend.x, 
					  segend.x + (seg.x1 || 0),
					  segend.x + (seg.x2 || 0),
					  segend.x + seg.x];
			var py = [segend.y,
					  segend.y + (seg.y1 || 0),
					  segend.y + (seg.y2 || 0),
					  segend.y + seg.y];
			segend = segend.move(seg.x, seg.y);
		}
		// Try to intersect path segment with line
		if (debug) console.log("pathline",px,py,lx,ly);
		
		if (seg.letter == "a" || seg.letter == "A"){
			if (debug) console.log("pathline A");
			// TODO: This can't work:
			var inter = arc_intersect(px,py,lx,ly, seg);
		} else if (seg.letter == "l" || seg.letter == "L"){
			var inter = intersectline(new Point(px[0],py[0]),new Point(px[3],py[3]),     line[0],line[1]);
			
		} else { // Bezier segment
			var inter = computeIntersections(px,py,lx,ly, true);
			if (inter.x==0 && inter.y ==0){inter = false;}
			// TODO: Does this ==0 check make any sense?
		}
		
		if (inter){
			if (debug) console.log("pathline found intersection", inter);
			return inter;
		} else {
			if (debug) console.log("pathline; no intersection", px,py);
			// drawline(getelid("infobox"), line ,GREENSTYLE);
			
		}
	}
	return false;
}

/*computes intersection between an arc segment and a line segment*/
function arc_intersect(px,py,lx,ly, arcseg){
	var f = getelid("infobox");
	// console.log("px,py,lx,ly", px,py,lx,ly);
	var randi = parseInt(Math.random()*1000); // identifier for debug drawings
	console.log("arc intersection; arcseg "+randi, arcseg);
	function ang(p1,p2){
		var a = Math.atan2(p2.x-p1.x,p2.y-p1.y );
		// Normalize to positive angles
		// if (a<0) a = a+2*Math.PI;
		return a;
	}
	// Find circle center and radius
	var radius = arcseg.r1;
	// Points on the circle
	if (arcseg.sweepFlag){
		var c1 = new Point(px[0], py[0]);
		var c2 = new Point(px[3], py[3]);
	} else {
		var c2 = new Point(px[0], py[0]);
		var c1 = new Point(px[3], py[3]);
	}
	drawcircle(f, c1, 1,"","c1-"+randi);
	drawcircle(f, c2, 1,"","c2-"+randi);
	// drawline(getelid("infobox"),[p1,p2], BLUESTYLE);
	var d = linelength(c1,c2)/2.0;
	var angle = ang(c1,c2);
	var midp = c1.movedist(d, angle);
	drawcircle(f, midp, 1,"","midp-"+randi);
	var b = Math.sqrt(radius**2-d**2);
	// Decide centerpoint side
	// TODO: centerpoint finding fails sometimes
	// if (arcseg.sweepFlag) {
	if (arcseg.largeArcFlag) {
		// || (!arcseg.sweepFlag && arcseg.largeArcFlag)){
		var center = midp.movedist(b, angle+0.5*Math.PI);
	} else {
		var center = midp.movedist(b, angle-0.5*Math.PI);
	}
	drawcircle(f, center, 3,"","center-"+randi);
	
	var p1 = new Point(lx[0], ly[0]);
	var p2 = new Point(lx[1], ly[1]);
	drawline(f,[p1,p2], REDSTYLE, "line-"+randi);
	var p1a = ang(center, p1);
	var p2a = ang(center, p2);
	var c1a = ang(center, c1);
	var c2a = ang(center, c2);
	
	var pa = ang(p1, p2);
	
	var langle = Math.abs(p2a-p1a);

	var c1len = linelength(center,c1);
	var c2len = linelength(center,c2);
	var p1len = linelength(center,p1);
	var p2len = linelength(center,p2);
	var plen = linelength(p1,p2);
	// Rotate lp2 around lp1 by -langle
	var origin = FRONTVIEWORIGIN.move(78,-100);
	drawcircle(f, origin, 1,"","origin-"+randi);
	// Angle center-lp1-lp2
	var corner1 = Math.acos((plen**2+p1len**2-p2len**2)/(2*plen*p1len));
	console.log("corner1", corner1);
	var corner2 = Math.PI-corner1-langle;
	var np1a = 0.5*Math.PI-corner1;
	console.log(p1len,np1a, corner1);
	// Find p3, located perpendicular to center on line p1-p2
	var p1top3 = p1len * Math.cos(corner1);
	var p3 = p1.movedist(p1top3,pa);
	drawcircle(f, p3, 2,"","p3-"+randi);
	
	drawline(f,[center,p3], REDSTYLE, "p3line-"+randi);
	drawline(f,[center,center.movedist(100,p1a)], REDSTYLE, "p1line-"+randi);
	drawline(f,[center,center.movedist(100,p2a)], REDSTYLE, "p2line-"+randi);
	var p3len = linelength(center,p3); 
	var p3a = ang(center, p3);
	//
	// Rotate line and arc points until line is horizontal
	var np1 = new Point(0,0).movedist(p1len,p1a-p3a);
	drawcircle(f, origin.addpoint(np1), 1,"","np1-"+randi);
	var np2 = new Point(0,0).movedist(p2len,p2a-p3a);
	drawcircle(f, origin.addpoint(np2), 1,"","np2-"+randi);
	drawline(f,[origin.addpoint(np1),origin.addpoint(np2)], REDSTYLE, "nline-"+randi);
	var nc1a = c1a-p3a;
	var nc2a = c2a-p3a;
	var nc1 = new Point(0,0).movedist(c1len,nc1a);
	var nc2 = new Point(0,0).movedist(c2len,nc2a);
	drawcircle(f, origin.addpoint(nc1), 1,BLUESTYLE,"nc1-"+randi);
	drawcircle(f, origin.addpoint(nc2), 1,"","nc2-"+randi);
	// Draw rotated circle segment
	var nnc1 = origin.addpoint(nc1);
	var nnc2 = origin.addpoint(nc2);
	var d = "M"+nnc1.x.toFixed(DIGITS)+","+nnc1.y.toFixed(DIGITS);
	var larc = "0";
	if (arcseg.largeArcFlag) larc = "1";
	d += " A"+radius+","+radius+ " 0 "+larc+" 1 " + + nnc2.x.toFixed(DIGITS)+","+nnc2.y.toFixed(DIGITS);
	var el = creel("path", "testnc"+randi , "", ["d",d], NAMESPACE);
	el.setAttribute("style",NOFILLTHIN);
	addel(f,el);
	// if line shortest distance from center is < radius, there are intersections
	function archeck(a1,a,a2){
		// if (a1 < 0)a1 += Math.PI*2;
		// if (a < 0)
		if (a1 > Math.PI) a1 = a1 - 2*Math.PI;
		if (a2 > a1) a2 = a2 - 2*Math.PI;
		// if both a1 and a2 are in the negative space, a should be too
		if (a1 < 0 && a > 0) a = a - 2*Math.PI
		console.log("arc",isbetween(a1,a,a2),a1,a,a2);
		return isbetween(a1,a,a2);
	}
	if (p3len < radius){
		console.log("circle and line intersect");
		// Find intersections with circle
		var h = Math.sqrt(radius**2-p3len**2);
		var inter1 = new Point(h, p3len);
		var inter2 = new Point(-h, p3len);
		var i1a = ang(new Point(0,0),inter1);
		var i2a = ang(new Point(0,0),inter2);
		drawline(f,[origin,origin.movedist(100,0)], REDSTYLE, "angl0-"+randi);
		drawline(f,[origin,origin.movedist(100,-1)], REDSTYLE, "anglneg-"+randi);
		// Angle 0 is downwards, clockwise is negative
		console.log("line",isbetween(np1.x,inter1.x,np2.x),np1.x,inter1.x,np2.x);
		// console.log("arc",isbetween(nc1a,i1a,nc2a),nc1a,i1a,nc2a);
		drawcircle(f, origin.addpoint(inter1), 2,REDSTYLE,"inter1-"+randi);
		drawcircle(f, origin.addpoint(inter2), 2,REDSTYLE,"inter2-"+randi);
		// var nnc1a = ang(new Point(), );
		// Check validity of first intersection
		if (archeck(nc1a,i1a,nc2a) && isbetween(np1.x,inter1.x,np2.x)){
			// && ((nc1.y < p3len)&&(nc2.y < p3len))){
			console.log("inter1 is valid");
			valid1 = true;
			
			var reali = center.movedist(radius,i1a+p3a);
			drawcircle(f, reali, 2,REDSTYLE,"inter1real-"+randi);
			return reali;
		}
		console.log("line",isbetween(np1.x,inter2.x,np2.x),np1.x,inter2.x,np2.x);
		
		// Check validity of second intersection
		if (archeck(nc1a,i2a,nc2a) && isbetween(np1.x,inter2.x,np2.x) ){
			// && ((nc2.y < p3len)||(nc2.y < p3len))){
			// ilist.push(inter1);
			console.log("inter2 is valid");
			valid2 = true;
			
			var reali = center.movedist(radius,i2a+p3a);
			drawcircle(f, reali, 2,REDSTYLE,"inter2real-"+randi);
			return reali;
		}
		// Rotate selected intersection point to original coordinates
		
	}
	console.log("arc_intersect: No valid intersections");
	return false;
}

/*computes intersection between an arc segment and a line segment*/
function arc_intersect_(px,py,lx,ly, arcseg){
	console.log("arc intersection; arcseg", arcseg);
	// console.log("px,py,lx,ly", px,py,lx,ly);
	var randi = parseInt(Math.random()*1000); // identifier for debug drawings
	function ang(p1,p2){
		var a = Math.atan2(p2.x-p1.x,p2.y-p1.y );
		// Normalize to positive angles
		if (a<0) a = a+2*Math.PI;
		return a;
	}
	// Find circle center and radius
	var radius = arcseg.r1;
	// Points on the circle
	if (arcseg.largeArcFlag){
		var p2 = new Point(px[0], py[0]);
		var p1 = new Point(px[3], py[3]);
	} else {
		var p1 = new Point(px[0], py[0]);
		var p2 = new Point(px[3], py[3]);
	}
	
	drawcircle(getelid("infobox"), p1, 1,"","");
	drawcircle(getelid("infobox"), p2, 1,"","");
	// drawline(getelid("infobox"),[p1,p2], BLUESTYLE);
	var d = linelength(p1,p2)/2.0;
	var angle = ang(p1,p2);
	var midp = p1.movedist(d, angle);
	drawcircle(getelid("infobox"), midp, 1,"","midp"+randi);
	var b = Math.sqrt(radius**2-d**2);
	// Decide centerpoint side
	// TODO: centerpoint finding fails sometimes
	if (arcseg.sweepFlag) {
	// if ((arcseg.sweepFlag && !arcseg.largeArcFlag) 
		// || (!arcseg.sweepFlag && arcseg.largeArcFlag)){
		var center = midp.movedist(b, angle-Math.PI/2);
	} else {
		var center = midp.movedist(b, angle+Math.PI/2);
	}
	drawcircle(getelid("infobox"), center, 3,"","center"+randi);
	// drawline(getelid("infobox"),[p1,center], BLUESTYLE);
	// drawline(getelid("infobox"),[p2,center], BLUESTYLE);
	// drawline(getelid("infobox"),[center, center.movedist(100,3)], BLUESTYLE);
	// console.log("p1,p2, radius", p1,p2, radius, d);
	
	var lp1 = new Point(lx[0], ly[0]).minuspoint(center);
	var lp2 = new Point(lx[1], ly[1]).minuspoint(center);
	drawcircle(getelid("infobox"), {x:lx[0], y:ly[0]}, 1,REDSTYLE,"");
	drawline(getelid("infobox"),[{x:lx[0], y:ly[0]},{x:lx[1], y:ly[1]}], REDSTYLE);
	// Is there an intersection at all?
	var dx = lp2.x - lp1.x;
	var dy = lp2.y - lp1.y;
	var dr = Math.sqrt(dx**2 + dy**2);
	var DD = lp1.x*lp2.y - lp2.x*lp1.y;
	var discriminant = (radius**2)*(dr**2) - DD**2;
	// console.log("discriminant", discriminant);
	function sgn(x) { if (x<0){return -1;} else {return 1;}}
	var valid1 = false;
	var valid2 = false;
	
	if (discriminant >= 0){ // Single solution, or more
		
		function archeck(a1,ai,a2){
			var result = false;
			if (arcseg.sweepFlag && arcseg.largeArcFlag){
				console.log("archeck sweepflag largeArcFlag");
				// if (a1 == 0.0) a1 = Math.PI*2;
				
				result = (a1<=ai && ai >=a2) || (a1<=ai && ai <=a2);
			} else if (arcseg.sweepFlag ){
				console.log("archeck sweepflag true");
				if (a1 == 0.0) a1 = Math.PI*2;
				result = a1>=ai && ai >=a2;
			} else {
				if (a2 == 0.0) a2 = Math.PI*2;
				result = a1<=ai && ai <=a2;
			}
			console.log("archeck ", result, a1,ai,a2);
			// TODO: what if archeck  false -1.57 -1.86 3.14
			// +10 to all -> PI still not in order. normalize PI to 0?
			// Modulo PI
			// If p1 < 0 && p2 == PI, p2 = 0
			
			// if inter is on the same side of center as p1 and p2
			return result;
		}
		var ix = (DD*dy + sgn(dy)*dx*Math.sqrt(discriminant))/(dr**2);
		var iy = (-DD*dx + Math.abs(dy)*Math.sqrt(discriminant))/(dr**2);
		// var inter1 = new Point(ix,iy).addpoint(center); // move-+?
		var inter1 = center.move(ix,iy); // move-+?
		var a1 = ang(center, p1); // angle from arc center to arc start
		var a2 = ang(center, p2);
		drawline(getelid("infobox"),[center, center.movedist(200,a1)], GREENSTYLE);
		drawline(getelid("infobox"),[center, center.movedist(200,a2)], BLUESTYLE);
		// Math.atan2(p1,p2);
		var ai1 = ang(center, inter1);
		drawline(getelid("infobox"),[center, center.movedist(200,ai1)], REDSTYLE);
		console.log("First intersection", drawcircle(getelid("infobox"), inter1, 2,BLUESTYLE,""));
		// console.log("isbetween",lx[0],inter1.x,lx[1],isbetween(lx[0],inter1.x,lx[1]),ly[0],inter1.y,ly[1], isbetween(ly[0],inter1.y,ly[1]));
		if (isbetween(lx[0],inter1.x,lx[1]) && isbetween(ly[0],inter1.y,ly[1])
			&& archeck(a1, ai1, a2)){
			// ilist.push(inter1);
			valid1 = true;
			drawcircle(getelid("infobox"), inter1, 2,REDSTYLE,"");
		} //else { return false;}
		if (discriminant > 0){ // Two intersections
			var ix2 = (DD*dy - sgn(dy)*dx*Math.sqrt(discriminant))/(dr**2);
			var iy2 = (-DD*dx - Math.abs(dy)*Math.sqrt(discriminant))/(dr**2);
			// var inter2 = new Point(ix2,iy2).addpoint(center);
			var inter2 = center.move(ix2,iy2);
			
			var ai2 = ang(center, inter2);
			drawline(getelid("infobox"),[center, center.movedist(200,ai2)], REDSTYLE);
			console.log("Second intersection", drawcircle(getelid("infobox"), inter2, 2,BLUESTYLE,""));
			// console.log("isbetween",lx[0],inter2.x,lx[1],isbetween(lx[0],inter2.x,lx[1]),ly[0],inter2.y,ly[1], isbetween(ly[0],inter2.y,ly[1]));
			if (isbetween(lx[0],inter2.x,lx[1]) && isbetween(ly[0],inter2.y,ly[1])
				&& archeck(a1, ai2, a2)){
				// ilist.push(inter2);
				valid2 = true;
				drawcircle(getelid("infobox"), inter2, 2,GREENSTYLE,"");
				drawline(getelid("infobox"),[inter1,inter2], GREENSTYLE);
			} //else { return false;}
		}
		
		
		
		
	}
	
	// TODO: Cull intersections; Are they inside line segment bounds, within arc segment angle?
	// Check inter1
	
	if (valid1 && valid2){
		console.log("arc_intersect: Two valid intersections");
		drawcircle(getelid("infobox"), inter1, 4,GREENSTYLE,"");
		return inter1;
	} else if (valid1){
		console.log("arc_intersect: inter1");
		drawcircle(getelid("infobox"), inter1, 4,GREENSTYLE,"");
		return inter1;
	} else if (valid2){
		console.log("arc_intersect: inter2");
		drawcircle(getelid("infobox"), inter2, 4,GREENSTYLE,"");
		return inter2;
	} else {
		console.log("arc_intersect: No intersections", valid1, valid2);
		return false;
	}
	return false;
}


/*computes intersection between a cubic spline(path bezier segment) and a line segment*/
function computeIntersections(px,py,lx,ly,verify){
	// px, py = arrays of coordinates for bezier control points (4), 
	// lx,ly = coords for line (2)
    var X=[];
    
    var A=ly[1]-ly[0];	    //A=y2-y1
	var B=lx[0]-lx[1];	    //B=x1-x2
	var Zpoints=lx[0]*(ly[0]-ly[1]) + 
          ly[0]*(lx[1]-lx[0]);	//Zpoints=x1*(y1-y2)+y1*(x2-x1)

	var bx = bezierCoeffs(px[0],px[1],px[2],px[3]);
	var by = bezierCoeffs(py[0],py[1],py[2],py[3]);
	
    var P = Array();
	P[0] = A*bx[0]+B*by[0];		/*t^3*/
	P[1] = A*bx[1]+B*by[1];		/*t^2*/
	P[2] = A*bx[2]+B*by[2];		/*t*/
	P[3] = A*bx[3]+B*by[3] + Zpoints;	/*1*/
	
	var r=cubicRoots(P);
	
    /*verify the roots are in bounds of the linear segment*/
	t=r[0];
	X[0]=bx[0]*t*t*t+bx[1]*t*t+bx[2]*t+bx[3];
    X[1]=by[0]*t*t*t+by[1]*t*t+by[2]*t+by[3];  
	if (!verify){
		return new Point(X[0], X[1]);
	} else {
		for (var i=0;i<3;i++){
			t=r[i];
			
			X[0]=bx[0]*t*t*t+bx[1]*t*t+bx[2]*t+bx[3];
			X[1]=by[0]*t*t*t+by[1]*t*t+by[2]*t+by[3];            
			  

			// above is intersection point assuming infinitely long line segment,
			// make sure we are also in bounds of the line
			var s;
			if ((lx[1]-lx[0])!=0)           //if not vertical line
				s=(X[0]-lx[0])/(lx[1]-lx[0]);
			else
				s=(X[1]-ly[0])/(ly[1]-ly[0]);
			
			//in bounds?    
			if (t<0 || t>1.0 || s<0 || s>1.0)
			{
				// X[0]=-100;  //move off screen
				// X[1]=-100;
				return false;
			}
			
			// move intersection point
			// I[i].setAttributeNS(null,"cx",X[0]);
			// I[i].setAttributeNS(null,"cy",X[1]);
			return new Point(X[0], X[1]);
		} 

	}
	
	
   
}

/*based on http://mysite.verizon.net/res148h4j/javascript/script_exact_cubic.html#the%20source%20code*/
function cubicRoots(P){
	var a=P[0];
	var b=P[1];
	var c=P[2];
	var d=P[3];
	
	var A=b/a;
	var B=c/a;
	var Zpoints=d/a;

    var Q, R, D, S, T, Im;

    var Q = (3*B - Math.pow(A, 2))/9;
    var R = (9*A*B - 27*Zpoints - 2*Math.pow(A, 3))/54;
    var D = Math.pow(Q, 3) + Math.pow(R, 2);    // polynomial discriminant

    var t=Array();
	
    if (D >= 0)                                 // complex or duplicate roots
    {
        var S = sgn(R + Math.sqrt(D))*Math.pow(Math.abs(R + Math.sqrt(D)),(1/3));
        var T = sgn(R - Math.sqrt(D))*Math.pow(Math.abs(R - Math.sqrt(D)),(1/3));

        t[0] = -A/3 + (S + T);                    // real root
        t[1] = -A/3 - (S + T)/2;                  // real part of complex root
        t[2] = -A/3 - (S + T)/2;                  // real part of complex root
        Im = Math.abs(Math.sqrt(3)*(S - T)/2);    // complex part of root pair   
        
        /*discard complex roots*/
        if (Im!=0)
        {
            t[1]=-1;
            t[2]=-1;
        }
    
    }
    else                                          // distinct real roots
    {
        var th = Math.acos(R/Math.sqrt(-Math.pow(Q, 3)));
        
        t[0] = 2*Math.sqrt(-Q)*Math.cos(th/3) - A/3;
        t[1] = 2*Math.sqrt(-Q)*Math.cos((th + 2*Math.PI)/3) - A/3;
        t[2] = 2*Math.sqrt(-Q)*Math.cos((th + 4*Math.PI)/3) - A/3;
        Im = 0.0;
    }
    
    /*discard out of spec roots*/
	for (var i=0;i<3;i++) 
        if (t[i]<0 || t[i]>1.0) t[i]=-1;
                
	/*sort but place -1 at the end*/
    t=sortSpecial(t);
    
	// console.log(t[0]+" "+t[1]+" "+t[2]);
    return t;
}

function sortSpecial(a){
    var flip;
    var temp;
    
    do {
        flip=false;
        for (var i=0;i<a.length-1;i++)
        {
            if ((a[i+1]>=0 && a[i]>a[i+1]) ||
                (a[i]<0 && a[i+1]>=0))
            {
                flip=true;
                temp=a[i];
                a[i]=a[i+1];
                a[i+1]=temp;
                
            }
        }
    } while (flip);
	return a;
}

// sign of number
function sgn( x ){
    if (x < 0.0) return -1;
    return 1;
}

function bezierCoeffs(P0,P1,P2,P3){
	var Z = Array();
	Z[0] = -P0 + 3*P1 + -3*P2 + P3; 
    Z[1] = 3*P0 - 6*P1 + 3*P2;
    Z[2] = -3*P0 + 3*P1;
    Z[3] = P0;
	return Z;
}

//////////////////////////////////////////////////////////////////////////////
// Array functionality


function flipsign(ar){ // Flip sign of all numbers in array
	var out = [];
	var a= ar.length;
	for (i=0;i<a;i++){
		out.push(-ar[i]);
	}
	return out;
}
function findmax(array){ // find largest number in an array, return index
  var max = -1000000,
      a = array.length,
      counter,
	  maxcounter;
  for (counter=0;counter<a;counter++){
      if (array[counter] > max){
          max = array[counter]
		  maxcounter = counter
      }
  }
  return maxcounter;
}
function findmin(array){ // find smallest number in an array, return index
  var max = 1000000000,
      a = array.length,
      counter,
	  maxcounter;
  for (counter=0;counter<a;counter++){
      if (array[counter] < max){
          max = array[counter]
		  maxcounter = counter
      }
  }
  return maxcounter;
}
function copyobj(obj){ // Clone an object, first level only
	var copy = {};
	for (var attr in obj) {
        if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
    }
    return copy;
}
function objdif(o1,o2){ // Return list of properties that have been changed
	var out={};
	for (var attr in o1) {
        if ((o1.hasOwnProperty(attr) && o2.hasOwnProperty(attr)) && o1[attr] != o2[attr]) {
			out[attr] = o1[attr];
		}
    }
	return out;
}

//////////////////////////////////////////////////////////////////////////////
// SVG styling helpers and text functions

function makestyle(style, repls){
	// TODO: This is not ready obviously
	// Usage: makestyle(COVERSTYLE, ["stroke","none"])
	// in fully formed style string, replace specified things
	var out = style;
	for (var i=0; i<repls.length; i=i+2){
		var istart;
		out = out.replace(repls[i],repls[i+1]);
	}
	return out;
}

function ordinal(num){
	if (num==1){
		return num+"st";
	} else if (num==2){
		return num+"nd";
	} else if (num==3){
		return num+"rd";
	} else {
		return num+"th";
	}
}




function for_each(from,to,array,input_function){
	for (var i=from; i<to; i++){
		input_function (array[i]);
	}
}









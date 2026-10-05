// Lute Designer by Larui Niskanen 2021
// New instrument object based drawing system
/*
settingchange() collects data from the page to editorstate 
Instrument() calculates instrument shape based on editorstate (shortened to ed)
Separate drawing functions draw the instrument in the SVG (or in 3D) based on Instrument objects only 

*/

function Instrument(ed, number,name){
	if (number === undefined) console.error("You must specify a number for each instrument");
	if (ed === undefined) console.error("You must input editorstate");
	var i_number = this.i_number = number; // identifier to be used on every named svg element
	console.log("name:",name,ed.bodyshapefromlist, "numberribs",ed.numberofribs);
	this.name = name; // Use given name, gets overwritten by bodyname later if not provided
	this.ed = ed;// for (e in ed){ console.log(e,"=",ed[e]);}
	// TODO: Does ed need to be a deep clone of editorstate?
	this.body = {};
	this.strings = {};
	this.pegbox = {};
	this.shapes = {};
	this.neck = {};
	this.bridge = {};
	this.nuts = [];
	this.guitar = false;

	this.body.acc = 2.5; // How accurately to convert body shape into points, and ribs
	
	this.strings.longest_mensur = getmensur(); // TODO: Now uses global editorstate
	this.strings.spacings = calculatestrings(ed);
	this.strings.mensur = ed.mensur;
	
	///////////////////////////////////////////////////////////////////////
	// Use external shape calculation functions
	this.choose_body();// Body; Choose which shape to use
	this.calculate_bridge();// Bridge
	this.calculate_neck();// Find neck-body interection
	this.calculate_strings();// Calculate position for each string and nut
	this.calculate_frets();// Calculate frets as distance from string start on bridge
	this.calculate_pegbox();// Pegbox and extension
	this.calculate_bars();// Soundboard bars & rosette position
	
	
	
	// Body calculation
	if (this.guitar){
		this.calculate_guitarbody();
	} else {
		this.calculate_lutecircumference(this.body.widest_i); // Circumference at widest point
		this.calculate_ribcorners(this.body.widest_i); // ribs at widest point
		this.calculate_ribstarts(); // where rib ends meet soundboard
		this.calculate_lutebody(); // rib joints as points every 1 mm
		this.calculate_endclasp();// Endclasp
		this.flatten_endclasp();// Make endclasp template
		try{this.flatten_ribs();}catch(e){console.log(e)}// Make endclasp template
		// rib shape --> bowl shape calculation mode?
	}
	
	
	
	// Every view of the instrument gets drawn in real coordinates at 0,0, but the group gets translated and rotated to show correctly. These are the default locations, which may get overwrittten by individual drawing functions.
	this.origins = this.origins = {};
	this.origins.front = new Point(0,0);
	this.origins.side = new Point(this.body.width+50,0);
	this.origins.back = new Point(-this.body.width-50,0);
	this.origins.cross = new Point(0,300);
	
	// Information about drawing
	if (this.name === undefined) this.name = this.bodyname;
	
	this.height = getlast(this.nuts).bass_far.y+100; // TODO:
	// Helper functions
	this.get_viewbox = function(){ // How large is the frontview
		return {
			// x: ,
			// y: ,
			w: this.body.width,
			h: this.height // TODO: Depends on extension type
		};
	}
	
	return this;
}

///////////////////////////////////////////////////////////////////////
// Instrument Part calculation functions
Instrument.prototype.calculate_bridge = function(){
	this.bridge.sideoffset = this.ed.bridgeoffsetx || 0;
	if (this.ed.bodyshapefrom=="guitar"){ // Position bridge
		this.bridge.middle = new Point(-this.bridge.sideoffset, this.body.height/4 + this.ed.bridgeoffset);
	} else {
		this.bridge.middle = new Point(-this.bridge.sideoffset, (2*(this.body.height/9)/3) *2 + this.ed.bridgeoffset);
	}
	
	this.bridge.angle_deg = (this.ed.bridgeangle || 0);
	this.bridge.angle = halfpi - (this.ed.bridgeangle || 0) * radtodeg;
	this.bridge.bass = this.bridge.middle.movedist(-this.strings.spacings.bridgewidth/2, this.bridge.angle);
	this.bridge.treble = this.bridge.middle.movedist(this.strings.spacings.bridgewidth/2, this.bridge.angle);
	this.neck.width_at_nut = getlast(this.strings.spacings.nuts[0]) + this.ed.neckadd + 8;
	// console.log("neck.width_at_nut",neck.width_at_nut);
	// console.log(this.ed);
	
	var zp = new Point(0,0,0); // Position of first string hole, this.bridge gets rotatthis.ed and translatthis.ed around this point
	this.bridge.top_UR = zp.move(7.5).setz(-7);
	this.bridge.top_UL = zp.move(-(this.strings.spacings.bridgewidth+8)).setz(-7-this.strings.spacings.bridgewidth*0.02);
	this.bridge.top_DR = this.bridge.top_UR.move(0,-7.5).setz(-7);
	this.bridge.top_DL = this.bridge.top_UL.move(0,-7.5).setz(-7-this.strings.spacings.bridgewidth*0.02);
	this.bridge.bot_L = this.bridge.top_UL.move(3,-16.5).setz(-1);
	this.bridge.bot_R = this.bridge.top_UR.move(-3,-15).setz(-1);
	this.bridge.inside_L = this.bridge.top_DL.move(-5).setz(-4);
	this.bridge.inside_R = this.bridge.top_DR.move(5).setz(-5);
	if (this.ed.bridgestyle == "monzino"){
		this.bridge.bot_L = this.bridge.top_UL.move(3,-13.1);
		this.bridge.bot_R = this.bridge.top_UR.move(-3,-11.9);
	}
}
Instrument.prototype.calculate_neck = function(){
    
	var bridge_tr = this.bridge.treble.movedist(4.5,this.bridge.angle);
	if (this.ed.limitorset == "set"){ 
		// Calculate nut position from neck width
		this.neck.width = this.ed.neckwidthlimit;
		this.neck.joint = intersect_pointlist_x(this.body.front_points, this.neck.width/2, this.body.widest_i);
		this.neck.nut_treble = bridge_tr.movedist(-this.strings.mensur, trueangle(bridge_tr, this.neck.joint));
	} else { // Calculate neck width and limit it if too wide
		// console.log("else neck limit");
		this.neck.nut_treble = new Point(this.neck.width_at_nut/2, this.strings.mensur + this.bridge.treble.y);
		this.neck.joint = intersect_pointlist(this.body.front_points, this.neck.nut_treble, bridge_tr);
		this.neck.width = this.neck.joint.x * 2;
		// console.log("neck.width",neck.width, ed.neckwidthlimit);
		if (this.neck.width > this.ed.neckwidthlimit){ // Oops too wide
			// console.log("oops too wide");
			this.neck.width = this.ed.neckwidthlimit;
			this.neck.joint = intersect_pointlist_x(this.body.front_points, this.neck.width/2, this.body.widest_i);
			this.neck.nut_treble = bridge_tr.movedist(-this.strings.mensur, trueangle(bridge_tr, this.neck.joint));
		}
	}
	this.neck.joint_bass = this.neck.joint.scale(-1,1);
	this.neck.treble_angle = trueangle(bridge_tr, this.neck.joint);
	this.neck.thick = 28;
	this.neck.endthick = 21;
	if (this.ed.pegboxstyle=="mandolino") {this.neck.thick = 20;this.neck.endthick = 15;}
	
	this.neck.treble_end = this.neck.nut_treble.movedist(-4.5,this.neck.treble_angle);
	// Neck centerline calculation
	// Find line starting at neck.middle(center of neck at body joint) which is tangential to circle at point O (neck.nut_treble) with radius r=nutwidth/2, at point P1, (center of neck at nut).
	this.neck.middle = new Point(0, this.neck.joint.y); // centerline of lute, y coordinate at neck joint
	
	var d = linelength(this.neck.treble_end, this.neck.middle);
	var r1 = (this.neck.width_at_nut)/2;
	var AP = Math.sqrt(d**2 - r1**2);
	var bob = (AP**2 - r1**2 + d**2)/(2*d);
	var h = Math.sqrt(AP**2 - bob**2);
	var x2 = this.neck.middle.x+bob*(this.neck.treble_end.x-this.neck.middle.x)/d;   
	var y2 = this.neck.middle.y+bob*(this.neck.treble_end.y-this.neck.middle.y)/d; 
	
	this.neck.middle_end = new Point(x2-h*(this.neck.treble_end.y-this.neck.middle.y)/d, 
						        y2+h*(this.neck.treble_end.x-this.neck.middle.x)/d);
	this.neck.middle_angle = trueangle(this.neck.middle, this.neck.middle_end);
	this.neck.nut_angle_deg = trueangle(this.neck.treble_end, this.neck.middle_end)/radtodeg + (this.ed.nutangle||0);
	this.neck.nut_angle = trueangle(this.neck.treble_end, this.neck.middle_end) + (this.ed.nutangle||0)*radtodeg;
	this.neck.bass_end = this.neck.treble_end.movedist(-this.neck.width_at_nut, this.neck.nut_angle);
	// Find actual middle end of neck
	this.neck.middle_end = this.neck.treble_end.avg(this.neck.bass_end).setz(this.guitar ? 16: 18);
	
	// nut bass end based on nut angle&neck centerline
	this.neck.bass_angle = trueangle(this.neck.joint_bass, this.neck.bass_end);
	this.body.neckblock = intersect_pointlist_y(this.body.front_points,this.neck.joint.y-14, this.body.widest_i);
	
	// Neck joint height 
	var neckj = new Point(25,getlast(this.body.front_points).y);
	if (this.ed.bodyshapefrom=="guitar"){
		// console.log("guitar.bodyend",guitar.bodyend,body.middle_points);
		console.log(this.body.middle_points, this.neck.joint.y, this.body.widest_i );
		var inter = intersect_pointlist_y(this.body.middle_points, this.neck.joint.y, this.body.widest_i );
		neckj = inter || neckj;
		// console.log("inter",inter);
		// console.log("neckj",neckj);
		this.guitar.heel = neckj;
		this.guitar.heel_angle = inter.angle || 0;
		this.guitar.heel_end = this.guitar.heel.movedist(-5,this.guitar.heel_angle);
		this.neck.joint_mid = new Point(0, neckj.y+20, 22); // defines neck thickness
	} else {
		neckj = intersect_pointlist_x(this.body.middle_points, this.neck.thick, this.body.widest_i);
		this.neck.joint_mid = new Point(0, neckj.y, neckj.x);
	}
	
	if (this.neck.joint_mid.y < this.neck.joint.y) { // neck joint vertical, calculate thickness
		this.neck.thick = intersect_pointlist_y(this.body.middle_points,this.neck.joint.y, this.body.widest_i ).x;
		this.neck.joint_mid = new Point(0, this.neck.joint.y, this.neck.thick);
	}
	
}
Instrument.prototype.calculate_strings = function(){
	this.strings.bridge_pos = [];
	this.strings.nut_pos = [];
	for (var b of this.strings.spacings.bridge){
		var g = [];
		for (var s of b){
			// stringbandw? strings.spacings.bridgewidth
			g.push(this.bridge.treble.movedist(-s, this.bridge.angle).setz(-7-s*0.02));
		}
		this.strings.bridge_pos.push(g);
	}
	for (var i=0; i < this.strings.spacings.nuts.length; i++){
		var nut = this.strings.spacings.nuts[i];
		if (i==0){
			var treble_near = this.neck.nut_treble;
		} else {
			// Calculate where the bass nut lands
			// from strings.spacings.nuts[i-1].bass_near.move(-8)
			// console.log("nut", strings.spacings.nuts);
			// TODO: make a new getmensur that uses individual editorstates rather than global. Why does this work even a little bit though?
			var dif = Math.abs(getmensur(i) - getmensur(i-1)) / getmensur(0);
			// console.log("dif",i,getmensur(i), dif);
			var nangle = trueangle(this.strings.bridge_pos[i][0], getlast(this.nuts).bass_near.move(2.7-dif*5));
			var treble_near = this.strings.bridge_pos[i][0].movedist(-getmensur(i), nangle).setz(0);
		}
		var nut_angle = i==0 ? this.neck.nut_angle: this.neck.middle_angle-halfpi;
		var b = treble_near.movedist(-getlast(nut)-8, nut_angle);
		var s = [];
		for (var dist of nut){ // string slots
			s.push(treble_near.movedist(-dist-4.5,nut_angle));
		}
		this.strings.nut_pos.push(s);
		this.nuts.push({
			treble_near: treble_near,
			treble_far: treble_near.movedist(-4.5, halfpi+nut_angle),
			middle_near: treble_near.avg(b),
			bass_near: b,
			bass_far: b.movedist(-4.5, halfpi+nut_angle)
		});
	}
}
Instrument.prototype.calculate_frets = function(){
	
	var bridge_tr = this.bridge.treble.movedist(4.5,this.bridge.angle);
	this.neck.frets_treble = calcfrets(linelength(bridge_tr, this.neck.nut_treble),0,12);
	this.neck.frets_bass = calcfrets(linelength(getlast(this.strings.bridge_pos[0]), getlast(this.strings.nut_pos[0])),0,12);
	this.neck.frets_lines = [];
	var b_angle = trueangle(getlast(this.strings.bridge_pos[0]),getlast(this.strings.nut_pos[0]));
	for (var i=0; i<this.neck.frets_treble.length; i++){
		var tr = this.neck.nut_treble.movedist(this.neck.frets_treble[i], this.neck.treble_angle);
		var ba = getlast(this.strings.nut_pos[0]).movedist(this.neck.frets_bass[i], b_angle);
		if (ba.y < this.neck.joint.y){ // Shorter frets on body
			var ba_i = intersectline(tr, ba, this.neck.joint_bass, this.neck.nut_treble.movedist(this.neck.frets_treble[12], this.neck.treble_angle).move(0,-20), true);
		} else { // Normal length, find point on bass edge of neck
			var ba_i = intersectline(tr, ba, this.neck.joint_bass, this.neck.bass_end, true);
		}
		this.neck.frets_lines.push([tr,ba_i]);
	}
}
Instrument.prototype.calculate_pegbox = function(){
	if (this.ed.pegboxstyle=="theorbo"){
		this.pegbox.spacing = 14;
	} else {
		this.pegbox.spacing = 11.5;
	}
	
	if (this.ed.singlestrings){
		this.pegbox.pegs = this.ed.fingerboardcourses;
		var plength = 20+10+this.pegbox.spacing*this.pegbox.pegs;
	} else {
		this.pegbox.pegs = this.ed.fingerboardcourses*2-this.ed.chanterelles;
		var plength = 20+10+this.pegbox.spacing*this.pegbox.pegs;
	}
	this.pegbox.start_treble = this.neck.treble_end.movedist(-3.5, this.neck.nut_angle).setz(5);
	this.pegbox.start_bass = this.neck.bass_end.movedist(3.5, this.neck.nut_angle).setz(5);
	this.pegbox.start_angle = this.neck.nut_angle;
	if (this.ed.pegboxstyle=="theorbo"){
		this.pegbox.style = "theorbo";
		// Calculate extension end points (3d!)
		var a = trueangle(this.bridge.bass, getlast(this.nuts).middle_near);
		this.pegbox.end_bass = getlast(this.nuts).middle_near.movedist(-105,a).setz(55);
		this.pegbox.end_treble = this.pegbox.end_bass.movedist(25,this.neck.middle_angle-halfpi);
		this.pegbox.slot_treble = this.pegbox.start_treble.movedist(35, this.neck.treble_angle); // joint
		this.pegbox.slot_bass = this.pegbox.start_bass.movedist(35, this.neck.bass_angle);
		this.pegbox.angle_treble = trueangle(this.pegbox.start_treble,this.pegbox.end_treble);
		this.pegbox.angle_bass = trueangle(this.pegbox.start_bass,this.pegbox.end_bass);
		this.pegbox.angle_side = trueangle(this.pegbox.start_treble.zy(),this.pegbox.end_treble.zy());
		this.pegbox.angle_front = (trueangle(this.pegbox.start_treble, this.pegbox.end_treble) + trueangle(this.pegbox.start_bass, this.pegbox.end_bass))/2; // angle of middle line of extension
		this.pegbox.back_endp = this.pegbox.end_treble.zy().move(17);
		this.pegbox.back_startp = this.pegbox.start_bass.zy().move(22,10);
		// Correctify treble end
		this.pegbox.end_treble = this.pegbox.end_bass.movedist(25,this.pegbox.angle_front-halfpi);
		// Move start points upwards for stronger joint Area
		
		// lower this.pegbox hole
		this.pegbox.hole = {};
		plength = plength + Math.abs(this.pegbox.start_treble.y-this.pegbox.start_bass.y);
		this.pegbox.hole.start_treble_top = this.pegbox.start_treble.movedist(-8,this.neck.nut_angle).movedist(-15, this.pegbox.angle_treble);
		this.pegbox.hole.end_treble_top = this.pegbox.hole.start_treble_top.movedist(-plength,this.pegbox.angle_treble);
		this.pegbox.hole.start_bass_top = this.pegbox.start_bass.movedist(20,this.neck.nut_angle).movedist(-15, this.pegbox.angle_bass);
		var b2 = this.pegbox.hole.start_bass_top.movedist(-plength,this.pegbox.angle_bass);
		var b22 = this.pegbox.hole.end_treble_top.movedist(100,this.pegbox.angle_front-halfpi);
		this.pegbox.hole.end_bass_top = intersectline(this.pegbox.hole.end_treble_top, b22,	  this.pegbox.hole.start_bass_top, b2 ,true) || b2;
		// Peg locations
		this.pegbox.first_peg = this.pegbox.start_bass.movedist(-30,this.pegbox.angle_bass).setz(17);
		
		// Foldable extension
		var extbacksideangle = trueangle(this.pegbox.start_bass.zy(),this.pegbox.end_bass.zy());
		this.pegbox.extlen = linelength(this.neck.joint_mid, this.pegbox.end_treble);
		// console.log("this.pegbox.extlen", this.pegbox.extlen);
		if (this.ed.foldable){
			var fold = {};
			
			fold.hingelen = this.pegbox.extlen/2;
			// TODO: Horizontal line showing folding length only in normal drawing mode
			// TODO: This calculates hinge position wrong
			var hy = this.neck.joint_mid.y + fold.hingelen; // hinge y
			// Limit hinge position by this.pegbox cutaway size
			var limitedy = this.pegbox.start_treble.y+plength+90;
			if (limitedy > hy){hy=limitedy;}
			// console.log(hy);
			// Find location of hinge
			fold.hinge_treble = line_x_from_y(this.pegbox.end_treble,this.pegbox.start_treble, hy);
			fold.hinge_bass = intersectline(fold.hinge_treble,
						fold.hinge_treble.movedist(100, this.pegbox.angle_front-halfpi),
						this.pegbox.end_bass,
						this.pegbox.start_bass, true);
			// Set hinge point z coordinates 
			fold.hinge_treble = fold.hinge_treble.setz(line_x_from_y(this.pegbox.back_endp,this.pegbox.back_startp,this.pegbox.end_treble.zy(),fold.hinge_treble.y).x);
			fold.hinge_bass = fold.hinge_bass.setz(line_x_from_y(this.pegbox.back_endp,this.pegbox.back_startp,fold.hinge_bass.y).x);
			
			// Find hinge joint shape points
			var p1 = fold.hinge_bass.zy().movedist(5,extbacksideangle);
			var p2 = p1.movedist(10, this.pegbox.angle_side+Math.PI/2);
			var pa = p1.movedist(55,extbacksideangle);
			var pb = p2.movedist(55,this.pegbox.angle_side);
			var p3 = p2.movedist(70,this.pegbox.angle_side);	
			var p4 = p3.movedist(100,this.pegbox.angle_side+Math.PI/2);
			var p4 = intersectline(p3, p4,   this.pegbox.start_bass.zy(), this.pegbox.end_bass.zy(), true);
			fold.split_points = [p4,p3,p2,p1];
			
			// Find split line between lower part of extension and upper
			fold.split_bass = line_x_from_y(this.pegbox.start_bass,this.pegbox.end_bass, p4.y);
			var guess = fold.split_bass.movedist(100,this.pegbox.angle_front-halfpi);
			fold.split_treble = intersectline(this.pegbox.start_treble,this.pegbox.end_treble, fold.split_bass, guess, true);
			this.pegbox.fold = fold;
		}
		
	} else if (this.ed.pegboxstyle == "guitar") { // Flat, with shaped edge
		// Calculate length at least, but maybe mostly a job for drawing fucntions
		// e.g. GiorgioSellas1624 --> check if this.ed.pegboxstyle is in list of guitar styles
		// TODO: make list of guitar this.pegbox shapes
		
	} else if (this.ed.pegboxstyle == "carved") { // Carved like violin
		// Calculate 3D points
		
	} else if (this.ed.pegboxstyle == "preset") { // Load baked svg path 
		//and don't calcualte anything

	} else { // else this.pegbox style = renaissance
		var wideblocklength = 18;
		var endblocklength = 12;
		// var spacing = 11.5; // for holes
		var wideblockheight = 21;
		var endblockheight = 16;
		var endblockwidth = 20;
		var pangle_deg = pangle_deg || 8;
		var pangle = pangle_deg * radtodeg; // Convert 8 deg to radians. this.pegbox angle.
		var plength = wideblocklength+endblocklength+this.pegbox.spacing*(this.pegbox.pegs+0.5);
		// Substyles and their calculations
		if (this.ed.pegboxstyle=="chanterelle"){
			this.pegbox.style = "chanterelle";
			this.pegbox.chanterellestart = this.pegbox.start_treble.movedist(5, );
		} else if (this.ed.pegboxstyle=="bassrider"){	
			this.pegbox.style = "bassrider";
		} else {
			this.pegbox.style = "renaissance";
		}
		
		var slot_low = this.neck.middle_end.movedist(wideblockheight, this.neck.middle_angle).setz(5);
		this.pegbox.slot_treble = this.pegbox.start_treble.movedist(wideblockheight, this.neck.middle_angle); // joint
		this.pegbox.slot_bass = this.pegbox.start_bass.movedist(wideblockheight, this.neck.middle_angle);
		var end_low = slot_low.movedist(plength*Math.sin(pangle), this.neck.nut_angle-halfpi).setz(5+plength*Math.cos(pangle));
		this.pegbox.low_bass = end_low.movedist(-endblockwidth/2, this.neck.nut_angle);
		this.pegbox.low_treble = end_low.movedist(endblockwidth/2, this.neck.nut_angle);
		var end_mid = end_low.movedist(endblockheight*Math.cos(pangle), this.neck.nut_angle-halfpi).setz(end_low.z-endblockheight*Math.sin(pangle));
		this.pegbox.end_bass = end_mid.movedist(-endblockwidth/2, this.neck.nut_angle);
		this.pegbox.end_treble = end_mid.movedist(endblockwidth/2, this.neck.nut_angle);
		// Hole
		this.pegbox.hole = {};
		// Hole this.neck start points on top
		this.pegbox.hole.start_treble_top = this.pegbox.start_treble.movedist(-9,this.neck.nut_angle).setz(5);
		this.pegbox.hole.start_bass_top = this.pegbox.start_bass.movedist(9,this.neck.nut_angle).setz(5);
		
		// Hole small end points on top
		var mia = trueangle(this.neck.middle_end.setz(5).zy(), end_mid.zy());
		var hole_mid = end_mid.movedist(endblocklength*Math.cos(mia), this.neck.nut_angle-halfpi).setz(end_mid.z+endblocklength*Math.sin(mia));
		
		this.pegbox.hole.end_treble_top = hole_mid.movedist(5, this.neck.nut_angle);
		this.pegbox.hole.end_bass_top = hole_mid.movedist(-5, this.neck.nut_angle);
		
		// Hole bottom inside points at small end
		var hole_bot = slot_low.movedist((plength-endblocklength)*Math.sin(pangle), this.neck.nut_angle-halfpi).setz(5+(plength-endblocklength)*Math.cos(pangle));
		hole_bot = hole_bot.movedist(2*Math.cos(pangle), this.neck.nut_angle-halfpi).setz(hole_bot.z-2*Math.sin(pangle));
		this.pegbox.hole.end_treble_bottom = hole_bot.movedist(5, this.neck.nut_angle);
		this.pegbox.hole.end_bass_bottom = hole_bot.movedist(-5, this.neck.nut_angle);
		// wide block
		var block_mid = slot_low.movedist(wideblocklength*Math.sin(pangle), this.neck.nut_angle-halfpi).setz(5+wideblocklength*Math.cos(pangle));
		block_mid = block_mid.movedist(2*Math.cos(pangle), this.neck.nut_angle-halfpi).setz(block_mid.z-2*Math.sin(pangle));
		// Points of wide block touching this.neck joint
		this.pegbox.hole.block_start_treble = this.pegbox.hole.start_treble_top.movedist(-wideblockheight+2, this.neck.nut_angle-halfpi);
		this.pegbox.hole.block_start_bass = this.pegbox.hole.start_bass_top.movedist(-wideblockheight+2, this.neck.nut_angle-halfpi);
		// Wide block end on the inside
		this.pegbox.hole.block_treble_bottom = this.pegbox.hole.block_start_treble.vectormove(wideblocklength, this.pegbox.hole.end_treble_bottom);
		this.pegbox.hole.block_bass_bottom = this.pegbox.hole.block_start_bass.vectormove(wideblocklength, this.pegbox.hole.end_bass_bottom);
		// Wide block end at middle height inside this.pegbox
		// Yaw = angle around y
		// Pitch angle around x
		this.pegbox.hole.block_treble_mid = this.pegbox.hole.block_treble_bottom.move3d(this.neck.nut_angle-halfpi,pangle-halfpi,-wideblocklength*0.5);
		this.pegbox.hole.block_bass_mid = this.pegbox.hole.block_bass_bottom.move3d(this.neck.nut_angle-halfpi,pangle-halfpi,-wideblocklength*0.5);
		
		this.pegbox.test = this.pegbox.start_bass.vectormove(20,this.pegbox.end_bass);
		// this.pegbox.hole.block_treble_mid = this.pegbox.hole.block_start_treble.move3d (yaw, pitch, wideblocklength);
		
		// peg holes
		this.pegbox.angle_side = (trueangle(this.pegbox.slot_bass.zy(),this.pegbox.low_bass.zy())+trueangle(this.pegbox.start_bass.zy(),this.pegbox.end_bass.zy()))/2;
		var hmid = this.pegbox.slot_bass.avg(this.pegbox.start_bass,0.53);
		var bl = wideblocklength+9;

		var bsa = trueangle(this.pegbox.slot_bass, this.pegbox.low_bass);
		var flatlen = flatlinelength(this.pegbox.slot_bass, this.pegbox.low_bass);
		var truelen = linelength(this.pegbox.slot_bass, this.pegbox.low_bass);
		var shortnd = (bl*flatlen)/truelen;
		
		this.pegbox.first_peg = hmid.move(-shortnd*Math.sin(bsa), 
									 -(shortnd)*Math.cos(bsa),
									 bl*Math.cos(pangle));
		
		// where middle of this.neck intersects back of this.pegbox
		this.pegbox.slot_farside = intersectline(this.neck.joint_mid.zy(), this.neck.middle_end.zy(),  this.pegbox.low_treble.zy(), this.pegbox.slot_treble.zy() ); // in XY = ZY sideview coordinates already
		var zy = intersectline(this.neck.joint_mid.zy(), this.neck.middle_end.zy(),  this.pegbox.low_treble.zy().avg(this.pegbox.low_bass.zy()), this.pegbox.slot_treble.zy().avg(this.pegbox.slot_bass.zy()) );
		// Find X
		var x = line_x_from_y(this.neck.joint_mid, this.neck.middle_end, zy.y);
		this.pegbox.slot_middle = new Point(x.x, zy.y, zy.x);
	}
	
}
Instrument.prototype.calculate_bars = function(){
	
	var bars = [];
	if (this.ed.bodyshapefrom=="guitar"){
		var L = this.body.height;
		var div = this.body.height/10;
		bars[0] = {type:"normal",pos:L/4+div+this.ed.bridgeoffset,thickness:4.0,height:12};
		bars[1] = {type:"normal",pos:2*L/3-50,thickness:5,height:19};
		this.body.rosette = new Point(0, 2*L/3);
		bars[2] = {type:"rosette",pos:this.body.rosette.y};
		bars[3] = {type:"normal",pos:2*L/3+50,thickness:5,height:17};
		bars[4] = {type:"normal",pos:2*L/3+50+div,thickness:4.0,height:12};
	} else { // Lutes
		var div = this.body.height/9;
		bars[0] = {"type":"bassbar","pos":(div*2)/3};
		bars[1] = {type:"normal",pos:div*2,thickness:4.5,height:12};
		bars[2] = {type:"normal",pos:div*3,thickness:4.5,height:12};
		bars[3] = {type:"normal",pos:div*4,thickness:4.8,height:20};
		this.body.rosette = new Point(0, div*5);
		bars[4] = {type:"rosette",pos:this.body.rosette.y,thickness:3.0,height:12};
		bars[5] = {type:"normal",pos:div*6,thickness:4.5,height:17};
		// The placement of the last few bars depend on neckjoint position in lutes
		var dist = Math.abs(this.body.neckblock.y-bars[5].pos)/3;
		bars[6] = {"type":"normal","pos":div*6+dist,thickness:4.0,height:14};
		bars[7] = {"type":"normal","pos":div*6+dist*2,thickness:4.0,height:12};
	}

	for(bar of bars) {
		// console.log("bar.pos",bar.pos);
		bar.end = intersect_pointlist_y(this.body.front_points, bar.pos);
		if (bar.type=="rosette") {
			if (this.ed.bodyshapefrom=="guitar"){
				this.body.rosette.width = 0.01*this.ed.rosettescale*bar.end.x/2.45;
			} else {
				this.body.rosette.width = 0.01*this.ed.rosettescale*bar.end.x/3;
			}
		}
	}
	this.body.bars = bars;
}
Instrument.prototype.calculate_endclasp = function(){
	var body = this.body;
	var bulge = this.ed.bulge;
	var endclasp = {};
	// Endclasp SVG shape precalculated, sideview
	endclasp.height = body.depth * 0.3;
	// Follow body shape until height
	
	// Endclasp SVG shape precalculated, cross view
	// endclasp.crossshape = [new Point(0,endclasp.height)];
	endclasp.shape = [];

	
	var centertip = null;
	// 3D calculation
	try {
	// cut rib joints at endclasp height to get middle portion
	
	for (var r=0; r < body.ribjoints.length; r++){
		var i = 1;
		while (i < body.ribjoints[r].length 
				&& body.ribjoints[r][i].z < endclasp.height){
			i++;
		}
		if (this.body.ribjoints[r][i]){ 
			var p = line_from_z(body.ribjoints[r][i-1],
								body.ribjoints[r][i], 
								endclasp.height);
			// if (p.x < body.width*0.45) {
			if (p.x < body.width*0.25) {
				// Corner rib chosen by excluding ones that are too far
				if (endclasp.shape.length==0){
					endclasp.shape.push(p.setx(0));
				}
				endclasp.shape.push(p);
				centertip = p;
			}
		}
	}
		
	} catch(e){console.log(r,i, e);}
	
	var incline_start = new Point(getlast(endclasp.shape).y,endclasp.height-5);
	// var incline_end = new Point(body.widestp.y*0.65, endclasp.height*0.6);
	var incline_end = new Point(this.bridge.middle.y*1.1, endclasp.height*0.6);
	var incl_m = (incline_start.y-incline_end.y)/(incline_start.x-incline_end.x);
	
	var start_i = intersect_pointlist_y(body.front_points, incline_start.x);
	var end_i = intersect_pointlist_y(body.front_points, incline_end.x);
	
	function incline(y){
		// return height of plane at given y
		var z = incl_m*(y - incline_start.x) + incline_start.y;
		// Points given in x,y. actually working in y,z
		return z;
		
	}
	function incline_x (i){
		var w = body.front_points[i].x;
		var h = body.middle_points[i].x;
		var z = incline(body.front_points[i].y)
		var x = shell_x (w, h, bulge, z);
		return p = new Point(x, body.front_points[i].y, z);
	}
	function shell_x_from_iz(i,z){
		var w = body.front_points[i].x;
		var h = body.middle_points[i].x;
		var x = shell_x (w, h, bulge, z);
		return p = new Point(x, body.front_points[i].y, z);
	}
	// Do the little corner by interpolating the small change in y and drawing some points along an arc in x,z. Later do the large arc in y,z.
	
	var center_arc_end = incline_x(start_i.i);
	// var center_arc_end = new Point(start_i.x, start_i.y, incline(start_i.y));
	// starts at centertip, ends at incline_start
	var hd = centertip.z - center_arc_end.z;

	for (var i=1; i<10; i++){
		var x = centertip.x + (i-0.75) * (center_arc_end.x - centertip.x) / 10;
		var y = centertip.y + (i-0.75) * (center_arc_end.y - centertip.y) / 10;
		var z = centertip.z - ((hd)**2-(centertip.x+hd-x)**2)**0.5;
		// TODO: Figure out y based on x and z
		var p = new Point(x, y, z);
		endclasp.shape.push(p);
	}
	
	// Along the inclined plane portion of the endclasp
	// Find points based on theoretical shell shape, per every y coordinate
	for (var i=start_i.i+1; i < end_i.i; i++){
		var p = incline_x(i);
		endclasp.shape.push(p);
	}
	
	// do the large arc in y,z like the smaller arc above
	
	
	// var corner1 = intersect_pointlist_y(body.front_points, incline_end.x);
	// corner1 = shell_x_from_iz(corner1.i, incline_end.y);
	var corner1 = getlast(endclasp.shape);
	var corner2 = intersect_pointlist_y(body.front_points, corner1.y+15);
	corner2 = shell_x_from_iz(corner2.i, corner1.z*0.5);
	var endclasp_tip = intersect_pointlist_y(body.front_points, corner2.y+10);
	
	// Find points on frontpoints under endclasp
	endclasp.sb_edge = [];
	for (var i=0; i<endclasp_tip.i; i++){
		endclasp.sb_edge.push(body.front_points[i].setz(0));
	}
	endclasp_tip = endclasp_tip.setz(0);
	
	var c = corner1.zy().avg(corner2.zy());
	var a1 = trueangle(c, corner1.zy());
	var a2 = trueangle(c, corner2.zy());
	var ad = (a2-a1)/30;
	var r = 0.5*linelength(corner1.zy(),corner2.zy());
	
	for (var i=1; i<=30; i++){
		// Place points along ellipse in z,y and find x from shell
		var p = c.movedist(r,a2-ad*i);
		var ip = intersect_pointlist_y(body.front_points, p.y);
		// var w = body.front_points[ip.i].x;
		// var h = body.middle_points[ip.i].x;
		var w = intersect_pointlist_y(body.front_points, p.y).x;
		var h = intersect_pointlist_y(body.middle_points, p.y).x;
		var x = shell_x (w, h, bulge, p.x);
		
		var p = new Point(x, p.y, p.x);
		// console.log("middle corner ",p);
		endclasp.shape.push(p);
	}
	
	
	endclasp.shape.push( /* corner2, */ endclasp_tip);
	
	
	this.body.endclasp = endclasp;
}
Instrument.prototype.choose_body = function(){
	
	try { // Obtain body shapes
		if (this.ed.bodyshapefrom == "fromlist"){
			this.bodyname = this.ed.bodyshapefromlist || "venere";
			this.shapes.front = get_body_shape(this.bodyname, "front");
			if (this.ed.usesideasmiddle){
				this.shapes.middle = get_body_shape(this.bodyname, "front");
			} else {
				this.shapes.middle = get_body_shape(this.bodyname, "middle");
			}
			if (this.ed.usesideasmiddle){
				this.shapes.middle = get_body_shape(this.bodyname, "front");
			} else {
				this.shapes.middle = get_body_shape(this.bodyname, "middle");
			}

		} else if (this.ed.bodyshapefrom == "guitar") { // Guitar mode
			var guitar = {};
			this.bodyname = this.ed.guitarfromlist || "JeanVoboam1687";
			this.shapes.front = get_body_shape(this.bodyname, "guitar");
			// create mid. It is either a straight line or an arc
			var bodylength = this.shapes.front.getBBox().height;
			// TODO: Middle shape should be made of relative segments probably?
			var startp = new Point(this.ed.guitardepth,0);
			var endp = new Point(this.ed.guitardepth-bodylength*Math.tan(this.ed.guitarangle*radtodeg),bodylength);
			// TODO: change sign above maybe
			var endpp = new Point(0,endp.y);
			// console.log(startp,endp, endpp,bodylength);
			if (this.ed.guitarroundl > 0) { // Round back
				var arcend = arclinedev(startp,endp, this.ed.guitarroundl,true, 10);
				// console.log(arcend);
				var shape = [new Point(0,0),startp].concat(arcend,[endpp]);
				// console.log("shape",shape);
				this.shapes.middle = drawshape(drawing,shape,THINSTYLE,this.ed.guitarfromlist+"-middle");
				
			} else {
				// Straight, perhaps angled, back
				this.shapes.middle = drawshape(drawing,[new Point(0,0),startp, endp, endpp],THINSTYLE,this.ed.guitarfromlist+"-middle");
			}
			scalepath(this.shapes.middle, -1, 1); // Flip because lute bodies are also defined in negative X
			// delel(getelid(ed.guitarfromlist+"-middle"));
			guitar.bodyend = endp;
			this.guitar = guitar;  
			
		} else { // Classical construction
			// TODO: this
			this.bodyname = "generated";
			var shapes = makeclassicalpreset();
			this.shapes.front = this.shapes.side;
			this.shapes.middle = this.shapes.middle;
		}
		
		// Get points for body shapes
		var frontpoints = getpoints_new(this.shapes.front,undefined,false);
		this.body.front_points = frontpoints.points;
		// console.log("front points",body.front_points );
		
		this.body.middle_points = getpoints_new(this.shapes.middle,frontpoints.Y,false).points;
		// console.log("mid points",body.middle_points );

		// if (body.front_points.length != body.middle_points.length) {
			// console.log("Body shape point list lengths don't match!");
		// }
		// Apply body scale to pointlist
		// TODO: These don't match perfectly in y coords even though they should. Maybe use get_matching_points()?
		this.body.front_points = scale_pointlist(this.body.front_points, this.ed.bodyscale||1);
		this.body.middle_points = scale_pointlist(this.body.middle_points, this.ed.bodyscale||1);
		
		if (this.ed.deepenbody > 0.0){
			// Rotate middle_points around last point by degrees
			// var firstp = this.body.middle_points[0].move(0,0);
			this.body.middle_points = rotate_pointlist(this.body.middle_points, this.ed.deepenbody, getlast(this.body.middle_points));
			// put first point back at z=0
			this.body.middle_points[0] = new Point(0,0);
		}
		
		
		if (this.ed.bodyshapefrom == "guitar") { // Delete side drawing
			delel(this.shapes.middle);
		}
	} catch(e){
		console.log("Instrument body shape creation failed:");
		console.log(e);
	}
	
	// console.log("guitar",guitar, this.guitar);
	// Information about instrument shape
	this.body.bouts = get_bouts(this.body.front_points);
	// console.log("body_bouts", body.bouts );
	var widest_b = 0;
	for (var i=0; i< this.body.bouts.length;i++){
		if (this.body.bouts[i].x > this.body.bouts[widest_b].x) widest_b = i;
	}
	this.body.widestp = this.body.bouts[widest_b];
	this.body.widest_i = this.body.bouts[widest_b].i;
	this.body.width = this.body.widestp.x * 2; // shapes.front.getBBox().width * 2;
	this.body.height = getlast(this.body.front_points).y; // shapes.front.getBBox().height;
	this.body.depth = get_bouts(this.body.middle_points)[0].x; // shapes.middle.getBBox().width;
	this.body.number_of_ribs = this.ed.numberofribs;
	
}
// 3D lute calculations
Instrument.prototype.calculate_lutecircumference = function(yi){ // curve length
	// Calculate length of theoretical shell curve at given y coordinate
	// Ypoints, side, middle, at,accur
	// Returns circumference of half of body at given X coordinate, approximated by breaking the cross section curve into line segments. Also calculates points along the curve for later use.
	// Also returns points X,Z along the curve
	var width = this.body.front_points[yi].x,
		height = this.body.middle_points[yi].x,
		x=0,
		circumference=0,
		distances = [0], // Records distances between this and last point
		crosspoints = []; // Records where the curve was sampled, used for drawing the curve
		accur = 0.1;
	
	var p = this.ed.bulge || 2.0; // bulging of circle editorstate.bulge
	var last_accur = 1.0;
	// console.log(width, height);
	while (x <= width) {
		// Put new Z height in Zpoints
		var g = -(1/(width*width)) * (x*x) +1;
		var f = (Math.abs((1-g)*width + (g*height))**p - Math.abs(x)**p)**(1/p);
		// Zpoints.push(f);
		// Xpoints.push(x);
		crosspoints.push(new Point(x,f));
		// Calculate distance traveled
		if (crosspoints.length > 1){
			var dist = linelength(getlast(crosspoints), penult(crosspoints));
			// var dist = Math.sqrt((Zpoints[i]-Zpoints[i-1])**2+
								 // (Xpoints[i]-Xpoints[i-1])**2);
			circumference += dist;
			distances.push(dist);
		}
		if (x < 1.0+accur ){
			x += accur;
		} else {
			// Vary x interval based on slope of curve
			var angle = Math.abs(Math.atan((penult(crosspoints).y-getlast(crosspoints).y)
									/(last_accur)));

			last_accur = accur * Math.cos(angle)
			x += last_accur;
		}
		// console.log(x, circumference);
	}
	// Add final point at lute edge
	crosspoints.push(new Point(width,0));
	
	// And then calculate last segment length
	circumference += linelength(getlast(crosspoints), penult(crosspoints));
	console.log("Lute",this.i_number,"circumference", circumference, Math.PI*0.5*width);
	// Save for later
	this.body.circumference = circumference;
	this.body.crossdistances = distances; // TODO: used anywhere?
	this.body.crosspoints = crosspoints; 
}
Instrument.prototype.calculate_ribcorners = function(yi){ // rib corners
	var ribadd = this.ed.lastribadd || 0.0; 
	var numberofribs = this.ed.numberofribs;
	var circumference = this.body.circumference;
	var ribwidth = (circumference-ribadd) / (numberofribs/2);
	
	var ribdists = [ribwidth/2];
	var fullribs = Math.floor(numberofribs/2);
	
	for (var i=1; i<fullribs; i++){
		ribdists.push(ribdists[i-1]+ribwidth);
	}
	
	var rib = 0;
	var i = 1;
	var traveled = 0;
	var angles = [];
	var endpoints = []; // rib corners on lute shell
	// console.log("ribdists",ribdists);
	while (rib <= fullribs && traveled < circumference){
		// Travel along the cross-section
		traveled += this.body.crossdistances[i];
		if (traveled > ribdists[rib]){
			endpoints.push(this.body.crosspoints[i]);
			var angle = Math.atan(this.body.crosspoints[i].x/ this.body.crosspoints[i].y);
			angles.push(angle);
			rib++;
		}
		i++;
	}

	endpoints.push(getlast(this.body.crosspoints)); // Soundboard edge, last rib edge
	
	this.body.endpoints = endpoints;
	this.body.angles = angles; // Angles from center point, usually not actual angles
	// console.log("angles",angles);
	// console.log("endpoints",endpoints);
}
Instrument.prototype.calculate_ribstarts = function(){
	var ribstarts = [];
	var ribstartsmid = [];
	var ribangles = [];
	var endpoints = this.body.endpoints;
	var ribspread = this.ed.ribspread!==undefined? this.ed.ribspread:0;
	// console.log("Lute",this.i_number,"ribspread:",ribspread);
	function perpendicular(r1, rd){ // get perpendicular for rib
		// r1 = which rib joint point to use
		// rd = which rib's angle to use; this, or the next one (0 or 1 makes sense)
		if (r1==0 && rd == 0){ // center rib outer perpendicular is at 90deg
			return endpoints[0].sety(0);
		} else {
			var a = trueangle(endpoints[r1-1+rd], endpoints[r1+rd]) + halfpi;
			var p2 = endpoints[r1].movedist(100,a);
			var p3 = line_x_from_y(endpoints[r1],p2, 0);
			if (p3.x < 0) var p3 = p3.setx(0);
			return p3;
		}
		
	}
	this.body.ribs_same_point = false;
	// if body is deeper than it is wide, put rib end center at depth-width above origin
	if (this.body.depth > this.body.widestp.x){
		var riborigin = new Point(0, this.body.depth - this.body.widestp.x)
		// and all ribs terminate at that same point
		// TODO: Or they can terminate lower if needed
		for (var i = 0; i < this.body.endpoints.length-1; i++){
			ribstartsmid.push(riborigin.move(0));
		}
		this.body.ribs_same_point = true;
	} else {
		var riborigin = new Point(0,0);
		var clump = null;
		var tight = false;
		// find last ribs near perpendicular point, propose evenly spaced rib starts for each rib
		// console.log("Lute",this.i_number, "perp",perpendicular(this.body.endpoints.length-2,0));
		// console.log("Lute",this.i_number, "perp",perpendicular(this.body.endpoints.length-2,1));
		var farthest = perpendicular(this.body.endpoints.length-2,0);
		var nearest = perpendicular(this.body.endpoints.length-2,1);
		// console.log("Last rib nearest perp:",nearest.x, "farthest:", farthest.x);
			
		// ribspread affects where between last ribs possible rib starts its start is picked
		var lastp = new Point(ribspread*(farthest.x-nearest.x), 0);	
		// console.log("Lute",this.i_number, "lastp",lastp);	
		
		// Propose previous ribs startpoints evenly along edge
		var tempstarts = [];
		for (var r = 0; r < this.body.endpoints.length; r++){
			ribstarts.push(new Point((r+0.5)*(lastp.x/(this.body.endpoints.length-1.5)), 0));
			tempstarts.push(new Point((r+0.5)*(lastp.x/(this.body.endpoints.length-1.5)), 0));
		} 
		
		// if proposed point is outside perpendiculars, use nearest perpendicular point
		for (var r = 0; r < ribstarts.length-1; r++){
			var perp1 = perpendicular(r,0);
			var perp2 = perpendicular(r,1);
			// console.log("perps",r,perp1,perp2);
			var midp = perp2.avg(perp1, ribspread);
			ribstartsmid.push(midp);
		} 
		// ribstartsmid adjustment only. if x<previous, try to move right by distance to previous, but clamp to far perp
		// Evenly space remaining ribs between first crossing and max perp of last rib
		// console.log("adjusting ribstartsmid");
		// Find clump
		var clump = false;
		for (var r=1; r<ribstartsmid.length; r++){
			if (ribstartsmid[r].x < ribstartsmid[r-1].x) {var clump = r-1; break;}
		}
		// Clump point should also be adjustable by ribspread, maybe by half?
		// var clumpp = perpendicular(clump+1,1).avg(ribstartsmid[clump+1], ribspread);
		if (clump){
			// Space ribs before clump evenly
			var clumpx = ribstartsmid[clump].x;
			for (var r = 0; r < clump; r++){
				ribstartsmid[r] = ribstartsmid[r].setx((r+0.5)*(clumpx/(clump+0.5)));
			}
			// Space ribs after clump evenly
			var dif = (lastp.x-ribstartsmid[clump+1].x)/(ribstartsmid.length-clump-1);
			if (dif<0) dif=0;
			for (var r=clump; r<ribstartsmid.length; r++){
				// var dif = ribstartsmid[r-1].x - ribstartsmid[r].x;
				
				ribstartsmid[r] = ribstartsmid[clump].move(dif*(r-clump));
				// console.log("mid moved",r, dif*(r-clump));
				

			}
			// Move clump rib to between neighbors
			ribstartsmid[clump] = ribstartsmid[clump-1].avg(ribstartsmid[clump+1]);
		} else {
			// Just spread all evenly
			// console.log("Lute",this.i_number, "Spread evenly");
			for (var r = 0; r < ribstartsmid.length; r++){
				ribstartsmid[r] = ribstartsmid[r].setx((r+0.5)*(lastp.x/(ribstartsmid.length+0.5)));
			}
		}
	}
		// Each rib's end must be between shell perpendicular instersections with soundboard
	
	// console.log("Lute",this.i_number,"ribstarts",ribstarts);
	if (ribstartsmid.length==0){// Add zero origin if other methods failed
		console.log("Lute",this.i_number,"rib spread failed, added zeros");
		for (var i = 0; i < this.body.endpoints.length-1; i++){
			ribstartsmid.push(new Point(0,0));
		}
	}
	// Calculate angles for ribs
	for (var r=0; r < ribstartsmid.length; r++ ){
		ribangles.push(trueangle(ribstartsmid[r], this.body.endpoints[r]));
		// Calculate rib start point y coordinate but confusingly store it as z
		var p = intersect_pointlist_x(this.body.front_points, ribstartsmid[r].x,0);
		ribstartsmid[r] = ribstartsmid[r].setz(p.y);
	}
	console.log("ribstartsmid",ribstartsmid);
	this.body.ribstarts = ribstartsmid;
	// this.body.ribstartsmid = ribstartsmid;
	// this.body.tempstarts = tempstarts;
	this.body.clumprib = clump;
	this.body.ribangles = ribangles;
}
Instrument.prototype.calculate_lutebody = function(){ // ribjoints in 3D
	var accur = 0.001;// accuracy of cross section calculation
	var ribjoints = [];
	
	// Calculate actual first point y-positions based on ribstarts intersecting edge
	var firstp = {i:0};
	for (var r=0; r<this.body.ribangles.length; r++){
		// Get intersect plane function values for each rib joint
		firstp = intersect_pointlist_x(this.body.front_points, 
									   this.body.ribstarts[r].x, firstp.i);
		ribjoints.push([firstp.setz(this.body.ribstarts[r].y)]);
		// ribjoints.push([this.body.ribstarts[r]]);
	}
	// Calculate data representing rib joint planes
	var planedata = [];
	var length = getlast(this.body.front_points).y;
	
	function calc_plane(body, w, a){
		var k = w / (length-body.ribstarts[a].z);
		var X_aw = w - k * body.widestp.y; // ==> x coord low
		var X_bw = body.endpoints[a].x - X_aw; // ==> x coord high
		var m = body.endpoints[a].y / X_bw; // line function slope calculated at widestp
		
		return {k:k, w:w, m:m};
	}
	
	var debug = [];
	var debugribstart = [];
	var debugcor = [];
	for (a=0; a<this.body.ribangles.length; a++){ // For each rib joint
		
		// calculate 3d plane function values for each rib joint
		// x = body length - k*y , where k is some constant value k=w/l
		// k = ribstart x / length ratio
		// k * widest y = ribstart to body tip line crosses widest point at this x
		// X_aw = difference between ribstart and crossing at widest point
		// X_bw = ribjoint x at widest point on shell moved left by X_aw
		// TODO: So also calculate same difference for y coordinate of ribstart. Or calculate virtual ribstart point on z=0 if ribstart is actually higher
		
		// x = w-(w/l)*y // w= rib joint start distance from 0,0,0 along x axis
		// Calculate where ribstart-endpoint line meets soundboard if it is actually higher
		var ribx = this.body.ribstarts[a].x;
		if (this.body.ribstarts[a].y > 0) ribx = line_x_from_y(this.body.endpoints[a],this.body.ribstarts[a], 0).x; 
		// TODO: That is almost it, but slightly too high. in fact even if y=0 ther is a slight error
		debugribstart.push(new Point(ribx,0));
		
		var corrections = [];
		
		
		// var s = this.body.ribstarts[a].x / this.body.widestp.x; // 
		// planedata.push({k:k, w:ribx, /* angle:angle, s:s, */ m:m, comp:false});
		var plane = calc_plane(this.body, ribx, a);
		// if (this.i_number===0) console.log(a,"init plane",plane);
		var attempt = 0;
		var correction = 0.02;
		var xdif = 0;
		var offby=0;
		// var lastresult = 0;
		var lastresult = this.body.ribstarts[a];
		while ( /* !this.body.ribs_same_point && */ attempt < 50){
			// Do check calculation using same i as determined above
			var i=0;
			var inter = undefined;
			var inter2 = undefined;
			while (i < 50){
				jp = plane.w - plane.k * this.body.front_points[i].y;
				if (jp > this.body.width*0.5 || jp < -this.body.width*0.5) jp=ribx;
				inter = intersect_shell_once(this.body.front_points[i].x,
										 this.body.middle_points[i].x, 
										 jp, plane.m, this.ed.bulge, accur);
				
				
				if (inter !== undefined && (inter.y != 0 && inter.x != 0)) break;
				i++;
			}	
			var j = i+1;
			while (j < 70){
				jp = plane.w - plane.k * this.body.front_points[j].y;
				if (jp > this.body.width*0.5 || jp < -this.body.width*0.5) jp=ribx;
				inter2 = intersect_shell_once(this.body.front_points[j].x,
										 this.body.middle_points[j].x, 
										 jp, plane.m, this.ed.bulge, accur);
				
				if (inter2 !== undefined && (inter2.y != 0 && inter2.x != 0)) break;
				j++;
			}	
			// y coord at intersection x on theoretical ribjoint line:
			// var result = line_x_from_y(inter,this.body.endpoints[a],0);
			// var result = line_x_from_y(inter,inter2,0);
			var result = line_x_from_y(inter,inter2,this.body.ribstarts[a].y);
			var offby = Math.abs(result.x- this.body.ribstarts[a].x);
			// xdif = ribx - result.x;
			
			// xdif = result.x - plane.w;
			if (this.body.ribstarts[a].x-0.01 < result.x && result.x < this.body.ribstarts[a].x+0.01) {
				// console.log("Success rib", a,attempt,":",i,j,xdif);
				break; // Success;
			} else if (result.x < this.body.ribstarts[a].x){
				xdif += correction;
				plane = calc_plane(this.body, ribx+xdif, a);
			} else if (result.x > this.body.ribstarts[a].x){
				xdif -= correction;
				plane = calc_plane(this.body, ribx+xdif, a);
			}
			
			// if (this.i_number===0) console.log("rib",a,"try",i,j,"attempt",attempt,"off by", offby, "xdif",xdif);
			// Adjust ribx or w 
			// correction
			correction = offby < 0.02 ? 0.02: offby/2;
			// Determine direction
			// Determine a good guess for correction. How much did a degree achieve? How much over/under shoot?
			attempt++;
			corrections.push(new Point(plane.w, attempt*0.1));
			lastresult = result;
		}
		
		debugcor.push(corrections);
		
		// console.log("plane",a,"try",i," dif",ydif, xdif);
		// console.log("plane",a,"try",i," dif",plane.m, newm);
		// planedata.push(calc_plane(this.body, ribx, a, false));
		planedata.push(plane);
	}
	// planedata.push({k:k, w:ribs.optpoints[i-1].x, angle:0.0});
	// console.log("planedata", planedata);
	
	// Calculate cross sections for every Y
	
	for (var i=1; i < this.body.front_points.length 
			   && i < this.body.middle_points.length ; i++){
		var width = this.body.front_points[i].x; 
		var height = this.body.middle_points[i].x;
		// bulge less towards neck, calculate a new p here
		// bulge should start going smaller from widest_i
		if (i > this.body.widest_i){
			var p = 2+(this.ed.bulge-2)*(1-(i-this.body.widest_i)/(this.body.front_points.length-this.body.widest_i));
		} else {
			var p = this.ed.bulge; // max bulge before widest_i
		}
		
		var inter,p1,jp,M;
		
		// for each rib at this y
		for (var a = 0; a < this.body.ribangles.length; a++){
			
			// p1 = new Point(planedata[a].w - planedata[a].k * this.body.front_points[i].y, 0);
			// console.log("planedata",a);
			jp = planedata[a].w - planedata[a].k * this.body.front_points[i].y;
			// p1 = new Point(planedata[a].w - planedata[a].k * this.body.front_points[i].y, this.body.ribstarts[a].y);
			// p1 = new Point(this.body.ribstarts[a].x - (this.body.ribstarts[i].x / getlast(this.body.front_points).y) * this.body.front_points[i].y, 0);
			// M = planedata[a].m; // ribjoint angle
			
			if ((width > 1 && height > 1) || i > this.body.widest_i){
				// inter = intersect_shell_once(width,height, p1.x, M, p, accur);
				inter = intersect_shell_once(width,height, jp, planedata[a].m, p, accur);
			} 
			
			
			// Then also find intersection with previous ribs or center
			// This stops points being inserted that would be between 0,0,0 and the actual previously determined first point of this rib
			if (inter && i<Math.floor(this.body.widest_i/2) && inter.x <= ribjoints[a][ribjoints[a].length-1].x ){
				inter = null;
			}
			// Check to see if planedata needs compensation because rib joint would get placed higher than ribstart
			/* if (!planedata[a].comp && inter && i<Math.floor(this.body.widest_i/4)){
				
				// inter.y > line from ribstart to endpoint at inter.x
				var wanted = line_y_from_x(this.body.ribstarts[a],this.body.endpoints[a],inter.x);
				// console.log("i==",i," and inter for rib",a,"wanted y:",wanted,inter);
				if (inter.y > wanted.y){
					var dif = inter.y-wanted.y;
					console.log("first intersection of rib",a,"at",i,"too high by", dif);
					planedata[a].comp = i;
					// Adjust planedata
					// move by difference between w and x projected from inter
					
					var xdif = line_x_from_y(this.body.endpoints[a], inter, 0).x -planedata[a].w;
					console.log("xdif",xdif);
					var ribx = planedata[a].w - xdif; // 0.75 is a magic number that seems to tone the change down just right
					planedata[a] = calc_plane(this.body, ribx, a, planedata[a].comp);
					// Get new inter
					jp = planedata[a].w - planedata[a].k * this.body.front_points[i].y;
					// inter = intersect_shell_once(width,height, jp, planedata[a].m, p, accur);
					// TODO: Check effect of adjustment and tone down or up accordingly
					// How much too much or too little was that?
					var wrongness = dif / (inter.y - wanted.y); // if same dif as before = 1
					
					// Try again by that much
					
				}  
			}*/
			if (inter){
				ribjoints[a].push(new Point(inter.x, this.body.front_points[i].y, inter.y));
			} 
		} 	
	}
	// Finally add last point to each rib at 0,length,0
	// for (var r=0; r<ribjoints.length;r++){
		// ribjoints[r].push(new Point(0, getlast(this.body.front_points).y, 0));
	// }
	
	console.log("Lute",this.i_number,"first points", ribjoints);
	
	this.body.ribjoints = ribjoints;
	this.body.planedata = planedata;
	// this.body.debug = debug;
	// this.body.debugribstart = debugribstart;
	// this.body.debugcor = debugcor;
}
Instrument.prototype.flatten_endclasp = function(){ // create endclasp template
	var body = this.body;
	var endclasp = body.endclasp;
	var edge = endclasp.sb_edge;
	var top  = endclasp.shape;

	var topp = new Point(0, Math.sqrt(top[0].y**2+top[0].z**2));
	var tops = [topp, topp.move(linelength(top[0],top[1]))];
	var bots = [new Point(0,0), new Point(Math.sqrt(edge[1].x**2+edge[1].y**2),0)];
	// Loop endclasp.shape and endclasp.sb_edge in turn, keeping tally of traversed distance. triangulate point distances and turn in to flat template.
	var i_top = 1;
	var i_bot = 1;
	var topdist = 0;
	var botdist = 0;
	
	function flatpoint(p1,p2,p3,p4, toppoint){
		// Distances between 3d points
		var Ll = linelength(p1, p2);
		var Rl = linelength(p3, p4);
		// Circles in 2d space
		var cL = new Circle(getlast(tops), Ll);
		var cR = new Circle(getlast(bots), Rl);
		var nL = intersect_circle(cL,cR); // Next left point coordinates, choose higher
		// console.log(nL[0],nL[1]);
		if (nL === false) { // Circles don't intersect
			console.log("No intersection",j);
			// return tops[j-1].avg(bots[j-1]); // return average - may cause distortion but 
		} else if (toppoint){
			// if intersection is to the right of last points in flatland
			// and also p2 is before p1 in 3d land
			// var ip = intersectline(getlast(tops), getlast(bots),  nL[0], nL[1], true);

			if (p2.y <= p1.y){
				return nL[0].x < nL[1].x ? nL[0] : nL[1];
			} else {
				return nL[0].x < nL[1].x ? nL[1] : nL[0];
			}
			var Lp = nL[0]; 
		} else if (nL[0].x > nL[1].x){
			// console.log("used 0");
			var Lp = nL[0]; 
		} else {
			// console.log("used 1");
			var Lp = nL[1]; 
		}
		return Lp;
	}
	
	var bj = 2;
	for (j=2; bj<edge.length && j<top.length; j++){ // Until either one runs out
		while (bj < edge.length -1
				&& ((bj < edge.length/3 && edge[bj].x < top[j].x )
				// && edge[bj].x < top[j].x // This needed for first curve but breaks tip
				|| edge[bj].y < top[j].y)) {
			var Bp = flatpoint(top[j-1], edge[bj], edge[bj-1], edge[bj]);
			if (Bp) bots.push(Bp);
			// console.log("Did bot", bj);
			bj++;
			
		}
		
		var Tp = flatpoint(top[j-1], top[j], edge[bj-1], top[j], true);
		if (Tp)tops.push(Tp);
		// console.log("Did top", j);
		// TODO: Edge shape is not quite right, maybe
	}
	
	tops.reverse();
	var flattened = bots.concat(tops);
	this.body.endclasp.flattened = flattened;
}
Instrument.prototype.flatten_ribs = function(){ // create rib templated
	var body = this.body;
	var ribjoints = body.ribjoints;
	var leftpoints,rightpoints;
	console.log("Beginneth rib flattening", this.i_number);
	
	function flatpoint(p1,p2,p3,p4, leftside){
		// Distances between 3d points
		var Ll = linelength(p1, p2);
		var Rl = linelength(p3, p4);
		// Circles in 2d space
		// console.log(getlast(leftpoints),getlast(rightpoints));
		var cL = new Circle(getlast(leftpoints), Ll);
		var cR = new Circle(getlast(rightpoints), Rl);
		var nL = intersect_circle(cL,cR); // Next left point coordinates, choose higher
		// console.log(nL[0],nL[1]);
		if (nL === false) { // Circles don't intersect
			console.log("No intersection",i);
			console.log(Ll,Rl);
			// return tops[j-1].avg(bots[j-1]); // return average - may cause distortion but 
			// return 
			// if (leftside){
				// var p1 = circle_line(cL, penult(leftpoints),getlast(leftpoints));
				// var p2 = circle_line(cR, penult(leftpoints),getlast(leftpoints));
				// var Lp = (p1[0].x>p1[1].x?p1[0]:p1[1]).avg(p2[0].x>p2[1].x?p2[0]:p2[1]);
			// } else {
				// var p1 = circle_line(cL, penult(rightpoints),getlast(rightpoints));
				// var p2 = circle_line(cR, penult(rightpoints),getlast(rightpoints));
				// var Lp = (p1[0].x>p1[1].x?p1[0]:p1[1]).avg(p2[0].x>p2[1].x?p2[0]:p2[1]);
			// }
			var bigger = cL.r > cR.r ? cL: cR;
			var smaller = cL.r <= cR.r ? cL: cR;
			var dir = trueangle(bigger.center, smaller.center);
			return bigger.center.movedist(bigger.r, -dir).avg(smaller.center.movedist(smaller.r, -dir));
		
		} else if (nL[0].x >= nL[1].x){
			// console.log("used 0");
			// var Lp = nL[0]; 
			return nL[0] !== undefined ? nL[0]:nL[1]; 
		} else {
			// console.log("used 1");
			// var Lp = nL[1]; 
			return nL[1] !== undefined ? nL[1]:nL[0]; 
		}
	}
	
	// Make a mirrored copy of the center rib
	var center_left = [];
	for (var i=0; i<ribjoints[0].length; i++){
		center_left.push(new Point(-ribjoints[0][i].x,
									ribjoints[0][i].y,
									ribjoints[0][i].z));
	}
	var ribjoints = [center_left].concat(ribjoints);
	var templates = [];
	var template_info = {total:0, sizes:[]};
	
	// Flatten each rib
	for (var r=1; r < ribjoints.length; r++){
		console.log("Flattening",r);
		var left = ribjoints[r-1];
		var right = ribjoints[r];
		// Find tip triangle
		var leftpoints = [new Point(0,0)];
		var rightpoints = [new Point(0,0)];
		// console.log(getlast(left),penult(left),getlast(right), penult(right));
		
		// Synchronise left and right because there might be an extra last point on one
		var li = left.length-4;
		var ri = right.length-4;
		if (left[li].y < right[ri].y) li++;
		if (left[li].y > right[ri].y) ri++;
		
		// Skip a few points because they may share Y coordinates, which causes trouble
		
		var lL = linelength(getlast(left), left[li+1]);
		var rL = linelength(getlast(right), right[ri+1]);
		var d = linelength(left[li+1], right[ri+1]);

		var c1 = new Circle(new Point(0,0), lL);
		var c2 = new Circle(new Point(rL,0), d);
		var ip = intersect_circle_above(c1,c2);

		leftpoints.push(ip);
		rightpoints.push(c2.center);

		
		
		try{
		// Flatten this current rib
		// for (i=left.length-5; i>1; i--){
		
		while (li>0 && ri>0){
			// if (left[i+li].y !== right[i+ri].y) console.log("mismatch",this.i_number,i);
			var Lp = flatpoint(left[li+1], left[li], right[ri+1], left[li], true);
			var Rp = flatpoint(left[li+1], right[ri], right[ri+1], right[ri]);
			if (Lp) {
				leftpoints.push(Lp);
			} else {
				console.log("Left failed",r,li, "point", Lp);
				
			}
			if (Rp) {
				rightpoints.push(Rp);
			} else {
				console.log("Right failed",r,ri, "point", Rp);
			}
			li--;
			ri--;
		}} catch (e){console.log(e)};
		console.log("left",li,"right",ri);
		
		// Find last points
		if (li > 0 || ri > 0){
			var leftover = li > 0 ? left : right;
			var done = li > 0 ? right : left;
			for (var i = li > ri ? li : ri; i>=0; i--){
				if (li > ri){
					var p = flatpoint(leftover[i+1], leftover[i], done[0], leftover[i]);
					leftpoints.push(p);
				} else {
					var p = flatpoint(done[0], leftover[i], leftover[i+1], leftover[i],);
					rightpoints.push(p);
				}
			}
			
		}
		
		
		// var lL = linelength(left[li],left[0]);
		// var rL = linelength(right[ri], right[0]);
		// var d = linelength(left[0], right[0]);

		// var c1 = new Circle(new Point(0,0), lL);
		// var c2 = new Circle(new Point(rL,0), d);
		// var ip = intersect_circle_above(c1,c2);

		// leftpoints.push(ip);
		// rightpoints.push(c2.center);
		
		// Save meta information about ribs
		var len = linelength(leftpoints[0], getlast(leftpoints));
		var w = 50; // TODO: width
		template_info.sizes.push({length: len, width: w});
		template_info.total += w;
		
		// Save rib template shape
		leftpoints.reverse();
		rightpoints = leftpoints.concat(rightpoints);
		
		// Straighten so templates are all horizontal
		templates.push(rightpoints);
		
	}
	this.body.templates = templates;
	this.body.template_info = template_info;
}
// 3D guitar calculations
Instrument.prototype.calculate_guitarbody = function(){
	
}



///////////////////////////////////////////////////////////////////////
// Helper functions

function get_body_shape(name, part){ // Copy body shapes from body.svg
	try{
		if (part == "guitar"){
			return bodylist[name].guitar;
		} else if (part == "front"){
			return bodylist[name].side;
		} else if (part == "middle"){
			return bodylist[name].middle;
		}
	} catch(e){
		console.log("Failed to get body shape for",name, ". more information:");
		console.log(e);
	}
}
function longestmensur(ed){
	
}
function get_path_points(p, acc) { // Convert path to point list // Very slow because of built-in GetPointAtLength
	// Use SVG 2 functions to obtain a list of points every acc mm on the path
	
	var len = Math.floor(p.getTotalLength());
	var acc = acc || 1.5;
	var fp = p.getPointAtLength(0.0);
	var ar = [new Point(0,0)];
	for (var i=acc; i < len; i+=acc ){
		var po = p.getPointAtLength(i);
		if (po.y < getlast(ar).y){
			// ar.push(new Point(po.x, po.y).minuspoint(fp).scale(-1,-1));
			ar.push(new Point(-(po.x-fp.x), -(po.y-fp.y)));
			// drawcircle(debuglayer, getlast(ar), 1, REDSTYLE);
		} 
		
	}
	var fin = p.getPointAtLength(p.getTotalLength());
	ar.push(new Point(fin.x, fin.y).minuspoint(fp).scale(-1,-1));
	return ar;
}
function evenly_divide_path(p, num, start,end) { // Convert path to point list // Very slow because of built-in GetPointAtLength
	// Use SVG 2 functions to obtain a list of points evenly spaced on the path
	var start = start || 0; // Skip this much from the beginning
	var end = end || 0;	// don't go all the way to the end
	var len = Math.floor(p.getTotalLength());
	var num = num || 10;
	num -=1;
	var incr = (len-start-end)/num;
	var ar = [];
	for (var i=0; i <= num; i++ ){
		var po = p.getPointAtLength(i*incr+start);
		ar.push(new Point(po.x,po.y));
	}
	// var fin = p.getPointAtLength(p.getTotalLength());
	// ar.push(new Point(fin.x, fin.y));
	return ar;
}
function get_matching_points(p, ar){ // Same, use given y coordinates
	// Get points for another path based on another's y coords
	var ar2 = get_path_points(p, 1); // A more precise interpolation
	var ar3 = [];
	var i = 1;
	for (let po of ar){
		// For each point in original path, find corresponding point in ar2 between its points
		// po should be below (up is negative) ar2[i] and above ar2[i-1] 
		// 0 > ar2[i-1].y > po.y > ar2[i].y > -inf
		while (ar2[i-1].y < po.y && i < ar2.length) {
			i++;
		};
		if (i >= ar2.length) break;
		// console.log("doing ",i);
		var m = (ar2[i].y - ar2[i-1].y)/(ar2[i].x - ar2[i-1].x);
		var newp = new Point((ar2[i-1].x*m-ar2[i-1].y+po.y)/(m), po.y);
		ar3.push(newp);
		// drawcircle(debuglayer, newp, 0.5, GREENSTYLE);
	}
	ar3.push(getlast(ar));
	return ar3;
}
function intersect_pointlist_x(ar, X,start_i){ // vertical intersect, return Point with extra info

	var start_i = start_i || 1;
	for (var i=start_i; i < ar.length; i++ ){
		if ( isbetween(ar[i].x, X, ar[i-1].x) ){
			var m = (ar[i].x - ar[i-1].x)/(ar[i].y - ar[i-1].y);
			// drawX(debuglayer, new Point(X,(ar[i-1].y*m-ar[i-1].x+X)/(m)), 5, BLUESTYLE);
			var p = new Point(X,(ar[i-1].y*m-ar[i-1].x+X)/(m));
			p.i = i;
			p.angle = trueangle(ar[i-1],ar[i]);
			return p;
		}
	}
}
function intersect_pointlist_y(ar, Y,start_i){ // horizontal intersect, same
	var start_i = start_i || 1;
	for (var i=start_i; i < ar.length; i++ ){
		if ( isbetween(ar[i].y, Y, ar[i-1].y) ){
			var m = (ar[i].y - ar[i-1].y)/(ar[i].x - ar[i-1].x);
			// drawcircle(debuglayer, new Point((ar[i-1].x*m-ar[i-1].y+Y)/(m), Y), 5, REDSTYLE);
			var p = new Point((ar[i-1].x*m-ar[i-1].y+Y)/(m), Y);
			p.i = i;
			p.angle = trueangle(ar[i-1],ar[i]);
			return p;
		}
	}
}
function intersect_pointlist(ar, p1,p2){ // free intersect
	var U = Math.max(p1.y, p2.y) +3; // Could use acc or linelength(ar[0], ar[1]) too
	var D = Math.min(p1.y, p2.y) -3;
	var L = Math.min(p1.x, p2.x) -3;
	var R = Math.max(p1.x, p2.x) +3;
	// drawshape(debuglayer,[new Point(L,U),new Point(R,U),new Point(R,D),new Point(L,D)]);
	
	for (var i=1; i < ar.length; i++ ){
		if (isbetween(L, ar[i].x, R) && isbetween(L, ar[i-1].x, R)
		 && isbetween(D, ar[i].y, U) && isbetween(D, ar[i-1].y, U)){
			// Only bother to calculate intersection if point is between p1 and p2
			// drawcircle(debuglayer, ar[i], 1, GREENSTYLE);
			var ip = intersectline(p1,p2, ar[i-1], ar[i]);
			if (ip) {
				ip.i = i;
				ip.angle = trueangle(ar[i-1],ar[i]);
				return ip;
			}
		}
	}
}
function get_bouts(ar){ // Find largest x, or two peaks/bouts if guitar 
	var bouts = [];
	// TODO: This assumes the greatest x coord point is not shared by two or more points
	// TODO: Find all bouts, then return two highest of them
	for (var i=1; i < ar.length-1; i++){
		if (ar[i].x > ar[i-1].x && ar[i].x > ar[i+1].x){
			ar[i].i = i;
			bouts.push(ar[i]);
		}
	}
	return bouts;
}
function get_waist(ar, bouts){ // Find lowest x, given bouts

	for (var i=bouts[0].i; i < bouts[1].i; i++){
		if (ar[i].x < ar[i-1].x && ar[i].x < ar[i+1].x){
			ar[i].i = i;
			bouts.splice(1,0,ar[i]);
		}
	}
	return bouts;
}
function scale_pointlist(shape, scale){ // 
	// var t0 = performance.now();
	var nshape = [];
	for (let po of shape){
		nshape.push(po.scale(scale, scale));
	}
	// console.log((performance.now() - t0).toFixed(0) + "ms to rescale shape");
	return nshape;
}
function rotate_pointlist(shape, deg, around){
	var nshape = [];
	for (let po of shape){
		nshape.push(po.rotate(around, -deg*radtodeg));
	}
	return nshape;
}
////////////////////////////////////////////////////////////////////
// Drawing functions
// TODO: move to lutedesigner-draw.js when done

Instrument.prototype.draw_full = function(origin){// Draw the instrument in three positions
	origins = this.origins = {};
	origins.front = new Point(0,0);
	origins.side = new Point(this.body.width+50,0);
	origins.back = new Point(-this.body.width-50,0);
	origins.cross = new Point(0,300);
	origins.info = new Point(0,30);
	origins.templates = new Point(0,30);
	try {
		
		this.draw_front(origins.front.addpoint(origin));
		
		this.draw_side(origins.side.addpoint(origin));
		
		this.draw_back(origins.back.addpoint(origin));
		
		this.draw_info(origins.info.addpoint(origin));
		
		this.draw_templates(origins.templates.addpoint(origin));
		
	} catch (e){
		console.log("Drawing instrument failed", e);
	}
}

function List (){ // Global list of instruments, manager basically
	this.instruments = [];
	this.get = function (i){
		return this.instruments[i];
	};
	this.set = function (i, content){
		this.instruments[i] = content;
	};
	this.add = function (ed){
		return this.instruments.push(new Instrument(ed, this.instruments.length));
	};
	this.all = function (){
		return this.instruments;
	};
	this.remove = function (i){
		this.instruments.splice(i,1);
	}
}
List.prototype.draw_comparison = function(number, origin,dir){// Draw views side by side to compare
	var margin = 50;
	var max_h = 0;
	var max_d = 0;
	var max_w = 0;
	var x = 0;
	var boxes = this.boxes = [];
	var dir = dir || 1; // -1 for towards left
	
	for (let instrument of this.instruments){
		var vb = instrument.get_viewbox();
		boxes.push(vb);
		if (vb.h > max_h) max_h = vb.h;
		if (instrument.body.depth > max_d) max_d = instrument.body.depth;
		if (instrument.body.width > max_w) max_w = instrument.body.width;
		// console.log("width of "+instrument.name +" is " +vb.w);
	}
	
	origins = this.origins = {};
	origins.front = new Point(0,0).addpoint(origin);
	origins.side = new Point(0,max_h+margin+max_d).addpoint(origin);
	origins.back = new Point(0,-max_h-margin).addpoint(origin);
	origins.cross = new Point(0,50+margin).addpoint(origin);
	origins.info = new Point(0,30).addpoint(origin);
	// origins.templates = new Point(-500,0).addpoint(origin);
	// origins.templates = origins.side.move(0,500).addpoint(origin);
	origins.templates = new Point(0,max_h+margin+max_d+margin).addpoint(origin);
	this.origins = origins;
	
	for (var i = 0 ; i < this.instruments.length; i++){
		var instrument = this.instruments[i];
		x += boxes[i].w/2;
		if (number===undefined || (number !== undefined && i===number)){ 
		//Redraw only selected instrument
		try {
			// console.log("Drawing "+i+" at "+ x );
			instrument.layer = makegroup(getelid("designer-canvas"), "instrument_"+i);
			instrument.draw_front(origins.front.move(x*dir));
			instrument.draw_side(origins.side.move(x*dir));
			instrument.draw_back(origins.back.move(x*dir));
			instrument.draw_cross(origins.cross.move(x*dir));
			instrument.draw_info(origins.info.move(x*dir));
			instrument.draw_templates(origins.templates.move(x*dir));
			
		} catch (e){
			console.log("Drawing instrument failed", e);
		}
		}
		x += boxes[i].w/2 + margin;
	}
	// Only draw templates and forms for primary instrument
	
	// this.instruments[0].draw_templates(origins.templates);
	// this.instruments[1].draw_templates(origins.templates);
	// this.instruments[2].draw_templates(origins.templates);
	// this.instruments[3].draw_templates(origins.templates);
	// TODO: Find length of longest template to position templates correctly
	
}
Instrument.prototype.draw_front = function(origin){ // Draw the instrument front view
	
	var ed = this.ed; // Just making the code more concise by grabbing these vars
	var shapes = this.shapes;
	var body = this.body;
	var bridge = this.bridge;
	var neck = this.neck;
	var nuts = this.nuts;
	var strings = this.strings;
	var origins = this.origins;
	this.origins.front = origin || this.origins.front; // set origin or use default. Only used for translation and rotation.
	
	var zeropoint = new Point(0,0); // TODO: Should this just be origin? maybe not
	var frontview = makegroup(this.layer, "frontview"+this.i_number);
	frontview.setAttribute("transform", "translate("+(origins.front.x)+" "+(origins.front.y)+") scale(1, -1)");
	// console.log("frontview"+this.i_number, "translate("+(origins.front.x)+" "+(origins.front.y)+") scale(1, -1)");
	
	drawline(frontview,[neck.middle, neck.middle_end],GUIDESTYLE);
	
	// Pegbox or extension
	if (this.pegbox.style == "theorbo"){
		draw_theorbo_ext_front(frontview, this.pegbox, nuts);
	} else {
		draw_pegbox_front(frontview,this.pegbox);
	}
	// neck shape
	drawshape(frontview, [	neck.joint, 
							neck.treble_end,
							neck.bass_end,
							neck.joint.scale(-1,1)], THINSTYLE,false,false);
	drawline(frontview, [zeropoint, zeropoint.move(0,getmensur()+200)], GUIDESTYLE);
	// frets 
	for (var i=1; i<neck.frets_lines.length; i++){
		drawline(frontview,neck.frets_lines[i], i==8||i==5 ? THICKSTYLE :STRINGSTYLE);
	}
	// Body shape
	var side = copyelement(frontview, shapes.front, zeropoint,THINSTYLE);
	scalepath_xy(side, -ed.bodyscale, -ed.bodyscale); // Flip and rescale
	var trebleside = mirrorpath(frontview,side); // Mirror path d coordinates, maintai
	
	// Draw bars ///////////////////////////////
	var bargroup = makegroup(frontview, "bars"+this.i_number);
	try {
		for (bar of body.bars){
			if (bar.type == "bassbar") {
				var p1 = new Point(10, bar.end.y);
				var p2 = new Point(-bar.end.x/2, bar.end.y);
				var p3 = intersect_pointlist_y(body.front_points, bridge.middle.y).scale(-1,1).move(2);
				var cp1 = new Point(-bar.end.x*0.9, bar.end.y);
				var p3 = p3.bezier(cp1,p3);
				var jbar = [p1, p2, p3 ];
				drawshape(bargroup, jbar, "", "", false);
			} else {
				drawline(bargroup, [bar.end.move(-2), bar.end.scale(-1,1).move(2)], THINSTYLE);
			}
			
		}
		if (ed.bodyshapefrom!="guitar"){
			// Draw small bars on lutes
			var barstart = new Point(0, (2*body.bars[1].pos+body.bars[2].pos)/3);
			var thru = new Point((strings.spacings.bridgewidth)/2+25, bridge.middle.y);
			var a1 = trueangle(barstart,thru);
			var barend = intersect_pointlist(body.front_points, barstart,barstart.movedist(-300, a1));
			drawline(bargroup, [thru,barend.movedist(2.5, a1)]);
			var thru2 = new Point((strings.spacings.bridgewidth)/3,bridge.middle.y);
			var a2 = trueangle(barstart,thru2);
			var barend = intersect_pointlist(body.front_points, barstart,barstart.movedist(-300, a2));
			drawline(bargroup, [thru2,barend.movedist(6.5, a1)]);
		}
	} catch(e) {
		console.log("Drawing soundboard bars failed:", e);
	}
	// Rosette
	if (ed.bodyshapefrom == "guitar"){
		var rosette = drawcircle(frontview, body.rosette, body.rosette.width, THINSTYLE);
		// Extra rosette circles to simulate guitar outer rosette
		drawcircle(frontview, body.rosette, body.rosette.width*1.1, THINSTYLE);
		drawcircle(frontview, body.rosette, body.rosette.width*1.13, THINSTYLE);
		drawcircle(frontview, body.rosette, body.rosette.width*1.47, THINSTYLE);
		drawcircle(frontview, body.rosette, body.rosette.width*1.5, THINSTYLE);
	} else if (ed.rosettelist == "triple" ){
		var radius = body.rosette.width/1.5;
		var rosetteg = makegroup(frontview, "rosettegroup-"+this.i_number);
		var rosette1 = drawcircle(rosetteg, body.rosette.move(-radius), radius-2, THINSTYLE);
		var rosette2 = drawcircle(rosetteg, body.rosette.move(radius), radius-2, THINSTYLE);
		var rosette3 = drawcircle(rosetteg, body.rosette.move(0,radius*1.5+2), radius*0.8, THINSTYLE);
	} else {
		var rosette = drawcircle(frontview, body.rosette, body.rosette.width, THINSTYLE);
	}
	// neckblock bottom
	// TODO: From calculated inside body shape
	drawline(frontview, [body.neckblock.move(-2), body.neckblock.scale(-1,1).move(2)], BEHINDSTYLE); 
	
	// drawcircle(frontview, body.widestp, 5, REDSTYLE); // Widest point of body
	
	// Draw nuts and strings
	for (var i=0; i< nuts.length; i++){
		if (i == nuts.length-1 && this.pegbox.style=="theorbo") break; // Drawn elsewhere
		drawshape(frontview, [nuts[i].treble_near,nuts[i].treble_far,nuts[i].bass_far,nuts[i].bass_near],COVERSTYLE);
	}
	// Draw fingerboard fangs
	if (ed.fingerboardstyle=="fangs" || ed.fingerboardstyle=="smallfangs" || ed.fingerboardstyle=="longsmallfangs"){
		var fangw = (20 +neck.width/5.0)/2.0; // width of fang
		var fangd = 10; // How far fang pokes in to soundboard
		var sb_e = 20; // How far the soundboard extends in the middle
		if (ed.fingerboardstyle=="smallfangs"){
			fangw = 8;
			fangd = 6;
			sb_e = 10;
		} else if (ed.fingerboardstyle=="longsmallfangs"){
			fangw = 9;
			fangd = 14;
			sb_e = 18;
		}
		var treble_joint = neck.joint.move(0,0);
		var bass_joint = neck.joint.scale(-1,1);
		// var ang = -(neck.nut_angle-halfpi)/2;
		var bassfang = bass_joint.move(fangw, -fangd);
		var bassp = bass_joint.movedist(-sb_e,neck.bass_angle).move(fangw, 0);
		var trebfang = treble_joint.move(-fangw, -fangd);
		var trebp = treble_joint.movedist(-sb_e,neck.treble_angle).move(-fangw, 0);
		
		drawshape(frontview, 
			[bass_joint,
			bassfang.relbezier(-fangw*0.6,fangd, -fangw*0.3,fangd),
			bassp,trebp,trebfang,
			treble_joint.relbezier(-fangw*0.7,0, -fangw*0.4,0)], 
			THINSTYLE, false, false);
	} else {
		drawline(frontview, [neck.joint, neck.joint.scale(-1,1)], THINSTYLE); 
	}
	// Bridge
	draw_bridge_front(frontview, ed.bridgestyle, bridge, strings.spacings.bridgewidth);
	
	// Strings
	for (var i=0; i < strings.nut_pos.length; i++){
		for (var j=0; j < strings.nut_pos[i].length; j++){
			if (ed.drawallstrings){
				drawline(frontview, [strings.nut_pos[i][j], strings.bridge_pos[i][j]],STRINGSTYLE);
			} else if (j==0 || j == strings.nut_pos[i].length-1){
				drawline(frontview, [strings.nut_pos[i][j], strings.bridge_pos[i][j]],STRINGSTYLE);
			}
			// Anyway draw string slots on nut and bridge
			if (!(i == strings.nut_pos.length-1 && this.pegbox.style=="theorbo")) {
				drawline(frontview,[strings.nut_pos[i][j],strings.nut_pos[i][j].movedist(-4.5,halfpi+neck.middle_angle-halfpi)]);
			}
			drawline(frontview,[strings.bridge_pos[i][j],strings.bridge_pos[i][j].move(0,-2)]);
		}
	}
	
}
Instrument.prototype.draw_back = function(origin){ // Draw the instrument, back view
	var ed = this.ed; // Just making the code more concise by grabbing these vars
	var shapes = this.shapes;
	var body = this.body;
	var bridge = this.bridge;
	var pegbox = this.pegbox;
	var neck = this.neck;
	var nuts = this.nuts;
	var strings = this.strings;
	var origins = this.origins;
	this.origins.back = origin || this.origins.back; // set origin or use default. Only used for translation and rotation.
	
	var zeropoint = new Point(0,0);
	var backview = makegroup(this.layer, "backview"+this.i_number);
	backview.setAttribute("transform", "translate("+(origins.back.x)+" "+(origins.back.y)+") scale(-1, -1)");
	// strings (under everything else)
	// Strings
	for (var i=0; i < strings.nut_pos.length; i++){
		for (var j=0; j < strings.nut_pos[i].length; j++){
			if (ed.drawallstrings){
				drawline(backview, [strings.nut_pos[i][j], strings.bridge_pos[i][j]],STRINGSTYLE);
			} else if (j==0 || j == strings.nut_pos[i].length-1){
				drawline(backview, [strings.nut_pos[i][j], strings.bridge_pos[i][j]],STRINGSTYLE);
			}
			// Anyway draw string slots on nut and bridge
			if (!(i == strings.nut_pos.length-1 && this.pegbox.style=="theorbo")) {
				drawline(backview,[strings.nut_pos[i][j],strings.nut_pos[i][j].movedist(-4.5,halfpi+neck.middle_angle-halfpi)]);
			}
			drawline(backview,[strings.bridge_pos[i][j],strings.bridge_pos[i][j].move(0,-2)]);
		}
	}
	// First nut
	drawshape(backview, [nuts[0].treble_near,nuts[0].treble_far,nuts[0].bass_far,nuts[0].bass_near],COVERSTYLE);
	
	// Body outline
	var back = copyelement(backview, shapes.front, zeropoint,COVERSTYLE);
	scalepath_xy(back, -ed.bodyscale, -ed.bodyscale); // Flip and rescale
	var trebleside = mirrorpath(backview,back); // Mirror path d coordinates, maintai
	// drawline(backview, [neck.joint, neck.chanterelle], THINSTYLE);// neck treble edge
	
	// Draw rib joints
	if (!this.guitar) { 
		if (this.body.ribjoints){
			for (var r=0; r<this.body.ribjoints.length;r++){
				var ribshape = [];
				for (var i=0; i<this.body.ribjoints[r].length;i++){
					ribshape.push(this.body.ribjoints[r][i].scale(-1,1));
				}
				drawshape(backview,ribshape,THINSTYLE,false,false);
				drawshape(backview,this.body.ribjoints[r],THINSTYLE,false,false);
			}
			// endclasp
			body.endclasp.sb_edge.reverse();
			var eshape = body.endclasp.shape.concat(body.endclasp.sb_edge);
			mirrorshape(backview, eshape ,COVERSTYLE,false,false);
			body.endclasp.sb_edge.reverse();
		} else { // Else draw naive lines from shell to ribstarts
			draw_fast_body (backview, this.ed,this.shapes.front, body.number_of_ribs, true);
		}
	}
	
	
	// neck shape
	var b1 = neck.joint_bass.move(0,0);
	var b2 = neck.joint_mid.move(-neck.joint.x*0.666,0);
	var t2 = neck.joint.move(0,0);
	var t1 = neck.joint_mid.move(neck.joint.x*0.666,0);
	
	drawshape(backview,[neck.treble_end,
						neck.bass_end,
						neck.joint_bass,
						neck.joint_mid.bezier(b1,b2),
						neck.joint.bezier(t1,t2)], COVERSTYLE,false,true);
	
	// extension 
	
	// Pegbox or extension back view
	if (this.pegbox.style == "theorbo"){
		// draw pegs partly hidden by extension sides
		draw_pegs_front_(backview,pegbox.spacing, pegbox.pegs, pegbox.angle_bass, pegbox.angle_treble, pegbox.angle_front-halfpi, pegbox.first_peg, pegbox.start_treble, pegbox.hole.start_bass_top, pegbox.hole.start_treble_top, PEGSTYLEcover);
		// upper pegbox 
		var headg = makegroup(backview);
		headg.setAttribute("transform", "translate ("+pegbox.end_treble.x+" "+pegbox.end_treble.y+") rotate("+(-pegbox.angle_front/radtodeg)+") scale(-1,1) ");
		var heado = creel("path", "", "", ["d",theorbohead_outline], NAMESPACE);
		addel(headg,heado);
		heado.setAttribute("style",COVERSTYLE);
		// Shaft back view
		var a = trueangle(pegbox.slot_bass, pegbox.slot_treble);
		var d = linelength(pegbox.slot_bass, pegbox.slot_treble);
		var cp1 = pegbox.slot_bass.avg(pegbox.slot_treble).move(0,10).movedist(d/4,a);
		var cp2 = cp1.movedist(-d/2,a);
		drawshape(backview, [pegbox.start_treble, pegbox.end_treble, pegbox.end_bass, pegbox.start_bass, pegbox.slot_bass, pegbox.slot_treble.bezier(cp1,cp2)], COVERSTYLE);
		// Extension back fancy lines
		drawshape(backview, [pegbox.slot_treble, pegbox.start_treble.move(-2), pegbox.end_treble], GRAYSTYLE,false,false);
		drawshape(backview, [pegbox.slot_bass, pegbox.start_bass.move(2), pegbox.end_bass], GRAYSTYLE,false,false);
		
		// Foldable extension back view
		if (pegbox.fold){
			var A90 = pegbox.angle_front-halfpi;
			// Extension hinge on the back
			var B = pegbox.fold.hinge_bass.movedist(-0.5,A90);
			var T = pegbox.fold.hinge_treble.movedist(0.5,A90);
			drawshape(backview,[T.movedist(5,pegbox.angle_front), 
							   T.movedist(-5,pegbox.angle_front),
							   B.movedist(-5,pegbox.angle_front),
							   B.movedist(5,pegbox.angle_front)]
							   ,COVERSTYLE);
			var M = B.avg(T);
			var Mtop = M.movedist(8, pegbox.angle_front);
			var Mbot = M.movedist(-8, pegbox.angle_front);
			// Hinge flat parts
			drawshape(backview,[Mtop.movedist(10,A90), 
							   Mtop.movedist(18,A90),
							   Mbot.movedist(18,A90),
							   Mbot.movedist(10,A90)]
							   ,COVERSTYLE);
			drawshape(backview,[Mtop.movedist(-10,A90), 
							   Mtop.movedist(-18,A90),
							   Mbot.movedist(-18,A90),
							   Mbot.movedist(-10,A90)]
							   ,COVERSTYLE);
			drawline(backview, [Mtop.movedist(-14,A90),Mbot.movedist(-14,A90)], GRAYSTYLE);
			drawline(backview, [Mtop.movedist(14,A90),Mbot.movedist(14,A90)], GRAYSTYLE);
		}
			
	} else {
		draw_pegbox_back(backview,this.pegbox);
	}
	
}
Instrument.prototype.draw_side = function(origin){ // Draw the instrument, side view
	var ed = this.ed; // Just making the code more concise by grabbing these vars
	var shapes = this.shapes;
	var body = this.body;
	var endclasp = body.endclasp;
	var bridge = this.bridge;
	var guitar = this.guitar;
	var pegbox = this.pegbox;
	var neck = this.neck;
	var nuts = this.nuts;
	var strings = this.strings;
	var origins = this.origins;
	this.origins.side = origin || this.origins.side; // set origin or use default. Only used for translation and rotation.
	
	var zeropoint = new Point(0,0);
	var sideview = makegroup(this.layer, "sideview"+this.i_number);
	// sideview.setAttribute("transform", "translate("+(origins.side.x)+" "+(origins.side.y)+")");
	sideview.setAttribute("transform", "translate("+(origins.side.x)+" "+(origins.side.y)+") scale(-1, -1)");
	// TODO: Why does guitar side get drawn mirrored?
	// var mid = copyelement(sideview, shapes.middle, zeropoint,THINSTYLE);
	
	// var side = copyelement(frontview, shapes.front, zeropoint,THINSTYLE);
	// scalepath_xy(mid, -ed.bodyscale, -ed.bodyscale); // Flip and rescale
	
	
	
	// Draw rib joints
	if (!this.guitar) { 
		var midside = copyelement(sideview, shapes.front, zeropoint,GUIDESTYLE);
		scalepath_xy(midside, -ed.bodyscale, -ed.bodyscale); // Flip and rescale
		if (this.body.ribjoints){
			for (var r=0; r<this.body.ribjoints.length;r++){
				var ribshape = [];
				for (var i=0; i<this.body.ribjoints[r].length;i++){
					ribshape.push(this.body.ribjoints[r][i].zy());
				}
				drawshape(sideview,ribshape,THINSTYLE,false,false);
			}
		} else { // Else draw naive lines from shell to ribstarts
			
			draw_fast_body (sideview, this.ed,this.shapes.middle, body.number_of_ribs);
		}
		
	}
	// Bridge side
	draw_bridge_side(sideview, bridge);

	// Neck
	var neckend = neck.treble_end.y > neck.bass_end.y ? neck.treble_end: neck.bass_end;
	var cp1 = new Point(neck.middle_end.zy().x, neckend.y);
	var cp2 = neckend.setx(0).move(5);
	if (guitar){
		drawshape(sideview, [guitar.heel.setx(0), guitar.heel, guitar.heel_end, neck.joint_mid.zy(), neck.middle_end.zy(), neckend.setx(0).bezier(cp1,cp2)], COVERSTYLE);
	} else {
		drawshape(sideview,[neck.joint.setx(0), neck.joint_mid.zy(), neck.middle_end.zy(), neckend.setx(0).bezier(cp1,cp2)], COVERSTYLE);
	}
	drawX(sideview,neck.middle_end.zy(),3,REDSTYLE);
	// Neck end bass side round shape
	if (neck.nut_angle_deg < 90){
		var cp1 = new Point(neck.middle_end.zy().x, neck.bass_end.y);
		var cp2 = neck.bass_end.setx(0).move(5);
		drawshape(sideview, [neck.middle_end.zy(), neck.bass_end.setx(0).bezier(cp1,cp2)],false,false,false);
	}
	// Fingerboard
	drawshape(sideview, [neck.joint.setx(0),neck.joint.setx(-1.8), neckend.setx(-2).move(0,-4.5), neckend.setx(0).move(0,-4.5)]);
	// Chanterelle
	drawline(sideview, [strings.bridge_pos[0][0].zy(), strings.nut_pos[0][0].setx(-3)],STRINGSTYLE)
	// Nuts
	for (var i=0; i < nuts.length; i++){
		var nut = nuts[i];
		if (i == nuts.length-1 && this.pegbox.style=="theorbo") break; // Drawn elsewhere
		if ((neck.nut_angle_deg < 90 || neck.nut_angle_deg > 90) && i==0){
			if (neck.nut_angle_deg < 90){ // Draw top side of nut
				// console.log("nut angle below 90");
				drawshape(sideview, 
					[nut.bass_far.setx(1),
					 nut.treble_far.setx(1),
					 nut.treble_far.setx(0),
					 nut.treble_near.setx(-3).move(0,1).bezier(nut.treble_far.setx(-2), 
															 nut.treble_near.setx(-3).move(0,3)),
					 nut.bass_near.setx(-3)], COVERSTYLE,false,false);
			} else if (neck.nut_angle_deg > 90){ // Draw bottom side of nut
				// console.log("nut angle above 90");
				drawshape(sideview, 
					[nut.bass_near.setx(-3),
					nut.treble_near.setx(-3),
					 nut.treble_near.setx(-2)], THINSTYLE,false,false);
			}
		}
		// Draw bass side of nut anyway
		drawshape(sideview, 
			[nut.bass_near.setx(1),
			 nut.bass_far.setx(1),
			 nut.bass_far.setx(0),
			 nut.bass_near.setx(-3).move(0,1).bezier(nut.bass_far.setx(-2), 
													 nut.bass_near.setx(-3).move(0,3)),
			 nut.bass_near.setx(-3)], COVERSTYLE);
	}
	
	// 1 string per nut
	
	for (var i=0; i < strings.bridge_pos.length; i++){
		drawline(sideview, [getlast(strings.bridge_pos[i]).zy(), getlast(strings.nut_pos[i]).setx(-3)],STRINGSTYLE);
	}
	// Pegbox or extension
	if (pegbox.style == "theorbo"){
		draw_theorbo_ext_side(sideview,pegbox,nuts);
		draw_pegholes(sideview,pegbox.pegs,pegbox.spacing,pegbox.first_peg,pegbox.angle_side);
	} else { // Should be all renaissance like pegboxes - chanterelle and bass rider
		draw_pegbox_side(sideview,pegbox);
		
	}
	if (!this.guitar){
		// Add endclasp on top of body sideview
		// console.log("endclasp in drawside", endclasp);
		// drawshape(sideview, endclasp.endshape ,COVERSTYLE,false,false);
		// Edge of endclasp doubled for 3d effect
		// drawshape(sideview,[endclasp.top_middle.move(0,3),
						// endclasp.cu.move(-0.3,-1).bezier(endclasp.top_middle.move(-1,3),endclasp.cu.move(1,-4)),
						// endclasp.styletip.bezier(endclasp.cu.move(-5.5,14),
						// endclasp.styletip.move(3,-31))
						// ] ,PEGSTYLE,false,false);
		var eshape = zy(endclasp.shape)/*  */;
		eshape.push(new Point(0,0,0));
		var top_mid = intersect_pointlist_x(body.middle_points, endclasp.shape[0].z);
		for (var i=0; i<top_mid.i; i+=2){
			eshape.push(body.middle_points[i].move(0,-1*(i/top_mid.i)));
		}
		eshape.push(eshape[0].move(0,-0.8));
		drawshape(sideview, eshape ,COVERSTYLE,false,true);
	}
	// Define soundboard sideview path
	var bridgep = zeropoint.move(0, bridge.middle.y);
	var rosette = body.rosette.setx(3);
	var end = neck.joint.setx(0);
	var handlel = Math.abs(bridge.y-end.y)/6;
	var sbpath = [
		zeropoint, 
		bridgep,
		rosette.bezier(bridgep.move(0,handlel), rosette.move(0,-handlel)),
		end.bezier(rosette.move(0,handlel), end.move(0,-handlel)),
		// Same backwards to create top side
		end.move(-1.8),
		rosette.move(-1.5).bezier(end.move(-1.5,-handlel), rosette.move(-1.5,handlel)),
		bridgep.move(-1.5).bezier(rosette.move(-1.5,-handlel), bridgep.move(-1.5,handlel)),
		zeropoint.move(-1.5)
		]
	drawshape(sideview, sbpath, COVERSTYLE,"", true);
	
	// TODO: Strap pin or hook
	// TODO: neckblock ... from calculated body perhaps
	drawline(sideview, [body.neckblock.setx(0), intersect_pointlist_y(body.middle_points, body.neckblock.y, body.widest_i).move(-1.7)],BEHINDSTYLE);
	
	
}
Instrument.prototype.draw_info = function(origin){ // Draw instrument information plate
	this.origins.info = origin || new Point(0,30);
	// console.log(this.origins.info);
	var infoview = makegroup(this.layer, "infoplate"+this.i_number);
	infoview.setAttribute("transform", "translate("+(this.origins.info.x)+" "+(this.origins.info.y)+")");
	var zeropoint = new Point(0,0);
	// Body shape, rib number
	// String information + characterization
	// Date
	// Project name
	// TEXTSTYLE
	var t = drawtext(infoview, zeropoint.move(-5), "Project Title", GRAYTEXT);
	movetext(t); // Move left by width
	var t = drawtext(infoview, zeropoint.move(-5,10), "Body Shape", GRAYTEXT);
	movetext(t);
	var t = drawtext(infoview, zeropoint.move(-5,20), "Created on", GRAYTEXT);
	movetext(t);
	var t = drawtext(infoview, zeropoint.move(-5,30), "Strings", GRAYTEXT);
	movetext(t);
	// TODO: movetext places text differently when page first loads vs after page has been zoomed, because viewbox then gets more correct(?) second parameter. 
	
	if (this.ed.pagetitle) {
		drawtext(infoview, zeropoint, this.ed.pagetitle);
	} else {
		drawtext(infoview, zeropoint, "-");
	} 
	if (this.ed.bodyshapefrom == "fromlist"){
		drawtext(infoview, zeropoint.move(0,10), this.ed.bodyshapefromlist);
	} else if (this.ed.bodyshapefrom == "guitar"){
		drawtext(infoview, zeropoint.move(0,10), this.ed.guitarfromlist);
	} else {
		drawtext(infoview, zeropoint.move(0,10), "Constructed");
	}
	var d = new Date();
	drawtext(infoview, zeropoint.move(0,20), d.getFullYear()+"-"+d.getMonth()+"-"+d.getDate());
	drawtext(infoview, zeropoint.move(0,30), stringing());
	
	drawline(infoview,[zeropoint.move(-3,-10), zeropoint.move(-3,30)]);
	
}
Instrument.prototype.draw_cross = function(origin){ //Draw cross view, or butt of bowl
	var ed = this.ed; // Just making the code more concise by grabbing these vars
	var shapes = this.shapes;
	var body = this.body;
	var endclasp = body.endclasp;
	var bridge = this.bridge;
	var guitar = this.guitar;
	var pegbox = this.pegbox;
	var origins = this.origins;
	this.origins.cross = origin || this.origins.cross; // set origin or use default. Only used for translation and rotation.
	
	var zeropoint = new Point(0,0);
	var crossview = makegroup(this.layer, "crossview"+this.i_number);
	crossview.setAttribute("transform", "translate("+(origins.cross.x)+" "+(origins.cross.y)+") scale(-1, 1)");
	
	// Draw soundboard as simple rectangle
	var SB_bot_L = body.bouts[0].sety(0);
	var SB_bot_R = SB_bot_L.scale(-1,1);
	var SB_top = SB_bot_L.move(0,-2);
	var SB_rect = [SB_bot_L, SB_top, SB_top.scale(-1,1), SB_bot_R];
	var SB = drawshape(crossview, SB_rect);
	
	// Draw perfect semicircle for comparison, and center line
	if(!guitar) drawarc(crossview,SB_bot_R, SB_bot_L,SB_bot_L.x,SB_bot_L.x,0,0,0,GUIDESTYLE);
	var centerline = drawshape(crossview, [new Point(0,-2),new Point(0,this.body.depth)],GUIDESTYLE);
	// TODO: Maybe draw inpositive y space and flip?
	if(!guitar){ // Rib edges
		// drawshape(crossview, this.body.crosspoints, REDSTYLE,false,false); // debug only
		mirrorshape(crossview, this.body.endpoints, THINSTYLE,false,false);
		
		if (this.body.ribstarts[r] && this.body.ribstarts[r].y > 0){
			// terminate last rib vertically if needed
			drawline(crossview,[this.body.ribstarts[r], this.body.ribstarts[r].sety(0)]);
		}
		// This is for debugging the clump rib
		// if (this.body.clumprib) drawline(crossview,[this.body.endpoints[this.body.clumprib], this.body.ribstarts[this.body.clumprib]],REDSTYLE);
		
		// Draw actual ribs if available
		if (this.body.ribjoints){
			for (var r=0; r<this.body.ribjoints.length;r++){
				var ribshape = [];
				// for (var i=0; i<this.body.ribjoints[r].length;i++){
				for (var i=0; i<this.body.widest_i;i++){
					ribshape.push(this.body.ribjoints[r][i].xz());
				}
				mirrorshape(crossview,ribshape,THINSTYLE,false,false);
			}
		} else { // Else draw naive lines from shell to ribstarts
			for (var r = 0 ; r < this.body.ribstarts.length; r++){
			drawline(crossview,[this.body.endpoints[r], this.body.ribstarts[r]]);
			drawline(crossview,[this.body.endpoints[r].scale(-1,1), 
								this.body.ribstarts[r].scale(-1,1)]);
		}
		}
		if (this.body.debug){
			for (var r=0; r<this.body.debugcor.length;r++){
				// drawcircle(crossview, this.body.debug[r],0.5, REDSTYLE);
				// drawcircle(crossview, this.body.debugribstart[r],0.3, BLUESTYLE);
				for (var c=0; c< this.body.debugcor[r].length;c++){
					drawcircle(crossview, this.body.debugcor[r][c],0.05, GREENSTYLE);
				}
			}
		}
		
		// Draw endclasp
		// if (this.body.endclasp) mirrorshape(crossview,xz(this.body.endclasp.shape),COVERSTYLE,false,false);
	}
	
	
	
}
Instrument.prototype.draw_templates = function(origin){ // Draw rib and endclasp templates
	var ed = this.ed;
	var endclasp = this.body.endclasp.flattened;
	var templates = this.body.templates;
	var template_info = this.body.template_info;
	var origins = this.origins;
	this.origins.templates = origin || this.origins.templates; // set origin or use default. Only used for translation and rotation.
	
	var tempview = makegroup(this.layer, "templateview"+this.i_number);
	tempview.setAttribute("transform", "translate("+(origins.templates.x)+" "+(origins.templates.y)+") scale(1, -1)");
	
	// endclasp template
	if(endclasp) mirrorshape(tempview,endclasp,THINSTYLE,false,false);
	
	// rib templates
	if (templates){
	for (var i=0; i<templates.length; i++){
		if (templates[i]){
			// console.log("rib template ",i,templates[i]);
			var rib = drawshape(tempview,templates[i],THINSTYLE,false,false);
			if (template_info.sizes[i])rib.setAttribute("transform", "translate(0 "+(template_info.sizes[i].width*-i-template_info.sizes[0].width)+")");
		}
	}}
}

function draw_bridge_side(f, bridge){
	// Draw treble end only if angled bridge
	if (bridge.angle_deg < -0.1 || bridge.angle_deg > 0.1){
		var g2 = makegroup(f,""); // group containing bridge treble end
		g2.setAttribute("transform", " translate(-1.5 "+bridge.treble.y+")");
		var d = bridge.bass.y-bridge.treble.y;
		if (bridge.angle_deg > 0.1){
			drawshape(g2,[bridge.top_UR.setx(0), bridge.top_UR.zy(), bridge.top_UL.zy().move(0,d)], false,false,false);
		} else if (bridge.angle_deg < -0.1){
			drawshape(g2,[bridge.top_DL.zy().move(0,d), bridge.top_DR.zy(), bridge.bot_R.zy(), bridge.bot_R.setx(0)],false,false,false);
			drawline(g2, [bridge.bot_R.zy(), bridge.bot_L.zy().move(0,d)]);
		}
	}
	// Bass end of bridge
	var g = makegroup(f,""); // group containing bridge
	drawshape(g,[bridge.top_UL.setx(0),bridge.top_UL.zy(), bridge.top_DL.zy(), bridge.bot_L.zy(), bridge.bot_L.setx(0)],COVERSTYLE); // bass side
	g.setAttribute("transform", " translate(-1.5 "+bridge.bass.y+")");
}
function draw_bridge_front(f,bridgestyle, bridge,stringbandw){
	// Draw horizontally, then transform to correct angle around first string
	var g = makegroup(f,""); // group containing bridge
	drawshape(g,[bridge.top_UR, bridge.top_UL, bridge.top_DL, bridge.top_DR]); // top rectangle
	drawline(g,[bridge.bot_L, bridge.bot_R]); // Bottom line of bridge
	// Bridge ends
	if (bridgestyle){
		var bridgeend = bridgelist[bridgestyle].cloneNode(true);
	} else { // default case for first time run
		var bridgeend = bridgelist["renaissance"].cloneNode(true);
	}
	bridgeend.setAttribute("transform",""); // Remove any transforms from group
	var bassend = bridgeend.cloneNode(true);
	bridgeend.id = "";
	bassend.id = "";
	addel(g, bridgeend);
	move(bridgeend, bridge.top_UR);
	// Other end of bridge
	addel(g, bassend);
	move(bassend, new Point(-stringbandw-3-bassend.getBBox().width-5, 0));
	mirror(bassend,"h");
	bridgeend.setAttribute("transform", "scale(1,-1)");
	bassend.setAttribute("transform", bassend.getAttribute("transform")+" scale(1,-1)");
	
	// Scale bridge ends
	if (editorstate.bodyshapefrom!="guitar"){
		bridgeend.setAttribute("transform",bridgeend.getAttribute("transform")+" scale(0.9375)"); 
		bassend.setAttribute("transform",bassend.getAttribute("transform")+" scale(1.0315)"); 
	}
	g.setAttribute("transform", " translate("+bridge.treble.x+" "+bridge.treble.y+") rotate("+(halfpi-bridge.angle)/radtodeg+")");
}


function draw_theorbo_ext_front(f,pegbox,nuts){
	var nut = getlast(nuts);
	if (pegbox.fold){
		// Extension hinge
		var B = pegbox.fold.hinge_bass.movedist(-0.5,pegbox.angle_front-halfpi);
		var T = pegbox.fold.hinge_treble.movedist(0.5,pegbox.angle_front-halfpi);
		drawshape(f,[T.movedist(5,pegbox.angle_front), 
						   T.movedist(-5,pegbox.angle_front),
						   B.movedist(-5,pegbox.angle_front),
						   B.movedist(5,pegbox.angle_front)]
						   ,COVERSTYLE);
	}
	// Shaft
	var treble_end = pegbox.end_treble.movedist(120,trueangle(pegbox.start_treble, pegbox.end_treble));
	var bass_end = pegbox.end_bass.movedist(120,trueangle(pegbox.start_bass, pegbox.end_bass));
	drawshape(f, [pegbox.start_treble, treble_end, bass_end, pegbox.start_bass], COVERSTYLE,false,false);
	// pegbox lower hole
	drawshape(f,[pegbox.hole.end_bass_top,pegbox.hole.start_bass_top,pegbox.hole.start_treble_top,pegbox.hole.end_treble_top]);
	
	// upper pegbox 
	var headg = makegroup(f);
	headg.setAttribute("transform", "translate ("+pegbox.end_treble.x+" "+pegbox.end_treble.y+") rotate("+(-pegbox.angle_front/radtodeg)+") scale(-1,1) ");
	var heado = creel("path", "", "", ["d",theorbohead_outline], NAMESPACE);
	addel(headg,heado);
	heado.setAttribute("style",COVERSTYLE);
	
	var headi = creel("path", "", "", ["d",theorbohead_detail], NAMESPACE);
	addel(headg,headi);
	headi.setAttribute("style",THINSTYLE);
	
	// draw pegs partly hidden by extension sides
	draw_pegs_front_(f,pegbox.spacing, pegbox.pegs, pegbox.angle_bass, pegbox.angle_treble, pegbox.angle_front-halfpi, pegbox.first_peg, pegbox.start_treble, pegbox.hole.start_bass_top, pegbox.hole.start_treble_top,PEGSTYLE);
	
	// Foldable extension
	if (pegbox.fold){
		// Extension split on the front
		drawline(f, [pegbox.fold.split_treble, pegbox.fold.split_bass]);
	}
	
}
function draw_theorbo_ext_side(f,pegbox,nuts){
	var nut = getlast(nuts);
	// shaft
	var endp = pegbox.end_treble.zy().move(17);
	var startp = pegbox.start_bass.zy().move(22,10);
	var a = trueangle(endp,startp);
	var cp1 = startp.movedist(-20, a);
	var cp2 = pegbox.slot_bass.zy().move(9,5)
	var cpa = endp.movedist(-7, a);
	var cpb = pegbox.end_treble.zy().movedist(-7, a-halfpi);
	drawshape(f, [pegbox.start_bass.zy(), 
				  pegbox.end_treble.zy(),
				  endp.movedist(-17, a).bezier(cpb,cpa), 
				  startp,
				  pegbox.slot_bass.zy().bezier(cp1,cp2) ], COVERSTYLE);
	// upper pegbox
	var headg = creel("path", "", "", ["d",theorbohead_sided], NAMESPACE);
	addel(f, headg);
	headg.setAttribute("style",THINSTYLE);
	headg.setAttribute("transform", "translate ("+pegbox.end_treble.zy().x+" "+pegbox.end_treble.zy().y+") rotate("+(-pegbox.angle_side/radtodeg)+")");
	var p = nut.bass_far.setx(1).move(25,-2);
	// drawshape(f, [nut.bass_near.setx(-3), nut.bass_far.setx(1), p,p.movedist(5.5, pegbox.angle_side) ], COVERSTYLE);
	drawshape(f, 
			[p.movedist(6, pegbox.angle_side),
			 p,
			 nut.bass_far.setx(0),
			 nut.bass_near.setx(-3).move(0,1).bezier(nut.bass_far.setx(-2), 
													 nut.bass_near.setx(-3).move(0,3)),
			 nut.bass_near.setx(-3)], COVERSTYLE);
	if (pegbox.fold){
		// var foldg = makegroup(f, "", null);
		// hinge side view
		
		var H = pegbox.fold.hinge_bass.zy();
		
		var T = H.movedist(8,a);
		var B = H.movedist(-8,a)
		var M = H.movedist(-6.6, a-halfpi);
		var cp1 = T.movedist(-2,a-halfpi).movedist(-2,a);
		var cp2 = M.movedist(5,a);
		var cp3 = M.movedist(-5,a);
		var cp4 = B.movedist(-2,a-halfpi).movedist(2,a);
		drawshape(f,[T, T.movedist(-2,a-halfpi),
					 M.bezier(cp1,cp2),
					 B.movedist(-2,a-halfpi).bezier(cp3,cp4), 
					 B ]);
		// Draw split in extension
		drawshape(f, pegbox.fold.split_points, THINSTYLE,"", false);
		drawcircle(f, H,5, COVERSTYLE,""); // hinge tube
		drawcircle(f, H,4, null,"");
		// Draw folded sideview, straight down from hinge tube
		var S = H.move(20,69);
		var E = S.move(0, -linelength(pegbox.fold.split_points[0], pegbox.end_treble.zy()));
		drawshape(f, [S, S.move(-8), S.move(-8,-15), S.move(-20,-15), 
					  E.move(-16,16), E.relbezier(-16,7,-7,0)
					], THINSTYLE,"", true);
		var headg2 = creel("path", "", "", ["d",theorbohead_sided], NAMESPACE);
		addel(f, headg2);
		headg2.setAttribute("style",THINSTYLE);
		headg2.setAttribute("transform", "translate ("+E.x+" "+E.y+") ");
		// Bass nut on folded extension
		var p = E.move(23,112);
		drawshape(f, 
			[p.move(0,-6), p,
			 p.move(28,-1),
			 p.move(24,-5).bezier(p.move(28,-3), p.move(26,-5))], COVERSTYLE);
	}
}
function draw_pegbox_front(f,pegbox){
	// inside
	drawshape(f, [pegbox.hole.end_bass_bottom, pegbox.hole.end_treble_bottom, pegbox.hole.end_treble_top, pegbox.hole.end_bass_top ], COVERSTYLE);
	// inside bottom
	var B = intersectline(pegbox.hole.end_bass_bottom,pegbox.hole.block_start_bass,  pegbox.start_treble, pegbox.start_bass);
	var T = intersectline(pegbox.hole.end_treble_bottom, pegbox.hole.block_start_treble,  pegbox.start_treble, pegbox.start_bass);
	drawshape(f, [pegbox.hole.end_bass_bottom, pegbox.hole.end_treble_bottom, T,B ]);
	// Top
	drawshape(f, [pegbox.start_bass, pegbox.end_bass, pegbox.end_treble,pegbox.start_treble,  pegbox.hole.start_treble_top, pegbox.hole.end_treble_top,pegbox.hole.end_bass_top,pegbox.hole.start_bass_top, ], COVERSTYLE);
	
	// drawX(f,pegbox.hole.block_start_treble,2, REDSTYLE);
	// drawX(f,pegbox.hole.block_start_bass,2, REDSTYLE);
	
}

function draw_pegbox_back(f,pegbox){
	// Bass side
	drawshape(f, [pegbox.start_bass, pegbox.end_bass, pegbox.low_bass, pegbox.slot_bass], COVERSTYLE);
	// Treble side
	drawshape(f, [pegbox.start_treble, pegbox.end_treble, pegbox.low_treble, pegbox.slot_treble], COVERSTYLE);
	
	// Bottom 
	var w = linelength(pegbox.slot_treble, pegbox.slot_bass)/3;
	var h = flatlinelength(pegbox.slot_middle, pegbox.slot_treble.avg(pegbox.slot_bass))/3;
	var cp1 = pegbox.slot_treble.move(0,0);
	var cp2 = pegbox.slot_bass.move(0,0);
	var mL = pegbox.slot_middle.movedist(w,pegbox.start_angle);
	var mR = pegbox.slot_middle.movedist(-w,pegbox.start_angle);
	drawshape(f, [pegbox.slot_treble, pegbox.slot_middle.bezier(cp1,mL), pegbox.slot_bass.bezier(mR,cp2), pegbox.low_bass, pegbox.low_treble], COVERSTYLE);
	// Tip
	drawshape(f,[pegbox.low_bass,pegbox.low_treble, pegbox.end_treble,pegbox.end_bass], COVERSTYLE);
	// drawX(f,pegbox.first_peg,1,REDSTYLE);
	// drawX(f,pegbox.hole.block_treble_mid,1,REDSTYLE);
	// drawX(f,pegbox.hole.block_start_treble,2, REDSTYLE);
	// drawline(f,[pegbox.start_bass, pegbox.test],REDSTYLE);
	
	// drawshape(f,[pegbox.hole.end_bass_bottom, pegbox.hole.block_bass_bottom, pegbox.hole.block_bass_mid, pegbox.hole.start_bass_top],REDSTYLE,false,false);
}

function draw_pegbox_side(f,pegbox){
	
	// neckblock thing
	// drawshape(f, [pegbox.slot_treble.zy(), ], COVERSTYLE);
	if (pegbox.start_angle < halfpi){ // draw top and tip only when visible
		// Treble inside of pegbox
		drawshape(f, [pegbox.hole.block_start_treble.zy(), pegbox.hole.start_treble_top.zy(), pegbox.hole.end_treble_top.zy(),pegbox.hole.end_treble_bottom.zy()], COVERSTYLE);
		// Pegbox wide block
		drawshape(f,[pegbox.hole.block_bass_bottom.zy(), pegbox.hole.block_treble_bottom.zy(), pegbox.hole.block_treble_mid.zy(), pegbox.hole.start_treble_top.zy(), pegbox.hole.start_bass_top.zy(), ],COVERSTYLE,false,false);
		drawshape(f,[ pegbox.hole.block_treble_mid.zy(), pegbox.hole.block_bass_mid.zy()],THINSTYLE,false,false);
		
		drawshape(f,[pegbox.low_bass.zy(),pegbox.low_treble.zy(), pegbox.end_treble.zy(),pegbox.end_bass.zy()], COVERSTYLE);
		drawshape(f, [pegbox.start_bass.zy(), pegbox.end_bass.zy(), pegbox.end_treble.zy(),pegbox.start_treble.zy(),  pegbox.hole.start_treble_top.zy(), pegbox.hole.end_treble_top.zy(), pegbox.hole.end_bass_top.zy(), pegbox.hole.start_bass_top.zy()], COVERSTYLE);
		
	} else { // Draw bottom (and tip?) under neck...
		try{
		var p = pegbox.slot_farside;
		var p2 = pegbox.slot_middle.zy();
		var cp1 = p2.move((pegbox.slot_bass.z-p2.x)*0.1 , Math.abs(pegbox.slot_bass.y-p2.y));
		var cp2 = pegbox.slot_bass.zy().move((p2.x-pegbox.slot_bass.z)*0.3,0 );
		drawshape(f, [p, p2, pegbox.slot_bass.zy().bezier(cp1,cp2), pegbox.low_bass.zy(), pegbox.low_treble.zy()], COVERSTYLE);
		} catch(e){console.log("pegbox bottom on sideview failed,"),e}
	}
	
	// Bass side of pegbox
	drawshape(f, [pegbox.slot_bass.zy(), pegbox.start_bass.zy(), pegbox.end_bass.zy(), pegbox.low_bass.zy()], COVERSTYLE);
	var a = trueangle(pegbox.low_bass.zy(), pegbox.end_bass.zy());
	drawline(f,[pegbox.slot_bass.zy().move(0,2), pegbox.low_bass.zy().movedist(-2,a)],PEGSTYLE);
	// Holes
	draw_pegholes(f,pegbox.pegs,pegbox.spacing,pegbox.first_peg,pegbox.angle_side);
	
	// drawshape(f, [  ]);
	// drawX(f,pegbox.hole.block_start_treble.zy(),2, REDSTYLE);
	// drawX(f,pegbox.hole.block_start_bass.zy(),2, REDSTYLE);
	// drawX(f,pegbox.hole.block_treble_mid.zy(),2, REDSTYLE);
	// drawline(f,[pegbox.start_bass.zy(), pegbox.test.zy()],REDSTYLE);
	// drawshape(f,[pegbox.hole.end_bass_bottom.zy(), pegbox.hole.block_bass_bottom.zy(), pegbox.hole.block_bass_mid.zy(), pegbox.hole.start_bass_top.zy()],REDSTYLE,false,false);
	
	// Draw chanterelle rider and bass rider
	try{ if (pegbox.style == "chanterelle" || pegbox.style == "bassrider"){
		// insert_drawing(fromsvg, id, togroup, topoint, rotate, rotpoint)
		insert_drawing("", "chanterellerider-side", f, pegbox.start_treble, 0);
		// insert_drawing("", "pegbox-jauckmandora-side", sideview, side.move(2));
		// cps.pegboxend = side.move(-60,-235);
	}} catch(e) {console.log(e);}
	try{ if (pegbox.style == "bassrider"){ // Draw bass rider on sideview
		
	}} catch(e) {console.log(e);}
}


function draw_pegholes(g,pegs,spacing,startp,angle,startsmall){
	for (var i=0; i<pegs;i++){
		if (i%2==0){
			drawcircle(g,startp.zy().movedist(-spacing*i, angle),startsmall?2.5:3.5);
		} else {
			drawcircle(g,startp.zy().movedist(-spacing*i, angle),startsmall?3.5:2.5);
		}
	}
}
function draw_pegholes_pos(g,startpos, pegpos,startsmall, allbig){

	for (var i=0; i<pegpos.length;i++){
		if (allbig){
			drawcircle(g, startpos.addpoint(pegpos[i]), 3.5);
		} else if (i%2==0){
			drawcircle(g,startpos.addpoint(pegpos[i]),startsmall?2.5:3.5);
		} else {
			drawcircle(g,startpos.addpoint(pegpos[i]),startsmall?3.5:2.5);
		}
	}
}

function draw_fast_body (g, ed, path, ribs, mirror, dontscale){ 
	// quickly cheat and draw ribs by scaling side path
	const zeropoint = new Point(0,0);
	var ribs = mirror ? ribs/2: Math.floor(ribs/2);
	const a = halfpi/(ribs);
	// const exp = 2/ed.bulge ;//(1/(0.5*ed.bulge));
	
	for (var i=0; i<ribs-1; i++){
		var rib = copyelement(g, path, zeropoint,THINSTYLE);
		var b = Math.sin((i+(mirror?0.5:1.0))*a)/*  ** exp */;
		if (dontscale) {
			scalepath_xy(rib, ed.bodyscale*b, ed.bodyscale); // Flip and rescale
		} else {
			scalepath_xy(rib, -ed.bodyscale*b, -ed.bodyscale); // Flip and rescale
		}
		if (mirror){
			var trebleside = mirrorpath(g,rib); 
		}
		// rib.setAttribute("style",REDSTYLE);
	}
	// console.log("fast body",rib);
}

function draw_fast_crossview (g,ed){
	
}

// Add pegs to theorbohead


















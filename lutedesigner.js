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

///////////////////////////////////////////////////////////////////////////////
// Global defaults and variables
///////////////////////////////////////////////////////////////////////////////
var NAMESPACE ='http://www.w3.org/2000/svg';
var TEXTH = 10;
var DIGITS = 2; // SVG coordinate accuracy, digits after decimal point
var REDSTYLE = "stroke:#ff0000;stroke-width:0.4; fill:none;";
var BLUESTYLE = "stroke:#0000ff;stroke-width:0.4; fill:none;";
var THINBLUE = "stroke:#0000e0;stroke-width:0.1; fill:none;";
var PURPLESTYLE = "stroke:#ff00ff;stroke-width:0.4; fill:none;";
var HIDDENSTYLE = "stroke:#000000;stroke-width:0.0; fill:none;";
var STRINGSTYLE = "stroke:#777777;stroke-width:0.5; fill:none;";
var THINSTYLE = "stroke:#000000;stroke-width:0.4; fill:none;";
var PEGSTYLE = "stroke:#000000;stroke-width:0.2; fill:none;";
var PEGSTYLEcover = "stroke:#000000;stroke-width:0.2; fill:#f9f9f9;fill-rule:nonzero;";
var RIBSTYLE = "stroke:#000000;stroke-width:0.4; fill:#cccccc;";
var NOFILLTHIN = "stroke:#000000;stroke-width:0.4; fill:none;";
var THICKSTYLE = "stroke:#000000;stroke-width:0.8; fill:none;";
var OCTSTYLE = "stroke:#bb0000;stroke-width:0.4; fill:none;";
var SEVENTHSTYLE = "stroke:#0000bb;stroke-width:0.4; fill:none;";
var GREENSTYLE = "stroke:#00bb00;stroke-width:0.4; fill:none;";
var GRAYSTYLE = "stroke:#999999;stroke-width:0.4; fill:none;";
var MARKLENGTH = "stroke:#333333;stroke-width:0.4; fill:none;";
var COMPARESTYLE = "stroke:#777777;stroke-width:0.4; fill:none;stroke-dasharray:5,5";
var RULERSTYLE = "stroke:#0000ff;stroke-width:0.4; fill:none;stroke-dasharray:1,1";
var GUIDESTYLE= "stroke:#000000;stroke-width:0.4; fill:none;stroke-dasharray:2,4";
var BEHINDSTYLE= "stroke:#000000;stroke-width:0.4; fill:none;stroke-dasharray:1,1";
var COVERSTYLE = "stroke:#000000;stroke-width:0.4; fill:#f9f9f9;";
var TEXTSTYLE = "stroke:none;stroke-width:0; fill:#000000;font-size: 10px;";
var SMALLTEXT = "stroke:none;stroke-width:0; fill:#333333;font-size: 6px;";
var GRAYTEXT = "stroke:none;stroke-width:0; fill:#444444;font-size: 8px;";
var NORMALSTYLE = 'stroke:none;stroke-width:0; fill:rgba(0,0,255,0.05);'; // fill-opacity="0.1"
var NORMALSTYLE2 = 'stroke:none;stroke-width:0; fill:rgba(255,0,0,0.05);'; // fill-opacity="0.1"
var BORDERSTYLEWHITE = "stroke:#000000;stroke-width:0.25; fill:#ffffff;";
var BORDERSTYLEBLACK = "stroke:#000000;stroke-width:0.25; fill:#bbbbbb;";
var BORDERWIDTH = 5.0;
var BOXSTYLE = "stroke:#000000;stroke-width:0.4; fill:none;";
var HANDLESEGPOINTSTYLE = "stroke:#0000bb;stroke-width:1; fill:rgba(0,0,200,0.05);";
var HANDLEPOINTSTYLE = "stroke:#bb0000;stroke-width:1; fill:rgba(200,0,0,0.05);";
var HANDLELINESTYLE = "stroke:rgba(0,0,200,0.2);stroke-width:1.0; fill:none;";
var MIRROR_HORIZONTAL = "scale(-1, 1)";
var MIRROR_VERTICAL = "scale(1, -1)";
var RIBTHICKNESS = 1.5; // Amount to offset inner outline paths for mold making

/* // TODO: Style system: 
	Style("thin")
	Style("thin,fill")
	Style("red")
	use params[] or parse string

*/

var bodylist = {}; // This will be overwritten when bodies.svg is read

var DRAWINGWIDTH = 750;
var DRAWINGHEIGHT = 800;
var FRONTVIEWORIGIN = new Point(0,0);
var BOTTOMVIEWORIGIN = new Point(-200,DRAWINGHEIGHT-20);
var SIDEVIEWORIGIN = new Point(600,0);
var DETACHEDORIGIN = new Point(100,150);
var CROSSVIEWORIGIN = new Point(500,200);
var NECKBLOCKORIGIN = new Point(500,300);
var FORMORIGIN = new Point(300, DRAWINGHEIGHT-20);
var INFOBOXORIGIN = new Point();
var editorstate = {};

var bridgelist = {};
var barlist = [];
var p1="";
var p2="";
var pt = null; // touch or click point
var touchzpt = null; // second touch point for zooming on mobile
var touchzdist = 0; // first distance between touch points

var cachedlinelist = {}; // id:{step:linelist, step:linelist}
var rulerpos = null;
var panmovestart = null;
var handlestart = null;
var handleid = "";
var editable_paths = {};
var editing = {};
// var currentbody = {}; // element references to side, mirrored, middle, cross
// var cps = {}; // Contains some element positions like neck joint location
var radtodeg = 0.01745329252; // degrees = radians / radtodeg // TODO: conversion functions
var halfpi = Math.PI/2;
// var stringbandws = [];

var backuptime = Date.now();
// var lute3d ={};
var analyses = [];
var analysis;
var reflection_type = "normal";
var measuremode = false;

var drawing, debuglayer, measurelayer,features2;
// TODO: OOPify so that many lutes can be drawn side by side - lutedesigner-lute.js
// --> lute3d, cps, currentbody

// lasku.js: make VAT notice changeable

// TODO: Body shape input as svg path in textbox. bodyshapefrom=svgpath, sub area. fill in with current side shape as a start point.

// TODO: Automated tests
//	timed function that goes through some presets, ctrl+z behaviour, change individual inputs
//	collect errors <-- know which part of test generated error
//	How to verify other output?

// TODO: guitar body options don't activate when a guitar preset is loaded
// TODO: redo presets
// TODO: STLify 3d stuff, then view STL in 3d viewer
// TODO: Live 3D view that reacts to editorstate changes

// TODO: Auto change string length: mensur should change with unit change. Still need to figure out Frets mode
// TODO: simple form uses same group names as whalebone for bones
var instruments = new List(); // Store instrument objects, which get drawn in svg


///////////////////////////////////////////////////////////////////////////////
// Create default view when page is loaded
///////////////////////////////////////////////////////////////////////////////

function _makedrawing(caller){ // New
	// console.clear();
	var t0 = performance.now();
	// console.log("Drawing a",editorstate.drawingpurpose);
	// if (editorstate.drawingpurpose=="") editorstate.drawingpurpose="technical";
	// Main drawing handler, used to refresh drawing completely
	// Inputs have been gathered already and are stored in editorstate
	// Delete contentsfrom previous runs
	drawing = getelid("designer-canvas");
	// delchildren(drawing);
	
	// TODO: Setting change causes window to be position more and more left of where it should be
	// Zooming and scrolling
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
	
	// Make groups for functions to populate
	var t1 = performance.now();
	// console.log("It took " + (t1 - t0).toFixed(0) + " ms to prepare");
	// Draw instrument
	// TODO: Depending on draw mode, initiate body&rib shape calculation as a web worker here, then add their results to drawing with a callback
	try {
		if(instruments.all().length==0){
			console.log("ed",editorstate);
			instruments.add(editorstate);
			instruments.add(instrumentpresets["railich 615mm 11c"]);
			instruments.add(instrumentpresets["gerle 600mm 6c"]);
			instruments.add(instrumentpresets["Hoffmann 700mm 11c"]);
			instruments.draw_comparison();
		} else {
			instruments.set(0, new Instrument(editorstate,0));
			instruments.draw_comparison(0);			
		}
		
		 // TODO: try catch and just draw first one
		
		// Set viewbox around first instrument
		var view = instruments.get(0).get_viewbox(); // TODO: get_viewbox of all insturments
		if (!drawing.getAttribute("viewBox")) {
			drawing.setAttribute("viewBox","-"+(view.w)+" -"+(view.h)+" "+(view.h)+" "+(view.h));
		
		}
		// console.log("viewBox","-"+(view.w)+" -"+(view.h)+" "+(view.h)+" "+(view.h));
	} catch (e){
		console.log("Calculating/drawing instrument failed",e);
	}
	
	// Hide debuglayer
	// debuglayer.setAttribute("style","display:none;");
	measurelayer = makegroup(drawing, "measurelayer");
	debuglayer = makegroup(drawing, "debuglayer");
	document.title = editorstate.pagetitle || "Lute Designer | Niskanen Lutes";
	if (editorstate.drawingpurpose=="") editorstate.drawingpurpose="technical";
	
	var t1 = performance.now();
	console.log("It took " + (t1 - t0).toFixed(0) + " milliseconds to draw the SVG. Called by", caller);
	backup();
	
	try {
		if (features2){
		for (var i=0; i<features2.length; i++){
			features2[i](); // run function added features if any
		}}
	} catch(e){
		console.log(e);
	}
	
	// Make sure options areas are correctly sized if opened
	var els = document.getElementsByClassName("options_area");
	for (var i=0; i< els.length; i++){
		if (els[i].style.maxHeight) els[i].style.maxHeight = els[i].scrollHeight + "px";
	}
	
}
function makedrawing(caller){ // Old
	try {
	// console.clear();
	var t0 = performance.now();
	document.title = editorstate.pagetitle || "Lute Designer | Niskanen Lutes";
	
	if (editorstate.drawingpurpose === undefined || editorstate.drawingpurpose=="") editorstate.drawingpurpose="technical";
	
	// Main drawing handler, used to refresh drawing completely
	// Inputs have been gathered already and are stored in editorstate
	// Delete contents from previous runs
	var drawing = getelid("designer-canvas");
	delchildren(drawing);
	cps = {};
	lute3d = {};
	dzpt = drawing.createSVGPoint(); // dragging handles
	// Make groups for functions to populate
	
	var drawing = getelid("designer-canvas");
	var drawinglayer = makegroup(drawing, "drawinglayer", "Drawing");
	drawtext(drawing, new Point(0,0), JSON.stringify(editorstate), HIDDENSTYLE,"editorstate")
	
	// Layers for the actual plan
	var border = makegroup(drawinglayer, "border");
	var frontview = makegroup(drawinglayer, "frontview");
	var crosslayer = makegroup(drawinglayer, "crosslayer");
	var sideview = makegroup(drawinglayer, "sideview");

	decidesize(drawing,frontview,sideview);
	
	var bars = makegroup(frontview, "bars");
	var detached = makegroup(drawinglayer, "detached-pegbox");
	
	
	
	var flatlayer = makegroup(drawinglayer, "flatribs-layer");
	var formlayer = makegroup(drawinglayer, "formlayer");
	var infobox = makegroup(drawinglayer, "infobox");
	var handles = makegroup(drawing, "handlelayer");
	var measure = makegroup(drawing, "measurelayer");
	var debuglayer = makegroup(drawing, "debuglayer");
	
	// Draw test
	// drawtest_circle(frontview);
	
	// Draw things
	drawborder(border);
	drawfront(frontview,bars);	
	drawside(sideview);
	//
	

	drawpegbox(frontview,sideview,detached); // Draw pegbox side and front, and detached
	
	// Draw form on a new layer/group
	// if (editorstate.drawingpurpose.indexOf("form") >=0 ){
		
	// } 
	try {
		if (editorstate.bodyshapefrom=="guitar"){
			accuracy = 4;
			drawguitarback();
		} else { // Lute
			accuracy = 2;
			drawribs(crosslayer); // Draw and calculate ribs in sideview and crossview
		}
	} catch(e){
		console.log(e);
	}
	
	// drawtest();
	try {
		for (var i=0; i<features.length; i++){
			features[i](); // run function added features if any
		}
	} catch(e){
		console.log(e);
	}
	
	drawinfobox(infobox); // Logo and instrument information
	// toothlinetest();
	
	// Draw handles for editing editable paths and things
	// hidehandles(getelid("hidehandles"));
	// drawhandles();
	// Hide debuglayer
	// debuglayer.setAttribute("style","display:none;");
	
	
	
	var t1 = performance.now();
	console.log("It took " + (t1 - t0).toFixed(0) + " milliseconds to draw the SVG. Called by", caller)
	backup();
	
	// Make sure options areas are correctly sized if opened
	var els = document.getElementsByClassName("options_area");
	for (var i=0; i< els.length; i++){
		if (els[i].style.maxHeight) els[i].style.maxHeight = els[i].scrollHeight + "px";
	}
	// Fix illegal SVG tags such as "use"
	fix_svg();
	
	// Live 3D view
	var bodyviewer = getelid("bodyviewer");
	if (bodyviewer && bodyviewer.className != "hidebodyviewer"){
		live_update();
	}
	
	} catch(e) { // Catcher for the whole drawing process
		// send_error(e);
		console.log(e);
	}
	// Check console.everything for error messages and send to server if found
	send_error();
	// makehash(editorstate);
}
function fix_svg(){
	try {
		// Fix illegal SVG tags such as "use"
		var list = document.getElementsByTagName("use");
		for (var naughty of list){
			console.log("deleting", naughty.id);
			delel(naughty);
		}
	} catch (e) {
		console.log(e);
	}
}

function loadassets(){
	// Load rosettes and body shapes and materials etc. so that they are available for use in the editor. This is only performed once, on page load.
	// Global bodylist will be filled with references to body shapes defined in the body.svg file which is loaded by the html page but hidden
	var embedel = getelid("svg-bodies")
	// console.log("embedel",embedel);
	var svgdoc = embedel.contentDocument;//getSVGDocument();
	// console.log("contentel",svgdoc);
	
	
	var bodiesg = svgdoc.getElementById("bodies");
	var bodyshapes = bodiesg.children;
	for (var i=0; i<bodyshapes.length; i++){
		var name = bodyshapes[i].id.split("-")[0];
		var shape = bodyshapes[i].id.split("-")[1];

		if (bodylist[name]){
			// If a new bodyshape name is met: create a new bodyshape object in bodylist
			if (bodylist[name][shape]){
				// If this name already has this shape, show error in console; There is a duplicate in the source file
				console.log("Possible duplicate in body.svg: ",name,shape);
			} else {
				// Give name a new shape
				bodylist[name][shape] = bodyshapes[i];
				// For hard coding body shape presets
				// bodynames += '["'+name+'", 13, 2.2, 0.6],\n';
				//["venere", 13, 2.2, 0.6],
			}
		} else {
			// Make new name and shape in bodylist
			var t = {};
			t[shape] = bodyshapes[i];
			bodylist[name] = t;
		}
	}
	var bridgesvgdoc = getelid("svg-bridges").getSVGDocument();
	var bridgesg = bridgesvgdoc.getElementById("bridges");
	var bridges = bridgesg.children;
	for (var i=0; i<bridges.length; i++){
		if (bridges[i].id.indexOf("bridge-") >=0 ){
			var n = bridges[i].id.split("-")[1];
			// Bridge ends are stored as groups of paths
			bridgelist[n] = bridges[i];
		}
	}
	var theorbosvgdoc = getelid("svg-theorbos").getSVGDocument();
	theorbohead_front = theorbosvgdoc.getElementById("theorbohead-front");
	theorbohead = theorbosvgdoc.getElementById("theorbohead-side");
	
	// Set defaults for loaded assets in editor
	// This might not accomplish anything if done here?
	getelid("bodyshapefromlist").lastChild.selected=true;
	// getelid("guitarfromlist").lastChild.selected=true;
	getelid("bridgestyle").lastChild.selected=true;
}

function populateeditor(){
	// Populate editor with loaded assets, and with backed up values
	// Remove all data from editor, since presets may not contain all fields
	for (el in document.getElementById("designer-control-panel").getElementsByTagName("input")){
		el.value = undefined;
	}
	// Instrument preset selection
	var ipreset = getelid("instrumentpreset");
	create_select_options(ipreset, instrumentpresets);
	
	// Create and fill bridge style selector
	var bridgeselector = getelid("bridgestyle");
	create_select_options(bridgeselector, bridgelist);
	
	// Create and fill body shape selector
	var bodyshape = getelid("bodyshapefromlist");
	var guitarshape = getelid("guitarfromlist");
	delchildren(bodyshape);
	delchildren(guitarshape);
	var names = Object.getOwnPropertyNames(bodylist);
	for (var i=0; i<names.length; i++){
		var newoption = creel("option", "", "", ["value", names[i]]);
		newoption.innerHTML = names[i];
		if (bodylist[names[i]].guitar){
			addel(guitarshape, newoption);
			// console.log(names[i]);
		} else {
			addel(bodyshape, newoption);
		}

	}
	getelid("guitarfromlist").lastChild.selected=true;
	// console.log("populateeditor");
	// Put values from editorstate into the editor
	var targets = Object.getOwnPropertyNames(editorstate);
	for (var i=0; i<targets.length; i++){
		// console.log("did", targets[i], editorstate[targets[i]] );
		if (getelid(targets[i])){
			if (getelid(targets[i]).type == "checkbox") {
				if (editorstate[targets[i]]){
					getelid(targets[i]).checked = true;
				} else {
					getelid(targets[i]).checked = false;
				}
			} else {
				getelid(targets[i]).value = editorstate[targets[i]];
			}
			
		}
		
		// console.log("now", targets[i],  getelid(targets[i]).value);
	}
	editorstate.numbernuts = editorstate.numbernuts || 1;
	makenutselectors();
	changebodymethod(true);
}

function stringing(){
	// Make a string that describes the stringing of the instrument eg. "1x1+2x6-2x7"
	var courses = "";
	if (editorstate.singlestrings){
		courses+= "1x" + editorstate.fingerboardcourses;
	} else if (editorstate.chanterelles>0){
		courses+= "" + editorstate.chanterelles;
		courses+= "+2x" + (editorstate.fingerboardcourses-editorstate.chanterelles);
	} else {
		courses+= "2x" + editorstate.fingerboardcourses;
	}
	if (editorstate.numbernuts > 1){
		var b = 1;
		while (editorstate["singles_"+b] !==undefined && b < editorstate.numbernuts){
			if (editorstate["singles_"+b]){
				courses+= "-1x" + editorstate["courses_"+b];
			} else {
				courses+= "-2x" + editorstate["courses_"+b];
			}
			b++;
		}
		
	}
	return courses;
}


function send_error(){
	// TODO: This currently only manages to send a report when the page loads, but never after adjusting drawing options
	if (origin == "http://127.0.0.1:81") return;
	if (!console.everything) return;
	var sendit = false;
	var errors = [];
	var textlog = [];
	for (var line of console.everything){
		if ( line.type == "error"
			|| (line.value !== undefined 
			&& line.value[1] !== undefined 
			&& line.value[1].stack !== undefined)){
			sendit = true;
			if (line.type == "log"){ // Separately save errors because json.stringify does not store their contents
				errors.push(line.value[0]+" "+line.value[1].message);
				errors.push(line.value[1].stack);
			}
		}
		// line.value.forEach(function(thing){
			// if (thing.stack){
				// textlog.push(thing.stack);
			// } else {
				// textlog.push(thing);
			// }
		// });
		// textlog.push();
	}
	if (!sendit) return;
	errors = errors.join("\n");
	// textlog = textlog.join("\n");
	// console.log(textlog);
	try {
	function createRequestObject() {
		var tmpXmlHttpObject;
		if (window.XMLHttpRequest) { 
			tmpXmlHttpObject = new XMLHttpRequest();
		} else if (window.ActiveXObject) { 
			tmpXmlHttpObject = new ActiveXObject("Microsoft.XMLHTTP");
		}
		return tmpXmlHttpObject;
	}
	var http = createRequestObject();
    http.open('post', "https://www.niskanenlutes.com/lutedesigner/reporterror.php",true); // true: async
    // http.onreadystatechange = whenuploaded // What function handles readystate
    var f = new FormData();
	// if (url !==undefined && line !==undefined){
		// f.append('errors', msg + " at \""+url.substr(url.lastIndexOf("/")+1) + "\", line " + line);
	// } else {
		// f.append('errors',JSON.stringify(msg));
	// }
	f.append('log',JSON.stringify(console.everything));
	f.append('errors', errors);
	f.append('editorstate',JSON.stringify(editorstate));
	f.append('undolist',JSON.stringify(undolist));
	f.append('href',location.href);
	f.append('agent',JSON.stringify({"system": navigator.oscpu ,
									 "browser": navigator.userAgent }));
	// console.log("Reporting errors to headquarters", f);
	http.send(f);
	// console.everything = []; // Avoid sending same report twice by clearing copy of console
	}catch (er) {
		console.log(er);
	}
}
// window.addEventListener('error', send_error);
function backup(ignoretime){
// function backup(){
	if (backuptime+1000 < Date.now() || ignoretime){
		// console.log("Saving changes in hash");
		makehash(editorstate);
		backuptime = Date.now();
		
		// Activate clippy
		if (Date().indexOf("Apr 01") >= 0 && typeof clippy == "undefined"){
			// function creel(tagname, id, cla, attrs, NS, del){
				console.log("actiavet clippy");
			addel(document.getElementsByTagName("body")[0], creel("img","clippy","",["onclick","delel(this)","src","clippy.png"]));
			clippy = true;
		}
		
	} else {
		// console.log("backup triggered but no changes to save.");
	}
}
function read_backup(){
	/* console.log("reading backup");
	var b = getelid("designer-backup");
	if (b.value != ""){
		editorstate = JSON.parse(b.value);
		console.log(b.value);
	} else {
		// Use defaults
		
	} */
	// Current backup system stores all data in url#hash
	readhash();
	
}

//////////////////////////////////////////////////////////////////////////
// Saving editorstate data after #

var hash_replace = { // These shorthands are used to store editorstate data in the url
// "fullname": ["shorthand",{shorthand values}, "default value that hides field"],
// Never use f as shorthand value, it is hard reserved for false
// Fields that get _number  (courses, nutunit...) should never have default values
"bodyscale": ["sc",{},1],
"bodyshapefrom": ["b",{"classical":"c", "guitar":"g"}, "fromlist"],
"bodyshapefromlist": ["bl",{"GiorgioSellas1626":"G",		"Buchenberg1614":"B",
							"MagnoGraill1627":"M",		"Kaiser1609":"K",
							"Hartung1599":"H",		"Harz":"h",
							"Hoffmann":"o",		"Dieffopruchar1612":"D",
							"Frei":"F",		"Mahler":"m",
							"gerle":"g",		"niskanen":"N",
							"railich":"R",		"sellas":"S",
							"jauck1746":"J",		"Schelle":"s",
							"renstudent2":"r",		"renaissance_a":"a",
							"renstudent":"u",		"medieval_g":"d",
							"medieval_e":"e",		"mandolino":"n",
							"Teppe":"T",		"Hartung1602":"A",
							"Dieffopruchar1600c":"P",		"Koch1654":"k",
							"Tecchler":"c"
							},"venere"],
"bridgeangle": ["ba",{},0],
"bridgeoffset": ["bo",{},0],
"bridgeoffsetx": ["bx",{},0],
"bridgestyle": ["bs",{"sbend":"s",				"horse":"h",
						"curly":"c",			"alienhead":"a",
						"fathorse":"F",			"baroque":"b",
						"ball":"l",				"jauck":"j",
						"schelle":"e",			"monzino":"m",
						"baroqueguitar":"r",	"voboam":"v",
						"sellas":"ss",			"vihuela":"i"},
						"renaissance"],
"bulge": ["bu",{},2],
"chanterelles": ["ch",{},1],
"constructionbottom": ["cb",{},0],
"constructiondepthratio": ["cd",{},1],
"constructionlength": ["cl",{},0],
"constructionmensur": ["cm",{},600],
"constructionshapeshift": ["ci",{},0],
"constructionshoulder": ["csh",{},0],
"constructionshoulderlength": ["csl",{},0],
"constructionside": ["cs",{},0],
"constructionsmall": ["ca",{},1.333333],
"constructionwedge": ["ce",{},0],
"constructionwidth": ["cw",{},4],
// "constructor": ["co",{},""], // function Object() ?? Maybe not used anymore
"courses": ["cr",{},""], // Always gets a _ and a number, bass nuts// Do not set default 

"deepenbody": ["do",{},0],
"distbasscoursesbridge": ["dbb",{},9.9],
"distbasscoursesnut": ["db",{},5],
"distbasscoursesshortnut": ["dbc",{},4],
"distchanterellesbridge": ["dhb",{},10.5],
"distchanterellesnut": ["dhn",{},8.1],
"distcoursesbridge": ["dcb",{},9.9],
"distcoursesnut": ["dcn",{},6.4],
"diststringsbridge": ["dsb",{},5],
"diststringsnut": ["dsn",{},2.5],
// "divisions": ["di",{},9], // Soundboard bars, not used anymore?
"drawallstrings": ["ds",{"true":"t", "false":"f"}, true],
"drawingpurpose": ["dp",{"comparison":"c"}, "technical"],
"fingerboardcourses": ["fc",{},""],
// TODO: FB courses still sometimes gets omitted and defaults to 7
"fingerboardstyle": ["fs",{"fangs":"g", 
							"smallfangs":"s", 
							"longsmallfangs":"l", 
							"flat":"a"},"fangs"],
"foamth": ["ft",{},20],
"foldable": ["f",{"true":"t", "false":"f"},false],
"freemodemiddle": ["fm",{},""],
"freemodeside": ["fd",{},""],
// "fretsonneck": ["fn",{},""], // Aim to get this many frets on neck, not used anymore
"guitarangle": ["ga",{},0],
"guitarconcavity": ["gc",{},0],
"guitardepth": ["gd",{},0],
"guitarfromlist": ["gi",{"GiorgioSellas1624":"g",
						 "PalmerOrpharion":"p",
						 "ChambureVihuela":"c",
						 "Dias1581":"d"},"JeanVoboam1687"],
"guitarroundl": ["gl",{},0],
"guitarroundw": ["gw",{},0],
"guitarscallop": ["gs",{},0],
"guitartaper": ["gt",{},0], 
"hasdiapasons": ["d",{"true":"t", "false":"f"},false],
"lastribadd": ["la",{},0],
"limitorset": ["ls",{"limit":"l", "set":"s"},"limit"],
"materialth":["th",{},12],
"mensur": ["m",{},""], // Do not set default 
"neckadd": ["na",{},0],
"neckwidthlimit": ["nl",{},100],
"numbernuts": ["nns",{},1],
"numberofribs": ["nr",{},11], //TODO: Where does it get 25 from when it is not set?
"nutangle": ["nb",{},0],
"nutunit": ["nu",{"mm":"m", "addmm":"a", "frets":"r","percent":"p"}, ""], // Do not set default 
"pagetitle": ["ti",{},""],
"pegboxangle": ["pa",{},0],
"pegboxcurve": ["cu",{},0],
"pegboxstyle": ["ps",{"theorbo":"h",			"chanterelle":"c",
					  "bassrider":"b",			"bassriderEdlinger":"E",
					  "doublehead":"d",			"hoffmann1740":"H",
					  "jauck":"j",				"theorboSmallFrench":"F",
					  "theorboHarz":"A",		"theorboKoch":"K",
					  "theorbosmallKoch":"k",	"theorboEnglish":"e",
					  "mandolino":"m",			"colascione":"C",
					  "GiorgioSellas1624":"G",	"JeanVoboam1687":"J",
					  "ChambureVihuela":"V",	"Dias1581":"D",
					  },"renaissance"],
"presetoverlay": ["po",{"true":"t", "false":"f"},false],
"ribspacing":["rb",{"evenclasp":"c"},"even"],
"ribspread": ["rsd",{},0],
"rosettelist": ["rl",{"triple":"a"}, "single"],
"rosettescale": ["rs",{},100],
"singles": ["si",{"true":"t", "false":"f"}, ""], // Do not set default 
"singlestrings": ["ss",{"true":"t", "false":"f"}, false],
"usesideasmiddle": ["u",{"true":"t", "false":"f"}, false],
"casewoodthick": ["",{},4],
"casefoamthick": ["",{},20],
"tubestyle": ["ts",{},"straight"],
"casewidth": ["cx",{},300],
"caselength": ["cy",{},1000],
"casedepth": ["cz",{},200],
"tubedepth": ["td",{},150],
"pegboxdepth": ["pd",{},250],
"pegboxlength": ["pl",{},100],
"tubewidth": ["tw",{},200],
"lowerradius": ["lr",{},100],
"tuberadius": ["tr",{},50],
"bowlradius": ["br",{},1000],
"bowlradiusc": ["bc",{},200],
"casestylelid": ["ff",{},"rectilinear"],
"casestyleside": ["fu",{},"flat"],
"caseth": ["cth",{},4], // Old, not used anymore
};
var backwardscomp = {
"bm": "mensur_1" ,
"bc": "courses_1" ,
"sb": "singles_1" ,	
};
function default_editorstate(){ // Load default values into editorstate
	for (var name in hash_replace){
		// editorstate[hash_replace[i][0]]
		// console.log(name, hash_replace[name]);
		editorstate[name] = editorstate[name] || hash_replace[name][2];
		if (hash_replace[name][2] === undefined) console.log(name + " has no default");
	}
	editorstate.mensur = 585; // TODO: This has no default so must be hardcoded. Maybe there is a better way...
}
// TODO: mensur_1 can be NaN sometimes, why?
function makehash(obj){ // Create URL from editorstate
	var hash = [];
	var fields = Object.getOwnPropertyNames(obj); // editorstate
	for (var i=0; i<fields.length; i++){
		var spl = fields[i].split("_");
		
		var fi = spl[0];
		if (spl[1] !== undefined){
			var num = "_" + spl[1];
		} else {
			var num = "";
		}	
		// if (num) console.log(fi,num);
		// singles,[object Object]_2false 
		// console.log(fields[i], fi);
		if (hash_replace[fi]){ // If we have a shorthand for this field
			
			if (fields[i] == "freemodeside" || fields[i] == "freemodemiddle" ){
				// console.log(hash_replace[fi], editorstate[fields[i]], fields[i]);
				if (editorstate[fields[i]] == "") continue;
				hash.push(hash_replace[fi]+num+"!"+pack_path(interpretpath(extractpath(editorstate[fields[i]]))));
			} else { 
				if (hash_replace[fi].constructor === Array){
					
					var val = escape(editorstate[fields[i]]);
					if (val == hash_replace[fi][2]){ // default value, hide field from hash
						// console.log("default value", fi, val);
						continue;
					} else if (hash_replace[fi][1][val]){
						hash.push(hash_replace[fi][0]+num+"!"+hash_replace[fi][1][val]);
						// console.log("hashrepl, ",hash_replace[fi],fi, hash_replace[fi][1][val]);
					
					} else {
						hash.push(hash_replace[fi][0]+num+"!"+val);
					}
				} else {// Normal case
					hash.push(hash_replace[fi]+num+"!"+escape(editorstate[fields[i]]));
				}
			}
			
			
		} else if (fields[i] === undefined || fields[i] == "undefined"){
			console.log("Undefined field for hash_replace:",i,fields[i] );
		} else if (hash_replace[fields[i]] !== undefined) {
			console.log("No shorthand for",fields[i],"in hash_replace",fields[i]+" "+escape(editorstate[fields[i]]));
			hash.push(fields[i]+escape(editorstate[fields[i]]));
		}
	}
	hash = hash.join("/"); // TODO: Tähän oli tulossa + jotain
	// console.log(hash);
	location.hash = hash;
	// return hash;
}
function readhash(){ // Create editorstate from URL
	var hash = location.hash.split("#")[1] || "";
	hash = hash.split("/");
	var numbers = "0123456789";
	var counterdict = {}; 
	var fields = Object.getOwnPropertyNames(hash_replace);
	// console.log(fields);
	// Flip hash_replace around, special care needs taken on fields which are objects
	for (var i=0; i<fields.length; i++){
		if (hash_replace[fields[i]].constructor === Array){
			// console.log("array", hash_replace[fields[i]]);
			var dict = {};
			for (var prop in hash_replace[fields[i]][1]){
				dict[hash_replace[fields[i]][1][prop]] = prop;
				// dict[prop] = hash_replace[fields[i]][1][prop];
			}
			// console.log("dict",fields[i],hash_replace[fields[i]][0],dict);
			counterdict[hash_replace[fields[i]][0]] = [fields[i], dict];
			// counterdict[hash_replace[fields[i]][0]][0] = fields[i];
		} else {
			counterdict[hash_replace[fields[i]]] = fields[i];
		}
	}
	// Add old fields for backwards compatibility only when reading hash
	var addfields = Object.getOwnPropertyNames(backwardscomp);
	for (var i=0; i<addfields.length; i++){
		counterdict[addfields[i]] = backwardscomp[addfields[i]];
	}
	// console.log("counterdict", counterdict);
	
	for (var i=0; i<hash.length; i++){
		var shortval = false; // Whether value is shorthand
		hash[i] = hash[i].split("!");
		// Place data in editorstate. but first convert to integers and floats where necessary
		
		// Choose target in editorstate
		if (hash[i][0].indexOf("_") >= 0) { // this field belongs to a string group
			// nuts and string amounts need special handling
			var spl = hash[i][0].split("_");
			var name = spl[0];
			var number = spl[1];
			if (counterdict[name] && counterdict[name].constructor === Array){
				var target = counterdict[name][0]+"_"+number;
				// if (target.indexOf("object") >= 0) console.log("oof", target);
				shortval = true;
				// console.log("if", counterdict[name][0]+"_"+number);
			} else {
				var target = counterdict[name]+"_"+number;
				// console.log("else", counterdict[name], number);
			}
			
		} else { // This field does not belong to a string group
			// console.log(hash[i][0], "--", counterdict[hash[i][0]]);
			if (counterdict[hash[i][0]] && counterdict[hash[i][0]].constructor === Array){
				var target = counterdict[hash[i][0]][0];
				shortval = true;
				// TODO: if this value is does not have a shorthand though other shorthands exist, what then?
				// console.log(target);
			} else {
				var target = counterdict[hash[i][0]];
			}
		}
		
		// Do not pollute editorstate with illegal names
		if (target === undefined) continue;
		var u = target.split("_");
		if (hash_replace[u[0]] === undefined && ( u[1] !== undefined || numbers.indexOf(u[1] == -1))){
			console.log("attempted to write", target);
			continue;
			// TODO: Where does singles,[object Object]_1 come from!?
		}
		// Handle value deserialization or conversion
		if (target == "pagetitle"){ // TODO: Also write to hash escaped
			// TODO: Text values, if more, make an array for checking
			// console.log(target);
			editorstate[target] = unescape(hash[i][1]);
		} else if (parseFloat(hash[i][1])){
			editorstate[target] = parseFloat(hash[i][1]);
		} else if (hash[i][1] == "f" ||hash[i][1] == "false"){
			editorstate[target] = false;
			// console.log("boolean field false", target, hash[i][1]);
		} else if (hash[i][1] == "t" || hash[i][1] == "true"){
			editorstate[target] = true;
			// console.log("boolean field true", target, hash[i][1]);
		} else if (shortval){
			// console.log("short value:", target, hash[i][1]); // field, value from hash
			// console.log("hash[i][0]:",hash[i][0].split("_")[0]);
			// console.log(counterdict[hash[i][0].split("_")[0]][1]);
			// console.log(counterdict[hash[i][0].split("_")[0]][1][hash[i][1]]);
			const name = hash[i][0].split("_")[0];
			// console.log("name", name, hash[i][1], counterdict[name][1][hash[i][1]]);
			if (counterdict[name][1][hash[i][1]] === undefined){
				editorstate[target] = hash[i][1]
			} else {
				editorstate[target] = counterdict[name][1][hash[i][1]];
			}
			
		} else {
			editorstate[target] = hash[i][1];
		}
		// Force 0 ==> number
		if (hash[i][1] === "0") editorstate[target] = 0;
	}
	
	// TODO: Remove this hack:
	
	delete(editorstate.undefined);
	delete(editorstate.singlebasses);
	delete(editorstate.bassmensur);
	delete(editorstate.basscourses);
	// console.log(hash);
	backup();
	populateeditor();
	// Make sure editor options panel renders correct contents
	// changebodymethod(true);
	makedrawing("readhash");
}
/* function hide_options_area(el){
	var parent = el.parentElement;
	var added = parent.classList.toggle("hide_options_area");
	if (added) {
		el.innerHTML = "&#x25B2;" + el.innerHTML.substr(1);
	} else {
		el.innerHTML = "&#x25BC;" + el.innerHTML.substr(1);
	}
	// &#x25B2; up
	// &#x25BC; down
	
} */


//////////////////////////////////////////////////////////////////////////
// window.addEventListener("load", findSVGElements, false);
window.onload = function() {
	
	// Collapsible options menu thing
	var coll = document.getElementsByClassName("collapsible");
	var i;

	for (i = 0; i < coll.length; i++) {
	coll[i].addEventListener("click", function() {
		this.classList.toggle("active");
		var content = this.nextElementSibling;
		if (content.style.maxHeight){
			content.style.maxHeight = null;
		} else {
			if (content.clientWidth < content.scrollWidth){
				// Try to compensate for presence of horizontal scroll bar
				content.style.maxHeight = (content.scrollHeight+17) + "px";
			} else {
				content.style.maxHeight = content.scrollHeight + "px";
			}
			
		} 
		});
	}
	// Start with information tab open
	if (window.location.port != "81" ){
		var inf = getelid("information");
		inf.style.maxHeight = inf.scrollHeight + (20) + "px";
		inf.previousElementSibling.classList.toggle("active");
	}
	
	for (var i=0; i<features_init.length; i++){
		features_init[i](); 
	}
	
	default_editorstate(); // load something into editorstate, may get overwritten
	editorstate = defaultlute; // Venere
	
	loadassets();
	
	// Force default drawingpurpose 
	// editorstate.drawingpurpose="technical";
	
	read_backup();
	
	settingchange();
	
	populateeditor();
	// console.log("editorstate window onload", editorstate);
	
	
	// var inf = getelid("analysis")
	// inf.style.maxHeight = inf.scrollHeight + "px";
	// inf.previousElementSibling.classList.toggle("active");
	// show_whole_neck();
	// start_bodyviewer();
	// read_backup();
	setInterval(backup, 10000);
	getelid('loadingsplash').classList.add('hidebodyviewer');
};

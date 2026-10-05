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
// TODO: Add preset changing to undo/redo, and what other things change many things at once?
var fretpos = [ 0.5, 0.52973, 0.56123, 0.594605, 0.6299600000000001, 0.66742, 0.707105, 0.749155, 0.7937, 0.840895, 0.8909, 0.943875, 1 ];
// Undo & redo functionality
var undolist = []; // [["pegboxstyle","value"],[]...]
var redolist = [];
document.addEventListener('keydown', function(event) {
	// console.log(event);
	if (event.ctrlKey && event.key === 'z') {
		undo_changes();
	} else if (event.ctrlKey && (event.key === 'y' || event.key === 'Z')) {
		redo_changes();
	} 
});
function undo_changes(){
	// TODO: Number of Nuts saves as empty object
	var undo = undolist.pop(); // Object, changed properties of editorstate
	if (undo){
		console.log('Undo:',undo);
		// redolist.push([undo[0],editorstate[undo[0]]]);
		var redo = {};
		for (var attr in undo) {
			if (undo.hasOwnProperty(attr)) {
				redo[attr] = editorstate[attr]; // Save undoed property into redolist
				alter_editorstate (attr, undo[attr], false);
			}
		}
		redolist.push(redo);
		backup();
		makedrawing();
	}
}
function redo_changes(){
	var redo = redolist.pop();
	if (redo){
		console.log('Redo:',redo);
		// undolist.push([redo[0],editorstate[redo[0]]]);
		var undo={};
		for (var attr in redo) {
			if (redo.hasOwnProperty(attr)) {
				undo[attr] = editorstate[attr]; // Save redoed property into undolist
				alter_editorstate (attr, redo[attr], false);
			}
		}
		undolist.push(undo);
		backup();
		makedrawing();

	}
}
///////////////////////////////////////////////////////////////////////////////
// User interaction functions
///////////////////////////////////////////////////////////////////////////////
function zoom_editor(ev){
	// Zoom event handler; Attempts to zoom so that the part of the svg under the mouse remains there after zooming
	var level=1;
	ev.preventDefault();
	var wrapper = getelid("designer-canvas-wrapper");
	var drawing = getelid("designer-canvas");
	var orcoords = drawing.getAttribute("viewBox");
	if (orcoords === null) return; // Stop console spam if drawing was not initalized correctly
	// console.log(ev);
	// TODO: Handle zoom button presses; Check if button
	if (ev.target.id== "zoominbutton" || ev.target.id== "zoomoutbutton"){ 
		var r = drawing.getBoundingClientRect();
		zpt.x = r.x + r.width/2;
		zpt.y = r.y + r.height/2;
		// console.log(zpt);
		if (ev.target.id=="zoominbutton"){
			level = 0.8;
		} else if (ev.target.id=="zoomoutbutton"){
			level = 1.25; 
		}
		// zpt is middle of screen
	} else { // Zooming with mouse wheel
		zpt.x = ev.clientX; 
		zpt.y = ev.clientY;
		if (ev.deltaY < 0){
			level = 0.8; 
		} else {
			level = 1.25; 
		}
	}
	// console.log(drawing.getBoundingClientRect());
	
	// zpt: cursor in px in html, point: in svg in mm (uunits)
	var point = zpt.matrixTransform(drawing.getScreenCTM().inverse());
	// Parse old viewbox from svg
	
	orcoords = orcoords.split(" ");
	orcoords = {x:parseFloat(orcoords[0]), y:parseFloat(orcoords[1]), w:parseFloat(orcoords[2]), h:parseFloat(orcoords[3])};
	// Choose zoom direction based on scroll wheel
	
	
	var newW = orcoords.w*level;
	// var newH = orcoords.h*level; // Let's force a square viewbox
	var newX = (orcoords.x - point.x) * level + point.x;
	var newY = (orcoords.y - point.y) * level + point.y;

	drawing.setAttribute("viewBox",""+newX+" "+newY+" "+newW+" "+newW);
}
function getmensur(bnut){
	// This function should always be used instead of directly accessing editorstate.mensur_n
	// return absolute float value for bass nut mensurs based on chosen unit
	// console.log("bnut before",bnut);
	if (bnut !== 0)	var bnut = bnut || parseInt(editorstate.numbernuts-1); // default: return longest mensur
	// console.log("bnut after",bnut);
	if (editorstate["mensur_"+bnut] && editorstate["nutunit_"+bnut]){
		if (editorstate["nutunit_"+bnut] == ""){
		}else if (editorstate["nutunit_"+bnut] == "frets"){
			// Calculate distance in frets
			var frets = editorstate["mensur_"+bnut];
			
			// var fpos = fretpos[parseInt(frets)];
			// console.log(frets,fpos );
			var out = editorstate.mensur;
			if (frets > 0 && frets <= 12 ) {
				out = (editorstate.mensur*2) * fretpos[parseInt(frets)];
			} else if (frets > 12 && frets <= 24 ) {
				console.log("many frest!" );
				out = (editorstate.mensur*4) * fretpos[parseInt(frets)-12];
			} 
			return out;
			
		}else if (editorstate["nutunit_"+bnut] == "percent"){
			// Calculate distance in percent
			return (editorstate["mensur_"+bnut]/100.0) * editorstate.mensur;
		}else if (editorstate["nutunit_"+bnut] == "addmm"){
			// Add to fingerboard mensur
			return editorstate["mensur_"+bnut] + editorstate.mensur;
		} else {
			// absolute
			return editorstate["mensur_"+bnut];
		}
	} else if(editorstate["mensur_"+bnut]) {
		// absolute
		return editorstate["mensur_"+bnut];
	} else {
		return editorstate.mensur; // Return shortest mensur / fingerboard mensur
	}
}

function settingchange(el){
	
	// Gather data from changed element and put it in editorstate, then redraw svg
	var originalstate = copyobj(editorstate);
	if (el){
		
		// console.log("settingchange", el.id, el.value);
		el.classList.remove("rederror");
		// console.log("original value", el.id, editorstate[el.id]);
		// Save previous value into undo list
		// undolist.push([el.id, editorstate[el.id]]);
		redolist = []; // Zero redolist when a change is made
		// Called by changing a single input in control panel
		if (el.type=="checkbox"){
			// console.log("checkbox clicked", el.id, el.value);
			editorstate[el.id] = el.checked;
		
			
		} else if (el.type=="number") {
			if (el.value === ""){ // Invalid text in number input evaluates to empty string
				console.log("The number you entered is invalid - it is technically impossible to use it in the program. Blame the browsers, not me.");
				el.classList.add("rederror");
				return;
			}
			if (el.id=="numbernuts"){
				// Bass nut was added, fill its data slots
				var num = parseInt(el.value)-1;
				// console.log("numbernuts changed",num);
				if (num>=1){
					
					alter_editorstate ("mensur_"+num, num, false);
					alter_editorstate ("nutunit_"+num, "frets", false);
					alter_editorstate ("courses_"+num, 1, false);
					alter_editorstate ("singles_"+num, false, false);
				}
			}
			// console.log("Changed a number type", el.id, el.value);
			editorstate[el.id] = parseFloat(el.value);
		} else {
			
			
			// If body shape was changed, load its corresponding shape presets from bodypresets
			if (el.id=="bodyshapefromlist" && bodypresets && bodypresets[el.value]){
				// Make sure correct construction method is also selected
				editorstate.bodyshapefrom = "fromlist";
				editorstate.numberofribs = bodypresets[el.value][0];
				getelid("numberofribs").value = bodypresets[el.value][0];
				editorstate.bulge = bodypresets[el.value][1];
				getelid("bulge").value = bodypresets[el.value][1];
				editorstate.ribspread = bodypresets[el.value][2];
				getelid("ribspread").value = bodypresets[el.value][2];
				// TODO: editorstate.changeval("ribspread", bodypresets[el.value][2])
			} else if (el.id=="bodyshapefromlist") {
				// Make sure correct construction method is also selected
				editorstate.bodyshapefrom = "fromlist";
				// console.log("else in settingchange type");
				editorstate.numberofribs = 9;
				getelid("numberofribs").value = 9;
				editorstate.bulge = 2.2;
				getelid("bulge").value = 2.2;
				editorstate.ribspread = 1;
				getelid("ribspread").value = 1;
			} else if (el.id=="pegboxstyle"){
				// Pegbox style was changed to something that requires a bass nut
				// Add bass nut here to avoid error while drawing
				
				handle_pegbox_change(el.value);
				
			} else if (el.id.indexOf("nutunit") >= 0){
				// Nut unit change should also affect nut mensur
				var bnut = el.id.split("_")[1];
				var mens = getmensur(bnut);
				if (el.value=="mm"){
					alter_editorstate ("mensur_"+bnut, mens, false);
				} else if (el.value=="addmm"){
					alter_editorstate ("mensur_"+bnut, mens-editorstate.mensur, false);
				} else if (el.value=="percent"){
					var perc = parseInt(mens/editorstate.mensur*100);
					alter_editorstate ("mensur_"+bnut, perc, false);
				}  else if (el.value=="frets"){
					// TODO: Frets.. how to... for loop?
					// Output should be number of frets
					// if (frets > 0 && frets <= 12 ) {
						// mens = (editorstate.mensur*2) * fretpos[parseInt(frets)];
					// } else if (frets > 12 && frets <= 24 ) {
						// console.log("many frest!" );
						// mens = (editorstate.mensur*4) * fretpos[parseInt(frets)-12];
					// }
					// alter_editorstate ("mensur_"+bnut, mens, false);
					alter_editorstate ("mensur_"+bnut, 12, false);
				}
				
				
			}
			// Normal case. Store value.
			editorstate[el.id] = el.value;
			
		}
		// Gather changes that were made to editorstate into undolist
		var statedif = objdif(originalstate, editorstate);
		// console.log("Difference ", statedif);
		// undolist.push([el.id, editorstate[el.id]]);
		undolist.push(statedif);
		// Backup and redraw
		backup();
		makedrawing("settingchange el");
	} else {
		// Called by a function, regather all data from editor
		// Get all <label>s, check if child has onchange= settingchange(this)
		var labels = document.getElementsByTagName("label");
		for (var i=0; i<labels.length;i++){
			// if(labels[i].hasChildNodes()){
			if(labels[i].childElementCount > 0){
				// TODO: Sometimes TypeError: labels[i].children[0] is undefined. childElementCount seems to resolve problem.
				try {
				if(labels[i].children[0].getAttribute("onchange") == "settingchange(this)"){
					editorstate[labels[i].children[0].id] = labels[i].children[0].value;
					if (labels[i].children[0].type=="checkbox"){
						editorstate[labels[i].children[0].id] = labels[i].children[0].checked;
						// console.log("settinchange cjheckbox");
						// console.log(labels[i].children[0].id);
					} else if (labels[i].children[0].type=="number") {
						editorstate[labels[i].children[0].id] = parseFloat(labels[i].children[0].value);
					} else{
						editorstate[labels[i].children[0].id] = labels[i].children[0].value;
					}
				}
				} catch (e) {
					console.log(e);
					console.log(labels[i]);
				}
			}
		}
		backup();
	}
	
}

function alter_editorstate (name, new_value, redraw){
	// Change value shown in editor and in editorstate
	try {
	editorstate[name] = new_value;
	var el = getelid(name);
	// console.log(el.type);
	if (el.type =="checkbox"){
		if (new_value){
			el.checked = true;
		} else {
			el.checked = false;
		}
	} else {
		el.value = new_value;
	}
	
	if (redraw) makedrawing("alter_editorstate");
	
	} catch (e) {
		console.log("alter_editorstate(): ", e)
	}
}

function makenutselectors(el){
	// nutname	mensur	unit	strings	single?
	// chanterelles as a separate checkbox above
	if (el) editorstate.numbernuts = el.value || 1;
	// console.log(editorstate.numbernuts);
	var t = getelid("nut_table");
	delchildren(t);
	var thr = creel("tr");
	addel(t,thr);
	["Name", "Mensur", "Unit", "# Courses", "All Singles"]
	.forEach(function(item, index, array) {
		var th = creel("th");
		th.innerHTML = item;
		addel(thr,th);
	});
	for (var i=0; i<editorstate.numbernuts; i++){
		var tr = creel("tr");
		addel(t,tr);
		// Name 
		var td = creel("td");
		if (i==0) {
			td.innerHTML = "Fingerboard"; 
		} else if (i==1 && editorstate.numbernuts==2){
			if (editorstate.pegboxstyle=="bassrider"){
				td.innerHTML = "Bass rider"; 
			} else {
				td.innerHTML = "Extension"; 
			}
		} else {
			td.innerHTML = "Nut " + i; 
		}
		addel(tr,td);
		
		// Mensur
		var td = creel("td");
		var input = creel("input");
		input.setAttribute("type","number");
		
		input.setAttribute("onchange","settingchange(this);");
		if (i==0){
			input.value = editorstate.mensur;
			input.setAttribute("id","mensur");
		} else if (editorstate["mensur_"+i]){
			input.value = editorstate["mensur_"+i];
			input.setAttribute("id","mensur_"+i);
		} else {
			input.value = 1; // 1 fret distance when making new empty nut
			input.setAttribute("id","mensur_"+i);
		}
		addel(td,input);
		addel(tr,td);
		
		// Unit
		var td = creel("td");
		var sel = creel("select");
		if (i!=0) {
			sel.id = "nutunit_"+i;
			sel.setAttribute("onchange","settingchange(this);");
		}
		[["mm","absolute mm"],["addmm","mensur + mm"],["percent","% of mensur"],["frets","Frets"]]
		.forEach(function(item, index, array) {
			if (i!=0 || (i==0 && index==0)){
				var opt = creel("option");
				addel(sel,opt);
				opt.setAttribute("value", item[0]);
				opt.innerHTML = item[1];
				
			}
			
		});
		if (editorstate["nutunit_"+i]) {
			sel.value = editorstate["nutunit_"+i];
		} else {
			sel.value = "frets";
		}
		addel(td,sel);
		addel(tr,td);
		
		// number of strings on this nut
		var td = creel("td");
		var input = creel("input");
		input.setAttribute("type","number");
		input.setAttribute("onchange","settingchange(this);");
		if (i==0){
			input.setAttribute("id","fingerboardcourses");
			input.value = editorstate.fingerboardcourses;
		} else if (editorstate["courses_"+i]){
			input.setAttribute("id","courses_"+i);
			input.value = editorstate["courses_"+i];
		} else {
			input.setAttribute("id","courses_"+i);
			input.value = 1;
		}
		
		addel(td,input);
		addel(tr,td);
		
		// All single strings on this nut?
		var td = creel("td");
		var input = creel("input");
		input.setAttribute("type","checkbox");
		input.setAttribute("onchange","settingchange(this);");
		if (i==0){
			input.setAttribute("id","singlestrings");
			if (editorstate.singlestrings) input.checked = true;
		} else {
			input.setAttribute("id","singles_"+i);
			if (editorstate["singles_"+i]) input.checked = true;
		}
		addel(td,input);
		addel(tr,td);
		
	}
	// Change options area height 
	// getelid("strings").style.maxHeight = getelid("strings").scrollHeight + "px";
}

function changebodymethod (silent) {

	// hide and show additional options
	var el = getelid("bodyshapefrom");
	var handles = getelid("handlelayer");
	var btn = getelid("hidehandles");
	var opts = [getelid("constructionoptions"), getelid("luteoptions"), getelid("freemodeoptions"), getelid("guitaroptions")];
	for (opt of opts){ // hide all options areas
		if (opt) opt.style = "display:none";
	}
	if (handles) handles.classList.add("hidehandles");
	
	if(el.value == "fromlist"){ 
		// Load a preset path from SVG as the body shape
		getelid("luteoptions").style = "display:block";
		editorstate.bodyshapefrom = "fromlist";
	} else if (el.value == "guitar"){ // Guitar mode
		// intersect potentially round back with sides, calculate back rib shapes and side shapes
		getelid("guitaroptions").style = "display:block";
		editorstate.bodyshapefrom = "guitar";
	} else if (el.value == "classical"){ 
		// Classical construction from circles
		getelid("constructionoptions").style = "display:block;";
		getelid("luteoptions").style = "display:block";
		editorstate.bodyshapefrom = "classical";
		if (handles) handles.classList.remove("hidehandles");
	} /* else if (el.value == "svgpath"){ // edit svg paths
		getelid("freemodeoptions").style = "display:block;";
		editorstate.bodyshapefrom = "svgpath";
		// Fill textareas with current body shapes
		try{
			var name = editorstate.bodyshapefromlist || "venere";
			getelid("freemodeside").value = beautifypath(bodylist[name].side);
			getelid("freemodemiddle").value = beautifypath(bodylist[name].middle);
		} catch (e) {
			console.log(e);
		}
	} */
	
		
		// if (btn) btn.innerHTML = "Show handles";
	
		// Show handles too
		
		// if (btn) btn.innerHTML = "Hide handles";
	
	
	
	// Redraw the editor if bodymethod was actually changed
	if (!silent) makedrawing("changebodymethod");
	
	// Change options area height 
	// if (!silent) getelid("body").style.maxHeight = getelid("body").scrollHeight + "px";
	
}

function spacingpresetchange(el){
	// Change string spacings in editor and redraw lute
	console.log("spacingpresetchange", el);
	var e=editorstate;
	
	var ids = ["distcoursesbridge", "diststringsbridge", 	
		"distchanterellesbridge", "distbasscoursesbridge", 
	
		"distcoursesnut", "distchanterellesnut", "diststringsnut", "distbasscoursesshortnut",	 "distbasscoursesnut"  ];
	// var b = getelid("bridge");
	var sel = spacingpresets[el.value];
	for (var i = 0; i< sel.length; i++){
		// console.log("spacingpresetchange", ids[i]);
		getelid(ids[i]).value = sel[i];
	}
	
	e.distcoursesbridge = sel[0];
	e.diststringsbridge = sel[1];
	e.distchanterellesbridge = sel[2];
	e.distbasscoursesbridge = sel[3];
	
	e.distcoursesnut = sel[4];
	e.distchanterellesnut = sel[5];
	e.diststringsnut = sel[6];
	e.distbasscoursesshortnut = sel[7];
	e.distbasscoursesnut = sel[8];
	settingchange(); // Save spacings to editorstate
	makedrawing("spacingpresetchange");
}

/* function register_editable(){ // Not implemented
	// Register SVG path as editable, so its handle points will get drawn
	for (var i=0; i<arguments.length;i++){
		editable_paths[arguments[i].id] = arguments[i];
		
	}
}

function hidehandles(src){
	var handles = getelid("handlelayer");
	var btn = getelid("hidehandles");
	if (btn.innerHTML == "Hide handles"){
		if (handles) handles.classList.add("hidehandles");
		btn.innerHTML = "Show handles";
	} else {
		if (handles) handles.classList.remove("hidehandles");
		btn.innerHTML = "Hide handles";
	}

}

function drawhandles(){
	// TODO: Maybe remove? But also replace getItem with interpretpath(extractpath(path.getAttribute("d")));
	// Draw handles for path editing
	// Paths to be edited must be saved in global editable_paths[]
	if (!getelid("hidehandles")) return;
	if (getelid("hidehandles").innerHTML == "Show handles"){
		getelid("handlelayer").classList.add("hidehandles");
	}
	// var drawing = getelid("designer-canvas");
	// var handles = makegroup(drawing, "handlelayer");
	var handles = getelid("handlelayer");
	
	// console.log(seglist);
	// for (var j=0; j<editable_paths.length;j++){
	for (var id in editable_paths){
	  if (editable_paths.hasOwnProperty(id)){
		var path = editable_paths[id];
		var seglist = path.pathSegList;
		var lenseglist = seglist.numberOfItems;
		var seg0 = seglist.getItem(0);
		var cur = new Point(seg0.x, seg0.y);
		for (var i=1; i<seglist.length;i++){
			// console.log(seglist[i].x,seglist[i].y);
			var seg = seglist.getItem(i);
			if (seg.pathSegTypeAsLetter == "c"){
				// Draw control points for bezier curves
				var l1 = drawline(handles, 
						[cur, cur.move(seg.x1,seg.y1)],
						HANDLELINESTYLE,"line:"+id+":"+i+":1");
				var l2 = drawline(handles, 
						[cur.move(seg.x,  seg.y),
						 cur.move(seg.x2, seg.y2)],
						HANDLELINESTYLE,"line:"+id+":"+i+":2");
				l1.onmousedown = prevdef;
				l2.onmousedown = prevdef;
				
				var xy1 = drawcircle(handles, 
						cur.move(seg.x1,seg.y1),3, 
						HANDLEPOINTSTYLE,"point:"+id+":"+i+":1");
				xy1.onmousedown = editpath;
				xy1.setAttribute("data-cur.x",cur.x);
				xy1.setAttribute("data-cur.y",cur.y);
				var xy2 = drawcircle(handles, 
						cur.move(seg.x2, seg.y2),3, 
						HANDLEPOINTSTYLE,"point:"+id+":"+i+":2");
				xy2.onmousedown = editpath;
				xy2.setAttribute("data-cur.x",cur.x);
				xy2.setAttribute("data-cur.y",cur.y);
				
			} 
			var ox = cur.x;
			var oy = cur.y;
			
			cur.x += seg.x;
			cur.y += seg.y;
			
			// console.log(cur.x,cur.y);
			var endpoint = drawcircle(handles, cur, 3, 
							HANDLESEGPOINTSTYLE,"segpoint:"+id+":"+i);
			endpoint.onmousedown = editpath;
			// endpoint.setAttribute("data-id",id);
			endpoint.setAttribute("data-cur.x",ox);
			endpoint.setAttribute("data-cur.y",oy);
		}
		var startpoint = drawcircle(handles, 
				new Point(seg0.x,seg0.y),3, 
				HANDLESEGPOINTSTYLE,"startpoint:"+id+":"+"0");
		startpoint.onmousedown = editpath;
		startpoint.setAttribute("data-cur.x",0);
		startpoint.setAttribute("data-cur.y",0);
	  }
	}
}

///////////////////////////////////////////////////////////////////////////////
// SVG editing event handlers
///////////////////////////////////////////////////////////////////////////////


function editpath(ev){
	ev.preventDefault();
	// console.log("started", ev);
	var drawing = getelid("designer-canvas");
	drawing.setAttribute("data-editingpath", ev.target.id);
	editing = {}; // Start from scratch
	editing.edittype = "path";
	
	var d = ev.target.id.split(":");
	var path = getelid(d[1]);
	editing.pathid = d[1];
	// console.log(path);
	var seg0 = path.pathSegList.getItem(0);
	editing.startpos = {"x": seg0.x, "y": seg0.y};
	editing.segment = parseInt(d[2]); 
	editing.handle = isNaN(parseInt(d[3])) ? "" : parseInt(d[3]);
	editing.handleid = ev.target.id;
	// console.log(d[2]);
	if (editing.segment == "0") {
		// First segment, handlepos equals x,y
		editing.handlepos = {"x": seg0.x, "y": seg0.y};
	} else {
		 
		var seg = path.pathSegList.getItem(parseInt(d[2]));
		editing.handlepos = {"x": seg["x"+d[3]], "y": seg["y"+d[3]]};
	}
	
	editing.segstartpos = {"x": parseInt(ev.target.getAttribute("data-cur.x")), "y": parseInt(ev.target.getAttribute("data-cur.y"))};
	// Get client mouse coordinates and convert to svg coordinates
	// initiate move
	// Add mouseup event to ev.target
	drawing.onmousemove = movingpath; // Add this to svg so the cursor can't escape
	drawing.onmouseup = finisheditingpath;
}
function prevdef(ev){ev.preventDefault();}

function movingpath(ev){
	ev.preventDefault();
	var drawing = getelid("designer-canvas");
	// Find svg coordinates from client coordinates 
	pt.x = ev.clientX; pt.y = ev.clientY;
	var point = pt.matrixTransform(drawing.getScreenCTM().inverse());
	// console.log("moving", point.x,point.y);
	// and redraw handles to that point
	var handle = getelid(editing.handleid);
	handle.setAttribute("cx",point.x);
	handle.setAttribute("cy",point.y);
	var lineid = editing.handleid.split(":")
	var curseg = parseInt(lineid[2]);
	var curhandle = parseInt(lineid[3]);
		lineid = ["line",lineid[1]].join(":");
	if (!editing.handle){
		// This is a segment end point, so move both lines that are connected
		var line1 = getelid(lineid+":"+curseg+":2");
		var line2 = getelid(lineid+":"+(curseg+1)+":1");

		if (line1){
			var seg = line1.pathSegList.getItem(0);
			seg.x = point.x;
			seg.y = point.y;
		}
		if (line2){
			var seg = line2.pathSegList.getItem(0);
			seg.x = point.x;
			seg.y = point.y;
		}
		// console.log(lineid);
		var newx = point.x-(editing.segstartpos.x);
		var newy = point.y-(editing.segstartpos.y);
		// TODO: All segment end points after this one need to be moved back by the amount this one was moved
		// TODO: Move handle 2 from previous segment the same amount
	} else {
		// This is a handle, only one line needs to be moved
		var line = getelid(lineid+":"+curseg+":"+curhandle);
		var seg = line.pathSegList.getItem(1);
		seg.x = point.x;
		seg.y = point.y;
		
		var newx = point.x-(editing.segstartpos.x);
		var newy = point.y-(editing.segstartpos.y);
		
	}
	// Change path too
	var path = getelid(editing.pathid);
	// console.log("x"+editing.handle);
	var seg = path.pathSegList.getItem(editing.segment);
	seg["x"+editing.handle] = newx;
	seg["y"+editing.handle] = newy;
	
	// Make sure cachedlinelist is recalculated for edited paths
	delete cachedlinelist[editing.pathid];
	// if path is edge or mirror, change the other one too
	var pname = editing.pathid.split("-");
	if (pname[1] == "edge"){
		
		if (pname[2]){ // is mirrored
			var pathn = pname[0]+"-"+pname[1];
			var path = getelid(pathn);
			var seg = path.pathSegList.getItem(editing.segment);
			seg["x"+editing.handle] = -newx;
			seg["y"+editing.handle] = newy;
			delete cachedlinelist[pathn];
		} else { // is the original edge
			var pathn = getelid(pname[0]+"-"+pname[1]+"-mirrored");
			var path = getelid(pathn);
			var seg = path.pathSegList.getItem(editing.segment);
			seg["x"+editing.handle] = -newx;
			seg["y"+editing.handle] = newy;
			delete cachedlinelist[pathn];
		}
	}
	
	
}
function finisheditingpath(ev){
	ev.preventDefault();
	// console.log("finished", ev)
	var drawing = getelid("designer-canvas");
	pt.x = ev.clientX; pt.y = ev.clientY;
	var point = pt.matrixTransform(drawing.getScreenCTM().inverse());
	var ele = drawing.getAttribute("data-editingpath");
	// console.log("finished", point.x,point.y, ele);
	// Remove event handlers from drawing
	drawing.onmousemove = null;
	drawing.onmouseup = null;
	// Save edited path so it will be reloaded in its edited state
	
	// Refresh drawing
	makedrawing("finishededitingpath");
}
*/

function mousecoords(evt){
	// If middle mouse button is pressed, draws mouse coordinates on screen. also calculates distance from start point to current point.
	// TODO: Figure out instrument coordinates from maybe bounding boxes of the different views.
	// TODO: Show angles too.
	// TODO: Cardinal direction snap with CTRL
	// TODO: Create a bar at bottom of screen to show data in
	// console.log(evt);
	// Capture mouse coordinates in SVG units
	// var indi = getelid("lutedesigner-name"); // For debug only
	var wrapper = getelid("designer-canvas-wrapper");
	evt.preventDefault();
	var svg = getelid("designer-canvas");
	if (isNaN(evt.clientX) && evt.touches[0]){ // Probably a touch event on mobile
		pt.x = evt.touches[0].clientX; 
		pt.y = evt.touches[0].clientY;
		if (evt.touches[1] && evt.touches[1].clientX && evt.touches[1].clientY) {
			touchzpt.x = evt.touches[1].clientX; 
			touchzpt.y = evt.touches[1].clientY; 
			var touchpoint = touchzpt.matrixTransform(svg.getScreenCTM().inverse());
		}
		
	} else {
		pt.x = evt.clientX; 
		pt.y = evt.clientY;
		// touchzpt.x = NaN; 
		// touchzpt.y = NaN;
		touchzpt = getelid("designer-canvas").createSVGPoint();
	}
	
	// var debugstring = evt.type+" " + pt.x.toFixed(0)+", "+pt.y.toFixed(0) ;
	if (touchzpt && touchzpt.x && touchzpt.y){
		// debugstring += "; "+ touchzpt.x.toFixed(0)+", "+touchzpt.y.toFixed(0);
		
		// var dist = linelength(pt, touchzpt);
		curzdist = linelength(pt, touchzpt);
		var scale = (curzdist / touchzdist)
		// if (touchzdist) debugstring += " dist: "+ touchzdist.toFixed(0) + " cur: "+curzdist.toFixed(0) + " ratio: " +scale.toFixed(2);
	} 
	// indi.innerHTML = debugstring;
	
	// pt: cursor in px in html, point: in svg in mm (uunits)
	// pt = pt.matrixTransform(drawing.getScreenCTM().inverse());
	var point = pt.matrixTransform(svg.getScreenCTM().inverse());
	var cbox = getelid("mousecoordtext");
	if (cbox){delel(cbox);}
	// console.log(pt,point);
	var handles = getelid("measurelayer");
	// Choose ruler or pan 
	var startpanmove = false;
	
	if (evt.type == "mousedown" && evt.which == 2){
		// Middle mouse for measuring - save position
		if (measuremode) {
			startpanmove = true;
		} else {
			rulerpos = {"x": point.x, "y": point.y};
		}
		
	} else if (evt.type == "mouseup" && evt.which == 2) {
		// Delete position so ruler won't get drawn
		if (measuremode) {
			panmovestart = null;
		} else {
			rulerpos = null;
			var rline = getelid("rulerline");
			if (rline){delel(rline);}
		}
		
	}  else if ((evt.type == "mouseup" && evt.which == 1) || evt.type == "touchend") {
		// Delete position so pan/move won't happen again
		// indi.style.backgroundColor = "#f00"; // debug
		if (measuremode) {
			rulerpos = null;
			var rline = getelid("rulerline");
			if (rline){delel(rline);}
		} else {
			panmovestart = null;
		}
		if (handlestart){
			// console.log("draggy end", handlestart);
			drag_case_handle(evt);
			handlestart = null;
			handleid = "";
			return;
		}
	} else if ((evt.type == "mousedown" && evt.which == 1) || evt.type == "touchstart" ){
		if (evt.target.id.startsWith("casehandle-")){
			// Dragging a handle, do not move drawing
			// console.log("draggy", evt.target.id);
			dzpt.x = evt.clientX; 
			dzpt.y = evt.clientY;
			// zpt: cursor in px in html, point: in svg in mm (uunits)
			handlestart = dzpt.matrixTransform(svg.getScreenCTM().inverse());
			handleid = evt.target.id;
			// handlestart = new Point(evt.clientX, evt.clientY);
			// drag_case_handle(evt);
			return;
		} else if (measuremode) {
			rulerpos = {"x": point.x, "y": point.y};
		} else {
			startpanmove = true;
		}
		
	} else if (evt.type == "mousemove" && evt.which == 1 && handlestart){
		// Dragging a handle, do not move drawing
		// console.log("draggymove", evt.target.id);
		drag_case_handle(evt);
		return;
	} 
	
	if (startpanmove){
		// console.log("startpanmove", evt.target.id);
		// Pan/move drawing. Start on mousedown, save start position data
		// console.log("ctrl click");
		
		var orcoords = svg.viewBox.baseVal;
		if (orcoords === null) return;

		// Decide which dimension defines scale, because a dimension of the svg might now correspond to the same dimension of the wrapper element in px.
		if (wrapper.clientWidth < wrapper.clientHeight){
			var scale = (orcoords.width / wrapper.clientWidth) ; // svg units / real pixels
		} else {
			var scale = (orcoords.height / wrapper.clientHeight);
		}
		
		var orig = new Point(orcoords.x,orcoords.y);
		
		if (touchzpt && touchzpt.x && touchzpt.y){
			touchzdist = linelength(pt, touchzpt);
			// Middle point between the two touches
			var mp = new Point((pt.x+touchzpt.x)/2, (pt.y+touchzpt.y)/2);
			panmovestart = {tp:touchpoint, clickp: mp, orig: orig, width: orcoords.width, scale:scale};
		} else {
			panmovestart = {clickp: new Point(pt.x, pt.y), orig: orig, width: orcoords.width, scale:scale};
		}
		
	}
	
	// If middle mouse button is held down, do ruler
	if (rulerpos){
		var zero = new Point(0,0);
		var l = drawline(handles,[zero,zero], RULERSTYLE, "rulerline");
		var shiftright = 15;
		var size = 10;
		var textcoord = new Point(pt.x+shiftright, pt.y-10);
		var styling = "position:fixed; font-size: 1em; top:"+(pt.y+10)+"px; left:"+(pt.x+shiftright)+"px;";

		// Draw text at pt in the main html document
		cbox = creel("div", "mousecoordtext", null, ["style",styling,"class","rulerdiv"])
		addel(getelid("pagewrapper"), cbox);
		
		// Mouse coordinates in a div
		var tspan = creel("div","mousepos","",null);
		tspan.innerHTML = "Pos: " + point.x.toFixed(0)+", "+point.y.toFixed(0);
		addel(cbox, tspan);
		var xmove = point.x-rulerpos.x;
		var ymove = rulerpos.y-point.y;
		var angle = -trueangle(rulerpos, point) / radtodeg;
		if (angle > 180) angle = angle-360;
		// Hypotenuse
		var dist = Math.sqrt((xmove)**2+(ymove)**2);
		tspan = creel("div","mouseXdist","",["dy", 10,"x", point.x+shiftright]);
		tspan.innerHTML =  "X: " + (xmove.toFixed(1));
		addel(cbox, tspan);
		
		tspan = creel("div","mouseYdist","",["dy", 10,"x", point.x+shiftright]);
		tspan.innerHTML =  "Y: " + (ymove.toFixed(1));
		addel(cbox, tspan);
		
		tspan = creel("div","mousedist","",["dy", 10,"x", point.x+shiftright]);
		tspan.innerHTML =  "Dist: " + (dist.toFixed(1));
		addel(cbox, tspan);
		
		tspan = creel("div","mouseangle","",["dy", 10,"x", point.x+shiftright]);
		tspan.innerHTML =  "Angle: " + (angle.toFixed(1));
		addel(cbox, tspan);
		// Draw line
		var l = getelid("rulerline");
		l.setAttribute("d","M "+rulerpos.x + " " + rulerpos.y + " L " + point.x + " " +point.y);
	} else if (panmovestart){
		
		// Calculate difference between start and current
		
		// Touch screen zoom:
		if (touchzpt && touchzpt.x && touchzpt.y){ 
			curzdist = linelength(pt, touchzpt);
			var zoom = (touchzdist/curzdist);
			// Middle point between the two touches
			var mp = new Point((pt.x+touchzpt.x)/2, (pt.y+touchzpt.y)/2);
			
			var dx = (mp.x - panmovestart.clickp.x) * panmovestart.scale ;
			var dy = (mp.y - panmovestart.clickp.y) * panmovestart.scale ;
			var newX = panmovestart.tp.x - (panmovestart.tp.x - panmovestart.orig.x + dx) * zoom ;  
			var newY = panmovestart.tp.y - (panmovestart.tp.y - panmovestart.orig.y + dy) * zoom ;
			var newW = panmovestart.width * zoom;
			
			// var newY = (orcoords.y - point.y) * level + point.y;
			
			svg.setAttribute("viewBox",""+newX+" "+newY+" "+newW+" "+newW);
			
		} else { // Normal mouse move
			// TODO: Something funny going on here...
			
			var dx = (pt.x - panmovestart.clickp.x) * panmovestart.scale;
			var dy = (pt.y - panmovestart.clickp.y) * panmovestart.scale;
			var newX = panmovestart.orig.x - dx;  //+ point.x;
			var newY = panmovestart.orig.y - dy;  //+ point.x;
			var newW = panmovestart.width;
			// var newH = parseFloat(panmovestart.viewbox[3]) * scale;
			// console.log(newX.toFixed(0), newY.toFixed(0), newW.toFixed(0),  panmovestart.orig.x .toFixed(0), panmovestart.clickp.x.toFixed(0));
			
			svg.setAttribute("viewBox",""+newX+" "+newY+" "+newW+" "+newW);
		}
	}
	
	// var vb = getelid("viewboxcircle1");
	// delel(vb);
	// var vl = getelid("viewboxline");
	// delel(vl);
	// var p = new Point(svg.viewBox.baseVal.x, svg.viewBox.baseVal.y);
	// drawcircle(svg, p, 10, REDSTYLE, "viewboxcircle1");
	// drawline(svg, [p, p.move(svg.viewBox.baseVal.width, svg.viewBox.baseVal.height)], BLUESTYLE, "viewboxline");
}

function dropSVG(ev) { // Open dropped SVG file in the editor
	console.log('File(s) dropped');
	
	
	ev.preventDefault();
	var file;
	if (ev.dataTransfer.items) {
		// Use DataTransferItemList interface to access the file(s)
		for (var i = 0; i < ev.dataTransfer.items.length; i++) {
			// If dropped items aren't files, reject them
			if (ev.dataTransfer.items[i].kind === 'file') {
				file = ev.dataTransfer.items[i].getAsFile();
				// console.log('1... file[' + i + '].name = ' + file.name);
			}
		}
	} else {
		// Use DataTransfer interface to access the file(s)
		for (var i = 0; i < ev.dataTransfer.files.length; i++) {
			file = ev.dataTransfer.files[i];
			// console.log('2... file[' + i + '].name = ' + file.name);
		}
	}
	if (file != null && (file.name.indexOf(".svg") || file.name.indexOf(".SVG") ) && file.type == "image/svg+xml"){
		console.log("Is SVG file", file);
		getelid("generic_message_splash").classList.remove("hidebodyviewer");
		getelid("generic_splash_title").innerHTML = "Analyzing dropped SVG";
		getelid("generic_splasherror").innerHTML = 'You dropped file "'+file.name+'". This should not take long.';
		// async code:
		file.text().then( // See plain text in file
			function(response){ // when get text, look for editorstate in it
				
				var ind = response.indexOf("editorstate");
				var start = response.indexOf("{", ind);
				var end = response.indexOf("}", start);
				if (start != -1 && end != -1){
					var ed = response.slice(start,end+1).replaceAll(",",", ");
					console.log(ed);
					// console.log(JSON.parse(ed));
					try {
						editorstate = JSON.parse(ed.replaceAll("&quot;",'"'));
						makedrawing("Dropped SVG file containing editorstate");
						
					} catch(e){
						console.log("Dropped SVG file contained invalid editorstate:");
						console.log(e);
						getelid("generic_message_splash").classList.remove("hidebodyviewer");
						getelid("generic_splash_title").innerHTML = "Error parsing SVG file";
						getelid("generic_splasherror").innerHTML = 'The editorstate contained in the file was invalid or corrupted.<br><br>'+e+"<br><br>"+ed;
					}
					
					
				} else {
					console.log("SVG file does not contain editorstate, unable to load.");
					getelid("generic_message_splash").classList.remove("hidebodyviewer");
					getelid("generic_splash_title").innerHTML = "No editorstate in SVG file";
					getelid("generic_splasherror").innerHTML = 'The file "'+file.name+'" does not contain the necessary information to load into the editor.';
				}
				
				
			}, 
			function(error){
				console.log("Error reading svg file",error)
			} 
		);
	} else { // Dropped file is not an SVG file
		console.log("Is not SVG file", file);
		getelid("generic_message_splash").classList.remove("hidebodyviewer");
		getelid("generic_splash_title").innerHTML = "Dropped file was not recognized";
		getelid("generic_splasherror").innerHTML = 'The file "'+file.name+'" is not an SVG file created by Lute Designer and does not contain the necessary information to load into the editor.';
		
	}
}

function dragOverHandler(ev) { // Prevent opening dropped file
  // console.log('File(s) in drop zone');
  ev.preventDefault();
}

function comparison_mode(el){ // Show many instruments side by side
	var o = getelid("comparisonoptions");
	if (el.value == "comparison"){
		// side by side comparison mode; Activate hidden editor field for showing other lutes
		editorstate.drawingpurpose = "comparison";
		console.log("compariosn time");
		o.setAttribute("style",""); // show
		// comparison instruments are stored in List instruments 
		// Make selectors based on already selected instruments, if any
		draw_comparison_list();
		
		// Also draw the other instruments
		
	} else {
		editorstate.drawingpurpose = "technical";
		var o = getelid("comparisonoptions");
		o.setAttribute("style","display:none; "); // hide
		// Also do not draw the other instruments
	}
}

function add_comparison (el){ // Add/change an instrument in comparison mode list
	if (el.value=="select") return;
	var numba = el.id.split("-")[1];
	if (el.value=="remove"){
		instruments.remove(numba);
	}
	// if this selector had already been used, change instrument in list
	// else add new instrument to list
	else if (numba < el.parentNode.lastChild.id.split("-")[1]){
		instruments.set(numba, new Instrument(instrumentpresets[el.value],numba,el.value));
	} else {
		instruments.add(new Instrument(instrumentpresets[el.value],numba,el.value));
	}
	
	console.log(numba,el.value);
	console.log(instruments.all());
	draw_comparison_list();
	// Trigger drawing of changed instrument
	instruments.draw_comparison(undefined, new Point(-70,DRAWINGHEIGHT), -1);
	// TODO: remove deletion of everything from old drawing mode, so that only changed instrument gets redrawn
	// TODO: instrument.js: next logical thing is crossview
	// TODO: make old version draw things on top of each other too
	// TODO: use new back drawing method for drawing back view in old drawing mode
	// TODO: make old instrument calculation provide this.bridge/nuts/pegbox style packages for old/new pegbox drawing functions, or make wrapper functions? wrappers for old functions.
	// TODO: use new front drawing mode on top of old to see if they match
	// TODO: Draw main instrument with new code?
}

function draw_comparison_list(){
	var o = getelid("comparisonoptions");
	delchildren(o);
	var e = addel(o,creel("label"));
	e.innerHTML = "Show other instruments:";
	for (var i=0; i<=instruments.all().length; i++){ // a select for each instrument
			
			
			if (i == instruments.all().length){// Empty selector
				var name = "select";
				
			} else { // Actual instrument
				var name = instruments.get(i).name;
				console.log("instrument ",name);
			}
			
			var s = addel(o, creel("select","comparison-"+i));
			s.setAttribute("onchange","add_comparison(this)");
			create_select_options(s, instrumentpresets, name);
			// Add a remove option
			if (name != "select"){
				var newoption = creel("option", "", "", ["value", "remove"]);
				newoption.innerHTML = "Remove...";
				addelafter(s.firstChild, newoption);
			}
			
		}
	// Refresh editor area height
	getelid("drawing").style.maxHeight = getelid("drawing").scrollHeight + "px";
}














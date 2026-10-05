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
//
// import * as THREE from './three/build/three.module.js';
// import { OrbitControls } from './three/examples/jsm/controls/OrbitControls.js';
// import { STLLoader } from './three/examples/jsm/controls/STLLoader.js';

var camera, scene, renderer, animation_id;
var normal = new THREE.Vector3( 0, 0, -1 );
var controls;

// TODO: Live 3D view?

function show_whole_neck(){
	// Unhide bodyviewer div and start three.js animation in it
	var bodyviewerdiv = getelid("bodyviewer");
	var bbutn = getelid("bodyviewerbutton");
	// bbutn.innerHTML = "Exit 3D view";
	bbutn.setAttribute("onclick","stop_bodyviewer(this);");
	// Start 3D animation
	var stl = "";
	var allow = true;
	try {
		stl = /* pegbox_stl(mandolino_teppe_pegbox) +"\n"+ */neck_stl();//+"\n"+body_stl() +"\n";
	} catch(e) {
		console.log(e);
		allow = false;
	}
	try {
		getelid("output_textbox").innerHTML = stl;
	} catch(e) {
		console.log(e);
	}
	
	
	if (allow) { 
		console.log("Start animation"); 
		bodyviewerdiv.className = "";
		init(bodyviewerdiv, stl); // Build scene
		animate();
	}	// Animation loop
}

function show_body_stl(){
	// Unhide bodyviewer div and start three.js animation in it
	var bodyviewerdiv = getelid("bodyviewer");
	var bbutn = getelid("bodyviewerbutton");
	// bbutn.innerHTML = "Exit 3D view";
	bbutn.setAttribute("onclick","stop_bodyviewer(this);");
	
	// Start 3D animation
	var stl = "";
	var allow = true;
	try {
		stl = center_rib_stl();
		
	} catch(e) {
		console.log(e);
		allow = false;
	}
	try {
		getelid("output_textbox").innerHTML = stl;
	} catch(e) {
		console.log(e);
	}
	
	
	if (allow) { 
		console.log("Start animation"); 
		bodyviewerdiv.className = "";
		init(bodyviewerdiv, stl); // Build scene
		console.log(stl);
		animate();
	}	// Animation loop
	
}
function show_pegbox(){
	// Unhide bodyviewer div and start three.js animation in it
	var bodyviewerdiv = getelid("bodyviewer");
	var bbutn = getelid("bodyviewerbutton");
	bbutn.innerHTML = "Exit 3D view";
	bbutn.setAttribute("onclick","stop_bodyviewer(this);");
	bodyviewerdiv.className = "";
	// Start 3D animation
	init(bodyviewerdiv, pegbox_stl()); // Build scene / STL stuff in ...-monoxyle.js
	animate();	// Animation loop
	
}
function start_bodyviewer(){
	// Unhide bodyviewer div and start three.js animation in it
	var bodyviewerdiv = getelid("bodyviewer");
	var bbutn = getelid("bodyviewerbutton");
	// bbutn.innerHTML = "Exit 3D view";
	bbutn.classList.add('clicked');
	bbutn.setAttribute("onclick","stop_bodyviewer(this);");
	bodyviewerdiv.className = "";
	// Start 3D animation
	try {
		init(bodyviewerdiv, ); // Build scene
		animate();	// Animation loop
	} catch(e) {
		console.log(e);
	}
}
function stop_bodyviewer(bbutn){
	try {
		console.log("Stopping 3D animation");
		cancelAnimationFrame( animation_id ); // Stop animating
		if (controls) controls.dispose(); // Remove eventlisteners from mouse buttons
		var bodyviewerdiv = getelid("bodyviewer");
		delchildren(bodyviewerdiv); // Remove canvas 
		bodyviewerdiv.className = "hidebodyviewer";
	} catch(e) {
		console.log(e);
	}
	
	// bbutn.innerHTML = "View body in 3D";
	
	bbutn.classList.remove('clicked');
	bbutn.setAttribute("onclick","start_bodyviewer(this);");
}

///////////////////////////////////////////////////////////////////////////////
// 3D model creation fron lutedesigner
///////////////////////////////////////////////////////////////////////////////

function create_3d_wirebody(ribpaths){
	// Convert ribpaths to vector3s
	// console.log("Ribpaths to 3D", ribpaths);
	var r = ribpaths.threedee; // Array of 3d points
	var wirebody = new THREE.Group();
	wirebody.name = "wirebody"
	// Create line colours
	for (var i=0; i<r.length-1; i++){
		// For each rib, choose a color between red and blue
		var geometry = new THREE.Geometry();
		var geometry_l = new THREE.Geometry();
		// var B = ("00"+parseInt(50).toString(16)).substr(-2);
		// var R = ("00"+parseInt(255*(i/(r.length-1))).toString(16)).substr(-2);
		// var G = ("00"+parseInt(255*(1- i/(r.length-1))).toString(16)).substr(-2);
		// var colorstr = R + G + B;
		// var color = parseInt(colorstr,16);
		var color = 0x000000;
		// console.log(R,G,B, colorstr, color);
		var material = new THREE.LineBasicMaterial({ color: color, linewidth:3 });
		var stopped = false;
		for (var j=0; j<r[i].length; j++){
			if (r[i][j] && !stopped){ // normal situation, add point
				geometry.vertices.push(new THREE.Vector3(r[i][j].x, r[i][j].y, r[i][j].z));
				geometry_l.vertices.push(new THREE.Vector3(-r[i][j].x, r[i][j].y, r[i][j].z));
				stopped = false;
			} else if (r[i][j] && stopped){ // After nulls, start new shape
				var geometry = new THREE.Geometry();
				var geometry_l = new THREE.Geometry();
				geometry.vertices.push(new THREE.Vector3(r[i][j].x, r[i][j].y, r[i][j].z));
				geometry_l.vertices.push(new THREE.Vector3(-r[i][j].x, r[i][j].y, r[i][j].z));
				stopped = false;
			} else if (!r[i][j] && stopped){ // null point, finish shape, stop
				var line = new THREE.Line(geometry, material);
				var line_l = new THREE.Line(geometry_l, material);
				// Make a mirror image for the left side
				wirebody.add(line);
				wirebody.add(line_l);
				stopped = true;
			} else { // if null and not stopped, stop
				stopped = true;
			}
			
			
		}
		var line = new THREE.Line(geometry, material);
		var line_l = new THREE.Line(geometry_l, material);
		// Make a mirror image for the left side
		wirebody.add(line);
		wirebody.add(line_l); 
	}
	// Add edge separately
	if (editorstate.bodyshapefrom=="guitar"){
		var geometry = new THREE.Geometry();
		var geometry_l = new THREE.Geometry();
		var geometry_edge = new THREE.Geometry();
		var geometry_edgel = new THREE.Geometry();
		var material = new THREE.LineBasicMaterial({ color: 0x000000, linewidth:3 });
		var r = ribpaths.soundboard_edge;
		for (var j=0; j<r.length; j++){
			geometry.vertices.push(new THREE.Vector3(r[j].x, r[j].y, 0));
			geometry_l.vertices.push(new THREE.Vector3(-r[j].x, r[j].y, 0));
			geometry_edge.vertices.push(new THREE.Vector3(r[j].x, r[j].y, r[j].z));
			geometry_edgel.vertices.push(new THREE.Vector3(-r[j].x, r[j].y, r[j].z));
		}
		var line = new THREE.Line(geometry, material);
		var line_l = new THREE.Line(geometry_l, material);
		var linee = new THREE.Line(geometry_edge, material);
		var line_el = new THREE.Line(geometry_edgel, material);
		// Make a mirror image for the left side
		wirebody.add(line);
		wirebody.add(line_l);
		wirebody.add(linee);
		wirebody.add(line_el);
	}
	
	// Move down a bit to center on screen
	// console.log(wirebody);
	wirebody.translateY(cps.nutfrombody.y/2);
	/////////////////////////////////////////////////////////////
	// Do rosette circle from lines
	var rc = cps.rosettefromzero;
	var rw = cps.rosettewidth/2;
	var segs = 20;
	var gl = new THREE.Geometry();
	var gr = new THREE.Geometry();
	for (var i=0; i<=segs; i++){
		gl.vertices.push(new THREE.Vector3(rw*Math.sin(i*Math.PI/segs),rc+rw*Math.cos(i*Math.PI/segs),-0.05));
		gr.vertices.push(new THREE.Vector3(-rw*Math.sin(i*Math.PI/segs),rc+rw*Math.cos(i*Math.PI/segs),-0.05));
	}
	var rosl = new THREE.Line(gl, material);
	var rosr = new THREE.Line(gr, material);
	wirebody.add(rosl);
	wirebody.add(rosr);
	return wirebody;
}

function create_3d_meshbody(ribpaths){ // Draw lute in 3D
	var sb = lute3d.ribpaths.soundboard_edge; 
	var meshbody = new THREE.Group();
	meshbody.name = "meshbody";
	// Soundboard
	soundboard_3D(meshbody, sb, cps, cps.neckjoint_no_origin.y+RIBTHICKNESS, 0xffdf9d);
	
	// Body sides
	if (editorstate.bodyshapefrom=="guitar"){
		guitar_sides_3D(meshbody,sb);
	}
	
	// Ribs
	ribs_3D(meshbody, lute3d, sb, cps);
	
	// TODO: endclasp
	
	// Neck
	neck_3D (meshbody, sb, cps, 0x111111);
	
	// Bridge
	bridge_3D(meshbody, cps.bridge, 0xcf6942);
	
	// Pegbox from cps.pegbox
	if (editorstate.pegboxstyle == "renaissance" 
		|| editorstate.pegboxstyle ==  "chanterelle" 
		|| editorstate.pegboxstyle == "bassrider"){
		pegbox_3D(meshbody, cps, 0xcf6942);
	} else if (editorstate.pegboxstyle == "theorbo"){
		theorbo_extension_3D (meshbody, 0xcf6942, cps);
	}
	if (editorstate.bodyshapefrom == "guitar" ){
		
		// var fro = insert_drawing("", "pegbox-"+editorstate.pegboxstyle+"-front", frontview, front);
		var p = getelid("svg-general").getSVGDocument().getElementById(editorstate.pegboxstyle+"-bake");
		// console.log(p);
		// if (fro.firstElementChild.getAttribute("d")){
		// cps.pegbox_shape = fro.firstElementChild.getAttribute("d");
		guitar_pegbox_3D (meshbody, 0xcf6942, cps, getseglist(p));
	}
	
	// Nuts
	for (nut of cps.nuts){
		nut_3D(meshbody, nut, 0xeefefe);
	}
	
	// Strings
	strings_3D(meshbody, cps.strings, 0xddeecc);
	// Frets
	draw_frets_3D(meshbody, cps.fretlist, 0xccddbb);
	// Move the whole instrument to the middle of the scene
	meshbody.translateY(cps.nutfrombody.y/2);
	// console.log(meshbody);
	
	return meshbody;
}

///////////////////////////////////////////////////////////////////////////////
// Three.js functions
///////////////////////////////////////////////////////////////////////////////

// TODO: Draw foamcore mold in 3D. Parse SVG shapes for coordinates? Place rib supports based on angles and values from lute3d.planedata?
function create_3D_foamcore (parts){
	// Convert ribpaths to vector3s
	console.log("Ribpaths to 3D", ribpaths);
	var r = lute3d.ribpaths.threedee; // Array of 3d points
	var foamcore = new THREE.Group();
	// Create line colours
	for (var i=0; i<r.length-1; i++){
		// For each rib, choose a color between red and blue
		var geometry = new THREE.Geometry();
		var geometry_l = new THREE.Geometry();
		// var B = ("00"+parseInt(50).toString(16)).substr(-2);
		// var R = ("00"+parseInt(255*(i/(r.length-1))).toString(16)).substr(-2);
		// var G = ("00"+parseInt(255*(1- i/(r.length-1))).toString(16)).substr(-2);
		// var colorstr = R + G + B;
		// var color = parseInt(colorstr,16);
		var color = 0xffffff;
		// console.log(R,G,B, colorstr, color);
		var material = new THREE.LineBasicMaterial({ color: color, linewidth:3 });
		for (var j=0; j<r[i].length; j++){
			geometry.vertices.push(new THREE.Vector3(r[i][j].x, r[i][j].y, r[i][j].z));
			geometry_l.vertices.push(new THREE.Vector3(-r[i][j].x, r[i][j].y, r[i][j].z));
		}
		var line = new THREE.Line(geometry, material);
		var line_l = new THREE.Line(geometry_l, material);
		// Make a mirror image for the left side
		wirebody.add(line);
		wirebody.add(line_l);
	}
	// Add edge separately
	var geometry = new THREE.Geometry();
	var geometry_l = new THREE.Geometry();
	var material = new THREE.LineBasicMaterial({ color: 0x000000, linewidth:3 });
	var r = ribpaths.soundboard_edge;
	for (var j=0; j<r.length; j++){
		geometry.vertices.push(new THREE.Vector3(r[j].x, r[j].y, r[j].z));
		geometry_l.vertices.push(new THREE.Vector3(-r[j].x, r[j].y, r[j].z));
	}
	var line = new THREE.Line(geometry, material);
	var line_l = new THREE.Line(geometry_l, material);
	// Make a mirror image for the left side
	wirebody.add(line);
	wirebody.add(line_l);
	// Move down a bit to center on screen
	console.log(wirebody);
	wirebody.translateY(-300);
	return wirebody;
}


function init(el, what) {
	try {
	renderer = new THREE.WebGLRenderer( {antialias:true} );
	renderer.setSize(el.clientWidth, el.clientHeight);
	el.appendChild(renderer.domElement);

	camera = new THREE.PerspectiveCamera(75, el.clientWidth /el.clientHeight, 1, 5000);
	camera.position.set(0, 0, 600);
	camera.lookAt(new THREE.Vector3(0, 800, 0));

	scene = new THREE.Scene();
	scene.background = new THREE.Color(0x666666);
	
	// What to show:
	if (what){ // what is an STL ascii string
		try {
			// TODO: STL loading more than one object... what ==> array of STLs?
			// what = {neck:{material:MeshStandardMaterial(), model:STLtext}}
			var color = 0x885555;
			var material = new THREE.MeshStandardMaterial({ color: color, roughness:0.70, metalness:0.40, flatShading:true, wireframe:false });
			material.side = THREE.DoubleSide;
			var loader = new THREE.STLLoader();
			// loader.load( './models/stl/slotted_disk.stl', function ( geometry ) {
			// scene.add( new THREE.Mesh( geometry ) );
			// });
			console.log("bytelength",what.size);
			var pegbox = new THREE.Mesh( loader.parse(what) , material);
			pegbox.position.set(0, -200, 0);
			scene.add(pegbox);
		} catch(e) {
			console.log(e);
		}
		
		
	} else { // Show body if nothing else was requested
		var wirebody = create_3d_wirebody(lute3d.ribpaths);
		wirebody.scale.set(1.001,1.0005,1.001);
		scene.add(wirebody);
		try {
			scene.add(create_3d_meshbody(lute3d.ribpaths));
		} catch(e) {
			console.log(e);
		}
	}
	
	
	var light = new THREE.HemisphereLight( 0xffffbb, 0x080820, 1 );
	scene.add( light );
	
	var AmbientLight = new THREE.AmbientLight( 0x404040 ); // soft white light
	scene.add( AmbientLight );
	
	var light = new THREE.PointLight( 0xffaaaa, 10, 1000, 1 );
	light.position.set( 150,-200,800 );
	scene.add( light );
	
	var light = new THREE.PointLight( 0xffaaaa, 10, 1000, 1 );
	light.position.set( 200,300,-800 );
	scene.add( light );
	
	// THREE.Object3D.DefaultUp = new THREE.Vector3( 1,-1,0 )
	// var directionalLight = new THREE.DirectionalLight( 0xffffff, 0.5 );
	// directionalLight.position = new THREE.Vector3( 500, 1000, 1000 );
	// scene.add( directionalLight );
	// directionalLight.target.position = new THREE.Vector3( 0,0,0 );
	
	controls = new THREE.OrbitControls( camera, renderer.domElement );

	//controls.update() must be called after any manual changes to the camera's transform
	// camera.position.set( 0, 20, 100 );
	controls.update();
	// renderer.render(scene, camera);

	// camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.01, 10 );
	// camera.position.z = 1;

	// scene = new THREE.Scene();

	// geometry = new THREE.BoxGeometry( 0.2, 0.2, 0.2 );
	// material = new THREE.MeshNormalMaterial();

	// mesh = new THREE.Mesh( geometry, material );
	// scene.add( mesh );

	// renderer = new THREE.WebGLRenderer( { antialias: true } );
	// renderer.setSize( window.innerWidth, window.innerHeight );
	// document.getElementById("threetest").appendChild( renderer.domElement );
	} catch(e){
		
		console.log("Failed to initialize 3D view",e);
		show_error(_t("Failed to initialize 3D view"));
		// stop_bodyviewer(bbutn);
	}
}

function live_update(){
	scene.remove(scene.getObjectByName("wirebody"));
	scene.remove(scene.getObjectByName("meshbody"));
	
	console.log("scene children", scene.children);
	var wirebody = create_3d_wirebody(lute3d.ribpaths);
	wirebody.scale.set(1.001,1.0005,1.001);
	scene.add(wirebody);
	try {
		scene.add(create_3d_meshbody(lute3d.ribpaths));
	} catch(e) {
		console.log(e);
	}
	
}

function animate() {
	// console.log("animating");
	animation_id = requestAnimationFrame( animate );

	// pyramid.rotation.x += 0.01;
	// pyramid.rotation.y += 0.02;
	if (controls !== undefined){
		controls.update();
	} else {
		// stop_bodyviewer(getelid("bodyviewerbutton"));
		// return;
	}
	if (renderer !== undefined){
		renderer.render( scene, camera );
	} else {
		// stop_bodyviewer(getelid("bodyviewerbutton"));
		// return;
	}
}




///////////////////////////////////////////////////////////////////////////////
// STL export
///////////////////////////////////////////////////////////////////////////////
function export_STL(){
	if (scene === undefined) start_bodyviewer(this);
	var exporter = new THREE.STLExporter();
	var result = exporter.parse(scene,{binary:true}); // gives [object DataView]
	// offer a download
	var datatype = 'data:model/x.stl-binary;charset=utf-8,';
	// download("lute.stl", result, datatype);	
	var pom = document.createElement('a');
	var blob = new Blob([result], {'type':datatype});
    pom.setAttribute('href', window.URL.createObjectURL(blob));
    pom.setAttribute('download', "lute.stl");
    
    if (document.createEvent) {
        var event = document.createEvent('MouseEvents');
        event.initEvent('click', true, true);
        pom.dispatchEvent(event);
    } else {
        pom.click();
    }
}


///////////////////////////////////////////////////////////////////////////////
// Part makers
///////////////////////////////////////////////////////////////////////////////

function strings_3D (meshbody, stringpoints, color){
	var stringmaterial = new THREE.LineBasicMaterial({ color: color, linewidth:2 });
	var strings = new THREE.Geometry();
	vcounter=0;
	for (string of stringpoints){
		// Make a string
		var geometry = new THREE.Geometry();
		geometry.vertices.push(new THREE.Vector3(string[0].x,string[0].y, -7));
		geometry.vertices.push(new THREE.Vector3(string[1].x,string[1].y, -1));
		var line = new THREE.Line(geometry, stringmaterial);
		meshbody.add(line);
	}
	// TODO: Should strings be in a group?
}
function nut_3D (meshbody, points, color){
	var nutmaterial = new THREE.MeshStandardMaterial({ color: color, roughness:0.9, metalness:0.0, flatShading:true, wireframe:false });
	nutmaterial.side = THREE.DoubleSide;

	var nut = {g:new THREE.Geometry(), vcounter:0};
	// Top face
	makequad (nut, points.treble_lower.move(0,0,-1),
				   points.treble_upper.move(0,-1,-1),
				   points.bass_lower.move(0,0,-1),
				   points.bass_upper.move(0,-1,-1),false);
	// Front face
	makequad (nut, points.treble_lower.move(0,0,-1),
				   points.treble_lower.move(0,0,3),
				   points.bass_lower.move(0,0,-1),
				   points.bass_lower.move(0,0,3),false);
	// bottom face
	makequad (nut, points.treble_lower.move(0,0,3),
				   points.treble_upper.move(0,1,3),
				   points.bass_lower.move(0,0,3),
				   points.bass_upper.move(0,1,3),false);
	// Back face
	makequad (nut, points.treble_upper.move(0,1,1),
				   points.treble_upper.move(0,1,3),
				   points.bass_upper.move(0,1,1),
				   points.bass_upper.move(0,1,3),false);
	
	// Slanted face
	makequad (nut, points.treble_upper.move(0,-1,-1),
				   points.treble_upper.move(0,1,1),
				   points.bass_upper.move(0,-1,-1),
				   points.bass_upper.move(0,1,1),false);
	// Treble Side face
	makequad (nut, points.treble_upper.move(0,-1,-1),
				   points.treble_upper.move(0,1,1),
				   points.treble_lower.move(0,0,-1),
				   points.treble_lower.move(0,0,3),false);
	maketriangle (nut, points.treble_upper.move(0,1,1),
					   points.treble_upper.move(0,1,3),
					   points.treble_lower.move(0,0,3),false);
	// Bass Side face
	makequad (nut, points.bass_upper.move(0,-1,-1),
				   points.bass_upper.move(0,1,1),
				   points.bass_lower.move(0,0,-1),
				   points.bass_lower.move(0,0,3),false);
	maketriangle (nut, points.bass_upper.move(0,1,1),
					   points.bass_upper.move(0,1,3),
					   points.bass_lower.move(0,0,3),false);
	
	meshbody.add(new THREE.Mesh( nut.g, nutmaterial ));

}
function pegbox_3D (meshbody, cps, color){
	var pegboxmaterial = new THREE.MeshStandardMaterial({ color: color, roughness:0.6, metalness:0.2, flatShading:true, wireframe:false });
	pegboxmaterial.side = THREE.DoubleSide;
	var pegbox = {g:new THREE.Geometry(), vcounter:0};
	// side of pegbox
	makequad (pegbox, cps.pegbox.outside.startlower,
					  cps.pegbox.outside.endlower,
					  cps.pegbox.outside.startupper,
					  cps.pegbox.outside.endupper,true);
	// tip of pegbox
	mirrorface (pegbox, cps.pegbox.outside.endlower,
						cps.pegbox.outside.endupper,false);
	// bottom of pegbox
	mirrorface (pegbox, cps.pegbox.outside.endlower,
						cps.pegbox.outside.startlower,false);
	// inside bottom of pegbox
	mirrorface (pegbox, cps.pegbox.inside.endlower,
						cps.pegbox.inside.startlower,false);
	// inseside of pegbox
	makequad (pegbox, cps.pegbox.inside.startlower,
					  cps.pegbox.inside.endlower,
					  cps.pegbox.inside.startmid,
					  cps.pegbox.inside.endupper,true);
	maketriangle (pegbox, cps.pegbox.inside.startupper,
						  cps.pegbox.inside.startmid,
						  cps.pegbox.inside.endupper,true);
	// Top face of pegbox side
	makequad (pegbox, cps.pegbox.outside.startupper,
					  cps.pegbox.inside.startupper,
					  cps.pegbox.outside.endupper,
					  cps.pegbox.inside.endupper,true);
	// Top face of pegbox tip
	mirrorface (pegbox, cps.pegbox.outside.endupper,
						cps.pegbox.inside.endupper,true);
	// Inside face of pegbox tip
	mirrorface (pegbox, cps.pegbox.inside.endupper,
						cps.pegbox.inside.endlower,true);
	// Inside face of pegbox big block
	mirrorface (pegbox, cps.pegbox.inside.startupper,
						cps.pegbox.inside.startmid,true);
	mirrorface (pegbox, cps.pegbox.inside.startmid,
						cps.pegbox.inside.startlower,true);
	// glue face of pegbox
	mirrorface (pegbox, cps.pegbox.outside.startupper,
						cps.pegbox.outside.startlower,true);
	
	// Placement of pegbox
	// TODO: For easy STL output, calculate vertex positions in final positions?
	pegbox.g.rotateX(halfpi);
	pegbox.g.rotateZ(Math.PI);
	pegbox.g.rotateX(-radtodeg*8);
	pegbox.g.translate(0,cps.neck.length-21 ,3.5);
	pegbox.g.rotateZ(-cps.neck.angle);
	pegbox.g.translate(0,Math.abs(cps.nutfrombody.y)-cps.neck.length,4);
	
	meshbody.add(new THREE.Mesh( pegbox.g, pegboxmaterial ));
}
function guitar_pegbox_3D (meshbody, color, cps, seglist){
	var pegboxmaterial = new THREE.MeshStandardMaterial({ color: color, roughness:0.6, metalness:0.2, flatShading:true, wireframe:false });
	pegboxmaterial.side = THREE.DoubleSide;
	var pegbox = {g:new THREE.Geometry(), vcounter:0};
	console.log(seglist);
	// TODO: Do get_path_points() as a web worker after 2D drawing, then use data here
	// TODO: Or, clean path and bake 3d models
	p = [];
	var cur = new Point(0,0,0);
	var w = 0;
	var h = 0;
	for (seg of seglist){
		cur = cur.move(seg.x, -seg.y);
		if (cur.x > w) w = cur.x;
		if (cur.y > h) h = cur.y;
		// console.log(cur);
		p.push(cur);
	}
	var upcenter = cur.move(0,-w);
	var dcenter = upcenter.setz(15 - upcenter.y * (4 / h));
	console.log("upcenter", upcenter, w);
	// var seglist = interpretpath(extractpath(headpath));
	var th = 15;
	var pth = 15;
	for (var i=1; i < p.length; i++){
		// Thickness here
		th = 15 - p[i].y * (4 / h);
		// side
		makequad(pegbox, p[i-1], p[i], 
						 p[i-1].setz(pth), p[i].setz(th), true);
		// front & back
		if (p[i-1].y > upcenter.y){
			maketriangle(pegbox, upcenter, p[i-1], p[i], true);
			maketriangle(pegbox, dcenter, p[i-1].setz(pth), p[i].setz(th), true);
		} else {
			mirrorface (pegbox, p[i-1], p[i], true);
			mirrorface (pegbox, p[i-1].setz(pth), p[i].setz(th), true);
		}
		pth = th;
	}
	// back face
	mirrorface (pegbox, p[0], p[0].setz(14), true);
	
	pegbox.g.rotateX(radtodeg*13);
	pegbox.g.translate(0,Math.abs(cps.nutfrombody.y),0);
	meshbody.add(new THREE.Mesh( pegbox.g, pegboxmaterial ));
}
function theorbo_extension_3D (meshbody, color, cps){
	var pegboxmaterial = new THREE.MeshStandardMaterial({ color: color, roughness:0.6, metalness:0.2, flatShading:true, wireframe:false });
	pegboxmaterial.side = THREE.DoubleSide;
	var ext = {g:new THREE.Geometry(), vcounter:0};
	// cps.extension
	// - upper end points, lower end points ( draw bottom end as rectangular)
	// - lower pegbox hole
	// treble side of extension
	makequad (ext,  cps.extension.treble_lower,
					cps.extension.treble_upper,
					cps.extension.treble_lower.move(2,0,24),
					cps.extension.treble_upper.move(2,0,20),false);
	// bass side of extension
	makequad (ext,  cps.extension.bass_lower,
					cps.extension.bass_upper,
					cps.extension.bass_lower.move(-2,0,24),
					cps.extension.bass_upper.move(-2,0,20),false);
	// little triangle on neck
	maketriangle(ext, cps.extension.treble_lower,
					  cps.extension.treble_lower.move(0,-30,0),
					  cps.extension.treble_lower.move(2,0,24), false);
	// little triangle on neck
	maketriangle(ext, cps.extension.bass_lower,
					  cps.extension.bass_lower.move(0,-30,0),
					  cps.extension.bass_lower.move(-2,0,24), false);
	/////////////////////////////////////////////////////////////////
	// back side of extension
	makequad (ext,  cps.extension.treble_lower.move(0,-30,0),
					cps.extension.bass_lower.move(0,-30,0),
					cps.extension.treble_lower.move(2,0,24),
					cps.extension.bass_lower.move(-2,0,24),false);
	// back side of extension
	makequad (ext,  cps.extension.treble_lower.move(2,0,24),
					cps.extension.bass_lower.move(-2,0,24),
					cps.extension.treble_upper.move(2,0,20),
					cps.extension.bass_upper.move(-2,0,20),false);
	// top end of extension
	makequad (ext,  cps.extension.treble_upper,
					cps.extension.bass_upper,
					cps.extension.treble_upper.move(2,0,20),
					cps.extension.bass_upper.move(-2,0,20),false);
	/////////////////////////////////////////////////////////////////
	// Top and lower pegbox hole, needs z coords calculated
	// in y,z space...
	var m = (cps.extension.treble_lower.z-cps.extension.treble_upper.z) / (cps.extension.treble_lower.y-cps.extension.treble_upper.y);
	function get_z(p) {
		var z = m * (p.y - cps.extension.treble_lower.y) - cps.extension.treble_lower.z;
		return p.setz(z+8); // why 8?
	}
	// pegbox hole treble side top
	makequad (ext,  get_z(cps.extension.hole.treble_lower),
					get_z(cps.extension.hole.treble_upper),
					cps.extension.treble_lower,
					cps.extension.treble_upper,false);
	
	// pegbox hole middle top
	makequad (ext,  cps.extension.bass_upper,
					cps.extension.treble_upper,
					get_z(cps.extension.hole.bass_upper),
					
					get_z(cps.extension.hole.treble_upper),false);
	// pegbox hole bass side top
	makequad (ext,  cps.extension.bass_lower,
					cps.extension.bass_upper,
					get_z(cps.extension.hole.bass_lower),
					get_z(cps.extension.hole.bass_upper),false);
	
	// pegbox hole lower wall slope
	makequad (ext,  get_z(cps.extension.hole.treble_lower).move(0,15,19),
					get_z(cps.extension.hole.bass_lower).move(0,15,19),
					get_z(cps.extension.hole.treble_lower),
					get_z(cps.extension.hole.bass_lower),false);
	// pegbox hole upper wall
	makequad (ext,  get_z(cps.extension.hole.treble_upper).move(0,0,19),
					get_z(cps.extension.hole.bass_upper).move(0,0,19),
					get_z(cps.extension.hole.treble_upper),
					get_z(cps.extension.hole.bass_upper),false);
	// pegbox hole bass wall
	makequad (ext,  get_z(cps.extension.hole.bass_lower).move(0,15,19),
					get_z(cps.extension.hole.bass_upper).move(0,0,19),
					get_z(cps.extension.hole.bass_lower),
					get_z(cps.extension.hole.bass_upper),false);
	// pegbox hole treble wall
	makequad (ext,  get_z(cps.extension.hole.treble_lower).move(0,15,19),
					get_z(cps.extension.hole.treble_upper).move(0,0,19),
					get_z(cps.extension.hole.treble_lower),
					get_z(cps.extension.hole.treble_upper),false);
	// pegbox hole bottom
	makequad (ext,  get_z(cps.extension.hole.treble_lower).move(0,15,19),
					get_z(cps.extension.hole.treble_upper).move(0,0,19),
					get_z(cps.extension.hole.bass_lower).move(0,15,19),
					get_z(cps.extension.hole.bass_upper).move(0,0,19),false);
	/////////////////////////////////////////////////////////////////
	// Draw upper pegbox
	var angle = Math.tan(m); // or smoething
	
	
	
	meshbody.add(new THREE.Mesh( ext.g, pegboxmaterial ));
}
function bridge_3D (meshbody, b, color){
	var bridgematerial = new THREE.MeshStandardMaterial({ color: 0xcf6942, roughness:0.6, metalness:0.2, flatShading:true, wireframe:false });
	bridgematerial.side = THREE.DoubleSide;
	var bridge = {g:new THREE.Geometry(), vcounter:0};
	
	// front
	makequad (bridge, new Point(-b.topbass.x,-b.topbass.y,0), 
					  new Point(-b.toptreble.x,-b.toptreble.y,0), 
					  new Point(-b.topbass.x,-b.topbass.y,-9), 
					  new Point(-b.toptreble.x,-b.toptreble.y,-7));
	// Top
	makequad (bridge, new Point(-b.middlebass.x,-b.middlebass.y,-9), 
					  new Point(-b.middletreble.x,-b.middletreble.y,-7), 
					  new Point(-b.topbass.x,-b.topbass.y,-9), 
					  new Point(-b.toptreble.x,-b.toptreble.y,-7));
	// bottom of top
	makequad (bridge, new Point(-b.middlebass.x,-b.middlebass.y,-9), 
					  new Point(-b.middletreble.x,-b.middletreble.y,-7), 
					  new Point(-b.middlebass.x,-b.middlebass.y,-4), 
					  new Point(-b.middletreble.x,-b.middletreble.y,-3));
	// slanted face
	makequad (bridge, new Point(-b.middlebass.x,-b.middlebass.y,-4), 
					  new Point(-b.middletreble.x,-b.middletreble.y,-3), 
					  new Point(-b.middlebass.x,-b.bottombass.y,-1), 
					  new Point(-b.middletreble.x,-b.bottomtreble.y,-1));
	// slanted face bottom 1mm
	makequad (bridge, new Point(-b.middlebass.x,-b.bottombass.y,-1), 
					  new Point(-b.middletreble.x,-b.bottomtreble.y,-1), 
					  new Point(-b.middlebass.x,-b.bottombass.y,0), 
					  new Point(-b.middletreble.x,-b.bottomtreble.y,0));
					  
	// TODO: Do bridge ends too
	meshbody.add(new THREE.Mesh( bridge.g, bridgematerial ));
}
function neck_3D (meshbody, sb,cps, color){ //TODO: Remove editorstate reference
	try {
	var neckg = {g:new THREE.Geometry(), vcounter:0};
	var color = color || 0x111111; // indigoish?
	// console.log(R,G,B, colorstr, color);
	var neckmaterial = new THREE.MeshStandardMaterial({ color: color, roughness:0.6, metalness:0.2, flatShading:true, wireframe:false });
	neckmaterial.side = THREE.DoubleSide; // So normal doesn't matter, I'd guess
	// Find mesh points

	if (editorstate.bodyshapefrom=="guitar"){
		var radius=cps.neckwidth/2;
		var ymove = getlast(sb).y;
		// Create block with generated points in semicircle to create guitar neck
		var block = []; // Points with y as distance from neckjoint
		var segs=6;
		var heelp = getlast(sb);
		var prevhp;
		// console.log("heelp", heelp);
		for (var i=0; i<=segs; i++){
			var x = radius*Math.sin((0.5+i)*0.5*Math.PI/(segs+0.5));
			var z = radius*Math.cos((0.5+i)*0.5*Math.PI/(segs+0.5));
			var y = z;
			var necp = new Point(x,y,z);
			// Heel top point
			var hx = 3*Math.sin((0.5+i)*0.5*Math.PI/(segs+0.5));
			var hy = 3*Math.cos((0.5+i)*0.5*Math.PI/(segs+0.5));
			var hz = heelp.z;
			var hp = new Point(hx,hy,hz);
			
			// TODO: Unsharpen heel, make half first segment
			// Calculate angle of heel tip from middle rib's last two points
			// Create heel faces
			if (i > 0){
				
				makequad(neckg, necp.move(0,ymove), getlast(block)[0].move(0,ymove),hp.move(0,ymove), prevhp.move(0,ymove), true);
				// maketriangle(neckg, necp.move(0,ymove), getlast(block)[0].move(0,ymove), hp.move(0,ymove), true);
				// maketriangle(neckg, getlast(block)[0].move(0,ymove), hp.move(0,ymove), prevhp.move(0,ymove), true);
				// Heel top face
				maketriangle(neckg, hp.move(0,ymove), prevhp.move(0,ymove), heelp, true);
				
			} else {
				mirrorface(neckg, necp.move(0,ymove),hp.move(0,ymove));
				maketriangle(neckg, hp.move(0,ymove),hp.scale(-1,1,1).move(0,ymove),heelp);
			}
			
			block.push([necp]);
			prevhp = hp;
		}
		// console.log("created block", block);
		var neckmid = new Point(0,getlast(block)[0].y,0);
		
	} else { // Lutes
		var block = lute3d.neckblock.allpoints_inorigin; // all points of neckblock moved to 0,0,0 (back face there)
		var lastrib = getlast(block);
		var neckmid = new Point(0,getlast(lastrib).y,0);
		var ymove = cps.neckblocky+RIBTHICKNESS;
		
	}
	// cps.nutfrombody = middle of neck nut end
	// cps.neck.bass_end, treble_end
	// Find neck end point
	var neckendy = neckmid.y + (cps.neckjointy - cps.nutmid.y) - RIBTHICKNESS; // Add this to neckmid.y // RIBTHICKNESS here is a bit suspect, but works
	var neckend = new Point(cps.nutmid.x-FRONTVIEWORIGIN.x, neckendy+ymove, 0);

	// Find scale from neck end height and width vs neckjoint width
	var x_scale = cps.nutwidth / cps.neckwidth;
	var midp = new Point(-neckend.x, neckend.y, 0);
	// TODO: Lute neck starts ribthickness too far up? No, but it's a little bit off
	if (editorstate.bodyshapefrom=="guitar"){
		var jp = getlast(block[0]).move(0,ymove);
	} else {
		var jp = getlast(block[0]).vectorgrow(RIBTHICKNESS, neckmid).move(0,ymove);// .move(d*Math.sin(a));
	}
	var rotp = new Point(0,ymove);
	// console.log("jp",jp);
	// console.log("rotp",rotp);
	// Draw middle face of neck backside as a mirrored face
	var jpp = jp.scale(-1,1,1);
	if (editorstate.bodyshapefrom=="guitar"){
		// if guitar, move end point to hit headstock
		var ep = new Point(jp.x*x_scale, neckend.y+jp.z*2, jp.z*x_scale).rotate(rotp,cps.neck.angle);
		var bep = new Point(-jp.x*x_scale, neckend.y+jp.z*2, jp.z*x_scale).rotate(rotp,cps.neck.angle);
	} else {
		var ep = new Point(jp.x*x_scale, neckend.y, jp.z*x_scale).rotate(rotp,cps.neck.angle);
		var bep = new Point(-jp.x*x_scale, neckend.y, jp.z*x_scale).rotate(rotp,cps.neck.angle);
	}
	
	
	// mirrorface(neckg, jp,ep); // Middle of neck backside
	makequad(neckg,jp,jpp,ep,bep,false);
	maketriangle(neckg,ep,bep,midp);// middle end face
	maketriangle(neckg,jp,jp.scale(-1,1,1),neckmid.move(0,ymove));// neckjoint middle
	// ymove = position of neckblock
	
	// Other faces of neck
	for (var i=1; i<block.length; i++){
		if (editorstate.bodyshapefrom=="guitar"){
			jp = getlast(block[i]).move(0,ymove);
			var jpp = getlast(block[i-1]).move(0,ymove);
			jpb = jp.scale(-1,1,1);
			var jppb = jpp.scale(-1,1,1);
		} else {
			jp = getlast(block[i]).vectorgrow(RIBTHICKNESS, neckmid).move(0,ymove);
			var jpp = getlast(block[i-1]).vectorgrow(RIBTHICKNESS, neckmid).move(0,ymove);
			jpb = jp.scale(-1,1,1);
			var jppb = jpp.scale(-1,1,1);
			
		}
		
		// End points
		var prevp = ep;
		var prevbp = bep;
		if (editorstate.bodyshapefrom=="guitar"){
			ep = new Point(jp.x*x_scale, neckend.y+jp.z*2, jp.z*x_scale).rotate(rotp,cps.neck.angle);
			bep = new Point(-jp.x*x_scale, neckend.y+jp.z*2, jp.z*x_scale).rotate(rotp,cps.neck.angle);
		} else {
			ep = new Point(jp.x*x_scale, neckend.y, jp.z*x_scale).rotate(rotp,cps.neck.angle);
			bep = new Point(-jp.x*x_scale, neckend.y, jp.z*x_scale).rotate(rotp,cps.neck.angle);
		}
		
		// console.log("ep",ep);
	 	// Bass Face
		maketriangle(neckg,jppb,jpb,bep, false);
		maketriangle(neckg,jppb, bep, prevbp, false);
		// Treble Face
		maketriangle(neckg,jpp,jp,ep, false);
		maketriangle(neckg,jpp, ep, prevp, false); 
		// End face
		maketriangle(neckg,ep,prevp,midp, false);
		maketriangle(neckg,bep,prevbp,midp, false);
		// neckjoint
		maketriangle(neckg,jp,jpp,neckmid.move(0,ymove), true);
	}
	
	// Do front face of neck (not fingerboard)
	makequad(neckg, jp,ep,jpb,bep,false);
	meshbody.add(new THREE.Mesh( neckg.g, neckmaterial ));
	} catch(e) {console.log(e);}
	
}
function guitar_sides_3D (meshbody, sb, color){
	var geometry = {g:new THREE.Geometry(), vcounter:0};
	var color = color || 0xffa559;
	var material = new THREE.MeshStandardMaterial({ color: color, roughness:0.40, metalness:0.40, flatShading:true, wireframe:false });
	material.side = THREE.DoubleSide;

	for (var j=1; j<sb.length; j++){
		// console.log(r[j]);
		makequad(geometry,sb[j-1].setz(0),sb[j].setz(0),sb[j-1],sb[j], true);
	}
	meshbody.add(new THREE.Mesh( geometry.g, material ));
}
function soundboard_3D (meshbody, sb, cps, njo, color){ // TODO: do rosette as hole here
	var soundboard = {g:new THREE.Geometry(), vcounter:0};
	var sbmaterial = new THREE.MeshStandardMaterial({ color: color, roughness:0.80, metalness:0.10, flatShading:true, wireframe:false });
	sbmaterial.side = THREE.DoubleSide;
	// Do rosette circle from lines
	var rc = cps.rosettefromzero;
	var rw = cps.rosettewidth/2;
	var segs = 30;
	var rps = [];
	
	for (var i=0; i<=segs; i++){
		rps.push(new Point(rw*Math.sin(i*Math.PI/segs),rc-rw*Math.cos(i*Math.PI/segs),0));
		
	}
	j = 1;
	var prevj = 0;
	for (var i=1; i<sb.length && sb[i].y <= njo ; i++){
		if (sb[i].y > rps[0].y && sb[i-1].y < getlast(rps).y){/*between rosette start,end*/
			if (sb[i-1].y < rps[0].y){ // Start triangle
				maketriangle(soundboard, sb[i-1].setz(0), sb[i-1].scale(-1,1,1).setz(0), rps[0]);
				maketriangle(soundboard, rps[0], sb[i-1].setz(0), rps[1], true);
			} 
			if (sb[i].y > getlast(rps).y){ // End triangle
				maketriangle(soundboard, sb[i].setz(0), sb[i].scale(-1,1,1).setz(0), getlast(rps));
			}
			// Normal rosette case, check that every point gets included
			if (true /* sb[i].y >= rps[j].y */){
				maketriangle(soundboard, sb[i-1].setz(0), sb[i].setz(0), rps[j], true);
				// console.log("tri i:",i-1,i,"j:",j, rps[j]);
				while (j < rps.length-1 && rps[j].y < sb[i].y){
					// TODO: This sometimes has to go to sb[i] instead
					j++;
					maketriangle(soundboard, rps[j-1], sb[i].setz(0), rps[j], true);
					// console.log("extra i",i,"j:",j-1,j, rps[j]);
					
				}
				
				// if (sb[i+1].y > rps[j+1].y){
					// j++;
				// }
				
			}
			/* while (rps[j].y < sb[i].y && j < rps.length-1) { 
				j++; 
				if (j-prevj > 1){
					// Make a triangle when rosette points would otherwise get skipped
					console.log("tri",i,j, rps[j]);
					maketriangle(soundboard, sb[i-1].setz(0), rps[j], rps[j+1], true);
				}
			}
			console.log("quad",i,j, rps[j]);
			makequad(soundboard, sb[i-1].setz(0), sb[i].setz(0), rps[j], rps[j+1], true);
			prevj = j; */
		} else { // Outside rosette area, make a normal quad
			mirrorface(soundboard, sb[i-1].setz(0), sb[i].setz(0));
		}
		
		// console.log(new THREE.Vector3(-sb[i-1].x,sb[i-1].y,sb[i-1].z));
	}

	meshbody.add(new THREE.Mesh( soundboard.g, sbmaterial ));
}	
function ribs_3D (meshbody, lute3d, sb, cps){
	// TODO: Lute ribs start wrong
	// TODO: Orpharion with concave ribs renders wrong at inside corner
	try {
	if (lute3d.ribpaths.threedee_valleys && lute3d.ribpaths.threedee_valleys.length>0){
		var r = lute3d.ribpaths.threedee_valleys; // Array of 3d points. Begin from leftmost rib.
	} else {
		var r = lute3d.ribpaths.threedee; // Array of 3d points. Begin from leftmost rib.
	}
	// console.log("Rendering ribs, r:" ,r);
	// console.log("Rendering ribs, sb:" ,sb);
	if (editorstate.bodyshapefrom=="guitar"){
		// On guitars, the very last rib is special
		var rlen = r.length;//+1; 
	} else {
		var rlen = r.length;
	}
	// console.log("rlen=",rlen);
	for (var i=0; i<rlen; i++){
		// var geometry_d = {g:new THREE.Geometry(), vcounter:0}; // red for debugging
		var geometry = {g:new THREE.Geometry(), vcounter:0};
		var geometry_l = {g:new THREE.Geometry(), vcounter:0};
		var color = 0xffa559;
		var material_d = new THREE.MeshStandardMaterial({ color: 0xff5555, roughness:0.40, metalness:0.40, flatShading:true, wireframe:false });
		var material = new THREE.MeshStandardMaterial({ color: color, roughness:0.40, metalness:0.40, flatShading:true, wireframe:false });
		material_d.side = THREE.DoubleSide;
		material.side = THREE.DoubleSide;
		// Find mesh points
		
		// console.log(i,"has",r[i].length, "points");
		if (i==0){ // Center rib
			for (var j=0; j<r[i].length; j++){
				if (r[i][j]){
					addvector(geometry, -r[i][j].x, r[i][j].y, r[i][j].z);
					addvector(geometry, r[i][j].x, r[i][j].y, r[i][j].z);
					if (j>0){
						geometry.g.faces.push( new THREE.Face3( geometry.vcounter-4, geometry.vcounter-2, geometry.vcounter-3, normal) ); // first triangle
						geometry.g.faces.push( new THREE.Face3(geometry.vcounter-1, geometry.vcounter-3, geometry.vcounter-2, normal) ); // second triangle
					}
				}
			}
			meshbody.add(new THREE.Mesh( geometry.g, material ));
			// i = rib, j = point in rib
		} else {
			// New method 2
			var left = r[i-1]; // use as is
			var right = r[i]; // Add missing points from sb to temp right
			var lstarts = []; // Find segment starts, store index
			var lends = []; // Find segment ends (gap starts)
			for (var j=0; j < left.length; j++){
				if (left[j] && !left[j-1]) {
					lstarts.push(j);
				} else if (left[j] && !left[j+1]){
					lends.push(j);
				}
			} // Same for right array
			var rstarts = []; // Find segment starts
			var rends = []; // Find segment ends (gap starts)
			for (var j=0; j < right.length; j++){
				if (!right[j-1] && right[j]) {
					rstarts.push(j);
				} else if (right[j] && !right[j+1]){
					rends.push(j);
				}
			}
			// rends.push(right.length-1);
			// console.log("Rib",i,"L:",lstarts,lends,"R:",rstarts,rends);
			// Find valid sb points
			var sblist = [];
			for (var s=0; s < sb.length; s++){
				// if between one of the segments of the left array
				// if also outside of one of the segments in right
				var inleft = false;
				var inright = true;
				for (var k=0; k < lstarts.length; k++){
					if (left[lstarts[k]].y < sb[s].y && left[lends[k]].y > sb[s].y ) inleft = true;
				}
				for (var k=0; k < rstarts.length; k++){
					// console.log("R:",k,rstarts[k]);
					if (right[rstarts[k]].y < sb[s].y && right[rends[k]].y > sb[s].y) inright = false;
				}
				// --> put this sb point in list
				if (inleft && inright){
					sblist.push(sb[s]);
				}
			}
			// console.log("sblist",sblist);
			// Organize points by y coordinate
			var tempright = right.concat(sblist);
			tempright = tempright.filter(function(value,index,arr){
				return value != null; // remove null values for sorting
			});
			tempright.sort(function(a,b){
				return a.y - b.y;
			});
			
			// console.log("tempright",tempright);
			// Draw triangles
			var rj = 0;
			for (var j=1; j < left.length; j++){
				if (left[j] && left[j-1]){
					// rj++; // Always advance at least by one on the right
					var minj = rj; // smallest rj to use
					while (minj < tempright.length && tempright[minj].y < left[j-1].y){
						minj++; 
						// Find first right point above left-1
					}
					if (tempright[minj].y > left[j-1].y) minj--;
					var maxj = minj+1; // Largest rj to use
					while (tempright[maxj+1] && maxj < tempright.length && tempright[maxj].y < left[j].y){
						 maxj++; 
						// Find first right point above left-1
					}
					rj = minj+1;
					
					if (tempright[minj]){ // Basic triangle that should usually work
						if (tempright[minj].y >= left[j-1].y){
							makeface(geometry, geometry_l, left[j], tempright[minj], left[j-1]);
						} else if (tempright[maxj] && tempright[rj]){
							// Before upper bout of guitars, would create strings betweenbouts otherwise
							makeface(geometry, geometry_l, tempright[maxj], left[j-1], left[j]);
						}
						
					} else if (tempright[maxj]){ // Flipped first triangle when no right point
						makeface(geometry, geometry_l, left[j], tempright[maxj], left[j-1]);
					}
					
					if (tempright[minj] && tempright[maxj] && tempright[minj].y >= left[j-1].y && tempright[maxj].y <= left[j].y){ // Second basic triangle
						makeface(geometry, geometry_l, left[j], tempright[minj], tempright[maxj]);
					}
					
					if (tempright[minj] && tempright[maxj] && tempright[rj]){ // remining points
						makeface(geometry, geometry_l, tempright[rj], tempright[minj], tempright[maxj]);
					}
				}
			}
		
			meshbody.add(new THREE.Mesh( geometry.g, material ));
			// meshbody.add(new THREE.Mesh( geometry_d.g, material_d )); // Red for debugging
			meshbody.add(new THREE.Mesh( geometry_l.g, material ));
			
		} 
	}
	
	} catch(e) {console.log(e);}
}
function draw_rosette_3D(meshbody, color, model, cps){} // TODO:
function draw_frets_3D(meshbody, fretpoints, color){
	var fretmaterial = new THREE.LineBasicMaterial({ color: color, linewidth:2 });
	var frets = new THREE.Geometry();
	vcounter=0;
	for (fret of fretpoints){
		var geometry = new THREE.Geometry();
		geometry.vertices.push(new THREE.Vector3(-fret[0].x, -fret[0].y, -0.5));
		geometry.vertices.push(new THREE.Vector3(-fret[1].x, -fret[1].y, -0.5));
		var line = new THREE.Line(geometry, fretmaterial);
		meshbody.add(line);
	}
}
///////////////////////////////////////////////////////////////////////////////
// Face makers
///////////////////////////////////////////////////////////////////////////////

// input g = {g:THREE.Geometry(), vcounter:1} vcounter must be inside an object so that it can be incremented "by reference"
function addvector (g,x,y,z,l) { // g=geometry object, always make new vcounter per g
	g.g.vertices.push(new THREE.Vector3(x,y,z));
	if (!l) g.vcounter++;
}
function mirrorface (g, p1, p2){
	g.g.vertices.push(new THREE.Vector3(-p1.x,p1.y,p1.z));
	g.g.vertices.push(new THREE.Vector3(p1.x,p1.y,p1.z));
	g.g.vertices.push(new THREE.Vector3(-p2.x,p2.y,p2.z));
	g.g.vertices.push(new THREE.Vector3(p2.x,p2.y,p2.z));
	g.vcounter+=4;
	g.g.faces.push( new THREE.Face3( g.vcounter-4, g.vcounter-3, g.vcounter-2, normal) );
	g.g.faces.push( new THREE.Face3( g.vcounter-3, g.vcounter-1, g.vcounter-2, normal) );
	
}
function maketriangle (g, p1, p2, p3, mirror){
	g.vcounter+=3;
	
	g.g.vertices.push(new THREE.Vector3(p1.x,p1.y,p1.z));
	g.g.vertices.push(new THREE.Vector3(p2.x,p2.y,p2.z));
	g.g.vertices.push(new THREE.Vector3(p3.x,p3.y,p3.z));
	
	g.g.faces.push( new THREE.Face3( g.vcounter-3, g.vcounter-2, g.vcounter-1, normal) );
	if (mirror){
		g.vcounter+=3;
		g.g.vertices.push(new THREE.Vector3(-p1.x,p1.y,p1.z));
		g.g.vertices.push(new THREE.Vector3(-p2.x,p2.y,p2.z));
		g.g.vertices.push(new THREE.Vector3(-p3.x,p3.y,p3.z));
		g.g.faces.push( new THREE.Face3( g.vcounter-3, g.vcounter-1, g.vcounter-2, normal) );
	}
}
function makequad (g, p1, p2, p3, p4, mirror){
	g.vcounter+=4;
	
	g.g.vertices.push(new THREE.Vector3(p1.x,p1.y,p1.z));
	g.g.vertices.push(new THREE.Vector3(p2.x,p2.y,p2.z));
	g.g.vertices.push(new THREE.Vector3(p3.x,p3.y,p3.z));
	g.g.vertices.push(new THREE.Vector3(p4.x,p4.y,p4.z));
	
	g.g.faces.push( new THREE.Face3( g.vcounter-4, g.vcounter-3, g.vcounter-2, normal) );
	g.g.faces.push( new THREE.Face3( g.vcounter-2, g.vcounter-3, g.vcounter-1, normal) );
	if (mirror){
		g.vcounter+=4;
		g.g.vertices.push(new THREE.Vector3(-p1.x,p1.y,p1.z));
		g.g.vertices.push(new THREE.Vector3(-p2.x,p2.y,p2.z));
		g.g.vertices.push(new THREE.Vector3(-p3.x,p3.y,p3.z));
		g.g.vertices.push(new THREE.Vector3(-p4.x,p4.y,p4.z));
		
		g.g.faces.push( new THREE.Face3( g.vcounter-4, g.vcounter-3, g.vcounter-2, normal) );
		g.g.faces.push( new THREE.Face3( g.vcounter-2, g.vcounter-3, g.vcounter-1, normal) );
	}
}
function makeface (g,gl, p1, p2, p3){ // Always mirrors
	g.vcounter+=3;
	
	g.g.vertices.push(new THREE.Vector3(p1.x,p1.y,p1.z));
	g.g.vertices.push(new THREE.Vector3(p2.x,p2.y,p2.z));
	g.g.vertices.push(new THREE.Vector3(p3.x,p3.y,p3.z));
	
	g.g.faces.push( new THREE.Face3( g.vcounter-3, g.vcounter-2, g.vcounter-1, normal) );
	
	gl.g.vertices.push(new THREE.Vector3(-p1.x,p1.y,p1.z));
	gl.g.vertices.push(new THREE.Vector3(-p2.x,p2.y,p2.z));
	gl.g.vertices.push(new THREE.Vector3(-p3.x,p3.y,p3.z));
	
	gl.g.faces.push( new THREE.Face3( g.vcounter-3, g.vcounter-2, g.vcounter-1, normal) );
}










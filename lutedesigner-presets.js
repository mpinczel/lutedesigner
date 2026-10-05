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
// This file contains baked presets for entire instruments and methods for creating them

function select_instrument(el){ // load new instrument preset
	
	var originalstate = copyobj(editorstate);
	// empty current editorstate completely
	Object.keys(editorstate).forEach(function(key) { delete editorstate[key]; });
	
	// editorstate = instrumentpresets[el.value]; // Get preset editorstate. This allows the original to be modified, copy each value instead
	// Copy over data from instrument preset to editorstate
	var fields = Object.getOwnPropertyNames(instrumentpresets[el.value]);
	for (var i=0; i<fields.length; i++){
		editorstate[fields[i]] = instrumentpresets[el.value][fields[i]];
	}
	// editorstate.drawingpurpose = "technical"; // Hack to force technical drawing mode always
	// Store changes in undolist for undo/redo functionality
	var statedif = objdif(originalstate, editorstate);
	// console.log("Difference ", statedif);
	// undolist.push([el.id, editorstate[el.id]]);
	undolist.push(statedif);
	
	backup(); // Make hash with editorstate data
	populateeditor(); // This fills the editor with data from editorstate
	makedrawing("select_instrument");
}


// TODO: Check which ones you have an actual drawing for and which ones are guesses


var bodypresets = { // TODO: Perhaps put these in a text field in body.svg in named groups like "venere-data"
	// TODO: "name": [ribs,bulge,ribspread, bodyscale, ribspacingstyle],
	// TODO: Add missing; mandolino, medieval,.. and guitars
	// TODO: Add lastribadd
	"GiorgioSellas1626": [43, 2.2, 1],
	"Schelle": [11, 2.3, 0.6],
	"Buchenberg1614": [41, 2.2, 1],
	"MagnoGraill1627": [31, 2.2, 1],
	"Kaiser1609": [27, 2.2, 1],
	"Hartung1599": [35, 2.1, 1],
	"Harz": [15, 2.3, 0.6],
	"Hoffmann": [11, 2.3, 1],	// Fix this one
	"Dieffopruchar1612": [37, 2.15, 1],
	"Frei": [11, 2.25, 0.6],
	"Mahler": [9, 2.3, 0.6],
	"venere": [25, 2.2, 1],
	"gerle": [11, 2.3, 0.6],
	"niskanen": [17, 2.25, 1],
	"railich": [15, 2.3, 1],
	"sellas": [15, 2.3, 1],
	"Hartung1602": [35, 2.15, 0.65],
	"jauck1746": [11, 2.3, 1]
}; // TODO: only the path d information is needed, so bake a dictionary
// var bodylist = {"nameoflute": {"side":"M0,0 C 3,5 3,4 3,5", "middle",...}, ...};


// String spacings
/* var ids = ["distcoursesbridge", "diststringsbridge", 	
		"distchanterellesbridge", "distbasscoursesbridge", 
	
		"distcoursesnut", "distchanterellesnut", "diststringsnut", "distbasscoursesshortnut",	 "distbasscoursesnut"  ]; */
var spacingpresets = {
		"renaissance": [9.9, 5, 10.5, 9.9,   6.4, 8.1, 2.5, 3.6,    5],
		"baroque11c": [8.5, 5, 10, 9.9,    6, 7.5, 2.5, 3.6,    5],
		"baroque13c": [7.8, 5, 10, 9.9,    6, 7.5, 2.5, 3.6,    4],
		"theorbosingle": [12, 5, 12, 10.2,    8, 8, 2.5, 7,     5],
		"archlute": [7.8, 5, 8.5, 10.2,    6.4, 8.1, 1.8, 3.6,    5],
		"guitar": [9, 5, 11, 9,    6.7, 6.5, 2, 6.7, 5],
		"mandolino": [6.7, 3.7, 7.4, 6.7,    4.8, 6, 2.4, 3.6, 4]};

function makepreset(){
	// create an instrument preset
	// Remove unnecessary data; bassnuts that are not used in this instrument

	for (var i=1; i <= 10; i++){ 
		if (i >= editorstate.numbernuts ){
			delete(editorstate["courses_" + i] );
			delete(editorstate["mensur_" + i] );
			delete(editorstate["nutunit_" + i] );
			delete(editorstate["singles_" + i] );
		}
	}
	delete(editorstate.drawingpurpose );
	delete(editorstate.pagetitle );
	// console.log(download_editorstate(false, " "));
	return download_editorstate(false, " ")
}

function handle_pegbox_change(pegb){
	// Called by settingchange() when pegboxstyle is changed. This makes sure that there are bass nuts defined when instrument is drawn.
	console.log(pegb,pegb.startsWith("theorbo"));
	if (pegb=="englishtheorbo"){
		// Make sure there is at least one bassnut
		if (editorstate.numbernuts < 2){
			alter_editorstate ("numbernuts", 2, false);
			makenutselectors();
			alter_editorstate ("mensur_1", 3, false);
			alter_editorstate ("nutunit_1", "frets", false);
			alter_editorstate ("courses_1", 1, false);
			alter_editorstate ("singles_1", false, false);
		}
		
	}if (pegb.startsWith("theorbo")){
		alter_editorstate ("numbernuts", 2, false);
		makenutselectors();
		if ( editorstate.mensur_1 === undefined || editorstate.mensur_1 < editorstate.mensur*1.5){
			alter_editorstate ("mensur_1", editorstate.mensur*2, false);
		}
		
		alter_editorstate ("nutunit_1", "mm", false);
		alter_editorstate ("courses_1", 7, false);
		alter_editorstate ("singles_1", true, false);
	} else if (pegb=="doublehead"){
		alter_editorstate ("numbernuts", 5, false);
		makenutselectors();
		for (var i=1; i<5; i++){
		alter_editorstate ("mensur_"+i, editorstate.mensur+(64*i), false);
		alter_editorstate ("nutunit_"+i, "mm", false);
		alter_editorstate ("courses_"+i, 1, false);
		alter_editorstate ("singles_"+i, false, false);
		}
	} else if (pegb=="bassrider"){
		alter_editorstate ("numbernuts", 2, false);
		makenutselectors();
		alter_editorstate ("mensur_1", editorstate.mensur+64, false);
		alter_editorstate ("nutunit_1", "mm", false);
		alter_editorstate ("courses_1", 2, false);
		alter_editorstate ("singles_1", false, false);
	} else if (pegb=="bassriderEdlinger"){
		alter_editorstate ("numbernuts", 2, false);
		makenutselectors();
		alter_editorstate ("mensur_1", editorstate.mensur+57, false);
		alter_editorstate ("nutunit_1", "mm", false);
		alter_editorstate ("courses_1", 2, false);
		alter_editorstate ("singles_1", false, false);
	} else if (pegb=="hoffmann1740"){
		alter_editorstate ("numbernuts", 2, false);
		makenutselectors();
		alter_editorstate ("mensur_1", editorstate.mensur+255, false);
		alter_editorstate ("nutunit_1", "mm", false);
		alter_editorstate ("courses_1", 5, false);
		alter_editorstate ("singles_1", false, false);
	} else if (pegb=="Rauche"){
		alter_editorstate ("numbernuts", 2, false);
		makenutselectors();
		alter_editorstate ("mensur_1", editorstate.mensur+277, false);
		alter_editorstate ("nutunit_1", "mm", false);
		alter_editorstate ("courses_1", 5, false);
		alter_editorstate ("singles_1", false, false);
	} else if (pegb=="jauck"){
		alter_editorstate ("numbernuts", 2, false);
		makenutselectors();
		alter_editorstate ("mensur_1", editorstate.mensur+134, false);
		alter_editorstate ("nutunit_1", "mm", false);
		alter_editorstate ("courses_1", 3, false);
		alter_editorstate ("singles_1", false, false);
	} else {
		// Renaissance, colascione, mandolino
		alter_editorstate ("numbernuts", 1, false);
	}
}
// instrument presets contain all data in editorstate

var instrumentpresets = {
"Hoffmann 700mm 13c":{"bodyshapefrom":"fromlist","presetoverlay":false,"bodyshapefromlist":"Hoffmann","numberofribs":11,"bulge":2.3,"divisions":9,"ribspread":1,"rosettelist":"single","rosettescale":100,"mensur":700,"fingerboardcourses":11,"chanterelles":2,"singlestrings":false,"hasdiapasons":true,"mensur_1":760,"courses_1":2,"singles_1":false,"fretsonneck":8.4,"fingerboardstyle":"fangs","neckwidthlimit":105,"neckadd":-2,"pegboxstyle":"bassrider","foldable":false,"bridgestyle":"baroque","bridgeoffset":15,"distcoursesbridge":8.5,"diststringsbridge":5,"distchanterellesbridge":10,"distbasscoursesbridge":9.9,"distcoursesnut":6,"distchanterellesnut":7.5,"diststringsnut":2.5,"distbasscoursesshortnut":3.6,"distbasscoursesnut":5,"bodyscale":1,"ribspacing":"above","numbernuts":2},

"niskanen 109% 890mm theorbo":{"bodyshapefrom":"fromlist","presetoverlay":false,"bodyshapefromlist":"niskanen","numberofribs":31,"bulge":2.4,"divisions":9,"ribspread":1,"rosettelist":"triple","rosettescale":100,"mensur":890,"fingerboardcourses":7,"chanterelles":1,"singlestrings":true,"hasdiapasons":true,"mensur_1":1740,"courses_1":7,"singles_1":true,"fretsonneck":8.4,"fingerboardstyle":"fangs","neckwidthlimit":96,"neckadd":21,"pegboxstyle":"theorbo","foldable":true,"bridgestyle":"horse","bridgeoffset":8,"distcoursesbridge":12,"diststringsbridge":5,"distchanterellesbridge":12,"distbasscoursesbridge":10.2,"distcoursesnut":8,"distchanterellesnut":8,"diststringsnut":2.5,"distbasscoursesshortnut":7,"distbasscoursesnut":5,"ribspacing":"theorbo","bodyscale":1.09,"numbernuts":2},

"Hartung1599 845mm doublestrung theorbo":{"bodyshapefrom":"fromlist","presetoverlay":false,"bodyshapefromlist":"Hartung1599","numberofribs":17,"bulge":2.2,"divisions":9,"ribspread":1,"rosettelist":"triple","rosettescale":100,"mensur":845,"fingerboardcourses":6,"chanterelles":1,"singlestrings":false,"hasdiapasons":true,"mensur_1":1637,"courses_1":8,"singles_1":true,"fretsonneck":8.4,"fingerboardstyle":"fangs","neckwidthlimit":96,"neckadd":38,"pegboxstyle":"theorbo","foldable":true,"bridgestyle":"horse","bridgeoffset":8,"distcoursesbridge":7.8,"diststringsbridge":5,"distchanterellesbridge":8.5,"distbasscoursesbridge":10.2,"distcoursesnut":6.4,"distchanterellesnut":8.1,"diststringsnut":1.8,"distbasscoursesshortnut":3.6,"distbasscoursesnut":5,"bodyscale":1,"ribspacing":"theorbo","numbernuts":2,"drawallstrings":true,"limitorset":"limit"},

"Buchenberg1614 850mm 1740mm theorbo":{"bodyshapefrom":"fromlist","presetoverlay":false,"bodyshapefromlist":"Buchenberg1614","numberofribs":17,"bulge":2.2,"divisions":9,"ribspread":1,"rosettelist":"triple","rosettescale":100,"mensur":850,"fingerboardcourses":7,"chanterelles":1,"singlestrings":true,"hasdiapasons":true,"mensur_1":1740,"courses_1":7,"singles_1":true,"fretsonneck":8.4,"fingerboardstyle":"fangs","neckwidthlimit":100,"neckadd":22,"pegboxstyle":"theorbo","foldable":true,"bridgestyle":"horse","bridgeoffset":8,"distcoursesbridge":12,"diststringsbridge":5,"distchanterellesbridge":12,"distbasscoursesbridge":10.2,"distcoursesnut":8,"distchanterellesnut":8,"diststringsnut":2.5,"distbasscoursesshortnut":7,"distbasscoursesnut":5,"bodyscale":1.0,"numbernuts":2,"ribspacing":"evenclasp"},

"Schelle 850mm Dmin theorbo":{"bodyshapefrom":"fromlist","presetoverlay":false,"bodyshapefromlist":"Schelle","numberofribs":11,"bulge":2.3,"divisions":9,"ribspread":0.6,"rosettelist":"single","rosettescale":100,"mensur":850,"fingerboardcourses":7,"chanterelles":1,"singlestrings":false,"hasdiapasons":true,"mensur_1":1650,"courses_1":7,"singles_1":true,"fretsonneck":8.4,"fingerboardstyle":"fangs","neckwidthlimit":100,"neckadd":21,"pegboxstyle":"theorbo","foldable":true,"bridgestyle":"schelle","bridgeoffset":24,"distcoursesbridge":7.8,"diststringsbridge":5,"distchanterellesbridge":8.5,"distbasscoursesbridge":10.2,"distcoursesnut":6.4,"distchanterellesnut":8.1,"diststringsnut":1.8,"distbasscoursesshortnut":3.6,"distbasscoursesnut":5,"bodyscale":1.0,"numbernuts":2,"ribspacing":"evenclasp"},

"Schelle 875mm Theorbo":{"bodyshapefrom":"fromlist","presetoverlay":false,"bodyshapefromlist":"Schelle","numberofribs":11,"bulge":2.3,"divisions":9,"ribspread":0.6,"rosettelist":"single","rosettescale":100,"mensur":875,"fingerboardcourses":7,"chanterelles":1,"singlestrings":true,"hasdiapasons":true,"mensur_1":1700,"courses_1":7,"singles_1":true,"fretsonneck":8.4,"fingerboardstyle":"fangs","neckwidthlimit":100,"neckadd":21,"pegboxstyle":"theorbo","foldable":true,"bridgestyle":"schelle","bridgeoffset":8,"distcoursesbridge":12,"diststringsbridge":5,"distchanterellesbridge":12,"distbasscoursesbridge":10.2,"distcoursesnut":8,"distchanterellesnut":8,"diststringsnut":2.5,"distbasscoursesshortnut":7,"distbasscoursesnut":5,"bodyscale":1.0,"numbernuts":2,"ribspacing":"evenclasp"},

"Harz 675mm Archlute":{"bodyshapefrom":"fromlist","presetoverlay":false,"bodyshapefromlist":"Harz","numberofribs":15,"bulge":2.3,"divisions":9,"ribspread":0.6,"rosettelist":"triple","rosettescale":100,"mensur":675,"fingerboardcourses":7,"chanterelles":1,"singlestrings":false,"hasdiapasons":true,"mensur_1":1400,"courses_1":7,"singles_1":true,"fretsonneck":8.4,"fingerboardstyle":"fangs","neckwidthlimit":100,"neckadd":19,"pegboxstyle":"theorbo","foldable":true,"bridgestyle":"horse","bridgeoffset":8,"distcoursesbridge":7.8,"diststringsbridge":5,"distchanterellesbridge":8.5,"distbasscoursesbridge":10.2,"distcoursesnut":6.4,"distchanterellesnut":8.1,"diststringsnut":1.8,"distbasscoursesshortnut":3.6,"distbasscoursesnut":5,"bodyscale":1.0,"numbernuts":2,"ribspacing":"evenclasp"},

"Harz 750mm theorbo":{"bodyshapefrom":"fromlist","presetoverlay":false,"bodyshapefromlist":"Harz","numberofribs":15,"bulge":2.3,"divisions":9,"ribspread":0.6,"rosettelist":"triple","rosettescale":100,"mensur":750,"fingerboardcourses":7,"chanterelles":1,"singlestrings":true,"hasdiapasons":true,"mensur_1":1500,"courses_1":7,"singles_1":true,"fretsonneck":8.4,"fingerboardstyle":"fangs","neckwidthlimit":100,"neckadd":20,"pegboxstyle":"theorbo","foldable":true,"bridgestyle":"horse","bridgeoffset":8,"distcoursesbridge":12,"diststringsbridge":5,"distchanterellesbridge":12,"distbasscoursesbridge":10.2,"distcoursesnut":8,"distchanterellesnut":8,"diststringsnut":2.5,"distbasscoursesshortnut":7,"distbasscoursesnut":5,"bodyscale":1.0,"numbernuts":2,"ribspacing":"evenclasp"},

"Dieffopruchar1600c 760mm 13c":{"bodyshapefrom":"fromlist","presetoverlay":false,"bodyshapefromlist":"Dieffopruchar1600c","numberofribs":11,"bulge":2.25,"divisions":9,"ribspread":1,"rosettelist":"single","rosettescale":100,"mensur":760,"fingerboardcourses":11,"chanterelles":2,"singlestrings":false,"hasdiapasons":true,"mensur_1":817,"courses_1":2,"singles_1":false,"fretsonneck":8.4,"fingerboardstyle":"fangs","neckwidthlimit":107,"neckadd":-1,"pegboxstyle":"bassriderEdlinger","foldable":false,"bridgestyle":"baroque","bridgeoffset":20,"distcoursesbridge":7.8,"diststringsbridge":5,"distchanterellesbridge":10,"distbasscoursesbridge":9.9,"distcoursesnut":6,"distchanterellesnut":7.5,"diststringsnut":2.5,"distbasscoursesshortnut":3.6,"distbasscoursesnut":4,"bodyscale":1,"ribspacing":"evenclasp","numbernuts":2,"materialth":13,"guitarfromlist":"Dias1581","guitardepth":87,"guitarangle":2.41,"guitarroundl":7.1,"guitarroundw":0,"guitartaper":5.5,"guitarconcavity":0,"constructionwidth":4,"constructionlength":6.5,"constructionmensur":600,"constructionbottom":6,"constructionside":6,"constructionsmall":1.333333,"constructionshoulder":0,"constructionshoulderlength":0,"constructionwedge":0,"constructiondepthratio":0.89,"constructionshapeshift":0,"usesideasmiddle":false,"lastribadd":2,"limitorset":"set","nutangle":0,"drawallstrings":true,"bridgeangle":0,"nutunit_1":"mm"},

"Hoffmann 700mm 11c":{"bodyshapefrom":"fromlist","presetoverlay":false,"bodyshapefromlist":"Hoffmann","numberofribs":11,"bulge":2.3,"divisions":9,"ribspread":1,"rosettelist":"single","ribspacing":"above","rosettescale":100,"mensur":700,"fingerboardcourses":11,"chanterelles":2,"singlestrings":false,"hasdiapasons":false,"mensur_1":1500,"courses_1":7,"singles_1":false,"fretsonneck":8.4,"fingerboardstyle":"fangs","neckwidthlimit":99,"neckadd":-6,"pegboxstyle":"chanterelle","foldable":false,"bridgestyle":"sbend","bridgeoffset":8,"distcoursesbridge":8.5,"diststringsbridge":5,"distchanterellesbridge":10,"distbasscoursesbridge":9.9,"distcoursesnut":6,"distchanterellesnut":7.5,"diststringsnut":2.5,"distbasscoursesshortnut":3.6,"distbasscoursesnut":5,"bodyscale":1.0,"numbernuts":1,"ribspacing":"above"},

"Dieffopruchar1612 670mm 10c":{"bodyshapefrom":"fromlist","presetoverlay":false,"bodyshapefromlist":"Dieffopruchar1612","numberofribs":37,"bulge":2.15,"divisions":9,"ribspread":1,"rosettelist":"single","rosettescale":100,"mensur":670,"fingerboardcourses":10,"chanterelles":1,"singlestrings":false,"hasdiapasons":false,"mensur_1":1500,"courses_1":7,"singles_1":false,"fretsonneck":8.4,"fingerboardstyle":"fangs","neckwidthlimit":93,"neckadd":-6,"pegboxstyle":"chanterelle","foldable":false,"bridgestyle":"sbend","bridgeoffset":8,"distcoursesbridge":8.5,"diststringsbridge":5,"distchanterellesbridge":10,"distbasscoursesbridge":9.9,"distcoursesnut":6,"distchanterellesnut":7.5,"diststringsnut":2.5,"distbasscoursesshortnut":3.6,"distbasscoursesnut":5,"bodyscale":1.0,"numbernuts":1,"ribspacing":"evenclasp"},

"Frei 630mm 10c":{"bodyshapefrom":"fromlist","presetoverlay":false,"bodyshapefromlist":"Frei","numberofribs":11,"bulge":2.2,"divisions":9,"ribspread":0.6,"rosettelist":"single","rosettescale":100,"mensur":630,"fingerboardcourses":10,"chanterelles":1,"singlestrings":false,"hasdiapasons":false,"fretsonneck":8.4,"fingerboardstyle":"fangs","neckwidthlimit":100,"neckadd":0,"pegboxstyle":"renaissance","foldable":false,"bridgestyle":"sbend","bridgeoffset":8,"distcoursesbridge":9.9,"diststringsbridge":5,"distchanterellesbridge":10.5,"distbasscoursesbridge":9.9,"distcoursesnut":6.4,"distchanterellesnut":8.1,"diststringsnut":2.5,"distbasscoursesshortnut":3.6,"distbasscoursesnut":5,"bodyscale":1,"ribspacing":"evenclasp","numbernuts":1,"drawallstrings":false,"limitorset":"limit"},

"Mahler 670mm 11c":{"bodyshapefrom":"fromlist","presetoverlay":false,"bodyshapefromlist":"Mahler","numberofribs":9,"bulge":2.3,"divisions":9,"ribspread":0.6,"rosettelist":"single","rosettescale":100,"mensur":670,"fingerboardcourses":11,"chanterelles":2,"singlestrings":false,"hasdiapasons":false,"mensur_1":1500,"courses_1":7,"singles_1":false,"fretsonneck":8.4,"fingerboardstyle":"fangs","neckwidthlimit":99,"neckadd":-6,"pegboxstyle":"chanterelle","foldable":false,"bridgestyle":"sbend","bridgeoffset":8,"distcoursesbridge":8.5,"diststringsbridge":5,"distchanterellesbridge":10,"distbasscoursesbridge":9.9,"distcoursesnut":6,"distchanterellesnut":7.5,"diststringsnut":2.5,"distbasscoursesshortnut":3.6,"distbasscoursesnut":5,"bodyscale":1.0,"numbernuts":1,"ribspacing":"evenclasp"},

"railich 615mm 11c":{"bodyshapefrom":"fromlist","presetoverlay":false,"bodyshapefromlist":"railich","numberofribs":15,"bulge":2.3,"divisions":9,"ribspread":1,"rosettelist":"single","rosettescale":100,"mensur":615,"fingerboardcourses":11,"chanterelles":2,"singlestrings":false,"hasdiapasons":false,"mensur_1":1500,"courses_1":7,"singles_1":false,"fretsonneck":8.4,"fingerboardstyle":"fangs","neckwidthlimit":102,"neckadd":-6,"pegboxstyle":"chanterelle","foldable":false,"bridgestyle":"schelle","bridgeoffset":10,"distcoursesbridge":8.5,"diststringsbridge":5,"distchanterellesbridge":10,"distbasscoursesbridge":9.9,"distcoursesnut":6,"distchanterellesnut":7.5,"diststringsnut":2.5,"distbasscoursesshortnut":3.6,"distbasscoursesnut":5,"bodyscale":1.0,"numbernuts":1,"ribspacing":"evenclasp"},

"gerle 600mm 6c":{"bodyshapefrom":"fromlist","presetoverlay":false,"bodyshapefromlist":"gerle","numberofribs":11,"bulge":2.3,"divisions":9,"ribspread":0.6,"rosettelist":"single","rosettescale":100,"mensur":600,"fingerboardcourses":6,"chanterelles":1,"singlestrings":false,"hasdiapasons":false,"mensur_1":1700,"courses_1":7,"singles_1":false,"fretsonneck":8.4,"fingerboardstyle":"fangs","neckwidthlimit":100,"neckadd":0,"pegboxstyle":"renaissance","foldable":false,"bridgestyle":"ball","bridgeoffset":8,"distcoursesbridge":9.9,"diststringsbridge":5,"distchanterellesbridge":10.5,"distbasscoursesbridge":9.9,"distcoursesnut":6.4,"distchanterellesnut":8.1,"diststringsnut":2.5,"distbasscoursesshortnut":3.6,"distbasscoursesnut":5,"bodyscale":1.0,"numbernuts":1,"ribspacing":"evenclasp"},

"venere 585mm 7c":{"bodyshapefrom":"fromlist","presetoverlay":false,"bodyshapefromlist":"venere","numberofribs":25,"bulge":2.2,"divisions":9,"ribspread":1,"rosettelist":"single","rosettescale":100,"mensur":585,"fingerboardcourses":7,"chanterelles":1,"singlestrings":false,"hasdiapasons":false,"mensur_1":1700,"courses_1":7,"singles_1":true,"fretsonneck":8.4,"fingerboardstyle":"fangs","neckwidthlimit":100,"neckadd":0,"pegboxstyle":"renaissance","foldable":false,"bridgestyle":"renaissance","bridgeoffset":8,"distcoursesbridge":9.9,"diststringsbridge":5,"distchanterellesbridge":10.5,"distbasscoursesbridge":9.9,"distcoursesnut":6.4,"distchanterellesnut":8.1,"diststringsnut":2.5,"distbasscoursesshortnut":3.6,"distbasscoursesnut":5,"bodyscale":1.0,"numbernuts":1,"ribspacing":"evenclasp"},


"Frei 630mm 6c":{"bodyshapefrom":"fromlist","presetoverlay":false,"bodyshapefromlist":"Frei","numberofribs":11,"bulge":2.25,"divisions":9,"ribspread":0.6,"rosettelist":"single","rosettescale":100,"mensur":630,"fingerboardcourses":6,"chanterelles":1,"singlestrings":false,"hasdiapasons":false,"mensur_1":1500,"courses_1":7,"singles_1":false,"fretsonneck":8.4,"fingerboardstyle":"fangs","neckwidthlimit":102,"neckadd":0,"pegboxstyle":"renaissance","foldable":false,"bridgestyle":"renaissance","bridgeoffset":10,"distcoursesbridge":9.9,"diststringsbridge":5,"distchanterellesbridge":10.5,"distbasscoursesbridge":9.9,"distcoursesnut":6.4,"distchanterellesnut":8.1,"diststringsnut":2.5,"distbasscoursesshortnut":3.6,"distbasscoursesnut":5,"bodyscale":1.0,"numbernuts":1,"ribspacing":"evenclasp"},

"Mahler 670mm 6c":{"bodyshapefrom":"fromlist","presetoverlay":false,"bodyshapefromlist":"Mahler","numberofribs":9,"bulge":2.3,"divisions":9,"ribspread":0.6,"rosettelist":"single","rosettescale":100,"mensur":670,"fingerboardcourses":6,"chanterelles":1,"singlestrings":false,"hasdiapasons":false,"mensur_1":1500,"courses_1":7,"singles_1":false,"fretsonneck":8.4,"fingerboardstyle":"fangs","neckwidthlimit":102,"neckadd":0,"pegboxstyle":"renaissance","foldable":false,"bridgestyle":"renaissance","bridgeoffset":10,"distcoursesbridge":9.9,"diststringsbridge":5,"distchanterellesbridge":10.5,"distbasscoursesbridge":9.9,"distcoursesnut":6.4,"distchanterellesnut":8.1,"diststringsnut":2.5,"distbasscoursesshortnut":3.6,"distbasscoursesnut":5,"bodyscale":1.0,"numbernuts":1,"ribspacing":"evenclasp"},

"renstudent 595mm 7c":{"bodyshapefrom":"fromlist","presetoverlay":false,"bodyshapefromlist":"renstudent","numberofribs":9,"bulge":2.3,"divisions":9,"ribspread":0.5,"rosettelist":"single","rosettescale":100,"mensur":595,"fingerboardcourses":7,"chanterelles":1,"singlestrings":false,"hasdiapasons":false,"fretsonneck":8.4,"fingerboardstyle":"flat","neckwidthlimit":76,"neckadd":-1,"pegboxstyle":"renaissance","foldable":false,"bridgestyle":"renaissance","bridgeoffset":8,"distcoursesbridge":9.9,"diststringsbridge":5,"distchanterellesbridge":10.5,"distbasscoursesbridge":9.9,"distcoursesnut":6.4,"distchanterellesnut":8.1,"diststringsnut":2.5,"distbasscoursesshortnut":3.6,"distbasscoursesnut":5,"bodyscale":1,"ribspacing":"even","numbernuts":1,"drawallstrings":false,"limitorset":"limit","constructionmensur":597,"constructionbottom":12,"constructionside":6,"constructionsmall":1.4,"constructionwidth":4,"constructionwedge":0,"constructionlength":6.5,"bodyshapefrom":"fromlist","constructionshoulder":3,"constructionshoulderlength":0.25},

"renaissance_a 540mm 6c":{"bodyshapefrom":"fromlist","presetoverlay":false,"bodyshapefromlist":"renaissance_a","numberofribs":9,"bulge":2.3,"divisions":9,"ribspread":0.5,"rosettelist":"single","rosettescale":100,"mensur":540,"fingerboardcourses":6,"chanterelles":1,"singlestrings":false,"hasdiapasons":false,"fretsonneck":8.4,"fingerboardstyle":"flat","neckwidthlimit":100,"neckadd":0,"pegboxstyle":"renaissance","foldable":false,"bridgestyle":"renaissance","bridgeoffset":8,"distcoursesbridge":9.9,"diststringsbridge":5,"distchanterellesbridge":10.5,"distbasscoursesbridge":9.9,"distcoursesnut":6.4,"distchanterellesnut":8.1,"diststringsnut":2.5,"distbasscoursesshortnut":3.6,"distbasscoursesnut":5,"bodyscale":1,"ribspacing":"even","numbernuts":1,"drawallstrings":false,"limitorset":"limit","constructionmensur":597,"constructionbottom":12,"constructionside":6,"constructionsmall":1.4,"constructionwidth":4,"constructionwedge":0,"constructionlength":6.5,"bodyshapefrom":"fromlist","constructionshoulder":3,"constructionshoulderlength":0.25},

"medieval_e 710mm 5c":{"bodyshapefrom":"fromlist","presetoverlay":false,"bodyshapefromlist":"medieval_e","numberofribs":11,"bulge":2,"divisions":9,"ribspread":"0","rosettelist":"single","rosettescale":100,"mensur":710,"fingerboardcourses":5,"chanterelles":1,"singlestrings":false,"hasdiapasons":false,"fretsonneck":8.4,"fingerboardstyle":"flat","neckwidthlimit":53,"neckadd":0,"pegboxstyle":"renaissance","foldable":false,"bridgestyle":"renaissance","bridgeoffset":1.5,"distcoursesbridge":9.9,"diststringsbridge":5,"distchanterellesbridge":10.5,"distbasscoursesbridge":9.9,"distcoursesnut":6.4,"distchanterellesnut":8.1,"diststringsnut":2.5,"distbasscoursesshortnut":3.6,"distbasscoursesnut":5,"bodyscale":1,"constructionwidth":4,"constructionlength":6.5,"constructionmensur":600,"constructionbottom":6,"constructionside":6,"constructionsmall":1.333333,"constructionshoulder":"0","constructionshoulderlength":"0","constructionwedge":"0","ribspacing":"even","drawallstrings":false,"limitorset":"set","bodyshapefrom":"fromlist","numbernuts":1,"materialth":15,"lastribadd":0},

"mandolino 320mm 2x6":{"bodyshapefrom":"fromlist","presetoverlay":false,"bodyshapefromlist":"mandolino","numberofribs":11,"bulge":2.2,"divisions":9,"ribspread":1,"rosettelist":"single","rosettescale":150,"mensur":320,"fingerboardcourses":6,"chanterelles":0,"singlestrings":false,"hasdiapasons":false,"fretsonneck":8.4,"fingerboardstyle":"longsmallfangs","neckwidthlimit":100,"neckadd":0,"pegboxstyle":"mandolino","foldable":false,"bridgestyle":"monzino","bridgeoffset":12,"distcoursesbridge":6.7,"diststringsbridge":3.7,"distchanterellesbridge":7.4,"distbasscoursesbridge":6.7,"distcoursesnut":4.8,"distchanterellesnut":6,"diststringsnut":2.4,"distbasscoursesshortnut":3.6,"distbasscoursesnut":4,"bodyscale":1,"constructionwidth":4.24,"constructionlength":6.5,"constructionmensur":588,"constructionbottom":10.5,"constructionside":5.98,"constructionsmall":1.35,"constructionshoulder":3.13,"constructionshoulderlength":0.09,"constructionwedge":0,"constructiondepthratio":1,"constructionshapeshift":0,"ribspacing":"even","lastribadd":5,"drawallstrings":false,"limitorset":"limit","bodyshapefrom":"fromlist","materialth":13,"numbernuts":1,"caseth":3.7,"forceflatcase":true},

"Hartung1602 937mm 2x7":{"bodyshapefrom":"fromlist","presetoverlay":false,"bodyshapefromlist":"Hartung1602","numberofribs":35,"bulge":2.15,"divisions":9,"ribspread":0.65,"rosettelist":"single","rosettescale":100,"mensur":937,"fingerboardcourses":7,"chanterelles":0,"singlestrings":false,"hasdiapasons":false,"fretsonneck":8.4,"fingerboardstyle":"fangs","neckwidthlimit":96,"neckadd":0,"pegboxstyle":"renaissance","foldable":false,"bridgestyle":"renaissance","bridgeoffset":8,"distcoursesbridge":12.4,"diststringsbridge":5.6,"distchanterellesbridge":10.5,"distbasscoursesbridge":10.1,"distcoursesnut":6.4,"distchanterellesnut":8.1,"diststringsnut":2.5,"distbasscoursesshortnut":3.6,"distbasscoursesnut":5,"bodyscale":1,"ribspacing":"evenclasp","drawallstrings":true,"numbernuts":1,"limitorset":"limit","constructionmensur":600,"constructionbottom":6,"constructionside":6,"constructionsmall":1.333333,"constructionwidth":4,"constructionwedge":0,"materialth":13,"constructionlength":6.5,"constructionshoulder":0,"constructionshoulderlength":0,"constructiondepthratio":1,"constructionshapeshift":0,"usesideasmiddle":false,"lastribadd":9.5,"bodyshapefrom":"fromlist"},

"Jean Voboam 1687 Guitar":{"bodyshapefrom":"guitar","presetoverlay":false,"bodyshapefromlist":"Harz","numberofribs":5,"bulge":2.3,"divisions":9,"ribspread":0.6,"rosettelist":"single","rosettescale":100,"mensur":665,"fingerboardcourses":5,"chanterelles":1,"singlestrings":false,"hasdiapasons":false,"fretsonneck":8.4,"fingerboardstyle":"longsmallfangs","neckwidthlimit":100,"neckadd":0,"pegboxstyle":"JeanVoboam1687","foldable":false,"bridgestyle":"voboam","bridgeoffset":6,"distcoursesbridge":9,"diststringsbridge":5,"distchanterellesbridge":11,"distbasscoursesbridge":9,"distcoursesnut":6.7,"distchanterellesnut":6.5,"diststringsnut":2,"distbasscoursesshortnut":6.7,"distbasscoursesnut":5,"bodyscale":1,"ribspacing":"evenclasp","numbernuts":1,"drawallstrings":true,"limitorset":"limit","constructionmensur":600,"constructionbottom":6,"constructionside":6,"constructionsmall":1.333333,"constructionwidth":4,"constructionwedge":0,"materialth":15,"caseth":3.7,"casestyle":"flatcase","constructionlength":6.5,"constructionshoulder":0,"constructionshoulderlength":0,"constructiondepthratio":1,"constructionshapeshift":0,"usesideasmiddle":false,"lastribadd":-32.5,"foamth":10,"guitardepth":98,"guitarangle":2.3,"guitarroundl":0,"guitarroundw":0,"guitarscallop":5.7,"guitarfromlist":"JeanVoboam1687","guitartaper":10.5,"guitarconcavity":0},

"Giorgio Sellas 1624 Guitar":{"bodyshapefrom":"guitar","presetoverlay":false,"numberofribs":27,"bulge":2.3,"divisions":9,"ribspread":0.6,"rosettelist":"single","rosettescale":120,"mensur":720,"fingerboardcourses":5,"chanterelles":0,"singlestrings":false,"hasdiapasons":false,"fretsonneck":8.4,"fingerboardstyle":"longsmallfangs","neckwidthlimit":100,"neckadd":0,"pegboxstyle":"GiorgioSellas1624","foldable":false,"bridgestyle":"sellas","bridgeoffset":-39,"distcoursesbridge":7.2,"diststringsbridge":4.4,"distchanterellesbridge":8.5,"distbasscoursesbridge":10.2,"distcoursesnut":6.4,"distchanterellesnut":8.1,"diststringsnut":1.8,"distbasscoursesshortnut":3.6,"distbasscoursesnut":5,"bodyscale":1,"ribspacing":"evenclasp","numbernuts":1,"drawallstrings":true,"limitorset":"limit","constructionmensur":600,"constructionbottom":6,"constructionside":6,"constructionsmall":1.333333,"constructionwidth":4,"constructionwedge":0,"materialth":15,"caseth":3.7,"casestyle":"flatcase","constructionlength":6.5,"constructionshoulder":0,"constructionshoulderlength":0,"constructiondepthratio":1,"constructionshapeshift":0,"usesideasmiddle":false,"lastribadd":0,"foamth":10,"guitardepth":84,"guitarangle":3.2,"guitarroundl":54,"guitarroundw":35,"guitarscallop":5.7,"guitarfromlist":"GiorgioSellas1624","guitarconcavity":0,"guitartaper":0.2},

"Chambure vihuela":{"bodyshapefrom":"guitar","presetoverlay":false,"numberofribs":7,"bulge":2.3,"divisions":9,"ribspread":1,"rosettelist":"single","rosettescale":86,"mensur":646,"fingerboardcourses":6,"chanterelles":1,"singlestrings":false,"hasdiapasons":false,"fretsonneck":8.4,"fingerboardstyle":"longsmallfangs","neckwidthlimit":100,"neckadd":0,"pegboxstyle":"ChambureVihuela","foldable":false,"bridgestyle":"vihuela","bridgeoffset":-28,"distcoursesbridge":8.5,"diststringsbridge":5,"distchanterellesbridge":10,"distbasscoursesbridge":9.9,"distcoursesnut":5.3,"distchanterellesnut":7,"diststringsnut":2.4,"distbasscoursesshortnut":3.6,"distbasscoursesnut":5,"bodyscale":1.02,"ribspacing":"evenclasp","numbernuts":1,"drawallstrings":true,"limitorset":"limit","constructionmensur":600,"constructionbottom":6,"constructionside":6,"constructionsmall":1.333333,"constructionwidth":4,"constructionwedge":0,"materialth":15,"caseth":3.7,"casestyle":"flatcase","constructionlength":6.5,"constructionshoulder":0,"constructionshoulderlength":0,"constructiondepthratio":1,"constructionshapeshift":0,"usesideasmiddle":false,"lastribadd":4,"foamth":10,"guitardepth":97,"guitarangle":4.28,"guitarroundl":25,"guitarroundw":22,"guitarscallop":5.7,"guitarfromlist":"ChambureVihuela","nutangle":5.7,"bridgeangle":0,"guitartaper":5.5,"guitarconcavity":0.3},

"Dias 1581 guitar":{"bodyshapefrom":"guitar","presetoverlay":false,"numberofribs":7,"bulge":2.3,"divisions":9,"ribspread":1,"rosettelist":"single","rosettescale":114,"mensur":553,"fingerboardcourses":5,"chanterelles":1,"singlestrings":false,"hasdiapasons":false,"fretsonneck":8.4,"fingerboardstyle":"longsmallfangs","neckwidthlimit":100,"neckadd":0,"pegboxstyle":"Dias1581","foldable":false,"bridgestyle":"vihuela","bridgeoffset":-8,"distcoursesbridge":8.5,"diststringsbridge":5,"distchanterellesbridge":10,"distbasscoursesbridge":9.9,"distcoursesnut":5.3,"distchanterellesnut":7,"diststringsnut":2.4,"distbasscoursesshortnut":3.6,"distbasscoursesnut":5,"bodyscale":1,"ribspacing":"evenclasp","numbernuts":1,"drawallstrings":true,"limitorset":"limit","constructionmensur":600,"constructionbottom":6,"constructionside":6,"constructionsmall":1.333333,"constructionwidth":4,"constructionwedge":0,"materialth":15,"caseth":3.7,"casestyle":"flatcase","constructionlength":6.5,"constructionshoulder":0,"constructionshoulderlength":0,"constructiondepthratio":1,"constructionshapeshift":0,"usesideasmiddle":false,"lastribadd":4,"foamth":10,"guitardepth":70,"guitarangle":3,"guitarroundl":18,"guitarroundw":17,"guitarscallop":5.7,"guitarfromlist":"Dias1581","nutangle":5.7,"bridgeangle":0,"guitartaper":5.2,"guitarconcavity":0.25},

"Koch1654 625mm Archlute":{"bodyshapefrom":"fromlist","presetoverlay":false,"bodyshapefromlist":"Koch1654","numberofribs":15,"bulge":2.4,"divisions":9,"ribspread":1,"rosettelist":"single","rosettescale":100,"mensur":625,"fingerboardcourses":6,"chanterelles":1,"singlestrings":false,"hasdiapasons":true,"mensur_1":1440,"courses_1":7,"singles_1":true,"fretsonneck":8.4,"fingerboardstyle":"fangs","neckwidthlimit":97,"neckadd":30,"pegboxstyle":"theorboKoch","foldable":false,"bridgestyle":"horse","bridgeoffset":15,"distcoursesbridge":7.8,"diststringsbridge":4,"distchanterellesbridge":8.5,"distbasscoursesbridge":9.7,"distcoursesnut":6.4,"distchanterellesnut":8.1,"diststringsnut":1.8,"distbasscoursesshortnut":3.6,"distbasscoursesnut":5,"bodyscale":1,"numbernuts":2,"ribspacing":"even","materialth":13,"caseth":3.9,"foamth":20,"casestyle":"flatcase","guitarfromlist":"Dias1581","guitardepth":80,"guitarangle":0,"guitarroundl":0,"guitarroundw":0,"guitartaper":0,"guitarconcavity":0,"constructionwidth":4,"constructionlength":6.5,"constructionmensur":600,"constructionbottom":6,"constructionside":6,"constructionsmall":1.333333,"constructionshoulder":0,"constructionshoulderlength":0,"constructionwedge":0,"constructiondepthratio":1,"constructionshapeshift":0,"usesideasmiddle":false,"lastribadd":3,"deepenbody":0,"limitorset":"set","nutangle":0,"drawallstrings":true,"bridgeangle":0,"nutunit_1":"mm"},

"Hartung1599 780mm English Theorbo":{"bodyshapefrom":"fromlist","presetoverlay":false,"bodyshapefromlist":"Hartung1599","numberofribs":35,"bulge":2.1,"divisions":9,"ribspread":1,"rosettelist":"single","rosettescale":100,"mensur":780,"fingerboardcourses":8,"chanterelles":1,"singlestrings":false,"hasdiapasons":true,"mensur_1":5,"courses_1":1,"singles_1":false,"fretsonneck":8.4,"fingerboardstyle":"fangs","neckwidthlimit":110,"neckadd":27,"pegboxstyle":"theorboEnglish","foldable":false,"bridgestyle":"sbend","bridgeoffset":16,"distcoursesbridge":7.8,"diststringsbridge":5,"distchanterellesbridge":8.5,"distbasscoursesbridge":7.8,"distcoursesnut":6.1,"distchanterellesnut":8,"diststringsnut":2,"distbasscoursesshortnut":3.7,"distbasscoursesnut":5,"bodyscale":1,"numbernuts":6,"ribspacing":"even","materialth":13,"caseth":3.9,"foamth":20,"casestyle":"flatcase","guitarfromlist":"Dias1581","guitardepth":80,"guitarangle":0,"guitarroundl":0,"guitarroundw":0,"guitartaper":0,"guitarconcavity":0,"constructionwidth":4,"constructionlength":6.5,"constructionmensur":600,"constructionbottom":6,"constructionside":6,"constructionsmall":1.333333,"constructionshoulder":0,"constructionshoulderlength":0,"constructionwedge":0,"constructiondepthratio":1,"constructionshapeshift":0,"usesideasmiddle":false,"lastribadd":3,"deepenbody":0,"limitorset":"set","nutangle":0,"drawallstrings":true,"bridgeangle":0,"nutunit_1":"frets","mensur_2":6,"nutunit_2":"frets","courses_2":1,"singles_2":false,"mensur_3":7,"nutunit_3":"frets","courses_3":1,"singles_3":false,"mensur_4":8,"nutunit_4":"frets","courses_4":1,"singles_4":false,"mensur_5":1350,"nutunit_5":"mm","courses_5":2,"singles_5":false},

"Railich 585mm 12c Doublehead":{"bodyshapefrom":"fromlist","presetoverlay":false,"bodyshapefromlist":"railich","numberofribs":15,"bulge":2.3,"divisions":9,"ribspread":1,"rosettelist":"single","rosettescale":100,"mensur":585,"fingerboardcourses":8,"chanterelles":1,"singlestrings":false,"hasdiapasons":false,"mensur_1":1,"courses_1":1,"singles_1":false,"fretsonneck":8.4,"fingerboardstyle":"fangs","neckwidthlimit":100,"neckadd":13,"pegboxstyle":"doublehead","foldable":false,"bridgestyle":"baroque","bridgeoffset":16,"distcoursesbridge":7.8,"diststringsbridge":5,"distchanterellesbridge":10,"distbasscoursesbridge":9.9,"distcoursesnut":6,"distchanterellesnut":7.5,"diststringsnut":2.5,"distbasscoursesshortnut":3.6,"distbasscoursesnut":4,"bodyscale":1,"materialth":13,"guitarfromlist":"Dias1581","guitardepth":80,"guitarangle":0,"guitarroundl":0,"guitarroundw":0,"guitartaper":0,"guitarconcavity":0,"constructionwidth":4,"constructionlength":6.5,"constructionmensur":600,"constructionbottom":6,"constructionside":6,"constructionsmall":1.333333,"constructionshoulder":0,"constructionshoulderlength":0,"constructionwedge":0,"ribspacing":"evenclasp","usesideasmiddle":false,"constructiondepthratio":1,"constructionshapeshift":0,"lastribadd":3,"deepenbody":0,"limitorset":"set","nutangle":0,"drawallstrings":true,"bridgeangle":0,"numbernuts":5,"nutunit_1":"frets","mensur_2":114,"nutunit_2":"percent","courses_2":1,"singles_2":false,"mensur_3":123,"nutunit_3":"percent","courses_3":1,"singles_3":false,"mensur_4":134,"nutunit_4":"percent","courses_4":1,"singles_4":false,"pegboxcurve":0.85},

// From Extant lutes Database. Wrong bass rider. No data about body depth or shape apart from outline.
"Burkholtzer 705mm 13c":{"bodyshapefrom":"fromlist","presetoverlay":false,"bodyshapefromlist":"Burkholtzer","numberofribs":21,"bulge":2.15,"divisions":9,"ribspread":1,"rosettelist":"single","rosettescale":98,"mensur":705,"fingerboardcourses":11,"chanterelles":2,"singlestrings":false,"hasdiapasons":true,"mensur_1":758,"courses_1":2,"singles_1":false,"fretsonneck":8.4,"fingerboardstyle":"fangs","neckwidthlimit":101,"neckadd":-8,"pegboxstyle":"bassriderEdlinger","foldable":false,"bridgestyle":"baroque","bridgeoffset":17,"distcoursesbridge":8,"diststringsbridge":5,"distchanterellesbridge":10,"distbasscoursesbridge":8,"distcoursesnut":6,"distchanterellesnut":7.3,"diststringsnut":2.4,"distbasscoursesshortnut":4,"distbasscoursesnut":4,"bodyscale":1,"ribspacing":"","numbernuts":2,"nutunit_1":"mm","materialth":11.5,"guitarfromlist":"Dias1581","guitardepth":80,"guitarangle":0,"guitarroundl":0,"guitarroundw":0,"guitartaper":0,"guitarconcavity":0,"constructionwidth":4,"constructionlength":6.5,"constructionmensur":600,"constructionbottom":6,"constructionside":6,"constructionsmall":1.333333,"constructionshoulder":0,"constructionshoulderlength":0,"constructionwedge":0,"usesideasmiddle":false,"constructiondepthratio":1,"constructionshapeshift":0,"lastribadd":3,"deepenbody":0,"pegboxangle":0,"pegboxcurve":0,"limitorset":"set","nutangle":0,"drawallstrings":true,"bridgeoffsetx":14,"bridgeangle":0},

// From Schreiner drawing and Extant lutes database.
"Railich1650 792mm Theorbo 14s":{"bodyscale":1,"bodyshapefrom":"fromlist","bodyshapefromlist":"Railich1650","bridgeangle":0,"bridgeoffset":12,"bridgeoffsetx":0,"bridgestyle":"alienhead","bulge":2.25,"chanterelles":1,"courses":"","deepenbody":0,"distbasscoursesbridge":10.2,"distbasscoursesnut":5,"distbasscoursesshortnut":7,"distchanterellesbridge":12,"distchanterellesnut":8,"distcoursesbridge":10,"distcoursesnut":8,"diststringsbridge":5,"diststringsnut":2.5,"drawallstrings":true,"fingerboardcourses":6,"fingerboardstyle":"fangs","foldable":true,"freemodemiddle":"","freemodeside":"","guitarangle":0,"guitarconcavity":0,"guitardepth":0,"guitarfromlist":"JeanVoboam1687","guitarroundl":0,"guitarroundw":0,"guitarscallop":0,"guitartaper":0,"hasdiapasons":true,"lastribadd":5,"limitorset":"set","materialth":12,"mensur":792,"neckadd":33,"neckwidthlimit":99,"numbernuts":2,"numberofribs":25,"nutangle":0,"nutunit":"","pegboxangle":0,"pegboxcurve":0,"pegboxstyle":"theorbo","presetoverlay":false,"ribspacing":"","ribspread":1,"rosettelist":"triple","rosettescale":100,"singles":"","singlestrings":true,"usesideasmiddle":false,"mensur_1":1620,"courses_1":8,"singles_1":true},

"Railich1664 820mm theorbo":{"bodyshapefrom":"fromlist","presetoverlay":false,"bodyshapefromlist":"Railich1664","numberofribs":15,"bulge":2.25,"divisions":9,"ribspread":1,"rosettelist":"triple","rosettescale":100,"mensur":820,"fingerboardcourses":7,"chanterelles":1,"singlestrings":true,"hasdiapasons":true,"mensur_1":1640,"courses_1":8,"singles_1":true,"fretsonneck":8.4,"fingerboardstyle":"fangs","neckwidthlimit":99,"neckadd":29,"pegboxstyle":"theorbo","foldable":true,"bridgestyle":"Railich1664","bridgeoffset":16,"distcoursesbridge":10,"diststringsbridge":5,"distchanterellesbridge":12,"distbasscoursesbridge":10.2,"distcoursesnut":8,"distchanterellesnut":8,"diststringsnut":2.5,"distbasscoursesshortnut":7,"distbasscoursesnut":5,"bodyscale":1,"drawallstrings":true,"lastribadd":5,"limitorset":"set","numbernuts":2,"ribspacing":"","usesideasmiddle":false,"materialth":13,"guitarfromlist":"Dias1581","guitardepth":80,"constructionlength":6.5,"constructionbottom":6,"constructionside":6,"tubestyle":"bentbox","guitarangle":0,"guitarroundl":0,"guitarroundw":0,"guitartaper":0,"guitarconcavity":0,"constructionwidth":4,"constructionmensur":600,"constructionsmall":1.333333,"constructionshoulder":0,"constructionshoulderlength":0,"constructionwedge":0,"constructiondepthratio":1,"constructionshapeshift":0,"deepenbody":0,"pegboxangle":0,"pegboxcurve":0,"nutangle":0,"bridgeoffsetx":0,"bridgeangle":0},

// From pictures of original and reproductions
"Rauche 720mm 997mm 2+2x6-2x5":{"bodyshapefrom":"fromlist","presetoverlay":false,"bodyshapefromlist":"Rauche","numberofribs":23,"bulge":2.15,"divisions":9,"ribspread":1,"rosettelist":"triple","rosettescale":111,"mensur":720,"fingerboardcourses":8,"chanterelles":2,"singlestrings":false,"hasdiapasons":false,"mensur_1":277,"courses_1":5,"singles_1":false,"fretsonneck":8.4,"fingerboardstyle":"fangs","neckwidthlimit":113,"neckadd":15,"pegboxstyle":"Rauche","foldable":false,"bridgestyle":"Rauche","bridgeoffset":20,"distcoursesbridge":8.5,"diststringsbridge":4.5,"distchanterellesbridge":9.5,"distbasscoursesbridge":8.5,"distcoursesnut":6.5,"distchanterellesnut":7,"diststringsnut":3.2,"distbasscoursesshortnut":6.6,"distbasscoursesnut":5.5,"bodyscale":1,"constructionbottom":6,"constructionlength":6.5,"constructionside":6,"drawallstrings":true,"guitardepth":80,"guitarfromlist":"Dias1581","lastribadd":4,"limitorset":"set","materialth":11.5,"numbernuts":2,"usesideasmiddle":false,"nutunit_1":"addmm","ribspacing":"evenclasp","tubestyle":"bentbox","guitarangle":0,"guitarroundl":0,"guitarroundw":0,"guitartaper":0,"guitarconcavity":0,"constructionwidth":4,"constructionmensur":600,"constructionsmall":1.333333,"constructionshoulder":0,"constructionshoulderlength":0,"constructionwedge":0,"constructiondepthratio":1,"constructionshapeshift":0,"deepenbody":0,"pegboxangle":0,"pegboxcurve":0,"nutangle":0,"bridgeoffsetx":0,"bridgeangle":0,"casestylelid":"rectilinear","casestyleside":"flat","casewoodthick":4,"casefoamthick":20,"casewidth":300,"caselength":1000,"casedepth":200,"tubewidth":200,"tubedepth":150,"pegboxdepth":250,"pegboxlength":100,"lowerradius":100,"tuberadius":50,"bowlradius":1000,"bowlradiusc":200},
// From pictures&info on extant lutes database and museum page. Body depth and shape is a guess.
"David Tecchler 1725 Archlute":{"bodyshapefrom":"fromlist","presetoverlay":false,"bodyshapefromlist":"Tecchler","numberofribs":15,"bulge":2.2,"divisions":9,"ribspread":1,"rosettelist":"triple","rosettescale":100,"mensur":708,"fingerboardcourses":6,"chanterelles":1,"singlestrings":false,"hasdiapasons":true,"mensur_1":1555,"courses_1":8,"singles_1":true,"fretsonneck":8.4,"fingerboardstyle":"fangs","neckwidthlimit":116,"neckadd":42,"pegboxstyle":"theorbo","foldable":false,"bridgestyle":"horse","bridgeoffset":16,"distcoursesbridge":7.8,"diststringsbridge":5,"distchanterellesbridge":8.5,"distbasscoursesbridge":10.2,"distcoursesnut":6.4,"distchanterellesnut":8.1,"diststringsnut":1.8,"distbasscoursesshortnut":3.6,"distbasscoursesnut":5,"bodyscale":1,"numbernuts":2,"ribspacing":"even","materialth":13,"guitarfromlist":"Dias1581","guitardepth":80,"guitarangle":0,"guitarroundl":0,"guitarroundw":0,"guitartaper":0,"guitarconcavity":0,"constructionwidth":4,"constructionlength":6.5,"constructionmensur":600,"constructionbottom":6,"constructionside":6,"constructionsmall":1.333333,"constructionshoulder":0,"constructionshoulderlength":0,"constructionwedge":0,"usesideasmiddle":false,"constructiondepthratio":1,"constructionshapeshift":0,"lastribadd":3,"deepenbody":0,"pegboxangle":0,"pegboxcurve":0,"limitorset":"set","nutangle":0,"drawallstrings":true,"bridgeoffsetx":0,"bridgeangle":0,"casestylelid":"rectilinear","casestyleside":"flat","tubestyle":"bentbox","casewoodthick":4,"casefoamthick":20,"casewidth":300,"caselength":1000,"casedepth":200,"tubewidth":200,"tubedepth":150,"pegboxdepth":250,"pegboxlength":100,"lowerradius":100,"tuberadius":50,"bowlradius":1000,"bowlradiusc":200},

// from museum page and scale drawings of front and back : https://www.metmuseum.org/art/collection/search/503155
"Giacomo Ertel guitar":{"bodyshapefrom":"guitar","presetoverlay":false,"bodyshapefromlist":"Harz","numberofribs":5,"bulge":2.3,"divisions":9,"ribspread":0.6,"rosettelist":"single","rosettescale":114,"mensur":650,"fingerboardcourses":5,"chanterelles":1,"singlestrings":false,"hasdiapasons":false,"fretsonneck":8.4,"fingerboardstyle":"longsmallfangs","neckwidthlimit":100,"neckadd":0,"pegboxstyle":"JeanVoboam1687","foldable":false,"bridgestyle":"voboam","bridgeoffset":-18.5,"distcoursesbridge":9,"diststringsbridge":5,"distchanterellesbridge":11,"distbasscoursesbridge":9,"distcoursesnut":6.7,"distchanterellesnut":6.5,"diststringsnut":2,"distbasscoursesshortnut":6.7,"distbasscoursesnut":5,"bodyscale":1,"ribspacing":"evenclasp","numbernuts":1,"drawallstrings":true,"limitorset":"limit","constructionmensur":600,"constructionbottom":6,"constructionside":6,"constructionsmall":1.333333,"constructionwidth":4,"constructionwedge":0,"materialth":15,"caseth":3.7,"casestyle":"flatcase","constructionlength":6.5,"constructionshoulder":0,"constructionshoulderlength":0,"constructiondepthratio":1,"constructionshapeshift":0,"usesideasmiddle":false,"lastribadd":-32.5,"foamth":10,"guitardepth":94,"guitarangle":1.56,"guitarroundl":3,"guitarroundw":0,"guitarscallop":5.7,"guitarfromlist":"GiacomoErtel","guitartaper":10.5,"guitarconcavity":0},

// From drawing
"Matteo Sellas 1640 E.547 18c theorbo":{"bodyshapefrom":"fromlist","presetoverlay":false,"bodyshapefromlist":"MatteoSellas1640_E547","numberofribs":33,"bulge":2.25,"divisions":9,"ribspread":1,"rosettelist":"triple","rosettescale":100,"mensur":863,"fingerboardcourses":6,"chanterelles":0,"singlestrings":false,"hasdiapasons":true,"mensur_1":1695,"courses_1":12,"singles_1":true,"fretsonneck":8.4,"fingerboardstyle":"fangs","neckwidthlimit":126,"neckadd":55,"pegboxstyle":"theorboSmallKoch","foldable":true,"bridgestyle":"schelle","bridgeoffset":17,"distcoursesbridge":7.5,"diststringsbridge":5,"distchanterellesbridge":8.5,"distbasscoursesbridge":10,"distcoursesnut":6.4,"distchanterellesnut":8.1,"diststringsnut":1.8,"distbasscoursesshortnut":3.6,"distbasscoursesnut":5,"bodyscale":1,"numbernuts":2,"ribspacing":"even","materialth":13,"guitardepth":80,"guitarangle":0,"guitarroundl":0,"guitarroundw":0,"guitartaper":0,"guitarconcavity":0,"constructionwidth":4,"constructionlength":6.5,"constructionmensur":600,"constructionbottom":6,"constructionside":6,"constructionsmall":1.333333,"constructionshoulder":0,"constructionshoulderlength":0,"constructionwedge":0,"usesideasmiddle":false,"constructiondepthratio":1,"constructionshapeshift":0,"lastribadd":9,"deepenbody":0,"pegboxangle":0,"pegboxcurve":0,"limitorset":"set","nutangle":0,"drawallstrings":true,"bridgeoffsetx":20,"bridgeangle":0,"casestylelid":"rectilinear","casestyleside":"flat","tubestyle":"bentbox","casewoodthick":4,"casefoamthick":20,"casewidth":300,"caselength":1000,"casedepth":200,"tubewidth":200,"tubedepth":150,"pegboxdepth":250,"pegboxlength":100,"lowerradius":100,"tuberadius":50,"bowlradius":1000,"bowlradiusc":200,"nutunit_1":"mm"},


}
// defaultlute is venere 585mm 1x1+2x6, but loaded from here only on startup. If it were loaded from instrumentpresets it would get corrupted. It would need to be copied...
var defaultlute = {"drawingpurpose":"technical","bodyshapefrom":"fromlist","presetoverlay":false,"bodyshapefromlist":"venere","numberofribs":11,"bulge":2.2,"divisions":9,"ribspread":1,"rosettelist":"single","rosettescale":100,"mensur":585,"fingerboardcourses":7,"chanterelles":1,"singlestrings":false,"hasdiapasons":false,"mensur_1":1400,"courses_1":7,"singles_1":true,"fretsonneck":8.4,"fingerboardstyle":"fangs","neckwidthlimit":100,"neckadd":0,"pegboxstyle":"renaissance","foldable":false,"bridgestyle":"renaissance","bridgeoffset":8,"distcoursesbridge":9.9,"diststringsbridge":5,"distchanterellesbridge":10.5,"distbasscoursesbridge":9.9,"distcoursesnut":6.4,"distchanterellesnut":8.1,"diststringsnut":2.5,"distbasscoursesshortnut":3.6,"distbasscoursesnut":5,"bodyscale":1.0};

// Chanterelle rider shape
var chanterelle_top = "m 0,0 l 5.6,0.1 m -6.6,-3.5 c -0.4,0 0,7.2 0.3,7.1 c 0.6,0.1 0.1,-7.1 -0.3,-7.1 z m 0.8,16.1 c 0.2,-7.8 -0.1,-21.2 -1.2,-21.1 c -1.1,0.4 0.4,12.7 1.2,21.1 l 6,0 l 0,-21.1 l 4,0 l 0,59.5 l -9,0 c 0.8,-26.3 -6.7,-36.2 -6,-59.5 l 3.8,0";

var chanterelle_side = "m 0,0 c 4.7810223,0 8.4941041,-3.5075582 8.6,-8.5 c 0.1034234,-4.875876 -3.5250838,-8.585825 -8.6,-8.6 c -19.599924,-0.05474 -24.2,15.5 -50,19 l -1,2 h 53 l -2,-3.9 c -11.8,0.1 -27.7,2.1 -50,1.9 m 53.5,-10.5 c -0.1019815,1.9303046 -1.5670418,3.5121865 -3.5,3.5 c -1.9452607,-0.012264 -3.5373662,-1.6043695 -3.5,-3.5 c 0.038095,-1.932621 1.5678284,-3.556469 3.5,-3.5 c 1.9911902,0.05819 3.5969991,1.664002 3.5,3.5 z";

var theorbohead_sided = "m -6.7037985,25.190638 a 2.3677084,2.3677084 0 0 1 -2.3677084,2.367708 a 2.3677084,2.3677084 0 0 1 -2.3677091,-2.367708 a 2.3677084,2.3677084 0 0 1 2.3677091,-2.367709 a 2.3677084,2.3677084 0 0 1 2.3677084,2.367709 z m 3.9788179,-14.054033 a 3.3677082,3.3677082 0 0 1 -3.3677083,3.367709 a 3.3677082,3.3677082 0 0 1 -3.3677082,-3.367709 a 3.3677082,3.3677082 0 0 1 3.3677082,-3.3677082 a 3.3677082,3.3677082 0 0 1 3.3677083,3.3677082 z m 17.4201756,56.788917 a 2.3677084,2.3677084 0 0 1 -2.367708,2.367708 a 2.3677084,2.3677084 0 0 1 -2.3677085,-2.367708 a 2.3677084,2.3677084 0 0 1 2.3677085,-2.367709 a 2.3677084,2.3677084 0 0 1 2.367708,2.367709 z m 3.627214,-29.772846 a 2.3677084,2.3677084 0 0 1 -2.367709,2.367708 a 2.3677084,2.3677084 0 0 1 -2.367708,-2.367708 a 2.3677084,2.3677084 0 0 1 2.367708,-2.367709 a 2.3677084,2.3677084 0 0 1 2.367709,2.367709 z m -6.03769,-26.723693 a 2.3677084,2.3677084 0 0 1 -2.3677087,2.367708 a 2.3677084,2.3677084 0 0 1 -2.3677084,-2.367708 a 2.3677084,2.3677084 0 0 1 2.3677084,-2.3677087 a 2.3677084,2.3677084 0 0 1 2.3677087,2.3677087 z m 7.565312,11.763549 a 3.3677082,3.3677082 0 0 1 -3.367708,3.367708 a 3.3677082,3.3677082 0 0 1 -3.367709,-3.367708 a 3.3677082,3.3677082 0 0 1 3.367709,-3.367709 a 3.3677082,3.3677082 0 0 1 3.367708,3.367709 z m -2.577884,29.829967 a 3.3677082,3.3677082 0 0 1 -3.367708,3.367708 a 3.3677082,3.3677082 0 0 1 -3.367708,-3.367708 a 3.3677082,3.3677082 0 0 1 3.367708,-3.367708 a 3.3677082,3.3677082 0 0 1 3.367708,3.367708 z m -1.080927,29.870766 a 3.3677082,3.3677082 0 0 1 -3.367708,3.367708 a 3.3677082,3.3677082 0 0 1 -3.3677081,-3.367708 a 3.3677082,3.3677082 0 0 1 3.3677081,-3.367708 a 3.3677082,3.3677082 0 0 1 3.367708,3.367708 z m -16.19122,-82.893265 c 9.141959,0.01794792 22.721483,1.4995356 24.841695,23.154094 c 2.238514,22.862819 -15.491516,53.670076 4.158321,76.845902 v 19.999994 h -29.000016 v -27.346684 l 3.92982,-7.7e-4 m -3.93037,-27.65254 h 3.5 c -0.0852,16.54744 -1.31919,36.101424 6.979766,54.999994 m 18.5208,-19.999994 c -24.057456,0.898834 -25.390656,-12.92556 -25.500566,-35 m -3.49945,0 h 3.5 c -0.0852,16.54744 -1.31919,36.101424 6.979766,54.999994";

var theorbohead_outline = "m -13.20208,120 h 25 v -20 c -4.05127,-4.5506 -4.96315,-12.3611 -5.38443,-17.753759 l -6.41349,-82.246241 h -8.2020802 l 2.237292,31.961326 l -14.4743268,-0.0037 l 2.237035,-31.957629 h -8.20208 l -6.413501,82.246241 c -0.42127,5.392659 -1.333151,13.203159 -5.38442,17.753762 v 19.99999 h 25";

var theorbohead_detail = "m -24.266433,86.633562 h 22.1286988 m -3.827054,-54.672234 l 4.1680182,59.543156 m -18.642345,-59.546857 l -4.170675,59.581028 m 21.0920648,14.382155 l 0.06882,5.92859 m -8.0719338,-6.80363 c 0.40705,-1.48941 1.440269,-1.66359 1.9919085,-1.10094 c 2.0938143,2.00919 3.8241083,2.1314 6.0406973,1.98882 c 0.296172,-1.2613 3.8400602,-2.32229 4.9650762,0.6489 l 0.04916,6.40735 m -13.046842,-7.94413 l -1.020789,0.007 l -32.073161,-0.007 c 0.296422,-1.21123 1.156173,-1.38562 1.799226,-1.39612 h 32.563029 m -1.308841,1.3376 c 0.979187,2.28171 3.5158918,6.69245 8.1629258,6.9099 c 1.1522072,-2.46009 4.9714142,-1.06693 4.8515102,1.02946 h -39.669001 c -3.842398,-2.20461 -5.541467,-4.93565 -6.408681,-7.871 m 39.8150178,-56.591599 c 2.3982902,0.210373 4.6484302,0.252299 5.8714002,6.199547 c 2.29898,15.112148 1.01999,39.500906 7.37079,45.336442 l -10.22936,-8.495516 m -19.797791,-43.040473 c -2.39829,0.210373 -4.64843,0.252299 -5.8714,6.199547 c -2.298986,15.112148 -1.019996,39.500906 -7.370794,45.336442 l 10.226964,-8.461346 m -13.592292,8.461346 h 50.000002";












// Lutedesigner help page
// Partly generated automatically from tooltips




function read_tooltips(){
	var labels = document.getElementsByTagName("label");
	var tooltips = [];
	for (l of labels){ // foreach on an array
		if (l.title !== ""){
			tooltips.push([l.innerText, l.title]);
		}
	}
	
	return tooltips;
}
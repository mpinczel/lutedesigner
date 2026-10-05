 <html>

<!--
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
-->
<head>
<title>Lute Designer | Niskanen Lutes</title>
	<meta property="og:title" content="Lute Designer"/>
    <meta property="og:type" content="website"/>
    <meta property="og:url" content="https://www.niskanenlutes.com/lutedesigner/fullmode.php"/>
    <meta property="og:image" content="https://www.niskanenlutes.com/lutedesigner/lutedesigner-og.png"/>
	<meta property="og:image:type" content="image/jpg">
	<meta property="og:image:width" content="470">
	<meta property="og:image:height" content="246">
    <meta property="og:site_name" content="Niskanen Lutes"/>
    <meta property="fb:admins" content="526938350"/>
    <meta property="og:description"
          content="Free online parametric design aid for lutes"/>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
<meta charset="UTF-8"> 
<meta name="description" content="Create lute technical drawings easily!">
<link rel="stylesheet" type="text/css" href="lutedesigner.css">
<!-- <meta name="title" content="Lauri Niskanen, luthier"> -->
<link rel="shortcut icon" href="LDicon3.png" type="image/x-icon">

</head>
<body>
<style>
.messagesplash {
	z-index:999999;
	position:absolute;
	background-color: white;
	border: 1px solid #222222;
	width: 50vw;
	height: 40vh;
	left: 25vw;
	top: 25vh;
	padding:2em;
}
.messagesplash h1 {
	text-align: center;
	
}
.Xbutton {
	text-align: center;
	right:0px;
	top:0px;
	position:absolute;
	
}
.bigbutton {
	text-align: center;
	font-size: 2em;
	margin-top:3em;
}
.progbar {
	width:100%;
	height:2em;
	border: 1px solid #222222;
	padding:2px;
}
.splasherror {
	margin-top: 1.5em;
	overflow-wrap: anywhere;
}
.progbar-inner {
	background-color: #43bc43;
	height: 2em;
	width: 1%;
	text-align: right;
	padding: 0.4em;
	box-sizing: border-box;
	font-size: 1em;
	overflow: hidden;
	/*animation: proganim 2s;*/
}
@keyframes proganim {
	
	to {width:unset;}
}

</style>
<div id="loadingsplash" class="messagesplash"> 
	<button class="Xbutton" onclick="getelid('loadingsplash').classList.add('hidebodyviewer');">X</button>
	<h1>Loading Lute Designer</h1>
	<center><h3>by Lauri Niskanen</h3></center>
	<div class="progbar" id="loadingprogress"><div class="progbar-inner"></div></div>
	<div id="splasherror" class="splasherror"></div>
</div>
<div id="generic_message_splash" class="messagesplash hidebodyviewer"> 
	<button class="Xbutton" onclick="getelid('generic_message_splash').classList.add('hidebodyviewer');">X</button>
	<h1 id="generic_splash_title">Error</h1>
	<div id="generic_splasherror" class="splasherror"></div>
	<center><button class="bigbutton" onclick="getelid('generic_message_splash').classList.add('hidebodyviewer');">Well OK then</button></center>
</div>

<script>
try{if (false){
if (console.everything === undefined) {
  console.everything = [];
  function TS(){
    return (new Date).toLocaleString("sv", { timeZone: 'UTC' }) + "Z"
  }
  window.onerror = function (error, url, line) {
    console.everything.push({
      type: "exception",
      timeStamp: TS(),
      value: { error, url, line }
    })
    return false;
  }
  window.onunhandledrejection = function (e) {
    console.everything.push({
      type: "promiseRejection",
      timeStamp: TS(),
      value: e.reason
    })
  } 

  function hookLogType(logType) {
    const original= console[logType].bind(console)
    return function(){
      console.everything.push({ 
        type: logType, 
        timeStamp: TS(), 
        value: Array.from(arguments) 
      })
      original.apply(console, arguments)
    }
  }

  ['log', 'error', 'warn', 'debug'].forEach(logType=>{
    console[logType] = hookLogType(logType)
  })
}   
}} catch (e) {
	console.log("Can't gather errors because: ",e);
}
function show_error(msg){
	document.getElementById("generic_message_splash").classList.remove('hidebodyviewer');
	document.getElementById("generic_splasherror").innerHTML += "ERROR: " + msg+"<br>";
}
window.onerror = function( msg, url, line ) {
	if (document.getElementById("splasherror").innerHTML==""){
		document.getElementById("splasherror").innerHTML += (typeof _t == "function" ? _t("Whoops! Something went wrong:") : "Whoops! Something went wrong:")+"<br>"
	}
	document.getElementById("splasherror").innerHTML += "ERROR: \"" + msg + " at \""+url.substr(url.lastIndexOf("/")+1) + "\", line " + line +"<br>";
	
}

var progbar_steps = 15;
var progbar_prog = 1;
function progbar_advance(steps) {
	try {
		//var orig = parseInt((progbar_prog / progbar_steps) * 100);
		progbar_prog += steps || 1;
		var b = document.getElementById("loadingprogress").firstElementChild;
		var a = parseInt((progbar_prog / progbar_steps) * 100);
		if (a <= 100){
		b.setAttribute("style","width:"+a+"%;");
		b.innerHTML = a+"&nbsp;%"
		} else {
			b.setAttribute("style","width:100%");
		}
	} catch(e) {console.log(e);}
}
</script>
<!--Interface languages, first so every script can use _t()-->
<script src="lutedesigner-i18n.js"></script>
<!--Replacement for removed SVG path segment API-->
<!--<script src="pathseg.js"></script>-->
<!--Lute designer helpers-->
<script src="lutedesigner-helper.js"></script><script>progbar_advance();</script>
<script src="lutedesigner-editing.js"></script><script>progbar_advance();</script>

<script src="lutedesigner-draw.js"></script><script>progbar_advance();</script>
<script src="lutedesigner-instrument.js"></script><script>progbar_advance();</script>
<script src="lutedesigner-body.js"></script><script>progbar_advance();</script>

<script src="lutedesigner-presets.js"></script><script>progbar_advance();</script>
<script src="lutedesigner-fullversion.js"></script><script>progbar_advance();</script>
<script src="lutedesigner-form.js"></script><script>progbar_advance();</script>


<script src="lutedesigner-planmaker.js"></script><script>progbar_advance();</script>
<script src="lutedesigner-camexport.js"></script><script>progbar_advance();</script>








<script src="lutedesigner-help.js"></script> <!-- Generates manual from tooltips -->

<!-- three.js for WebGL 3D stuff -->
<script src="three/build/three.min.js"></script><script>progbar_advance();</script>
<script src="three/examples/js/loaders/STLLoader.js" type="module"></script><script>progbar_advance();</script>
<script src="three/examples/js/exporters/STLExporter.js" type="module"></script><script>progbar_advance();</script>
<script src="three/examples/js/controls/OrbitControls.js"></script><script>progbar_advance();</script>
<script src="lutedesigner-bodyviewer.js"></script><script>progbar_advance();</script>
<!--Lute designer main file-->
<script src="lutedesigner.js"></script><script>progbar_advance();</script>
<?php
include("lutedesigner.html");
?>

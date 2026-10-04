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
// CAM export: construction parts as clean SVG for CAM software (e.g. Alphacam)
// - Only cut geometry (closed outlines) and optional markings (open lines)
// - No text, hidden, debug, border or fill elements
// - All transforms baked into absolute coordinates, units mm at 1:1
// - Parts laid out side by side, no overlaps, starting at 0,0
// The live drawing is not modified; geometry is collected from "Form drawing" mode.

var CAM_FORMMODE = "technicalform";

// Groups of part sets by usage: the instrument itself, one of the two mould types, reference templates
var CAMGROUPS = [
	{key:"instrument", label:"Instrument (every build)", file:"instrument", checked:true,
		desc:"Parts of the lute itself."},
	{key:"foamcore", label:"Foam-core mould", file:"foamcore_mould", checked:true,
		desc:"Mould skeleton of rib supports and notched supports between the end blocks."},
	{key:"carved", label:"Carved mould", file:"carved_mould", checked:false,
		desc:"Mould skeleton of a bottom board and a middle board with cross supports standing in their slots."},
	{key:"templates", label:"Reference templates", file:"templates", checked:false,
		desc:"For checking and hand shaping, not mould parts."}
];

// Part sets offered in the export dialog, in group order.
// parts() runs while the form drawing is shown and returns [{name, el, split}]
// split: every closed outline in el becomes its own part
var CAMSETS = [
	{key:"body", group:"instrument", label:"Body / soundboard outline",
		desc:"Soundboard / body outline (front view), joined into one closed outline.", parts:function(){
		return []; // built separately, see cam_bodyoutline
	}},
	{key:"flatribs", group:"instrument", label:"Flat rib templates", rotate:true,
		desc:"Ribs unfolded flat: centre rib C, the numbered ribs and the two end clasp pieces. The rib strips are cut to these.", parts:function(){
		var out = cam_children("flatribs-layer", /^flatribg-/);
		var ec = getelid("endclasp-flat-template-group");
		if (ec) out.push({name:"endclasp-flat", el:ec, split:true});
		return out;
	}},
	{key:"ribsupports", group:"foamcore", label:"Rib supports",
		desc:"One board per rib joint line (joint 0 = centre, the last = edge), following the joint from tail to neck block. Small notches mark the supports. Drawn soundboard edge up.", parts:function(){
		return cam_children("formlayer", /^ribsupportg-/);
	}},
	{key:"foamform", group:"foamcore", label:"Foam core supports and blocks",
		desc:"Notched plywood supports and the butt (tail) and neck blocks.", parts:function(){
		return cam_children("formlayer", /^(supportg-|formblock-)/);
	}},
	{key:"carvedform", group:"carved", label:"Carved form: bottom and middle",
		desc:"Bottom board (body outline with centre strip) and middle profile board, with slots for the cross supports.", parts:function(){
		return cam_children("formlayer", /^carved-form-/);
	}},
	{key:"crosssupports", group:"carved", label:"Cross supports",
		desc:"Quarter cross sections standing in the carved form slots: butt 1-3 at the tail, widest point, main stations, last support and neck block face. Wide necks (90 mm and more) add adaptor and helper faces.", parts:function(){
		return cam_children("formlayer", /^(cross-support-|last-support-|necblock-face-|adaptor-face-|helper-face-)/);
	}},
	{key:"templates", group:"templates", label:"Cross section and neck block templates",
		desc:"Cross section at the widest point, neck block joint outline and neck block side template, for checking and hand shaping.", parts:function(){
		return ["cross-section", "neckblock-side-template", "neckblock-group"]
			.filter(function(id){ return getelid(id); })
			.map(function(id){ return {name:id, el:getelid(id)}; });
	}}
	// Pegbox left out: "detached-pegbox" is an assembly view, its outlines are not cutting profiles
];

function cam_children(groupid, re){
	var g = getelid(groupid);
	if (!g) return [];
	var out = [];
	for (var i=0; i<g.children.length; i++){
		var c = g.children[i];
		if (re.test(c.id)) out.push({name:c.id, el:c});
	}
	return out;
}

///////////////////////////////////////////////////////////////////////////////
// Geometry: paths are lists of subpaths {start:[x,y], segs:[...], closed}
// seg is {t:"L", p:[x,y]} or {t:"C", c1, c2, p}
///////////////////////////////////////////////////////////////////////////////

function cam_parsepath(d){
	var toks = d.match(/[a-zA-Z]|[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?/g) || [];
	var i = 0, cmd = null;
	var cur = [0,0], start = [0,0];
	var lastc = null, lastq = null; // reflected control points for S and T
	var subs = [], sub = null;
	function num(){ return parseFloat(toks[i++]); }
	function flag(){
		// Arc flags may be written without separators, e.g. "0110"
		var t = toks[i];
		if (t.length > 1){ toks[i] = t.slice(1); return t[0] == "1"; }
		i++;
		return t == "1";
	}
	function newsub(p){
		sub = {start:p, segs:[], closed:false};
		subs.push(sub);
	}
	function line(p){
		if (!sub) newsub(cur);
		sub.segs.push({t:"L", p:p});
	}
	function curve(c1, c2, p){
		if (!sub) newsub(cur);
		sub.segs.push({t:"C", c1:c1, c2:c2, p:p});
	}
	while (i < toks.length){
		if (/^[a-zA-Z]$/.test(toks[i])) cmd = toks[i++];
		else if (cmd === null) break;
		var rel = cmd != cmd.toUpperCase();
		var C = cmd.toUpperCase();
		var ox = rel ? cur[0] : 0, oy = rel ? cur[1] : 0;
		var p, c1, c2, q;
		if (C == "Z"){
			if (sub){ sub.closed = true; sub = null; }
			cur = start;
			lastc = lastq = null;
			continue;
		}
		if (C == "M"){
			p = [ox+num(), oy+num()];
			newsub(p);
			cur = start = p;
			cmd = rel ? "l" : "L"; // following pairs are implicit linetos
			lastc = lastq = null;
			continue;
		}
		if (C == "L"){ p = [ox+num(), oy+num()]; line(p); lastc = lastq = null; }
		else if (C == "H"){ p = [ox+num(), cur[1]]; line(p); lastc = lastq = null; }
		else if (C == "V"){ p = [cur[0], oy+num()]; line(p); lastc = lastq = null; }
		else if (C == "C"){
			c1 = [ox+num(), oy+num()]; c2 = [ox+num(), oy+num()]; p = [ox+num(), oy+num()];
			curve(c1, c2, p); lastc = c2; lastq = null;
		} else if (C == "S"){
			c1 = lastc ? [2*cur[0]-lastc[0], 2*cur[1]-lastc[1]] : cur;
			c2 = [ox+num(), oy+num()]; p = [ox+num(), oy+num()];
			curve(c1, c2, p); lastc = c2; lastq = null;
		} else if (C == "Q" || C == "T"){
			if (C == "Q") q = [ox+num(), oy+num()];
			else q = lastq ? [2*cur[0]-lastq[0], 2*cur[1]-lastq[1]] : cur;
			p = [ox+num(), oy+num()];
			curve([cur[0]+2/3*(q[0]-cur[0]), cur[1]+2/3*(q[1]-cur[1])],
				  [p[0]+2/3*(q[0]-p[0]), p[1]+2/3*(q[1]-p[1])], p);
			lastq = q; lastc = null;
		} else if (C == "A"){
			var rx = num(), ry = num(), rot = num(), large = flag(), sweep = flag();
			p = [ox+num(), oy+num()];
			cam_arctocubics(cur, rx, ry, rot, large, sweep, p).forEach(function(s){ curve(s[0], s[1], s[2]); });
			lastc = lastq = null;
		} else {
			console.log("cam_parsepath: unsupported command", cmd);
			break;
		}
		cur = p;
	}
	return subs;
}

function cam_arctocubics(p0, rx, ry, rotdeg, large, sweep, p){
	// SVG endpoint arc to cubic beziers, SVG spec appendix F.6.5
	if (rx == 0 || ry == 0) return [[p0, p, p]];
	rx = Math.abs(rx); ry = Math.abs(ry);
	var phi = rotdeg*Math.PI/180, cs = Math.cos(phi), sn = Math.sin(phi);
	var dx = (p0[0]-p[0])/2, dy = (p0[1]-p[1])/2;
	var x1 = cs*dx + sn*dy, y1 = -sn*dx + cs*dy;
	var lam = (x1*x1)/(rx*rx) + (y1*y1)/(ry*ry);
	if (lam > 1){ rx *= Math.sqrt(lam); ry *= Math.sqrt(lam); }
	var num = rx*rx*ry*ry - rx*rx*y1*y1 - ry*ry*x1*x1;
	var den = rx*rx*y1*y1 + ry*ry*x1*x1;
	var co = Math.sqrt(Math.max(0, num/den)) * (large == sweep ? -1 : 1);
	var cxp = co*rx*y1/ry, cyp = -co*ry*x1/rx;
	var cx = cs*cxp - sn*cyp + (p0[0]+p[0])/2, cy = sn*cxp + cs*cyp + (p0[1]+p[1])/2;
	function ang(ux, uy, vx, vy){
		var a = Math.atan2(ux*vy - uy*vx, ux*vx + uy*vy);
		return a;
	}
	var t1 = ang(1, 0, (x1-cxp)/rx, (y1-cyp)/ry);
	var dt = ang((x1-cxp)/rx, (y1-cyp)/ry, (-x1-cxp)/rx, (-y1-cyp)/ry);
	if (!sweep && dt > 0) dt -= 2*Math.PI;
	if (sweep && dt < 0) dt += 2*Math.PI;
	var n = Math.max(1, Math.ceil(Math.abs(dt)/(Math.PI/2)));
	var step = dt/n, k = 4/3*Math.tan(step/4);
	function pt(t){ var x = rx*Math.cos(t), y = ry*Math.sin(t); return [cx + cs*x - sn*y, cy + sn*x + cs*y]; }
	function der(t){ var x = -rx*Math.sin(t), y = ry*Math.cos(t); return [cs*x - sn*y, sn*x + cs*y]; }
	var out = [], ta = t1, a = p0;
	for (var i=0; i<n; i++){
		var tb = ta + step;
		var b = (i == n-1) ? p : pt(tb);
		var da = der(ta), db = der(tb);
		out.push([[a[0]+k*da[0], a[1]+k*da[1]], [b[0]-k*db[0], b[1]-k*db[1]], b]);
		ta = tb; a = b;
	}
	return out;
}

function cam_ellipse(cx, cy, rx, ry){
	// Closed ellipse as 4 cubics
	var k = 0.5522847498;
	var e = [cx+rx, cy], s = [cx, cy+ry], w = [cx-rx, cy], n = [cx, cy-ry];
	return {start:e, closed:true, segs:[
		{t:"C", c1:[cx+rx, cy+k*ry], c2:[cx+k*rx, cy+ry], p:s},
		{t:"C", c1:[cx-k*rx, cy+ry], c2:[cx-rx, cy+k*ry], p:w},
		{t:"C", c1:[cx-rx, cy-k*ry], c2:[cx-k*rx, cy-ry], p:n},
		{t:"C", c1:[cx+k*rx, cy-ry], c2:[cx+rx, cy-k*ry], p:e}]};
}

function cam_polyline(pts, closed){
	return {start:pts[0], closed:closed, segs:pts.slice(1).map(function(p){ return {t:"L", p:p}; })};
}

function cam_mapsub(sub, f){
	// Apply point function f to every point of a subpath
	return {start:f(sub.start), closed:sub.closed, segs:sub.segs.map(function(s){
		return s.t == "C" ? {t:"C", c1:f(s.c1), c2:f(s.c2), p:f(s.p)} : {t:"L", p:f(s.p)};
	})};
}

function cam_subpoints(sub){
	var pts = [sub.start];
	sub.segs.forEach(function(s){ if (s.t == "C"){ pts.push(s.c1, s.c2); } pts.push(s.p); });
	return pts;
}

function cam_reversesub(sub){
	var pts = [sub.start].concat(sub.segs.map(function(s){ return s.p; }));
	var segs = [];
	for (var i=sub.segs.length-1; i>=0; i--){
		var s = sub.segs[i];
		segs.push(s.t == "C" ? {t:"C", c1:s.c2, c2:s.c1, p:pts[i]} : {t:"L", p:pts[i]});
	}
	return {start:pts[pts.length-1], closed:sub.closed, segs:segs};
}

function cam_bbox(subs){
	var b = {x0:Infinity, y0:Infinity, x1:-Infinity, y1:-Infinity};
	subs.forEach(function(sub){
		cam_subpoints(sub).forEach(function(p){
			if (p[0] < b.x0) b.x0 = p[0];
			if (p[1] < b.y0) b.y0 = p[1];
			if (p[0] > b.x1) b.x1 = p[0];
			if (p[1] > b.y1) b.y1 = p[1];
		});
	});
	return b;
}

///////////////////////////////////////////////////////////////////////////////
// Collecting geometry from the live drawing
///////////////////////////////////////////////////////////////////////////////

function cam_isvisible(el, root){
	for (var n=el; n && n!==root; n=n.parentElement){
		var cs = getComputedStyle(n);
		if (cs.display == "none" || cs.visibility == "hidden") return false;
	}
	return true;
}

function cam_isdebug(el){
	if (/debug|debg/i.test(el.id)) return true;
	var stroke = (getComputedStyle(el).stroke || "").replace(/\s/g, "");
	// REDSTYLE and OCTSTYLE are only used for debug drawing
	return stroke == "rgb(255,0,0)" || stroke == "rgb(187,0,0)";
}

function cam_isinvisible(el){
	// e.g. HIDDENSTYLE: zero stroke width and no fill
	var cs = getComputedStyle(el);
	return parseFloat(cs.strokeWidth) == 0 && (cs.fill == "none" || cs.fillOpacity == "0");
}

function cam_elementsubs(el){
	// Subpaths of one shape element in its own coordinates
	var tag = el.tagName.toLowerCase();
	var a = function(n){ return parseFloat(el.getAttribute(n)) || 0; };
	if (tag == "path") return cam_parsepath(el.getAttribute("d") || "");
	if (tag == "line") return [cam_polyline([[a("x1"), a("y1")], [a("x2"), a("y2")]], false)];
	if (tag == "rect"){
		var x = a("x"), y = a("y"), w = a("width"), h = a("height");
		if (w <= 0 || h <= 0) return [];
		return [cam_polyline([[x,y], [x+w,y], [x+w,y+h], [x,y+h], [x,y]], true)];
	}
	if (tag == "circle") return a("r") > 0 ? [cam_ellipse(a("cx"), a("cy"), a("r"), a("r"))] : [];
	if (tag == "ellipse") return [cam_ellipse(a("cx"), a("cy"), a("rx"), a("ry"))];
	if (tag == "polyline" || tag == "polygon"){
		var n = (el.getAttribute("points") || "").trim().split(/[\s,]+/).map(parseFloat);
		var pts = [];
		for (var i=0; i+1<n.length; i+=2) pts.push([n[i], n[i+1]]);
		if (tag == "polygon" && pts.length) pts.push(pts[0]);
		return pts.length > 1 ? [cam_polyline(pts, tag == "polygon")] : [];
	}
	return [];
}

function cam_collect(el, root){
	// Returns {cut:[subpaths], marks:[subpaths]} of el in root user coordinates (mm)
	var out = {cut:[], marks:[]};
	var rootinv = root.getScreenCTM().inverse();
	var shapes = [el].concat(Array.prototype.slice.call(el.querySelectorAll("*")));
	shapes.forEach(function(s){
		if (!/^(path|line|rect|circle|ellipse|polyline|polygon)$/i.test(s.tagName)) return;
		if (!cam_isvisible(s, root) || cam_isdebug(s) || cam_isinvisible(s)) return;
		var m = rootinv.multiply(s.getScreenCTM());
		var f = function(p){ return [m.a*p[0] + m.c*p[1] + m.e, m.b*p[0] + m.d*p[1] + m.f]; };
		cam_elementsubs(s).forEach(function(sub){
			if (!sub.segs.length) return;
			var t = cam_mapsub(sub, f);
			var last = t.segs[t.segs.length-1].p;
			// A path ending where it started counts as closed even without z
			if (!t.closed && Math.hypot(last[0]-t.start[0], last[1]-t.start[1]) < 0.01) t.closed = true;
			(t.closed ? out.cut : out.marks).push(t);
		});
	});
	return out;
}

function cam_bodyoutline(root){
	// Join the body half outline and its mirror into one closed outline
	var fv = getelid("frontview");
	var side = null;
	for (var i=0; i<fv.children.length && !side; i++){
		var c = fv.children[i];
		if (/-side$/.test(c.id) && !/inside/.test(c.id) && getelid(c.id+"-mirrored")) side = c;
	}
	if (!side) return [];
	var a = cam_collect(side, root).marks[0];
	var b = cam_collect(getelid(side.id+"-mirrored"), root).marks[0];
	if (!a || !b) return [];
	var end = function(s){ return s.segs[s.segs.length-1].p; };
	var dist = function(p, q){ return Math.hypot(p[0]-q[0], p[1]-q[1]); };
	// Orient both halves so that a ends where b starts
	var opts = [[a, b], [a, cam_reversesub(b)], [cam_reversesub(a), b], [cam_reversesub(a), cam_reversesub(b)]];
	opts.sort(function(o1, o2){
		return (dist(end(o1[0]), o1[1].start) + dist(end(o1[1]), o1[0].start)) -
			   (dist(end(o2[0]), o2[1].start) + dist(end(o2[1]), o2[0].start));
	});
	var h1 = opts[0][0], h2 = opts[0][1];
	var segs = h1.segs.slice();
	if (dist(end(h1), h2.start) > 0.01) segs.push({t:"L", p:h2.start});
	segs = segs.concat(h2.segs);
	if (dist(end(h2), h1.start) > 0.01) segs.push({t:"L", p:h1.start});
	return [{name:"body-outline", cut:[{start:h1.start, segs:segs, closed:true}], marks:[]}];
}

function cam_splitparts(name, geom){
	// Each closed outline becomes a part, open markings go to the smallest outline containing them
	var parts = geom.cut.map(function(sub, i){
		return {name:name+"-"+(i+1), cut:[sub], marks:[], bb:cam_bbox([sub])};
	});
	geom.marks.forEach(function(m){
		var mb = cam_bbox([m]), mid = [(mb.x0+mb.x1)/2, (mb.y0+mb.y1)/2], best = null;
		parts.forEach(function(p){
			var b = p.bb;
			if (mid[0] >= b.x0 && mid[0] <= b.x1 && mid[1] >= b.y0 && mid[1] <= b.y1){
				if (!best || (b.x1-b.x0)*(b.y1-b.y0) < (best.bb.x1-best.bb.x0)*(best.bb.y1-best.bb.y0)) best = p;
			}
		});
		if (best) best.marks.push(m);
	});
	return parts;
}

function cam_gatherset(set, root){
	if (set.key == "body") return cam_bodyoutline(root);
	var parts = [];
	set.parts().forEach(function(p){
		var geom = cam_collect(p.el, root);
		if (p.split) parts = parts.concat(cam_splitparts(p.name, geom));
		else if (geom.cut.length) parts.push({name:p.name, cut:geom.cut, marks:geom.marks});
	});
	return parts;
}

///////////////////////////////////////////////////////////////////////////////
// Layout and output
///////////////////////////////////////////////////////////////////////////////

function cam_partsubs(part){ return part.cut.concat(part.marks); }

function cam_transformpart(part, f){
	return {name:part.name,
		cut:part.cut.map(function(s){ return cam_mapsub(s, f); }),
		marks:part.marks.map(function(s){ return cam_mapsub(s, f); })};
}

function cam_minrotate(part){
	// Rotate a part to its smallest bounding box, long side vertical
	var pts = [];
	part.cut.forEach(function(s){ pts = pts.concat(cam_subpoints(s)); });
	var best = 0, bestarea = Infinity;
	for (var d=0; d<180; d+=0.25){
		var r = d*Math.PI/180, c = Math.cos(r), s = Math.sin(r);
		var x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
		for (var i=0; i<pts.length; i++){
			var x = c*pts[i][0] - s*pts[i][1], y = s*pts[i][0] + c*pts[i][1];
			if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
		}
		var area = (x1-x0)*(y1-y0);
		if (area < bestarea - 1e-6){ bestarea = area; best = r; }
	}
	var rot = function(r){ var c = Math.cos(r), s = Math.sin(r); return function(p){ return [c*p[0] - s*p[1], s*p[0] + c*p[1]]; }; };
	var out = cam_transformpart(part, rot(best));
	var b = cam_bbox(out.cut);
	if (b.x1-b.x0 > b.y1-b.y0) out = cam_transformpart(out, rot(Math.PI/2));
	return out;
}

function cam_layout(parts, sheetwidth, gap){
	// Shelf packing: rows of parts, tallest first, starting at 0,0
	var items = parts.map(function(p){ return {part:p, bb:cam_bbox(cam_partsubs(p))}; });
	items.sort(function(a, b){ return (b.bb.y1-b.bb.y0) - (a.bb.y1-a.bb.y0); });
	var x = 0, y = 0, rowh = 0, width = 0, out = [];
	items.forEach(function(it){
		var w = it.bb.x1-it.bb.x0, h = it.bb.y1-it.bb.y0;
		if (x > 0 && x + w > sheetwidth){ x = 0; y += rowh + gap; rowh = 0; }
		var dx = x - it.bb.x0, dy = y - it.bb.y0;
		out.push(cam_transformpart(it.part, function(p){ return [p[0]+dx, p[1]+dy]; }));
		x += w + gap;
		rowh = Math.max(rowh, h);
		width = Math.max(width, x - gap);
	});
	return {parts:out, width:width, height:y + rowh};
}

function cam_num(v){
	var s = (Math.round(v*1000)/1000).toString();
	return s == "-0" ? "0" : s;
}

function cam_d(sub){
	var pt = function(p){ return cam_num(p[0])+","+cam_num(p[1]); };
	var d = "M"+pt(sub.start);
	sub.segs.forEach(function(s){
		d += s.t == "C" ? " C"+pt(s.c1)+" "+pt(s.c2)+" "+pt(s.p) : " L"+pt(s.p);
	});
	return sub.closed ? d+" Z" : d;
}

function cam_xmlid(s){
	return s.replace(/[^A-Za-z0-9_.-]/g, "_").replace(/^([^A-Za-z_])/, "_$1");
}

function cam_stack(blocks){
	// blocks: [{id, layout}] stacked vertically, returns blocks with parts moved into place
	var gap = 50, y = 0, width = 0, out = [];
	blocks.forEach(function(b){
		var dy = y;
		out.push({id:b.id, parts:b.layout.parts.map(function(p){
			return cam_transformpart(p, function(q){ return [q[0], q[1]+dy]; });
		})});
		width = Math.max(width, b.layout.width);
		y += b.layout.height + gap;
	});
	return {blocks:out, width:width, height:Math.max(0, y - gap)};
}

function cam_svg(title, blocks){
	var st = cam_stack(blocks), body = "";
	st.blocks.forEach(function(b){
		body += '  <g id="'+cam_xmlid(b.id)+'">\n';
		b.parts.forEach(function(p){
			var pid = cam_xmlid(p.name);
			body += '    <g id="'+pid+'">\n';
			p.cut.forEach(function(sub, i){
				body += '      <path id="'+pid+'-cut-'+(i+1)+'" d="'+cam_d(sub)+'" fill="none" stroke="#000000" stroke-width="0.2"/>\n';
			});
			p.marks.forEach(function(sub, i){
				body += '      <path id="'+pid+'-mark-'+(i+1)+'" d="'+cam_d(sub)+'" fill="none" stroke="#0000ff" stroke-width="0.2"/>\n';
			});
			body += '    </g>\n';
		});
		body += '  </g>\n';
	});
	var width = cam_num(st.width), height = cam_num(st.height);
	return '<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n'+
		'<!-- Lute Designer CAM export: '+title.replace(/--/g, "-")+'. Units mm, scale 1:1. Black = cut outlines, blue = markings. -->\n'+
		'<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="'+width+'mm" height="'+height+'mm" viewBox="0 0 '+width+' '+height+'">\n'+
		body+'</svg>\n';
}

///////////////////////////////////////////////////////////////////////////////
// DXF output: R12 (AC1009) polylines of lines and arcs (bulges), units mm.
// Cubic curves are fitted with biarcs within a tolerance, or flattened to lines.
///////////////////////////////////////////////////////////////////////////////

function cam_vsub(a, b){ return [a[0]-b[0], a[1]-b[1]]; }
function cam_vdot(a, b){ return a[0]*b[0] + a[1]*b[1]; }
function cam_vcross(a, b){ return a[0]*b[1] - a[1]*b[0]; }
function cam_vlen(a){ return Math.hypot(a[0], a[1]); }
function cam_vunit(a){ var l = cam_vlen(a); return l > 1e-12 ? [a[0]/l, a[1]/l] : null; }

function cam_cubicpt(c, t){
	var u = 1-t;
	return [u*u*u*c[0][0] + 3*u*u*t*c[1][0] + 3*u*t*t*c[2][0] + t*t*t*c[3][0],
			u*u*u*c[0][1] + 3*u*u*t*c[1][1] + 3*u*t*t*c[2][1] + t*t*t*c[3][1]];
}

function cam_splitcubic(c){
	// De Casteljau split at t=0.5
	var m = function(a, b){ return [(a[0]+b[0])/2, (a[1]+b[1])/2]; };
	var p01 = m(c[0], c[1]), p12 = m(c[1], c[2]), p23 = m(c[2], c[3]);
	var p012 = m(p01, p12), p123 = m(p12, p23), mid = m(p012, p123);
	return [[c[0], p01, p012, mid], [mid, p123, p23, c[3]]];
}

function cam_segdist(p, a, b){
	var ab = cam_vsub(b, a), l2 = cam_vdot(ab, ab);
	var t = l2 > 0 ? Math.max(0, Math.min(1, cam_vdot(cam_vsub(p, a), ab)/l2)) : 0;
	return cam_vlen(cam_vsub(p, [a[0]+t*ab[0], a[1]+t*ab[1]]));
}

function cam_arcdist(p, a, b, bulge){
	// Distance from p to the arc a->b with the given DXF bulge
	if (Math.abs(bulge) < 1e-9) return cam_segdist(p, a, b);
	var ch = cam_vsub(b, a), L = cam_vlen(ch), th = 4*Math.atan(bulge);
	var h = (L/2)/Math.tan(th/2);
	var c = [(a[0]+b[0])/2 - ch[1]/L*h, (a[1]+b[1])/2 + ch[0]/L*h];
	var r = cam_vlen(cam_vsub(a, c));
	var a0 = Math.atan2(a[1]-c[1], a[0]-c[0]), ap = Math.atan2(p[1]-c[1], p[0]-c[0]);
	var d = th > 0 ? ap - a0 : a0 - ap;
	d = ((d % (2*Math.PI)) + 2*Math.PI) % (2*Math.PI);
	if (d <= Math.abs(th)) return Math.abs(cam_vlen(cam_vsub(p, c)) - r);
	return Math.min(cam_vlen(cam_vsub(p, a)), cam_vlen(cam_vsub(p, b)));
}

function cam_bulge(a, tangent, b){
	// Bulge of the arc from a to b that starts in the tangent direction
	var ch = cam_vsub(b, a);
	return Math.tan(Math.atan2(cam_vcross(tangent, ch), cam_vdot(tangent, ch))/2);
}

function cam_biarc(c){
	// Equal tangent length biarc for cubic c, returns [{p, b}] (end point, bulge) or null
	var t0 = cam_vunit(cam_vsub(c[1], c[0])) || cam_vunit(cam_vsub(c[2], c[0]));
	var t1 = cam_vunit(cam_vsub(c[3], c[2])) || cam_vunit(cam_vsub(c[3], c[1]));
	if (!t0 || !t1) return null;
	var v = cam_vsub(c[3], c[0]), t = [t0[0]+t1[0], t0[1]+t1[1]];
	var qa = 2*(1 - cam_vdot(t0, t1)), qb = 2*cam_vdot(v, t), qc = -cam_vdot(v, v), d;
	if (Math.abs(qa) < 1e-12) d = qb != 0 ? -qc/qb : NaN;
	else d = (-qb + Math.sqrt(qb*qb - 4*qa*qc))/(2*qa);
	if (!(d > 1e-9) || !isFinite(d)) return null;
	var q1 = [c[0][0] + d*t0[0], c[0][1] + d*t0[1]], q2 = [c[3][0] - d*t1[0], c[3][1] - d*t1[1]];
	var j = [(q1[0]+q2[0])/2, (q1[1]+q2[1])/2];
	var tj = cam_vunit(cam_vsub(q2, q1)) || t0;
	return [{p:j, b:cam_bulge(c[0], t0, j)}, {p:c[3], b:cam_bulge(j, tj, c[3])}];
}

function cam_fitcubic(c, tol, arcs, depth){
	// Returns [{p, b}] approximating cubic c (start point excluded) within tol
	var flat = cam_segdist(c[1], c[0], c[3]) <= tol && cam_segdist(c[2], c[0], c[3]) <= tol;
	if (flat || cam_vlen(cam_vsub(c[3], c[0])) < tol) return [{p:c[3], b:0}];
	if (arcs){
		var ba = cam_biarc(c);
		if (ba){
			var err = 0, pts = [c[0], ba[0].p, ba[1].p];
			for (var i=1; i<32 && err <= tol; i++){
				var p = cam_cubicpt(c, i/32);
				err = Math.max(err, Math.min(cam_arcdist(p, pts[0], pts[1], ba[0].b), cam_arcdist(p, pts[1], pts[2], ba[1].b)));
			}
			if (err <= tol) return ba;
		}
	}
	if (depth >= 16) return [{p:c[3], b:0}];
	var halves = cam_splitcubic(c);
	return cam_fitcubic(halves[0], tol, arcs, depth+1).concat(cam_fitcubic(halves[1], tol, arcs, depth+1));
}

function cam_dxfnum(v){
	var s = (Math.round(v*1e6)/1e6).toString();
	return s == "-0" ? "0" : s;
}

function cam_dxfpolyline(sub, layer, tol, arcs){
	// One subpath as POLYLINE with VERTEX bulges
	var verts = [{p:sub.start, b:0}], cur = sub.start;
	sub.segs.forEach(function(s){
		var pieces = s.t == "C" ? cam_fitcubic([cur, s.c1, s.c2, s.p], tol, arcs, 0) : [{p:s.p, b:0}];
		pieces.forEach(function(pc){
			verts[verts.length-1].b = pc.b; // bulge belongs to the segment starting at the previous vertex
			verts.push({p:pc.p, b:0});
		});
		cur = s.p;
	});
	var last = verts[verts.length-1].p;
	if (sub.closed && verts.length > 2 && cam_vlen(cam_vsub(last, sub.start)) < 1e-6) verts.pop(); // closing vertex is implied
	var out = ["0","POLYLINE","8",layer,"66","1","10","0","20","0","30","0","70",sub.closed ? "1" : "0"];
	verts.forEach(function(v){
		out.push("0","VERTEX","8",layer,"10",cam_dxfnum(v.p[0]),"20",cam_dxfnum(v.p[1]),"30","0");
		if (v.b) out.push("42", cam_dxfnum(v.b));
	});
	out.push("0","SEQEND","8",layer);
	return out;
}

function cam_dxflayer(s){
	return s.toUpperCase().replace(/[^A-Z0-9_-]/g, "_");
}

function cam_dxf(title, blocks, opts){
	opts = opts || {};
	var tol = opts.tolerance || 0.01, arcs = opts.arcs !== false;
	var st = cam_stack(blocks), H = st.height;
	var flip = function(p){ return [p[0], H - p[1]]; }; // DXF Y axis points up
	var layers = [], ents = [];
	st.blocks.forEach(function(b){
		var cut = cam_dxflayer(b.id+"_CUT"), mark = cam_dxflayer(b.id+"_MARK");
		layers.push([cut, "7"], [mark, "5"]); // black/white and blue
		b.parts.forEach(function(p){
			p.cut.forEach(function(sub){ ents = ents.concat(cam_dxfpolyline(cam_mapsub(sub, flip), cut, tol, arcs)); });
			p.marks.forEach(function(sub){ ents = ents.concat(cam_dxfpolyline(cam_mapsub(sub, flip), mark, tol, arcs)); });
		});
	});
	var out = ["999","Lute Designer CAM export: "+title+". Units mm, scale 1:1.",
		"0","SECTION","2","HEADER",
		"9","$ACADVER","1","AC1009",
		"9","$INSUNITS","70","4",
		"9","$MEASUREMENT","70","1",
		"9","$EXTMIN","10","0","20","0","30","0",
		"9","$EXTMAX","10",cam_dxfnum(st.width),"20",cam_dxfnum(H),"30","0",
		"0","ENDSEC",
		"0","SECTION","2","TABLES",
		"0","TABLE","2","LTYPE","70","1",
		"0","LTYPE","2","CONTINUOUS","70","0","3","Solid line","72","65","73","0","40","0",
		"0","ENDTAB",
		"0","TABLE","2","LAYER","70",String(layers.length)];
	layers.forEach(function(l){ out.push("0","LAYER","2",l[0],"70","0","62",l[1],"6","CONTINUOUS"); });
	out.push("0","ENDTAB","0","ENDSEC","0","SECTION","2","ENTITIES");
	out = out.concat(ents);
	out.push("0","ENDSEC","0","EOF");
	return out.join("\r\n")+"\r\n";
}

function cam_withformdrawing(fn){
	// Temporarily redraw in form drawing mode, where all construction parts exist
	var prev = editorstate.drawingpurpose;
	var switched = prev != CAM_FORMMODE;
	if (switched){ editorstate.drawingpurpose = CAM_FORMMODE; makedrawing(); }
	try {
		return fn(getelid("designer-canvas"));
	} finally {
		if (switched){
			editorstate.drawingpurpose = prev;
			makedrawing();
			backup(true); // backup() is throttled, so the restoring redraw may not have saved the hash
		}
	}
}

function cam_build(keys, opts){
	// Returns [{key, label, parts, layout}] for the selected set keys
	opts = opts || {};
	var sheetwidth = opts.sheetwidth || 1200, gap = opts.gap || 10;
	return cam_withformdrawing(function(root){
		var results = [];
		CAMSETS.forEach(function(set){
			if (keys.indexOf(set.key) < 0) return;
			var parts = cam_gatherset(set, root);
			if (!opts.marks) parts = parts.map(function(p){ return {name:p.name, cut:p.cut, marks:[]}; });
			if (set.rotate) parts = parts.map(cam_minrotate);
			results.push({key:set.key, label:set.label, group:set.group, desc:set.desc, parts:parts, layout:cam_layout(parts, sheetwidth, gap)});
		});
		return results;
	});
}

function cam_filename(suffix, ext){
	return (editorstate.bodyshapefromlist || "lute")+"_"+editorstate.mensur+"mm_"+suffix+"."+ext;
}

function cam_download(fname, txt){
	var type = /\.dxf$/.test(fname) ? "application/dxf" : /\.html$/.test(fname) ? "text/html" : "image/svg+xml";
	var url = URL.createObjectURL(new Blob([txt], {type:type}));
	var a = document.createElement("a");
	a.href = url;
	a.download = fname;
	document.body.appendChild(a);
	a.click();
	a.remove();
	setTimeout(function(){ URL.revokeObjectURL(url); }, 10000);
}

function cam_group(key){
	for (var i=0; i<CAMGROUPS.length; i++) if (CAMGROUPS[i].key == key) return CAMGROUPS[i];
	return null;
}

///////////////////////////////////////////////////////////////////////////////
// Parts guide: HTML page showing what each set contains
///////////////////////////////////////////////////////////////////////////////

function cam_partlabel(key, name){
	// Readable part names for the guide, matching the numbers printed on the drawing
	var m;
	if (key == "flatribs"){
		if ((m = name.match(/^flatribg-(\d+)$/))) return m[1] == "1" ? "C" : String(parseInt(m[1])-1);
		return name == "endclasp-flat-1" ? "end clasp" : "";
	}
	if (key == "ribsupports") return "joint " + name.replace("ribsupportg-", "");
	return name.replace(/^(supportg-|cross-support-|carved-form-|formblock-)/, "").replace(/-group$/, "");
}

function cam_guide(results){
	// results from cam_build, with marks
	var colors = {instrument:"#1f77b4", foamcore:"#2ca02c", carved:"#ff7f0e", templates:"#9467bd"};
	var title = "CAM export guide - "+(editorstate.bodyshapefromlist || "lute")+" "+editorstate.mensur+" mm";
	var html = "";
	CAMGROUPS.forEach(function(g){
		var sets = results.filter(function(r){ return r.group == g.key; });
		if (!sets.length) return;
		var col = colors[g.key] || "#555";
		html += '<h2 style="margin:18px 10px 4px;color:'+col+'">'+g.label+'</h2><p style="margin:0 10px 6px;font-size:13px">'+g.desc+
			' File: <code>'+cam_filename(g.file, "dxf")+'</code></p>';
		sets.forEach(function(r){
			var L = r.layout, W = 760, s = Math.min((W-20)/(L.width || 1), 260/(L.height || 1));
			var tf = function(q){ return [10+q[0]*s, 14+q[1]*s]; };
			var svg = "";
			L.parts.forEach(function(p){
				var bb = cam_bbox(p.cut.concat(p.marks));
				p.cut.forEach(function(sub){ svg += '<path d="'+cam_d(cam_mapsub(sub, tf))+'" fill="'+col+'22" stroke="'+col+'" stroke-width="1.2"/>'; });
				p.marks.forEach(function(sub){ svg += '<path d="'+cam_d(cam_mapsub(sub, tf))+'" fill="none" stroke="'+col+'" stroke-width="0.6" stroke-dasharray="3,2"/>'; });
				svg += '<text x="'+(10+(bb.x0+bb.x1)/2*s).toFixed(1)+'" y="'+(14+bb.y1*s+11).toFixed(1)+'" font-size="9" text-anchor="middle" fill="#555">'+cam_partlabel(r.key, p.name)+'</text>';
			});
			html += '<div style="background:#fff;border:1px solid #ccc;border-left:6px solid '+col+';margin:6px 10px;padding:6px 8px">'+
				'<div style="font-size:14px"><b>'+r.label+'</b> <span style="color:#666">- '+r.parts.length+' part'+(r.parts.length > 1 ? 's' : '')+
				', DXF layers <code>'+r.key.toUpperCase()+'_CUT</code> / <code>'+r.key.toUpperCase()+'_MARK</code></span></div>'+
				'<div style="font-size:12px;margin:2px 0 4px">'+r.desc+'</div>'+
				'<svg width="'+W+'" height="'+(L.height*s+32).toFixed(0)+'" font-family="sans-serif" style="max-width:100%;height:auto">'+svg+'</svg></div>';
		});
	});
	return '<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">'+
		'<title>'+title+'</title><style>body{margin:0;background:#f4f4f4;color:#000;font-family:sans-serif} code{font-size:11px}</style></head><body>'+
		'<h1 style="margin:10px;font-size:18px">'+title+'</h1>'+
		'<p style="margin:0 10px;font-size:13px">Every build needs the instrument parts and <b>one</b> of the two mould types. Solid = cut outline, dashed = marking, each set scaled to fit. Units mm, 1:1 in the DXF/SVG files.</p>'+
		html+'<p style="margin:10px;font-size:11px;color:#666">Generated by Lute Designer, '+new Date().toISOString().slice(0,10)+'.</p></body></html>\n';
}

///////////////////////////////////////////////////////////////////////////////
// Dialog
///////////////////////////////////////////////////////////////////////////////

function cam_savedchoice(){
	try { return JSON.parse(localStorage.getItem("cam-export-choice")) || null; } catch(e){ return null; }
}

function cam_groupcheckstate(gkey){
	// Group tick reflects its sets: checked, unchecked or partly
	var cbs = document.querySelectorAll('.cam-set-cb[data-group="'+gkey+'"]');
	var on = 0;
	for (var i=0; i<cbs.length; i++) if (cbs[i].checked) on++;
	var g = document.querySelector('.cam-group-cb[value="'+gkey+'"]');
	g.checked = on == cbs.length;
	g.indeterminate = on > 0 && on < cbs.length;
}

function cam_togglegroup(el){
	var cbs = document.querySelectorAll('.cam-set-cb[data-group="'+el.value+'"]');
	for (var i=0; i<cbs.length; i++) cbs[i].checked = el.checked;
	el.indeterminate = false;
}

function cam_opendialog(){
	var dlg = getelid("cam-export-dialog");
	if (!dlg){
		dlg = document.createElement("div");
		dlg.id = "cam-export-dialog";
		dlg.style.cssText = "position:fixed; top:5%; left:50%; transform:translateX(-50%); background:#fff; color:#000; max-height:90vh; overflow:auto;"+
			"border:1px solid #888; padding:16px; z-index:1000; min-width:340px; font-family:sans-serif; box-shadow:0 4px 12px rgba(0,0,0,0.3);";
		var saved = cam_savedchoice();
		var html = '<h3 style="margin:0 0 10px">Export parts for CAM</h3>';
		CAMGROUPS.forEach(function(g){
			html += '<label style="display:block;font-weight:bold;margin-top:6px" title="'+g.desc+'"><input type="checkbox" class="cam-group-cb" value="'+g.key+'" onchange="cam_togglegroup(this);"> '+g.label+'</label>';
			CAMSETS.forEach(function(set){
				if (set.group != g.key) return;
				var on = saved && saved[set.key] !== undefined ? saved[set.key] : g.checked;
				html += '<label style="display:block;margin-left:1.5em" title="'+set.desc+'"><input type="checkbox" class="cam-set-cb" data-group="'+g.key+'" value="'+set.key+'"'+
					(on ? ' checked' : '')+' onchange="cam_groupcheckstate(\''+g.key+'\');"> '+set.label+'</label>';
			});
		});
		html += '<hr><label style="display:block">Files <select id="cam-files">'+
				'<option value="group" selected>One per group</option><option value="set">One per part set</option><option value="one">All parts in one file</option></select></label>'+
			'<label style="display:block"><input type="checkbox" id="cam-guide" checked> Include parts guide (HTML)</label>'+
			'<label style="display:block"><input type="checkbox" id="cam-marks" checked> Include markings (blue open lines)</label>'+
			'<label style="display:block">Max layout width <input type="number" id="cam-sheetwidth" value="1200" min="100" step="10" style="width:6em"> mm</label>'+
			'<label style="display:block">Gap between parts <input type="number" id="cam-gap" value="10" min="0" step="1" style="width:6em"> mm</label>'+
			'<hr><label style="display:block">Format <select id="cam-format">'+
				'<option value="svg">SVG</option><option value="dxf">DXF (R12)</option><option value="both" selected>SVG and DXF</option></select></label>'+
			'<label style="display:block">DXF curves <select id="cam-dxfcurves">'+
				'<option value="arcs" selected>Arcs and lines</option><option value="lines">Line segments only</option></select></label>'+
			'<label style="display:block">DXF curve tolerance <input type="number" id="cam-tolerance" value="0.01" min="0.001" step="0.005" style="width:6em"> mm</label>'+
			'<p id="cam-status" style="font-size:0.9em;color:#555"></p>'+
			'<button onclick="cam_exportselected();">Download</button> '+
			'<button onclick="getelid(\'cam-export-dialog\').style.display=\'none\';" style="margin-left:8px">Close</button>';
		dlg.innerHTML = html;
		document.body.appendChild(dlg);
		CAMGROUPS.forEach(function(g){ cam_groupcheckstate(g.key); });
	}
	getelid("cam-status").textContent = "";
	dlg.style.display = "block";
}

function cam_exportselected(){
	var keys = Array.prototype.slice.call(document.querySelectorAll(".cam-set-cb:checked")).map(function(cb){ return cb.value; });
	if (!keys.length) return;
	try {
		var choice = {};
		document.querySelectorAll(".cam-set-cb").forEach(function(cb){ choice[cb.value] = cb.checked; });
		localStorage.setItem("cam-export-choice", JSON.stringify(choice)); // Remember the selection for next time
	} catch(e){}
	var results = cam_build(keys, {
		marks: getelid("cam-marks").checked,
		sheetwidth: parseFloat(getelid("cam-sheetwidth").value),
		gap: parseFloat(getelid("cam-gap").value)
	}).filter(function(r){ return r.parts.length; });
	var status = results.map(function(r){ return r.label+": "+r.parts.length; }).join(", ");
	var format = getelid("cam-format").value;
	var dxfopts = {arcs: getelid("cam-dxfcurves").value == "arcs", tolerance: parseFloat(getelid("cam-tolerance").value) || 0.01};
	var files = []; // [filename, content]
	var add = function(suffix, title, blocks){
		if (format != "dxf") files.push([cam_filename(suffix, "svg"), cam_svg(title, blocks)]);
		if (format != "svg") files.push([cam_filename(suffix, "dxf"), cam_dxf(title, blocks, dxfopts)]);
	};
	var block = function(r){ return {id:r.key, layout:r.layout}; };
	var mode = getelid("cam-files").value;
	if (mode == "one"){
		add("cam", "all parts", results.map(block));
	} else if (mode == "group"){
		CAMGROUPS.forEach(function(g){
			var sets = results.filter(function(r){ return r.group == g.key; });
			if (sets.length) add(g.file, g.label, sets.map(block));
		});
	} else {
		results.forEach(function(r){ add(r.key, r.label, [block(r)]); });
	}
	if (getelid("cam-guide").checked && results.length){
		// The guide always shows markings, so build it separately when they are switched off
		var guideresults = getelid("cam-marks").checked ? results : cam_build(keys, {marks:true,
			sheetwidth: parseFloat(getelid("cam-sheetwidth").value), gap: parseFloat(getelid("cam-gap").value)}).filter(function(r){ return r.parts.length; });
		files.push([cam_filename("cam_guide", "html"), cam_guide(guideresults)]);
	}
	// Space out downloads so the browser does not drop them
	files.forEach(function(f, i){
		setTimeout(function(){ cam_download(f[0], f[1]); }, i*400);
	});
	getelid("cam-status").textContent = results.length ? "Exported "+status : "Nothing to export";
}

features_init.push(function(){
	var label = creel("label");
	label.innerHTML = '<button id="camexportbutton" onclick="cam_opendialog();">Export parts for CAM&hellip;</button>';
	addel(getelid("metaselector"), label);
});

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
// User interface languages.
// The interface is written in English. Other languages are dictionaries keyed by the English text:
// - _t("English text") translates a string built in JavaScript
// - the page's text, tooltips and placeholders are translated in place, including elements added later
// The drawing canvas is left alone; text drawn into it goes through _t() in the drawing code.

var I18N_LANGS = [["en", "English"], ["hu", "Magyar"]];
var I18N_STORE = "lutedesigner-lang";

// Hungarian. Instrument, body, bridge and preset names are proper names and stay as they are.
var I18N_HU = {
// Splash screens and errors
"Loading Lute Designer": "A Lute Designer betöltése",
"by Lauri Niskanen": "készítette: Lauri Niskanen",
"Error": "Hiba",
"Well OK then": "Rendben",
"Whoops! Something went wrong:": "Hoppá! Valami hiba történt:",
"Failed to initialize 3D view": "A 3D nézet nem indítható",
"Analyzing dropped SVG": "A behúzott SVG elemzése",
"Error parsing SVG file": "Hiba az SVG fájl beolvasásakor",
"No editorstate in SVG file": "Az SVG fájlban nincsenek szerkesztői adatok",
"Dropped file was not recognized": "A behúzott fájl nem ismerhető fel",
"The editorstate contained in the file was invalid or corrupted.": "A fájlban tárolt szerkesztői adatok hibásak vagy sérültek.",

// Header and information panel
"Lute Designer": "Lute Designer",
"When will I ever need trigonometry in real life?": "Mikor lesz nekem szükségem a trigonometriára az életben?",
"Information": "Információ",
"Lute Designer is not just a collection of free lute plans. It is a program that can draw a full technical drawing for any kind of lute based on parameters you set.":
	"A Lute Designer nem csupán ingyenes lanttervek gyűjteménye: olyan program, amely a megadott paraméterek alapján bármilyen lantról teljes műszaki rajzot készít.",
"Left click pans, Wheel zooms, Middle button or pressing the Wheel measures. Click \"Download SVG Drawing\" under \"Output\" to save your drawing. Hover over options for help. Ctrl+z to undo, ctrl+y to redo.":
	"Bal gombbal mozgatás, görgővel nagyítás, középső gombbal vagy a görgő lenyomásával mérés. A rajz mentéséhez kattintson a „Letöltés” alatti „SVG rajz letöltése” gombra. Ha az egeret egy beállítás fölé viszi, súgót kap. Visszavonás: Ctrl+Z, újra: Ctrl+Y.",
"On mobile, drag to pan, pinch to zoom. Undo, redo and measure are available as buttons above.":
	"Mobilon húzással mozgathat, két ujjal nagyíthat. A visszavonás, az újra és a mérés a fenti gombokkal érhető el.",
"To share a drawing with somebody else, or save it for later, simply copy the whole URL from the address bar.":
	"Ha meg akarja osztani a rajzot, vagy később folytatná, egyszerűen másolja ki a teljes webcímet a címsorból.",
"Lute Designer is": "A Lute Designer",
"free open source software": "szabad, nyílt forráskódú szoftver,",
"licensed under": "licence:",
". It has missing features and probably some bugs. Use at your own risk. Historical accuracy of preset values is not guaranteed. See recent changes:":
	". Hiányoznak belőle funkciók, és valószínűleg hibák is vannak benne. Használata saját felelősségre. Az előre beállított értékek történeti hűsége nem garantált. Legutóbbi változások:",
"Changelog": "Változásnapló",
"If you find it useful please consider supporting the development of this software with a small donation:":
	"Ha hasznosnak találja, kérjük, támogassa a fejlesztést egy kis adománnyal:",
"Language": "Nyelv",

// Drawing panel
"Drawing": "Rajz",
"Drawing mode": "Rajzmód",
"Technical drawing for one instrument": "Egy hangszer műszaki rajza",
"Comparison (work in progress)": "Összehasonlítás (fejlesztés alatt)",
"Form drawing": "Formarajz",
"Technical with templates": "Műszaki rajz sablonokkal",
"Instrument Preset": "Előre beállított hangszer",
"Select...": "Válasszon...",
"Project Title:": "Projekt címe:",
"Project Title": "Projekt címe",
"Show other instruments:": "További hangszerek megjelenítése:",
"Remove...": "Eltávolítás...",
"Hide handles": "Fogópontok elrejtése",
"Show handles": "Fogópontok megjelenítése",
"Draw different instruments side by side to compare them. This feature is work in progress and does not accurately calculate rib shapes or forms, and also does not yet draw all extension types. However, this mode represents the most recent developments of Lute Designer and supports some features not yet available otherwise, such as bridge and nut angle adjustment. Only the first instrument is saved in the URL.":
	"Különböző hangszerek egymás melletti rajza összehasonlításhoz. A funkció fejlesztés alatt áll: a bordák alakját és a formákat nem számítja pontosan, és még nem rajzol meg minden nyakhosszabbítás-típust. Ugyanakkor ez a mód tartalmazza a Lute Designer legújabb fejlesztéseit, és olyan funkciókat is tud, amelyek máshol még nem érhetők el, például a húrláb és a nyereg szögének állítását. A webcímbe csak az első hangszer kerül.",
"Select instrument, all values in the editor will be overwritten.": "Hangszer kiválasztása – a szerkesztő minden értéke felülíródik.",
"This will be used as the window title so you can find this tab easily in your browser.": "Ez lesz az ablak címe, így könnyen megtalálja ezt a lapot a böngészőben.",

// Download panel
"Download": "Letöltés",
"Download SVG drawing in 1:1 scale": "SVG rajz letöltése 1:1 méretarányban",
"Choose this for further editing or printing in true scale especially if you intend to build an instrument based on the plans. You can open the output SVG file in":
	"Ezt válassza további szerkesztéshez vagy valódi méretű nyomtatáshoz, főleg ha a tervek alapján hangszert akar építeni. A kapott SVG fájlt megnyithatja ebben:",
". Drop an SVG file created this way back into Lute Designer to open it (Any changes you made to the SVG file will not appear here).":
	". Az így készült SVG fájlt visszahúzhatja a Lute Designerbe, és megnyílik (az SVG fájlban végzett módosítások itt nem jelennek meg).",
"Download SVG drawing (single A4 sheet)": "SVG rajz letöltése (egyetlen A4-es lapon)",
"Choose this if you just want to see the drawing easily or print it on a single sheet. Rib and mold templates mostly hidden.":
	"Ezt válassza, ha csak meg akarja nézni a rajzot, vagy egy lapra nyomtatná. A borda- és formasablonok nagyrészt rejtve maradnak.",
"Download STL model": "STL modell letöltése",
"This downloads what you see in the 3D view, as a binary STL file which you can open in various 3D software. Note that the model is guaranteed to not directly work for 3D printing because the parts are separate, not water tight, and have zero thickness.":
	"A 3D nézetben látható modellt tölti le bináris STL fájlként, amely sokféle 3D programban megnyitható. A modell 3D nyomtatásra közvetlenül biztosan nem alkalmas, mert a részei különállóak, nem zártak, és nulla vastagságúak.",
"Form material thickness": "A forma anyagvastagsága",
"Export parts for CAM…": "Alkatrészek exportálása CAM-hez…",
"Ballnose Endmill size:": "Gömbvégű maró mérete:",
"Neckblock Gcode": "Nyaktőke G-kód",

// Body panel
"Body": "Test",
"Body construction method": "A test szerkesztési módja",
"Lute: Classical construction": "Lant: klasszikus szerkesztés",
"Lute: From preset body list": "Lant: előre beállított testek közül",
"Guitar mode": "Gitár mód",
"Select guitar body": "Gitártest kiválasztása",
"Side height": "Káva magassága",
"Back angle": "A hát szöge",
"Back roundness lengthwise": "A hát hosszirányú domborúsága",
"Back roundness widthwise": "A hát keresztirányú domborúsága",
"Rib taper": "A borda keskenyedése",
"Rib concavity": "A borda homorúsága",
"Body width": "A test szélessége",
"Body length": "A test hossza",
"Construction string length": "Szerkesztési húrhossz",
"Bottom radius": "Alsó ív sugara",
"Side radius": "Oldalív sugara",
"Connector radius": "Összekötő ív sugara",
"Shoulder radius": "Vállív sugara",
"Shoulder reduction": "Vállcsökkentés",
"Wedge angle (degrees)": "Ékszög (fok)",
"Show existing lute shape overlay": "Meglévő lantforma rávetítése",
"Select lute body": "Lanttest kiválasztása",
"Rib spacing style": "Bordaosztás módja",
"Evenly at edge": "Egyenletesen a peremen",
"Evenly at endclasp": "Egyenletesen a zárólemeznél",
"Rib spread at endclasp": "Bordák szétterülése a zárólemeznél",
"Use soundboard shape as middle shape": "A fedőlap alakja legyen a középső alak",
"Body depth ratio": "A test mélységaránya",
"Body side view shape shift": "Oldalnézeti alak eltolása",
"Body cross-section bulge": "A keresztmetszet domborúsága",
"Number of ribs": "Bordák száma",
"Body scale": "A test méretaránya",
"Add to last rib": "Hozzáadás az utolsó bordához",
"Deepen body": "A test mélyítése",
"From soundboard to back at body end in mm. In case of round body or angled back, this stays constant.":
	"A fedőlaptól a hátig a test végénél, mm-ben. Kerek test vagy dőlt hát esetén is állandó.",
"Angle of back from body end to neck end in degrees.": "A hát szöge a test végétől a nyak felőli végéig, fokban.",
"Height of arc from end of body to heel in mm.": "Az ív magassága a test végétől a nyaktőig, mm-ben.",
"Height of arc from side to side in mm.": "Az ív magassága oldaltól oldalig, mm-ben.",
"How much narrower a rib should be at the neck end": "Mennyivel legyen keskenyebb a borda a nyak felőli végén",
"How bent each rib should be widthwise": "Mennyire legyen hajlított a borda keresztirányban",
"Width of the body.": "A test szélessége.",
"Length of the body; Where side arcs meet on the center line, disregarding potential shoulder arc.":
	"A test hossza: ahol az oldalívek a középvonalon találkoznak, az esetleges vállívet nem számítva.",
"Mensur to base body size on; Divided by 9 to obtain the length of one unit.":
	"A testméret alapjául szolgáló menzúra; 9-cel osztva adja egy egység hosszát.",
"Radius of the arc that gives the shape of the lute's bottom. Larger values make the bottom flatter.":
	"A lant alsó részének alakját adó ív sugara. Nagyobb érték laposabb aljat ad.",
"Radius of the arc that gives the shape of the lute's side.": "A lant oldalának alakját adó ív sugara.",
"Radius of the arc that connects the bottom and the side.": "Az alsó részt és az oldalt összekötő ív sugara.",
"Radius of shoulder arc.": "A vállív sugara.",
"How much the shoulder arc should shorten the body.": "Mennyivel rövidítse a vállív a testet.",
"Later lutes were designed with a wider body, by inserting an imaginary wedge between the body shapes.":
	"A későbbi lantokat szélesebb testtel tervezték: a test két fele közé egy képzeletbeli éket illesztettek.",
"How close to the center the ribs' ends are under the endclasp. Values 0...1; 0 being as close together as possible.":
	"Milyen közel vannak a bordák végei a középhez a zárólemez alatt. Értéke 0…1; 0 = a lehető legközelebb egymáshoz.",
"The depth and shape of the bowl will be determined by the shape of the soundboard. If you want all the ribs to be the same shape, also set body cross-section bulge to 2 and rib spread to 0.":
	"A test mélységét és alakját a fedőlap alakja határozza meg. Ha minden bordát egyforma alakúra szeretne, állítsa a keresztmetszet domborúságát 2-re, a bordák szétterülését 0-ra.",
"Resize body shape for the side view shape.": "A testforma átméretezése az oldalnézeti alakhoz.",
"More mass towards the neck.": "Több tömeg a nyak felé.",
"How much bulge to apply to the body cross section at the wider end, tapers to semicircular towards the neck. Values 2...3; 2 is semicircular.":
	"Mennyire legyen domború a keresztmetszet a szélesebb végen; a nyak felé félkörré szűkül. Értéke 2…3; 2 = félkör.",
"Deepen body, moving all ribs downward, like on a mandolino": "A test mélyítése az összes borda lefelé tolásával, mint a mandolinón",

// Rosette
"Rosette": "Rozetta",
"Select rosette type": "Rozettatípus kiválasztása",
"Single rosette": "Egy rozetta",
"Triple rosette": "Három rozetta",
"Scale rosette by": "Rozetta méretezése",
"percent": "százalék",

// Neck
"Neck": "Nyak",
"Pegbox / Extension style": "Kulcsszekrény / hosszabbítás típusa",
"Renaissance": "Reneszánsz",
"Renaissance /w chanterelle rider": "Reneszánsz kantarell-segédkulcsszekrénnyel",
"13c Bass rider (Hoffmann)": "13 húrsoros basszus-segédkulcsszekrény (Hoffmann)",
"13c Bass rider (Edlinger)": "13 húrsoros basszus-segédkulcsszekrény (Edlinger)",
"Dutch 12c double head": "Holland 12 húrsoros dupla fej",
"Swan neck (Hoffmann 1740)": "Hattyúnyak (Hoffmann 1740)",
"Swan neck (Rauche)": "Hattyúnyak (Rauche)",
"Jauck Mandora Extension": "Jauck mandora-hosszabbítás",
"Theorbo - Italian": "Teorba – olasz",
"Theorbo - small French": "Teorba – kis francia",
"Archlute - Harz": "Archilant – Harz",
"Archlute - Koch": "Archilant – Koch",
"Archlute - small Koch": "Archilant – kis Koch",
"Theorbo - English": "Teorba – angol",
"Mandolino": "Mandolino",
"Colascione": "Colascione",
"Giorgio Sellas 1624 guitar": "Giorgio Sellas 1624 gitár",
"Jean Voboam 1687 guitar": "Jean Voboam 1687 gitár",
"Chambure Vihuela": "Chambure vihuela",
"Pegbox Angle": "A kulcsszekrény szöge",
"Pegbox curve": "A kulcsszekrény íve",
"Foldable extension": "Összecsukható hosszabbítás",
"Fingerboard join style": "A fogólap csatlakozása",
"Fangs": "Fogak",
"Small fangs": "Kis fogak",
"Long narrow fangs": "Hosszú, keskeny fogak",
"Flat": "Egyenes",
"Limit": "Korlát",
"Set": "Beállít",
"neck width at body joint": "nyakszélesség a test csatlakozásánál",
"Add or substract from width at nut": "Hozzáadás a nyeregnél mért szélességhez vagy levonás belőle",
"Nut angle": "A nyereg szöge",
"This only affects renaissance style pegboxes.": "Ez csak a reneszánsz kulcsszekrényekre hat.",
"The fingerboard nut angle is normally perpendicular to the centerline of the neck; This input allows you to adjust it.":
	"A fogólap nyerge rendesen merőleges a nyak középvonalára; itt ezt módosíthatja.",

// Strings
"Strings": "Húrok",
"Chanterelles (single top strings)": "Kantarellek (egyes felső húrok)",
"Number of Nuts": "Nyergek száma",
"Name": "Név",
"Mensur": "Menzúra",
"Unit": "Egység",
"# Courses": "Húrsorok",
"All Singles": "Mind egyes",
"Fingerboard": "Fogólap",
"Bass rider": "Basszus-segédkulcsszekrény",
"Extension": "Hosszabbítás",
"absolute mm": "abszolút mm",
"Draw every string": "Minden húr megrajzolása",

// Bridge
"Bridge": "Húrláb",
"Bridge style": "A húrláb típusa",
"Bridge offset (move toward neck by)": "Húrláb eltolása (a nyak felé)",
"Bridge sideways offset": "Húrláb oldalirányú eltolása",
"Bridge angle": "A húrláb szöge",
"Bridge String Spacing": "Húrtávolság a húrlábon",
"String spacing preset": "Előre beállított húrtávolság",
"Baroque 11c": "Barokk 11 húrsoros",
"Baroque 13c": "Barokk 13 húrsoros",
"Theorbo single": "Teorba, egyes húrok",
"Archlute": "Archilant",
"Guitar": "Gitár",
"Distance between courses on the bridge": "A húrsorok távolsága a húrlábon",
"between the strings of a course": "egy húrsor húrjai között",
"between chanterelles": "a kantarellek között",
"between bass courses": "a basszus húrsorok között",
"Nut String Spacing": "Húrtávolság a nyeregnél",
"between courses": "a húrsorok között",
"between the strings": "a húrok között",
"Spacing for bass (7th onwards)": "Basszus húrtávolság (a 7.-től)",

// Analysis
"Analysis": "Elemzés",
"Experimental feature. Results have not been verified. Only available for \"With Forms\" drawing modes.":
	"Kísérleti funkció, az eredményeket nem ellenőrizték. Csak a formákat is tartalmazó rajzmódokban érhető el.",
"Save current": "Jelenlegi mentése",
"Export CSV": "CSV exportálása",
"Body Area m²": "Test felülete m²",
"B. Volume l": "T. térfogata l",
"SB Area m²": "Fedőlap felülete m²",
"Normal map": "Normáltérkép",
"Reflections (Z-axis)": "Visszaverődések (Z tengely)",
"Reflections (bridge)": "Visszaverődések (húrláb)",
"Hide maps": "Térképek elrejtése",
"Redraw map after setting change": "Térkép újrarajzolása beállításváltozás után",
"Save current values in table below for later comparison": "A jelenlegi értékek mentése a lenti táblázatba későbbi összehasonlításhoz",
"Where do the perpendiculars, or normals, of each ribs segment point to on the soundboard": "Hová mutatnak a fedőlapon az egyes bordaszakaszok merőlegesei (normálisai)",
"Where do rays shot along the z-axis reflect back on the soundboard. Color shows how many reflections it took to get to the soundboard.":
	"Hová verődnek vissza a fedőlapon a Z tengely mentén kilőtt sugarak. A szín mutatja, hány visszaverődés kellett a fedőlapig.",
"Where do rays shot from the bridge reflect back on the soundboard. Color shows how many reflections it took to get to the soundboard.":
	"Hová verődnek vissza a fedőlapon a húrlábtól kilőtt sugarak. A szín mutatja, hány visszaverődés kellett a fedőlapig.",

// Case
"Case": "Tok",
"Draw case on top of instrument": "A tok rajzolása a hangszer fölé",
"Case style - lid": "Tok típusa – fedél",
"Rectilinear": "Egyenes vonalú",
"Curvy - sharp tube joint": "Íves – éles csőcsatlakozás",
"Curvy - smooth tube joint": "Íves – sima csőcsatlakozás",
"Case style - side": "Tok típusa – oldal",
"Curvy /w pegbox": "Íves, kulcsszekrénnyel",
"Curvy /w tube": "Íves, csővel",
"Lute bowl /w pegbox": "Lanttest, kulcsszekrénnyel",
"Lute bowl /w tube": "Lanttest, csővel",
"Neck tube style": "A nyakcső típusa",
"Bent - box": "Hajlított – doboz",
"Bent - curvy": "Hajlított – íves",
"Straight": "Egyenes",
"Telescopic": "Teleszkópos",
"Plywood thickness": "Rétegelt lemez vastagsága",
"Foam thickness": "Habvastagság",
"Automatic size": "Automatikus méret",
"Attempt to automatically figure out case size": "A tok méretének automatikus meghatározása",
"Width": "Szélesség",
"Length": "Hossz",
"Depth": "Mélység",
"Tube width": "Cső szélessége",
"Tube Depth": "Cső mélysége",
"Pegbox Depth": "Kulcsszekrény mélysége",
"Pegbox area Length": "Kulcsszekrényrész hossza",
"Lower radius": "Alsó sugár",
"Tube radius": "Cső sugara",
"Bowl side radius": "Lanttest oldalsugara",
"Bowl radius center": "Lanttest középsugara",

// Toolbar and 3D view
"Zoom in. Also available on mousewheel.": "Nagyítás. Az egérgörgővel is lehet.",
"Zoom out. Also available on mousewheel.": "Kicsinyítés. Az egérgörgővel is lehet.",
"Undo. Also ctrl+z": "Visszavonás. Ctrl+Z is.",
"Redo. Also ctrl+shift+z or ctrl+y": "Újra. Ctrl+Shift+Z vagy Ctrl+Y is.",
"Measure Tool. Normally middle mouse button or wheel, click here to temporarily use left click instead.":
	"Mérőeszköz. Rendesen a középső egérgombbal vagy a görgővel; ide kattintva ideiglenesen a bal gombbal mérhet.",
"View instrument in glorious, futuristic 3D.": "A hangszer megtekintése lenyűgöző, futurisztikus 3D-ben.",
"Exit 3D view": "Kilépés a 3D nézetből",
"zoom": "nagyít",
"undo": "vissza",
"redo": "újra",
"measure": "mérés",
"view": "nézet",

// Text drawn into the drawing
"Nut": "Nyereg",
"Model": "Modell",
"Stringing": "Húrozás",
"Neck Size": "Nyakméret",
"Neckjoint Angle": "Nyakcsatlakozás szöge",
"Extension Length": "Hosszabbítás hossza",
"Rosette Width": "Rozetta szélessége",
"Body Size": "Testméret",
"Shipping Size": "Szállítási méret",
"Total Length": "Teljes hossz",
"Folded Length": "Összecsukott hossz",
"Body Shape": "Testforma",
"Created on": "Készült",
"Constructed": "Szerkesztett",
"center": "közép",
"edge": "perem",

// CAM export dialog
"Export parts for CAM": "Alkatrészek exportálása CAM-hez",
"Instrument (every build)": "Hangszer (minden építéshez)",
"Foam-core mould": "Habmagos forma",
"Carved mould": "Faragott forma",
"Simple mould": "Egyszerű forma",
"Simple mould 2": "Egyszerű forma 2",
"Reference templates": "Ellenőrző sablonok",
"Body / soundboard outline": "Test / fedőlap körvonala",
"Flat rib templates": "Kiterített bordasablonok",
"Rib supports": "Bordatartók",
"Foam core supports and blocks": "Habmagos tartók és tőkék",
"Carved form: bottom and middle": "Faragott forma: alap- és középlap",
"Cross supports": "Kereszttartók",
"Simple form: bottom and middle": "Egyszerű forma: alap- és középlap",
"Simple form cross supports": "Egyszerű forma kereszttartói",
"Simple form 2: bottom and middle": "Egyszerű forma 2: alap- és középlap",
"Simple form 2 cross supports": "Egyszerű forma 2 kereszttartói",
"Cross section and neck block templates": "Keresztmetszet- és nyaktőkesablonok",
"Files": "Fájlok",
"One per group": "Csoportonként egy",
"One per part set": "Alkatrészkészletenként egy",
"All parts in one file": "Minden alkatrész egy fájlban",
"Include parts guide (HTML)": "Alkatrész-útmutató (HTML) mellékelése",
"Mirrored pairs: ribs 1 and up, rib supports, carved cross supports": "Tükrözött párok: az 1. bordától, bordatartók, faragott forma kereszttartói",
"Include markings (blue open lines)": "Jelölések mellékelése (kék nyitott vonalak)",
"Router corner relief on mould joints, bit diameter": "Sarokkiszabadítás a forma illesztéseinél, maróátmérő",
"board moulds": "lapformák",
"mm, foam-core plywood": "mm, habmagos rétegelt lemez",
"Max layout width": "Elrendezés max. szélessége",
"Gap between parts": "Hézag az alkatrészek között",
"Format": "Formátum",
"SVG": "SVG",
"DXF (R12)": "DXF (R12)",
"SVG and DXF": "SVG és DXF",
"DXF curves": "DXF görbék",
"Arcs and lines": "Ívek és szakaszok",
"Line segments only": "Csak szakaszok",
"DXF curve tolerance": "DXF görbetűrés",
"Close": "Bezárás",
"Exported": "Exportálva",
"Nothing to export": "Nincs mit exportálni",
"inside corners too tight for the bit": "belső sarok túl szűk a marónak",
"Parts of the lute itself.": "Maga a lant alkatrészei.",
"Mould skeleton of rib supports and notched supports between the end blocks.": "Formaváz bordatartókból és bevágott tartókból a két végtőke között.",
"Mould skeleton of a bottom board and a middle board with cross supports standing in their slots.": "Formaváz alaplapból és középlapból, a helyükön álló kereszttartókkal.",
"Simpler skeleton mould: bottom and middle boards with a cross support at the widest point and a neck block face.": "Egyszerűbb vázforma: alap- és középlap, kereszttartó a legszélesebb pontnál és nyaktőke-homlok.",
"Second simple skeleton mould: bottom and middle boards with several cross supports and a neck block face.": "Második egyszerű vázforma: alap- és középlap több kereszttartóval és nyaktőke-homlokkal.",
"For checking and hand shaping, not mould parts.": "Ellenőrzéshez és kézi alakításhoz, nem formaelemek.",
"Soundboard / body outline (front view), joined into one closed outline.": "A fedőlap / test körvonala (elölnézet), egyetlen zárt körvonallá egyesítve.",
"Ribs unfolded flat: centre rib C, the numbered ribs and the two end clasp pieces. The rib strips are cut to these.": "Kiterített bordák: a C középső borda, a számozott bordák és a zárólemez. A bordacsíkokat ezekre kell vágni.",
"One board per rib joint line of one half (joint 0 = beside the centre rib, the last = soundboard edge), following the joint from tail to neck block, one per side. Small notches mark the supports. Drawn soundboard edge up.":
	"Az egyik fél minden bordaillesztési vonalához egy lap (0. illesztés = a középső borda mellett, az utolsó = a fedőlap pereme), amely az illesztést követi a fartól a nyaktőkéig, oldalanként egy. A kis bevágások jelölik a tartókat. A fedőlap pereme felül van.",
"Notched plywood supports and the butt (tail) and neck blocks.": "Bevágott rétegelt lemez tartók, valamint a far- és a nyaktőke.",
"Bottom board (body outline) and middle profile board. The cross supports stand on them, their places are marked.": "Alaplap (a test körvonala) és középső profillap. A kereszttartók ezeken állnak, a helyük jelölve van.",
"Quarter cross sections, one per side, standing on the bottom board against the middle board at their marked places: butt 1-3 at the tail, widest point, main stations, last support and neck block face. Wide necks (90 mm and more) add adaptor and helper faces.":
	"Negyed keresztmetszetek, oldalanként egy, amelyek az alaplapon a középlapnak támaszkodva állnak a jelölt helyükön: 1–3. fartartó, legszélesebb pont, fő állomások, utolsó tartó és nyaktőke-homlok. Széles nyaknál (90 mm-től) illesztő- és segédhomlok is van.",
"Bottom and middle boards of the simple mould, with the mortises and notches for the middle board and cross support.": "Az egyszerű forma alap- és középlapja, a középlap és a kereszttartó csaplyukaival és bevágásaival.",
"Cross support at the widest point and the neck block face of the simple mould.": "Az egyszerű forma kereszttartója a legszélesebb pontnál és nyaktőke-homloka.",
"Bottom and middle boards of the second simple mould, with the mortises and notches for the middle board and cross supports.": "A második egyszerű forma alap- és középlapja, a középlap és a kereszttartók csaplyukaival és bevágásaival.",
"Cross supports and the neck block face of the second simple mould.": "A második egyszerű forma kereszttartói és nyaktőke-homloka.",
"Cross section at the widest point, neck block joint outline and neck block side template, for checking and hand shaping.": "Keresztmetszet a legszélesebb pontnál, a nyaktőke illesztési körvonala és oldalsablonja, ellenőrzéshez és kézi alakításhoz.",
"Rib templates, rib supports and carved mould cross supports cover half the bowl. Adds a mirrored copy of each (all ribs except the centre rib), labelled m in the guide.":
	"A bordasablonok, a bordatartók és a faragott forma kereszttartói a test felét fedik le. Mindegyikhez tükrözött másolatot ad (a középső borda kivételével minden bordához), az útmutatóban m jellel.",
"A router bit leaves its radius in inside corners, so the square edge of the mating part would not seat. Square inside corners of mould parts get a dog-bone, or a T-bone where there is no room. Set the diameter of the bit that cuts the parts.":
	"A maró a belső sarkokban a saját sugarát hagyja, így a csatlakozó alkatrész szögletes éle nem ülne fel. A formaelemek derékszögű belső sarkai kutyacsont-, hely hiányában T-kiszabadítást kapnak. Adja meg az alkatrészeket vágó maró átmérőjét.",
"The foam-core notches are 3.8 mm wide, so the bit must be smaller than that": "A habmagos forma bevágásai 3,8 mm szélesek, ezért a marónak ennél kisebbnek kell lennie",

// CAM parts guide
"CAM export guide": "CAM export útmutató",
"File:": "Fájl:",
"part": "alkatrész",
"parts": "alkatrész",
"DXF layers": "DXF rétegek",
"Corner relief for a": "Sarokkiszabadítás",
"mm bit:": "mm-es maróhoz:",
"dog-bones": "kutyacsont",
"T-bones": "T-kiszabadítás",
"Every build needs the instrument parts and <b>one</b> of the two mould types. Solid = cut outline, dashed = marking, each set scaled to fit. Units mm, 1:1 in the DXF/SVG files.":
	"Minden építéshez kellenek a hangszer alkatrészei és a formatípusok közül <b>egy</b>. Folytonos = vágási körvonal, szaggatott = jelölés, minden készlet a helyhez méretezve. Mértékegység mm, a DXF/SVG fájlokban 1:1.",
"Generated by Lute Designer": "Készítette a Lute Designer",
"joint": "illesztés",
"end clasp": "zárólemez"
};

// Strings with numbers in them: [English pattern, Hungarian replacement]
var I18N_HU_PATTERNS = [
	[/^Nut (\d+)$/, "$1. nyereg"],
	[/^Nut (\d+): (.*)$/, "$1. nyereg: $2"],
	[/^Nut: (.*)$/, "Nyereg: $1"],
	[/^(\d+)(?:st|nd|rd|th): (.*)$/, "$1.: $2"],
	[/^(\d+) \(center\)$/, "$1 (közép)"],
	[/^(\d+) \(edge\)$/, "$1 (perem)"],
	[/^Pos: (.*)$/, "Hely: $1"],
	[/^Dist: (.*)$/, "Táv: $1"],
	[/^Angle: (.*)$/, "Szög: $1"],
	[/^(.*) (\d+)% with (\d+) ribs(, foldable)?$/, function(m, a, b, c, f){ return a+" "+b+"%, "+c+" bordával"+(f ? ", összecsukható" : ""); }],
	[/^(.*) deg$/, "$1°"],
	[/^You dropped file "(.*)"\. This should not take long\.$/, "A behúzott fájl: „$1”. Ez nem tart sokáig."],
	[/^The file "(.*)" does not contain the necessary information to load into the editor\.$/, "A(z) „$1” fájl nem tartalmazza a szerkesztőbe töltéshez szükséges adatokat."],
	[/^The file "(.*)" is not an SVG file created by Lute Designer and does not contain the necessary information to load into the editor\.$/,
		"A(z) „$1” fájl nem a Lute Designerrel készült SVG, és nem tartalmazza a szerkesztőbe töltéshez szükséges adatokat."],
	[/^Project Title: ?$/, "Projekt címe: "],
	[/^Form material thickness ?$/, "A forma anyagvastagsága "]
];

var I18N = {lang:"en", dicts:{hu:I18N_HU}, patterns:{hu:I18N_HU_PATTERNS}};

function i18n_detect(){
	var saved = null;
	try { saved = localStorage.getItem(I18N_STORE); } catch(e){}
	if (saved && I18N_LANGS.some(function(l){ return l[0] == saved; })) return saved;
	var nav = (navigator.languages && navigator.languages[0]) || navigator.language || "en";
	return /^hu\b/i.test(nav) ? "hu" : "en";
}

function _t(s){
	// Translate an English UI string to the current language; unknown strings stay English
	if (I18N.lang == "en" || s === undefined || s === null) return s;
	var key = String(s), dict = I18N.dicts[I18N.lang] || {};
	if (Object.prototype.hasOwnProperty.call(dict, key)) return dict[key];
	var pats = I18N.patterns[I18N.lang] || [];
	for (var i=0; i<pats.length; i++){
		if (pats[i][0].test(key)) return key.replace(pats[i][0], pats[i][1]);
	}
	return key;
}

function i18n_textkey(s){ return s.replace(/\s+/g, " ").trim(); }

function i18n_skip(el){
	// The drawing (redrawn constantly, translated through _t()), code output and user input are not translated
	for (var n=el; n; n=n.parentElement){
		if (n.id == "designer-canvas" || n.id == "output_textbox" || n.isContentEditable) return true;
		if (/^(SCRIPT|STYLE|TEXTAREA|CODE|PRE)$/.test(n.tagName)) return true;
		if (n.classList && n.classList.contains("notranslate")) return true;
	}
	return false;
}

function i18n_translatenode(node){
	// Text node: keep the English original so the language can be switched back
	if (node.__i18n_en === undefined || node.nodeValue != node.__i18n_out) node.__i18n_en = node.nodeValue;
	var en = node.__i18n_en, key = i18n_textkey(en);
	if (!key) return;
	var tr = _t(key);
	var out = tr === key ? en : en.match(/^\s*/)[0] + tr + en.match(/\s*$/)[0]; // keep the spacing around the text
	if (node.nodeValue != out) node.nodeValue = out;
	node.__i18n_out = out;
}

function i18n_translateattrs(el){
	["title", "placeholder", "aria-label"].forEach(function(a){
		if (!el.hasAttribute || !el.hasAttribute(a)) return;
		var store = "__i18n_" + a, outstore = "__i18n_out_" + a, v = el.getAttribute(a);
		if (el[store] === undefined || v != el[outstore]) el[store] = v;
		var en = el[store], tr = _t(i18n_textkey(en));
		var out = tr === i18n_textkey(en) ? en : tr;
		if (v != out) el.setAttribute(a, out);
		el[outstore] = out;
	});
	if (el.tagName == "INPUT" && /^(button|submit|reset)$/i.test(el.type)){
		if (el.__i18n_value === undefined || el.value != el.__i18n_out_value) el.__i18n_value = el.value;
		var tv = _t(i18n_textkey(el.__i18n_value));
		if (el.value != tv) el.value = tv;
		el.__i18n_out_value = tv;
	}
}

function i18n_apply(root){
	root = root || document.body;
	if (!root) return;
	if (root.nodeType == 3){ if (root.parentElement && !i18n_skip(root.parentElement)) i18n_translatenode(root); return; }
	if (root.nodeType != 1 || i18n_skip(root)) return;
	i18n_translateattrs(root);
	var w = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {acceptNode:function(n){
		if (n.nodeType == 1 && (n.id == "designer-canvas" || n.id == "output_textbox" || /^(SCRIPT|STYLE|TEXTAREA)$/.test(n.tagName) || (n.classList && n.classList.contains("notranslate"))))
			return NodeFilter.FILTER_REJECT;
		return NodeFilter.FILTER_ACCEPT;
	}});
	var n;
	while ((n = w.nextNode())){
		if (n.nodeType == 3) i18n_translatenode(n);
		else i18n_translateattrs(n);
	}
}

var i18n_observer = null;
function i18n_watch(){
	// Translate interface elements as the program adds or changes them (dialogs, tables, buttons)
	if (i18n_observer || !window.MutationObserver || !document.body) return;
	i18n_observer = new MutationObserver(function(muts){
		if (I18N.lang == "en") return;
		i18n_observer.disconnect();
		muts.forEach(function(m){
			if (m.type == "childList") m.addedNodes.forEach(function(n){ i18n_apply(n); });
			else if (m.type == "characterData") i18n_apply(m.target);
			else if (m.type == "attributes") i18n_translateattrs(m.target);
		});
		i18n_observer.observe(document.body, {childList:true, subtree:true, characterData:true, attributes:true, attributeFilter:["title", "placeholder", "value"]});
	});
	i18n_observer.observe(document.body, {childList:true, subtree:true, characterData:true, attributes:true, attributeFilter:["title", "placeholder", "value"]});
}

function i18n_setlang(lang, redraw){
	I18N.lang = lang;
	try { localStorage.setItem(I18N_STORE, lang); } catch(e){}
	document.documentElement.setAttribute("lang", lang);
	i18n_apply(document.body);
	i18n_watch();
	var sel = document.getElementById("languageselect");
	if (sel) sel.value = lang;
	// Text in the drawing and the window title come from the drawing code
	if (redraw && typeof makedrawing == "function") makedrawing();
}

function i18n_selector(){
	// Language choice
	if (document.getElementById("languageselect")) return;
	var label = document.createElement("label");
	label.className = "languagelabel";
	label.appendChild(document.createTextNode("Language "));
	var sel = document.createElement("select");
	sel.id = "languageselect";
	sel.className = "notranslate"; // Language names are shown in their own language
	I18N_LANGS.forEach(function(l){ var o = document.createElement("option"); o.value = l[0]; o.textContent = l[1]; sel.appendChild(o); });
	sel.value = I18N.lang;
	sel.onchange = function(){ i18n_setlang(sel.value, true); };
	label.appendChild(sel);
	// Under the program name, which is always visible
	var host = document.getElementById("logo_area");
	if (host){ label.style.cssText = "display:block; text-align:center; font-size:0.85em; margin:0.2em 0 0.4em;"; host.appendChild(label); }
	else document.body.insertBefore(label, document.body.firstChild);
	i18n_apply(label);
}

I18N.lang = i18n_detect();
document.documentElement.setAttribute("lang", I18N.lang);
// The loading splash is already in the page when this script runs
if (I18N.lang != "en") i18n_apply(document.body);
document.addEventListener("DOMContentLoaded", function(){
	i18n_selector();
	i18n_apply(document.body);
	i18n_watch();
});

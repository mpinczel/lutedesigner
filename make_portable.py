"""Build a portable Lute Designer: a folder (and zip) that runs by opening index.html, no server or install needed.

The web version is index.php, whose only PHP is including lutedesigner.html. This writes that page out as
plain HTML next to the scripts, styles, images and three.js, so a browser can open it straight from disk.

    python make_portable.py            -> portable/LuteDesigner/ and portable/LuteDesigner.zip
"""
import html as htmllib, os, re, shutil, zipfile

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "portable", "LuteDesigner")

# Files the page needs besides index.html
ASSETS = [r"lutedesigner.*\.js$", r"lutedesigner\.css$", r"\.(png|svg|ico)$", r"^LICENSE$", r"^README\.md$"]
SKIP = {"lutedesigner_.html", "make_portable.py", "devserver.py"}

README = """Lute Designer - portable version
================================

Open index.html in a web browser (Chrome, Edge or Firefox). Nothing needs to be installed and no internet
connection is needed. Copy the whole folder, for example to a USB stick, to use it on another computer.

Your drawings live in the address bar: bookmark the page or copy the address to keep a drawing.

---

Lute Designer - hordozható változat
==================================

Nyissa meg az index.html fájlt egy böngészőben (Chrome, Edge vagy Firefox). Semmit sem kell telepíteni, és
internet sem kell hozzá. Másik gépen való használathoz másolja át a teljes mappát, például pendrive-ra.

A rajz a címsorban van tárolva: a megtartásához tegye könyvjelzőbe az oldalt, vagy másolja ki a címet.
"""


def page():
    # index.php with its include resolved
    php = open(os.path.join(HERE, "index.php"), encoding="utf-8").read()
    body = open(os.path.join(HERE, "lutedesigner.html"), encoding="utf-8").read()
    html = re.sub(r"<\?php\s*include\(\"lutedesigner\.html\"\);\s*\?>", lambda m: body, php)
    if "<?php" in html:
        raise SystemExit("index.php has PHP besides the include, update make_portable.py")
    # The three.js example files are classic scripts; browsers refuse type="module" scripts opened from disk
    html = html.replace(' type="module"></script>', '></script>')
    # The shape libraries (body.svg etc.) are read through <object> elements, which a page opened from disk may not
    # look into (every file counts as its own origin). An iframe's srcdoc document shares the page's origin, so the
    # SVGs go inline into iframes, and iframes get the getSVGDocument() the code calls on the objects.
    def inline(m):
        attrs, src = m.group(1) + m.group(3), m.group(2)
        svg = open(os.path.join(HERE, src), encoding="utf-8").read()
        svg = re.sub(r"^\s*<\?xml[^>]*\?>", "", svg)
        attrs = re.sub(r'\s*type="image/svg\+xml"', "", attrs)
        return '<iframe%s srcdoc="%s"></iframe>' % (attrs, htmllib.escape(svg, quote=True))
    html, n = re.subn(r'<object([^>]*?)\sdata="([^"]+\.svg)"([^>]*)></object>', inline, html)
    if n != 4:
        raise SystemExit("expected 4 SVG objects, found %d" % n)
    # The logo lives on the website (../includes/), use the program icon instead
    html = html.replace('src="../includes/2014logoontopopt_s.png"', 'src="LDicon3.png"')
    shim = '<script>HTMLIFrameElement.prototype.getSVGDocument = function(){ return this.contentDocument; };</script>'
    html = html.replace("<head>", "<head>\n" + shim, 1)
    return html


def build():
    if os.path.isdir(OUT):
        shutil.rmtree(OUT)
    os.makedirs(OUT)
    with open(os.path.join(OUT, "index.html"), "w", encoding="utf-8", newline="") as f:
        f.write(page())
    n = 1
    for name in sorted(os.listdir(HERE)):
        if name in SKIP or not os.path.isfile(os.path.join(HERE, name)):
            continue
        if any(re.search(p, name) for p in ASSETS):
            shutil.copy2(os.path.join(HERE, name), OUT)
            n += 1
    shutil.copytree(os.path.join(HERE, "three"), os.path.join(OUT, "three"))
    with open(os.path.join(OUT, "README-portable.txt"), "w", encoding="utf-8") as f:
        f.write(README)
    zpath = os.path.join(os.path.dirname(OUT), "LuteDesigner.zip")
    with zipfile.ZipFile(zpath, "w", zipfile.ZIP_DEFLATED) as z:
        for root, _, files in os.walk(OUT):
            for fn in files:
                full = os.path.join(root, fn)
                z.write(full, os.path.relpath(full, os.path.dirname(OUT)))
    print("%d files + three.js -> %s" % (n, OUT))
    print("zip: %s (%.1f MB)" % (zpath, os.path.getsize(zpath) / 1e6))


if __name__ == "__main__":
    build()

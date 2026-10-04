"""Local development server for Lute Designer (no PHP needed).

Serves the repo over HTTP and emulates the two PHP pages:
  /fullmode.php  -> full version (index.php with $fullmode set)
  /index.php     -> limited version
Everything else is served as a static file.

Usage:  python devserver.py [port]   (default 8000)
"""
import http.server
import os
import re
import sys

ROOT = os.path.dirname(os.path.abspath(__file__))
PHP_BLOCK = re.compile(r"<\?php(.*?)\?>", re.S)
ECHO_STRING = re.compile(r"echo\('(.*?)'\);", re.S)


def render_index(fullmode):
    with open(os.path.join(ROOT, "index.php"), encoding="utf-8") as f:
        src = f.read()

    def replace(match):
        code = match.group(1)
        include = re.search(r'include\("([^"]+)"\)', code)
        if include:
            with open(os.path.join(ROOT, include.group(1)), encoding="utf-8") as f:
                return f.read()
        if "isset($fullmode)" in code:
            echo = ECHO_STRING.search(code)
            return echo.group(1) if (fullmode and echo) else ""
        return ""

    return PHP_BLOCK.sub(replace, src)


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def do_GET(self):
        path = self.path.split("?")[0].split("#")[0]
        if path in ("/", "/fullmode.php", "/index.php"):
            body = render_index(fullmode=(path != "/index.php")).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(body)
            return
        super().do_GET()

    def end_headers(self):
        # Always serve fresh JS/SVG while developing
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    print(f"Lute Designer: http://localhost:{port}/fullmode.php")
    http.server.ThreadingHTTPServer(("localhost", port), Handler).serve_forever()

# Lute Designer
Online parametric lute design aid
## Available at:
[Lutedesigner](https://www.niskanenlutes.com/lutedesigner/fullmode.php)
## Portable version
`python make_portable.py` builds `portable/LuteDesigner/` (and a zip of it): the page with its scripts, styles and
images, which runs by opening `index.html` in a browser. No server, PHP or install is needed, so the folder can be
copied to any computer, for example on a USB stick.
## Languages
The interface is available in English and Hungarian (Magyar). Choose the language under the program name; the
choice is remembered, and a Hungarian browser starts in Hungarian. Text drawn into the drawing (fret positions,
info box) and the CAM parts guide follow the chosen language.

To add a language, add a dictionary keyed by the English text to `lutedesigner-i18n.js` (see `I18N_HU`), list it
in `I18N_LANGS`, and add patterns for strings with numbers in them (see `I18N_HU_PATTERNS`). Strings built in
JavaScript go through `_t()`.
## Author
* Lauri Niskanen, Luthier: Initial work
## License
This project is licensed under the GPLv3 License.
## Contributing
Contributions are welcomed. A question for Mac users: Do the mouse controls work?
## Acknowledgments
* Thanks to [progers](https://github.com/progers/pathseg) for the SVGpathseg polyfill, without which some SVG operations would not be possible after discontinued browser support

# Lute Designer
Online parametric lute design aid
## Original version
Lute Designer is written by Lauri Niskanen and available at
[niskanenlutes.com/lutedesigner](https://www.niskanenlutes.com/lutedesigner/fullmode.php).
## This modified version
This repository is a modified version of Lute Designer, maintained by Mate Pinczel. It is not an official release
and is not maintained by Lauri Niskanen. It is based on the live niskanenlutes.com code (imported October 2026,
commit `3b1e24f`); the earlier work on the 2020 GitHub code is on the `legacy` branch.

Changes made in October 2026 (see the git history for every change):
* **CAM export** (`lutedesigner-camexport.js`, new): construction parts as clean 1:1 SVG and DXF for CAM
  software such as Alphacam, grouped by use, with mirrored pairs, joints cut into the simple moulds, router corner
  relief (dog-bones) on mould joints, outline clean-up, and an HTML parts guide.
* **Fixes:** rib joint trimming at the end clasp (`lutedesigner-body.js`), arc to bezier accuracy
  (`lutedesigner-helper.js`), editor fields and settings kept in sync (`lutedesigner.js`), and carved mould cross
  supports kept from overlapping (`lutedesigner-form.js`).
* **Hungarian interface** (`lutedesigner-i18n.js`, new; translation calls in the drawing and editor files).
* **Portable version** (`make_portable.py`, new) and a local development server (`devserver.py`, new).

Modified files carry a "Modified 2026 by Mate Pinczel" line in their header.
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
## Authors
* Lauri Niskanen, Luthier: Lute Designer
* Mate Pinczel: the modifications listed above (2026)
## License
This project is licensed under the GPLv3 License (see `LICENSE`). The modifications are released under the same
license. three.js (in `three/`) is under the MIT License, see `three/LICENSE`.
## Contributing
Contributions are welcomed. A question for Mac users: Do the mouse controls work?
## Acknowledgments
* Thanks to [progers](https://github.com/progers/pathseg) for the SVGpathseg polyfill, without which some SVG operations would not be possible after discontinued browser support

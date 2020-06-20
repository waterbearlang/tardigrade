# Waterbear

Waterbear is a friendly block-based programming language. It has been around at http://waterbearlang.com/ for some time in experimental form. This is an attempt to fix longstanding issues with that version and push it for a 1.0 release.

Among the goals of this rewrite are:

* Bring back the toolkit nature of Waterbear, allowing people to easily create their own block-based languages with it.
* Make the UI more powerful, allowing customizations and support for tutorials and walkthroughs
* Improved embedding, allowing Waterbear scripts to be embedded in any web page
* Vastly improved text output producing scripts which can dropped into a browser and run without further work
* Round-trip from script mode using the Moonshine language, a text-based programming language designed to map well to blocks
* Improve undo/redo, copy/paste and other infrastructure
* Compile to JS for speed or run block-by block for debugging
* Collaborative: invite others to contribute to your Waterbear projects
* Many, many more example programs and tutorials

## Libraries and Tools

Waterbear is a (big) part of the [Sketchdance suite](https://hackmd.io/@dethe/rJHyDz3eS) of tools and uses several projects from that:

* [Moonshine](https://hackmd.io/MPFE8cvQQOeP1bFb54FqCg) A text-based language designed to map to blocks
* Tardigrade: General-purpose block language toolkit.
* Moss Piglet: GUI toolkit for Sketchdance for building declarative and customizable programmign and creation tools.
* Alley: Optional server-side connector to allow Waterbear to work with external systems beyond web pages, like Arduino, Raspberry Pi, etc.

Outside of Sketchdance, several other libraries are used to help make Waterbear work. These are part of my evolving [Standard Stack](https://hackmd.io/@dethe/rJHyDz3eS)

* [pagjs](https://pegjs.org/) is used to build the Moonshine parser
* [heresy](https://github.com/WebReflection/heresy/) is used to build HTML from object parse trees, like a very lightweight version of React
* [immer](https://medium.com/hackernoon/introducing-immer-immutability-the-easy-way-9d73d8f71cb3) is a library to work with immutable data in JavaScript
* [Ramda](https://ramdajs.com/) (probably, there are still a couple of other contenders) for functional programming support and standard library
* [ShareDB](https://github.com/share/sharedb) (probably) for collaborative JSON and text

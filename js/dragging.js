import dragula from "../lib/dragula.min.js";

let drake = dragula({
  isContainer: function (el) {
    return el.matches(".menu, .script, .script .container");
  },
  moves: function (el, source, handle, sibling) {
    return el.matches(".block");
  },
  accepts: function (el, target, source, sibling) {
    return !target.matches(".menu"); // elements can be dropped in any container by default
  },
  invalid: function (el, handle) {
    return false; // don't prevent any drags from initiating by default
  },
  copy: function (el, source) {
    if (source.matches(".menu")) {
      return true;
    }
    return false;
  },
  copySortSource: false, // elements in copy-source containers can be reordered
  revertOnSpill: false, // spilling will put the element back where it was dragged from, if this is true
  removeOnSpill: true, // spilling will `.remove` the element, if this is true
});
// drake.on("drop", () => trigger("scriptChanged", document.body));
// drake.on("remove", () => trigger("scriptChanged", document.body));

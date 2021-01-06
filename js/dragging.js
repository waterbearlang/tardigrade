import dragula from "../lib/dragula.min.js";

let drake = dragula({
  isContainer: function (el) {
    return el.matches("wb-contains");
  },
  moves: function (el, source, handle, sibling) {
    return el.matches("wb-step, wb-context, wb-value, wb-trigger");
  },
  accepts: function (el, target, source, sibling) {
    return target.matches(".script"); // elements can be dropped in any container by default
  },
  invalid: function (el, handle) {
    return false; // don't prevent any drags from initiating by default
  },
  copy: function (el, source) {
    if (source.matches(".blockmenu wb-contains")) {
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

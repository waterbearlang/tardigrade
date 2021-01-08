import dragula from "../lib/dragula.min.js";

let drake = dragula({
  isContainer: function (el) {
    return el.matches("wb-contains, .script");
  },
  moves: function (el, source, handle, sibling) {
    return el.matches("wb-step, wb-context, wb-value, wb-trigger");
  },
  accepts: function (el, target, source, sibling) {
    if (target.matches(".gu-transit, .gu-transit *")){ return false };
    if (target.matches(".script")){ return true }; // elements can be dropped in any container by default
    if (target.matches(".script wb-contains") && el.matches('wb-step, wb-context')){ return true; }
    if (target.matches("wb-input-parameter, wb-truth-parameter, wb-select-parameter, wb-block-parameter") &&
       (el.matches("wb-value") && target.type === el.returntype)){ return true; }
    return false;
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

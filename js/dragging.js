import dragula from "../lib/dragula.min.js";

let drag = dragula({
  isContainer: function (el) {
    return el.matches("tg-contains, .script");
  },
  moves: function (el, source, handle, sibling) {
    return el.matches("tg-step, tg-context, tg-value, tg-trigger");
  },
  accepts: function (el, target, source, sibling) {
    if (target.matches(".gu-transit, .gu-transit *")) {
      return false;
    }
    if (target.matches(".script")) {
      return true;
    } // elements can be dropped in any container by default
    if (
      target.matches(".script tg-contains") &&
      el.matches("tg-step, tg-context")
    ) {
      return true;
    }
    if (
      target.matches(
        "tg-input-parameter, tg-truth-parameter, tg-select-parameter, tg-block-parameter"
      ) &&
      el.matches("tg-value") &&
      target.type === el.returntype
    ) {
      return true;
    }
    return false;
  },
  invalid: function (el, handle) {
    return false; // don't prevent any drags from initiating by default
  },
  copy: function (el, source) {
    if (source.matches(".blockmenu tg-contains")) {
      return true;
    }
    return false;
  },
  copySortSource: false, // elements in copy-source containers can be reordered
  revertOnSpill: false, // spilling will put the element back where it was dragged from, if this is true
  removeOnSpill: true, // spilling will `.remove` the element, if this is true
});
// drag.on("drop", () => trigger("scriptChanged", document.body));
// drag.on("remove", () => trigger("scriptChanged", document.body));

export default drag;

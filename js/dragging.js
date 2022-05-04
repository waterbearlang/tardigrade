import dragula from "../lib/dragula.min.js";

let drag = dragula({
  isContainer: function (el) {
    return el.matches(
      "tg-contains, .script, tg-locals, tg-returns, tg-block-param > input, tg-socket"
    );
  },
  moves: function (el, source, handle, sibling) {
    return el.matches("tg-step, tg-context, tg-value, tg-trigger");
  },
  accepts: function (el, target, source, sibling) {
    if (target.matches(".gu-transit, .gu-transit *")) {
      /* I don't actually remember what this rule does, but the .gu- classes are part of the dragging library */
      return false;
    }
    if (target.matches(".script") && el.matches("tg-trigger")) {
      // only triggers can be top-level in the script
      return true;
    }
    if (
      target.matches(".script tg-contains") &&
      el.matches("tg-step, tg-context")
    ) {
      // Only contexts and steps can be contained by a trigger
      return true;
    }
    if (
      target.matches("tg-socket") &&
      el.matches("tg-value") &&
      !Array.from(target.children)
        .map(n => n.tagName)
        .includes("TG-VALUE") &&
      target.type === el.returntype
    ) {
      // values can only be dragged to sockets, and only if their type matches and there is not already a value in the socket
      return true;
    }
    return false;
  },
  invalid: function (el, handle) {
    if (
      el.parentElement.matches(".blockmenu tg-locals, .blockmenu tg-returns")
    ) {
      // cannot drag from locals or returns in the block menu
      // (locals shouldn't even be visible, but just in case)
      return true;
    }
    return false; // don't prevent any drags from initiating by default
  },
  copy: function (el, source) {
    if (
      source.matches(
        ".blockmenu tg-contains, .script tg-locals, .script tg-returns"
      )
    ) {
      // locals and returns act like mini-blockmenus
      // Will have to revisit when returns can be blocks other than values
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

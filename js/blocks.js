import heresy from "../lib/heresy.min.js";
const { define, ref, render, html } = heresy;

// Utility function
function template(contents) {
  let t = document.createElement("template");
  t.innerHTML = contents;
  document.body.appendChild(t);
  return t;
}

// Base styles (used in multiple places)

const HEADER_STYLE = `header {
  display: inline-flex;
  flex-wrap: nowrap;
  justify-content: flex-start unsafe;
  padding: 0.3em 0.5em;
}`;

const TAB_STYLE = `wb-tab {
  position: relative;
  display: block;
  fill: var(--color);
  stroke: var(--border);
  margin: 0;
  padding: 0;
  border: 0;
  width: 40px;
  height: 12px;
  left: 15px;
}`;

const LOCALS_STYLE = `/* Container for values local to a block */
wb-locals {
  position: relative;
  display: flex;
  flex-direction: row;
  background-color: white;
  padding: 1px;
  border-radius: 5px;
}`;

const RETURNS_STYLE = `/* Container for the single result block of a step or context */
wb-returns {
  position: relative;
  display: inline-block;
  padding: 1px;
  background-color: white;
  border-radius: 5px;
  border: 3px inset grey;
  margin-left: 2em;
}`;

const SUMMARY_STYLE = `summary {
  position: relative;
  background-color: var(--color);
  border-color: var(--border);
  border-top-left-radius: 5px;
  border-top-right-radius: 5px;
  border-bottom-right-radius: 5px;
  padding-left: 10px;
  padding-right: 10px;
  padding-bottom: 25px;
}
summary > wb-slot {
  display: none;
}

details {
  margin: 0;
}

details[open] > summary > wb-slot {
  display: inline-block;
  bottom: 2px;
}`;

const SLOT_STYLE = `
  /* clip-path: url("#slot-cutout-path-inline"); */
  -webkit-mask: url(/images/slot.svg) 40px bottom, linear-gradient(#000, #000);
  -webkit-mask-composite: destination-out;
  -webkit-mask-repeat: no-repeat;
  mask-image: url(/images/slot.svg#slot-cutout-path), transparent;
  mask-composite: exclude;
  mask-position: 40px bottom, left top;
  mask-size: 40px 12px, auto auto;
  mask-repeat: no-repeat;
  /* mask-clip: stroke-box; */
`;

// FIXME: These should be extracted from .moon files
const selectChoices = {
  AngleUnit: ["degrees", "radians"],
  EdgeChoice: ["pass", "bounce", "wrap", "stop"],
  WaveChoice: ["sine", "saw", "square", "triangle", "pulse"],
};

// FIXME: Adapting to pure Custom Elements
// constructor()
//    super()
// connectedCallback()
// Node.isConnected
// disconnectedCallback()
// adoptedCallback() // moved to a new document
// attributeChangedCallback(name, oldValue, newValue)
// static getObservedElements() (return list of attribute names)
// const shadow = this.attachShadow({mode: "open"});

class SimpleBlock extends HTMLElement {
  constructor() {
    super();
    let shadow = this.attachShadow({ mode: "open" });
    if (this.constructor._style) {
      let style = document.createElement("style");
      style.innerText = this.constructor._style;
      shadow.appendChild(style);
    }
    if (this.constructor._structure) {
      this.content = this.template().content.cloneNode(true);
      shadow.appendChild(this.content);
    }
  }

  // template method is inherited by instances, but works on class ;-)
  template() {
    let ctor = this.constructor;
    if (!ctor._template) {
      ctor._template = template(ctor._structure);
    }
    return ctor._template;
  }
}

//
// WBBlock - never instantiated as an element, but holds utility functionality for blocks to subclass
//
// Should be refactored to use groups of functionality by composition vs. inheritance once it's clear
// which blocks need which bits. For now, just toss it all here and we'll see what sticks.
//
class WBBlock extends SimpleBlock {
  constructor() {
    super();
  }

  static create(props) {
    props = props || {};
    const obj = document.createElement(this.tagName);
    Object.keys(props).forEach(key => {
      obj[key] = props[key];
    });
    obj.update();
    return obj;
  }

  get ns() {
    return this.getAttribute("ns");
  }
  set ns(val) {
    this.setAttribute("ns", val);
  }
  get name() {
    return this.getAttribute("name");
  }
  set name(val) {
    this.setAttribute("name", val);
  }
  get value() {
    return this._value;
  }
  set value(val) {
    this._value = val;
  }

  _conditionalSetAttribute(name) {
    if (this.hasAttribute(name)) {
      this._input.setAttribute(name, this.getAttribute(name));
    }
  }

  get returnType() {
    return this.getAttribute("returnType");
  }

  set returnType(val) {
    this.setAttribute("returnType", val);
  }

  get function() {
    return window.runtime[this.ns][this.name];
  }

  get locals() {
    return this._locals;
  }

  set locals(val) {
    this._locals = val;
  }

  get body() {
    return this._body;
  }

  set body(val) {
    this._body = val;
  }

  get params() {
    return this._params;
  }

  set params(val) {
    this._params = val;
  }

  get choices() {
    return selectChoices[this.type];
  }

  returnsElement() {
    if (!this.returnType) {
      return;
    }
    return WBValue.create({
      type: "Value",
      returnType: this.returnType,
      ns: this.ns,
      name: this.returnName || this.name,
      value: "TBD",
    });
  }

  wrappedLocals() {
    // returns locals as elements, wrapped in a <wb-locals> block
    // if there are no locals, returns undefined
    let locals;
    if (this.locals && this.locals.length) {
      locals = new WBLocals();
      this.locals.forEach(value => {
        value.ns = this.ns;
        locals.appendChild(WBValue.create(value));
      });
    }
    return locals;
  }

  mapParams() {
    // val is array of AST parameter objects. Each object has a name and a type.
    if (!this.params) {
      return [];
    }
    return this.params.map(param => {
      const type = param.type;
      if (["Text", "Integer", "Float", "Colour"].includes(type)) {
        return WBInputParam.create(param);
      }
      if (type === "Truth") {
        return WBTruthParam.create(param);
      }
      if (["AngleUnit", "EdgeChoice", "WaveChoice"].includes(type)) {
        return WBSelectParam.create(param);
      }
      if (["Vector", "Image", "Sprite", "Angle", "Shape"].includes(type)) {
        return WBBlockParam.create(param);
      }
      if (type.includes("List")) {
        // List types exist for all primitive types, for struct types, and even for other list types.
        // Some list types can be late-bound, so "list of what" is not known until parameters
        // are added
        return WBBlockParam.create(param);
      }
      if (type === "Type") {
        // late bound type, depends on the type of argument used
        // for WB this will be handled in the interface for inserting arguments
        // (whether by click, drag-and-drop, cut-and-paste, undo/redo or whatevs)
        return WBBlockParam.create(param);
      }
      console.error("Unrecognized parameter type: %s", param.type);
      throw new Error("Unrecognized parameter type: " + param.type);
    });
  }
}

class WBInputParam extends WBBlock {
  static _structure = `<span><span class="name"></span> <input type="text" wbtype="" value=""></span>`;
  static _style = `
    :host{
      display: inline-flex;
      flex-wrap: nowrap;
      max-height: 1.6em;
    }
    input {
      width: 4em;
      margin-left: 0.4em;
      padding-left: 1.5em;
      border: 2px inset #333;
      background: left / contain no-repeat #fff
        url(../images/fa-svg/regular/question-circle.svg);
      background-color: var(--color);
      border-color: var(--border);
      background-image: var(--image);
    }
  `;
  static tagName = "wb-input-param";

  update() {
    this.shadowRoot.querySelector(".name").innerText = this.name;
    let input = this.shadowRoot.querySelector("input");
    input.setAttribute("wbtype", this.type);
    input.setAttribute("value", this.value);
  }
}
customElements.define("wb-input-param", WBInputParam);

class WBTruthParam extends WBBlock {
  static _structure = `<span><span class="name"></span> <input type="checkbox" wbtype="truth" value=""></span>`;
  static _style = `
    :host{
      display: inline-flex;
      flex-wrap: nowrap;
      max-height: 1.6em;
    }
    input {
      width: 4em;
      margin-left: 0.4em;
      padding-left: 1.5em;
      border: 2px inset #333;
    }
  `;
  static tagName = "wb-truth-param";
  update() {
    this.shadowRoot.querySelector(".name").innerText = this.name;
    let input = this.shadowRoot.querySelector("input");
    input.checked = this.value === "true";
  }
}
customElements.define("wb-truth-param", WBTruthParam);

class WBSelectParam extends WBBlock {
  static _structure = `<select></select>`;
  static _style = `
    :host{
      display: inline-flex;
      flex-wrap: nowrap;
      max-height: 1.6em;
    }
  `;
  static tagName = "wb-select-param";
  get choices() {
    return this._choices;
  }
  set choices(list) {
    this._choices = list;
    this.update();
    console.log("updated choices");
  }
  get choice() {
    return this._choice;
  }
  set choice(item) {
    this._choice = item;
    this.update();
    console.log("updated choice");
  }
  update() {
    if (!this.choices) return;
    this.shadowRoot.querySelector("select").innerHTML = this.choices
      .map(
        choice =>
          `<option value="${choice}" ${
            this.value === choice ? "selected" : ""
          }>`
      )
      .join("");
  }
}
customElements.define("wb-select-param", WBSelectParam);

//
// WBBlockParam - A parameter socket that only takes blocks as arguments, and only if their type matches.
//

class WBBlockParam extends WBBlock {
  static _structure = `<label class="name"></label> <input type="text" wbtype="" readonly title="">`;
  static _style = `
    :host{
      display: inline-flex;
      flex-wrap: nowrap;
      max-height: 1.6em;
    }
    label {
      margin-left: 0.2em;
    }
    input {
      width: 4em;
      margin-left: 0.4em;
      padding-left: 1.5em;
      border: 2px inset #333;
      background: left / contain no-repeat #fff
        url(../images/fa-svg/regular/question-circle.svg);
      background-color: var(--color);
      border-color: var(--border);
      background-image: var(--image);
    }
    input[readonly] {
      background-color: #ccc;
    }
  `;
  static tagName = "wb-block-param";
  update() {
    this.shadowRoot.querySelector(".name").innerText = this.name;
    let input = this.shadowRoot.querySelector("input");
    input.setAttribute("wbtype", this.type);
    input.setAttribute("title", `drag a ${this.type} block here`);
  }
}
customElements.define("wb-block-param", WBBlockParam);

//
// WBTab - makes the tab at the top of a block. Purely decorative.
//

class WBTab extends SimpleBlock {
  static _structure = `<svg width="40" height="12"><path d="M 0 12
    a 6 6 90 0 0 6 -6
    a 6 6 90 0 1 6 -6
    h 16
    a 6 6 90 0 1 6 6
    a 6 6 90 0 0 6 6"></path></svg>`;
  static tagName = "wb-tab";
  template = WBBlock.prototype.template;
}
customElements.define("wb-tab", WBTab);

//
// WBHat - makes the bulge on top of a WBTrigger. Purely decorative.
// Maybe move to pure CSS?
//

class WBHat extends SimpleBlock {
  static tagName = "wb-hat";
  static _style = `
    :host{
      position: relative;
      display: block;
      fill: var(--color);
      stroke: var(--color);
      margin: 0;
      padding: 0;
      width: 100px;
      height: 12px;
      left: 15px;
      overflow: hidden;
    }
    :host::before {
      content: "";
      position: absolute;
      display: block;
      width: 100px;
      height: 100px;
      left: -15px;
      background-color: var(--color);
      border-color: var(--border);
      border-width: 2px;
      border-style: solid;
      border-radius: 100%;
    }
  `;
}
customElements.define("wb-hat", WBHat);

// //
// // WBSlot - makes the indent at the bottom of a block
// //

// class WBSlot extends HTMLElement {
//   static get name() {
//     return "WBSlot";
//   }
//   static get tagName() {
//     return "wb-slot";
//   }
//   render() {
//     return this.svg`<svg width="40" height="12"><path d="M 0 12
//     a 6 6 90 0 0 6 -6
//     a 6 6 90 0 1 6 -6
//     h 16
//     a 6 6 90 0 1 6 6
//     a 6 6 90 0 0 6 6"></path></svg>`;
//   }
// }
// WBSlot = define(WBSlot);

//
// WBLocals - holds values that are local to a block
//

class WBLocals extends SimpleBlock {
  static tagName = "wb-locals";
  static _style = ``;
  static _structure = ``;
}
customElements.define("wb-locals", WBLocals);

//
// WBReturns - holds the result of a block that can be used by subsequent blocks
//
class WBReturns extends SimpleBlock {
  static tagName = "wb-returns";
  static _structure = `<slot></slot>`;
  static _style = ``;
}
customElements.define("wb-returns", WBReturns);

class WBContains extends SimpleBlock {
  static tagName = "wb-contains";
  static _structure = `<slot></slot>`;
  static _style = `
    :host {
      position: relative;
      min-height: 1.25em;
      padding-bottom: 14px;
      padding: 0.5em;
      display: flex;
      flex-direction: column;
      flex-wrap: nowrap;
      align-items: flex-start;
      border-top-left-radius: 5px;
      border-bottom-left-radius: 5px;
    }
    :host-context(wb-contains){
      margin: 5px 5px;
      margin-top: 12px;
    }
    :host-context(wb-context, wb-trigger)::before {
      position: absolute;
      left: 5px;
      top: -5px;
      content: "";
      height: calc(100% - 20px);
      width: 10px;
      display: block;
      border-radius: 8px;
      border-width: 5px;
      border-style: solid;
      border-color: var(--color);
      clip-path: polygon(0% 0%, 50% 0%, 50% 100%, 0% 100%);
    }

    wb-step {
      margin: 5px;
      margin-top: 12px;
    }
    wb-context {
      margin: 5px;
      margin-top: 12px;
    }
    wb-value {
      margin: 5px;
    }
  `;
}
customElements.define("wb-contains", WBContains);

//
// WBValue - standalone values
//

class WBValue extends WBBlock {
  static _structure = `<span class="name"></span>`;
  static _style = `
    :host {
      display: inline-block;
      border-radius: 5px;
      border-style: solid;
      padding: 5px;
      padding-left: 1.5em;
      background: left / 1em no-repeat #fff
        url(../images/fa-svg/regular/question-circle.svg);
      background-color: var(--color);
      border-color: var(--border);
      background-image: var(--image);
    }
    :host-context(wb-returns){
      padding-top: 3px;
      padding-bottom: 3px;
      font-size: 80%;
    }
    :host-context(wb-locals){
      margin-bottom: 0;
      margin-right: 1px;
    }
  `;
  static tagName = "wb-value";
  update() {
    this.shadowRoot.querySelector(".name").innerText = this.name;
  }
}
customElements.define("wb-value", WBValue);

//
// WBStep - the workhorse of Waterbear
//

class WBStep extends WBBlock {
  static _structure = `<wb-tab></wb-tab><header><span class="name"></span> <span class="params"></span> <wb-returns title="Returned value of this block"></wb-returns></header>`;
  static _style = `
    :host {
      display: inline-block;
      border-radius: 5px;
      position: relative;
      z-index: 0;
      ${SLOT_STYLE}
    }
    ${HEADER_STYLE}
    ${TAB_STYLE}
    ${LOCALS_STYLE}
    ${RETURNS_STYLE}
    header {
      background-color: var(--color);
      border-color: var(--border);
      border-width: 2px;
      border-style: solid;
    }
  `;
  static tagName = "wb-step";
  update() {
    this.shadowRoot.querySelector(".name").innerText = this.name;
    this.shadowRoot
      .querySelector(".params")
      .replaceChildren(...this.mapParams());
    this.shadowRoot
      .querySelector("wb-returns")
      .replaceChildren(this.returnsElement());
  }
}
customElements.define("wb-step", WBStep);

//
// WBContext - a container for steps (and a step itself)
//

class WBContext extends WBBlock {
  static _structure = `<wb-tab></wb-tab><details open><summary><header><span class="name"></span> <span class="params"><slot name="params"></slot></span> <wb-returns title="Returned value of this block"><slot name="returns"></wb-returns></header><span class="locals"><slot name="locals"></slot></span></summary><wb-contains><slot name="steps></slot></wb-contains></details>`;
  static _style = `
    :host {
      display: inline-block;
      position: relative;
      z-index: 0;
      ${SLOT_STYLE}
    }
    :host::before {
      content: "";
      width: 10px;
      height: calc(100% - 15px);
      position: absolute;
      top: 15px;
      left: 0;
      margin: 0;
      padding: 0;
      background-color: var(--color);
      /* border-color: var(--color);
      border-width: 2px;
      border-style: solid; */
      border-top-left-radius: 5px;
      border-bottom-left-radius: 5px;
    }
    :host::after {
      content: "";
      height: 20px;
      width: 100%;
      position: absolute;
      bottom: 0;
      left: 0;
      margin: 0;
      padding: 0;
      /* border-width: 2px;
      border-style: solid; */
      background-color: var(--color);
      /* border-color: var(--border); */
      border-bottom-left-radius: 5px;
      border-bottom-right-radius: 5px;
      border-top-right-radius: 5px;
    }
    ${HEADER_STYLE}
    ${TAB_STYLE}
    ${LOCALS_STYLE}
    ${RETURNS_STYLE}
    ${SUMMARY_STYLE}
    summary{
      ${SLOT_STYLE}
    }
  `;
  static tagName = "wb-context";
  update() {
    this.shadowRoot.querySelector(".name").innerText = this.name;
    this.shadowRoot
      .querySelector(".params")
      .replaceChildren(...this.mapParams());
    this.shadowRoot
      .querySelector("wb-returns")
      .replaceChildren(this.returnsElement());
    this.shadowRoot.querySelector(".locals").replaceWith(this.wrappedLocals());
  }
}
customElements.define("wb-context", WBContext);

//
// WBTrigger - a starting point for a script, fired by an event occurring
//

class WBTrigger extends WBBlock {
  static _structure = `<wb-hat></wb-hat><details open><summary><header><span class="name"></span> </header><span class="locals"></span></summary><wb-contains></wb-contains></details>`;
  static _style = `
    :host {
      display: inline-block;
      position: relative;
      z-index: 0;
    }
    :host::before {
      content: "";
      width: 10px;
      height: calc(100% - 15px);
      position: absolute;
      top: 15px;
      left: 0;
      margin: 0;
      padding: 0;
      background-color: var(--color);
      /* border-color: var(--color);
      border-width: 2px;
      border-style: solid; */
      border-top-left-radius: 5px;
      border-bottom-left-radius: 5px;
    }
    :host::after {
      content: "";
      height: 20px;
      width: 100%;
      position: absolute;
      bottom: 0;
      left: 0;
      margin: 0;
      padding: 0;
      /* border-width: 2px;
      border-style: solid; */
      background-color: var(--color);
      /* border-color: var(--border); */
      border-bottom-left-radius: 5px;
      border-bottom-right-radius: 5px;
      border-top-right-radius: 5px;
    }
    ${HEADER_STYLE}
    ${LOCALS_STYLE}
    ${SUMMARY_STYLE}
    summary{
      ${SLOT_STYLE}
    }
`;
  static tagName = "wb-trigger";
  update() {
    this.shadowRoot.querySelector(".name").innerText = this.name;
    this.shadowRoot.querySelector(".locals").replaceWith(this.wrappedLocals());
  }
}
customElements.define("wb-trigger", WBTrigger);

// Attribution for Font Awesome icons
console.info(`Font Awesome Pro 5.15.1 by @fontawesome - https://fontawesome.com
License - https://fontawesome.com/license (Commercial License)
`);

export default {
  Trigger: WBTrigger,
  Context: WBContext,
  Step: WBStep,
  Value: WBValue,
};

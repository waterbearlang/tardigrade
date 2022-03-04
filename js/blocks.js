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

details {
  margin: 0;
}
`;

const SLOT_STYLE = `
  -webkit-mask: url(/images/slot.svg) 40px bottom, linear-gradient(#000, #000);
  -webkit-mask-composite: destination-out;
  -webkit-mask-repeat: no-repeat;
  mask-image: url(/images/slot.svg#slot-cutout-path), transparent;
  mask-composite: exclude;
  mask-position: 40px bottom, left top;
  mask-size: 40px 12px, auto auto;
  mask-repeat: no-repeat;
`;

// FIXME: These should be extracted from .moon files
const selectChoices = {
  AngleUnit: ["degrees", "radians"],
  EdgeChoice: ["pass", "bounce", "wrap", "stop"],
  WaveChoice: ["sine", "saw", "square", "triangle", "pulse"],
};

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

  connectedCallback() {
    if (this.update) {
      this.update();
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
// TGBlock - never instantiated as an element, but holds utility functionality for blocks to subclass
//
// Should be refactored to use groups of functionality by composition vs. inheritance once it's clear
// which blocks need which bits. For now, just toss it all here and we'll see what sticks.
//
class TGBlock extends SimpleBlock {
  constructor() {
    super();
  }

  static create(props) {
    props = props || {};
    const obj = document.createElement(this.tagName);
    Object.keys(props).forEach(key => {
      obj[key] = props[key];
    });
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
    return this.getAttribute("value");
  }
  set value(val) {
    this.setAttribute("value", val);
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
    return JSON.parse(this.getAttribute("locals"));
  }

  set locals(val) {
    this.setAttribute("locals", JSON.stringify(val));
  }

  get body() {
    return this.getAttribute("body");
  }

  set body(val) {
    this.setAttribute("body", val);
  }

  get params() {
    return JSON.parse(this.getAttribute("params"));
  }

  set params(val) {
    this.setAttribute("params", JSON.stringify(val));
  }

  get choices() {
    return selectChoices[this.type];
  }

  returnsElement() {
    if (!this.returnType) {
      return;
    }
    return TGValue.create({
      type: "Value",
      returnType: this.returnType,
      ns: this.ns,
      name: this.returnName || this.name,
      value: "TBD",
    });
  }

  wrappedLocals() {
    // returns locals as elements, wrapped in a <tg-locals> block
    // if there are no locals, returns undefined
    let locals;
    if (this.locals && this.locals.length) {
      locals = new TGLocals();
      this.locals.forEach(value => {
        value.ns = this.ns;
        locals.appendChild(TGValue.create(value));
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
        return TGInputParam.create(param);
      }
      if (type === "Truth") {
        return TGTruthParam.create(param);
      }
      if (["AngleUnit", "EdgeChoice", "WaveChoice"].includes(type)) {
        return TGSelectParam.create(param);
      }
      if (["Vector", "Image", "Sprite", "Angle", "Shape"].includes(type)) {
        return TGBlockParam.create(param);
      }
      if (type.includes("List")) {
        // List types exist for all primitive types, for struct types, and even for other list types.
        // Some list types can be late-bound, so "list of what" is not known until parameters
        // are added
        return TGBlockParam.create(param);
      }
      if (type === "Type") {
        // late bound type, depends on the type of argument used
        // for Tardigrade this will be handled in the interface for inserting arguments
        // (whether by click, drag-and-drop, cut-and-paste, undo/redo or whatevs)
        return TGBlockParam.create(param);
      }
      console.error("Unrecognized parameter type: %s", param.type);
      throw new Error("Unrecognized parameter type: " + param.type);
    });
  }
}

class TGInputParam extends TGBlock {
  static _structure = `<label class="name"> <input type="text" wbtype="" value=""></label>`;
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
  static tagName = "tg-input-param";

  update() {
    this.shadowRoot.querySelector(".name").firstChild.replaceWith(this.name);
    let input = this.shadowRoot.querySelector("input");
    input.setAttribute("wbtype", this.type);
    input.setAttribute("value", this.returnName);
  }
}
customElements.define("tg-input-param", TGInputParam);

class TGTruthParam extends TGBlock {
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
  static tagName = "tg-truth-param";
  update() {
    this.shadowRoot.querySelector(".name").innerText = this.name;
    let input = this.shadowRoot.querySelector("input");
    input.checked = this.value === "true";
  }
}
customElements.define("tg-truth-param", TGTruthParam);

class TGSelectParam extends TGBlock {
  static _structure = `<select></select>`;
  static _style = `
    :host{
      display: inline-flex;
      flex-wrap: nowrap;
      max-height: 1.6em;
    }
  `;
  static tagName = "tg-select-param";
  get choices() {
    return this._choices;
  }
  set choices(list) {
    this._choices = list;
    this.update();
  }
  get choice() {
    return this._choice;
  }
  set choice(item) {
    this._choice = item;
    this.update();
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
customElements.define("tg-select-param", TGSelectParam);

//
// TGBlockParam - A parameter socket that only takes blocks as arguments, and only if their type matches.
//

class TGBlockParam extends TGBlock {
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
  static tagName = "tg-block-param";
  update() {
    this.shadowRoot.querySelector(".name").innerText = this.name;
    let input = this.shadowRoot.querySelector("input");
    input.setAttribute("wbtype", this.type);
    input.setAttribute("title", `drag a ${this.type} block here`);
  }
}
customElements.define("tg-block-param", TGBlockParam);

//
// TGTab - makes the tab at the top of a block. Purely decorative.
//

class TGTab extends SimpleBlock {
  static _structure = `<svg width="40" height="12"><path d="M 0 12
    a 6 6 90 0 0 6 -6
    a 6 6 90 0 1 6 -6
    h 16
    a 6 6 90 0 1 6 6
    a 6 6 90 0 0 6 6"></path></svg>`;
  static tagName = "tg-tab";
  static _style = `
    :host {
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
    }
  `;
}
customElements.define("tg-tab", TGTab);

//
// TGHat - makes the bulge on top of a TGTrigger. Purely decorative.
// Maybe move to pure CSS?
//

class TGHat extends SimpleBlock {
  static tagName = "tg-hat";
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
customElements.define("tg-hat", TGHat);


//
// TGLocals - holds values that are local to a block
//

class TGLocals extends SimpleBlock {
  static tagName = "tg-locals";
  static _style = `
    /* Container for values local to a block */
    :host {
      position: relative;
      display: flex;
      flex-direction: row;
      background-color: white;
      padding: 1px;
      border-radius: 5px;
    }
    tg-value{
      margin-bottom: 0;
      margin-right: 1px;
    }
  `;
  static _structure = `<slot></slot>`;
}
customElements.define("tg-locals", TGLocals);

//
// TGReturns - holds the result of a block that can be used by subsequent blocks
//
class TGReturns extends SimpleBlock {
  static tagName = "tg-returns";
  static _structure = `<slot></slot>`;
  static _style = `
    :host {
      position: relative;
      display: inline-block;
      padding: 1px;
      background-color: white;
      border-radius: 5px;
      border: 3px inset grey;
      margin-left: 2em;
    }
    tg-value{
      padding-top: 3px;
      padding-bottom: 3px;
      font-size: 80%;
    }
  `;
}
customElements.define("tg-returns", TGReturns);

class TGContains extends SimpleBlock {
  static tagName = "tg-contains";
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
    tg-step {
      margin: 5px;
      margin-top: 12px;
    }
    tg-context {
      margin: 5px;
      margin-top: 12px;
    }
    tg-value{
      margin: 5px;
    }
    tg-step{
      margin: 5px;
      margin-top: 12px;
    }
  `;
}
customElements.define("tg-contains", TGContains);

//
// TGValue - standalone values
//

class TGValue extends TGBlock {
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
  `;
  static tagName = "tg-value";
  update() {
    this.shadowRoot.querySelector(".name").replaceChildren(this.name);
  }
}
customElements.define("tg-value", TGValue);

//
// TGStep - the workhorse of Waterbear
//

class TGStep extends TGBlock {
  static _structure = `<tg-tab></tg-tab><header><span class="name"></span> <span class="params"></span> <tg-returns title="Returned value of this block"></tg-returns></header>`;
  static _style = `
    :host {
      display: inline-block;
      border-radius: 5px;
      position: relative;
      z-index: 0;
      ${SLOT_STYLE}
    }
    ${HEADER_STYLE}
    header {
      background-color: var(--color);
      border-color: var(--border);
      border-width: 2px;
      border-style: solid;
    }
  `;
  static tagName = "tg-step";
  update() {
    this.shadowRoot.querySelector(".name").innerText = this.name;
    this.shadowRoot
      .querySelector(".params")
      .replaceChildren(...this.mapParams());
    this.shadowRoot
      .querySelector("tg-returns")
      .replaceChildren(this.returnsElement());
  }
}
customElements.define("tg-step", TGStep);

//
// TGContext - a container for steps (and a step itself)
//

class TGContext extends TGBlock {
  static _structure = `<tg-tab></tg-tab><details open><summary><header><span class="name"></span> <span class="params"><slot name="params"></slot></span> <tg-returns title="Returned value of this block"><slot name="returns"></tg-returns></header><span class="locals"><slot name="locals"></slot></span></summary><tg-contains><slot name="steps></slot></tg-contains></details>`;
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
    ${SUMMARY_STYLE}
    summary{
      ${SLOT_STYLE}
    }
    tg-contains::before{
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

  `;
  static tagName = "tg-context";
  update() {
    this.shadowRoot.querySelector(".name").innerText = this.name;
    this.shadowRoot
      .querySelector(".params")
      .replaceChildren(...this.mapParams());
    this.shadowRoot
      .querySelector("tg-returns")
      .replaceChildren(this.returnsElement());
    this.shadowRoot.querySelector(".locals").replaceWith(this.wrappedLocals());
  }
}
customElements.define("tg-context", TGContext);

//
// TGTrigger - a starting point for a script, fired by an event occurring
//

class TGTrigger extends TGBlock {
  static _structure = `<tg-hat></tg-hat><details open><summary><header><span class="name"></span> </header><span class="locals"></span></summary><tg-contains></tg-contains></details>`;
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
    ${SUMMARY_STYLE}
    summary{
      ${SLOT_STYLE}
    }
    tg-contains::before{
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

`;
  static tagName = "tg-trigger";
  update() {
    this.shadowRoot.querySelector(".name").innerText = this.name;
    this.shadowRoot.querySelector(".locals").replaceWith(this.wrappedLocals());
  }
}
customElements.define("tg-trigger", TGTrigger);

// Attribution for Font Awesome icons
console.info(`Font Awesome Pro 5.15.1 by @fontawesome - https://fontawesome.com
License - https://fontawesome.com/license (Commercial License)
`);

export default {
  Trigger: TGTrigger,
  Context: TGContext,
  Step: TGStep,
  Value: TGValue,
};

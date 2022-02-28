import heresy from "../lib/heresy.min.js";
const { define, ref, render, html } = heresy;

// Utility function
function template(contents) {
  let t = document.createElement("template");
  t.innerHTML = contents;
  document.body.appendChild(t);
  return t;
}

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

//
// WBBlock - never instantiated as an element, but holds utility functionality for blocks to subclass
//
// Should be refactored to use groups of functionality by composition vs. inheritance once it's clear
// which blocks need which bits. For now, just toss it all here and we'll see what sticks.
//

class WBBlock extends HTMLElement {
  constructor() {
    super();
    console.log("Calling WBBlock constructor");
    let shadow = this.attachShadow({ mode: "open" });
    this.style = document.createElement("style");
    console.log(`this.style before: ${this.style}`);
    this.style.innerText = this.constructor._style;
    console.log(`this.style after => ${this.style}`);
    shadow.appendChild(this.style);
    this.content = this.constructor
      .template()
      .content.firstElementChild.cloneNode(true);
    console.log(`this.content: ${this.content}`);
    shadow.appendChild(this.content);
  }

  static create(props) {
    props = props || {};
    const obj = document.createElement(this.tagName);
    Object.keys(props).forEach(key => {
      obj[key] = props[key];
    });
    return obj;
  }

  static template() {
    if (!this._template) {
      this._template = template(this._structure);
    }
    return this._template;
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
      // console.log("map parameter: %o", param);
      const type = param.type;
      if (["Text", "Integer", "Float", "Colour"].includes(type)) {
        return WBInputParam.create(param);
      }
      if (type === "Truth") {
        return WBTruthParam.create(param);
      }
      if (["AngleUnit", "EdgeChoice", "WaveChoice"].includes(type)) {
        // console.log("%s: %s", type, selectChoices[type]);
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
  static _style = ``;
  static tagName = "wb-input-param";

  constructor() {
    super();
    this.update();
  }

  update() {
    this.content.querySelector(".name").innerText = this.name;
    let input = this.content.querySelector("input");
    input.setAttribute("wbtype", this.type);
    input.setAttribute("value", this.value);
  }
}
customElements.define("wb-input-param", WBInputParam);

class WBTruthParam extends WBBlock {
  static _structure = `<span><span class="name"></span> <input type="checkbox" wbtype="truth" value=""></span>`;
  static _style = ``;
  static tagName = "wb-truth-param";
  constructor() {
    super();
    this.update();
  }
  update() {
    this.content.querySelector(".name").innerText = this.name;
    let input = this.content.querySelector("input");
    input.checked = this.value === "true";
  }
}
customElements.define("wb-truth-param", WBTruthParam);

class WBSelectParam extends WBBlock {
  static get name() {
    return "WBSelectParam";
  }
  static get tagName() {
    return "wb-select-param";
  }
  render() {
    const obj = document.createElement("select");
    obj.innerHTML = this.choices
      .map(
        choice =>
          `<option value="${choice}" ${
            this.value === choice ? "selected" : ""
          }>`
      )
      .join("");
    return obj;
  }
}
WBSelectParam = define(WBSelectParam);

//
// WBBlockParam - A parameter socket that only takes blocks as arguments, and only if their type matches.
//

class WBBlockParam extends WBBlock {
  static get name() {
    return "WBBlockParam";
  }
  static get tagName() {
    return "wb-block-param";
  }
  render() {
    return this
      .html`<label>${this.name}</label> <input type="${this.type}" readonly title="drag a ${this.type} block here">`;
  }
}
WBBlockParam = define(WBBlockParam);

//
// WBTab - makes the tab at the top of a block. Purely decorative.
//

class WBTab extends HTMLElement {
  static get name() {
    return "WBTab";
  }
  static get tagName() {
    return "wb-tab";
  }
  render() {
    return this.svg`<svg width="40" height="12"><path d="M 0 12
    a 6 6 90 0 0 6 -6
    a 6 6 90 0 1 6 -6
    h 16
    a 6 6 90 0 1 6 6
    a 6 6 90 0 0 6 6"></path></svg>`;
  }
}
WBTab = define(WBTab);

//
// WBHat - makes the bulge on top of a WBTrigger. Purely decorative.
//

class WBHat extends HTMLElement {
  static get name() {
    return "WBHat";
  }
  static get tagName() {
    return "wb-hat";
  }
}
WBHat = define(WBHat);

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

class WBLocals extends HTMLElement {
  static get name() {
    return "WBLocals";
  }
  static get tagName() {
    return "wb-locals";
  }
}
WBLocals = define(WBLocals);

//
// WBReturns - holds the result of a block that can be used by subsequent blocks
//
class WBReturns extends HTMLElement {
  static get name() {
    return "WBReturns";
  }
  static get tagName() {
    return "wb-returns";
  }
}

//
// WBValue - standalone values
//

class WBValue extends WBBlock {
  static get name() {
    return "WBValue";
  }
  static get tagName() {
    return "wb-value";
  }
  render() {
    return this.html`${this.name}`;
  }
}
window.WBValue = define(WBValue);

//
// WBStep - the workhorse of Waterbear
//

class WBStep extends WBBlock {
  static _structure = `<wb-tab/><header><span class="name"></span> <span class="params"></span><wb-returns title="Returned value of this block"></wb-returns></header>`;
  static _style = ``;
  static tagName = "wb-step";
  constructor() {
    console.log("WBStep constructor called");
    super();
    console.log("Super constructor called");
    this.update();
  }
  update() {
    this.content.querySelector(".name").innerText = this.name;
    this.content.querySelector(".params").innerHTML = this.mapParams();
    this.content.querySelector("wb-returns").innerHTML = this.returnsElement();
  }
}
customElements.define("wb-step", WBStep);

//
// WBContext - a container for steps (and a step itself)
//

class WBContext extends WBBlock {
  static get name() {
    return "WBContext";
  }
  static get tagName() {
    return "wb-context";
  }
  render() {
    return this.html`<wb-tab/><details open><summary><header><span>${
      this.name
    }</span> ${this.mapParams()}</header>${this.wrappedLocals()}</summary><wb-contains /></details>`;
  }
}
window.WBContext = define(WBContext);

//
// WBTrigger - a starting point for a script, fired by an event occurring
//

class WBTrigger extends WBBlock {
  static get name() {
    return "WBTrigger";
  }
  static get tagName() {
    return "wb-trigger";
  }
  render() {
    return this.html`<wb-hat/><details open><summary><header><span>${
      this.name
    }</span> </header>${this.wrappedLocals()}</summary><wb-contains></wb-contains></details>`;
  }
}
window.WBTrigger = define(WBTrigger);

// Attribution for Font Awesome icons
console.info(`Font Awesome Pro 5.15.1 by @fontawesome - https://fontawesome.com
License - https://fontawesome.com/license (Commercial License)
`);
export default {
  InputParam: WBInputParam,
  TruthParam: WBTruthParam,
  SelectParam: WBSelectParam,
  BlockParam: WBBlockParam,
  Tab: WBTab,
  Hat: WBHat,
  Locals: WBLocals,
  Returns: WBReturns,
  Value: WBValue,
  Step: WBStep,
  Context: WBContext,
  Trigger: WBTrigger,
};

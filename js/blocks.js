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
    let shadow = this.attachShadow({ mode: "open" });
    let style = document.createElement("style");
    style.innerText = this.constructor._style;
    shadow.appendChild(style);
    this.content = this.template().content.cloneNode(true);
    shadow.appendChild(this.content);
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

  // template method is inherited by instances, but works on class ;-)
  template() {
    let ctor = this.constructor;
    if (!ctor._template) {
      ctor._template = template(ctor._structure);
    }
    return ctor._template;
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
  static _style = ``;
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
  static _style = ``;
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
  static _style = ``;
  static tagName = "wb-select-param";
  update() {
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
  static _structure = `<label class="name"> <input type="text" wbtype="" readonly title=""></label>`;
  static _style = ``;
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

class WBTab extends HTMLElement {
  static _structure = `<svg width="40" height="12"><path d="M 0 12
    a 6 6 90 0 0 6 -6
    a 6 6 90 0 1 6 -6
    h 16
    a 6 6 90 0 1 6 6
    a 6 6 90 0 0 6 6"></path></svg>`;
  static _style = ``;
  static tagName = "wb-tab";
  template = WBBlock.prototype.template;

  constructor() {
    super();
    let shadow = this.attachShadow({ mode: "open" });
    // let style = document.createElement("style");
    // style.innerText = this.constructor._style;
    // shadow.appendChild(style);
    this.content = this.template().content.firstElementChild.cloneNode(true);
    shadow.appendChild(this.content);
  }
}
customElements.define("wb-tab", WBTab);

//
// WBHat - makes the bulge on top of a WBTrigger. Purely decorative.
// Maybe move to pure CSS?
//

class WBHat extends HTMLElement {
  static tagName = "wb-hat";
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

class WBLocals extends HTMLElement {
  static tagName = "wb-locals";
}
customElements.define("wb-locals", WBLocals);

//
// WBReturns - holds the result of a block that can be used by subsequent blocks
//
class WBReturns extends HTMLElement {
  static tagName = "wb-returns";
}
customElements.define("wb-returns", WBReturns);

//
// WBValue - standalone values
//

class WBValue extends WBBlock {
  static _structure = `<span class="name"></span>`;
  static _style = ``;
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
  static _structure = `<wb-tab/><header><span class="name"></span> <span class="params"></span> <wb-returns title="Returned value of this block"></wb-returns></header>`;
  static _style = ``;
  static tagName = "wb-step";
  update() {
    this.shadowRoot.querySelector(".name").innerText = this.name;
    this.shadowRoot.querySelector(".params").innerHTML = this.mapParams();
    this.shadowRoot.querySelector(
      "wb-returns"
    ).innerHTML = this.returnsElement();
  }
}
customElements.define("wb-step", WBStep);

//
// WBContext - a container for steps (and a step itself)
//

class WBContext extends WBBlock {
  static _structure = `<wb-tab/><details open><summary><header><span class="name"> <span class="params"> <wb-returns title="Returned value of this block"></wb-returns></header><span class="locals"></span></summary></details>`;
  static _style = ``;
  static tagName = "wb-context";
  update() {
    console.log(`shadowRoot: ${JSON.stringify(this.shadowRoot)}`);
    this.shadowRoot.querySelector(".name").innerText = this.name;
    this.shadowRoot.querySelector(".params").innerHTML = this.mapParams();
    this.shadowRoot.querySelector(
      "wb-returns"
    ).innerHTML = this.returnsElement();
    this.shadowRoot.querySelector("locals").innerHTML = this.wrappedLocals();
  }
}
customElements.define("wb-context", WBContext);

//
// WBTrigger - a starting point for a script, fired by an event occurring
//

class WBTrigger extends WBBlock {
  static _structure = `<wb-hat/><details open><summary><header><span class="name"></span> </header><span class="locals"></span></summary><wb-contains></wb-contains></details>`;
  static _style = ``;
  static tagName = "wb-trigger";
  update() {
    this.shadowRoot.querySelector(".name").innerText = this.name;
    this.shadowRoot.querySelector(".locals").innerHTML = this.wrappedLocals();
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

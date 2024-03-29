// FIXME: These should be extracted from .moon files
const selectChoices = {
  AngleUnit: ["degrees", "radians"],
  EdgeChoice: ["pass", "bounce", "wrap", "stop"],
  WaveChoice: ["sine", "saw", "square", "triangle", "pulse"],
};

function toggleOpen(evt) {
  let details = evt.target.closest("tg-details");
  if (details.hasAttribute("open")) {
    details.removeAttribute("open");
  } else {
    details.setAttribute("open", "open");
  }
}

function unpackValue(val) {
  switch (val.type) {
    case "StepCall":
      return `${val.namespace}.${val.name}(${val.args.join(", ")})`;
    case "KeyedValue":
      return `${val.object}.${val.key}`;
    case "IndexedValue":
      return `${val.array}[${val.index}]`;
    default:
      console.info(`Unknown type of value: ${val.type} for value ${val}`);
      return val;
  }
}

class SimpleBlock extends HTMLElement {
  populate() {
    if (this._populated === true) return;
    this._populated = true;
    if (this.constructor._structure) {
      try {
        this.innerHTML = this.constructor._structure;
      } catch (e) {
        console.error(`Problem building ${this.tagName}`);
      }
    }
    if (this.update) {
      this.update();
    }
    return this;
  }

  connectedCallback() {
    this.populate();
  }
}

//
// TGBlock - never instantiated as an element, but holds utility functionality for blocks to subclass
//
// Should be refactored to use groups of functionality by composition vs. inheritance once it's clear
// which blocks need which bits. For now, just toss it all here and we'll see what sticks.
//
class TGBlock extends SimpleBlock {
  static create(props) {
    props = props || {};
    let obj;
    try {
      obj = document.createElement(this.tagName);
    } catch (e) {
      console.error(`createElement failed for ${this.tagName}`);
      console.trace(e);
    }
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
  get body() {
    return this.getAttribute("body");
  }
  set body(val) {
    val.map(v => unpackValue(v)).join(";");
  }
  get value() {
    return this.getAttribute("value");
  }

  set value(val) {
    this.setAttribute("value", unpackValue(val));
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
  static _structure = `<label class="name"> <tg-socket tg-type=""><input type="text" value=""></tg-socket></label>`;
  static tagName = "tg-input-param";

  update() {
    this.querySelector(".name").firstChild.replaceWith(this.name);
    this.querySelector("input").setAttribute("value", this.returnName);
    this.querySelector("tg-socket").setAttribute("tg-type", this.type);
  }
}
customElements.define("tg-input-param", TGInputParam);

class TGTruthParam extends TGBlock {
  static _structure = `<span><span class="name"></span> <tg-socket tg-type="truth"><input type="checkbox" value=""></tg-socket></span>`;
  static tagName = "tg-truth-param";
  update() {
    this.querySelector(".name").innerText = this.name;
    this.querySelector("input").checked = this.value === "true";
  }
}
customElements.define("tg-truth-param", TGTruthParam);

class TGSelectParam extends TGBlock {
  static _structure = `<tg-socket tg-type="text"><select></select></tg-socket>`;
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
    this.querySelector("select").innerHTML = this.choices
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
  static _structure = `<label class="name"></label> <tg-socket tg-type=""><input type="text" readonly title=""></tg-socket>`;
  static tagName = "tg-block-param";
  update() {
    this.querySelector(".name").innerText = this.name;
    let input = this.querySelector("input");
    input.setAttribute("tg-type", this.type);
    input.setAttribute("title", `drag a ${this.type} block here`);
  }
}
customElements.define("tg-block-param", TGBlockParam);

//
// TGTab - add the tab at the top of steps and contexts. Purely decorative
//

class TGTab extends SimpleBlock {
  static tagName = "tg-tab";
  constructor() {
    super();
    this.addTab();
  }
  addTab() {
    let shadow = this.attachShadow({ mode: "open" });
    let style = document.createElement("style");
    style.innerText = `
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
    shadow.appendChild(style);
    let svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    let div = document.createElement("div");
    div.appendChild(svg);
    svg.outerHTML = `<svg class="tab" width="40" height="12">
      <path
        d="M 0 12
           a 6 6 90 0 0 6 -6
           a 6 6 90 0 1 6 -6
           h 16
           a 6 6 90 0 1 6 6
           a 6 6 90 0 0 6 6">
      </path>
    </svg>`;
    shadow.appendChild(div.firstElementChild);
  }
}
customElements.define("tg-tab", TGTab);

//
// TGHat - makes the bulge on top of a TGTrigger. Purely decorative.
//

class TGHat extends SimpleBlock {
  static tagName = "tg-hat";
}
customElements.define("tg-hat", TGHat);

//
// TGLocals - holds values that are local to a block
//

class TGLocals extends SimpleBlock {
  static tagName = "tg-locals";
}
customElements.define("tg-locals", TGLocals);

//
// TGReturns - holds the result of a block that can be used by subsequent blocks
//
class TGReturns extends SimpleBlock {
  static tagName = "tg-returns";
}
customElements.define("tg-returns", TGReturns);

class TGContains extends SimpleBlock {
  static tagName = "tg-contains";
}
customElements.define("tg-contains", TGContains);

//
// TGSocket - holds value block and/or input
//
class TGSocket extends SimpleBlock {
  static tagName = "tg-socket";
}
customElements.define("tg-socket", TGSocket);

//
// TGDetails - replacement for <details> to work better with blocks
//
class TGDetails extends SimpleBlock {
  static tagName = "tg-details";
}
customElements.define("tg-details", TGDetails);

//
// TGSummary - replacement for <summary> to work better with blocks
//
class TGSummary extends SimpleBlock {
  static tagName = "tg-summary";
}
customElements.define("tg-summary", TGSummary);

//
// TGValue - standalone values
//

class TGValue extends TGBlock {
  static _structure = `<span class="name"></span>`;
  static tagName = "tg-value";
  update() {
    this.querySelector(".name").replaceChildren(this.name);
  }
}
customElements.define("tg-value", TGValue);

//
// TGStep - the workhorse of Waterbear
//

class TGStep extends TGBlock {
  static _structure = `<tg-tab></tg-tab><header><span class="name"></span> <span class="params"></span> <tg-returns title="Returned value of this block"></tg-returns></header>`;
  static tagName = "tg-step";
  update() {
    this.querySelector(".name").innerText = this.name;
    this.querySelector(".params").replaceChildren(...this.mapParams());
    this.querySelector("tg-returns").replaceChildren(this.returnsElement());
  }
}
customElements.define("tg-step", TGStep);

//
// TGContext - a container for steps (and a step itself)
//

class TGContext extends TGBlock {
  static _structure = `<tg-tab></tg-tab><tg-details open><tg-summary><header><span class="name"></span> <span class="params"></span> <tg-returns title="Returned value of this block"></header><span class="locals"></span></tg-summary><tg-contains></tg-contains></tg-details>`;
  static tagName = "tg-context";
  update() {
    let name = this.querySelector(".name");
    name.innerText = this.name;
    name.addEventListener("click", toggleOpen);
    this.querySelector(".params").replaceChildren(...this.mapParams());
    this.querySelector("tg-returns").replaceChildren(this.returnsElement());
    this.querySelector(".locals").replaceWith(this.wrappedLocals());
  }
}
customElements.define("tg-context", TGContext);

//
// TGTrigger - a starting point for a script, fired by an event occurring
//

class TGTrigger extends TGBlock {
  static _structure = `<tg-hat></tg-hat><tg-details open><tg-summary><header><span class="name"></span> </header><span class="locals"></span></tg-summary><tg-contains></tg-contains></tg-details>`;
  static tagName = "tg-trigger";
  update() {
    let name = this.querySelector(".name");
    name.innerText = this.name;
    name.addEventListener("click", toggleOpen);
    this.querySelector(".locals").replaceWith(this.wrappedLocals());
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

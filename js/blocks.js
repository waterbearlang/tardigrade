// FIXME: These should be extracted from .moon files
const selectChoices = {
  AngleUnit: ["degrees", "radians"],
  EdgeChoice: ["pass", "bounce", "wrap", "stop"],
  WaveChoice: ["sine", "saw", "square", "triangle", "pulse"],
};

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
      try {
        obj[key] = props[key];
      } catch (e) {
        console.error(`setting property failed on ${this.tagName} for ${key}`);
      }
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
  static tagName = "tg-input-param";

  update() {
    this.querySelector(".name").firstChild.replaceWith(this.name);
    let input = this.querySelector("input");
    input.setAttribute("wbtype", this.type);
    input.setAttribute("value", this.returnName);
  }
}
customElements.define("tg-input-param", TGInputParam);

class TGTruthParam extends TGBlock {
  static _structure = `<span><span class="name"></span> <input type="checkbox" wbtype="truth" value=""></span>`;
  static tagName = "tg-truth-param";
  update() {
    this.querySelector(".name").innerText = this.name;
    let input = this.querySelector("input");
    input.checked = this.value === "true";
  }
}
customElements.define("tg-truth-param", TGTruthParam);

class TGSelectParam extends TGBlock {
  static _structure = `<select></select>`;
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
  static _structure = `<label class="name"></label> <input type="text" wbtype="" readonly title="">`;
  static tagName = "tg-block-param";
  update() {
    this.querySelector(".name").innerText = this.name;
    let input = this.querySelector("input");
    input.setAttribute("wbtype", this.type);
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
  static _structure = `<tg-tab></tg-tab><details open><summary><header><span class="name"></span> <span class="params"></span> <tg-returns title="Returned value of this block"></header><span class="locals"></span></summary><tg-contains></tg-contains></details>`;
  static tagName = "tg-context";
  update() {
    this.querySelector(".name").innerText = this.name;
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
  static _structure = `<tg-hat></tg-hat><details open><summary><header><span class="name"></span> </header><span class="locals"></span></summary><tg-contains></tg-contains></details>`;
  static tagName = "tg-trigger";
  update() {
    this.querySelector(".name").innerText = this.name;
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

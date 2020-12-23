import heresy from "../lib/heresy.min.js";
const { define, html, render } = heresy;

// FIXME: These should be extracted from .moon files
const selectChoices = {
  angleunit: ["degrees", "radians"],
  edgechoice:  ["pass", "bounce", "wrap", "stop"],
  wavechoice: ["sine", "saw", "square", "triangle", "pulse"]
};

//
// WBBlock - never instantiated as an element, but holds utility functionality for blocks to subclass
//
// Should be refactored to use groups of functionality by composition vs. inheritance once it's clear
// which blocks need which bits. For now, just toss it all here and we'll see what sticks.
//

class WBBlock extends HTMLElement {
  static create(props) {
    props = props || {};
    const obj = this.new();
    Object.keys(props).forEach(key => {
      obj[key] = props[key];
    });
    return obj;
  }
  static style(WBParam) {
    return `${WBParam} {
      display: inline-block;
    }`;
  }
  get ns() {
    return this.getAttribute("ns");
  }
  set ns(val) {
    this.setAttribute("ns", val);
  }
  get fn() {
    return this.getAttribute("fn");
  }
  set fn(val) {
    this.setAttribute("fn", val);
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

  get returntype() {
    return this.getAttribute("returntype");
  }

  set returntype(val) {
    this.setAttribute("returntype", val);
  }

  get function() {
    return window.runtime[this.ns][this.fn];
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

  mapParams() {
    // val is array of AST parameter objects. Each object has a name and a type.
    return this.params.map(param => {
      // console.log("map parameter: %o", param);
      const type = param.type.toLowerCase();
      if (["text", "number", "integer", "float", "color"].includes(type)) {
        return WBInputParam.create({ fn: param.name, type: type });
      }
      if (type === "truth") {
        return WBTruthParam({ fn: param.name, type: type });
      }
      if (["angleunit", "edgechoice", "wavechoice"].includes(type)){
        return WBSelectParam.create({
          fn: param.name,
          choices: selectChoices[type]
        });
      }
      if (["vector", "image", "sprite", "angle", "shape"].includes(type)) {
        return WBBlockParam.create({ fn: param.name, blocktype: type });
      }
      if (type.includes('list')){
        // List types exist for all primitive types, for struct types, and even for other list types.
        // Some list types can be late-bound, so "list of what" is not known until parameters
        // are added
        return WBBlockParam.create({ fn: param.name, blocktype: type });
      }
      if (type === 'type'){
        // late bound type, depends on the type of argument used
        // for WB this will be handled in the interface for inserting arguments 
        // (whether by click, drag-and-drop, cut-and-paste, undo/redo or whatevs)
        return WBBlockParam.create({ fn: param.name, blocktype: type });
      }
      console.error("Unrecognized parameter type: %s", param.type);
      throw new Error("Unrecognized parameter type: " + param.type);
    });
  }

}

class WBInputParam extends WBBlock {
  static get name() {
    return "WBInputParam";
  }
  static get tagName() {
    return "wb-input-value";
  }
  render() {
    return this
      .html`${this.fn} <input type="${this.type}" value="${this.value}" >`;
  }
}
WBInputParam = define(WBInputParam);


class WBTruthParam extends WBBlock {
  static get name() {
    return "WBTruthParam";
  }
  static get tagName() {
    return "wb-truth-value";
  }
  render() {
    return this.html`${this.fn} <checkbox type="boolean" ${
      this.value ? "checked" : ""
    } >`;
  }
}
WBTruthParam = define(WBTruthParam);

class WBSelectParam extends WBBlock {
  static get name(){
    return "WBSelectParam";
  }
  static get tagName(){
    return "wb-select-value";
  }
  render(){
    const obj = document.createElement('select');
    obj.innerHTML = this.choices.map(choice => `<option value="${choice}" ${this.value === choice ? "selected" : ""}>`).join('');
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
    return "wb-block-value";
  }
  get blocktype() {
    return this.getAttribute("blocktype");
  }
  set blocktype(val) {
    this.setAttribute("blocktype", val);
  }
  render() {
    return this
      .html`${this.fn} <input type="${this.blocktype}" readonly title="drag a ${this.blocktype} block here">`;
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
  static style(WBTab) {
    return `${WBTab}{
      display: inline-block;
      position: absolute;
      margin: 0;
      padding: 0;
      left: 25px;
      top: -12px;
    }`;
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
// WBSlot - makes the indent at the bottom of a block
//

class WBSlot extends HTMLElement {
  static get name() {
    return "WBSlot";
  }
  static get tagName() {
    return "wb-slot";
  }
  static style(WBSlot) {
    return `${WBSlot}{
      position: absolute;
      margin: 0;
      padding: 0;
      display: block;
      width: 40px;
      height: 12px;
      left: 25px;
      bottom: 0px;
      fill: white;
    }`;
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
WBSlot = define(WBSlot);

//
// WBStep - the workhorse of Waterbear
//

class WBStep extends WBBlock {
  static get name() {
    return "WBStep";
  }
  static get tagName() {
    return "wb-step";
  }

  static style(WBStep) {
    return `${WBStep} {
      display: inline-block;
      background-color: #EDE378;
      border-radius: 5px;
      border-color: #CEBD3E;
      border-width: 2px;
      border-style: solid;
      margin: 5px 5px 2px 2px;
      padding-left: 10px;
      padding-bottom: 14px;
      position: relative;
      z-index: 0;    
    }`;
  }

  render() {
    const params = this.mapParams();
    switch (params.length) {
      case 0:
        return this.html`<wb-tab/><header>${this.fn}</header><wb-slot/>`;
      case 1:
        return this
          .html`<wb-tab/><header>${this.fn} ${params[0]}</header><wb-slot/>`;
      case 2:
        return this
          .html`<wb-tab/><header>${this.fn} ${params[0]} ${params[1]}</header><wb-slot/>`;
      case 3:
        return this
          .html`<wb-tab/><header>${this.fn} ${params[0]} ${params[1]} ${params[2]}</header><wb-slot/>`;
      default:
        console.error(
          "Unsupported number of parameters, use an object or array parameter instaed."
        );
        throw new Error(
          "Unsupported number of parameters, use an object or array parameter instead."
        );
    }
  }
}
WBStep = define(WBStep);

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

  static style(WBContext) {
    return `${WBContext} {
      display: inline-block;
      background-color: #EDE378;
      border-radius: 5px;
      border-color: #CEBD3E;
      border-width: 2px;
      border-style: solid;
      margin: 5px 5px 2px 2px;
      padding-left: 10px;
      padding-bottom: 14px;
      position: relative;
      z-index: 0;    
    }`;
  }
  render() {
    const params = this.mapParams();
    switch (params.length) {
      case 0:
        return this.html`<wb-tab/><details open><summary><header>${this.fn}</header></summary><wb-contains></wb-contains></details><wb-slot/>`;
      case 1:
        return this.html`<wb-tab/><details open><summary><header>${this.fn} ${params[0]}</header></summary><wb-contains></wb-contains></details><wb-slot/>`
      case 2:
        return this.html`<wb-tab/><details open><summary><header>${this.fn} ${params[0]} ${params[1]}</header></summary><wb-contains></wb-contains></details><wb-slot/>`
      case 3:
        return this.html`<wb-tab/><details open><summary><header>${this.fn} ${params[0]} ${params[1]} ${params[2]}</header></summary><wb-contains></wb-contains></details><wb-slot/>`
      default:
        console.error(
          "Unsupported number of parameters, use an object or array parameter instaed."
        );
        throw new Error(
          "Unsupported number of parameters, use an object or array parameter instead."
        );
    }
  }
}
WBContext = define(WBContext);

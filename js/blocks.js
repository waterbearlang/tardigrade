import heresy from "../lib/heresy.min.js";
const { define, html, render } = heresy;

// FIXME: These should be extracted from .moon files
const selectChoices = {
  angleunit: ["degrees", "radians"],
  edgechoice:  ["pass", "bounce", "wrap", "stop"],
  wavechoice: ["sine", "saw", "square", "triangle", "pulse"]
};

class WBBlock extends HTMLElement {
  static create(props) {
    props = props || {};
    const obj = this.new();
    Object.keys(props).forEach(key => {
      obj[key] = props[key];
    });
    return obj;
  }
  static style(WBValue) {
    return `${WBValue} {
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
}

class WBInputValue extends WBBlock {
  static get name() {
    return "WBInputValue";
  }
  static get tagName() {
    return "wb-input-value";
  }
  render() {
    return this
      .html`${this.fn} <input type="${this.type}" value="${this.value}" >`;
  }
}
WBInputValue = define(WBInputValue);


class WBTruthValue extends WBBlock {
  static get name() {
    return "WBTruthValue";
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
WBTruthValue = define(WBTruthValue);

class WBSelectValue extends WBBlock {
  static get name(){
    return "WBSelectValue";
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
WBSelectValue = define(WBSelectValue);

class WBBlockValue extends WBBlock {
  static get name() {
    return "WBBlockValue";
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
WBBlockValue = define(WBBlockValue);

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
      console.log("map parameter: %o", param);
      const type = param.type.toLowerCase();
      if (["text", "number", "color"].includes(type)) {
        return WBInputValue.create({ fn: param.name, type: type });
      }
      if (type === "truth") {
        return WBTruthValue({ fn: param.name, type: type });
      }
      if (["angleunit", "edgechoice", "wavechoice"].includes(type)){
        return WBSelectValue.create({
          fn: param.name,
          choices: selectChoices[type]
        });
      }
      if (["vector", "image", "sprite", "angle", "shape"].includes(type)) {
        return WBBlockValue.create({ fn: param.name, blocktype: type });
      }
      console.error("Unrecognized parameter type: %s", param.type);
      throw new Error("Unrecognized parameter type: " + param.type);
    });
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

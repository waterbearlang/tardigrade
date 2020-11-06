import heresy from "../lib/heresy.min.js";
const { define, html, render } = heresy;

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

class WBNumberValue extends WBBlock {
  static get name() {
    return "WBNumberValue";
  }
  static get tagName() {
    return "wb-number-value";
  }
  render() {
    return this.html`${this.fn} <input type="number" value="${this.value}" >`;
  }
}
WBNumberValue = define(WBNumberValue);

class WBTextValue extends WBBlock {
  static get name() {
    return "WBTextValue";
  }
  static get tagName() {
    return "wb-text-value";
  }
  render() {
    return this.html`${this.fn} <input type="text" value="${this.value}" >`;
  }
}
WBTextValue = define(WBTextValue);

class WBColorValue extends WBBlock {
  // FIXME: Implement cross-platform color picker based on hsluv perceptually consistent colors
  static get name() {
    return "WBColorValue";
  }
  static get tagName() {
    return "wb-color-value";
  }
  render() {
    return this.html`${this.fn} <input type="color" value="${this.value}" >`;
  }
}
WBColorValue = define(WBColorValue);

class WBBooleanValue extends WBBlock{
  static get name(){
    return "WBBooleanValue";
  }
  static get tagName(){
    return "wb-boolean-value";
  }
  render(){
    return this.html`${this.fn} <checkbox type="boolean" ${this.value ? "checked" : ""} >`;
  }
}
WBBooleanValue = define(WBBooleanValue);

class WBAngleUnit extends WBBlock {
  static get name() {
    return "WBAngleUnit";
  }
  static get tagName() {
    return "wb-angle-unit";
  }
  render() {
    return this
      .html`<select><option value="deg" selected>degrees</option><option value="rad">radians</option></select>`;
  }
}
WBAngleUnit = define(WBAngleUnit);

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
    return this.html`${this.fn} <input type="${this.blocktype}" readonly title="drag a ${this.blocktype} block here">`;
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
      switch (param.type.toLowerCase()) {
        case "text":
          return WBTextValue.create({ fn: param.name }); // FIXME: Passing values to new doesn't actually do anything
        case "number":
          return WBNumberValue.create({ fn: param.name });
        case "color":
          return WBColorValue.create({ fn: param.name });
        case "boolean":
          return WBColorValue.create({ fn: param.name });
        case "angleunit":
          return WBAngleUnit.create({ fn: param.name });
        case "vector":
          return WBBlockValue.create({ fn: param.name, blocktype: "vector" });
        default:
          console.error("Unrecognized parameter type: %s", param.type);
          throw new Error("Unrecognized parameter type: " + param.type);
      }
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

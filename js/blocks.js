import heresy from "../lib/heresy.min.js";
const {define, html, render} = heresy;

class WBValue extends HTMLElement {
  static get name() {
    return "WBValue";
  }
  static get tagName() {
    return "wb-value";
  }
  static style(WBValue) {
    return `${WBValue} {
      display: inline-block;
    }`;
  }
  get ns() {
    return this.getAttribute("ns");
  }
  set ns(val){
    this.setAttribute('ns', val);
  }
  get fn() {
    return this.getAttribute("fn");
  }
  set fn(val){
    this.setAttribute('fn', val);
  }
  get value(){
    return this._value;
  }
  set value(val){
    this._value = val;
  }

  _conditionalSetAttribute(name) {
    if (this.hasAttribute(name)) {
      this._input.setAttribute(name, this.getAttribute(name));
    }
  }
}
//define(WBValue);

class WBNumberValue extends WBValue {
  static get name() {
    return "WBNumberValue";
  }
  static get tagName() {
    return "wb-number-value";
  }
  render() {
    return this.html`this.fn <input type="number" value="${this.value}" >`;
  }
}
WBNumberValue = define(WBNumberValue);

class WBTextValue extends WBValue {
  static get name() {
    return "WBTextValue";
  }
  static get tagName() {
    return "wb-text-value";
  }
  render() {
    return this.html`${this.fn} <input type="text" value="${this.value} >`;
  }
}
WBTextValue = define(WBTextValue);

class WBColorValue extends WBValue {
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

class WBStep extends HTMLElement {
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
      float: left;
      clear: left;
      position: relative;
      z-index: 0;    
    }`;
  }

  get ns() {
    return this.getAttribute("ns");
  }

  set ns(val){
    this.setAttribute('ns', val);
  }

  get fn() {
    return this.getAttribute("fn");
  }

  set fn(val){
    this.setAttribute('fn', val);
  }

  get type(){
    return this.getAttribute("type");
  }

  set type(val){
    this.setAttribute('type', val);
  }

  get function() {
    return window.runtime[this.ns][this.fn];
  }

  get body() {
    return this._body;
  }

  set body(val){
    this._body = val;
  }

  get params() {
    return this._params;
  }

  set params(val){
    this._params = val;
  }

  mapParams() {
    // val is array of AST parameter objects. Each object has a name and a type.
    return this.params.map(param => {
      console.log("map parameter: %o", param);
      switch (param.type.toLowerCase()) {
        case "text":
          return WBTextValue.new(this.ns, param.name);
        case "number":
          return WBNumberValue.new(this.ns, param.name);
        case "color":
          return WBColorValue.new(this.ns, param.name);
        default:
          throw new Error("Unrecognized parameter type: %s", param.type);
      }
    });
  }

  render() {
    const params = this.mapParams();
    switch (params.length) {
      case 0:
        return this.html`<wb-tab/><header>${this.fn}</header><wb-slot/>`;
      case 1:
        return this.html`<wb-tab/><header>${this.fn} ${
          params[0]
        }</header><wb-slot/>`;
      case 2:
        return this.html`<wb-tab/><header>${this.fn} ${params[0]} ${
          params[1]
        }</header><wb-slot/>`;
      case 3:
        return this.html`<wb-tab/><header>${this.fn} ${params[0]} ${
          params[1]
        } ${params[2]}</header><wb-slot/>`;
      default:
        throw new Error(
          "Unsupported number of parameters, use an object or array parameter instead."
        );
    }
  }
}
WBStep = define(WBStep);

import heresy from "../lib/heresy.min.js";

window.heresy = heresy;

const getMethods = obj => {
  let properties = new Set();
  let currentObj = obj;
  do {
    Object.getOwnPropertyNames(currentObj).map(item => properties.add(item));
    if (currentObj === Object.getPrototypeOf(currentObj)) break;
  } while ((currentObj = Object.getPrototypeOf(currentObj)));
  return [...properties.keys()]
    .filter(item => !["caller", "callee", "arguments"].includes(item))
    .filter(item => typeof obj[item] === "function");
};

class WBValue extends HTMLElement {
  constructor() {
    super();
  }
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
  get fn() {
    return this.getAttribute("fn");
  }

  _conditionalSetAttribute(name) {
    if (this.hasAttribute(name)) {
      this._input.setAttribute(name, this.getAttribute(name));
    }
  }
}
//heresy.define(WBValue);

class WBNumberValue extends WBValue {
  constructor() {
    super();
    this.input = this.html.node`<input type="number"/>`;
    this._conditionalSetAttribute("min");
    this._conditionalSetAttribute("max");
    this._conditionalSetAttribute("value");
  }
  static get name() {
    return "WBNumberValue";
  }
  static get tagName() {
    return "wb-number-value";
  }
  get value() {
    return Number(this._input.value);
  }
  render() {
    return this.html`this.fn ${this._input}`;
  }
}
heresy.define(WBNumberValue);

class WBTextValue extends WBValue {
  constructor() {
    super();
    this._input = this.html.node`<input type="text" />`;
    this._conditionalSetAttribute("value");
  }
  static get name() {
    return "WBTextValue";
  }
  static get tagName() {
    return "wb-text-value";
  }
  get value() {
    return this._input.value;
  }
  render() {
    return this.html`${this.fn} ${this._input}`;
  }
}
heresy.define(WBTextValue);

class WBColorValue extends WBValue {
  // FIXME: Implement cross-platform color picker based on hsluv perceptually consistent colors
  constructor() {
    super();
    this._input = this.html.node`<input type="color" />`;
    this._conditionalSetAttribute("value");
  }
  static get name() {
    return "WBColorValue";
  }
  static get tagName() {
    return "wb-color-value";
  }
  render() {
    return this.html`${this.fn} ${this._input}`;
  }
}
heresy.define(WBColorValue);

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
heresy.define(WBTab);
console.log("WBTab defined");

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
heresy.define(WBSlot);
console.log("WBSlot defined");

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

  set ns(val) {
    this.setAttribute("ns", val);
  }

  get fn() {
    return this.getAttribute("fn");
  }

  set fn(val) {
    this.setAttribute("fn", val);
  }

  get function() {
    return window.runtime[this.ns][this.fn];
  }
  set body(val) {
    this._body = val; // We'll need to process this into a script later
  }
  get body() {
    return this._body;
  }
  set params(val) {
    // val is array of AST parameter objects. Each object has a name and a type.
    this._params = val;
  }
  get params() {
    return this._params;
  }

  mapParams() {
    // val is array of AST parameter objects. Each object has a name and a type.
    return this.params.map(param => {
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

  // (optional) event driven lifecycle methods, added automatically when
  // no Custom Elements native methods such as connectedCallback, and others
  // have been explicitly set as methods

  onconnected(event) {
    console.log("connected: %o", event);
  }

  ondisconnected(event) {
    console.log("disconnected");
  }

  onattributechanged(event) {
    console.log(
      "attribute changed: %s was %s now %s",
      event.attributeName,
      event.oldValue,
      event.newValue
    );
  } // event = {attributeName, oldValue, newValue}

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
    return this.html`<wb-tab/><header>${this.htmlSignature}</header><wb-slot/>`;
  }
}
heresy.define(WBStep);
console.log("WBStep defined");

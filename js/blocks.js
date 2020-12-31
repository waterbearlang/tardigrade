import heresy from "../lib/heresy.min.js";
const { define, html, render } = heresy;

// FIXME: These should be extracted from .moon files
const selectChoices = {
  AngleUnit: ["degrees", "radians"],
  EdgeChoice: ["pass", "bounce", "wrap", "stop"],
  WaveChoice: ["sine", "saw", "square", "triangle", "pulse"],
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
    const obj = document.createElement(this.tagName);
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

  get returntype() {
    return this.getAttribute("returntype");
  }

  set returntype(val) {
    this.setAttribute("returntype", val);
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

  get choices(){
    return selectChoices[this.type];
  }

  mapParams() {
    // val is array of AST parameter objects. Each object has a name and a type.
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
  static get name() {
    return "WBInputParam";
  }
  static get tagName() {
    return "wb-input-param";
  }
  render() {
    return this
      .html`${this.name} <input type="${this.type}" value="${this.value}" >`;
  }
}
try{
  WBInputParam = define(WBInputParam);
}catch(e){
  console.error('problem defining WBInputParam');
  console.trace(e);
}

class WBTruthParam extends WBBlock {
  static get name() {
    return "WBTruthParam";
  }
  static get tagName() {
    return "wb-truth-param";
  }
  render() {
    return this.html`${this.name} <checkbox type="boolean" ${
      this.value ? "checked" : ""
    } >`;
  }
}
try{
  WBTruthParam = define(WBTruthParam);
}catch(e){
  console.error('problem defining WBTruthParam');
  console.trace(e);
}

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
try{
  WBSelectParam = define(WBSelectParam);
}catch(e){
  console.error('problem defining WBTruthParam');
  console.trace(e);
}
  
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
      .html`${this.name} <input type="${this.type}" readonly title="drag a ${this.type} block here">`;
  }
}
try{
  WBBlockParam = define(WBBlockParam);
}catch(e){
  console.error('problem defining WBBlockParam');
  console.trace(e);
}

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
      left: 15px;
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
try{
  WBTab = define(WBTab);
}catch(e){
  console.error('problem defining WBTab');
  console.trace(e);
}

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
  static style(WBHat) {
    return `${WBHat}{
      display: inline-block;
      position: absolute;
      margin: 0;
      padding: 0;
      width: 100px;
      height: 12px;
      left: 5px;
      top: -12px;
      overflow: hidden;
    }`;
  }
}
try{
  WBHat = define(WBHat);
}catch(e){
  console.error('problem defining WBHat');
  console.trace(e);
}

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
      left: 15px;
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
try{
  WBSlot = define(WBSlot);
}catch(e){
  console.error('problem defining WBSlot');
  console.trace(e);
}

//
// WBLocals - holds variables that are local to a block
//

class WBLocals extends HTMLElement {
  static get name() {
    return "WBLocals";
  }
  static get tagName() {
    return "wb-locals";
  }
  static style(WBLocals) {
    return `${WBLocals}{
      position: relative;
      display: flex;
      flex-direction: row;
      background-color: white;
      padding: 1px;
      border-radius: 5px;
    }`;
  }
}
try{
  WBLocals = define(WBLocals);
}catch(e){
  console.error('problem defining WBLocals');
  console.trace(e);
}

//
// WBReturns - holds the result of a block that can be used by subsequent blocks
//
class WBReturns extends HTMLElement {
  static get name(){
    return "WBReturns";
  }
  static get tagName(){
    return "wb-returns";
  }
  static style(WBReturns){
    return `${WBReturns}{
      position: relative;
      display: inline-block;
      padding: 1px;
      background-color: white;
      border-radius: 5px;
    }`;
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

  static style(WBValue) {
    return `${WBValue}{
      display: inline-block;
      border-radius: 5px;
      border-style: solid;
      padding: 5px;
      padding-left: 1.5em;
      background: left / 1em no-repeat #FFF url(../images/fa-svg/regular/question-circle.svg);
      margin-bottom: 5px;
    }`;
  }

  render() {
    return this.html`${this.name}`;
  }
}
try{
  window.WBValue = define(WBValue);
}catch(e){
  console.error('problem defining WBValue');
  console.trace(e);
}

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
    return this.html`<wb-tab/><header>${
      this.name
    } ${this.mapParams()}</header><wb-slot/>`;
  }
}
try{
  window.WBStep = define(WBStep);
}catch(e){
  console.error('problem defining WBStep');
  console.trace(e);
}

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
    return this.html`<wb-tab/><details open><summary><header>${
      this.name
    } ${this.mapParams()}</header><wb-slot/></summary><wb-contains /></details><wb-slot/>`;
  }
}
try{
  window.WBContext = define(WBContext);
}catch(e){
  console.error('problem defining WBContext');
  console.trace(e);
}

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

  static style(WBTrigger) {
    return `${WBTrigger} {
      display: inline-block;
      background-color: #EDE378;
      border-radius: 5px;
      border-color: #CEBD3E;
      border-width: 2px;
      border-style: solid;
      margin: 5px 5px 12px 2px;
      padding-left: 10px;
      padding-bottom: 14px;
      position: relative;
      z-index: 0;    
    }`;
  }
  render() {
    let locals;
    if (this.locals.length){
      locals = new WBLocals();
      this.locals.forEach(value => {
        value.ns = this.ns;
        locals.appendChild(WBValue.create(value));
      });
    }
    return this
      .html`<wb-hat/><details open><summary><header>${this.name}</header>${locals}<wb-slot/></summary><wb-contains></wb-contains></details>`;
  }
}
try{
  window.WBTrigger = define(WBTrigger);
}catch(e){
  console.error('problem defining WBTrigger');
  console.trace(e);
}

// Attribution for Font Awesome icons
console.info(`Font Awesome Pro 5.15.1 by @fontawesome - https://fontawesome.com
License - https://fontawesome.com/license (Commercial License)
`);

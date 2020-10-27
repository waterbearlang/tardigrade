import { define, ref, render, html } from "../lib/heresy.min.js";

class WBValue extends HTMLSpanElement{
  static get name(){
    return "WBValue";
  }
  static get tagName(){
    return "wb-value";
  }
}

class WBTab extends SVGSVGElement {
  static get name() {
    return "WBTab";
  }
  static get tagName() {
    return "wb-tab";
  }
  oninit() {
    this.setAttribute("width", "40");
    this.setAttribute("height", "12");
    // this.width = 40;
    // this.height = 12;
  }
  onconnected() {
    console.log(this.outerHTML);
  }
  static style(WBTab) {
    return `${WBTab}{
      position: absolute;
      left: 25px;
      top: -12px;
    }`;
  }
  render() {
    return this.svg`<path d="M 0 12 
    a 6 6 90 0 0 6 -6 
    a 6 6 90 0 1 6 -6
    h 16
    a 6 6 90 0 1 6 6
    a 6 6 90 0 0 6 6"></path>`;
  }
}
define(WBTab);
console.log("WBTab defined");

class WBSlot extends WBTab {
  static get name() {
    return "WBSlot";
  }
  static get tagName() {
    return "wb-slot";
  }
  static style(WBSlot) {
    return `${WBTab}{
      position: absolute;
      display: block;
      left: 25px;
      bottom: -2px;
      fill: white;
    }`;
  }
}
define(WBSlot);
console.log("WBSlot defined");

class WBStep extends HTMLElement {
  static get name() {
    return "WBStep";
  }
  static get tagName() {
    return "wb-step";
  }
  onconnected() {
    console.log(this.outerHTML);
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
  get mappedAttributes() { return ['ns', 'fn']; }

  // (optional) event driven lifecycle methods, added automatically when
  // no Custom Elements native methods such as connectedCallback, and others
  // have been explicitly set as methods
  onconnected(event) {
    console.log("connected");
  }
  ondisconnected(event) {
    console.log("disconnected");
  }
  onattributechanged(event) {
    console.log("attribute changed");
  } // event = {attributeName, oldValue, newValue}
  // define this to return the signature as text
  get signature() {}
  // define this to return the signature as html
  get signatureHTML() {
    // fake it for now
    return '<wb-value type="color,wb-image" class="">clear to color <input type="color" style="width: 57.7256px" class=""></wb-value>';
  }
  render() {
    this.html`<wb-tab/><header>${this.signatureHTML}</header><wb-slot/>`;
  }
}

define(WBStep);
console.log("WBStep defined");

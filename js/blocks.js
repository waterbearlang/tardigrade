import { define, ref, render, html } from "../lib/heresy.min.js";

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
}
define(WBValue);

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
define(WBTab);
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
define(WBSlot);
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
  get mappedAttributes() {
    return ["ns", "fn"];
  }

  // (optional) event driven lifecycle methods, added automatically when
  // no Custom Elements native methods such as connectedCallback, and others
  // have been explicitly set as methods
  handleEvent(event) {
    this['on' + event.type](event);
  }
  onconnected(event) {
    console.log("connected");
  }
  ondisconnected(event) {
    console.log("disconnected");
  }
  onattributechanged(event) {
    console.log("attribute changed");
  } // event = {attributeName, oldValue, newValue}
  onclick(){
    alert('clicked');
  }
  // define this to return the signature as text
  get signature() {}
  // define this to return the signature as html
  render() {
    return this
      .html`<wb-tab/><header><wb-value type="color,wb-image" class="">clear to color <input type="color" style="width: 57.7256px" class=""></wb-value></header><wb-slot/>`;
  }
}

define(WBStep);
console.log("WBStep defined");

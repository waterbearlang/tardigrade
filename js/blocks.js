import {define, ref, render, html} from "../lib/heresy.min.js";


class WBTab extends SVGSVGElement{
  static get name(){ return 'WBTab'; }
  static get tagName(){ return 'wb-tab'; }
  oninit(){
    this.className = 'tab';
    this.setAttribute('width', '40');
    this.setAttribute('height', '12');
    // this.width = 40;
    // this.height = 12;
  }
  onconnected() { console.log(this.outerHTML); }
  static style(WBTab){
    return `${WBTab}{
       border: 2px solid black;
    }`;
  }
}

define(WBTab);

class WBStep extends HTMLElement{
  static get name(){ return 'WBStep'; }
  static get tagName() { return 'wb-step'; }
   onconnected() { console.log(this.outerHTML); }
  static style(WBStep){
    return `${WBStep} {
      border: 2px solid black;
    }`
  }
  // (optional) event driven initialization that will happen only once
  // the ideal constructor substitute for any sort of one-off init
  // this is triggered only once the component goes live, never before *
  // * unless explicitly dispatched, of course
  oninit(event) {}

  // (optional) event driven lifecycle methods, added automatically when
  // no Custom Elements native methods such as connectedCallback, and others
  // have been explicitly set as methods
  onconnected(event) {}
  ondisconnected(event) {}
  onattributechanged(event = {attributeName, oldValue, newValue}) {}

  // (optional) attributes that can either be true or false once accessed
  // reflected on the DOM as either present, or not
  get booleanAttributes() { return ['checked']; }

  // (optional) store any value directly and dispatch `on${name}` on changes
  get mappedAttributes() { return ['data']; }
  // if `ondata(event){}` is defined, event.detail will have the new value

  // (optional) native Custom Elements behavior with changes dispatched
  // through the onattributechanged callback
  get observedAttributes() { return ['name', 'age']; }

  // (optional) populate this custom element content
  //            if the signature has at least one argument,
  //            as in render({useState, ...}),
  //            the render will be bound automatically
  //            with hooks capabilities
  render() {
    // this.html or this.svg are provided automatically
    this.html`Click ${this.props.name}!`;
  }

  // (optional) automatically defined to trigger
  // this[`on${event.type}`](event);
  handleEvent(event) {}

  // (optional) automatically defined to return this.getAttribute('is')
  get is () {}
}

define(WBStep);


Step Structure

<wb-step ns="stage" fn="clearTo" class="" style="" id="ke96d2b"><svg class="tab" width="40" height="12"><path d="M 0 12 
    a 6 6 90 0 0 6 -6 
    a 6 6 90 0 1 6 -6
    h 16
    a 6 6 90 0 1 6 6
    a 6 6 90 0 0 6 6"></path></svg><header><wb-value type="color,wb-image" class="">clear to<input type="color" style="width: 57.7256px;" class=""></wb-value></header>

                <svg class="slot" width="40" height="12"><path d="M 0 12 
    a 6 6 90 0 0 6 -6 
    a 6 6 90 0 1 6 -6
    h 16
    a 6 6 90 0 1 6 6
    a 6 6 90 0 0 6 6"></path></svg></wb-step>
import { parse } from "./moonshine.js";
import { define, ref, render, html } from "../lib/heresy.min.js";
import * as R from "../lib/ramda.min.js";
import * as immer from "../lib/immer.min.js";
import dragula from "../lib/dragula.min.js";

console.log({ immer, R, parse, dragula, define, ref, render, html });

const processScript = async script => {
  const tree = await parse(script);
  console.log(tree);
};

const processError = script => {
  console.log(script);
};

const blockScripts = ["vector", "stage"];

blockScripts.forEach(name =>
  fetch(`/blocks/${name}.moon`).then(response =>
    response.text().then(text => processScript(text))
  )
);

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
      float: left;
      clear: left;
      position: relative;
      z-index: 0;    
    }`;
  }
}
define(WBStep);

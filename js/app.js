import { parse } from "./moonshine.js";
import {define, ref, render, html} from "../lib/heresy.min.js";
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

class WBStep extends HTMLElement{
  static get name(){ return 'WBStep'; }
  static get tagName() { return 'wb-step'; }
   onconnected() { console.log(this.outerHTML); }
  static style(WBStep){
    return `${WBStep} {
      border: 2px solid black;
    }`
  }
}
define(WBStep);
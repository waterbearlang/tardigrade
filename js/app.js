import { parse } from "./moonshine.js";
import heresy from "../lib/heresy.min.js";
import {WBStep} from "./blocks.js";
import * as R from "../lib/ramda.min.js";
import * as immer from "../lib/immer.min.js";
import dragula from "../lib/dragula.min.js";

//console.log({ immer, R, parse, dragula, define, ref, render, html });

window.runtime = {};

const parseTreeToAST = parseTree => {
  console.assert(
    parseTree.type === "namespace",
    "Parse tree must be a namespace"
  );
  const name = parseTree.name;
  const AST = {};
  parseTree.values
    .filter(val => val.type === "function")
    .forEach(val => (AST[val.name] = val));
  return [name, AST];
};

const processScript = async script => {
  const parseTree = await parse(script);
  const [name, AST] = parseTreeToAST(parseTree);
  window.runtime[name] = AST;
  buildBlockMenu(name, AST);
};

const buildBlockMenu = (name, ast) => {
  const blockmenu = document.querySelector(".blockmenu");
  const target = document.createElement('div');
  Object.keys(ast).forEach(key => {
    const fn = ast[key];
    console.warn(
      '<wb-step ns="%s" fn="%s" type="%s" body=%o params=%o',
      name,
      key,
      fn.returnType,
      fn.body,
      fn.params
    );
    heresy.render(
      target,
      WBStep.create({ns: name, fn: key, returntype: fn.returnType, body: fn.body, params: fn.params}) // just pass fn?
      // heresy.html`<wb-step ns="${name}" fn="${key}" returntype="${fn.returnType}" body=${fn.body} params=${fn.params} />`
      // heresy.html`<wb-step ns="${name}" fn="${key}" returntype="${fn.returnType}" body=$fn.body} params=${[]} />`
    );
    if (target.firstChild){
      blockmenu.appendChild(target.firstChild);
    }else{
      console.error('Failed to build step for %o', fn);
    }
  });
};

const processError = script => {
  console.error(script);
};

const blockScripts = ["vector", "stage"];

blockScripts.forEach(name =>
  fetch(`/blocks/${name}.moon`).then(response =>
    response.text().then(text => processScript(text))
  )
);

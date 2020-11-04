import { parse } from "./moonshine.js";
import heresy from "../lib/heresy.min.js";
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
  console.log('buildBlockMenu(%s, %o)', name, ast);
  const blockmenu = document.querySelector('.blockmenu');
  Object.keys(ast).forEach(key => {
    const fn = ast[key];
    console.log('<wb=step ns="%s" fn="%s" type="%s" body=%o params=%o', name, key, fn.returnType, fn.body, fn.params);
    const step = heresy.render(heresy.html`<wb-step ns="${name}" fn="${key}" type="${fn.returnType}" body=${fn.body} params=${fn.params} />`);
    blockmenu.appendChild(step);
  });
}

const processError = script => {
  console.log(script);
};

const blockScripts = ["vector", "stage"];

blockScripts.forEach(name =>
  fetch(`/blocks/${name}.moon`).then(response =>
    response.text().then(text => processScript(text))
  )
                     
);

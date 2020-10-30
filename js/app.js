import { parse } from "./moonshine.js";
import heresy from "../lib/heresy.min.js";
import * as R from "../lib/ramda.min.js";
import * as immer from "../lib/immer.min.js";
import dragula from "../lib/dragula.min.js";

//console.log({ immer, R, parse, dragula, define, ref, render, html });

window.runtime = {};

const parseTreeToAST = parseTree => {
  console.assert(parseTree.type === 'namespace', "Parse tree must be a namespace");
  const name = parseTree.name;
  const AST = {};
  parseTree.values.forEach(val => if val.type === 'function'{AST[val.name] = val;})
}

const processScript = async (script) => {
  const parseTree = await parse(script);
  const [name, AST] = parseTreeToAST(parseTree);
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


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
  const ast = {};
  parseTree.values
    .filter(val => val.type.toLowerCase() !== "comment")
    .forEach(val => (ast[val.name] = val));
  return [name, ast];
};

const processScript = async (script, menu) => {
  let parseTree;
  try{
    parseTree = await parse(script);
  }catch(e){
    let scriptName = script.split('\n')[0].split(' ')[0];
    console.error('Problem processing script %s', scriptName);
    console.error('Start line %s column %s', e.location.start.line, e.location.start.column);
    console.error('End line %s column %s', e.location.end.line, e.location.end.column);
    console.error(e.message);
    return;
  }
  const [name, ast] = parseTreeToAST(parseTree);
  window.runtime[name] = ast;
  buildBlockMenu(name, ast, menu);
};


const builder = (name, key, fn) => {
  const target = document.createElement("div");
  switch(fn.type.toLowerCase()){
    case 'step':
      heresy.render(
        target,
        heresy.html`<wb-step ns="${name}" fn="${key}" returntype="${fn.returnType}" body=${fn.body} params=${fn.params} />`
      );
      break;
    case 'context':
      heresy.render(
        target,
        heresy.html`<wb-context ns="${name}" fn="${key}" returntype="${fn.returnType}" body=${fn.body} params=${fn.params} />`
      );
      break;
    case 'trigger':
      heresy.render(
        target,
        heresy.html`<wb-trigger ns="${name}" fn="${key}" body=${fn.body} params=${fn.params} />`
      );
      break;
    case 'value':
      heresy.render(
        target,
        heresy.html`<wb-value ns="${name}" fn="${key}" returntype="${fn.returnType}" body=${fn.body} params=${fn.params} />`
      );
      break;
    case 'comment':
      // do nothing
      break;
    default:
      console.warn('Unexpected block type: %s', fn.type);
      break;
  }
  if (target.firstChild) {
    console.info('built target: %o', target.firstChild);
    return target.firstChild;
  } else {
    console.error("Failed to build step for %o", fn.name);
    throw new error(`Failed to build step for ${fn.name}`);
  }
}

const buildBlockMenu = (name, ast, menu) => {
  Object.keys(ast).forEach(key => {
    menu.appendChild(builder(name, key, ast[key]));
  });
};

const processError = script => {
  console.error(script);
};

const blockScripts = ["control", "sprite", "sound", "vector", "stage", "angle", "list"];
const blockmenu = document.querySelector('.blockmenu');

blockScripts.forEach(name => {
  let menu = document.createElement("details");
  menu.setAttribute('open', 'true');
  menu.innerHTML = `<summary class="menu_title">${name}</summary><wb-contains></wb-contains>`;
  blockmenu.appendChild(menu);
  fetch(`/blocks/${name}.moon`).then(response =>
    response.text().then(text => processScript(text, menu.querySelector('wb-contains')))
  );
});

import { parse } from "./moonshine.js";
import heresy from "../lib/heresy.min.js";
import * as R from "../lib/ramda.min.js";
import * as immer from "../lib/immer.min.js";

const blocks = {
  Step: window.WBStep,
  Context: window.WBContext,
  Trigger: window.WBTrigger,
  Value: window.WBValue
};

//console.log({ immer, R, parse, dragula, define, ref, render, html });

window.runtime = {};

const processScript = async (script, menu) => {
  let parseList;
  try{
    parseList = parse(script);
  console.assert(
    parseList.type === "Namespace",
    "Parse list must be a namespace"
  );
  }catch(e){
    let scriptName = script.split('\n')[0].split(' ')[0];
    console.error('Problem processing script %s', scriptName);
    console.error('Start line %s column %s', e.location.start.line, e.location.start.column);
    console.error('End line %s column %s', e.location.end.line, e.location.end.column);
    console.error(e.message);
    return;
  }
  const ns = parseList.name;
  const blocks = parseList.values.filter(block => block.type !== 'Comment');
  window.runtime[ns] = blocks;
  buildBlockMenu(ns, blocks, menu);
};


const builder = (ns, block) => {
  const target = document.createElement("div");
  block.ns = ns;
  return blocks[block.type].create(block);
}

const buildBlockMenu = (ns, parseList, menu) => {
  const frag = document.createDocumentFragment();
  parseList.forEach(block=> frag.appendChild(builder(ns, block)));
  menu.appendChild(frag);
};

const processError = script => {
  console.error(script);
};

const blockScripts = ["control", "sprite", "sound", "vector", "stage", "angle", "list"];
const blockmenu = document.querySelector('.blockmenu');

function capitalize(word){
  return word[0].toUpperCase() + word.slice(1);
}

blockScripts.forEach(name => {
  let menu = document.createElement("details");
  let title = capitalize(name);
  menu.setAttribute('open', 'true');
  menu.innerHTML = `<summary class="menu_title" ns="${name}" type="${title}">${title}</summary><wb-contains></wb-contains>`;
  blockmenu.appendChild(menu);
  fetch(`/blocks/${name}.moon`).then(response =>
    response.text().then(text => processScript(text, menu.querySelector('wb-contains')))
  );
});

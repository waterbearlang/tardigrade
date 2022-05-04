import drag from "./dragging.js";
import blocks from "./blocks.js";

window.runtime = {};

const processScript = async (script, menu) => {
  let parseList;
  parseList = JSON.parse(script);
  console.assert(
    parseList.type === "Namespace",
    "Parse list must be a namespace"
  );
  const ns = parseList.name;
  const blocks = parseList.values.filter(block => block.type !== "Comment");
  window.runtime[ns] = blocks;
  buildBlockMenu(ns, blocks, menu);
};

function download(content) {
  // used to export from old .moon format to JSON, probably only needed once
  let fileName = content.name + ".json";
  let contentType = "text/plain";
  var a = document.createElement("a");
  var file = new Blob([JSON.stringify(content, null, 2)], {
    type: contentType,
  });
  a.href = URL.createObjectURL(file);
  a.download = fileName;
  a.click();
}

const builder = (ns, block) => {
  const target = document.createElement("div");
  block.ns = ns;
  return blocks[block.type].create(block);
};

const buildBlockMenu = (ns, parseList, menu) => {
  const frag = document.createDocumentFragment();
  parseList.forEach(block => frag.appendChild(builder(ns, block)));
  menu.appendChild(frag);
};

const processError = script => {
  console.error(script);
};

const blockScripts = [
  "control",
  "sprite",
  "sound",
  "vector",
  "stage",
  "angle",
  "list",
];
const blockmenu = document.querySelector(".blockmenu");

function capitalize(word) {
  return word[0].toUpperCase() + word.slice(1);
}

blockScripts.forEach(name => {
  let menu = document.createElement("details");
  let title = capitalize(name);
  menu.setAttribute("open", "true");
  menu.innerHTML = `<summary class="menu_title" ns="${name}" type="${title}">${title}</summary><tg-contains></tg-contains>`;
  blockmenu.appendChild(menu);
  fetch(`blocks/${name}.json`).then(response =>
    response
      .text()
      .then(text => processScript(text, menu.querySelector("tg-contains")))
  );
});

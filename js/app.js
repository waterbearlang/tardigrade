import { parse } from "./moonshine.js";
import {define, ref, render, html} from "../lib/heresy.min.js";
import R from "../lib/ramda.min.js";
import * as immer from "../lib/immer.min.js";

console.log({ immer, R, parse, dragula, define, ref, render, html });

const processScript = async script => {
  const tree = await parse(script);
  console.log(tree);
};

const processError = script => {
  console.log(script);
};

const blockScripts = ["vector"];

blockScripts.forEach(name =>
  fetch(`/blocks/${name}.moonshine`).then(response =>
    response.text().then(text => processScript(text))
  )
);

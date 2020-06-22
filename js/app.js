import { parse } from "./moonshine.js";
import * as Immer from "../lib/immer.min.js";

console.log({ immer, R, parse, dragula, heresy });

const processScript = script => {
  console.log(script);
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

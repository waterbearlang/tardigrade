import {parse} from "./moonshine.js";
import * as Immer from "../lib/immer.min.js";

console.log({immer, R, parse, dragula, heresy});

window.processScript = (script) => {
  console.log(script);
}

window.processError = (script) => {
  console.log(script);
}

const blockScripts = ['vector'];

blockScripts.forEach(name => fetch(`/blocks/${name}.moonshine`).then(response => processScript(response.)))

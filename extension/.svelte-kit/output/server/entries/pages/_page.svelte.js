import { e as escape_html } from "../../chunks/escaping.js";
import "clsx";
function _page($$payload) {
  let count = 0;
  $$payload.out += `<main class="p-4 svelte-hk4x7"><h1 class="text-xl">SvelteKit Chrome Extension</h1> <button>Clicked ${escape_html(count)} times</button></main>`;
}
export {
  _page as default
};

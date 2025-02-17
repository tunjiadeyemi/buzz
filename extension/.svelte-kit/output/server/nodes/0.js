import * as universal from '../entries/pages/_layout.js';

export const index = 0;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/fallbacks/layout.svelte.js')).default;
export { universal };
export const universal_id = "src/routes/+layout.js";
export const imports = ["app/immutable/nodes/0.WwByBmN2.js","app/immutable/chunks/DkBZaZr3.js","app/immutable/chunks/BEMkOk2q.js"];
export const stylesheets = [];
export const fonts = [];

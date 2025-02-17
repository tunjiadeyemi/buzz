export const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "app",
	appPath: "app",
	assets: new Set([".DS_Store","api.js","background.js","classroomio.svg","content.js","favicon.png","icon.png","index.html","inject.js","manifest.json","popup.js","style.css"]),
	mimeTypes: {".js":"text/javascript",".svg":"image/svg+xml",".png":"image/png",".html":"text/html",".json":"application/json",".css":"text/css"},
	_: {
		client: {start:"app/immutable/entry/start.DdyKk81e.js",app:"app/immutable/entry/app.5BGW05_A.js",imports:["app/immutable/entry/start.DdyKk81e.js","app/immutable/chunks/DL5LLFEQ.js","app/immutable/chunks/BEMkOk2q.js","app/immutable/chunks/yOP9qJ1_.js","app/immutable/entry/app.5BGW05_A.js","app/immutable/chunks/BEMkOk2q.js","app/immutable/chunks/CGBPDmrL.js","app/immutable/chunks/DkBZaZr3.js","app/immutable/chunks/yOP9qJ1_.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('./nodes/0.js')),
			__memo(() => import('./nodes/1.js')),
			__memo(() => import('./nodes/2.js'))
		],
		routes: [
			{
				id: "/",
				pattern: /^\/$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 2 },
				endpoint: null
			}
		],
		prerendered_routes: new Set([]),
		matchers: async () => {
			
			return {  };
		},
		server_assets: {}
	}
}
})();

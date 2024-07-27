// var addon = require('bindings')('SayHello');
const Path = require("path")
// const nativeAddonFile = Path.resolve(__dirname, "..","..","bin","Debug","vrkit_native_interop.node")
// const nativeAddonFileRelative = Path.relative(process.cwd(), nativeAddonFile);
// console.log(`Loading native addon abs >> ${nativeAddonFile}`);
// console.log(`Loading native addon rel >> ${nativeAddonFileRelative}`);

// const addon = require('bindings')(nativeAddonFileRelative);
const addon = require('bindings')('vrkit_native_interop');

console.log(addon.SayHello()); // 'world'
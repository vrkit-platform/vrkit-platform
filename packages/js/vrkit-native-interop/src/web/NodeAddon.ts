// var addon = require('bindings')('SayHello');
import Path from "path"
import Bind from "bindings"
// const nativeAddonFile = Path.resolve(__dirname, "..","..","bin","Debug","vrkit_native_interop.node")
// const nativeAddonFileRelative = Path.relative(process.cwd(), nativeAddonFile);
// console.log(`Loading native addon abs >> ${nativeAddonFile}`);
// console.log(`Loading native addon rel >> ${nativeAddonFileRelative}`);

// const addon = require('bindings')(nativeAddonFileRelative);
const addon = Bind("vrkit_native_interop");

export default addon;

const hid = require("node-hid")
let xboxDev = null
for (const dev of hid.devices()) {
  console.log(`Device: ${dev.product}`, dev)
  if (/Xbox/.test(dev.product)) {
    xboxDev = dev
    break
  }
}

if (!xboxDev) {
  console.error("no xbox controller found")
  process.exit(1)
  return
}

hid.setDriverType("libusb")
console.log(`Using device ${xboxDev.product}`)
const xboxHid = new hid.HID(xboxDev.path)
// xboxHid.setNonBlocking(true)
xboxHid.on('data', function(data) {
  console.log("DATA", data)
} )
xboxHid.on('error', function(err) {
  console.error("ERROR", err)
} )

xboxHid.read(function(err, data) {
  if (err)
    console.error("READ ERROR", err)
  else
    console.log("READ DATA", data)
} )

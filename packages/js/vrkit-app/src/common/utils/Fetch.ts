import "isomorphic-fetch"

const isNode = process.env.TARGET_PLATFORM === "node"

const fetchShim: typeof window.fetch =
  typeof fetch !== "function" &&
  typeof __non_webpack_require__ === "function" //typeof isNode !== "undefined" && isNode ?
    ? global.fetch
    : // __non_webpack_require__("node-fetch").default :
      (...args) => {
        if (typeof window !== "undefined") {
          return window.fetch(...args)
        } else if (typeof fetch !== "undefined") {
          return fetch(...args)
        }

        throw new Error("No valid fetch")
      }

export default fetchShim

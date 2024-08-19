export function objectToString(obj:any):string {
  //create an array that will later be joined into a string.
  const strings = []
  
  //is object
  //    Both arrays and objects seem to return "object"
  //    when typeof(obj) is applied to them. So instead
  //    I am checking to see if they have the property
  //    join, which normal objects don't have but
  //    arrays do.
  if (obj == undefined) {
    return String(obj)
  } else if (typeof obj == "object" && obj.join == undefined) {
    for (let prop in obj) {
      if (obj.hasOwnProperty(prop)) {
        strings.push(prop + ": " + objectToString(obj[prop]))
      }
    }
    return "{" + strings.join(",") + "}"
    
    //is array
  } else if (typeof obj ==
    "object" &&
    !(
      obj.join == undefined
    )) {
    for (let prop in obj) {
      strings.push(objectToString(obj[prop]))
    }
    return "[" + strings.join(",") + "]"
    
    //is function
  } else if (typeof obj == "function") {
    strings.push(obj.toString())
    
    //all other values can be done with JSON.stringify
  } else {
    strings.push(JSON.stringify(obj))
  }
  
  return strings.join(",")
}
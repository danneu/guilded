
export function trimIndent (str) {
  const match = str.match(/^[ \t]*(?=\S)/gm)

  if (!match) {
    return str
  }

    // TODO: Use spread operator when targeting Node.js 6
  const indent = Math.min.apply(Math, match.map(x => x.length))
  const re = new RegExp(`^[ \\t]{${indent}}`, 'gm')

  return (indent > 0 ? str.replace(re, '') : str).trim()
}

/// /////////////////////////////////////////////////////////

// Taken from fbjs/UnicodeUtil

const SURROGATE_HIGH_START = 0xD800
const SURROGATE_LOW_END = 0xDFFF
const SURROGATE_UNITS_REGEX = /[\uD800-\uDFFF]/

function hasSurrogateUnit (str) {
  return SURROGATE_UNITS_REGEX.test(str)
}

function getUTF16Length (str, pos) {
  return 1 + isCodeUnitInSurrogateRange(str.charCodeAt(pos))
}

function isCodeUnitInSurrogateRange (codeUnit) {
  return SURROGATE_HIGH_START <= codeUnit && codeUnit <= SURROGATE_LOW_END
}

export function strlen (str) {
  // Call the native functions if there's no surrogate char
  if (!hasSurrogateUnit(str)) {
    return str.length
  }

  var len = 0
  for (var pos = 0; pos < str.length; pos += getUTF16Length(str, pos)) {
    len++
  }
  return len
}

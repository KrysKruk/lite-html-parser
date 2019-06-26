const IN_TAG = 1 << 0
const TAG_OPEN = 1 << 1
const ATTR_VALUE = 1 << 2
const TAG_CLOSE = 1 << 3
const ATTR_QUOTE = 1 << 4
const ATTR_SINGLE_QUOTE = 1 << 5
const ATTR_DOUBLE_QUOTE = 1 << 6
const ATTR_BRACE = 1 << 7
const IN_INSTRUCTION = 1 << 8
const IN_COMMENT = 1 << 9
const IN_SCRIPT = 1 << 10
const IN_STYLE = 1 << 11

const SCRIPT_ENDING = ['<', '/', 's', 'c', 'r', 'i', 'p', 't', '>']
const STYLE_ENDING = ['<', '/', 's', 't', 'y', 'l', 'e', '>']

const OPTIONS = {
  noAttributeValue: ''
}

exports.parse = (xhtml, handlers, options = OPTIONS) => {
  const { opentag, closetag, attribute, text, comment, instruction } = handlers
  const { noAttributeValue } = options
  let commentStep = 0
  let scriptStep = 0
  let styleStep = 0
  let attrRest = ''
  let tagRest = ''
  let tagName = ''
  let rest = ''
  let state = 0
  let line = 0
  let row = 0

  const bitOn = (bit) => { state |= bit }
  const bitOff = (bit) => { state = state & ~bit }
  const isBitOn = bit => (state & bit) > 0

  const sayOpentag = () => {
    bitOn(TAG_OPEN)
    opentag(rest, line, row)
    tagName = rest
    rest = ''
  }

  const sayAttribute = () => {
    if (!attrRest) {
      attrRest = rest
      rest = noAttributeValue
    }
    attribute(attrRest, rest, line, row)
    attrRest = ''
    rest = ''
    bitOff(ATTR_VALUE)
  }

  const { length } = xhtml
  for (let index = 0; index < length; index += 1) {
    const char = xhtml[index]

    if (char === '\n') {
      line += 1
      row = 0
    }

    if (isBitOn(IN_COMMENT)) {
      if (char === '-' && (commentStep === 0 || commentStep === 1)) {
        rest += char
        commentStep += 1
      } else if (char === '>' && commentStep === 2) {
        comment(rest.slice(2, -2), line, row)
        rest = ''
        commentStep = 0
        bitOff(IN_INSTRUCTION)
        bitOff(IN_COMMENT)
        bitOff(IN_TAG)
      } else {
        rest += char
        if (char !== '-') {
          commentStep = 0
        }
      }
    } else if (isBitOn(IN_INSTRUCTION) && char === '-' && commentStep === 0) {
      rest += char
      commentStep += 1
    } else if (isBitOn(IN_INSTRUCTION) && char === '-' && commentStep === 1) {
      rest += char
      bitOn(IN_COMMENT)
      commentStep = 0
    } else if (isBitOn(IN_INSTRUCTION) && char === '>') {
      instruction(rest, line, row)
      rest = ''
      bitOff(IN_INSTRUCTION)
      bitOff(IN_TAG)
    } else if (isBitOn(IN_INSTRUCTION)) {
      rest += char
      commentStep = -1
    } else if (char === '!' && isBitOn(IN_TAG) && !isBitOn(TAG_OPEN) && !isBitOn(ATTR_VALUE) && !rest) {
      bitOn(IN_INSTRUCTION)
    } else if (isBitOn(IN_SCRIPT)) {
      if (char.toLowerCase() === SCRIPT_ENDING[scriptStep]) {
        if (scriptStep === 8) {
          text(rest.slice(0, -8), line, row)
          closetag('script', line, row)
          rest = ''
          scriptStep = 0
          bitOff(IN_SCRIPT)
          bitOff(IN_TAG)
        } else {
          rest += char
          scriptStep += 1
        }
      } else {
        rest += char
        scriptStep = 0
      }
    } else if (isBitOn(IN_STYLE)) {
      if (char.toLowerCase() === STYLE_ENDING[styleStep]) {
        if (styleStep === 7) {
          text(rest.slice(0, -7), line, row)
          closetag('style', line, row)
          rest = ''
          styleStep = 0
          bitOff(IN_STYLE)
          bitOff(IN_TAG)
        } else {
          rest += char
          styleStep += 1
        }
      } else {
        rest += char
        styleStep = 0
      }
    } else if (char === '<' && !isBitOn(IN_TAG)) {
      bitOn(IN_TAG)
      if (rest) {
        text(rest, line, row)
        rest = ''
      }
    } else if (char === '"' && isBitOn(ATTR_DOUBLE_QUOTE)) {
      bitOff(ATTR_DOUBLE_QUOTE)
      bitOff(ATTR_QUOTE)
      bitOff(ATTR_VALUE)
    } else if (char === '"' && isBitOn(ATTR_VALUE) && !isBitOn(ATTR_QUOTE)) {
      bitOn(ATTR_DOUBLE_QUOTE)
      bitOn(ATTR_QUOTE)
    } else if (char === "'" && isBitOn(ATTR_SINGLE_QUOTE)) {
      bitOff(ATTR_SINGLE_QUOTE)
      bitOff(ATTR_QUOTE)
      bitOff(ATTR_VALUE)
    } else if (char === "'" && isBitOn(ATTR_VALUE) && !isBitOn(ATTR_QUOTE)) {
      bitOn(ATTR_SINGLE_QUOTE)
      bitOn(ATTR_QUOTE)
    } else if (char === '}' && isBitOn(ATTR_BRACE)) {
      bitOff(ATTR_BRACE)
      bitOff(ATTR_QUOTE)
      bitOff(ATTR_VALUE)
      rest += char
    } else if (char === '{' && isBitOn(ATTR_VALUE) && !isBitOn(ATTR_QUOTE)) {
      bitOn(ATTR_BRACE)
      bitOn(ATTR_QUOTE)
      rest += char
    } else if (char === '/' && isBitOn(IN_TAG) && !isBitOn(ATTR_VALUE)) {
      bitOn(TAG_CLOSE)
    } else if (char === '>' && isBitOn(IN_TAG) && !isBitOn(ATTR_QUOTE)) {
      if (!tagRest && !isBitOn(TAG_OPEN) && (rest || !isBitOn(TAG_CLOSE))) {
        sayOpentag()
      }
      if (attrRest || rest) sayAttribute()
      if (isBitOn(TAG_CLOSE)) {
        closetag(tagRest, line, row)
        tagRest = ''
      } else {
        if (tagName.toLowerCase() === 'script') bitOn(IN_SCRIPT)
        if (tagName.toLowerCase() === 'style') bitOn(IN_STYLE)
      }
      bitOff(IN_TAG)
      bitOff(TAG_OPEN)
      bitOff(TAG_CLOSE)
    } else if (char === ' ' && isBitOn(IN_TAG) && !isBitOn(TAG_OPEN)) {
      sayOpentag()
    } else if (char === ' ' && isBitOn(IN_TAG) && !isBitOn(ATTR_QUOTE) && (attrRest || rest)) {
      sayAttribute()
    } else if (char === '=' && isBitOn(IN_TAG) && !isBitOn(ATTR_VALUE)) {
      bitOn(ATTR_VALUE)
      attrRest = rest
      rest = ''
    } else if (char === ' ' && isBitOn(IN_TAG) && !isBitOn(ATTR_VALUE)) {
      // NOP
    } else if (char === '\n' && isBitOn(IN_TAG)) {
      // NOP
    } else if (isBitOn(TAG_CLOSE)) {
      tagRest += char
    } else {
      rest += char
    }

    row += 1
  }

  if (rest) {
    text(rest, line, row)
  }
}

# HTML Parser

Parses HTML text and calls callbacks on found elements.

The given HTML doesn't have to be valid. It tries any string to be parsed.

Zero dependencies. Create an issue if you found any HTML code parsed in a wrong way.

See tests for examples.

## Installation

```
npm i lite-html-parser
```

## Usage

```js
const { parse } = require('lite-html-parser')

parse('<p>Welcome <span>Mr</span> <strong>John</strong></p>', {
  opentag (name) { console.log({ opentag: name }) },
  closetag (name) { console.log({ closetag: name }) },
  attribute (name, value) { console.log({ attribute: [name, value] }) },
  text (text) { console.log({ text }) },
  comment (comment) { console.log({ comment }) },
  instruction (instruction) { console.log({ instruction }) }
})
```

## API

### Handlers

Handler functions are called in the parsing process.

All functions needs to be provided.

- `opentag (name)`
- `closetag (name)`
- `attribute (name, value)`
- `text (text)`
- `comment (comment)`
- `instruction (instruction)`

### Options

A third argument can be an object with options.

- `noAttributeValue` - value to used when an attribute doesn't have a value (e.g. `<input enabled />`); by default `''` (empty string)

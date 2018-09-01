# Not-So-Smart XHTML Parser

Covers less than 50% of the XHTML Specification, but is fast and supports 99% cases. Has no dependencies.

See tests for examples.

## Installation

```
npm i not-so-smart-xhtml-parser
```

## Usage

```js
const { parse } = require('not-so-smart-xhtml-parser')

parse('<p>Welcome <span>Mr</span> <strong>John</strong></p>', {
  opentag (name) { console.log({ opentag: name }) },
  closetag (name) { console.log({ closetag: name }) },
  attribute (name, value) { console.log({ attribute: [name, value] }) },
  text (text) { console.log({ text }) },
  comment (comment) { console.log({ comment }) },
  instruction (instruction) { console.log({ instruction }) }
})
```

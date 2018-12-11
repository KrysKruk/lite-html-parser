const yaml = require('js-yaml')
const glob = require('glob')
const fs = require('fs')
const { parse } = require('../')

const createFileTest = (name, xhtml, options, expected) => {
  test(`${name} - "${xhtml}"`, () => {
    const actual = []
    parse(xhtml, {
      opentag (name) { actual.push({ opentag: name }) },
      closetag (name) { actual.push({ closetag: name }) },
      attribute (name, value) { actual.push({ attribute: [name, value] }) },
      text (text) { actual.push({ text }) },
      comment (comment) { actual.push({ comment }) },
      instruction (instruction) { actual.push({ instruction }) }
    }, options)
    expect(actual).toEqual(expected)
  })
}

const paths = glob.sync('./__tests__/**/*.yml')
for (const path of paths) {
  const file = fs.readFileSync(path, 'utf-8')
  const { name, xhtml, options, expected } = yaml.safeLoad(file)
  createFileTest(name, xhtml, options, expected)
}

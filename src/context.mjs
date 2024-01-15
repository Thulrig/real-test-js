import { TestTimeoutError } from './TestTimeoutError.mjs'
import { focusedOnly } from './focus.mjs'
import { applyColor } from './transform.mjs'
export { expect } from './expect.mjs'

let currentDescribe
let successes = 0
let failures = []
global.report = []

const makeDescribe = (name, options) => ({
  ...options,
  name,
  befores: [],
  afters: [],
  children: [],
})

currentDescribe = makeDescribe('root')

const describeWithOpts = (name, body, options = {}) => {
  const parentDescribe = currentDescribe
  currentDescribe = makeDescribe(name, options)
  body()
  currentDescribe = {
    ...parentDescribe,
    children: [...parentDescribe.children, currentDescribe],
  }
}

export const describe = (name, body) => describeWithOpts(name, body, {})

const makeTest = (name, body, options) => ({
  name,
  body,
  ...options,
  errors: [],
  timeoutError: new TestTimeoutError(5000),
})

const itWithOpts = (name, body, options) => {
  currentDescribe = {
    ...currentDescribe,
    children: [...currentDescribe.children, makeTest(name, body, options)],
  }
}

export const test = (name, body) => itWithOpts(name, body, {})

const addModifier = (object, property, fn, options) =>
  Object.defineProperty(object, property, {
    value: (...args) => fn(...args, options),
  })

export const beforeEach = (body) => {
  currentDescribe = {
    ...currentDescribe,
    befores: [...currentDescribe.befores, body],
  }
}

export const afterEach = (body) => {
  currentDescribe = {
    ...currentDescribe,
    afters: [...currentDescribe.afters, body],
  }
}

const isTest = (testObject) => testObject.hasOwnProperty('body')

let describeStack = []

const indent = (message) => `${' '.repeat(describeStack.length * 2)}${message}`

const withoutLast = (arr) => arr.slice(0, -1)

const runDescribe = async (describe) => {
  console.log(indent(describe.name))
  describeStack = [...describeStack, describe]
  for (let i = 0; i < describe.children.length; ++i) {
    await runBlock(describe.children[i])
  }
  describeStack = withoutLast(describeStack)
}

const timeoutPromise = () => currentTest.timeoutError.createTimeoutPromise()

const runBodyAndWait = async (body) => {
  const result = body()
  if (result instanceof Promise) {
    await Promise.race([result, timeoutPromise()])
  }
}

const runTest = async (test) => {
  global.currentTest = test
  currentTest.describeStack = [...describeStack]
  try {
    invokeBefores(currentTest)
    await runBodyAndWait(currentTest.body)
    currentTest.body()
    invokeAfters(currentTest)
  } catch (e) {
    currentTest.errors.push(e)
  }
  if (currentTest.errors.length > 0) {
    console.log(indent(applyColor(`<red>✗</red> ${currentTest.name}`)))
    failures.push(currentTest)
  } else {
    successes++
    console.log(indent(applyColor(`<green>✓</green> ${currentTest.name}`)))
  }
  // global.report.push(currentTest)
  global.currentTest = null
}

const appendTimeout = (timeout) => {
  currentTest = {
    ...currentTest,
    timeoutError: new TestTimeoutError(timeout),
  }
}

addModifier(test, 'timesOutAfter', appendTimeout, {})

const invokeAll = (fnArray) => fnArray.forEach((fn) => fn())

const invokeBefores = () =>
  invokeAll(describeStack.flatMap((describe) => describe.befores))

const invokeAfters = () =>
  invokeAll(describeStack.flatMap((describe) => describe.afters))

const runBlock = (block) =>
  isTest(block) ? runTest(block) : runDescribe(block)

export const runParsedBlocks = async () => {
  const withFocus = focusedOnly(currentDescribe)
  for (let i = 0; i < withFocus.children.length; ++i) {
    await runBlock(withFocus.children[i])
  }
  return { successes, failures }
}

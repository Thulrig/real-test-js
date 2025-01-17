/* eslint-disable curly */
import { AssertionError } from './errors/assertion.mjs'
import { RunnerError } from './errors/runner.mjs'
import { indentLine } from './transform.mjs'
import { EOL } from 'os'

export const toBeDefined = (actual) => {
  if (actual === undefined) {
    throw new AssertionError(indentLine('Received: <actual>'), {
      actual,
    })
  }
}

export const toHaveLength = (actual, expected) => {
  if (!Array.isArray(actual)) {
    throw new RunnerError(indentLine(`Received: ${actual} is not an array`))
  }
  if (typeof expected !== 'number') {
    throw new RunnerError(indentLine(`Expected: ${expected} is not a number`))
  }
  if (actual.length !== expected) {
    throw new AssertionError(
      indentLine('Expected: <expected>') +
        EOL +
        indentLine('Received: <actual>'),
      {
        actual: actual.length,
        expected,
      }
    )
  }
}

export const toBeFalsy = (actual) => {
  if (typeof actual !== 'boolean') {
    throw new RunnerError(
      indentLine(`Received: ${actual} is not a boolean value`)
    )
  }
  if (actual !== false) {
    throw new AssertionError(indentLine('Received: <actual> to be false'), {
      actual,
    })
  }
}

export const toBeTruthy = (actual) => {
  if (typeof actual !== 'boolean') {
    throw new RunnerError(
      indentLine(`Received: ${actual} is not a boolean value`)
    )
  }
  if (actual !== true) {
    throw new AssertionError(indentLine('Received: <actual> to be true'), {
      actual,
    })
  }
}

export const toEqual = (actual, expected) => {
  if (actual !== expected) {
    throw new AssertionError(
      indentLine('Expected: <expected>') +
        EOL +
        indentLine('Received: <actual>'),
      {
        actual,
        expected,
      }
    )
  }
}

export const notToEqual = (actual, expected) => {
  if (actual === expected) {
    throw new AssertionError(
      indentLine('Expected: <expected>') +
        EOL +
        indentLine('Received: <actual>'),
      {
        actual,
        expected,
      }
    )
  }
}

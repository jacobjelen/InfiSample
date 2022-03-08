/* eslint-disable camelcase */
import 'myScripts/lodash.js'
const SerialPort = require('serialport')
const Readline = require('@serialport/parser-readline')
let port, parser

const _model = { // to hold data coming on serial
  slider: 0,
  keypad: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  touchpad: { x: 0, y: 0, z: 0 },
  mat: [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  ],
  power: false
}

window.onload = function () {
  findBoard().then(
    path => setPort(path)
  )
  fillMat()
  fillPortSelector()
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('menu-button-box').addEventListener('click', () => {
    document.getElementById('topBar').classList.toggle('hidden')
    fillPortSelector() // populate the port selection dropdown on menu click
  })
})

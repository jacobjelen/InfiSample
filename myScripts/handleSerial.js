/* eslint-disable camelcase */
const SerialPort = require('serialport')
const Readline = require('@serialport/parser-readline')
let port, parser
const ld = require('lodash')

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
  setPort('/dev/cu.usbmodem14201')
  fillMat()
  fillPortSelector()
}

//
const slider_values = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]

// SERIAL PORT OBJECTS //////////////////////////////////
async function setPort (newPort) {
  if (port && port.isOpen) await port.close() // if port is open, close it before moving on

  port = new SerialPort(newPort, { baudRate: 115200 })

  port.on('open', () => {
    console.log('serial open: ' + port.path)
    port.flush()

    // update parser object
    parser = port.pipe(new Readline({ delimiter: '\n' }))
    parser.on('data', data => {
      // console.log('got word from arduino:', data);
      // document.getElementById('title').innerHTML = data
      process(data)
    })
  })
}

async function findArduino () {
  if (port && port.isOpen) await port.close() // if port is open, close it before moving on

  SerialPort.list().then(ports => {
    port = ports.find(port => /arduino/i.test(port.manufacturer))
    if (!port) {
      console.error('Arduino Not found')
      process.exit(1)
    }
    console.log(port.path)
  })
}

async function changePort (t) { /// / Change port based on user selection
  console.log(t)
  const selectedPort = document.getElementById('portSelect').value

  if (port.isOpen) await port.close() // if port is open, close it before moving on
  setPort(selectedPort)
}

// POPULATE DOM //////////////////////////////////

function fillPortSelector () { // PortSelect // Populate the dropdown menu
  SerialPort.list().then(ports => {
    console.log(ports)
    const dropdown = document.getElementById('portSelect')
    dropdown.innerHTML = ''
    ports.forEach((port) => {
      dropdown.add(new Option(port.path))
    })
  })
}

function fillMat () { // populate mat div with a div per cell
  let r = -1; let c = 0
  const d = document.getElementById('mat').innerHTML =
    _model.mat[0].map(col => '').join('') +
    _model.mat.map(
      row => {
        r++; c = 0
        return row.map(col => (
          '<div class="mat_cell" id="mat_L' + (r) + 'C' + (c++) + '">&nbsp;</div>')
        ).join('')
      }).join('')
}

// PROCESS SERIAL DATA //////////////////////////////////
function process (line) {
  // console.log(line)

  // lines are in the form:
  // X: some numbers in hexadecimal format
  // where X defines the type of data, which specifies the number and type
  // of following values.
  //
  // S: xx
  // xx is single byte hex value of slider position
  //
  // K: xxxx
  // xxxx is 16 bit hex bitmask representing buttons on keypad, where
  // LSB(least significant bit) is 0 key, bits 1..9 represent numbers 1..9 and bit 10 is dot.
  //
  // T: xxxx xxxx xxxx
  // the three values are 16 bit hexadecimal values representing touchpad
  // x, y and z positions.
  //
  // Cy: xx xx xx xx xx xx
  // a column of values from the multitouch area.
  // y is the column, from 1..11. the xx values are unsigned bytes,
  // each one representing a row.

  // split into command (before the ':') and arguments

  const parts = line.split(':')

  if (parts.length !== 2 || parts[0].length === 0 || parts[1].length < 2) { return } // cannot parse

  const cmd = parts[0].substring(0, 1)
  //   console.log(cmd)
  let subcmd = parts[0].length > 1 ? parts[0].substring(1) : ''
  let args = parts[1].trim().split(' ')

  // ensure subcommand is valid if present
  if (subcmd.length !== 0 && isNaN(subcmd)) { return } // subcmd not a number
  subcmd = Number(subcmd)

  // ensure command is valid
  const defs = { S: 1, K: 1, T: 3, C: 6, P: 1 }
  if (!cmd in defs || defs[cmd] !== args.length) { return } // illegal command

  // convert args from strings to numbers
  try {
    args = args.map(e => parseInt(e, 16))
  } catch (e) {
    return // illegal arg
  }

  // act depending on first character of command
  switch (cmd) {
    case 'S':
      _model.slider = args[0]
      update_slider()
      break
    case 'K':
      for (let i = 0; i < 11; i++) { _model.keypad[i] = !!((args[0] & (1 << i))) }
      update_keypad()
      break
    case 'T':
      // UNCOMMENT THIS WHEN TOUCHPAD IS WORKING
      // _model.touchpad.x = args[0]
      // _model.touchpad.y = args[1]
      // _model.touchpad.z = args[2]
      // update_touchpad()
      break
    case 'C':
      for (let i = 0; i < 6; i++) { _model.mat[i][subcmd - 1] = args[i] }
      update_mat(subcmd - 1)
      break
    case 'P':
      _model.power = args[0] !== 0
      update_power()
      break
  }
}

// ELEMENT UPDATE FUNCTIONS //////////////////////////////////
// Multi-Touch
function update_mat (c) {
  // console.log(_model.mat)

  // calculated in multitouch_calc.js
  const mat_normalise_multiplier = [
    [1, 1.58, 1.82, 1.78, 3.15, 4.32, 4.1, 5.86, 5.86, 6.83, 4.32],
    [2.56, 3.15, 3.28, 4.1, 4.82, 5.47, 8.2, 6.83, 9.11, 7.45, 6.31],
    [3.73, 5.13, 5.86, 5.86, 8.2, 9.11, 9.11, 9.11, 10.25, 13.67, 7.45],
    [5.47, 6.83, 7.45, 7.45, 7.45, 8.2, 6.83, 9.11, 7.45, 13.67, 8.2],
    [5.47, 7.45, 8.2, 7.45, 8.2, 10.25, 10.25, 10.25, 8.2, 10.25, 6.83],
    [6.31, 7.45, 8.2, 9.11, 10.25, 9.11, 8.2, 10.25, 11.71, 9.11, 7.45]
  ]
  const mat_gain = 4
  const mat_threshold = 0

  for (let i = 0; i < 6; i++) {
    const d = document.getElementById('mat_L' + i + 'C' + c)
    const x = _model.mat[i][c]
    // d.style.opacity = x > mat_threshold ? (x / 255) * mat_normalise_multiplier[i][c] * mat_gain : 0 // opacity is 0 unless X is over threshod
    d.style.opacity = x > mat_threshold ? (x / 255) * mat_gain : 0 // opacity is 0 unless X is over threshod

    d.innerText = d.style.opacity
  }
}

// Force-pad
function update_touchpad () {
  const canvas = document.getElementById('tp_canvas')
  const press = document.getElementById('press')

  const x = _model.touchpad.x
  const y = _model.touchpad.y
  const z = _model.touchpad.z

  const posx = x / 4095 * canvas.clientWidth
  const posy = y / 4095 * canvas.clientHeight
  const sizez = z / 4095 * 32

  // console.log(`x: ${posx}  y: ${posy}  z: ${sizez}`)

  // press is a div inside the tp_canvas div representing position and force of pressure on the physical sensor
  press.style.top = posy - (sizez / 2) // offset by a half of the size => center in the middle of press
  press.style.left = posx - (sizez / 2)
  press.style.width = sizez
  press.style.height = sizez
  press.style.opacity = 1
}

function update_keypad () {
  for (let i = 0; i < 11; i++) {
    const k = document.getElementById('kp_' + i)
    if (_model.keypad[i]) {
      k.classList.add('key-active')
    } else {
      k.classList.remove('key-active')
    }
  }
}


function update_slider () {
  const s = document.getElementById('slider-input')
  const sVal = parseInt(s.value)
  const sMin = parseInt(s.min)
  const sMax = parseInt(s.max)
  const margin = 5 // don't set new value if it's within from the last one => smooth out the visualisation
  const touchMin = 5 // if reading is bellow, finger is lifted

  console.log(`s.value: ${sVal} --- reading: ${_model.slider}`)

  // HTML range is 100-220, these values are withing the printed slider graphic
  if (_model.slider < touchMin) {
    // finger is off
    console.log(1)
  } else if (_model.slider < sMin) {
    // finger is below minimum
    s.value = sMin
    console.log(2)
  } else if (_model.slider < sMax) {
    // finger is on the slider
    console.log(3)
    // Eliminate reading noise, use margin
    if (!ld.inRange(_model.slider, sVal - margin, sVal + margin)) {
      s.value = _model.slider
      console.log(3.1)
    }
  } else if (_model.slider > sMax) {
    // finger is past maximum
    s.value = sMax
    console.log(4)
  }
}

function update_power () {
  // if (_model.power) {
  //   document.querySelector('.power-box').style.backgroundColor = 'var(--highlight-color)'
  // } else {
  //   document.querySelector('.power-box').style.backgroundColor = 'var(--bg-color)'
  // }

  if (_model.power) {
    document.querySelector('#power').style.stroke = 'var(--highlight-color)'
  } else {
    document.querySelector('#power').style.stroke = 'var(--main-color)'
  }
}

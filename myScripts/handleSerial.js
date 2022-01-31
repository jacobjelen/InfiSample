
const SerialPort = require('serialport')
const Readline = require('@serialport/parser-readline')
// let port = new SerialPort('/dev/cu.usbmodem14201', { baudRate: 9600 })
// let parser = port.pipe(new Readline({ delimiter: '\n' }))
let port, parser

// PortSelect // Populate the dropdown menu
function fillPortSelector () {
  SerialPort.list().then(ports => {
    console.log(ports)
    const dropdown = document.getElementById('portSelect')

    ports.forEach((port) => {
      dropdown.add(new Option(port.path))
    })
  })
}

// Set port object ////////////////////
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
      document.getElementById('title').innerHTML = data
      process(data)
    })
  })
}

// Change port based on user selection
async function changePort (t) {
  console.log(t)
  const selectedPort = document.getElementById('portSelect').value

  if (port.isOpen) await port.close() // if port is open, close it before moving on
  setPort(selectedPort)
}

// sets up the connect button to trigger serial selection, and
// calling of the process() function on each received serial line
window.onload = function () {
  dom_init()
  setPort('/dev/cu.usbmodem14201')
  // serial_init();
}

const _model = {
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

function dom_init () {
  // populate mat div with a div per cell
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

// process a line received over serial
function process (line) {
//   console.log(line)

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
      _model.touchpad.x = args[0]
      _model.touchpad.y = args[1]
      _model.touchpad.z = args[2]
      update_touchpad()
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

function update_mat (c) {
  for (let i = 0; i < 6; i++) {
    const d = document.getElementById('mat_L' + i + 'C' + c)
    const x = _model.mat[i][c]
    d.style.backgroundColor = 'rgba(255, 154, 162, ' + (x / 0xff) + ')'
    d.innerText = x
  }
}

function update_touchpad () {
  const canvas = document.getElementById('tp')
  const ctx = canvas.getContext('2d')

  const x = _model.touchpad.x
  const y = _model.touchpad.y
  const z = _model.touchpad.z

  const posx = x / 4095 * canvas.width
  const posy = y / 4095 * canvas.height
  const sizez = 16// z / 4095 * 32;

  // draw cursor
  ctx.globalCompositeOperation = 'source-over'

  ctx.beginPath()
  ctx.arc(posx, posy, sizez, 0, 2 * Math.PI)
  ctx.fillStyle = '#B5EAD7'
  ctx.fill()

  // lighten (pixels tend to white, so we get a trail)
  ctx.globalCompositeOperation = 'lighter'
  ctx.fillStyle = '#050505'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // draw values
  ctx.globalCompositeOperation = 'source-over'
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, 70, 50)

  ctx.fillStyle = 'black'
  ctx.font = '20px monospace'
  ctx.fillText('x' + x, 0, 20)
  ctx.fillText('y' + y, 0, 35)
  ctx.fillText('z' + z, 0, 50)
}

function update_keypad () {
  for (i = 0; i < 11; i++) {
    const d = document.getElementById('kp_' + i)
    d.style.backgroundColor = _model.keypad[i] ? 'C7CEEA' : 'ffffff'
  }
}

function update_slider () {
  document.getElementById('slider').value = _model.slider
}

function update_power () {
  const color = _model.power ? '#C7CEEA' : '#000000'
  document.querySelector('#power path').style.stroke = color
  document.querySelector('#power line').style.stroke = color
}

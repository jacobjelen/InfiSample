// DATA MODEL

const _model = {
  slider: 0,
  keypad: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  touchpad: { x: 0, y: 0, z: 0 },
  mat: [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  ],
  power: false
}

// CUSTOM CLASSES / OBJECTS

// defines a stream processor which extracts lines of text delimited by '\r\n'
class LineBreakTransformer {
  constructor() {
    this.container = ''
  }

  transform(chunk, controller) {
    this.container += chunk
    const lines = this.container.split('\r\n')
    this.container = lines.pop()
    lines.forEach(line => controller.enqueue(line))
  }

  flush(controller) {
    controller.enqueue(this.container)
  }
}

// scale a value from one range to another. 
function convertRange(value, inMin, inMax, outMin, outMax) {
  const result = (value - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;

  if (result < outMin) {
    return outMin;
  } else if (result > outMax) {
    return outMax;
  }

  return result;
}

function rnd2(n) {return Math.round(n * 100) / 100; } //round down to 2 decimals

// process a line received over serial
function process(line) {
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
  // LSB is 0 key, bits 1..9 represent numbers 1..9 and bit 10 is dot.
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
  if (parts.length != 2 || parts[0].length == 0 || parts[1].length < 2) { return } // cannot parse
  const cmd = parts[0].substring(0, 1)
  let subcmd = parts[0].length > 1 ? parts[0].substring(1) : ''
  let args = parts[1].trim().split(' ')

  // ensure subcommand is valid if present
  if (subcmd.length != 0 && isNaN(subcmd)) { return } // subcmd not a number
  subcmd = Number(subcmd)

  // ensure command is valid
  const defs = { S: 1, K: 1, T: 3, C: 6, P: 1 }
  if (!cmd in defs || defs[cmd] != args.length) { return } // illegal command

  // convert args from strings to numbers
  try {
    args = args.map(e => parseInt(e, 16))
  } catch (e) {
    return // illegal arg
  }

  // act depending on first character of command
  switch (cmd) {
    case 'S':
      if (document.getElementById('slider') === null) break
      _model.slider = args[0]
      try { update_slider() } catch (error) { console.log(error) }
      break
    case 'K':
      if (document.getElementById('keypad') === null) break
      for (let i = 0; i < 11; i++) { _model.keypad[i] = !!((args[0] & (1 << i))) }
      try { update_keypad() } catch (error) { console.log(error) }
      break
    case 'T':
      if (document.getElementById('touchpad') === null) break
      _model.touchpad.x = args[0];
      _model.touchpad.y = args[1];
      _model.touchpad.z = args[2];
      try { update_touchpad(); }
      catch (error) { console.log(error) }
      break;
    case 'C':
      if (document.getElementById('mat') === null) break
      for (let i = 0; i < 6; i++) { _model.mat[i][subcmd - 1] = args[i] }
      try { update_mat(subcmd - 1) } catch (error) { 
        // console.log(error) 
      }
      break
    case 'P':
      if (document.getElementById('power') === null) break
      _model.power = args[0] != 0
      try { update_power() } catch (error) { 
        // console.log(error) 
      }
      break
  }
}

// ELEMENT UPDATE FUNCTIONS //////////////////////////////////
let max = 0
let maxlog = 0
function update_mat(c) { // c - index of a column
  // console.log(_model.mat)

  const mat_gain = 6

  for (let i = 0; i < 6; i++) {
    const d = document.getElementById('mat_L' + i + 'C' + c)
    const x = _model.mat[i][c]

    // if (i== 0 && c==0){
      if (x > max){ max = x } // remember maximum measured value
      
  // OPACITY A: 0 up to threshod, then linear mulitplied by gain value
    // d.style.opacity = x > mat_threshold ? (x / 255) * mat_gain : 0

  // OPACITY B: binary =>100% over threhold
    // d.style.opacity = x > mat_threshold ? 1 : 0

  // OPACITY C: log 106*(0.7+log10(x/5))
    // const log = 106*(0.7+Math.log10(x/5)) // 255
    // if (log > maxlog){ maxlog = log} // remember maximum measured value
    // const converted = convertRange(log, 225, 240, 0, 1)
    // console.log(`[${i},${c}]  raw: ${x} \t log: ${rnd2(log)}  \t maxlog: ${rnd2(maxlog)}`)
    // d.style.opacity = converted
    // d.innerText = rnd2(d.style.opacity)

  // OPACITY D: RAW => CONVERT => LOG
      const mat_threshold = 50 // anything below is considered noise and is ignored
      const mat_cutoff = 200    // considered as maximum value that can be achieved by pressure
      
      const converted = convertRange(x, mat_threshold, mat_cutoff, 1, 255) // raw between treshold and cutoff scaled to 0-255
      const log = 106*(0.7+Math.log10(converted/5)) / 255                  // plots converted values logarithmically between 0 and 1
      
      d.style.opacity = log
      d.innerText = Math.round(log * 100) / 100

      // console.log(`[${i},${c}]  raw: ${x} :\t conv: ${rnd2(converted)} :\t log: ${rnd2(log)}  :\t max: ${max}`)

  // } // test if 0,0
  }
}

function update_touchpad() {
  const touchpad_threshold = 450
  const size_gain = 200 // how much the cicle grows with pressure

  const canvas = document.getElementById('tp_canvas')
  const press = document.getElementById('press')

  const x = _model.touchpad.x
  const y = _model.touchpad.y
  const z = _model.touchpad.z

  const posx = x / 4095 * canvas.clientWidth
  const posy = y / 4095 * canvas.clientHeight
  const sizez = z / 4095 * size_gain

  // console.log(`x: ${posx}  y: ${posy}  z: ${sizez}`)

  // press is a div inside the tp_canvas div representing position and force of pressure on the physical sensor
  press.style.top = posy - (sizez / 2) // offset by a half of the size => center in the middle of press
  press.style.left = posx - (sizez / 2)

  if (z > touchpad_threshold) {
    press.style.width = sizez
    press.style.height = sizez
    press.style.opacity = z
  } else {
    press.style.width = 0
    press.style.height = 0
    press.style.opacity = 0
  }

}

function update_keypad() { // OK
  for (let i = 0; i < 11; i++) {
    const k = document.getElementById('kp_' + i)
    if (_model.keypad[i]) {
      k.classList.add('key-active')
    } else {
      k.classList.remove('key-active')
    }
  }
}

let last_slider = 0;
function update_slider() { // OK

  const s = document.getElementById('slider-input')
  s.value = _model.slider
  console.log(`last slider: ${last_slider} \t current: ${_model.slider}`)

  // CHANGIN COLOUR OF THE SLIDER WHEN PRESSED
  // if(last_slider != _model.slider){
  //   document.documentElement.style.setProperty('--slider-thumb-color', 'var(--highlight-color)')
  //   last_slider = _model.slider
  //   console.log('touch color')
  // } else {
  //   document.documentElement.style.setProperty('--slider-thumb-color', 'var(--bg-color)')
  //   console.log('release')
  // }
}

function update_power() { // OK
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

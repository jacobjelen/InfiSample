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

class Buffer {
  /*  bufferes a specifies number of values
  > avgInt returns the average of the buffered values => smooths out streaming data
  > stableAvg gets updated when all values are within +-volatility of the most recent value
      => eliminates 'sliding' between major value state changes
  */
  constructor(size, volatility = 10) {
    this.size = size // how many values to keep
    this.volatility = volatility // how much can values by off to be considered 'stable'

    this.values = []
    this.stableAvg = null
  }

  // add value
  addValue(val) {
    if (this.values.length >= this.size) {
      this.values.shift() // if the buffer is full, delet the first (oldest) value
    }
    this.values.push(val) // add value to the end
  }

  // get average of the buffer as rounded Int
  getAvgInt() {
    return Math.round(_.mean(this.values))
  }

  getStableAvg() {
    // if all values are within 'volatility'
    // check if lenght of .values filtered by volatility range == lenght of unfiltered .values

    if (this.values.length === this.values.filter(val =>
      _.inRange(
        val,
        _.last(this.values) - this.volatility,
        _.last(this.values) + this.volatility)).length
    ) {
      this.stableAvg = Math.round(_.mean(this.values))
    }
    return this.stableAvg
  }
}

const sliderBuffer = new Buffer(3)

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
      _model.slider = args[0]
      try { update_slider() } catch (error) { console.log(error) }
      break
    case 'K':
      for (let i = 0; i < 11; i++) { _model.keypad[i] = !!((args[0] & (1 << i))) }
      try { update_keypad() } catch (error) { console.log(error) }
      break
    case 'T':
      _model.touchpad.x = args[0];
      _model.touchpad.y = args[1];
      _model.touchpad.z = args[2];
      try { update_touchpad(); }
      catch (error) { console.log(error) }
      break;
    case 'C':
      for (let i = 0; i < 6; i++) { _model.mat[i][subcmd - 1] = args[i] }
      try { update_mat(subcmd - 1) } catch (error) { 
        // console.log(error) 
      }
      break
    case 'P':
      _model.power = args[0] != 0
      try { update_power() } catch (error) { 
        // console.log(error) 
      }
      break
  }
}

// ELEMENT UPDATE FUNCTIONS //////////////////////////////////

function update_mat(c) { // c (column) is an array - one number per line
  // console.log(_model.mat)

  const mat_gain = 6
  const mat_threshold = 5

  for (let i = 0; i < 6; i++) {
    const d = document.getElementById('mat_L' + i + 'C' + c)
    const x = _model.mat[i][c]

    // OPACITY A: 0 up to threshod, then linear mulitplied by gain value
    // d.style.opacity = x > mat_threshold ? (x / 255) * mat_gain : 0

    // OPACITY B: 100% over threhold
    // d.style.opacity = x > mat_threshold ? 1 : 0

    // OPACITY C: log 106*(0.7+log10(x/5))
    d.style.opacity = 106*(0.7+Math.log10(x/5)) / 255

    d.innerText = Math.round(d.style.opacity * 100) / 100
  }
}

function update_touchpad() {
  // console.log(_model.touchpad)
  const touchpad_threshold = 5

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

function update_slider() { // OK
  // sliderBuffer.addValue(_model.slider) // add the latest reading
  // const avgVal = sliderBuffer.getStableAvg() // averaged buffer
  
  console.log(_model.slider)

  const s = document.getElementById('slider-input')
  s.value = _model.slider

  // const sVal = parseInt(s.value)
  // const sMin = parseInt(s.min)
  // const sMax = parseInt(s.max)
  // const margin = 4 // don't set new value if it's within [margin] from the last one => smooth out the visualisation
  // const touchMin = 5 // if reading is bellow, finger is lifted

  // HTML range is 100-220, these values are withing the printed slider graphic
  // if (_model.slider < touchMin) {
  //   // finger is off
  // } else if (_model.slider < sMin) {
  //   // finger is below minimum
  //   s.value = sMin
  // } else if (_model.slider < sMax) {
  //   // finger is on the slider
  //   // Eliminate reading noise, use margin
  //   if (!_.inRange(_model.slider, sVal - margin, sVal + margin)) {
  //     s.value = _model.slider
  //   }
  // } else if (_model.slider > sMax) {
  //   // finger is past maximum
  //   s.value = sMax
  }

  // // Set style based on raw value
  // if (_model.slider < touchMin) {
  //   // finger is off
  //   s.style.borderColor = 'var(--main-color)'
  // } else if (_model.slider < sMin) {
  //   // finger is below minimum
  //   s.style.borderColor = 'var(--main-color)'
  // } else if (_model.slider < sMax) {
  //   // finger is on the slider
  //   s.style.borderColor = 'var(--highlight-color)'
  // } else if (_model.slider > sMax) {
  //   s.style.borderColor = 'var(--main-color)'
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

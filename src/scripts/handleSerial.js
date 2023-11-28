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
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  ],
  power: false,
};

// CUSTOM CLASSES & FUNCTIONS //

// defines a stream processor which extracts lines of text delimited by '\r\n'
class LineBreakTransformer {
  constructor() {
    this.container = "";
  }

  transform(chunk, controller) {
    this.container += chunk;
    const lines = this.container.split("\r\n");
    this.container = lines.pop();
    lines.forEach((line) => {
      // console.log(line)
      controller.enqueue(line);
    });
  }

  flush(controller) {
    controller.enqueue(this.container);
  }
}

// check that all the datalogger values are numbers in the expected range 0 - 4095. return Integer array or false
function validateRawData(arr) {
  // return False if the array length isn't 4
  if (arr.length !== 4) {
    return false;
  }

  // Convert strings to integer or NaN if conversion fails
  const convertedArray = arr.map((str) => {
    const num = parseInt(str, 10);
    return isNaN(num) ? NaN : num;
  });

  // check that all values are numbers in the correct range 0 - 4095
  const isValid = convertedArray.every((num) => num >= 0 && num <= 4095);

  // Return a new array of integers or false
  return isValid ? convertedArray : false;
}

// scale a value from one range to another.
function convertRange(value, inMin, inMax, outMin, outMax) {
  const result =
    ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;

  if (result < outMin) {
    return outMin;
  } else if (result > outMax) {
    return outMax;
  }

  return result;
}

function rnd2(n) {
  return Math.round(n * 100) / 100;
} //round down to 2 decimals

class MovingAverageArray {
  // sampleSize is how many values the average will be calculated from
  // elementCount is how many values/averages are in the array
  constructor(sampleSize, elementCount) {
    this.sampleSize = sampleSize;
    this.elementCount = elementCount;
    this.queues = Array.from({ length: elementCount }, () => []);
  }

  add(values) {
    if (values.length !== this.elementCount) {
      throw new Error(`Input array must have ${this.elementCount} elements.`);
    }

    values.forEach((value, index) => {
      const queue = this.queues[index];
      queue.push(value);

      if (queue.length > this.sampleSize) {
        queue.shift();
      }
    });
  }

  getAverage() {
    return this.queues.map(
      (queue) => queue.reduce((acc, val) => acc + val, 0) / (queue.length || 1)
    );
  }
}

const movingAverage = new MovingAverageArray(20, 4); // For arrays of length 4, averaging over the last 5 values

const xoff = 8000
const yoff = 10000

function calculate_xyz(data, verbose = false) {
  
  // % Calculate the activation levels:
  const act1 = data[2] + data[3];
  const act2 = 4095 - data[0] + (4095 - data[1]);

  // % Calculate the directional differentials:
  const ydir = data[0] - data[1];
  const xdir = data[2] - data[3];

  // insole - the first number is the actual reading when the insole is pressed at the edges. we want to display the press there.
        //  in raw values it's 20 both for x and y
        // for clean it's 8000 for x and 10000 for y
  //  28000 and 59200 represent a ratio of natural resistances of the insole in x and y directions
  const x = xoff + (xdir * 28000) / act1;
  const y = yoff + (ydir * 59200) / act1;

  const x_out = convertRange(x,0,16000,0,1000).toFixed(0)
  const y_out = convertRange(y,0,20000,0,1000).toFixed(0)

  if (verbose) {
    // console.log(data);

    // // console.log(`ACT1: ${data[2]} + ${data[3]} = ${Math.round(act1)}`)
    // // console.log(`ACT2: (4095 - ${data[0]}) + (4095 - ${data[1]}) = ${Math.round(act1)}`)
    // console.log(`ACT1: ${Math.round(act1)}`);
    // console.log(`ACT2: ${Math.round(act1)}`);

    // // console.log(`YDIR: ${data[0]} - ${data[1]} = ${Math.round(ydir)}`)
    // // console.log(`XDIR: ${data[2]} - ${data[3]} = ${Math.round(xdir)}`)
    // console.log(`YDIR: ${Math.round(ydir)}`);
    // console.log(`XDIR: ${Math.round(xdir)}`);

    // console.log(`Y: ${Math.round(y)}`);
    // console.log(`X: ${Math.round(x)}`);
  }

  // console.log(`X: ${Math.round(x)} \t Y: ${Math.round(y)} \t Z: ${Math.round(act1)} ; ${Math.round(act2)}`)
  console.log(`${x_out}, ${y_out},${act2},`)
  
  return [x_out, y_out, act2];
}

// PROCESS // a line received over serial
function process_for_datalogger(line) {
  // line looks like this: 1365002#4089,4089,7,0; timestamp#value,value,value,value;

  // PARSING
  line = line.replace(";", ""); //remove ;
  const input = line.split("#"); // split timestamp from values => ['1365002',4089,4089,7,0;]
  const timestamp = input[0];
  const raw = input[1].split(",");
  const clean = validateRawData(raw);
  if (clean) movingAverage.add(clean); // ad new clean data to smooth
  const smooth = movingAverage.getAverage();

  if (smooth.length !== 4) return; // don't do anything if there's no data in smooth

  // console.log("---raw---");
  // console.log(timestamp, raw, calculate_xyz(raw,flase));
  // console.log("---clean---");
  // console.log(timestamp, clean, calculate_xyz(clean, true));
  // console.log("---smooth---");
  // console.log(timestamp, smooth, calculate_xyz(smooth, false));
  // console.log("=======================");

  // return;

  // UPDATE UI
  if (document.getElementById("touchpad") === null) return;

  const vals = calculate_xyz(smooth,true);

  _model.touchpad.x = vals[0];
  _model.touchpad.y = vals[1];
  _model.touchpad.z = vals[2];

  if (recordingOn) {
    console.log("call log data");
    logData();
  }

  try {
    update_touchpad();
    update_readout();
  } catch (error) {
    console.log(error);
  }
}

// ELEMENT UPDATE FUNCTIONS //////////////////////////////////
let max = 0;
let maxlog = 0;
function update_mat(c) {
  // c - index of a column
  // console.log(_model.mat)

  const mat_gain = 6;

  for (let i = 0; i < 6; i++) {
    const d = document.getElementById("mat_L" + i + "C" + c);
    const x = _model.mat[i][c];

    // if (i== 0 && c==0){
    if (x > max) {
      max = x;
    } // remember maximum measured value

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
    const mat_threshold = 50; // anything below is considered noise and is ignored
    const mat_cutoff = 200; // considered as maximum value that can be achieved by pressure

    const converted = convertRange(x, mat_threshold, mat_cutoff, 1, 255); // raw between treshold and cutoff scaled to 0-255
    const log = (106 * (0.7 + Math.log10(converted / 5))) / 255; // plots converted values logarithmically between 0 and 1

    d.style.opacity = log;
    d.innerText = Math.round(log * 100) / 100;

    // console.log(`[${i},${c}]  raw: ${x} :\t conv: ${rnd2(converted)} :\t log: ${rnd2(log)}  :\t max: ${max}`)

    // } // test if 0,0
  }
}

function update_touchpad() {
  const touchpad_threshold = 100;

  const canvas = document.getElementById("tp_canvas");
  const press = document.getElementById("press");

  const x = _model.touchpad.x;
  const y = _model.touchpad.y;
  const z = _model.touchpad.z;

  // position value / maximum posible value
  const posx = (x / 1000) * canvas.clientWidth; //the range is 0 - 1000 converted in the calculate_xyz()
  const posy = (y / 1000) * canvas.clientHeight;
  const sizez = ((z / 4095) * canvas.clientHeight) / 2; // size of pressure cirle scales with the canvas/window
  // console.log(`x: ${posx}  y: ${posy}  z: ${sizez}`)

  // press is a div inside the tp_canvas div representing position and force of pressure on the physical sensor
  press.style.top = posy - sizez / 2; // offset by a half of the size => center in the middle of press
  press.style.left = posx - sizez / 2;

  if (z > touchpad_threshold) {
    // press.style.display = 'block'
    press.style.width = sizez;
    press.style.height = sizez;
    press.style.opacity = z;
  } else {
    // press.style.display = 'none'
    press.style.width = 0;
    press.style.height = 0;
    press.style.opacity = 0;
  }
}

function update_readout(){
  value_readout = document.getElementById("values");
  if (_model.touchpad.z > 100) {
    value_readout.innerHTML = `x: ${parseInt(
      _model.touchpad.x
    )} <br> y: ${parseInt(_model.touchpad.y)} <br> z: ${parseInt(
      _model.touchpad.z
    )} `; // update readout on the screen
  } else {
    value_readout.innerHTML = `x: <br> y: <br> z: `; // update readout on the screen
  }
}

/// LOG DATA ///////////

const recordButton = document.getElementById("recordButton");
const saveButton = document.getElementById("saveButton");
const recordingFlag = document.getElementById("recordingFlag");
let recordingOn = false;

const logStringDefault = "Timestamp, Position X, Position Y, Activation Z \n";
let logString = logStringDefault;

recordButton.onclick = () => {
  console.log("record button");
  if (recordingOn) {
    recordingOn = false;
    recordButton.innerText = "Start Recording";
    recordButton.classList.remove("fade");
    saveButton.classList.remove("hidden");
  } else {
    logString =
      `Recording started on ${new Date(Date.now())} \n` + logStringDefault;
    recordingOn = true;
    recordButton.innerText = "Recording";
    recordButton.classList.add("fade");
  }
};

recordButton.onmouseover = () => {
  if (recordingOn) {
    recordButton.innerText = "Stop Recording";
  }
};

let isMouseOver = false;

recordButton.onmouseleave = () => {
  if (!isMouseOver && recordingOn) {
    recordButton.innerText = "Recording";
    setTimeout(() => {
      isMouseOver = false;
    }, 500); // Set the throttle time to 500 milliseconds
  }
};

saveButton.onclick = () => {
  console.log("save button");
  saveLog(logString);
};

function logData() {
  console.log("log data");

  logString = logString.concat(
    `${Date.now()}, ${_model.touchpad.x}, ${_model.touchpad.y}, ${
      _model.touchpad.z
    } \n`
  );

  //update graph
  const now = Date.now();
  chartConfig.data.datasets[0].data.push({ x: now, y: _model.touchpad.x });
  chartConfig.data.datasets[1].data.push({ x: now, y: _model.touchpad.y });
  chartConfig.data.datasets[2].data.push({ x: now, y: _model.touchpad.z });
  liveChart.update();

  console.log("Data-points logged: " + logString.split("\n").length - 3);
}

function saveLog(data) {
  // tutorial: https://www.youtube.com/watch?v=oHGnaE2BQXo

  const a = document.createElement("a"); // link element for downloading the file
  const myBlob = new Blob([data], { type: "text/csv" }); // file-like object
  const url = window.URL.createObjectURL(myBlob); // creates a link to the blob

  a.href = url; //a element point to the blob
  a.download = "InfiSole_log.csv"; //download file name
  a.style.display = "none"; //hide it from the user, we call it elsewhere
  document.body.append(a); //add to the body

  a.click();
  a.remove();
  window.URL.revokeObjectURL(url); //clear the blowser memory
}

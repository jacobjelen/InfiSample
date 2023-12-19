// DATA MODEL
const _model = {
  touchpad: { x: 0, y: 0, z: 0 },
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

function calculate_xyz(data, verbose = false) {
  // % Calculate the activation levels:
  const act1 = data[2] + data[3];
  const act2 = 4095 - data[0] + (4095 - data[1]);

  // % Calculate the directional differentials:
  const ydir = data[0] - data[1];
  const xdir = data[2] - data[3];

  // 28000 and 59200 represent a ratio of natural resistances of the sensor in x and y directions
  const x = (xdir * 28000) / act1;
  const y = (ydir * 59200) / act1;

  if (verbose) {
    // console.log(data);

    console.log(`ACT1: ${data[2]} + ${data[3]} = ${Math.round(act1)}`);
    console.log(
      `ACT2: (4095 - ${data[0]}) + (4095 - ${data[1]}) = ${Math.round(act1)}`
    );
    // console.log(`ACT1: ${Math.round(act1)}`);
    // console.log(`ACT2: ${Math.round(act1)}`);

    console.log(`YDIR: ${data[0]} - ${data[1]} = ${Math.round(ydir)}`);
    console.log(`XDIR: ${data[2]} - ${data[3]} = ${Math.round(xdir)}`);
    console.log(`YDIR: ${Math.round(ydir)}`);
    console.log(`XDIR: ${Math.round(xdir)}`);

    console.log(`Y: ${Math.round(y)}`);
    console.log(`X: ${Math.round(x)}`);
  }

  // Real Measured insole value range: X: -8000 - 7400; Y: -10150 - 10150 
  return [x, y, act2];
}

// PROCESS // a line received over serial
function process_for_datalogger(line) {
  // line looks like this: 1365002#4089,4089,7,0; timestamp#value,value,value,value;

  let timestamp, raw, smooth;

  // PARSING
  try {
    line = line.replace(";", ""); //remove ;
    const input = line.split("#"); // split timestamp from values => ['1365002',4089,4089,7,0;]
    timestamp = input[0];

    raw = input[1].split(",").map((str) => {    
      let parsed = parseInt(str);                         //turn strings into ints and c
      return isNaN(parsed) ? null : parsed;               //if the string is not a number, replace with null
    });

    //checks
    if (raw.length !== 4 || raw.includes(null)) return;   // is it 4 ints?
    if( raw.every((num) => num >= 0 && num <= 4095) ){    // are the ints in the range 0 - 4095?
      movingAverage.add(raw);                             // then include the numbers in average
      smooth = movingAverage.getAverage();
    } else return

  } catch (error) {
    console.log(error);
    return;
  }

  if (smooth.length !== 4) return;                        // don't do anything if there's no data in smooth

  // UPDATE UI
  if (document.getElementById("touchpad") === null) return;

  const vals = calculate_xyz(smooth);

  _model.touchpad.x = convertRange(vals[0], -8000, 7400, 0, 1000).toFixed(0);;
  _model.touchpad.y = convertRange(vals[1], -10150, 10150, 0, 1000).toFixed(0);;
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

// ELEMENT UPDATE FUNCTIONS /////////////////////////////////
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

function update_readout() {
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
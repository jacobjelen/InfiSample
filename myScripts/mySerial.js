const SerialPort = require('serialport')
const Readline = require('@serialport/parser-readline')
// let port = new SerialPort('/dev/cu.usbmodem14201', { baudRate: 9600 })
// let parser = port.pipe(new Readline({ delimiter: '\n' }))
let port, parser
setPort('/dev/cu.usbmodem14201')

// PortSelect // Populate the dropdown menu
SerialPort.list().then(ports => {
  console.log(ports)
  const dropdown = document.getElementById('portSelect')

  ports.forEach((port) => {
    dropdown.add(new Option(port.path))
  })
})

// FUNCTIONS ///////////////////////////////////////////////////////////////

// Change port based on user selection
async function changePort (t) {
  console.log(t)
  const selectedPort = document.getElementById('portSelect').value

  if (port.isOpen) await port.close() // if port is open, close it before moving on
  setPort(selectedPort)
}

// set port
async function setPort (newPort) {
  if (port && port.isOpen) await port.close() // if port is open, close it before moving on

  port = new SerialPort(newPort, { baudRate: 9600 })

  port.on('open', () => {
    console.log('serial open: ' + port.path)
    port.flush()

    // update parser object
    parser = port.pipe(new Readline({ delimiter: '\n' }))
    parser.on('data', data => {
    // console.log('got word from arduino:', data);
      document.getElementById('title').innerHTML = data



    })
  })
}

// INITIAL FUNCTIONS

function serial_init () {
  const bc = document.getElementById('connect')
  const err = document.getElementById('notSupported')
  const main = document.getElementById('main')
  main.style.opacity = 0.3
  document.getElementById('recordButton').classList.add('hidden')

  if (!'serial' in navigator) {
    err.style.display = 'block'
  }

  bc.onclick = async function () {
    let port = null

    console.log('Connect clicked')
    console.dir(navigator)

    try {
      port = await navigator.serial.requestPort()
      await port.open({ baudRate: 115200 })

      await port.setSignals({ dataTerminalReady: true })
      await port.setSignals({ requestToSend: false })
    } catch (e) {
      // bc.className = 'connect-error'
      // bc.innerHTML = 'Connect: Error 1'
      // main.style.opacity = 0.3
      return
    }

    bc.className = 'connect-ok'
    err.style.display = 'none'
    // bc.innerHTML = 'Connect '
    main.style.opacity = 1
    document.getElementById('recordButton').classList.remove('hidden')

    while (port.readable) {
      const reader = port.readable
        .pipeThrough(new TextDecoderStream())
        .pipeThrough(new TransformStream(new LineBreakTransformer()))
        .getReader()

      try {
        while (true) {
          const { value, done } = await reader.read()
          if (value) {
            process(value)
          }
          if (done) {
            port.close()
            // bc.className = 'connect-error'
            // bc.innerHTML = 'Connect: Error 2'
            // main.style.opacity = 0.3

            break
          }
        }
      } catch (e) {
        console.log(e)
        // bc.innerHTML = 'Connect'
        bc.className = 'connect-error'
        // main.style.opacity = 0.3
      } finally {
        reader.releaseLock()
      }
    }
  }
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

// sets up the connect button to trigger serial selection, and
// calling of the process() function on each received serial line
window.onload = function () {
  if (document.getElementById('mat') !== null) {
    fillMat()
  } // do nothing if mat (multitouch) is not present
  
  serial_init()
}

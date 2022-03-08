// INITIAL FUNCTIONS

function serial_init () {
  if (!'serial' in navigator) { document.getElementById('notSupported').style.display = 'block' }

  const bc = document.getElementById('connect')

  bc.onclick = async function () {
    let port = null

    try {
		    port = await navigator.serial.requestPort()
		    await port.open({ baudRate: 115200 })

      await port.setSignals({ dataTerminalReady: true })
      await port.setSignals({ requestToSend: false })
    } catch (e) {
      bc.className = 'error'
      return
    }
    bc.className = 'ok'

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
            bc.className = 'error'
            break
          }
        }
      } catch (e) {
        console.log(e)
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
  fillMat()
  serial_init()
}


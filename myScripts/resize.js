window.addEventListener('load', resizeMain)
window.addEventListener('resize', resizeMain)

function resizeMain () {
  // initial size = ratio to maintain
  const contWidht = 400
  const contHeight = 200

  const cont = document.getElementById('container')

  // get current window size
  const windowWidth = window.visualViewport.width
  const windowHeight = window.visualViewport.height

  const multiplier = 0.8 // instead of margin. portion of the width or height filled by container
  const winRatio = windowWidth / windowHeight
  const contRatio = contWidht / contHeight
  let newWidth, newHeight

  if (contRatio >= winRatio) {
    // window WIDTH deciding the size
    cont.style.backgroundColor = 'green'
    newWidth = windowWidth * multiplier
    newHeight = newWidth / contRatio
  } else {
    // window HEIGHT deciding the size
    cont.style.backgroundColor = 'blue'
    newHeight = windowHeight * multiplier
    newWidth = newHeight * contRatio
  }

  cont.style.width = newWidth + 'px'
  cont.style.height = newHeight + 'px'
}

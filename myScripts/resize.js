window.addEventListener('load', resizeMain)
window.addEventListener('resize', resizeMain)

function resizeMain () {
  // initial size = ratio to maintain
  const contWidht = 900
  const contHeight = 666
  const multiplier = 0.9 // instead of margin. portion of the width or height filled by container

  const cont = document.getElementById('container')

  // get current window size
  const windowWidth = window.visualViewport.width
  const windowHeight = window.visualViewport.height

  const winRatio = windowWidth / windowHeight
  const contRatio = contWidht / contHeight
  let newWidth, newHeight

  if (contRatio >= winRatio) {
    // window WIDTH deciding the size
    // cont.style.backgroundColor = 'green'
    newWidth = windowWidth * multiplier
    newHeight = newWidth / contRatio
  } else {
    // window HEIGHT deciding the size
    // cont.style.backgroundColor = 'blue'

    newHeight = windowHeight * multiplier
    newWidth = newHeight * contRatio
  }

  cont.style.width = newWidth + 'px'
  cont.style.height = newHeight + 'px'

  document.documentElement.style.setProperty('--border-width', newWidth * 0.002 + 'px')
  document.documentElement.style.setProperty('--font-size', newWidth * 0.03 + 'px')
  // document.documentElement.style.setProperty('--main-color', 'pink')
  // document.body.style.fontSize = newWidth * 0.03 + 'px'
  // document.body.style.borderWidth = newWidth + 'px'

//   cont.style.display = 'block'
}

window.addEventListener('load', resizeMain)
window.addEventListener('resize', resizeMain)

function resizeMain () {
  // initial size = ratio to maintain
  const contWidht = 900
  const contHeight = 900
  const multiplier = 0.9 // instead of margin. portion of the width or height filled by container

  const cont = document.getElementById('main')

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

  // update CSS variables
  document.documentElement.style.setProperty('--main-width', newWidth + 'px')
  document.documentElement.style.setProperty('--main-height', newHeight + 'px')

  // document.documentElement.style.setProperty('--border-width', newWidth * 0.002 + 'px')
  // document.documentElement.style.setProperty('--keypad-font-size', newWidth * 0.03 + 'px')
  // document.documentElement.style.setProperty('--label-font-size', newWidth * 0.018 + 'px')

  // try {
  //   const canvas = document.querySelector('canvas')
  //   fitToContainer(canvas)
  // } catch (error) {
  //   console.log(error)
  // }
  
}

function fitToContainer (canvas) {
  // Make it visually fill the positioned parent
  canvas.style.width = '100%'
  canvas.style.height = '100%'
  // ...then set the internal size to match
  canvas.width = canvas.offsetWidth
  canvas.height = canvas.offsetHeight
}

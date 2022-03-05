document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('menu-button-box').addEventListener('click', () => {
    document.getElementById('topBar').classList.toggle('hidden')
    fillPortSelector() // populate the port selection dropdown on menu click
  })
})

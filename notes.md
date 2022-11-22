### ToDo:
- sole display: mask + background
- left/right sole
- BLE
- React

### Branches:
Master - this was originaly developed to run independently using Electron, not in the browser
    Browser - build to run this in Chrome using it's 'Experimental Web Features'
        Browser-Production - Working version! Customers access this code via https://infitex-sample.netlify.app/


### Styles and Resizing
- each sensor (sample, sole, 40x40cm 4-wire) requires a different UI layout, which must scale for any window size
- resize.js resizes <main> to always fit the window
- inside <main>, each sensor will have a different container element (#sample-container, #sole-container...) 
- each container element will have its own CSS (sample.css, sole.css)
    - at the begining of each CSS file, we must specify the initial size/aspect-ration for the given sensor UI
    - evenrything needs to be defined in relative terms. use '%', not 'px' etc... 
- general.css specifies the things common to everything - connect button etc.
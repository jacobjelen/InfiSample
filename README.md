# InfiSample

This demo software should acompany Infi-tex printed pressure sensor sample sheets. For orders and more information visit [Infi-tex.com](http://www.infi-tex.com/)

### References
I started with [electron-quick-start](https://github.com/electron/electron-quick-start) following [this tutorial](https://girishjoshi.io/post/access-serialport-from-electron-application-and-creating-gui-for-micropython-repl-on-esp8266/). 

However, it did not work you can't call 'native Node modules' (such as serialport) with newer versions of Electron (after July 2021). So versions mentioned in [this StackOverflow answer](https://stackoverflow.com/questions/50860088/getting-electron-to-work-with-nodes-bluetooth-serial-port/56856773#56856773) by tousisat were used.

```
Delete your node_modules folder and the package.lock file.

Open your terminal: npm install --save-dev electron@4.2.6 and npm install --save-dev  electron-rebuild.

Note: The version of electron should be that exact version. Recent releases are built on Node 12 and this will fail to build the bluetooth library. You can learn more here: https://www.npmjs.com/package/electron-releases

Also in your terminal: npm install --save bluetooth-serial-port. My version is 2.2.4 by the time of writing.

add this script to your package.json: "scripts":{"rebuild": "electron-rebuild"}

In your terminal: npm install and then npm run rebuild
```

This was built and tested on: 
- MacOS Catalina v10.15.7
- Node.js v16.1.0
- January 2022

### NPM Dependecies
- Electron 4.2.6, 
- Electron Rebuild 1.8.5
- serialport 9.2.8


### Setup from scratch
1. from terminal
```bash
# Clone this repository
git clone https://github.com/electron/electron-quick-start

# Go into the repository
cd electron-quick-start

# Install dependencies
npm install --save-dev electron@4.2.6 
npm install --save-dev  electron-rebuild@1.8.5
npm install --save serialport@9.2.8
npm install 
```
2. add this script to your *package.json*: `"scripts":{"rebuild": "electron-rebuild"}`
3. ```npm run rebuild```
4. In *main.js* add `app.allowRendererProcessReuse = false;`. Also while creating the BrowserWindow, modify webPreferences to.
```bash
webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false
}
```
5. Modify *index.thml* to match your serial port and baud rate settings... 
```var sp = new serialPort('/dev/ttyUSB0', {
    baudRate: 115200,
});
```

6. Run the app
```npm start```


const { app, Menu, MenuItem, Tray, nativeImage, clipboard, dialog, shell } = require('electron')
const appIcon = require('./js/app-icon')
const DeviceManager = require('./js/device_manager')

const APP_NAME = require('./package').name
const APP_STORAGE_KEY = APP_NAME.toLowerCase()
const APP_STORAGE_FILE_PATH = `${app.getPath('userData')}/storage/${APP_STORAGE_KEY}.json`

var deviceManager = new DeviceManager(APP_STORAGE_KEY);
var tray = null;

function createTray() {
	tray = new Tray("./images/vr.png")
	tray.setToolTip(APP_NAME)

	tray.on('click', _ => {
		var menu = createMenu(deviceManager.devices)
		tray.popUpContextMenu(menu)
		tray.setContextMenu(menu)
	})

	tray.setContextMenu(createMenu(deviceManager.devices))
	return tray
}

function createMenu(devices) {
	const template = []

	devices = devices.filter(device => { return device.alias })

	if (!devices.length) {
		template.push({ label: 'No devices found', enabled: false })
	}

	devices.forEach(device => {
		template.push({ label: device.alias, enabled: false })
		template.push({
			label: device.relayState ? 'On' : 'Off',
			click() {
				device.setRelayState(device.relayState ? 0 : 1)
			}
		})
		template.push({ type: 'separator' })
	})

	template.push({ type: 'separator', id: 'mainSeparator' })
	template.push({ label: 'Configure…', click() { openConfigFile() }})
	template.push({ label: 'Quit', click() { app.quit() } })

	return Menu.buildFromTemplate(template)
}

function openConfigFile() {
	const isOpened = shell.openItem(APP_STORAGE_FILE_PATH)

	if (isOpened) return

	dialog.showMessageBox({
		type: 'info',
		title: `Configure ${APP_NAME}`,
		message: 'There was a problem opening the configuration file',
		detail: `Please manually edit the file at\n${APP_STORAGE_FILE_PATH}`
	})
}

app.on('ready', () => {

	deviceManager.loadDevices().then(() => {
		console.log("Devices loaded")
		createTray()
	}).catch((error) => {
		console.log("Error loading devices!", error)
	})

	if (app.dock) {
		app.dock.hide()
	}
})

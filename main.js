const { app, Menu, MenuItem, Tray, nativeImage, clipboard, dialog, shell } = require('electron')
const appIcon = require('./js/app-icon')
const DeviceManager = require('./js/device_manager')

const APP_NAME = require('./package').name
const APP_STORAGE_KEY = APP_NAME.toLowerCase()
const APP_STORAGE_FILE_PATH = `${app.getPath('userData')}/storage/${APP_STORAGE_KEY}.json`

var deviceManager = new DeviceManager(APP_STORAGE_KEY);
console.log("DevicesManager", deviceManager)
deviceManager.loadDevices().then(() => {
		console.log("Devices loaded")
}).catch((error) => {
	console.log("Error loading devices!", error)
})

function createTray() {
	const tray = new Tray(appIcon)
	tray.setToolTip(APP_NAME)

	tray.on('click', _ => {
		tray.popUpContextMenu(createMenu(deviceManager.devices))
	})

	return tray
}

function createMenu(devices) {
	const template = []

	if (!devices.length) {
		template.push({ label: 'No devices found', enabled: false })
	}

	devices.forEach(device => {
		template.push({ label: device.alias, enabled: false })
		template.push({
			label: device.relayState ? 'On' : 'Off',
			click() {
				device.setRelayState(device.relayState ? 0 : 1, () => {
					console.log("Updated relay state to ", device.relayState)
				})
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

app.on('ready', createTray)
if (app.dock) {
	app.dock.hide()
}

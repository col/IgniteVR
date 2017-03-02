const { app, Menu, MenuItem, Tray, nativeImage, clipboard, dialog, shell } = require('electron')
const storage = require('electron-json-storage')
const appIcon = require('./js/app-icon')
const SmartPlug = require('tp_link_smart_plug').SmartPlug
const Promise = require('promise')

const APP_NAME = require('./package').name
const APP_STORAGE_KEY = APP_NAME.toLowerCase()
const APP_STORAGE_FILE_PATH = `${app.getPath('userData')}/storage/${APP_STORAGE_KEY}.json`

function createMenu(devices) {
	const template = []

	if (!devices.length) {
		template.push({
			label: 'No devices found',
			enabled: false
		})
	}

	devices.forEach(device => {
		template.push({ label: device.alias, enabled: false })
		template.push({
			label: device.relay_state ? 'On' : 'Off',
			click() {
				var newState = device.relay_state ? 0 : 1
				var smartPlug = new SmartPlug(device.ip, 9999)
				smartPlug.setRelayState(newState)
			}
		})
		template.push({ type: 'separator' })
	})

	template.push({ type: 'separator', id: 'mainSeparator' })
	template.push({
		label: 'Configure…',
		click() {
			const isOpened = shell.openItem(APP_STORAGE_FILE_PATH)

			if (isOpened) return

			dialog.showMessageBox({
				type: 'info',
				title: `Configure ${APP_NAME}`,
				message: 'There was a problem opening the configuration file',
				detail: `Please manually edit the file at\n${APP_STORAGE_FILE_PATH}`
			})
		}
	})
	template.push({ label: 'Quit', click() { app.quit() } })

	return Menu.buildFromTemplate(template)
}

function createTray() {
	const tray = new Tray(appIcon)
	tray.setToolTip(APP_NAME)

	tray.on('click', _ => {
		loadDevices((devices) => {
			tray.popUpContextMenu(createMenu(devices))
		})
	})

	return tray
}

function loadDevices(callback) {
	storage.get(APP_STORAGE_KEY, (error, data) => {
		if (error) {
			dialog.showErrorBox('Error loading data', error)
			return
		}

		if (!Array.isArray(data)) {
			setDefaultConfig()
			return
		}
		Promise.all(data.map(item => { return getDeviceState(item) })).then(devices => {
				callback(devices)
		})
	})
}

function getDeviceState(device) {
		var promise = new Promise(function(resolve, reject) {
				var smartPlug = new SmartPlug(device.ip, 9999)
				smartPlug.relayState(state => {
					resolve({ ip: device.ip, alias: device.alias, relay_state: state})
				})
		})
		return promise
}

function setDefaultConfig() {
	storage.set(APP_STORAGE_KEY, [
		{ ip: '192.168.0.100', alias: 'VR Base Station 1' }
	], error => {
		if (error) {
			dialog.showErrorBox('Error creating config file', errro)
		}
	})
}

app.on('ready', createTray)
app.dock.hide()

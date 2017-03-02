"use strict";

const storage = require('electron-json-storage')
const SmartPlug = require('tp_link_smart_plug').SmartPlug
const Promise = require('promise')

function DeviceManager(appStorageKey) {
  this.appStorageKey = appStorageKey
  this.devices = []
}

DeviceManager.prototype.loadDevices = function() {
  var promise = new Promise((resolve, reject) => {
    console.log("Loading devices...")
    storage.get(this.appStorageKey, (error, data) => {
      if (error) {
        reject('Error loading device list', error)
        return
      }

      if (!Array.isArray(data)) {
        this.setDefaultConfig()
        reject('Error loading device list', error)
        return
      }

      console.log("Found ", data)
      this.devices = data.map( item => {
        return new SmartPlug(item.ip, 9999);
      })

      this.updateDevices().then(() => {
        resolve()
      })
    })
  })
  return promise
}

DeviceManager.prototype.updateDevices = function() {
  return Promise.all(this.devices.map(device => {
    return new Promise((resolve, reject) => {
      device.update(() => {
        resolve()
      })
    })
  }))
}

DeviceManager.prototype.setDefaultConfig = function() {
	storage.set(this.appStorageKey, [{ ip: '192.168.0.100', alias: 'VR Base Station 1' }], error => {
		if (error) {
			console.log('Error creating config file', error)
		}
	})
}

module.exports = DeviceManager;

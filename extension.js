/************************************************************
Copyright 2018 Bartosz Jaroszewski
: GPL-2.0-or-later

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 2 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.
 ******************************************************************/
import {* as buds, Log} from "./buds.js";
import GLib from 'gi://GLib';
//const Mainloop = imports.mainloop;
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

import * as Bluetooth from "./bluetooth.js";
import * as Utils from "./utils.js";

class GalaxyBudsBattery {
  constructor() {
    this._controller = new Bluetooth.BluetoothController();
    this.btGalxyBudsBattIndicator = new buds.budsBattIndicator();
  }

  enable() {
    if (this.btGalxyBudsBattIndicator == null)
      this.btGalxyBudsBattIndicator = new buds.budsBattIndicator();
    if (this._controller == null)
      this._controller = new Bluetooth.BluetoothController();
    this._connectControllerSignals();
    this._controller.enable();
  }

  disable() {
    Log('Disabling extension');
    this._destroy();
  }

  _connectControllerSignals() {
    Log('Connecting bluetooth controller signals');

    this._connectSignal(this._controller, 'device-inserted', (ctrl, device) => {
      if (device.name.includes("Galaxy Buds")){
        Log("Buds inserted event MAC="+device.mac);
        if (!device.isConnected){
          this.btGalxyBudsBattIndicator.disable();
        } else {
          this.btGalxyBudsBattIndicator.enable(device.mac);
        }
      }
    });

    this._connectSignal(this._controller, 'device-changed', (ctrl, device) => {
      Log(`Device changed event: ${device.name}`);
      if (device.name.includes("Galaxy Buds")){
        Log(`Buds changed event`);
        if (!device.isConnected){
          this.btGalxyBudsBattIndicator.disable();
        } else {
          this.btGalxyBudsBattIndicator.enable(device.mac);
        }
      }
    });

    this._connectSignal(this._controller, 'device-deleted', () => {

      if (device.name.includes("Galaxy Buds")){
        Log(`Buds deleted event`);
        if (!device.isConnected){
          this.btGalxyBudsBattIndicator.disable();
        } else {
          this.btGalxyBudsBattIndicator.enable(device.mac);
        }
      }
    });

    this._connectSignal(Main.sessionMode, 'updated', () => {
    });
  }

  _connectSignal(subject, signal_name, method) {
    let signal_id = subject.connect(signal_name, method);
    this._signals.push({
      subject: subject,
      signal_id: signal_id
    });
  }

  _destroy() {
    this._disconnectSignals();
    if (this._controller){
      this._controller.destroy();
      this._controller = null;
    }
    if (this.btGalxyBudsBattIndicator){
      this.btGalxyBudsBattIndicator.reset();
      this.btGalxyBudsBattIndicator.destroy();
      this.btGalxyBudsBattIndicator = null;
    }
  }
}

Utils.addSignalsHelperMethods(GalaxyBudsBattery.prototype);

let galaxyBudsBattery ;

function enable() {
  Log("Extension enabled");
  galaxyBudsBattery = new GalaxyBudsBattery();
  galaxyBudsBattery.enable();
}

function disable() {
  Log("Extension disabled");
  galaxyBudsBattery.disable();
}

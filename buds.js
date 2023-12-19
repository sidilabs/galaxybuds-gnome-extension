//const Lang = imports.lang;
import St from 'gi://St';
import Gio from 'gi://Gio';
import GObject from 'gi://GObject';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import GLib from 'gi://GLib';
import Clutter from 'gi://Clutter';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
const DEBUG = true;

function execCommunicate(argv) {
  let flags = (Gio.SubprocessFlags.STDOUT_PIPE |
    Gio.SubprocessFlags.STDERR_PIPE);

  let proc = Gio.Subprocess.new(argv, flags);
  return new Promise((resolve, reject) => {
    proc.communicate_utf8_async(null, null, (proc, res) => {
      try {
        let [, stdout, stderr] = proc.communicate_utf8_finish(res);
        let status = proc.get_exit_status();

        if (status !== 0) {
          throw new Gio.IOErrorEnum({
            code: Gio.io_error_from_errno(status),
            message: stderr ? stderr.trim() : GLib.strerror(status)
          });
        }

        resolve(stdout.trim());
      } catch (e) {
        reject(e);
      }
    });
  });
}

var budsBattIndicator = GObject.registerClass({
  GTypeName: 'BtGalaxyBudsBattIndicator',
}, class BtGalaxyBudsBattIndicator extends PanelMenu.Button {
  constructor() {
    Log("Init budsBattIndicator");
    super(0.0, "btGalaxyBudsBattIndicator");
    this.batteryStatusArray = ["N/A", "N/A", "N/A"];
    var hbox = new St.BoxLayout({style_class: 'panel-status-menu-box bt-buds-batt-hbox'});
    this.icon = new St.Icon({
      style_class: 'system-status-icon'
    });
    this.icon.gicon = Gio.icon_new_for_string(imports.misc.extensionUtils.getCurrentExtension().path + "/icons/buds.svg");
    hbox.add_child(this.icon);

    this.buttonText = new St.Label({
      text: _('%'),
      y_align: Clutter.ActorAlign.CENTER,
      x_align: Clutter.ActorAlign.START
    });
    hbox.add_child(this.buttonText);
    this.add_child(hbox);
    this.case = new PopupMenu.PopupMenuItem("", {reactive: false});
    this.buds = new PopupMenu.PopupMenuItem("", {reactive: false});
    this.buds.add_child(new St.Icon({
      gicon: Gio.icon_new_for_string(imports.misc.extensionUtils.getCurrentExtension().path + "/icons/left.svg"),
      icon_size: 32,
    }));
    this.leftLabel = new St.Label({text: 'NA%', y_align: Clutter.ActorAlign.CENTER, });
    this.buds.add_child(this.leftLabel);
    this.buds.add_child(new St.Label({text: '   ', y_align: Clutter.ActorAlign.CENTER, }));
    this.rightLabel = new St.Label({text: 'NA%', y_align: Clutter.ActorAlign.CENTER, });
    this.buds.add_child(this.rightLabel);
    this.buds.add_child(new St.Icon({
      gicon: Gio.icon_new_for_string(imports.misc.extensionUtils.getCurrentExtension().path + "/icons/right.svg"),
      icon_size: 32,
    }));
    this.case.add_child(new St.Label({text: '       ', y_align: Clutter.ActorAlign.CENTER, }));
    this.case.add_child(new St.Icon({
      gicon: Gio.icon_new_for_string(imports.misc.extensionUtils.getCurrentExtension().path + "/icons/case.svg"),
      icon_size: 45,
      y_align: Clutter.ActorAlign.CENTER,
    }));
    this.caseLabel = new St.Label({text: 'NA%', y_align: Clutter.ActorAlign.CENTER, x_align: Clutter.ActorAlign.CENTER, });
    this.case.add_child(this.caseLabel);
    this.menu.addMenuItem(this.buds);
    this.menu.addMenuItem(this.case);
    Main.panel.addToStatusArea('BtGalaxyBudsBattIndicator', this, 1);
    this.hide();
    this.enabled = false;
  }

  enable(macAddress) {
    Log("Enable budsBattIndicator");
    if (!this.enabled) {
      this.show();
      this.enabled = true;
      this.syncBattery(macAddress);
      this.event = GLib.timeout_add_seconds(0, 180, () => {
        this.syncBattery(macAddress);
        return true;
      });
    }
  }

  disable() {
    Log("Disable budsBattIndicator");
    if (this.enabled) {
      this.hide();
      GLib.Source.remove(this.event);
      this.enabled = false;
    }
  }

  syncBattery(macAddress) {
    if (this.enabled) {
      Log("Sync budsBattIndicator");
      let argv = [imports.misc.extensionUtils.getCurrentExtension().path + "/buds_battery.py", macAddress + ''];
      execCommunicate(argv).then(result => {
        var [leftBatt, rightBatt, caseBatt] = ["N/A", "N/A", "N/A"];
        [leftBatt, rightBatt, caseBatt] = result.split(',');

        this.leftLabel.set_text(leftBatt + "%");
        this.rightLabel.set_text(rightBatt + "%");
        if (typeof caseBatt !== 'undefined') {
          this.caseLabel.set_text(caseBatt.trimEnd() + "%");
        } else {
          this.case.hide();
        }
        if (parseInt(rightBatt) == 0) {
          this.buttonText.set_text(leftBatt + "%");
        } else if (parseInt(leftBatt) == 0) {
          this.buttonText.set_text(rightBatt + "%");
        } else if (parseInt(rightBatt) <= parseInt(leftBatt)) {
          this.buttonText.set_text(rightBatt + "%");
        } else {
          this.buttonText.set_text(leftBatt + "%");
        }

      }).catch(e => {
        Log(e);
        this.hide();
      });
    }
  }

  reset() {
    Log("Reset budsBattIndicator");
    this.buds.destroy();
    this.case.destroy();
  }
});

var Log = function(msg) {
  if (DEBUG)
    log ("[budsBattery] " + msg);
}

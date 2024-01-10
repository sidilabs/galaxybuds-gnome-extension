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
  constructor(extensionPath) {
    Log("Init budsBattIndicator");
    super(0.0, "btGalaxyBudsBattIndicator");
    this.path = extensionPath
    this.statusArray = [0,0,"N/A", "N/A", "N/A"];
    //Creating the main icon
    var hbox = new St.BoxLayout({style_class: 'panel-status-menu-box bt-buds-batt-hbox'});
    //Icon
    this.icon = new St.Icon({ gicon: Gio.icon_new_for_string(extensionPath + "/icons/buds.svg"), style_class: 'system-status-icon', icon_size: 16 });
    hbox.add_child(this.icon);
    //Label
    this.buttonText = new St.Label({
      text: _(''),
      y_align: Clutter.ActorAlign.CENTER,
      x_align: Clutter.ActorAlign.START
    });
    hbox.add_child(this.buttonText);
    this.add_child(hbox);
    //Creating the buds
    this.buds = new PopupMenu.PopupMenuItem("", {reactive: false});
    //Creating the left bud
    //Label
    this.leftLabel = new St.Label({text: '', y_align: Clutter.ActorAlign.CENTER, });
    this.buds.add_child(this.leftLabel);
    //Icon
    this.lIcon = new St.Icon({
      gicon: Gio.icon_new_for_string(this.path + "/icons/left.svg"),
      icon_size: 32,
    });
    this.buds.add_child(this.lIcon);
    //Transition, might be a better solution
    this.buds.add_child(new St.Label({text: '   ', y_align: Clutter.ActorAlign.CENTER, }));
    //Creating the right bud
    //Icon
    this.rIcon = new St.Icon({
      gicon: Gio.icon_new_for_string(this.path + "/icons/right.svg"),
      icon_size: 32,
    });
    this.buds.add_child(this.rIcon)
    //Label
    this.rightLabel = new St.Label({text: '', y_align: Clutter.ActorAlign.CENTER, });
    this.buds.add_child(this.rightLabel);
    //Creating the case
    this.case = new PopupMenu.PopupMenuItem("", {reactive: false});
    this.case.add_child(new St.Label({text: '       ', y_align: Clutter.ActorAlign.CENTER, }));
    this.case.add_child(new St.Icon({
      gicon: Gio.icon_new_for_string(this.path + "/icons/case.svg"),
      icon_size: 45,
      y_align: Clutter.ActorAlign.CENTER,
    }));
    this.caseLabel = new St.Label({text: '', y_align: Clutter.ActorAlign.CENTER, x_align: Clutter.ActorAlign.CENTER, });
    this.case.add_child(this.caseLabel);
    this.menu.addMenuItem(this.buds);
    this.menu.addMenuItem(this.case);
    Main.panel.addToStatusArea('BtGalaxyBudsBattIndicator', this);
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
      let argv = [this.path + "/buds_battery.py", macAddress, '-g'];
      execCommunicate(argv).then(result => {
        this.statusArray = result.split(',');
        for (let i = 0; i < 5; i++) {
          this.statusArray[i]=parseInt(this.statusArray[i])
        }

        switch(this.statusArray[0]){
          case 0:
          case 3:
          case 4:
            this.leftLabel.set_text("   ");
            this.lIcon.set_gicon(Gio.icon_new_for_string(this.path + "/icons/left-off.svg"));
            break;
          case 1:
          case 2:
            this.leftLabel.set_text(this.statusArray[2] + "%");
            this.lIcon.set_gicon(Gio.icon_new_for_string(this.path + "/icons/left.svg"));
            break;
            //this.leftLabel.set_text("In case");
            //this.lIcon.set_gicon(Gio.icon_new_for_string(this.path + "/icons/left-off.svg"));
            //break;
        }
        switch(this.statusArray[1]){
          case 0:
          case 3:
          case 4:
            //this.rightLabel.set_text("Disconnected");
            this.rightLabel.set_text("   ");
            this.rIcon.set_gicon(Gio.icon_new_for_string(this.path + "/icons/right-off.svg"));
            break;
          case 1:
          case 2:
            this.rightLabel.set_text(this.statusArray[3] + "%");
            this.rIcon.set_gicon(Gio.icon_new_for_string(this.path + "/icons/right.svg"));
            break;
            //this.rightLabel.set_text("In case");
            //this.rIcon.set_gicon(Gio.icon_new_for_string(this.path + "/icons/right-off.svg"));
            //break;
        }

        if (this.statusArray[4] <= 100) {
          this.caseLabel.set_text(this.statusArray[4] + "%");
        } else {
          this.case.hide();
        }

        //Setting the battery for the main icon
        let onStates = [2,3]
        if(this.statusArray[2]>this.statusArray[3] && onStates.includes(this.statusArray[0]){
          this.buttonText.set_text(this.statusArray[2] + "%");
        }else{
          this.buttonText.set_text(this.statusArray[3] + "%");
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

      export {budsBattIndicator, Log};

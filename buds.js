const Lang = imports.lang;
const { St, Gio } = imports.gi;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const GLib = imports.gi.GLib;
const Clutter = imports.gi.Clutter;
const Main = imports.ui.main;
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

var budsBattIndicator = new Lang.Class({

	Name : "BtGalaxyBudsBattIndicator",
	Extends: PanelMenu.Button,

	_init: function () {
		Log("Init budsBattIndicator");
		this.parent(0.0, "btGalaxyBudsBattIndicator");
		this.batteryStatusArray = ["N/A","N/A","N/A"];
		var hbox = new St.BoxLayout({ style_class: 'panel-status-menu-box bt-buds-batt-hbox' });
		this.icon = new St.Icon({
            style_class: 'system-status-icon'
        });
        this.icon.gicon = Gio.icon_new_for_string(imports.misc.extensionUtils.getCurrentExtension().path+"/icons/buds.svg");
		hbox.add_child(this.icon);

		this.buttonText = new St.Label({
				text: _('%'),
				y_align: Clutter.ActorAlign.CENTER,
				x_align: Clutter.ActorAlign.START
		});
		hbox.add_child(this.buttonText);
		this.add_child(hbox);
		this.case = new PopupMenu.PopupMenuItem("",{reactive : false});
		this.buds = new PopupMenu.PopupMenuItem("",{reactive : false});
		this.buds.add_child(new St.Icon({
			gicon : Gio.icon_new_for_string(imports.misc.extensionUtils.getCurrentExtension().path+"/icons/left.svg"),
			icon_size : 32,
		}));
		this.leftLabel  = new St.Label({text : 'NA%', y_align: Clutter.ActorAlign.CENTER,});
		this.buds.add_child(this.leftLabel);
		this.buds.add_child(new St.Label({text : '   ', y_align: Clutter.ActorAlign.CENTER,}));
		this.rightLabel  = new St.Label({text : 'NA%', y_align: Clutter.ActorAlign.CENTER,});
		this.buds.add_child(this.rightLabel);
		this.buds.add_child(new St.Icon({
			gicon : Gio.icon_new_for_string(imports.misc.extensionUtils.getCurrentExtension().path+"/icons/right.svg"),
			icon_size : 32,
		}));
		this.case.add_child(new St.Label({text : '       ', y_align: Clutter.ActorAlign.CENTER,}));
		this.case.add_child(new St.Icon({
			gicon : Gio.icon_new_for_string(imports.misc.extensionUtils.getCurrentExtension().path+"/icons/case.svg"),
			icon_size : 45,
			y_align: Clutter.ActorAlign.CENTER,
		}));
		this.caseLabel  = new St.Label({text : 'NA%', y_align: Clutter.ActorAlign.CENTER, x_align: Clutter.ActorAlign.CENTER,});
		this.case.add_child(this.caseLabel);
		this.menu.addMenuItem(this.buds);
		this.menu.addMenuItem(this.case);
		Main.panel.addToStatusArea('BtGalaxyBudsBattIndicator', this, 1);
		this.hide();
		this.enabled = false;
	},

	enable(macAdress){
		Log("Enable budsBattIndicator");
		if (!this.enabled) {
			this.show();
			this.enabled = true;
			this.syncBattery(macAdress);
			this.event = GLib.timeout_add_seconds(0, 180,  () => {
				this.syncBattery(macAdress);
				return true;
			});
		}
	},

	disable(){
		Log("Disable budsBattIndicator");
		if (this.enabled){
			this.hide();
			GLib.Source.remove(this.event);
			this.enabled = false;
		}
	},

	syncBattery : function(macAdress) {
		if (this.enabled) {
			Log("Sync budsBattIndicator");
			let argv = [imports.misc.extensionUtils.getCurrentExtension().path+"/buds_battery.py", macAdress+''];
			execCommunicate(argv).then(result => {
				var [leftBatt, rightBatt, caseBatt] = ["N/A","N/A","N/A"];
				[leftBatt, rightBatt, caseBatt] = result.split(','); 
				
				this.leftLabel.set_text(leftBatt + "%");
				this.rightLabel.set_text(rightBatt + "%");
				this.caseLabel.set_text(caseBatt.trimEnd() + "%");
				if (parseInt(rightBatt) <= parseInt(leftBatt)){
					this.buttonText.set_text(rightBatt + "%");
				} else {
					this.buttonText.set_text(leftBatt + "%");
				}
				
			}).catch (e => {
				Log(e);
				this.hide();
			});
		}
	},

	reset : function (){
		Log("Reset budsBattIndicator");
		this.buds.destroy();
		this.case.destroy();
	},
	
	
});

var Log = function(msg) {
	if (DEBUG)
		log ("[budsBattery] " + msg);
}

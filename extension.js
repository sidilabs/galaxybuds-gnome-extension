const ExtensionUtils = imports.misc.extensionUtils;
const buds = ExtensionUtils.getCurrentExtension().imports.buds;
const Log = buds.Log;
const GLib = imports.gi.GLib;
const Mainloop = imports.mainloop;
const Main = imports.ui.main;

var btGalxyBudsBattIndicator;
var event;

function enable() {
	Log("Enable");
	btGalxyBudsBattIndicator = new buds.budsBattIndicator();
	Main.panel.addToStatusArea('BtGalaxyBudsBattIndicator', btGalxyBudsBattIndicator, 1);
	event = GLib.timeout_add_seconds(0, 60, function() {
        btGalxyBudsBattIndicator.syncBattery();
        return true;
    });
}

function disable() {
	Log("Disable");
	Mainloop.source_remove(event);
    event = null;
	btGalxyBudsBattIndicator.reset();
	btGalxyBudsBattIndicator.destroy();
	btGalxyBudsBattIndicator = null;

}

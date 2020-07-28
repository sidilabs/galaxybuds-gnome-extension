# DESCRIPTION

Gnome extension to display a battery indicator for Samsung Galaxy Buds\[+\]. Inspired by keyboard-battery (https://extensions.gnome.org/extension/2170/keyboard-battery/)

Uses the python script for Galaxy buds from ThePBone (https://github.com/ThePBone/GalaxyBuds-BatteryLevel)
# INSTALLATION

This extension requires Python 3.x!

You also need Bluez and PyBluez:

For bluez on debian based distributions install with:

```
sudo apt install bluez
```

To install PyBluez use pip:

```
pip install PyBluez
```

For now you need to manually put your buds MAC addres in the buds.js file.

## Install from git
   1. From your terminal, go to "~/.local/share/gnome-shell/extensions"
   2. Clone the source code from git:
	git clone https://github.com/pemmoura/galaxybuds-gnome-extension.git galaxy-buds-battery@pemmoura
   3. Restart gnome-shell: Alt + F2, type 'r' then hit Enter


# TROUBLESHOOTING

Check gnome-shell log:

      journalctl /usr/bin/gnome-shell | grep budsBattery		# this commmand will dump all gnome-shell log ever record
      journalctl -f /usr/bin/gnome-shell | grep budsBattery		# this will only show new log


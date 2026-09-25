# FridgeSnap hardware

A small camera you clip into an existing fridge. It is the capture half of FridgeAI.

It does **not** replace a Samsung Family Hub. It is a puck that:

1. Clips onto a door bottle-shelf (or tapes to the inner door)
2. Notices the door has closed
3. Fires a short LED flash and takes one photo
4. Serves that photo on your home Wi-Fi for FridgeAI to read

## Why this shape

| Idea | Verdict |
|---|---|
| Magnets on the *inside* | Usually fails — inner liner is plastic |
| Screw into the liner | Works, wrecks a rental fridge |
| Camera on the back wall | Only sees the door bins |
| Camera on the **door**, aimed inward at 30–45° | Same trick Smarter FridgeCam uses. Best single-camera view |
| Live video 24/7 | Kills battery, privacy, Wi-Fi. Don’t. |
| Display on the puck | Extra heat + fog. Put the UI on your phone. |

## Build order

1. Read [BOM.md](BOM.md) and order the XIAO ESP32S3 Sense kit
2. Flash [firmware/fridge_snap/fridge_snap.ino](firmware/fridge_snap/fridge_snap.ino)
3. Confirm `http://fridgesnap.local/` shows a picture
4. Print [enclosure/clip.scad](enclosure/clip.scad) in PETG, or tape the board to a door bin for a weekend test
5. Follow [INSTALL.md](INSTALL.md)

## What the firmware does *not* do

Food recognition runs in the FridgeAI phone app, not on the camera. The ESP32 is a shutter. After the door shuts it keeps one JPEG at `http://fridgesnap.local/latest.jpg`. On the same Wi-Fi, Scan → **Last door photo** pulls that picture into the confirm list. The board does not upload it.

On-device TinyML (Edge Impulse, as in DecayDock) is a later upgrade if you want names without sending photos off the device.

## Safety

- Thin USB cable only through the **hinge** fold, never across the main gasket face
- No mains voltage in the cabinet
- Charge lithium packs **outside** the fridge
- If the door no longer seals (frost on the freezer wall), the cable is too thick — switch to a flat ribbon or the clip-off battery

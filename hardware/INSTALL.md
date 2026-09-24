# FridgeSnap — 10 minute install

Goal: a camera that lives in the fridge, takes one photo each time you close the door, and sends it to FridgeAI. No screws. No holes in the cabinet.

```
        steel cabinet
      ┌──────────────────┐
      │  [magnet]        │  ← reed counterpart, outside or in the gasket gap
      │ ┌──────────────┐ │
door  │ │  CLIP + CAM  │ │  ← sits on a door bin, lens aimed at the shelves
      │ │   LED ring   │ │
      │ └──────┬───────┘ │
      └────────┼─────────┘
               │ thin USB-C along the hinge fold
               ▼
           5 V plug
```

## Where to put it

Copy the commercial FridgeCam rule:

> Middle of the **door**, toward the handle / opening side. Lens looks *into* the cabinet when the door is about 30–45° open.

That is the last useful frame before the door slams and the interior light dies. A camera glued to the back wall only ever sees the door bins.

Hong Kong apartment fridges (single door or fridge-over-freezer):

| Fridge type | Mount |
|---|---|
| Single door, bottle shelf on the door | Clip onto that shelf, lens inward and slightly down |
| French door | One puck per door, mid-height |
| Door with no bin at mid-height | 3M tape on the inner door skin, 8–12 cm from the handle side |

Before you stick anything: open the door slowly and watch that the puck will not smash into a shelf when the door shuts.

## Install steps

1. **Power first, mount second.** Flash firmware and join Wi-Fi on the table. Confirm you can open `http://fridgesnap.local/` and see a test photo.
2. **Clean** the plastic with alcohol. Let it dry.
3. **Clip** onto the door bin so the lens clears the bin lip. If the clip is loose, add a wrap of rubber band or switch to tape.
4. **Aim** with the live preview: door at ~40°. You want milk + two shelves, not a close-up of one yogurt.
5. **Reed switch.** Tape the switch to the puck (or into the clip). Stick the magnet on the fridge *body* so the switch closes when the door is shut.
6. **Cable.** Run USB-C down the hinge side. The gasket will swallow a thin silicone cable. Do not pinch the thick moulded plug in the seal — only the flat cable.
7. **Close the door 10 times.** Confirm a new photo appears after each close, and that the compressor / light still behave (a fat cable can break the door seal and frost the freezer).

## Why not magnets on the camera?

The pretty magnetic puck idea only works on steel. The *inside* of almost every fridge is plastic. Magnets are for:

- holding a small status brick on the **outside** of the door, or
- the reed-switch partner on the steel wrapper

Shelf / bin **clips** and **tape** are what actually stay inside.

## Condensation

A sealed box in 4 °C, 70–90 % RH sweats onto the glass.

- Vent the case (two small slots, not a porthole in front of the lens)
- Leave a 2 mm air gap in front of the lens
- Wipe the lens weekly
- Warm-white LEDs for 200 ms at capture help; they also dry the glass a little

## Cold + batteries

ESP32 silicon is fine at fridge temperature. Lithium cells are the weak point.

- Discharging a LiPo at 4 °C is acceptable for a prototype
- **Charging** a LiPo at 4 °C is not — take the puck out to charge
- USB-C from outside is the adult solution

## Privacy

The camera sees whoever opens the fridge. Firmware should:

- shoot only on **door close**, not a live stream
- keep the last photo only
- refuse to upload if you later add person-detection

Point the lens at food, not at the kitchen.

## When one camera is not enough

Deep shelves hide food. Options, in order of sanity:

1. One well-aimed door camera (this build)
2. Ask the user to scan a grocery bag with the phone app
3. A second clip on a middle shelf, only if you already live with a cable

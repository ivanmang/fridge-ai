# FridgeSnap — bill of materials

Buy list for one easy-install camera puck. Prices are typical 2026 maker-shop ballparks in HKD.

## Core (buy these first)

| Qty | Part | Why | Approx. |
|---|---|---|---|
| 1 | **Seeed XIAO ESP32S3 Sense** | Tiny board, USB-C, camera + mic, better than classic ESP32-CAM | 150–220 |
|  | *or* AI-Thinker ESP32-CAM (OV2640) + USB programmer | Cheaper, more tutorials | 50–80 + 25 |
| 1 | Reed switch (glass or moulded) | Detects door close | 5 |
| 1 | Neodymium disc Ø8–10 mm | Sticks to the *metal door frame* opposite the reed | 5 |
| 2 | Warm-white LED 5 mm or a small LED ring | Fridge lamp is off when the door is almost shut | 10 |
| 1 | 220 Ω resistor (for LED) | | 1 |
| 1 | 10 kΩ resistor (reed pull-up) | | 1 |
| 1 | USB-C cable, thin / silicone, ~1.5 m | Power along the hinge gap | 20 |
| 1 | 5 V / 2 A USB plug | HK 220 V | 40 |

**Recommended brain: XIAO ESP32S3 Sense.** One board, USB-C, no FTDI dance.

## Power (pick one)

| Option | Use when | Parts |
|---|---|---|
| **A. USB along the hinge (best)** | You can hide a thin cable | cable + wall wart only |
| **B. Clip-off charge** | You refuse any cable | 1000–2000 mAh LiPo + TP4056 + switch. Charge *outside* the fridge. Do not charge a LiPo at 4 °C. |
| **C. Power bank on top of fridge** | Rental, zero drilling | short cable through hinge, bank sits on the cabinet |

Do not put a cheap 18650 pack loose in the wet door bin.

## Mount (no tools)

| Qty | Part | Why |
|---|---|---|
| 1 | 3D-printed door-bin clip (see `enclosure/clip.scad`) | Primary install |
| 1 | 3M VHB / 3M Command indoor strip | Fallback if clip does not fit |
| 1 | Alcohol wipe | Clean plastic before tape |
| — | Optional gooseneck / ball joint (action-cam 1/4") | Aim the lens |

The **inner liner is almost always plastic**. Magnets will not hold the camera inside. Magnets are only for the reed-switch counterpart on the steel *outer* cabinet.

## Nice extras

| Part | Why |
|---|---|
| DHT22 or SHT30 | Fridge temperature log |
| microSD (on ESP32-CAM) | Keep last 50 photos if Wi-Fi drops |
| Thin PET sheet / anti-fog wipe | Lens haze |
| Silica gel sachet | Inside a *vented* case |

## Tools

- Soldering iron, heat-shrink
- 3D printer *or* a maker space (PETG, not PLA — PLA creeps in a humid fridge)
- If no printer: a small action-cam clamp + double-sided tape works for a weekend test

## Do not buy

- A sealed “waterproof” box with no vents — the lens will fog
- A display on the puck — bulky, extra heat, extra condensation
- Mains wiring inside the fridge

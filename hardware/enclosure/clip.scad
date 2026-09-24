// FridgeSnap door-bin clip
// Print in PETG. Measure your bin lip, then edit BIN_THICKNESS.
// Clip opening is slightly undersized so it grips.

BIN_THICKNESS = 3.2;   // mm — measure the door-shelf front lip
BIN_DEPTH     = 18;    // how far the clip hooks inward
BOARD_L       = 32;    // XIAO ESP32S3 Sense-ish footprint
BOARD_W       = 22;
BOARD_H       = 10;
WALL          = 2.0;
LENS_D        = 10;
VENT          = 2.2;

$fn = 48;

module clip_arm() {
  difference() {
    cube([BOARD_W + 2*WALL, BIN_DEPTH + WALL + 8, 12]);
    translate([WALL, WALL, WALL])
      cube([BOARD_W, BIN_DEPTH + 10, 12]);
    // squeeze slot
    translate([-1, BIN_DEPTH, 4])
      cube([BOARD_W + 2*WALL + 2, BIN_THICKNESS * 0.85, 8]);
  }
}

module camera_pocket() {
  difference() {
    cube([BOARD_L + 2*WALL, BOARD_W + 2*WALL, BOARD_H + WALL]);
    translate([WALL, WALL, WALL])
      cube([BOARD_L, BOARD_W, BOARD_H + 1]);
    // lens
    translate([WALL + 8, (BOARD_W + 2*WALL)/2, -1])
      cylinder(h = WALL + 2, d = LENS_D);
    // vents (sides) — do not seal this box
    for (y = [6, 12, 18])
      translate([-1, y, 4]) cube([WALL + 2, VENT, VENT]);
    for (y = [6, 12, 18])
      translate([BOARD_L + WALL - 1, y, 4]) cube([WALL + 2, VENT, VENT]);
  }
}

union() {
  camera_pocket();
  translate([0, BOARD_W + WALL, 0]) clip_arm();
}

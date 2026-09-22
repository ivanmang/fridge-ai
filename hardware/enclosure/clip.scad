// FridgeSnap door-bin clip — print in PETG
BIN_THICKNESS = 3.2;
BIN_DEPTH     = 18;
BOARD_L       = 32;
BOARD_W       = 22;
BOARD_H       = 10;
WALL          = 2.0;
LENS_D        = 10;
VENT          = 2.2;
$fn = 48;

module clip_arm() {
  difference() {
    cube([BOARD_W + 2*WALL, BIN_DEPTH + WALL + 8, 12]);
    translate([WALL, WALL, WALL]) cube([BOARD_W, BIN_DEPTH + 10, 12]);
    translate([-1, BIN_DEPTH, 4]) cube([BOARD_W + 2*WALL + 2, BIN_THICKNESS * 0.85, 8]);
  }
}
module camera_pocket() {
  difference() {
    cube([BOARD_L + 2*WALL, BOARD_W + 2*WALL, BOARD_H + WALL]);
    translate([WALL, WALL, WALL]) cube([BOARD_L, BOARD_W, BOARD_H + 1]);
    translate([WALL + 8, (BOARD_W + 2*WALL)/2, -1]) cylinder(h = WALL + 2, d = LENS_D);
    for (y = [6, 12, 18]) translate([-1, y, 4]) cube([WALL + 2, VENT, VENT]);
    for (y = [6, 12, 18]) translate([BOARD_L + WALL - 1, y, 4]) cube([WALL + 2, VENT, VENT]);
  }
}
union() {
  camera_pocket();
  translate([0, BOARD_W + WALL, 0]) clip_arm();
}

/*
  FridgeSnap — door-close camera for FridgeAI
  Board: Seeed XIAO ESP32S3 Sense (ESP32-CAM pinout is the #else block)

  What it actually does
  - Stays awake and serves Wi-Fi
  - Reed switch LOW = door closed
  - After the door has been closed for CLOSE_SETTLE_MS, one JPEG with a short flash
  - Keeps only that JPEG in memory and serves http://fridgesnap.local/latest.jpg
  - The phone pulls that photo. This board does not upload it.

  It does not deep-sleep and it does not write to an SD card.
  Arduino core "esp32" by Espressif. On XIAO: enable PSRAM and USB CDC.
*/

#include <WiFi.h>
#include <WebServer.h>
#include <ESPmDNS.h>
#include <esp_camera.h>

// ---------- edit me ----------
const char* WIFI_SSID = "YOUR_WIFI";
const char* WIFI_PASS = "YOUR_PASSWORD";
const int   REED_PIN   = 2;    // D1 on XIAO; use GPIO13 on ESP32-CAM
const int   LED_PIN    = 21;   // onboard or external flash LED
const uint32_t CLOSE_SETTLE_MS = 1200;
const uint32_t MIN_GAP_MS      = 8000;  // ignore door bounce
// -----------------------------

WebServer server(80);
camera_fb_t* lastFb = nullptr;
uint32_t lastShot = 0;
bool armed = true;

#if defined(BOARD_HAS_PSRAM) || defined(CAMERA_MODEL_XIAO_ESP32S3)
  // XIAO ESP32S3 Sense pinout
  #define PWDN_GPIO_NUM  -1
  #define RESET_GPIO_NUM -1
  #define XCLK_GPIO_NUM  10
  #define SIOD_GPIO_NUM  40
  #define SIOC_GPIO_NUM  39
  #define Y9_GPIO_NUM    48
  #define Y8_GPIO_NUM    11
  #define Y7_GPIO_NUM    12
  #define Y6_GPIO_NUM    14
  #define Y5_GPIO_NUM    16
  #define Y4_GPIO_NUM    18
  #define Y3_GPIO_NUM    17
  #define Y2_GPIO_NUM    15
  #define VSYNC_GPIO_NUM 38
  #define HREF_GPIO_NUM  47
  #define PCLK_GPIO_NUM  13
#else
  // AI-Thinker ESP32-CAM
  #define PWDN_GPIO_NUM  32
  #define RESET_GPIO_NUM -1
  #define XCLK_GPIO_NUM  0
  #define SIOD_GPIO_NUM  26
  #define SIOC_GPIO_NUM  27
  #define Y9_GPIO_NUM    35
  #define Y8_GPIO_NUM    34
  #define Y7_GPIO_NUM    39
  #define Y6_GPIO_NUM    36
  #define Y5_GPIO_NUM    21
  #define Y4_GPIO_NUM    19
  #define Y3_GPIO_NUM    18
  #define Y2_GPIO_NUM    5
  #define VSYNC_GPIO_NUM 25
  #define HREF_GPIO_NUM  23
  #define PCLK_GPIO_NUM  22
#endif

bool initCam() {
  camera_config_t c;
  c.ledc_channel = LEDC_CHANNEL_0;
  c.ledc_timer   = LEDC_TIMER_0;
  c.pin_d0 = Y2_GPIO_NUM; c.pin_d1 = Y3_GPIO_NUM;
  c.pin_d2 = Y4_GPIO_NUM; c.pin_d3 = Y5_GPIO_NUM;
  c.pin_d4 = Y6_GPIO_NUM; c.pin_d5 = Y7_GPIO_NUM;
  c.pin_d6 = Y8_GPIO_NUM; c.pin_d7 = Y9_GPIO_NUM;
  c.pin_xclk = XCLK_GPIO_NUM;
  c.pin_pclk = PCLK_GPIO_NUM;
  c.pin_vsync = VSYNC_GPIO_NUM;
  c.pin_href = HREF_GPIO_NUM;
  c.pin_sccb_sda = SIOD_GPIO_NUM;
  c.pin_sccb_scl = SIOC_GPIO_NUM;
  c.pin_pwdn = PWDN_GPIO_NUM;
  c.pin_reset = RESET_GPIO_NUM;
  c.xclk_freq_hz = 20000000;
  c.frame_size = FRAMESIZE_SVGA;
  c.pixel_format = PIXFORMAT_JPEG;
  c.grab_mode = CAMERA_GRAB_LATEST;
  c.fb_location = CAMERA_FB_IN_PSRAM;
  c.jpeg_quality = 12;
  c.fb_count = 2;
  return esp_camera_init(&c) == ESP_OK;
}

void flash(bool on) {
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, on ? HIGH : LOW);
}

bool snap() {
  flash(true);
  delay(80);
  camera_fb_t* fb = esp_camera_fb_get();
  flash(false);
  if (!fb) return false;
  if (lastFb) esp_camera_fb_return(lastFb);
  lastFb = fb;
  lastShot = millis();
  return true;
}

void handleRoot() {
  server.send(200, "text/html",
    "<!doctype html><meta name=viewport content='width=device-width,initial-scale=1'>"
    "<body style='font-family:sans-serif;background:#071018;color:#e8f4f2'>"
    "<h1>FridgeSnap</h1>"
    "<p>Last photo (door-close triggered).</p>"
    "<p><a href='/latest.jpg'>latest.jpg</a> · <a href='/snap'>force snap</a></p>"
    "<img src='/latest.jpg' style='max-width:100%;border-radius:12px'>"
    "</body>");
}

void cors() {
  String origin = server.header("Origin");
  server.sendHeader("Access-Control-Allow-Origin", origin.length() ? origin : "*");
  server.sendHeader("Access-Control-Allow-Private-Network", "true");
  server.sendHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "*");
  server.sendHeader("Vary", "Origin");
  server.sendHeader("Cache-Control", "no-store");
}

void handleOptions() {
  cors();
  server.send(204);
}

void handleJpg() {
  if (!lastFb) {
    cors();
    server.send(404, "text/plain", "no photo yet");
    return;
  }
  cors();
  server.setContentLength(lastFb->len);
  server.send(200, "image/jpeg", "");
  server.client().write(lastFb->buf, lastFb->len);
}

void handleSnap() {
  bool ok = snap();
  server.sendHeader("Location", "/");
  server.send(ok ? 302 : 500, "text/plain", ok ? "ok" : "fail");
}

void setup() {
  Serial.begin(115200);
  pinMode(REED_PIN, INPUT_PULLUP);
  flash(false);
  if (!initCam()) {
    Serial.println("camera init failed");
    delay(3000);
    ESP.restart();
  }

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  for (int i = 0; i < 40 && WiFi.status() != WL_CONNECTED; i++) delay(250);
  MDNS.begin("fridgesnap");

  const char* headerKeys[] = {"Origin", "Access-Control-Request-Private-Network"};
  server.collectHeaders(headerKeys, 2);
  server.on("/", handleRoot);
  server.on("/latest.jpg", HTTP_GET, handleJpg);
  server.on("/latest.jpg", HTTP_OPTIONS, handleOptions);
  server.on("/snap", handleSnap);
  server.begin();

  snap();  // one boot photo so you can aim
}

void loop() {
  server.handleClient();

  const bool closed = digitalRead(REED_PIN) == LOW;
  static uint32_t closedSince = 0;
  static bool wasClosed = false;

  if (closed) {
    if (!wasClosed) closedSince = millis();
    if (armed && millis() - closedSince > CLOSE_SETTLE_MS && millis() - lastShot > MIN_GAP_MS) {
      snap();
      armed = false;
    }
  } else {
    armed = true;  // re-arm when the door opens
  }
  wasClosed = closed;
}

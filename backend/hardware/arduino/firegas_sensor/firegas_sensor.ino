/*
 * ESP32 Fire & Gas Sensor Node
 *
 * Connections:
 *   MQ2 A0  -> GPIO35 (Analog, via divider)
 *   MQ2 D0  -> GPIO34 (Digital)
 *   Flame1 DO -> GPIO26
 *   Flame2 DO -> GPIO27
 *   All GNDs together
 *   MQ2 VCC -> VIN (5V)
 *   Flame VCCs -> 3.3V
 *
 * Functionality:
 *   - Connects to WiFi
 *   - Reads MQ2 (gas) and flame sensors
 *   - Sends JSON to backend: { mq2_value, fire_status }
 *   - fire_status: "safe" or "fire"
 */

#include <WiFi.h>
#include <HTTPClient.h>

// ===================== CONFIGURATION ========================
// WiFi Credentials
const char* ssid = "One Plus +";
const char* password = "Megh2006";

// Backend API Endpoint
const char* serverUrl = "http://172.17.191.229:8000/api/hardware/sensor-data";

#define MQ2_A0_PIN   35
#define MQ2_D0_PIN   34
#define FLAME1_PIN   26
#define FLAME2_PIN   27
#define SEND_INTERVAL 10000  // ms

void setup() {
  Serial.begin(115200);
  delay(1000);
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi connected!");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\nWiFi FAILED");
  }
}

void loop() {
  int mq2_analog = analogRead(MQ2_A0_PIN);
  int mq2_digital = digitalRead(MQ2_D0_PIN);
  int flame1 = digitalRead(FLAME1_PIN);
  int flame2 = digitalRead(FLAME2_PIN);

  // Fire logic: only if BOTH flame sensors detect fire (LOW), status is "fire"
  String fire_status = (flame1 == LOW || e2 == LOW) ? "fire" : "safe";

  Serial.printf("MQ2: %d, MQ2_D0: %d, Flame1: %d, Flame2: %d, Status: %s\n", mq2_analog, mq2_digital, flame1, flame2, fire_status.c_str());

  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");
    String payload = "{";
    payload += "\"mq2_value\":" + String(mq2_analog) + ",";
    payload += "\"fire_status\":\"" + fire_status + "\"";
    payload += "}";
    int httpCode = http.POST(payload);
    if (httpCode > 0) {
      Serial.printf("POST OK: %d\n", httpCode);
    } else {
      Serial.printf("POST FAIL: %s\n", http.errorToString(httpCode).c_str());
    }
    http.end();
  } else {
    Serial.println("WiFi disconnected. Skipping upload.");
  }
  delay(SEND_INTERVAL);
}
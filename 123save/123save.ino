#include <SPI.h>
#include <LoRa.h>

#define SS 5
#define RST 14

void setup() {
  Serial.begin(115200);
  delay(2000);

  SPI.begin(18, 19, 23, SS);
  LoRa.setPins(SS, RST, -1);  // no DIO

  if (!LoRa.begin(433E6)) {
    Serial.println("CHIP NOT DETECTED");
  } else {
    Serial.println("CHIP DETECTED");
  }
}

void loop() {}
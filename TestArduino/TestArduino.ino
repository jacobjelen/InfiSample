void setup() {
  Serial.begin(115200); // Starts the serial communication
}

// lines are in the form:
// X: some numbers in hexadecimal format
// where X defines the type of data, which specifies the number and type
// of following values

void loop() {

  //SLIDER
  // S: xx
  // xx is single byte hex value of slider position
  Serial.println("S: 0x"+h2());

  // POWER
   // P: 0x00 is OFF P: 0x01 is ON
  Serial.println("P: 0x"+String(random(0,2)) );

  // KEYPAD
  // K: xxxx
  // xxxx is 16 bit hex bitmask representing buttons on keypad, where
  // LSB is 0 key, bits 1..9 represent numbers 1..9 and bit 10 is dot.
  Serial.println("K: 0xfff0");

  // TOUCHPAD
  // T: xxxx xxxx xxxx
  // the three values are 16 bit hexadecimal values representing touchpad
  // x, y and z positions.
  Serial.println("T: 0x"+h4()+" 0x"+h4()+" 0x"+h4()+"");

  //MULTITOUCH
  // Cy: xx xx xx xx xx xx
  // a column of values from the multitouch area.
  // y is the column, from 1..11. the xx values are unsigned bytes,
  // each one representing a row.
  Serial.println("C"+String(random(1,12))+": 0xff 0x00 0xe5 0x36 0x1B 0x5B");
  Serial.println("C"+String(random(1,12))+": 0x36 0x1B 0x5B 0xff 0x00 0xe5");
  delay(100);

}

String h2(){
  return String(random(0,127), HEX);
}

String h4(){
  return String(random(0,4000), HEX);
}

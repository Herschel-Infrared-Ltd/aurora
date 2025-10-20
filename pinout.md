# ESP32 C6 Pinouts

## By Component

### Heating Elements

| Component       | GPIO | Notes                      |
| --------------- | ---- | -------------------------- |
| Heating relay 1 | 18   | All boards                 |
| Heating relay 2 | 19   | VP and dual-element boards |
| Heating relay 3 | 20   | 3-relay boards only        |

### Lighting Circuits

| Component        | GPIO | Notes          |
| ---------------- | ---- | -------------- |
| Lighting relay 1 | 4    | WL boards only |
| Lighting relay 2 | 5    | WL boards only |

### Temperature Sensors - LM35 (Analog)

| Component   | GPIO | Notes          |
| ----------- | ---- | -------------- |
| Remote LM35 | 0    | VP boards only |
| Main LM35   | 1    | VP boards only |

### I2C Bus

| Component | GPIO | Notes      |
| --------- | ---- | ---------- |
| I2C SDA   | 21   | Shared bus |
| I2C SCL   | 22   | Shared bus |

### Temperature Sensor - MLX90614 (I2C)

| Component     | GPIO  | Notes                |
| ------------- | ----- | -------------------- |
| MLX90614      | 21/22 | I2C Address 0x5A     |
| GND_SW MOSFET | 7     | ~~DEPRECATED~~       |
| GND_SW MOSFET | 23    | ~~DEPRECATED~~ (alt) |

**Notes:**

- IR temperature sensor on shared I2C bus
- GND_SW MOSFET was used to power cycle sensor when errors occurred (GPIO 7 or 23)
- Hardware power cycling now handled in software at I2C driver/library level
- MOSFET power cycling deprecated in newer designs

### Environmental Sensor - BME688 (I2C)

| Component | GPIO  | Notes            |
| --------- | ----- | ---------------- |
| BME688    | 21/22 | I2C Address 0x76 |

**Notes:**

- Temperature, humidity, pressure, gas sensor on shared I2C bus

### Environmental Sensor - SHT41 (I2C)

| Component | GPIO  | Notes            |
| --------- | ----- | ---------------- |
| SHT41     | 21/22 | I2C Address 0x44 |

**Notes:**

- Temperature and humidity sensor on shared I2C bus
- Replaced BME688 on some models due to component cost concerns

### Presence Sensor - LD2410C

| Component     | GPIO | Notes                  |
| ------------- | ---- | ---------------------- |
| UART TX       | 2    | Current - UART1        |
| UART RX       | 3    | Current - UART1        |
| UART TX       | 16   | ~~DEPRECATED~~ - UART0 |
| UART RX       | 17   | ~~DEPRECATED~~ - UART0 |
| Binary Output | 23   | All boards             |

**Notes:**

- Older boards used GPIO 16/17 (UART0) for LD2410C, which conflicts with debug UART
- Newer boards moved to GPIO 2/3 (UART1) to avoid conflicts
- GPIO 16/17 configuration is deprecated and should not be used in new designs

### Status LEDs - WS2812B

| Component        | GPIO | Notes                    |
| ---------------- | ---- | ------------------------ |
| Main board LED   | 11   | Pairing status           |
| Sensor board LED | 10   | VP and 1R boards         |
| DevKit LED       | 2    | DOIT DevKit built-in LED |

**Notes:**

- Main board and sensor board LEDs are addressable WS2812B RGB LEDs
- DOIT DevKit has a non-addressable blue status LED on GPIO 2 that can be used for simple status indication

### User Interface

| Component      | GPIO | Notes          |
| -------------- | ---- | -------------- |
| Pairing button | 6    | VP boards only |

### System/Debug

| Component     | GPIO | Notes                              |
| ------------- | ---- | ---------------------------------- |
| USB Serial D- | 12   |                                    |
| USB Serial D+ | 13   |                                    |
| Debug UART TX | 16   | UART0 - conflicts with old LD2410C |
| Debug UART RX | 17   | UART0 - conflicts with old LD2410C |
| Strapping pin | 8    | Boot configuration                 |
| Strapping pin | 9    | Boot configuration                 |
| Strapping pin | 15   | Boot configuration                 |

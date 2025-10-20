# Board Configuration Generator

Interactive CLI tool to generate NVS board configuration JSON files for ESP32 firmware.

## Overview

This tool helps you create board configuration files by:

1. Selecting a product line (Halo, Comfort, Horizon, Halo Mini)
2. Choosing a specific variant and SKU
3. Selecting a compatible board configuration
4. Confirming which sensors are actually connected
5. Generating a JSON file suitable for preloading into NVS

## Installation

```bash
bun install
```

## Usage

```bash
bun run index.ts
```

The CLI will guide you through:

- **Product line selection**: Choose the product family (Halo, Comfort, Horizon, Halo Mini)
- **Variant selection**: Select the specific variant and wattage
- **Board selection**: Pick the board revision/version for that SKU
- **Sensor configuration method**: Choose between:
  - **Sensor board SKU**: Select a predefined sensor board configuration
  - **Manual configuration**: Configure each sensor individually
- **Sensor configuration** (if manual):
  - MLX90614 IR temperature sensor
  - Environmental sensor (BME688, SHT41, or None)
  - LD2410 presence sensor (UART+Binary, UART only, Binary only, or None)
  - LM35 analog sensors (if board supports them)
- **Output**: View and save the generated JSON configuration as `config.json`

_Note: Serial number is derived from ESP32 MAC address at runtime._

## File Structure

```
cli/
├── index.ts                   # Main CLI application
├── sku-mappings.json         # Maps SKUs to compatible boards
├── boards/                   # Board configuration templates
│   ├── IS-3R-V1-2025-08-13.json
│   ├── IS-3R-V2-2025-09-26.json
│   ├── IS-3R-WL-V3-2025-08-29.json
│   └── IS-3R-WL-V5-2025-09-26.json
├── sensor-boards/            # Predefined sensor board configurations
│   └── vsb-v3-0725.json
└── config.json              # Generated configuration file
```

## Adding New SKUs

Edit `sku-mappings.json` to add new products:

```json
{
  "products": [
    {
      "productName": "Product Name",
      "sku": "YOUR-SKU-ID",
      "variant": "Variant description",
      "compatibleBoards": ["IS-BOARD-VERSION"]
    }
  ]
}
```

## Adding New Board Configurations

Create a new JSON file in `boards/` following this structure:

```json
{
  "boardType": "IS-XXX",
  "boardVersion": "VX-YYYY-MM-DD",
  "aliases": ["BOARD-ALIAS-1", "BOARD-ALIAS-2"],
  "capabilities": {
    "has_mlx90614": true,
    "has_bme688": false,
    "has_sht41": true,
    "num_lm35_sensors": 0,
    "has_ld2410_uart": true,
    "has_ld2410_binary": true,
    "num_heating_circuits": 3,
    "num_lighting_circuits": 0,
    "has_pairing_led": true,
    "has_sensor_led": false,
    "has_pairing_button": true,
    "has_gnd_sw": true
  },
  "pinout": {
    "pairing_button_gpio": 6,
    "gnd_sw_gpio": 7,
    "heater_relay_1": 18,
    "heater_relay_2": 19,
    "heater_relay_3": 20,
    "lights_relay_1": null,
    "lights_relay_2": null,
    "i2c_sda": 21,
    "i2c_scl": 22,
    "i2c_port": 0,
    "mlx90614_addr": 90,
    "bme688_addr": 0,
    "sht41_addr": 68,
    "ld2410_tx": 2,
    "ld2410_rx": 3,
    "ld2410_out": 23,
    "ld2410_uart_port": 1,
    "lm35_remote": null,
    "lm35_main": null,
    "pairing_led": 11,
    "sensor_led": 10
  }
}
```

**Notes**:

- Use `null` for unused GPIO pins (equivalent to `GPIO_NUM_NC` in C)
- `aliases` is optional - use it when a board has alternative names/SKUs (e.g., SIMB-V1.0-092025 is an alias for IS-1R-V2-2025-09-26)
- Sensor boards can reference boards by their main name or any alias in their `compatibleBoards` array

## Adding New Sensor Boards

Create a new JSON file in `sensor-boards/` following this structure:

```json
{
  "sku": "vsb-v3-0725",
  "name": "Sensor Board V3 (July 2025)",
  "compatibleBoards": ["IS-VP-CB-V8-2025-08-06", "IS-1R-V2-2025-09-26"],
  "capabilities": {
    "has_mlx90614": true,
    "has_bme688": false,
    "has_sht41": false,
    "has_ld2410_uart": true,
    "has_ld2410_binary": true,
    "has_sensor_led": true,
    "has_gnd_sw_mosfet": true,
    "gnd_sw_gpio": 7
  }
}
```

**Important**: The `compatibleBoards` array lists which main boards this sensor board works with. The CLI will automatically filter and only show sensor boards that are compatible with the selected main board.

This allows users to quickly select a sensor board SKU instead of manually configuring each sensor.

## Output Format

Generated configuration includes:

- **SKU**: Product identifier
- **Board Type & Version**: Hardware platform identifier
- **Capabilities**: Which features/sensors are enabled
- **Pinout**: Complete GPIO mapping

Example output:

```json
{
  "sku": "IR-HALO-7800-L",
  "boardType": "IS-3R-WL",
  "boardVersion": "V5-2025-09-26",
  "capabilities": {
    "has_mlx90614": true,
    "has_bme688": false,
    "has_sht41": true,
    "has_ld2410_uart": true,
    "has_ld2410_binary": true,
    "num_heating_circuits": 3,
    "num_lighting_circuits": 2,
    ...
  },
  "pinout": {
    "heater_relay_1": 18,
    "lights_relay_1": 4,
    ...
  }
}
```

## Development

This project uses [Bun](https://bun.sh) as the JavaScript runtime.

- Run: `bun run index.ts`
- Test: `bun test`
- Format: Check `CLAUDE.md` for Bun-specific patterns

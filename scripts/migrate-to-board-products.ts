#!/usr/bin/env tsx

/**
 * Migration Script: SKU Mappings to Board Products
 *
 * This script demonstrates how to migrate from the old SKU mappings structure
 * to the new board-based product structure that aligns with ESPHome patterns.
 *
 * The new structure defines products directly on boards, making it more flexible
 * and allowing a single board to represent multiple products with different
 * relay configurations.
 */

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

interface OldProduct {
  productName: string;
  sku: string;
  variant: string;
  compatibleBoards: string[];
  heatingWattage: {
    circuit1: number;
    circuit2: number;
    circuit3: number;
  };
}

interface OldSkuMappings {
  products: OldProduct[];
}

interface NewHeatingRelay {
  id: string;
  pin: number;
  wattage: number;
}

interface NewLightingRelay {
  id: string;
  pin: number;
  type: string;
}

interface NewI2CSensor {
  id: string;
  type: string;
  address: number;
}

interface NewUARTSensor {
  id: string;
  type: string;
  uart_port: number;
  tx_pin: number;
  rx_pin: number;
  out_pin?: number;
}

interface NewAnalogSensor {
  id: string;
  type: string;
  pin: number;
}

type NewSensor = NewI2CSensor | NewUARTSensor | NewAnalogSensor;

interface NewLed {
  id: string;
  pin: number;
  type: string;
}

interface NewButton {
  id: string;
  pin: number;
  type: string;
}

interface NewProduct {
  sku: string;
  variant: string;
  name: string;
  heatingRelays: NewHeatingRelay[];
  lightingRelays: NewLightingRelay[];
  sensors?: NewSensor[];
  leds?: NewLed[];
  buttons?: NewButton[];
}

// Board pinout mappings (from existing board configs)
const BOARD_PINOUTS = {
  "IS-3R-WL-V5": {
    heater_relay_1: 18,
    heater_relay_2: 19,
    heater_relay_3: 20,
    lights_relay_1: 4,
    lights_relay_2: 5,
  },
  "IS-3R-WL-V3": {
    heater_relay_1: 18,
    heater_relay_2: 19,
    heater_relay_3: 20,
    lights_relay_1: 4,
    lights_relay_2: 5,
  },
  "IS-3R-V2": {
    heater_relay_1: 18,
    heater_relay_2: 19,
    heater_relay_3: 20,
    lights_relay_1: null,
    lights_relay_2: null,
  },
  "IS-3R-V1": {
    heater_relay_1: 18,
    heater_relay_2: 19,
    heater_relay_3: 20,
    lights_relay_1: null,
    lights_relay_2: null,
  },
  "IS-1R-V2": {
    heater_relay_1: 18,
    heater_relay_2: null,
    heater_relay_3: null,
    lights_relay_1: null,
    lights_relay_2: null,
  },
};

function migrateProductToBoardProducts(): void {
  console.log("🔄 Starting migration from SKU mappings to board products...\n");

  // Read the existing SKU mappings
  const skuMappingsPath = join(__dirname, "..", "sku-mappings.json");
  const skuMappings: OldSkuMappings = JSON.parse(
    readFileSync(skuMappingsPath, "utf-8")
  );

  // Group products by board
  const boardProducts: Record<string, NewProduct[]> = {};

  for (const product of skuMappings.products) {
    for (const boardType of product.compatibleBoards) {
      if (!boardProducts[boardType]) {
        boardProducts[boardType] = [];
      }

      // Determine if this product has lighting (based on SKU suffix)
      const hasLighting = product.sku.includes("-L");

      // Create heating relays
      const heatingRelays: NewHeatingRelay[] = [];
      const pinout = BOARD_PINOUTS[boardType as keyof typeof BOARD_PINOUTS];

      if (product.heatingWattage.circuit1 > 0 && pinout.heater_relay_1) {
        heatingRelays.push({
          id: "heater_1",
          pin: pinout.heater_relay_1,
          wattage: product.heatingWattage.circuit1,
        });
      }

      if (product.heatingWattage.circuit2 > 0 && pinout.heater_relay_2) {
        heatingRelays.push({
          id: "heater_2",
          pin: pinout.heater_relay_2,
          wattage: product.heatingWattage.circuit2,
        });
      }

      if (product.heatingWattage.circuit3 > 0 && pinout.heater_relay_3) {
        heatingRelays.push({
          id: "heater_3",
          pin: pinout.heater_relay_3,
          wattage: product.heatingWattage.circuit3,
        });
      }

      // Create lighting relays (if supported by board and product)
      const lightingRelays: NewLightingRelay[] = [];
      if (hasLighting && pinout.lights_relay_1) {
        lightingRelays.push({
          id: "lights_1",
          pin: pinout.lights_relay_1,
          type: "led_strip",
        });
      }

      if (hasLighting && pinout.lights_relay_2) {
        lightingRelays.push({
          id: "lights_2",
          pin: pinout.lights_relay_2,
          type: "led_ring",
        });
      }

      const newProduct: NewProduct = {
        sku: product.sku,
        variant: product.variant,
        name: product.productName,
        heatingRelays,
        lightingRelays,
      };

      boardProducts[boardType].push(newProduct);
    }
  }

  // Generate example board configurations
  console.log("📋 Generated board product configurations:\n");

  for (const [boardType, products] of Object.entries(boardProducts)) {
    console.log(`🔧 Board: ${boardType}`);
    console.log(`   Products: ${products.length}`);

    // Show first few products as examples
    products.slice(0, 3).forEach((product) => {
      console.log(`   - ${product.sku}: ${product.variant}`);
      console.log(`     Heating: ${product.heatingRelays.length} circuits`);
      console.log(`     Lighting: ${product.lightingRelays.length} circuits`);
    });

    if (products.length > 3) {
      console.log(`   ... and ${products.length - 3} more products`);
    }
    console.log("");
  }

  // Save example board configuration
  const exampleBoard = {
    boardType: "IS-3R-WL",
    boardVersion: "V5",
    module: {
      chip: "ESP32-C6",
      flash_size_mb: 8,
    },
    aliases: ["HMBL-V3.0-092025"],
    capabilities: {
      has_mlx90614: true,
      has_bme688: false,
      has_sht41: true,
      num_lm35_sensors: 0,
      has_ld2410_uart: true,
      has_ld2410_binary: true,
      num_heating_circuits: 3,
      num_lighting_circuits: 2,
      has_pairing_led: true,
      has_sensor_led: false,
      has_pairing_button: true,
      has_gnd_sw: false,
    },
    pinout: {
      pairing_button_gpio: 6,
      gnd_sw_gpio: null,
      heater_relay_1: 18,
      heater_relay_2: 19,
      heater_relay_3: 20,
      lights_relay_1: 4,
      lights_relay_2: 5,
      i2c_sda: 21,
      i2c_scl: 22,
      i2c_port: 0,
      mlx90614_addr: 90,
      bme688_addr: 0,
      sht41_addr: 68,
      ld2410_tx: 2,
      ld2410_rx: 3,
      ld2410_out: 23,
      ld2410_uart_port: 1,
      lm35_remote: null,
      lm35_main: null,
      pairing_led: 11,
      sensor_led: null,
    },
    products: boardProducts["IS-3R-WL-V5"] || [],
  };

  const outputPath = join(
    __dirname,
    "..",
    "boards",
    "IS-3R-WL-V5-migrated.json"
  );
  writeFileSync(outputPath, JSON.stringify(exampleBoard, null, 2));

  console.log(
    `✅ Example migrated board configuration saved to: ${outputPath}`
  );
  console.log("\n🎯 Migration Benefits:");
  console.log("   • Products are now defined directly on boards");
  console.log("   • Flexible relay configurations per product");
  console.log("   • Single board can represent multiple products");
  console.log("   • Aligns with ESPHome patterns for better flexibility");
  console.log("   • Easier to maintain and extend");
}

if (require.main === module) {
  migrateProductToBoardProducts();
}

export { migrateProductToBoardProducts };

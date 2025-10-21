#!/usr/bin/env tsx

/**
 * Pin Uniqueness Validation Utility
 *
 * This utility helps validate that all GPIO pins are unique across all products
 * on a board configuration. It provides detailed error reporting for pin conflicts.
 */

import type { Product } from "../schemas/board-v1.0.0";

interface PinConflict {
  pin: number;
  products: string[];
  components: string[];
}

interface ValidationResult {
  isValid: boolean;
  conflicts: PinConflict[];
  allPins: number[];
}

/**
 * Validates pin uniqueness across all products on a board
 */
export function validatePinUniqueness(products: Product[]): ValidationResult {
  const pinUsage = new Map<
    number,
    { products: string[]; components: string[] }
  >();
  const allPins: number[] = [];

  // Collect all pins from all products
  for (const product of products) {
    // Heating relay pins
    for (const relay of product.heatingRelays) {
      allPins.push(relay.pin);
      if (!pinUsage.has(relay.pin)) {
        pinUsage.set(relay.pin, { products: [], components: [] });
      }
      pinUsage.get(relay.pin)!.products.push(product.sku);
      pinUsage
        .get(relay.pin)!
        .components.push(`${product.sku}:heating:${relay.id}`);
    }

    // Lighting relay pins
    for (const relay of product.lightingRelays) {
      allPins.push(relay.pin);
      if (!pinUsage.has(relay.pin)) {
        pinUsage.set(relay.pin, { products: [], components: [] });
      }
      pinUsage.get(relay.pin)!.products.push(product.sku);
      pinUsage
        .get(relay.pin)!
        .components.push(`${product.sku}:lighting:${relay.id}`);
    }

    // Sensor pins
    for (const sensor of product.sensors || []) {
      if ("pin" in sensor && typeof sensor.pin === "number") {
        allPins.push(sensor.pin);
        if (!pinUsage.has(sensor.pin)) {
          pinUsage.set(sensor.pin, { products: [], components: [] });
        }
        pinUsage.get(sensor.pin)!.products.push(product.sku);
        pinUsage
          .get(sensor.pin)!
          .components.push(`${product.sku}:sensor:${sensor.id}`);
      }
      if ("tx_pin" in sensor && typeof sensor.tx_pin === "number") {
        allPins.push(sensor.tx_pin);
        if (!pinUsage.has(sensor.tx_pin)) {
          pinUsage.set(sensor.tx_pin, { products: [], components: [] });
        }
        pinUsage.get(sensor.tx_pin)!.products.push(product.sku);
        pinUsage
          .get(sensor.tx_pin)!
          .components.push(`${product.sku}:sensor:${sensor.id}:tx`);
      }
      if ("rx_pin" in sensor && typeof sensor.rx_pin === "number") {
        allPins.push(sensor.rx_pin);
        if (!pinUsage.has(sensor.rx_pin)) {
          pinUsage.set(sensor.rx_pin, { products: [], components: [] });
        }
        pinUsage.get(sensor.rx_pin)!.products.push(product.sku);
        pinUsage
          .get(sensor.rx_pin)!
          .components.push(`${product.sku}:sensor:${sensor.id}:rx`);
      }
      if ("out_pin" in sensor && typeof sensor.out_pin === "number") {
        allPins.push(sensor.out_pin);
        if (!pinUsage.has(sensor.out_pin)) {
          pinUsage.set(sensor.out_pin, { products: [], components: [] });
        }
        pinUsage.get(sensor.out_pin)!.products.push(product.sku);
        pinUsage
          .get(sensor.out_pin)!
          .components.push(`${product.sku}:sensor:${sensor.id}:out`);
      }
    }

    // LED pins
    for (const led of product.leds || []) {
      allPins.push(led.pin);
      if (!pinUsage.has(led.pin)) {
        pinUsage.set(led.pin, { products: [], components: [] });
      }
      pinUsage.get(led.pin)!.products.push(product.sku);
      pinUsage.get(led.pin)!.components.push(`${product.sku}:led:${led.id}`);
    }

    // Button pins
    for (const button of product.buttons || []) {
      allPins.push(button.pin);
      if (!pinUsage.has(button.pin)) {
        pinUsage.set(button.pin, { products: [], components: [] });
      }
      pinUsage.get(button.pin)!.products.push(product.sku);
      pinUsage
        .get(button.pin)!
        .components.push(`${product.sku}:button:${button.id}`);
    }
  }

  // Find conflicts
  const conflicts: PinConflict[] = [];
  for (const [pin, usage] of pinUsage) {
    if (usage.products.length > 1) {
      conflicts.push({
        pin,
        products: [...new Set(usage.products)],
        components: usage.components,
      });
    }
  }

  return {
    isValid: conflicts.length === 0,
    conflicts,
    allPins: [...new Set(allPins)].sort((a, b) => a - b),
  };
}

/**
 * Prints a detailed report of pin usage and conflicts
 */
export function printPinReport(products: Product[]): void {
  const result = validatePinUniqueness(products);

  console.log("📌 Pin Usage Report");
  console.log("==================");

  if (result.isValid) {
    console.log("✅ All pins are unique across products");
    console.log(`📊 Total unique pins used: ${result.allPins.length}`);
    console.log(
      `🔢 Pin range: ${Math.min(...result.allPins)} - ${Math.max(
        ...result.allPins
      )}`
    );
  } else {
    console.log("❌ Pin conflicts detected:");
    console.log("");

    for (const conflict of result.conflicts) {
      console.log(`🔴 Pin ${conflict.pin} is used by:`);
      for (const component of conflict.components) {
        console.log(`   - ${component}`);
      }
      console.log("");
    }
  }

  console.log("📋 All pins used:");
  console.log(result.allPins.join(", "));
}

if (require.main === module) {
  // Example usage
  const exampleProducts: Product[] = [
    {
      sku: "IR-HALO-4800",
      variant: "4800W standard",
      name: "Halo",
      heatingRelays: [
        { id: "heater_1", pin: 18, wattage: 1600 },
        { id: "heater_2", pin: 19, wattage: 1600 },
        { id: "heater_3", pin: 20, wattage: 1600 },
      ],
      lightingRelays: [],
      sensors: [
        { id: "mlx90614", type: "mlx90614", address: 90 },
        { id: "sht41", type: "sht41", address: 68 },
      ],
      leds: [{ id: "pairing_led", pin: 11, type: "status" }],
      buttons: [{ id: "pairing_button", pin: 6, type: "pairing" }],
    },
    {
      sku: "IR-HALO-4800-L",
      variant: "4800W with lights",
      name: "Halo",
      heatingRelays: [
        { id: "heater_1", pin: 18, wattage: 1600 }, // CONFLICT!
        { id: "heater_2", pin: 19, wattage: 1600 }, // CONFLICT!
        { id: "heater_3", pin: 20, wattage: 1600 }, // CONFLICT!
      ],
      lightingRelays: [
        { id: "lights_1", pin: 4, type: "dimmable" },
        { id: "lights_2", pin: 5, type: "rgb" },
      ],
      sensors: [],
      leds: [],
      buttons: [],
    },
  ];

  printPinReport(exampleProducts);
}

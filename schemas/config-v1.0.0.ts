import { z } from "zod";

/**
 * Final Configuration Schema v1.0.0
 *
 * This schema validates the final configuration output from the CLI tool.
 * It defines the structure for ESP32 board configurations including hardware
 * capabilities, pinouts, and product configurations.
 *
 * Updated to align with ESPHome patterns - products are now defined on boards
 * with flexible relay configurations for heating and lighting circuits.
 *
 * The schema uses .catchall(z.unknown()) to allow additional keys for future extensibility.
 */

export const BoardModuleSchema = z
  .object({
    chip: z.string(),
    flash_size_mb: z.number().int().positive(),
  })
  .catchall(z.unknown());

// Heating relay configuration for products
export const HeatingRelaySchema = z
  .object({
    id: z.string(), // e.g., "heater_1", "heater_2", "heater_3"
    pin: z.number().int().positive(), // GPIO pin number
    wattage: z.number().int().min(0), // Power rating in watts
  })
  .catchall(z.unknown());

// Lighting relay configuration for products
export const LightingRelaySchema = z
  .object({
    id: z.string(), // e.g., "lights_1", "lights_2"
    pin: z.number().int().positive(), // GPIO pin number
    type: z.enum(["dimmable", "rgb", "warmth", "regular"]), // Lighting type
  })
  .catchall(z.unknown());

// I2C Sensor configuration schema
export const I2CSensorConfigSchema = z
  .object({
    id: z.string(), // e.g., "mlx90614", "bme688", "sht41"
    type: z.enum(["mlx90614", "bme688", "sht41"]),
    address: z.number().int(), // I2C address
  })
  .catchall(z.unknown());

// UART Sensor configuration schema
export const UARTSensorConfigSchema = z
  .object({
    id: z.string(), // e.g., "ld2410"
    type: z.enum(["ld2410"]),
    uart_port: z.number().int(), // UART port
    tx_pin: z.number().int(), // TX pin
    rx_pin: z.number().int(), // RX pin
    out_pin: z.number().int().optional(), // Digital output pin for LD2410
  })
  .catchall(z.unknown());

// Analog Sensor configuration schema
export const AnalogSensorConfigSchema = z
  .object({
    id: z.string(), // e.g., "lm35_main", "lm35_remote"
    type: z.enum(["lm35"]),
    pin: z.number().int().positive(), // GPIO pin for analog reading
  })
  .catchall(z.unknown());

// Union type for all sensor configurations
export const SensorConfigSchema = z.union([
  I2CSensorConfigSchema,
  UARTSensorConfigSchema,
  AnalogSensorConfigSchema,
]);

// LED configuration schema (ESPHome-like)
export const LedConfigSchema = z
  .object({
    id: z.string(), // e.g., "pairing_led", "sensor_led"
    pin: z.number().int().positive(),
    type: z.enum(["status", "indicator", "ambient"]),
  })
  .catchall(z.unknown());

// Button configuration schema (ESPHome-like)
export const ButtonConfigSchema = z
  .object({
    id: z.string(), // e.g., "pairing_button", "gnd_sw"
    pin: z.number().int().positive(),
    type: z.enum(["pairing", "switch", "reset"]),
  })
  .catchall(z.unknown());

// Product definition schema (hub context - flexible components)
export const ProductSchema = z
  .object({
    sku: z.string(), // Product SKU (e.g., "IR-HALO-4800")
    variant: z.string(), // Product variant name (e.g., "4800W standard")
    name: z.string(), // Product name (e.g., "Halo")
    heatingRelays: z.array(HeatingRelaySchema).min(0).max(3), // Up to 3 heating circuits
    lightingRelays: z.array(LightingRelaySchema).min(0).max(2), // Up to 2 lighting circuits
    sensors: z.array(SensorConfigSchema).min(0), // Optional sensors for this product
    leds: z.array(LedConfigSchema).min(0), // Optional LEDs for this product
    buttons: z.array(ButtonConfigSchema).min(0), // Optional buttons for this product
  })
  .refine(
    (data) => {
      // At least one component must be defined (relays, sensors, LEDs, or buttons)
      return (
        data.heatingRelays.length > 0 ||
        data.lightingRelays.length > 0 ||
        data.sensors.length > 0 ||
        data.leds.length > 0 ||
        data.buttons.length > 0
      );
    },
    {
      message:
        "Product must have at least one component (relays, sensors, LEDs, or buttons)",
    }
  )
  .catchall(z.unknown());

// I2C Bus configuration schema
export const I2CBusConfigSchema = z
  .object({
    sda: z.number().int().positive(),
    scl: z.number().int().positive(),
    port: z.number().int().positive(),
  })
  .catchall(z.unknown());

export const BoardConfigSchema = z
  .object({
    boardType: z.string(),
    boardVersion: z.string(), // Hardware revision (e.g., "V2", "V3", "V5")
    module: BoardModuleSchema,
    aliases: z.array(z.string()).optional(),
    i2c: I2CBusConfigSchema, // I2C bus configuration
    products: z.array(ProductSchema).min(1), // At least one product must be defined
  })
  .catchall(z.unknown());

export const FinalConfigSchema = z
  .object({
    configVersion: z.string(),
    sku: z.string(),
    boardType: z.string(),
    boardVersion: z.string(), // Hardware revision (e.g., "V2", "V3", "V5")
    batchDate: z.string(), // Manufacturing batch date (e.g., "2025-09-26")
    provisioningKey: z.string(),
    provisioningSecret: z.string(),
    module: BoardModuleSchema,
    i2c: I2CBusConfigSchema, // I2C bus configuration
    product: ProductSchema, // Selected product configuration with relay details
  })
  .catchall(z.unknown());

// Export type inference helpers
export type BoardModule = z.infer<typeof BoardModuleSchema>;
export type I2CBusConfig = z.infer<typeof I2CBusConfigSchema>;
export type BoardConfig = z.infer<typeof BoardConfigSchema>;
export type HeatingRelay = z.infer<typeof HeatingRelaySchema>;
export type LightingRelay = z.infer<typeof LightingRelaySchema>;
export type I2CSensorConfig = z.infer<typeof I2CSensorConfigSchema>;
export type UARTSensorConfig = z.infer<typeof UARTSensorConfigSchema>;
export type AnalogSensorConfig = z.infer<typeof AnalogSensorConfigSchema>;
export type SensorConfig = z.infer<typeof SensorConfigSchema>;
export type LedConfig = z.infer<typeof LedConfigSchema>;
export type ButtonConfig = z.infer<typeof ButtonConfigSchema>;
export type Product = z.infer<typeof ProductSchema>;
export type FinalConfig = z.infer<typeof FinalConfigSchema>;

import { z } from "zod";

/**
 * Final Configuration Schema v1.0.0
 *
 * This schema validates the final configuration output from the CLI tool.
 * It defines the structure for ESP32 board configurations including hardware
 * capabilities, pinouts, and product SKU mappings.
 *
 * The schema uses .catchall(z.unknown()) to allow additional keys for future extensibility.
 */

export const BoardModuleSchema = z.object({
  chip: z.string(),
  flash_size_mb: z.number().int().positive(),
}).catchall(z.unknown());

export const BoardCapabilitiesSchema = z.object({
  has_mlx90614: z.boolean(),
  has_bme688: z.boolean(),
  has_sht41: z.boolean(),
  num_lm35_sensors: z.number().int().min(0).max(2),
  has_ld2410_uart: z.boolean(),
  has_ld2410_binary: z.boolean(),
  num_heating_circuits: z.number().int().min(0).max(3),
  num_lighting_circuits: z.number().int().min(0).max(2),
  has_pairing_led: z.boolean(),
  has_sensor_led: z.boolean(),
  has_pairing_button: z.boolean(),
  has_gnd_sw: z.boolean(),
}).catchall(z.unknown());

export const BoardPinoutSchema = z.object({
  pairing_button_gpio: z.number().int().nullable(),
  gnd_sw_gpio: z.number().int().nullable(),
  heater_relay_1: z.number().int().nullable(),
  heater_relay_2: z.number().int().nullable(),
  heater_relay_3: z.number().int().nullable(),
  lights_relay_1: z.number().int().nullable(),
  lights_relay_2: z.number().int().nullable(),
  i2c_sda: z.number().int().nullable(),
  i2c_scl: z.number().int().nullable(),
  i2c_port: z.number().int(),
  mlx90614_addr: z.number().int(),
  bme688_addr: z.number().int(),
  sht41_addr: z.number().int(),
  ld2410_tx: z.number().int().nullable(),
  ld2410_rx: z.number().int().nullable(),
  ld2410_out: z.number().int().nullable(),
  ld2410_uart_port: z.number().int(),
  lm35_remote: z.number().int().nullable(),
  lm35_main: z.number().int().nullable(),
  pairing_led: z.number().int().nullable(),
  sensor_led: z.number().int().nullable(),
}).catchall(z.unknown());

export const BoardConfigSchema = z.object({
  boardType: z.string(),
  boardVersion: z.string(), // Hardware revision (e.g., "V2", "V3", "V5")
  module: BoardModuleSchema,
  aliases: z.array(z.string()).optional(),
  capabilities: BoardCapabilitiesSchema,
  pinout: BoardPinoutSchema,
}).catchall(z.unknown());

export const HeatingWattageSchema = z.object({
  circuit1: z.number().int().min(0),
  circuit2: z.number().int().min(0),
  circuit3: z.number().int().min(0),
}).catchall(z.unknown());

export const FinalConfigSchema = z.object({
  configVersion: z.string(),
  sku: z.string(),
  boardType: z.string(),
  boardVersion: z.string(), // Hardware revision (e.g., "V2", "V3", "V5")
  batchDate: z.string(), // Manufacturing batch date (e.g., "2025-09-26")
  provisioningKey: z.string(),
  provisioningSecret: z.string(),
  module: BoardModuleSchema,
  capabilities: BoardCapabilitiesSchema,
  pinout: BoardPinoutSchema,
  heatingWattage: HeatingWattageSchema.optional(),
}).catchall(z.unknown());

// Export type inference helpers
export type BoardModule = z.infer<typeof BoardModuleSchema>;
export type BoardCapabilities = z.infer<typeof BoardCapabilitiesSchema>;
export type BoardPinout = z.infer<typeof BoardPinoutSchema>;
export type BoardConfig = z.infer<typeof BoardConfigSchema>;
export type HeatingWattage = z.infer<typeof HeatingWattageSchema>;
export type FinalConfig = z.infer<typeof FinalConfigSchema>;

import { z } from "zod";

/**
 * Sensor Board Configuration Schema v1.0.0
 *
 * This schema validates sensor board configuration files stored in the sensor-boards/ directory.
 * Sensor boards define additional sensor hardware that can be attached to main control boards.
 *
 * The schema uses .catchall(z.unknown()) to allow additional keys for future extensibility.
 */

export const SensorBoardCapabilitiesSchema = z.object({
  has_mlx90614: z.boolean(),
  has_bme688: z.boolean(),
  has_sht41: z.boolean(),
  has_ld2410_uart: z.boolean(),
  has_ld2410_binary: z.boolean(),
  has_sensor_led: z.boolean().optional(),
  has_gnd_sw_mosfet: z.boolean().optional(),
  gnd_sw_gpio: z.number().int().optional(),
}).catchall(z.unknown());

export const SensorBoardSchema = z.object({
  sku: z.string(),
  name: z.string(),
  compatibleBoards: z.array(z.string()),
  capabilities: SensorBoardCapabilitiesSchema,
}).catchall(z.unknown());

// Export type inference helpers
export type SensorBoardCapabilities = z.infer<typeof SensorBoardCapabilitiesSchema>;
export type SensorBoard = z.infer<typeof SensorBoardSchema>;

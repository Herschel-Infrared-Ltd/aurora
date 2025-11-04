import { select, confirm, input } from "@inquirer/prompts";
import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { FinalConfigSchema } from "./schemas/config-v1.0.0.ts";
import { BoardConfigSchema } from "./schemas/board-v1.0.0.ts";
import { SensorBoardSchema } from "./schemas/sensor-board-v1.0.0.ts";

// Configuration version for schema tracking
const CONFIG_VERSION = "1.0.0";

// Type definitions
interface BoardCapabilities {
  has_mlx90614: boolean;
  has_bme688: boolean;
  has_sht41: boolean;
  num_lm35_sensors: number;
  has_ld2410_uart: boolean;
  has_ld2410_binary: boolean;
  num_heating_circuits: number;
  num_lighting_circuits: number;
  has_pairing_led: boolean;
  has_sensor_led: boolean;
  has_pairing_button: boolean;
  has_gnd_sw: boolean;
}

interface BoardPinout {
  pairing_button_gpio: number | null;
  gnd_sw_gpio: number | null;
  heater_relay_1: number | null;
  heater_relay_2: number | null;
  heater_relay_3: number | null;
  lights_relay_1: number | null;
  lights_relay_2: number | null;
  i2c_sda: number | null;
  i2c_scl: number | null;
  i2c_port: number;
  mlx90614_addr: number;
  bme688_addr: number;
  sht41_addr: number;
  ld2410_tx: number | null;
  ld2410_rx: number | null;
  ld2410_out: number | null;
  ld2410_uart_port: number;
  lm35_remote: number | null;
  lm35_main: number | null;
  pairing_led: number | null;
  sensor_led: number | null;
}

interface BoardModule {
  chip: string;
  flash_size_mb: number;
}

interface BoardConfig {
  boardType: string;
  boardVersion: string;
  module: BoardModule;
  aliases?: string[];
  capabilities: BoardCapabilities;
  pinout: BoardPinout;
}

interface HeatingWattage {
  circuit1: number;
  circuit2: number;
  circuit3: number;
}

interface Product {
  productName: string;
  sku: string;
  variant: string;
  compatibleBoards: string[];
  heatingWattage?: HeatingWattage;
}

interface SkuMappings {
  products: Product[];
}

interface FinalConfig {
  configVersion: string;
  sku: string;
  boardType: string;
  boardVersion: string;
  batchDate: string;
  module: BoardModule;
  capabilities: BoardCapabilities;
  pinout: BoardPinout;
  heatingWattage?: HeatingWattage;
}

interface SensorBoard {
  sku: string;
  name: string;
  compatibleBoards: string[];
  capabilities: {
    has_mlx90614: boolean;
    has_bme688: boolean;
    has_sht41: boolean;
    has_ld2410_uart: boolean;
    has_ld2410_binary: boolean;
    has_sensor_led?: boolean;
    has_gnd_sw_mosfet?: boolean;
    gnd_sw_gpio?: number;
  };
}

async function loadSkuMappings(): Promise<SkuMappings> {
  const file = Bun.file("sku-mappings.json");
  return await file.json();
}

async function loadBoardConfig(boardId: string): Promise<BoardConfig> {
  // Try exact match first
  let file = Bun.file(`boards/${boardId}.json`);
  if (await file.exists()) {
    const data = await file.json();
    try {
      return BoardConfigSchema.parse(data);
    } catch (error) {
      throw new Error(`Invalid board configuration for ${boardId}: ${error}`);
    }
  }

  // Try case-insensitive match
  const files = await readdir("boards");
  const matchingFile = files.find(
    (f) => f.toLowerCase() === `${boardId.toLowerCase()}.json`
  );

  if (matchingFile) {
    file = Bun.file(join("boards", matchingFile));
    const data = await file.json();
    try {
      return BoardConfigSchema.parse(data);
    } catch (error) {
      throw new Error(
        `Invalid board configuration for ${matchingFile}: ${error}`
      );
    }
  }

  throw new Error(`Board configuration not found: ${boardId}`);
}

async function loadSensorBoards(): Promise<SensorBoard[]> {
  const files = await readdir("sensor-boards");
  const sensorBoards: SensorBoard[] = [];

  for (const filename of files) {
    if (filename.endsWith(".json")) {
      const file = Bun.file(join("sensor-boards", filename));
      const data = await file.json();
      try {
        const board = SensorBoardSchema.parse(data);
        sensorBoards.push(board);
      } catch (error) {
        console.warn(`⚠️  Skipping invalid sensor board ${filename}: ${error}`);
      }
    }
  }

  return sensorBoards;
}

async function main() {
  console.log("🔧 Board Configuration Generator\n");

  // Load SKU mappings
  const skuMappings = await loadSkuMappings();

  // Step 1: Select product line
  const productNames = [
    ...new Set(skuMappings.products.map((p) => p.productName)),
  ];

  const selectedProductName = await select({
    message: "Select product line:",
    choices: productNames.map((name) => ({
      name,
      value: name,
    })),
  });

  // Step 2: Select variant within product line
  const productsInLine = skuMappings.products.filter(
    (p) => p.productName === selectedProductName
  );

  const selectedSku = await select({
    message: `Select ${selectedProductName} variant:`,
    choices: productsInLine.map((p) => ({
      name: `${p.variant} (${p.sku})`,
      value: p.sku,
    })),
  });

  const product = skuMappings.products.find(
    (p) => p.sku.toLowerCase() === selectedSku.toLowerCase()
  )!;

  // Step 3: Select board configuration
  const selectedBoard = await select({
    message: "Select board configuration:",
    choices: product.compatibleBoards.map((board) => ({
      name: board,
      value: board,
    })),
  });

  // Load the board configuration
  const boardConfig = await loadBoardConfig(selectedBoard);

  console.log(
    `\n📋 Board: ${boardConfig.boardType} ${boardConfig.boardVersion}`
  );

  // Step 3.5: Prompt for batch date
  const now = new Date();
  const month = now.getMonth() + 1; // 1-12 (not zero-padded)
  const defaultBatchDate = `${month}${now.getFullYear()}`;

  const batchDate = await input({
    message:
      "Enter manufacturing batch date (MYYYY or MMyyyy, e.g., 12025 or 102025):",
    default: defaultBatchDate,
    validate: (value) => {
      // Accept 5 digits (MYYYY) or 6 digits (MMyyyy)
      const batchRegex = /^\d{5,6}$/;
      if (!batchRegex.test(value)) {
        return "Please enter a valid batch date in MYYYY or MMyyyy format (e.g., 12025 or 102025)";
      }
      // Extract month (1-2 digits) and validate
      let monthNum: number;
      if (value.length === 5) {
        // Format: MYYYY (e.g., 12025)
        monthNum = parseInt(value.substring(0, 1), 10);
      } else {
        // Format: MMyyyy (e.g., 102025)
        monthNum = parseInt(value.substring(0, 2), 10);
      }
      if (monthNum < 1 || monthNum > 12) {
        return "Please enter a valid month (1-12)";
      }
      return true;
    },
  });

  console.log(`   Batch: ${batchDate}`);

  console.log(`   Configuring sensors for deployment...\n`);

  // Step 4: Choose sensor configuration method
  const configMethod = await select({
    message: "How would you like to configure sensors?",
    choices: [
      { name: "Use sensor board SKU", value: "sku" },
      { name: "Manual configuration", value: "manual" },
    ],
  });

  const capabilities = { ...boardConfig.capabilities };

  let useSensorBoardSku = configMethod === "sku";

  if (configMethod === "sku") {
    // Load sensor board mappings
    const allSensorBoards = await loadSensorBoards();

    // Create list of board identifiers (main board name + aliases) - lowercase for comparison
    const boardIdentifiers = [
      selectedBoard.toLowerCase(),
      ...(boardConfig.aliases || []).map((alias) => alias.toLowerCase()),
    ];

    // Filter sensor boards compatible with the selected main board or its aliases (case-insensitive)
    const compatibleSensorBoards = allSensorBoards.filter((sb) =>
      sb.compatibleBoards.some((compatBoard) =>
        boardIdentifiers.includes(compatBoard.toLowerCase())
      )
    );

    if (compatibleSensorBoards.length === 0) {
      console.log(
        `\n⚠️  No predefined sensor boards available for ${selectedBoard}. Switching to manual configuration.\n`
      );
      useSensorBoardSku = false;
    } else {
      const selectedSensorBoard = await select({
        message: "Select sensor board:",
        choices: compatibleSensorBoards.map((sb) => ({
          name: `${sb.name} (${sb.sku})`,
          value: sb.sku,
        })),
      });

      const sensorBoard = compatibleSensorBoards.find(
        (sb) => sb.sku.toLowerCase() === selectedSensorBoard.toLowerCase()
      )!;

      // Apply sensor board capabilities
      capabilities.has_mlx90614 = sensorBoard.capabilities.has_mlx90614;
      capabilities.has_bme688 = sensorBoard.capabilities.has_bme688;
      capabilities.has_sht41 = sensorBoard.capabilities.has_sht41;
      capabilities.has_ld2410_uart = sensorBoard.capabilities.has_ld2410_uart;
      capabilities.has_ld2410_binary =
        sensorBoard.capabilities.has_ld2410_binary;

      console.log(`\n✅ Applied sensor configuration from ${sensorBoard.name}`);
    }
  }

  // Continue with manual configuration if needed
  if (!useSensorBoardSku) {
    // MLX90614 IR sensor
    capabilities.has_mlx90614 = await confirm({
      message: "MLX90614 IR temperature sensor connected?",
      default: true,
    });

    // Environmental sensor selection
    const envSensor = await select({
      message: "Which environmental sensor is connected?",
      choices: [
        { name: "BME688 (temp/humidity/pressure/gas)", value: "bme688" },
        { name: "SHT41 (temp/humidity)", value: "sht41" },
        { name: "None", value: "none" },
      ],
      default: capabilities.has_bme688
        ? "bme688"
        : capabilities.has_sht41
        ? "sht41"
        : "none",
    });

    capabilities.has_bme688 = envSensor === "bme688";
    capabilities.has_sht41 = envSensor === "sht41";

    // LD2410 presence sensor
    const ld2410Mode = await select({
      message: "LD2410 presence sensor connection:",
      choices: [
        { name: "UART + Binary (full control)", value: "both" },
        { name: "UART only", value: "uart" },
        { name: "Binary only", value: "binary" },
        { name: "Not connected", value: "none" },
      ],
      default:
        capabilities.has_ld2410_uart && capabilities.has_ld2410_binary
          ? "both"
          : capabilities.has_ld2410_uart
          ? "uart"
          : capabilities.has_ld2410_binary
          ? "binary"
          : "none",
    });

    capabilities.has_ld2410_uart =
      ld2410Mode === "uart" || ld2410Mode === "both";
    capabilities.has_ld2410_binary =
      ld2410Mode === "binary" || ld2410Mode === "both";
  }

  // LM35 analog sensors (only if board supports them)
  if (boardConfig.capabilities.num_lm35_sensors > 0) {
    const lm35Count = await select({
      message: "How many LM35 analog temperature sensors are connected?",
      choices: [
        { name: "None", value: 0 },
        { name: "1 sensor", value: 1 },
        { name: "2 sensors", value: 2 },
      ],
      default: 0,
    });
    capabilities.num_lm35_sensors = lm35Count;
  } else {
    capabilities.num_lm35_sensors = 0;
  }

  // Build final configuration
  const finalConfig: FinalConfig = {
    configVersion: CONFIG_VERSION,
    sku: selectedSku,
    boardType: boardConfig.boardType,
    boardVersion: boardConfig.boardVersion,
    batchDate: batchDate,
    module: boardConfig.module,
    capabilities,
    pinout: boardConfig.pinout,
    heatingWattage: product.heatingWattage,
  };

  // Validate configuration against schema
  try {
    FinalConfigSchema.parse(finalConfig);
  } catch (error) {
    console.error("\n❌ Configuration validation failed:");
    console.error(error);
    process.exit(1);
  }

  // Output the configuration as a paste-ready serial console command
  console.log("\n✅ Configuration generated:\n");

  // Compact JSON (no extra whitespace)
  const jsonString = JSON.stringify(finalConfig);

  // ESP console doesn't strip quotes like bash, so pass JSON unquoted
  // The argtable3 parser will handle the string correctly
  const output = `upload-config ${jsonString} --force`;

  console.log(output);

  // Save to file
  const saveToFile = await confirm({
    message: "\nSave configuration to file?",
    default: true,
  });

  if (saveToFile) {
    // Generate ISO timestamp filename (replace colons and dots with hyphens for filesystem safety)
    const isoString = new Date()
      .toISOString()
      .replace(/:/g, "-")
      .replace(/\./g, "-");
    const filename = `config-${isoString}.txt`;
    await Bun.write(filename, output);
    console.log(`\n💾 Saved to: ${filename}`);
  }

  console.log("\n✨ Done!");
}

main().catch((error) => {
  if (error.name === "ExitPromptError") {
    console.log("\n\n👋 Configuration cancelled.");
    process.exit(0);
  }
  console.error(error);
  process.exit(1);
});

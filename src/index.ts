import { exampleChainRegistry_DiscoveryDefinition } from "./mapping/discovery/example.js";
import {
  exampleChainRegistry_buildDatabase,
  exampleChainRegistry_ImportDefinition,
} from "./utils/initializeChainReg.js";
import { runExampleValidation } from "./validation/example.js";

console.log("This is the main file");

const discoveryRoot = exampleChainRegistry_DiscoveryDefinition();
const importMapping = exampleChainRegistry_ImportDefinition();

exampleChainRegistry_buildDatabase(discoveryRoot, importMapping);

//runExampleValidation();

//getChainRegContents();

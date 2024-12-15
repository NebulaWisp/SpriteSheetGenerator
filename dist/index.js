"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const sharp_1 = __importDefault(require("sharp"));
function createSpritesheet(inputDir, outputFile, tileWidth, tileHeight) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            // Read files in the input directory
            const files = fs_1.default
                .readdirSync(inputDir)
                .filter(file => /\.(png|jpg|jpeg)$/i.test(file))
                .sort((a, b) => parseInt(a) - parseInt(b)); // Sort by numerical order
            if (files.length === 0) {
                throw new Error("No image files found in the directory.");
            }
            // Load and process images
            const images = yield Promise.all(files.map(file => (0, sharp_1.default)(path_1.default.join(inputDir, file)).resize(tileWidth, tileHeight).toBuffer()));
            // Determine spritesheet dimensions
            const columns = Math.ceil(Math.sqrt(files.length)); // Square grid layout
            const rows = Math.ceil(files.length / columns);
            // Create spritesheet canvas
            const spritesheetWidth = columns * tileWidth;
            const spritesheetHeight = rows * tileHeight;
            const spritesheet = (0, sharp_1.default)({
                create: {
                    width: spritesheetWidth,
                    height: spritesheetHeight,
                    channels: 4,
                    background: { r: 0, g: 0, b: 0, alpha: 0 }
                }
            });
            // Composite images onto the canvas
            const compositeImages = images.map((img, index) => {
                const x = (index % columns) * tileWidth;
                const y = Math.floor(index / columns) * tileHeight;
                return { input: img, top: y, left: x };
            });
            yield spritesheet.composite(compositeImages).toFile(outputFile);
            console.log(`Spritesheet saved to ${outputFile}`);
        }
        catch (error) {
            console.error("Error creating spritesheet:", (_a = error === null || error === void 0 ? void 0 : error.message) !== null && _a !== void 0 ? _a : 'unknown error');
        }
    });
}
// Example usage
const inputDirectory = path_1.default.resolve(__dirname, "../images");
const outputFilePath = path_1.default.resolve(__dirname, "../output/spritesheet.png");
const tileWidth = 64; // Adjust as needed
const tileHeight = 64; // Adjust as needed
createSpritesheet(inputDirectory, outputFilePath, tileWidth, tileHeight);

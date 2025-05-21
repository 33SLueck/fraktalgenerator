import { createCanvas } from "canvas";
import fs from "fs";
import inquirer from "inquirer";
import { createNoise2D } from "simplex-noise";
import readline from "readline";

class FractalGenerator {
  constructor(config) {
    this.width = 800;
    this.height = 800;
    this.maxIter = config.iterations; // Anzahl der Iterationen
    this.zoom = config.zoom; // Zoomfaktor
    this.offsetX = config.offsetX; // X-Verschiebung
    this.offsetY = config.offsetY; // Y-Verschiebung
    this.baseHue = config.baseHue; // Basisfarbton
    this.saturation = config.saturation; // Sättigung (0-100)
    this.lightness = config.lightness; // Helligkeit (0-100)
    this.patternStrength = config.patternStrength; // (nicht verwendet)
    this.juliaParams = { cx: config.cx, cy: config.cy }; // Parameter für Julia-Formel
    this.canvas = createCanvas(this.width, this.height);
    this.ctx = this.canvas.getContext("2d");
    this.noise2D = createNoise2D();
    this.minNoise = config.minNoise; // min Noise für Nebeleffekt
    this.maxNoise = config.maxNoise; // max Noise für Nebeleffekt
    this.fogDensity = config.fogDensity || 0.4; // Nebeldichte
    this.fogSize = config.fogSize || 0.01; // Skalierung der Nebelstruktur
    this.fogLayerCount = config.fogLayerCount || 5; // Anzahl der Nebelschichten
    this.starClarity = config.starClarity || 1.0; // Sternklarheit
    this.keepBlackAreasClear = config.keepBlackAreasClear !== false;
    this.starPositions = [];
    this.coloredAreas = [];
  }
  updateProgress(percent) {
    readline.clearLine(process.stdout, 0);
    readline.cursorTo(process.stdout, 0);
    process.stdout.write(`🧠 Generating fractal: ${percent.toFixed(1)}%`);
  }
  blend(bg, fg, alpha) {
    return bg * (1 - alpha) + fg * alpha;
  }

  hslToRgb(h, s, l) {
    h /= 360;
    s /= 100;
    l /= 100;
    let r, g, b;
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    if (s === 0) {
      r = g = b = l;
    } else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
  }

  // Mandelbrot-Formel: z = z² + c, z₀ = 0
  mandelbrot(x, y) {
    let zx = 0,
      zy = 0,
      iter = 0;
    while (zx * zx + zy * zy < 4 && iter < this.maxIter) {
      const xtemp = zx * zx - zy * zy + x;
      zy = 2 * zx * zy + y;
      zx = xtemp;

      zx += 0.005 * Math.sin(zy * 3);
      zy += 0.005 * Math.sin(zx * 2);
      iter++;
    }
    return iter;
  }

  // Perlin Noise (Mehrdimensionales Rauschmuster) für die Hintergrundberechnung.
  // Die Formel für Perlin Noise besteht aus mehreren "Oktaven", wobei jede Oktave eine
  // eigene Frequenz und Amplitude hat. Jede Oktave fügt dem Rauschen eine feinere Detailstufe hinzu.
  // Die Perlin-Noise-Funktion wird hier durch die 'this.noise2D' Methode erzeugt, welche
  // ein 2D-Rauschmuster liefert. Die einzelnen Oktaven werden dann mit unterschiedlichen
  // Frequenzen und Amplituden kombiniert, um ein realistischeres Rauschmuster zu erzeugen.

  // Formel:
  // noise(x, y) = Σ ( noise2D(x * freq, y * freq) * amplitude )
  // where:
  //    freq = 2^layer * baseFrequency     // Frequenz für die jeweilige Oktave
  //    amplitude = baseAmplitude / 2^layer  // Amplitude für die jeweilige Oktave
  //    layer = 0, 1, 2, ..., n-1   // Jede Oktave wird durch die variable "layer" dargestellt

  // Zusätzlich wird das berechnete Rauschmuster in einem Bereich von [0, 1] skaliert und als
  // "fog"-Effekt zur Hintergrundfarbe des Bildes hinzugefügt.

  // Anwendung auf den Bildpixel:
  // 1. Rauschwerte werden für jedes Pixel (px, py) unter Verwendung der Perlin Noise-Funktion berechnet.
  // 2. Der resultierende Wert wird als "fog" auf die Farbwerte des Pixels angewendet.
  // 3. Das Bild wird nach der Modifikation mit den Rauschwerten zurückgegeben.

  drawPerlinNoiseBackground() {
    const imgData = this.ctx.getImageData(0, 0, this.width, this.height);
    const data = imgData.data;
    for (let px = 0; px < this.width; px++) {
      for (let py = 0; py < this.height; py++) {
        let noiseValue = 0;
        for (let layer = 0; layer < 5; layer++) {
          const freq = 0.002 * Math.pow(2, layer);
          const amp = 0.4 / Math.pow(2, layer);
          noiseValue += this.noise2D(px * freq, py * freq) * amp;
        }
        const variation = Math.max(0, Math.min(1, (noiseValue + 1) / 2));
        const fog = 15 + variation * 20;
        const i = (py * this.width + px) * 4;
        data[i] += fog;
        data[i + 1] += fog;
        data[i + 2] += fog;
      }
    }
    this.ctx.putImageData(imgData, 0, 0);
  }

  applyFogLayer() {
    if (!this.starPositions) this.starPositions = [];
    if (!this.coloredAreas)
      this.coloredAreas = new Array(this.width * this.height).fill(true);
    const imgData = this.ctx.getImageData(0, 0, this.width, this.height);
    const data = imgData.data;
    for (let px = 0; px < this.width; px++) {
      for (let py = 0; py < this.height; py++) {
        const pixelIndex = py * this.width + px;
        let skipFog = false;
        for (const star of this.starPositions) {
          const distance = Math.sqrt((px - star.x) ** 2 + (py - star.y) ** 2);
          if (distance <= star.radius) {
            skipFog = true;
            break;
          }
        }
        if (this.keepBlackAreasClear && !this.coloredAreas[pixelIndex]) {
          skipFog = true;
        }
        if (skipFog) continue;
        let noiseSum = 0;
        for (let layer = 0; layer < this.fogLayerCount; layer++) {
          const frequency = this.fogSize * Math.pow(2, layer);
          const amplitude = 1 / Math.pow(2, layer);
          noiseSum += this.noise2D(px * frequency, py * frequency) * amplitude;
        }
        const fogIntensity = (noiseSum + 1) / 2;
        const i = pixelIndex * 4;
        const baseColor = [data[i], data[i + 1], data[i + 2]];
        const fogColor = [
          Math.min(255, baseColor[0] + 40),
          Math.min(255, baseColor[1] + 40),
          Math.min(255, baseColor[2] + 60),
        ];
        const alpha = fogIntensity * this.fogDensity;
        data[i] = this.blend(data[i], fogColor[0], alpha);
        data[i + 1] = this.blend(data[i + 1], fogColor[1], alpha);
        data[i + 2] = this.blend(data[i + 2], fogColor[2], alpha);
      }
    }
    this.ctx.putImageData(imgData, 0, 0);
  }
  drawFractal(type) {
    const imgData = this.ctx.getImageData(0, 0, this.width, this.height);
    const data = imgData.data;
    this.coloredAreas = new Array(this.width * this.height).fill(false);
    const complementaryHue = (this.baseHue + 180) % 360;

    for (let py = 0; py < this.height; py++) {
      this.updateProgress((py / this.height) * 100);

      for (let px = 0; px < this.width; px++) {
        const x = (px - this.width / 2) / this.zoom + this.offsetX;
        const y = (py - this.height / 2) / this.zoom + this.offsetY;
        const iter =
          type === "julia"
            ? this.julia(x, y, this.juliaParams.cx, this.juliaParams.cy)
            : this.mandelbrot(x, y);
        const mask = iter / this.maxIter;
        const fade = 1 - Math.pow(mask, 1.5);
        const isColored = iter < this.maxIter && fade > 0.01;
        this.coloredAreas[py * this.width + px] = isColored;
        if (fade < 0.01) continue;
        const i = (py * this.width + px) * 4;
        const fogX = px * 0.03;
        const fogY = py * 0.03;
        let fogMod = 0;
        for (let layer = 0; layer < 3; layer++) {
          const freq = 0.01 * Math.pow(2, layer);
          fogMod +=
            (this.noise2D(fogX * freq, fogY * freq) * 0.5 + 0.5) / (layer + 1);
        }
        fogMod /= 1.875;
        const hue = ((1 - mask) * this.baseHue + mask * complementaryHue) % 360;
        const sat = Math.max(20, this.saturation + mask * 25);
        const light = this.lightness + mask * 35 + fogMod * 10;
        const [r, g, b] = this.hslToRgb(hue, sat, light);
        const alpha = 0.7 * fade;
        data[i] = this.blend(data[i], r, alpha);
        data[i + 1] = this.blend(data[i + 1], g, alpha);
        data[i + 2] = this.blend(data[i + 2], b, alpha);
        if (mask > this.minNoise && mask < this.maxNoise) {
          const fogStrength = 200 + fogMod * 55;
          const fogAlpha = (1 - mask) * 0.35;
          data[i] = this.blend(data[i], fogStrength, fogAlpha);
          data[i + 1] = this.blend(data[i + 1], fogStrength, fogAlpha);
          data[i + 2] = this.blend(data[i + 2], fogStrength, fogAlpha);
        }
      }
    }
    this.ctx.putImageData(imgData, 0, 0);
    console.log("\n✅ Fractal generation complete.");
  }

  drawStarsInFractal(type) {
    const maxStars = 300;
    let starsPlotted = 0,
      attempts = 0;
    const starPositions = [];
    while (starsPlotted < maxStars && attempts < maxStars * 10) {
      const px = Math.floor(Math.random() * this.width);
      const py = Math.floor(Math.random() * this.height);
      const x = (px - this.width / 2) / this.zoom + this.offsetX;
      const y = (py - this.height / 2) / this.zoom + this.offsetY;
      const iter =
        type === "julia"
          ? this.julia(x, y, this.juliaParams.cx, this.juliaParams.cy)
          : this.mandelbrot(x, y);
      if (iter === this.maxIter) {
        const size = Math.random() * 1.4;
        const brighterStar = Math.random() > 0.6;
        const glowSize = brighterStar ? 6 : 4;
        const glow = Math.random() > 0.3;
        starPositions.push({
          x: px,
          y: py,
          radius: glow ? size * glowSize * 1.2 : size * 2,
        });
        if (glow) {
          const gradient = this.ctx.createRadialGradient(
            px,
            py,
            0,
            px,
            py,
            size * glowSize
          );
          gradient.addColorStop(0, "rgba(255, 255, 255, 0.5)");
          gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
          this.ctx.fillStyle = gradient;
          this.ctx.beginPath();
          this.ctx.arc(px, py, size * glowSize, 0, Math.PI * 2);
          this.ctx.fill();
        }
        this.ctx.fillStyle = brighterStar
          ? "rgba(255, 255, 255, 1.0)"
          : "rgba(255, 255, 255, 0.85)";
        this.ctx.beginPath();
        this.ctx.arc(px, py, size, 0, Math.PI * 2);
        this.ctx.fill();
        starsPlotted++;
      }
      attempts++;
    }
    this.starPositions = starPositions;
  }

  // Julia-Formel: zₙ₊₁ = zₙ² + c, wobei zₙ = x + iy (c ist eine konstante komplexe Zahl)
  julia(x, y, cx, cy) {
    let zx = x,
      zy = y,
      iter = 0;
    while (zx * zx + zy * zy < 4 && iter < this.maxIter) {
      const xtemp = zx * zx - zy * zy + cx;
      zy = 2 * zx * zy + cy;
      zx = xtemp;
      iter++;
    }
    return iter;
  }

  render(
    type = "mandelbrot",
    outputDir = "images",
    filename = "fractal_fog.png"
  ) {
    this.ctx.fillStyle = "rgb(0, 0, 10)";
    this.ctx.fillRect(0, 0, this.width, this.height);
    this.drawPerlinNoiseBackground();
    this.drawFractal(type);
    this.drawStarsInFractal(type);
    this.applyFogLayer();

    const imgData = this.ctx.getImageData(0, 0, this.width, this.height);
    const data = imgData.data;
    for (let px = 0; px < this.width; px++) {
      for (let py = 0; py < this.height; py++) {
        const pixelIndex = py * this.width + px;
        let skipFog = false;
        for (const star of this.starPositions) {
          const distance = Math.sqrt((px - star.x) ** 2 + (py - star.y) ** 2);
          if (distance <= star.radius) {
            skipFog = true;
            break;
          }
        }
        if (this.keepBlackAreasClear && !this.coloredAreas[pixelIndex]) {
          skipFog = true;
        }
        if (!skipFog) {
          const i = pixelIndex * 4;
          const noise = this.noise2D(px * 0.005, py * 0.005) * 0.5 + 0.5;
          const fogAmount = noise * 12;
          data[i] = Math.min(255, data[i] + fogAmount);
          data[i + 1] = Math.min(255, data[i + 1] + fogAmount);
          data[i + 2] = Math.min(255, data[i + 2] + fogAmount);
        }
      }
    }
    this.ctx.putImageData(imgData, 0, 0);
    const out = fs.createWriteStream(`${outputDir}/${filename}`);
    const stream = this.canvas.createPNGStream();
    stream.pipe(out);
    out.on("finish", () => {
      console.log(`✅ Image saved: ${filename}`);
    });
  }
}

(async () => {
 const answers = await inquirer.prompt([
   {
     type: "list",
     name: "type",
     message: "Fractal type:",
     choices: ["mandelbrot", "julia"],
     default: "mandelbrot",
   },
   {
     type: "input",
     name: "zoom",
     message: "Zoom:",
     default: "300",
     validate: (input) => {
       const v = parseFloat(input);
       return !isNaN(v) && v > 0 ? true : "Bitte eine positive Zahl eingeben.";
     },
   },
   {
     type: "input",
     name: "offsetX",
     message: "Offset X:",
     default: "-0.75",
     validate: (input) =>
       !isNaN(parseFloat(input)) || "Bitte eine gültige Zahl eingeben.",
   },
   {
     type: "input",
     name: "offsetY",
     message: "Offset Y:",
     default: "0",
     validate: (input) =>
       !isNaN(parseFloat(input)) || "Bitte eine gültige Zahl eingeben.",
   },
   {
     type: "input",
     name: "iterations",
     message: "Iterations:",
     default: "100",
     validate: (input) => {
       const v = parseInt(input);
       return !isNaN(v) && v > 0 && v <= 10000
         ? true
         : "Bitte eine ganze Zahl zwischen 1 und 10000 eingeben.";
     },
   },
   {
     type: "input",
     name: "cx",
     message: "Julia cx:",
     default: "-0.8",
     validate: (input) =>
       !isNaN(parseFloat(input)) || "Bitte eine gültige Zahl eingeben.",
     when: (answers) => answers.type === "julia",
   },
   {
     type: "input",
     name: "cy",
     message: "Julia cy:",
     default: "0.156",
     validate: (input) =>
       !isNaN(parseFloat(input)) || "Bitte eine gültige Zahl eingeben.",
     when: (answers) => answers.type === "julia",
   },
   {
     type: "input",
     name: "baseHue",
     message: "Base Hue (color tone):",
     default: "200",
     validate: (input) => {
       const v = parseFloat(input);
       return !isNaN(v) && v >= 0 && v <= 360
         ? true
         : "Bitte eine Zahl zwischen 0 und 360 eingeben.";
     },
   },
   {
     type: "input",
     name: "saturation",
     message: "Saturation (%):",
     default: "70",
     validate: (input) => {
       const v = parseFloat(input);
       return !isNaN(v) && v >= 0 && v <= 100
         ? true
         : "Bitte eine Zahl zwischen 0 und 100 eingeben.";
     },
   },
   {
     type: "input",
     name: "lightness",
     message: "Base brightness (%):",
     default: "30",
     validate: (input) => {
       const v = parseFloat(input);
       return !isNaN(v) && v >= 0 && v <= 100
         ? true
         : "Bitte eine Zahl zwischen 0 und 100 eingeben.";
     },
   },
   {
     type: "input",
     name: "patternStrength",
     message: "Pattern intensity:",
     default: "20",
     validate: (input) =>
       !isNaN(parseFloat(input)) || "Bitte eine gültige Zahl eingeben.",
   },
   {
     type: "input",
     name: "minNoise",
     message: "Min noise for cloud effect:",
     default: "0.2",
     validate: (input) => {
       const v = parseFloat(input);
       return !isNaN(v) && v >= 0 && v <= 1
         ? true
         : "Bitte eine Zahl zwischen 0 und 1 eingeben.";
     },
   },
   {
     type: "input",
     name: "maxNoise",
     message: "Max noise for cloud effect:",
     default: "0.8",
     validate: (input) => {
       const v = parseFloat(input);
       return !isNaN(v) && v >= 0 && v <= 1
         ? true
         : "Bitte eine Zahl zwischen 0 und 1 eingeben.";
     },
   },
   {
     type: "input",
     name: "fogDensity",
     message: "Fog density (0.1–0.8):",
     default: "0.4",
     validate: (input) => {
       const v = parseFloat(input);
       return !isNaN(v) && v >= 0.1 && v <= 0.8
         ? true
         : "Bitte eine Zahl zwischen 0.1 und 0.8 eingeben.";
     },
   },
   {
     type: "input",
     name: "fogSize",
     message: "Fog structure size (0.001–0.05):",
     default: "0.01",
     validate: (input) => {
       const v = parseFloat(input);
       return !isNaN(v) && v >= 0.001 && v <= 0.05
         ? true
         : "Bitte eine Zahl zwischen 0.001 und 0.05 eingeben.";
     },
   },
   {
     type: "input",
     name: "fogLayerCount",
     message: "Fog layers (1–8):",
     default: "5",
     validate: (input) => {
       const v = parseInt(input);
       return !isNaN(v) && v >= 1 && v <= 8
         ? true
         : "Bitte eine ganze Zahl zwischen 1 und 8 eingeben.";
     },
   },
   {
     type: "input",
     name: "starClarity",
     message: "Star clarity (0.5–2.0):",
     default: "1.0",
     validate: (input) => {
       const v = parseFloat(input);
       return !isNaN(v) && v >= 0.5 && v <= 2.0
         ? true
         : "Bitte eine Zahl zwischen 0.5 und 2.0 eingeben.";
     },
   },
   {
     type: "confirm",
     name: "keepBlackAreasClear",
     message: "Keep black areas without fog?",
     default: true,
   },
 ]);


  const config = {
    zoom: parseFloat(answers.zoom),
    offsetX: parseFloat(answers.offsetX),
    offsetY: parseFloat(answers.offsetY),
    iterations: parseInt(answers.iterations),
    cx: parseFloat(answers.cx),
    cy: parseFloat(answers.cy),
    baseHue: parseFloat(answers.baseHue),
    saturation: parseFloat(answers.saturation),
    lightness: parseFloat(answers.lightness),
    patternStrength: parseFloat(answers.patternStrength),
    minNoise: parseFloat(answers.minNoise),
    maxNoise: parseFloat(answers.maxNoise),
    fogDensity: parseFloat(answers.fogDensity),
    fogSize: parseFloat(answers.fogSize),
    fogLayerCount: parseInt(answers.fogLayerCount),
    starClarity: parseFloat(answers.starClarity),
    keepBlackAreasClear: answers.keepBlackAreasClear,
  };

  const generator = new FractalGenerator(config);
  const filename = `fractal_fog_${answers.type}.png`;
  generator.render(answers.type, "images", filename);
})();

import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const baseUrl = new URL(process.env.VERIFY_URL ?? "http://127.0.0.1:4173/");
baseUrl.searchParams.set("verify", "1");
const outputDir = new URL("../artifacts/", import.meta.url);

const viewports = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
];

await mkdir(outputDir, { recursive: true });

const browser = await chromium.launch();
const failures = [];

for (const viewport of viewports) {
  const page = await browser.newPage({ viewport });
  const consoleErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });

  await page.goto(baseUrl.href, { waitUntil: "networkidle" });
  await page.waitForSelector("#scene-canvas");
  await page.waitForTimeout(700);

  const metrics = await page.evaluate(async () => {
    const canvas = document.querySelector("#scene-canvas");
    const gl = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
    const visibleCount = document.querySelector("#visible-count")?.textContent ?? "";
    const layerCount = document.querySelectorAll(".layer-toggle").length;
    const labelCount = document.querySelectorAll(".object-label:not([hidden])").length;

    if (!gl) {
      return { hasContext: false, visibleCount, layerCount, labelCount, nonBlankSamples: 0, variance: 0 };
    }

    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

    const snapshot = document.createElement("canvas");
    snapshot.width = canvas.width;
    snapshot.height = canvas.height;
    const context = snapshot.getContext("2d", { willReadFrequently: true });
    context.drawImage(canvas, 0, 0);

    const samples = [
      [0.5, 0.5],
      [0.42, 0.54],
      [0.58, 0.45],
      [0.5, 0.34],
      [0.36, 0.62],
      [0.64, 0.62],
      [0.24, 0.42],
      [0.76, 0.58],
    ];

    const colors = [];
    for (const [xRatio, yRatio] of samples) {
      const pixel = context.getImageData(
        Math.floor(snapshot.width * xRatio),
        Math.floor(snapshot.height * yRatio),
        1,
        1,
      ).data;
      colors.push([...pixel]);
    }

    const nonBlankSamples = colors.filter(([r, g, b, a]) => a > 0 && r + g + b > 24).length;
    const channelValues = colors.flatMap(([r, g, b]) => [r, g, b]);
    const min = Math.min(...channelValues);
    const max = Math.max(...channelValues);

    return {
      hasContext: true,
      visibleCount,
      layerCount,
      labelCount,
      width: snapshot.width,
      height: snapshot.height,
      nonBlankSamples,
      variance: max - min,
    };
  });

  const screenshotPath = fileURLToPath(new URL(`${viewport.name}.png`, outputDir));
  await page.screenshot({ path: screenshotPath, fullPage: true });
  await page.close();

  if (!metrics.hasContext) {
    failures.push(`${viewport.name}: WebGL context was not available`);
  }
  if (metrics.nonBlankSamples < 3 || metrics.variance < 8) {
    failures.push(`${viewport.name}: canvas pixel sample looks blank (${JSON.stringify(metrics)})`);
  }
  if (metrics.layerCount !== 10 || metrics.visibleCount !== "10/10") {
    failures.push(`${viewport.name}: layer UI state was unexpected (${JSON.stringify(metrics)})`);
  }
  if (consoleErrors.length > 0) {
    failures.push(`${viewport.name}: console errors: ${consoleErrors.join(" | ")}`);
  }

  console.log(`${viewport.name}: ${JSON.stringify(metrics)} screenshot=${screenshotPath}`);
}

await browser.close();

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exit(1);
}

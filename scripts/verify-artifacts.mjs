#!/usr/bin/env node
/**
 * Playwright verification script for portrait mobile scrolling.
 * Tests that hotspots are reachable on narrow screens via horizontal scroll.
 */

import { chromium, devices } from "@playwright/test";
import { spawn } from "child_process";
import { mkdir, rm } from "fs/promises";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const ARTIFACTS_DIR = join(ROOT, "test-artifacts");
const PORT = 3099;
const BASE_URL = `http://localhost:${PORT}`;

const summary = {
  passed: [],
  failed: [],
  skipped: [],
};

async function startServer() {
  return new Promise((resolve, reject) => {
    const server = spawn("npm", ["run", "start", "--", "-p", String(PORT)], {
      cwd: ROOT,
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, NODE_ENV: "production" },
    });

    let output = "";
    const timeout = setTimeout(() => {
      reject(new Error("Server startup timeout"));
    }, 30000);

    server.stdout.on("data", (data) => {
      output += data.toString();
      if (output.includes("Ready") || output.includes(`localhost:${PORT}`)) {
        clearTimeout(timeout);
        resolve(server);
      }
    });

    server.stderr.on("data", (data) => {
      output += data.toString();
    });

    server.on("error", (err) => {
      clearTimeout(timeout);
      reject(err);
    });

    server.on("exit", (code) => {
      if (code !== 0 && code !== null) {
        clearTimeout(timeout);
        reject(new Error(`Server exited with code ${code}: ${output}`));
      }
    });
  });
}

async function waitForServer(maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await fetch(BASE_URL);
      if (res.ok) return;
    } catch {
      // ignore
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error("Server did not become ready");
}

function ok(name) {
  console.log(`ok - ${name}`);
  summary.passed.push(name);
}

function fail(name, reason) {
  console.log(`FAIL - ${name}: ${reason}`);
  summary.failed.push({ name, reason });
}

function skip(name, reason) {
  console.log(`skip - ${name}: ${reason}`);
  summary.skipped.push({ name, reason });
}

async function getHotspotBounds(page, selector) {
  return page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    return {
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
      centerX: rect.x + rect.width / 2,
      centerY: rect.y + rect.height / 2,
      visible: rect.x + rect.width > 0 && rect.x < window.innerWidth,
    };
  }, selector);
}

async function scrollHotspotIntoView(page, selector, viewport) {
  const stage = await page.$(".stage");
  if (!stage) throw new Error("Stage not found");

  const scrollInfo = await page.evaluate(() => {
    const s = document.querySelector(".stage");
    return {
      scrollLeft: s?.scrollLeft ?? 0,
      scrollWidth: s?.scrollWidth ?? 0,
      clientWidth: s?.clientWidth ?? 0,
    };
  });

  const hotspot = await getHotspotBounds(page, selector);
  if (!hotspot) throw new Error(`Hotspot ${selector} not found`);

  if (hotspot.visible) return hotspot;

  const targetScroll = await page.evaluate(
    ({ sel }) => {
      const stage = document.querySelector(".stage");
      const hotspot = document.querySelector(sel);
      if (!stage || !hotspot) return 0;

      const rect = hotspot.getBoundingClientRect();
      const stageRect = stage.getBoundingClientRect();
      const currentScroll = stage.scrollLeft;
      const hotspotCenterInStage = rect.x - stageRect.x + currentScroll + rect.width / 2;
      const targetScroll = hotspotCenterInStage - stage.clientWidth / 2;
      return Math.max(0, Math.min(targetScroll, stage.scrollWidth - stage.clientWidth));
    },
    { sel: selector }
  );

  await page.evaluate(
    ({ scroll }) => {
      const stage = document.querySelector(".stage");
      if (stage) stage.scrollTo({ left: scroll, behavior: "instant" });
    },
    { scroll: targetScroll }
  );

  await page.waitForTimeout(100);
  return getHotspotBounds(page, selector);
}

async function testPortraitDevice(browser, deviceConfig, deviceName) {
  const context = await browser.newContext({
    ...deviceConfig,
    hasTouch: true,
  });
  const page = await context.newPage();

  const tests = [
    { name: "tape", selector: ".hotspot-tape", hash: "video", expectedHash: "video" },
    { name: "book", selector: ".hotspot-book", hash: "books", expectedHash: "books" },
    { name: "record", selector: ".hotspot-record", hash: "records", expectedHash: "records" },
  ];

  for (const test of tests) {
    const testName = `${deviceName}: scroll to ${test.name} hotspot and tap`;
    try {
      await page.goto(BASE_URL, { waitUntil: "networkidle" });
      await page.waitForTimeout(500);

      const hotspot = await scrollHotspotIntoView(page, test.selector, deviceConfig.viewport);

      if (!hotspot || !hotspot.visible) {
        fail(testName, `Hotspot not visible after scroll (bounds: ${JSON.stringify(hotspot)})`);
        continue;
      }

      await page.screenshot({
        path: join(ARTIFACTS_DIR, `${deviceName.replace(/\//g, "-")}-${test.name}-scrolled.png`),
      });

      await page.tap(test.selector);
      await page.waitForTimeout(300);

      const currentHash = await page.evaluate(() => window.location.hash);
      if (currentHash === `#${test.expectedHash}`) {
        ok(testName);
      } else {
        fail(testName, `Expected hash #${test.expectedHash}, got ${currentHash}`);
      }

      await page.screenshot({
        path: join(ARTIFACTS_DIR, `${deviceName.replace(/\//g, "-")}-${test.name}-tapped.png`),
      });
    } catch (err) {
      fail(testName, err.message);
    }
  }

  const hintTestName = `${deviceName}: scroll hint appears`;
  try {
    await page.goto(BASE_URL, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);

    const hintVisible = await page.evaluate(() => {
      const hint = document.querySelector(".scroll-hint");
      if (!hint) return false;
      const style = window.getComputedStyle(hint);
      return style.opacity !== "0" && style.display !== "none";
    });

    if (hintVisible) {
      ok(hintTestName);
    } else {
      fail(hintTestName, "Scroll hint not visible");
    }
  } catch (err) {
    fail(hintTestName, err.message);
  }

  const initialScrollName = `${deviceName}: initial scroll position centers on video`;
  try {
    await page.goto(BASE_URL, { waitUntil: "networkidle" });
    await page.waitForTimeout(500);

    const tapeHotspot = await getHotspotBounds(page, ".hotspot-tape");
    if (tapeHotspot && tapeHotspot.visible) {
      ok(initialScrollName);
    } else {
      fail(initialScrollName, `Tape hotspot not initially visible (bounds: ${JSON.stringify(tapeHotspot)})`);
    }

    await page.screenshot({
      path: join(ARTIFACTS_DIR, `${deviceName.replace(/\//g, "-")}-initial-scroll.png`),
    });
  } catch (err) {
    fail(initialScrollName, err.message);
  }

  for (const targetHash of ["records", "books"]) {
    const deepLinkName = `${deviceName}: deep link #${targetHash} scrolls to correct position`;
    try {
      await page.goto(`${BASE_URL}#${targetHash}`, { waitUntil: "networkidle" });
      await page.waitForTimeout(500);

      const selector = targetHash === "records" ? ".hotspot-record" : ".hotspot-book";
      const hotspot = await getHotspotBounds(page, selector);

      if (hotspot && hotspot.visible) {
        ok(deepLinkName);
      } else {
        fail(deepLinkName, `Hotspot not visible for deep link (bounds: ${JSON.stringify(hotspot)})`);
      }

      await page.screenshot({
        path: join(ARTIFACTS_DIR, `${deviceName.replace(/\//g, "-")}-deeplink-${targetHash}.png`),
      });
    } catch (err) {
      fail(deepLinkName, err.message);
    }
  }

  await context.close();
}

async function testDesktop(browser) {
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });
  const page = await context.newPage();

  const testName = "desktop 1920x1080: all hotspots visible without scroll";
  try {
    await page.goto(BASE_URL, { waitUntil: "networkidle" });
    await page.waitForTimeout(500);

    const hotspots = [".hotspot-tape", ".hotspot-book", ".hotspot-record"];
    let allVisible = true;

    for (const selector of hotspots) {
      const bounds = await getHotspotBounds(page, selector);
      if (!bounds || !bounds.visible) {
        allVisible = false;
        break;
      }
    }

    const scrollInfo = await page.evaluate(() => {
      const stage = document.querySelector(".stage");
      return {
        scrollWidth: stage?.scrollWidth ?? 0,
        clientWidth: stage?.clientWidth ?? 0,
        hasHorizontalScroll: (stage?.scrollWidth ?? 0) > (stage?.clientWidth ?? 0),
      };
    });

    const hintExists = await page.evaluate(() => {
      const hint = document.querySelector(".scroll-hint");
      if (!hint) return false;
      const style = window.getComputedStyle(hint);
      return style.display !== "none";
    });

    if (allVisible && !hintExists) {
      ok(testName);
    } else {
      fail(testName, `Visible: ${allVisible}, Hint shown: ${hintExists}`);
    }

    await page.screenshot({
      path: join(ARTIFACTS_DIR, "desktop-1920x1080.png"),
    });
  } catch (err) {
    fail(testName, err.message);
  }

  await context.close();
}

async function testLandscapePhone(browser) {
  const context = await browser.newContext({
    viewport: { width: 812, height: 375 },
    hasTouch: true,
    userAgent: devices["iPhone 12"].userAgent,
  });
  const page = await context.newPage();

  const testName = "landscape phone 812x375: all hotspots visible, no scroll needed";
  try {
    await page.goto(BASE_URL, { waitUntil: "networkidle" });
    await page.waitForTimeout(500);

    const hotspots = [".hotspot-tape", ".hotspot-book", ".hotspot-record"];
    let allVisible = true;

    for (const selector of hotspots) {
      const bounds = await getHotspotBounds(page, selector);
      if (!bounds || !bounds.visible) {
        allVisible = false;
        break;
      }
    }

    const scrollInfo = await page.evaluate(() => {
      const stage = document.querySelector(".stage");
      return {
        scrollWidth: stage?.scrollWidth ?? 0,
        clientWidth: stage?.clientWidth ?? 0,
        overflowX: window.getComputedStyle(stage).overflowX,
      };
    });

    if (allVisible) {
      ok(testName);
    } else {
      fail(testName, `Not all hotspots visible. Scroll info: ${JSON.stringify(scrollInfo)}`);
    }

    await page.screenshot({
      path: join(ARTIFACTS_DIR, "landscape-phone-812x375.png"),
    });
  } catch (err) {
    fail(testName, err.message);
  }

  await context.close();
}

async function testNoVerticalScroll(browser) {
  const context = await browser.newContext({
    viewport: { width: 375, height: 812 },
    hasTouch: true,
    userAgent: devices["iPhone 12"].userAgent,
  });
  const page = await context.newPage();

  const testName = "375x812: no vertical scroll or jiggle";
  try {
    await page.goto(BASE_URL, { waitUntil: "networkidle" });
    await page.waitForTimeout(500);

    const initialScrollTop = await page.evaluate(() => window.scrollY);

    await page.evaluate(() => {
      window.scrollTo(0, 100);
    });
    await page.waitForTimeout(100);

    const afterScrollTop = await page.evaluate(() => window.scrollY);

    const bodyScrollable = await page.evaluate(() => {
      const body = document.body;
      const html = document.documentElement;
      return (
        body.scrollHeight > window.innerHeight || html.scrollHeight > window.innerHeight
      );
    });

    if (initialScrollTop === 0 && afterScrollTop === 0 && !bodyScrollable) {
      ok(testName);
    } else {
      fail(
        testName,
        `Vertical scroll detected. Initial: ${initialScrollTop}, After: ${afterScrollTop}, Body scrollable: ${bodyScrollable}`
      );
    }
  } catch (err) {
    fail(testName, err.message);
  }

  await context.close();
}

async function main() {
  console.log("Starting verification...\n");

  await rm(ARTIFACTS_DIR, { recursive: true, force: true });
  await mkdir(ARTIFACTS_DIR, { recursive: true });

  let server;
  try {
    console.log("Starting production server...");
    server = await startServer();
    await waitForServer();
    console.log("Server ready.\n");
  } catch (err) {
    console.error("Failed to start server:", err.message);
    process.exit(1);
  }

  const browser = await chromium.launch({ headless: true });

  try {
    await testPortraitDevice(
      browser,
      { viewport: { width: 375, height: 812 }, userAgent: devices["iPhone 12"].userAgent },
      "375x812"
    );

    await testPortraitDevice(
      browser,
      { viewport: { width: 320, height: 568 }, userAgent: devices["iPhone SE"].userAgent },
      "320x568"
    );

    await testDesktop(browser);
    await testLandscapePhone(browser);
    await testNoVerticalScroll(browser);
  } finally {
    await browser.close();
    if (server) {
      server.kill("SIGTERM");
    }
  }

  console.log("\n--- Summary ---");
  console.log(JSON.stringify(summary, null, 2));

  const total = summary.passed.length + summary.failed.length + summary.skipped.length;
  console.log(`\nTotal: ${total}, Passed: ${summary.passed.length}, Failed: ${summary.failed.length}, Skipped: ${summary.skipped.length}`);

  if (summary.failed.length > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

// Copyright 2026 Adam Petcher
// SPDX-License-Identifier: Apache-2.0

import { existsSync } from "node:fs";
import { readFile, readdir, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const OUTPUTS = ["THIRD_PARTY_NOTICES.md", "public/legal/THIRD_PARTY_NOTICES.txt"];
const LICENSE_PATTERN = /^(?:licen[cs]e|copying|notice)(?:\..*)?$/i;

async function firstLicenseFile(directory) {
  try {
    const names = (await readdir(join(ROOT, directory))).filter((name) => LICENSE_PATTERN.test(name)).sort();
    return names[0] ? join(directory, names[0]) : null;
  } catch {
    return null;
  }
}

async function licenseSource(packagePath, licenseExpression) {
  const ownLicense = await firstLicenseFile(packagePath);
  if (ownLicense) return ownLicense;
  if (packagePath.includes("sharp-libvips")) return "third_party/libvips/LGPL-3.0.txt";
  if (packagePath.includes("sharp")) return "node_modules/sharp/LICENSE";
  if (packagePath.includes("@next/") || packagePath.endsWith("client-only")) return "node_modules/next/license.md";
  throw new Error(`No license text found for ${packagePath} (${licenseExpression ?? "unknown license"})`);
}

function packageName(packagePath) {
  return packagePath.split("node_modules/").at(-1) ?? basename(packagePath);
}

function normalizedLicenseText(text) {
  return text.replace(/\r\n/g, "\n").replace(/[ \t]+$/gm, "").trim();
}

export async function generateThirdPartyNotices() {
  const lock = JSON.parse(await readFile(join(ROOT, "package-lock.json"), "utf8"));
  const packages = Object.entries(lock.packages)
    .filter(([packagePath, metadata]) => packagePath && !metadata.dev && existsSync(join(ROOT, packagePath)))
    .sort(([left], [right]) => left.localeCompare(right));
  const licenseGroups = new Map();

  for (const [packagePath, metadata] of packages) {
    const source = await licenseSource(packagePath, metadata.license);
    const text = normalizedLicenseText(await readFile(join(ROOT, source), "utf8"));
    const group = licenseGroups.get(text) ?? { packages: [], source };
    group.packages.push(`${packageName(packagePath)} ${metadata.version} (${metadata.license})`);
    licenseGroups.set(text, group);
  }

  const geistLicense = normalizedLicenseText(await readFile(join(ROOT, "third_party/geist/OFL.txt"), "utf8"));
  licenseGroups.set(geistLicense, {
    packages: ["Geist and Geist Mono fonts (SIL-OFL-1.1)"],
    source: "third_party/geist/OFL.txt",
  });

  const sections = [...licenseGroups.entries()].map(([licenseText, group], index) => [
    `## License group ${index + 1}`,
    "",
    ...group.packages.map((entry) => `- ${entry}`),
    "",
    `License text source in the source distribution: \`${group.source}\``,
    "",
    "```text",
    licenseText,
    "```",
  ].join("\n"));

  const notice = [
    "# LeanQuest third-party notices",
    "",
    "LeanQuest includes the third-party software and fonts listed below. These components are not covered by LeanQuest's Apache 2.0 license; each remains subject to its listed license and copyright notice.",
    "",
    "This inventory is generated from the installed production packages recorded in `package-lock.json`. It is regenerated before every production build so the deployed notice includes the platform-specific packages shipped by that build.",
    "",
    ...sections,
    "",
  ].join("\n");

  await Promise.all(OUTPUTS.map((output) => writeFile(join(ROOT, output), notice)));
  await writeFile(join(ROOT, "public/legal/APACHE-2.0.txt"), await readFile(join(ROOT, "LICENSE")));
  return notice;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await generateThirdPartyNotices();
}

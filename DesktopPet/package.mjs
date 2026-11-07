import { page } from './page.mjs';
import { mkdirSync, mkdtempSync, rmSync, copyFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';

const buildFolder = mkdtempSync(join(tmpdir(), 'ghosty-build-'));
const launcher = join(buildFolder, 'launcher');
// Build both architectures so the same ZIP works on Intel and Apple silicon.
execFileSync('/Library/Developer/CommandLineTools/usr/bin/clang', [
  '-isysroot', '/Library/Developer/CommandLineTools/SDKs/MacOSX.sdk',
  '-arch', 'arm64', '-arch', 'x86_64', '-mmacosx-version-min=11.0', '-fobjc-arc',
  '-framework', 'Cocoa', fileURLToPath(new URL('launcher.m', import.meta.url)),
  '-o', launcher
]);
for (const name of ['Ghosty', 'Bat', 'Skeleton', 'Bunny', 'Turtle', 'Hedgehog']) {
  const app = join(buildFolder, name + '.app');
  const destination = fileURLToPath(new URL('../' + name + '.app', import.meta.url));
  const contents = join(app, 'Contents');
  const resources = join(contents, 'Resources');
  mkdirSync(resources, { recursive: true });
  mkdirSync(join(contents, 'MacOS'), { recursive: true });
  writeFileSync(join(resources, 'pet.html'), page.replace('data-pet="ghosty"', 'data-pet="' + name.toLowerCase() + '"'));
  copyFileSync(new URL('window.js', import.meta.url), join(resources, 'window.js'));
  copyFileSync(launcher, join(contents, 'MacOS', name));
  writeFileSync(join(contents, 'Info.plist'), `<?xml version="1.0" encoding="UTF-8"?>
  <plist version="1.0"><dict>
  <key>CFBundleIdentifier</key><string>local.${name.toLowerCase()}.desktop-pet</string>
  <key>CFBundleName</key><string>${name}</string>
  <key>CFBundleExecutable</key><string>${name}</string>
  <key>CFBundlePackageType</key><string>APPL</string>
  <key>LSMinimumSystemVersion</key><string>11.0</string>
  <key>CFBundleVersion</key><string>8</string>
  <key>CFBundleShortVersionString</key><string>1.6.0</string>
  <key>LSUIElement</key><true/>
  </dict></plist>
  `);
  execFileSync('/usr/bin/codesign', ['--force', '--sign', '-', app], {stdio:'inherit'});
  rmSync(join(destination, 'Contents', '_CodeSignature'), { recursive: true, force: true });
  execFileSync('/usr/bin/ditto', ['--norsrc', app, destination]);
}
rmSync(buildFolder, { recursive: true, force: true });

/**
 * PostBuild.js - Next.js version
 *
 * Mirrors the React PostBuild logic but adapted for Next.js output structure.
 *
 * Next.js build output:
 *   .next/static/css/       --> hashed CSS chunks
 *   .next/static/chunks/    --> hashed JS chunks
 *
 * This script:
 *   1. Finds the new hashed CSS / JS file names from the Next.js build output
 *   2. Updates the blade.php layout file (replaces old hashed names with new ones)
 *   3. Copies the full .next build folder to the internal server share
 */

const fs   = require('fs');
const path = require('path');
const fse  = require('fs-extra');

const { updateFile, getFileNameFromDirectory, extractOldFileNames } = require('./OtherModules');

// ─── CONFIG ──────────────────────────────────────────────────────────────────

/** Blade layout file that references the hashed asset names */
const reactChatFilePath =
  '\\\\172.21.4.102\\html\\medicallink\\resources\\views\\layouts\\footers\\react_chat.blade.php';

/**
 * Next.js puts CSS in:  .next/static/css/
 * Next.js puts JS  in:  .next/static/chunks/pages/   (main app entry is usually "_app-<hash>.js")
 *
 * Adjust the JS sub-path below if your entry chunk lives elsewhere,
 * e.g. .next/static/chunks/ for the main framework bundle.
 */
const nextOutputDir = path.join(__dirname, '.next');
const buildCssDir   = path.join(nextOutputDir, 'static/css');
const buildJsDir    = path.join(nextOutputDir, 'static/chunks/pages'); // change if needed

/** Destination folder on the internal server share */
const chatModDir = '\\\\172.21.4.102\\html\\medicallink\\resources\\chat-mod';

// ─── HELPERS ─────────────────────────────────────────────────────────────────

/**
 * Recursively copies srcDir → destDir using fs-extra.
 * For Next.js you MUST copy the entire .next folder (not just static assets)
 * because the server needs the compiled page bundles.
 */
function copyBuildFiles(srcDir, destDir) {
  console.log(`\nCopying build output...\n  FROM: ${srcDir}\n  TO  : ${destDir}`);

  fse.copy(srcDir, destDir, { overwrite: true }, err => {
    if (err) {
      return console.error(`Error copying files: ${err}`);
    }
    console.log(`\n✅ Build files successfully copied to ${destDir}`);
  });
}

// ─── ALSO COPY public/ and next.config.js ────────────────────────────────────
// Next.js needs these alongside .next/ to run on the server.

function copyExtraFiles() {
  const extras = [
    { src: path.join(__dirname, 'public'),         dest: path.join(chatModDir, 'public') },
    { src: path.join(__dirname, 'next.config.js'), dest: path.join(chatModDir, 'next.config.js') },
    { src: path.join(__dirname, 'package.json'),   dest: path.join(chatModDir, 'package.json') },
  ];

  extras.forEach(({ src, dest }) => {
    if (fs.existsSync(src)) {
      fse.copy(src, dest, { overwrite: true }, err => {
        if (err) console.warn(`Warning: could not copy ${src}: ${err.message}`);
        else console.log(`  Copied: ${src} → ${dest}`);
      });
    } else {
      console.warn(`  Skipped (not found): ${src}`);
    }
  });
}

// ─── MAIN ────────────────────────────────────────────────────────────────────

// 1. Resolve new hashed file names from the Next.js build output
//    getFileNameFromDirectory should return the filename (not full path) of the
//    first file matching the prefix in that directory.
const newCssFileName = getFileNameFromDirectory(buildCssDir, '');   // CSS files have no predictable prefix in Next.js; pass '' or adjust
const newJsFileName  = getFileNameFromDirectory(buildJsDir,  '_app'); // Next.js page entry is typically _app-<hash>.js

if (newCssFileName && newJsFileName) {
  // 2. Read blade file and extract old hashed names
  const fileContent = fs.readFileSync(reactChatFilePath, 'utf-8');
  const { oldCssFileName, oldJsFileName } = extractOldFileNames(fileContent);

  if (oldCssFileName && oldJsFileName) {
    // 3. Replace old hashed names with new ones in the blade file
    updateFile(reactChatFilePath, oldCssFileName, newCssFileName, oldJsFileName, newJsFileName);

    // 4. Copy .next/ build folder to the server share
    copyBuildFiles(nextOutputDir, chatModDir);

    // 5. Copy supporting files the Next.js server needs
    copyExtraFiles();

  } else {
    console.error('❌ Error: Could not find old CSS or JS file names in the blade file.');
    process.exit(1);
  }

} else {
  console.error('❌ Error: Could not find new CSS or JS file in the Next.js build output.');
  console.error(`   CSS dir checked : ${buildCssDir}`);
  console.error(`   JS  dir checked : ${buildJsDir}`);
  process.exit(1);
}
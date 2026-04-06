const fs = require('fs');
const fse = require('fs-extra');
const path = require('path');
const { updateFile, getFileNameFromDirectory, extractOldFileNames } = require('./OtherModules');

// Paths
const paths = {
  buildDir: path.join(__dirname, 'build'),
  toLiveDir: path.join(__dirname, 'toLive'),
  staticDir: path.join(__dirname, 'build', 'static'),
  reactChatFilePath: path.join(__dirname, 'toLive', 'react_chat.blade.php'),
  buildCssDir: path.join(__dirname, 'build', 'static', 'css'),
  buildJsDir: path.join(__dirname, 'build', 'static', 'js'),
};

// Helper: Check and copy folder
async function checkAndCopyFolder(source, destination) {
  if (await fse.pathExists(source)) {
    await fse.remove(destination);
    await fse.copy(source, destination, { overwrite: true });
    console.log(`Folder moved from ${source} to ${destination}`);
    console.log('\\172.21.4.152\santhoshWork\medicallink\chat-app\toLive');
    return true;
  }
  console.log(`Source folder not found: ${source}`);
  return false;
}

// Main Task
async function moveStaticFolder() {
  try {
    await fse.ensureDir(paths.toLiveDir);

    const moved = await checkAndCopyFolder(paths.staticDir, path.join(paths.toLiveDir, 'static'));
    if (!moved) return;

    const fileContent = fs.readFileSync(paths.reactChatFilePath, 'utf-8');
    const { oldCssFileName, oldJsFileName } = extractOldFileNames(fileContent);

    const newCssFileName = getFileNameFromDirectory(paths.buildCssDir, 'main');
    const newJsFileName = getFileNameFromDirectory(paths.buildJsDir, 'main');

    updateFile(paths.reactChatFilePath, oldCssFileName, newCssFileName, oldJsFileName, newJsFileName);
  } catch (err) {
    console.error('Error moving static folder:', err);
  }
}

// Execute
moveStaticFolder();


const fs = require('fs');
/**
 * Updates the file at the specified file path by replacing the old CSS and JS
 * file names with the new ones.
 *
 * @param {string} filePath - The path of the file to update.
 * @param {string} oldCssFileName - The old CSS file name to be replaced.
 * @param {string} newCssFileName - The new CSS file name to replace the old one.
 * @param {string} oldJsFileName - The old JS file name to be replaced.
 * @param {string} newJsFileName - The new JS file name to replace the old one.
 */
function updateFile(filePath, oldCssFileName, newCssFileName, oldJsFileName, newJsFileName) {
    try {
        let content = fs.readFileSync(filePath, 'utf-8');

        // Replace old CSS and JS file paths with new ones
        content = content
            .replace(oldCssFileName, newCssFileName)
            .replace(oldJsFileName, newJsFileName);

        fs.writeFileSync(filePath, content, 'utf-8');
        console.log(`Updated file: ${filePath}`);
    } catch (err) {
        console.error(`Error updating file: ${filePath}`, err);
    }
}

/**
 * Retrieves the file name from the specified directory that starts with the provided file prefix.
 * 
 * @param {string} directory - The directory path where the files are located.
 * @param {string} filePrefix - The prefix that the file name should start with.
 * @returns {string | undefined} - The file name that matches the prefix or undefined if not found.
 */
function getFileNameFromDirectory(directory, filePrefix) {
    const files = fs.readdirSync(directory);
    return files.find(file => file.startsWith(filePrefix));
}


/**
 * Extracts the old CSS and JS file names from the provided file content.
 *
 * @param {string} fileContent - The content of the file to search within.
 * @returns {Object} An object containing the old CSS and JS file names.
 *  - {string | null} oldCssFileName: The old CSS file name found in the content, or null if not found.
 *  - {string | null} oldJsFileName: The old JS file name found in the content, or null if not found.
 */
function extractOldFileNames(fileContent) {
    const cssRegex = /main\.(\w+)\.css/;
    const jsRegex = /main\.(\w+)\.js/;

    const oldCssFileName = fileContent.match(cssRegex) ? fileContent.match(cssRegex)[0] : null;
    const oldJsFileName = fileContent.match(jsRegex) ? fileContent.match(jsRegex)[0] : null;

    return { oldCssFileName, oldJsFileName };
}

module.exports = { updateFile, getFileNameFromDirectory, extractOldFileNames };
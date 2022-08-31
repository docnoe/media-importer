import { globby } from 'globby'
import path from "node:path";
import fs from "node:fs/promises";

const missingListName = 'missingFilesNew.lst'

const sourceFolder = process.argv[2]
const destinationFolder = process.argv[3]
const baseFolder = process.cwd()

console.log(`From ${sourceFolder} to ${destinationFolder} while searching ${baseFolder}`);

const getExistingFileNames = globby('**/*').then((filePaths) => {
  return filePaths.map(file => path.basename(file))
})
const getSourceFilePaths = globby(`**/*`, {cwd: sourceFolder})

const [existingFiles, sourceFiles] = await Promise.all([getExistingFileNames, getSourceFilePaths])

const missing = sourceFiles.reduce((mis, filePath) => {
  const name = path.basename(filePath)
  if (existingFiles.includes(name)) return mis
  mis.push(filePath)
  return mis
}, [])

await fs.writeFile(missingListName, missing.join('\n'))

console.log(`file for rsync written, run the following command to copy ${missing.length} files`);
console.log(`rsync -avR --progress --files-from=${missingListName} "${sourceFolder}" "${destinationFolder}"`);


#!/usr/bin/env node
import { globby } from 'globby'
import path from "node:path";
import fs from "node:fs/promises";
import { copyFile, mkdir, stat, utimes } from 'node:fs/promises';


const missingListName = 'missingFilesNew.lst'

const sourceFolder = process.argv[2]
const importFolder = process.argv[3]
const baseFolder = process.cwd()

console.log(`From ${sourceFolder} to ${importFolder} while searching ${baseFolder}`);

const getExistingFileNames = globby('**/*').then((filePaths) => {
  return filePaths.map(file => path.basename(file))
})

const srcGlob = path.join(sourceFolder, '**', '*').split(path.sep).join(path.posix.sep)

const getSourceFilePaths = globby(srcGlob)

console.log('Creating source files list');
console.log('Creating existing files list');

const [existingFiles, sourceFiles] = await Promise.all([getExistingFileNames, getSourceFilePaths])

const missing = sourceFiles.reduce((mis, filePath) => {
  const name = path.basename(filePath)
  if (existingFiles.includes(name)) { return mis }
  mis.push(filePath)
  return mis
}, [])

console.log(`Copying ${missing.length} files`);

const copyAll = async (params) => {
  
  for (const filePath of missing) {
    const pathFromBase = path.relative(sourceFolder, filePath)
    const destinationFile = path.join(importFolder, pathFromBase)
    const destinationFolder = path.dirname(destinationFile)

    console.log(`${filePath} to ${destinationFile}`);

    const stats = await stat(filePath);

    await mkdir(destinationFolder, { recursive: true });
    await copyFile(filePath, destinationFile);

    await utimes(destinationFile, stats.atime, stats.mtime)
  }
}

copyAll()
//
// console.log(`file for rsync written, run the following command to copy ${missing.length} files`);
// console.log(`rsync -rltgoDvR --progress --files-from=${missingListName} "${sourceFolder}" "${importFolder}"`);


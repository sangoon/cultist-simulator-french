const fs = require("fs");
const jsonic = require("jsonic");
const { readdir, readFile, stat, writeFile, mkdir } = fs.promises;
const { join, extname } = require("path");

const propertyCleaner = /([\{|,]\s?)([a-z|A-Z|0-9|_]*\.[a-z|A-Z|0-9|\.|_]*)(\s?:)/gm;

const cleanup = (text) => {
  const cleanedUp = text.replace(/(\t)/gm, "").replace(propertyCleaner, `$1"$2"$3`);
  return cleanedUp.replace(/(.*})[;|\\]/gm, `$1`);
};

const patchFile = async (filePath) => {
  const text = (await readFile(filePath, "utf-8")).split("\n").join(" ");
  const cleanedUpText = cleanup(text);
  try {
    return JSON.stringify(jsonic(cleanedUpText), null, 2);
  } catch (error) {
    console.error(`Error occured while parsing file ${filePath}`);
    console.error(error);
    return cleanedUpText;
  }
};

const patchFiles = async (dirPath) => {
  dirFiles = await readdir(dirPath);
  dirFiles.forEach(async (file) => {
    try {
      const fileStat = await stat(dirPath + "/" + file);
      if (fileStat.isDirectory()) {
        await patchFiles(join(dirPath, file));
        return;
      }
      if (extname(file) !== ".json") return;
      const filePath = join(__dirname, dirPath, file);
      const outputDirPath = join(
        __dirname,
        "output",
        dirPath.replace(/\.\.\//gm, "")
      );
      const outputFilePath = join(outputDirPath, file);
      await mkdir(outputDirPath, { recursive: true });
      const patchedFile = await patchFile(filePath);
      writeFile(`${outputFilePath}`, patchedFile, "utf-8");
    } catch (error) {
      console.error(`Error occured while fixing file ${join(dirPath, file)}`);
      console.error(error);
    }
  });
};

(async () => {
  await patchFiles("../../Traduction");
  //   await patchFiles("./sample");
})();

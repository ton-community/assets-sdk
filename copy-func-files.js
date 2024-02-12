const fs = require('fs');
const path = require('path');

function copyFiles(srcDir, destDir) {
    fs.readdirSync(srcDir, { withFileTypes: true }).forEach((dirent) => {
        const srcPath = path.join(srcDir, dirent.name);
        const destPath = path.join(destDir, dirent.name);

        if (dirent.isDirectory()) {
            fs.mkdirSync(destPath, { recursive: true });
            copyFiles(srcPath, destPath);
        } else if (dirent.isFile() && path.extname(dirent.name) === '.fc') {
            fs.copyFileSync(srcPath, destPath);
            console.info(`File ${srcPath} copied to ${destPath}.`);
        }
    });
}

copyFiles('src', 'dist');

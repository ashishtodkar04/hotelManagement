const { exec } = require('child_process');
exec('npx eslint --format json src > eslint_out.json', (err, stdout, stderr) => {
  console.log("Done");
});

const fs = require('fs');
const origin = 'https://dmtkpv.github.io/sketches/'
const works = fs.readdirSync('./').filter(dir => /\d{4}-\d{2}-\d{2}/.test(dir));
const links = works.map(work => `- [${work}](${origin}${work}/)`).join('\n');
fs.writeFileSync('./README.md', `# Sketches\n${links}`);

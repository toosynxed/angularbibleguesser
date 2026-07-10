const { writeFile } = require('fs');
const { argv } = require('yargs');

// read environment variables from .env file
require('dotenv').config();

// read the command line arguments passed with yargs
const environment = argv.environment;
const isProduction = environment === 'prod';

if (!process.env.FIREBASE_API_KEY) {
  console.error('All the required environment variables were not provided!');
  process.exit(-1);
}

const targetPath = isProduction
  ? `./src/environments/environment.prod.ts`
  : `./src/environments/environment.ts`;

// we have access to our environment variables
// in the process.env object thanks to dotenv
const environmentFileContent = `
export const environment = {
   production: ${isProduction},
   firebase: {
      apiKey: "${process.env.FIREBASE_API_KEY}",
      authDomain: "angularbetterbibleguesser.firebaseapp.com",
      projectId: "angularbetterbibleguesser",
      storageBucket: "angularbetterbibleguesser.firebasestorage.app",
      messagingSenderId: "108645434073",
      appId: "1:108645434073:web:a9c518c0ba7323321674c8",
      measurementId: "G-GGNBX88D62"
   }
};
`;

// write the content to the respective file
writeFile(targetPath, environmentFileContent, function (err) {
   if (err) {
      console.log(err);
   }
   console.log(`Wrote variables to `);
});

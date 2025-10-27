# Note
In order to connect to your Firebase database, please create a directory

```bash
src/environments
```
Then under the directory, create 2 files:
## File 1:
```bash
environment.ts
```

And fill in your Firebase details:

```bash
export const environment = {
  production: false,
  firebase: {
    apiKey: "API_KEY_HERE",
    authDomain: "FIREBASE_DOMAIN",
    projectId: "FIREBASE_PROJECT_ID",
    storageBucket: "STORAGE_BUCKET",
    messagingSenderId: "SENDER_ID",
    appId: "APP_ID",
    measurementId: "MEASUREMENT_ID"
  }
};
```
## File 2:
```bash
environment.prod.ts
```
And fill in your production Firebase details:
```bash
export const environment = {
  production: true,
  firebase: {
    apiKey: "API_KEY_HERE",
    authDomain: "FIREBASE_DOMAIN",
    projectId: "FIREBASE_PROJECT_ID",
    storageBucket: "STORAGE_BUCKET",
    messagingSenderId: "SENDER_ID",
    appId: "APP_ID",
    measurementId: "MEASUREMENT_ID"
  }
};
```
# Angular basic

[Azure Static Web Apps](https://docs.microsoft.com/azure/static-web-apps/overview) allows you to easily build [Angular](https://angular.io/) apps in minutes. Use this repo with the [Angular quickstart](https://docs.microsoft.com/azure/static-web-apps/getting-started?tabs=angular) to build and customize a new static site.

This project was generated with [Angular CLI](https://github.com/angular/angular-cli).

## Project setup

```bash
npm install
```

### Start the dev server

```bash
npm run swa:start
```

> Note: This command will use the local configuration file `swa-cli.config.json`.

### Run unit tests

```bash
npm test
```

### Run e2e tests

```bash
npm run e2e
```

### Lints and fixes files

```bash
npm run lint
```

### Compiles and minifies for production

```bash
npm run build
```

### Login to Azure

```bash
npm run swa:login
```

### Deploy to Azure

```bash
npm run swa:deploy
```


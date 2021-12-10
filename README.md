## ######################         KAOC - Our Project READ ME       ######################

All documentation is moved to onenote for convenience 
https://1drv.ms/u/s!ApMO02VmOzE7bsN4SXbRqjuv9aQ?e=7tyab7

## ############################## AUTO GENERATED CODE ###########################################

# KAOC - generated READ ME

This project has all the source code used by Kaoc App (Cloud Functions and Angular). 

`webapp` - Angular UI Source code

`functions` - Node based cloud functions and related configurations

This angular project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 7.3.9.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `--prod` flag for a production build.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/).

## Deploying Code

Both Cloud Functions and Angular UI build artifacts are to be deployed and hosted in firebase

Set the correct project before executing deployment commands using the following command. 

`firebase use <PROJECT_ID>`

The Project Id can be obatined from the Firebase Console

### Function Configurations

Configurations required by cloud functions can be set using the following command

`firebase firebase functions:config:set smtp.host="<Email Domain>" smtp.port=465/567 smtp.secure=<true/false>  smtp.auth.user=<Email User> smtp.auth.pass="<Email Password>"
`

To deploy cloud function changes, function configuration and Angular UI build artifacts, use the following command

`firebase deploy --only hosting,functions`

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).

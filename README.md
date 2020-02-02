#KAOC - Our Project READ ME

## Basic steps to clone, build and start app
1. Create workspace(directory) in your system
2. Clone repo
git clone https://github.com/kaoc/kaoc.git
3. cd to repo
4. Install dev kit(needs to figure out how to avoid this) 
install --save-dev @angular-devkit/build-angular
5. Build angular app 
ng build
6. Start the webserver
ng serve start


## ############ Wed Development Notes ######################
The web application source is under webapp and cloud functions are under functions/index.js.
Firebase has emulators for mostly all features including Hosting, Firestore DB & Cloud Functions. However hosting emulation gets complicated as we use Angular Serve CLI command while
development. So, for now, use Firebase emulator only for cloud functions and use ng serve for the web application. 

Firebase emulators needs to be started from the top folder
firebase emulator:start --only functions

Angular server should be started from webapp folder
ng serve 

To test firebase hosting locally, first do ng build. This will create all the compiled output under
webapp/dist folder. Firebase hosting emulator looks up this folder while serving web resources. 
Once ng build is complete, start firebase emulator without the --only parameter to emulate hosting.
 

##

## ############################## AUTO GENERATED CODE ###########################################

# KAOC - generated READ ME

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 7.3.9.

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

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).

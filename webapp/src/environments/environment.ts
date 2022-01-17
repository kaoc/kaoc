// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

const projectId = `kaocproject`;
const hostURl = `test.kaoc.app`;

export const environment = {
    production: false,
    firebase: {
        apiKey            : `AIzaSyBsKGX4U0t9KnauslGJKFSQkZnHqIfhhQE`,
        authDomain        : `${hostURl}`,
        databaseURL       : `https://${projectId}.firebaseio.com`,
        projectId         : `${projectId}`,
        storageBucket     : `${projectId}.appspot.com`,
        messagingSenderId : '828257921598',
        appId             : '1:828257921598:web:8a2f1d304210a0603e7f6f',
        functionURL       : `https://${hostURl}/api`
    },
    square: {
      // Application Id in https://developer.squareup.com/apps/
      // TODO: This is Rafeeq's square account. Need to change to a test Square account for Kaoc
      // Note that Square's sandbox does not support Point of Sale.
      appId               : 'sq0idp-SwIIqsQfPszLsEDFFyupkg'
    },
    paypal: {
      clientId : 'Aa7xCFtDxNqFCctjNbHTG3yOV0P1HsLRW_cbzA2GKrWOSPJ1llbws6ESsRboZa0Ra2KdBT2vFIGBjPaR'
    }
};

/**
 *  Use this for testing cloud functions running on local emulator
 *  functionURL       : 'http://localhost:5001'
 */

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.

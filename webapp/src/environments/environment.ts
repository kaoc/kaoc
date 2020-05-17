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
      appId               : 'sq0idp-SwIIqsQfPszLsEDFFyupkg'
    },
    paypal: {
      clientId : 'ARblgHaZ0YyhFjx613zFpep81uDc-sbzHP5bTKw0jCy6_IM_DUUIrYRdckS9dbxSEwle9xCUUBrslFop'
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

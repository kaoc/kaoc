const projectId = `kaoc-aa17d`;
const hostURl = `kaoc.app`;

export const environment = {
    production: false,
    firebase: {
        apiKey            : `AIzaSyB6HrwLzZ7IG_vBVW3i5PKPtIAnIHkPEd0`,
        authDomain        : `${hostURl}`,
        databaseURL       : `https://${projectId}.firebaseio.com`,
        projectId         : `${projectId}`,
        storageBucket     : `${projectId}.appspot.com`,
        messagingSenderId : '766727019490',
        appId             : '1:766727019490:web:98fd3ae1b70e267891f7bb',
        measurementId     : 'G-J1SQY9HB34',
        functionURL       : `https://${hostURl}/api`
    },
    square: {
      // Application Id in https://developer.squareup.com/apps/
      appId               : 'sq0idp-rxLCkb-nVjOpavuyGGxqzg'
    },
    paypal: {

    }
};

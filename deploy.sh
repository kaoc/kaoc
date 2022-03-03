#!/bin/sh

ENV=$1
PROJECT_ID=kaocproject
ANGULAR_BUILD_PARAMS=""

[ -z "$ENV" ] && ENV=test

if [ $ENV == "prod" ]; then
   PROJECT_ID=kaoc-aa17d
   ANGULAR_BUILD_PARAMS=" --prod"
   echo "Deploying to prod env"
else
   echo "Deploying to test env"	
fi

firebase use $PROJECT_ID
cd webapp
ng build $ANGULAR_BUILD_PARAMS
#firebase deploy --only functions,hosting
firebase deploy --only hosting
cd ..


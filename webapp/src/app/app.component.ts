import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
    title = 'KAOC';

    constructor(private activatedRoute: ActivatedRoute, private snackBar: MatSnackBar) {

        const search = document.location.search;
        let message = null;
        if (!!search && search.length > 0) {
            const allParams = search.replace('\?', '').split('&');
            if (allParams && allParams.length > 0) {
                allParams.forEach(param => {
                if (param) {
                    const paramValue = param.split('=');
                    if (paramValue.length === 2 && paramValue[0] === 'message') {
                        message = paramValue[1];
                    }
                }
              });
            }
        }
        if (message) {
            snackBar.open(message, 'Close', {
                duration: 5000
            });
        }
    }
}

import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface IHeaderText {
    title: string;
    subTitle: string;
}

@Injectable()
export class HeaderText {
    subject = new BehaviorSubject<any>({} as IHeaderText);
    constructor() {}

    setHeaderText(data: IHeaderText) {
        this.subject.next(data);
    }

    getHeaderText(): Promise<IHeaderText> {
        return new Promise(resolve => {
            this.subject.subscribe(message => {
                resolve(message);
            });
        });
    }
}

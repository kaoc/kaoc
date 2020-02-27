import { Component, OnInit } from '@angular/core';
import { Member } from 'src/app/membership/Member';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { AngularFirestore } from '@angular/fire/firestore';

@Component({
  selector: 'app-search-users',
  templateUrl: './search-users.component.html',
  styleUrls: ['./search-users.component.css']
})
export class SearchUsersComponent implements OnInit {

    userSearch: string;
    userSearchUpdate = new Subject<string>();
    userSearchResults: Member[];

    /**
     *
     * Constructor.
     */
    constructor(angularFirestore: AngularFirestore) {
        this.userSearchUpdate
            .pipe(
                debounceTime(400),
                distinctUntilChanged()
            ).subscribe(search => {
                console.log(`Search Value - ${search}`);
                angularFirestore.collection('kaocUsers', ref => ref.where('firstName', 'contains', search))
            });
    }

    ngOnInit() {
    }

    applyFilter(filterVal) {

    }
}

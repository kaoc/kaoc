import { Component, OnInit, ViewChild, Input, OnChanges } from '@angular/core';
import { MatPaginator, MatSort, MatTableDataSource } from '@angular/material';
import { Router } from '@angular/router';
import { Member } from '../../Member';

@Component({
    selector: 'app-user-table',
    templateUrl: './user-table.component.html',
    styleUrls: ['./user-table.component.css']
})
/**
 * A component to display member details in a table format.
 * The component also supports optional filtering.
 */
export class UserTableComponent implements OnInit, OnChanges {

    dataSource: MatTableDataSource<Member>;

    @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
    @ViewChild(MatSort, { static: true }) sort: MatSort;
    @Input() users: Member[];
    @Input() enableFilter: boolean;

    columnsToDisplay: string[] = ['firstName'];

    constructor(private router: Router) {
        // NO-OP
    }

    getMembershipDetails(member: Member) {
        this.router.navigate(['secured/admin/memberprofile', member.docId]);
    }

    ngOnInit() {
        this.dataSource = new MatTableDataSource();
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        this.dataSource.filterPredicate = (member: Member, filter: string) => {
            if (member) {
                const fullName = member.firstName + ' ' + member.lastName;
                if (fullName.toLowerCase().indexOf(filter.toLowerCase()) >= 0) {
                    return true;
                }
                if (member.emailId && member.emailId.toLowerCase().indexOf(filter) >= 0) {
                    return true;
                }

                if (member.phoneNumber && String(member.phoneNumber).indexOf(filter) >= 0) {
                    return true;
                }
            }
            return false;
        };
        this.updateMembers();
    }

    ngOnChanges(changes: import ('@angular/core').SimpleChanges): void {
        const memberPropertyChange  = changes.users;
        if (memberPropertyChange) {
            this.users = memberPropertyChange.currentValue;
            this.updateMembers();
        }
    }

    private updateMembers(): void {
        if (this.dataSource) {
            if (this.users) {
                this.dataSource.data = this.users;
            } else {
                this.dataSource.data = [];
            }
        }
    }

    applyFilter(filterValue: string) {
        this.dataSource.filter = filterValue.trim().toLowerCase();
    }
}

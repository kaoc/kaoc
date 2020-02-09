import {MemberRoles} from './MemberRoles';

export interface Member {
    emailId:string;
    firstName:string;
    lastName:string;
    mobileNo:string;
    roles: MemberRoles;
}

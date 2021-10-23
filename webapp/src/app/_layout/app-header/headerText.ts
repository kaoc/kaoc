import { SECURED_CONTEXT, PROFILE, ADMIN_LIST_MEMBERS, LOGIN, ADMIN_MEMBER_PROFILE, KOAC_HISTORY } from '../../URLConstants';
export const getHeaderText = (url) => {
    const titleInfo = {
        title: '',
        subTitle: ''
    };
    switch (url) {
        case `/${SECURED_CONTEXT}/${PROFILE}`:
            titleInfo.title = 'KAOC Profile';
            break;
        case `/${SECURED_CONTEXT}/${ADMIN_LIST_MEMBERS}`:
            titleInfo.title = 'Member(s)';
            break;
        case `/${SECURED_CONTEXT}/${LOGIN}`:
            titleInfo.title = 'Login';
            break;
        case `/${SECURED_CONTEXT}/${ADMIN_MEMBER_PROFILE}`:
            titleInfo.title = 'Add Member';
            break;
        case `/${KOAC_HISTORY}`:
            titleInfo.title = 'About KAOC';
            titleInfo.subTitle = 'KAOC is a registered non-profile organization';
            break;
        default:
            titleInfo.title = 'KAOC';
    }
    return titleInfo;
};

export const KOAC_HISTORY = 'kaochistory';
export const KOAC_BYLAW = 'kaocbylaw';
export const KOAC_PAYMENT = 'squareprocesspaymentresult';
export const KOAC_MEMBER_PROFILE = 'memberprofile';
export const KOAC_STATIC_PAGES = 'static';

export const SECURED_CONTEXT = 'secured';
export const LOGIN = 'login';
export const VERIFY = 'verify';
export const PROFILE_LINK_STATUS = 'profileLinkStatus/:encodedMessage';
export const PROFILE = 'profile';
export const EVENT_TICKETS = 'eventtickets';
export const USER_MEMBER_PROFILE = 'user/memberprofile/:id';
export const ADMIN_SEARCH = 'admin/search';
// TODO - Rename ADMIN_MEMBER_PROFILE to ADMIN_EDIT_MEMBER_PROFILE
// to avoid confusion.
export const ADMIN_MEMBER_PROFILE = 'admin/memberprofile';
export const ADMIN_VIEW_MEMBER_PROFILE_PREFIX = 'admin/viewmemberprofile';
export const ADMIN_VIEW_MEMBER_PROFILE = `${ADMIN_VIEW_MEMBER_PROFILE_PREFIX}/:id`;
export const ADMIN_LIST_MEMBERS = 'admin/listmembers';
export const ADMIN_MANAGE_EVENTS = 'admin/manageevents';
export const ADMIN_FUNCTIONS = 'admin/functions';
export const ADMIN_SCANNER = 'admin/scanner';
export const ADMIN_MEMBER_CHECKIN_PREFIX =  'admin/member/checkin';
export const ADMIN_MEMBER_CHECKIN = `${ADMIN_MEMBER_CHECKIN_PREFIX}/:memberId/:eventId`;
export const ADMIN_TICKET_CHECKIN_PREFIX =  'admin/ticket/checkin';
export const ADMIN_TICKET_CHECKIN =  `${ADMIN_TICKET_CHECKIN_PREFIX}/:ticketId`;

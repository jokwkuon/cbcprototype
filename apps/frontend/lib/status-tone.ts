// Manual labels remain open text. Only exact known labels receive semantic meaning.
export type StatusTone='success'|'warning'|'danger'|'info'|'primary'|'neutral';
export type StatusDomain='relationship'|'payment'|'funding'|'membership'|'mentorship'|'progress'|'general';
const tones:Record<StatusDomain,Readonly<Record<string,StatusTone>>>={
 relationship:{Active:'success',Prospect:'info',Cultivate:'info',Proposal:'warning',Committed:'info',Inactive:'neutral',Lapsed:'danger'},
 payment:{Received:'success','Fully Received':'success',Paid:'success','Recorded paid':'success','Partially Received':'warning','Partially received':'warning','Partial payment':'warning','Not Received':'warning',Unreceived:'warning',Unpaid:'warning','Recorded unpaid':'warning',Failed:'danger'},
 funding:{Prospect:'info',Committed:'info',Invoiced:'warning',Cancelled:'danger'},
 membership:{'Current term':'success',Current:'success',Active:'success','Renewal approaching':'warning','Renewal due soon':'warning','Due soon':'warning',Overdue:'danger','Renewal overdue':'danger',Upcoming:'info',Scheduled:'info',Expired:'danger'},
 mentorship:{Active:'success',Completed:'success',Paused:'warning',Pending:'warning',Cancelled:'danger',Scheduled:'info'},
 progress:{Graduated:'success',Completed:'success','In Progress':'info',Scheduled:'info',Pending:'warning'},
 general:{Active:'success',Complete:'success',Completed:'success',Current:'success',Overdue:'danger',Cancelled:'danger',Critical:'danger',Failed:'danger',Pending:'warning','Pending review':'warning','Awaiting response':'warning',Scheduled:'info','In Progress':'info'}
};
export function statusTone(value:string|null|undefined,domain:StatusDomain='general'):StatusTone{return value?tones[domain][value]??'neutral':'neutral';}

'use client';
import {useEffect,useRef} from 'react';
export function useFormProtection(message?:string){
 const dirty=useRef(false);
 useEffect(()=>{if(message){dirty.current=true;sessionStorage.removeItem('cbc-save-intent');}},[message]);
 useEffect(()=>{const unload=(e:BeforeUnloadEvent)=>{if(dirty.current){e.preventDefault();e.returnValue='';}};const navigate=(e:MouseEvent)=>{const a=(e.target as Element)?.closest('a');if(!dirty.current||!a||a.getAttribute('href')?.startsWith('#'))return;if(!window.confirm('Leave this form? Your unsaved changes will be lost.')){e.preventDefault();e.stopPropagation();}else dirty.current=false;};window.addEventListener('beforeunload',unload);document.addEventListener('click',navigate,true);return()=>{window.removeEventListener('beforeunload',unload);document.removeEventListener('click',navigate,true);};},[]);
 return {onChange:()=>{dirty.current=true;},onSubmit:()=>{dirty.current=false;sessionStorage.setItem('cbc-save-intent',location.pathname);}};
}
export function sectionFor(name:string){if(/notes|discussion|needs|opportunity$|outcome|feedback|issues|interests$/.test(name))return 'Context & notes';if(/date|occurred|checked_in|frequency|alumni_since/.test(name))return 'Dates & scheduling';if(/fee|amount|payment|funding_status|currency|contribution_type|sponsorship_level|disposition|void_reason/.test(name))return 'Financial details';if(/status|strength|priority|potential|influence|contact_type|access_level|version|completion/.test(name))return 'Status & classification';if(/_id$|owner|organization|contact_ids/.test(name))return 'Relationships & ownership';return 'Record information';}

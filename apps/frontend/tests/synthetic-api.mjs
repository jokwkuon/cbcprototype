// Test-only Supabase HTTP contract fixture. Never imported by application code.
// Browser tests use in-memory synthetic records; actual RLS is tested in PostgreSQL separately.
import http from "node:http";
import { randomUUID } from "node:crypto";
const id = n => `10000000-0000-4000-8000-${String(n).padStart(12,"0")}`;
const profiles = ["admin","staff","staff","finance","viewer"].map((role,i)=>({id:id(i+1),role,is_active:true,full_name:`Demo ${role} ${i+1}`}));
const emptyTables=()=>({organizations:[],contacts:[],activities:[],activity_contacts:[],tasks:[]});
let tables=emptyTables();
let failActivities=false;
const port=Number(process.env.CBC_SYNTHETIC_API_PORT??54329);
const appOrigin=process.env.CBC_SYNTHETIC_APP_ORIGIN??"http://127.0.0.1:3100";
const today=()=>new Intl.DateTimeFormat("en-CA",{timeZone:"America/Edmonton",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
const encode = value => Buffer.from(JSON.stringify(value)).toString("base64url");
const userFor = profile => ({ id:profile.id, email:`${profile.role}${profile.role==="staff"?"2":""}@example.test`, aud:"authenticated",role:"authenticated",app_metadata:{provider:"email",providers:["email"]},user_metadata:{full_name:profile.full_name},created_at:"2026-01-01T00:00:00Z" });
const jwt = profile => `${encode({alg:"HS256",typ:"JWT"})}.${encode({sub:profile.id,aud:"authenticated",role:"authenticated",exp:Math.floor(Date.now()/1000)+3600,iat:Math.floor(Date.now()/1000)})}.synthetic-test-signature`;
function actor(req) { try { const payload=JSON.parse(Buffer.from(req.headers.authorization?.split(" ")[1].split(".")[1]??"","base64url")); return profiles.find(p=>p.id===payload.sub); } catch { return null; } }
const server=http.createServer(async(req,res)=>{
  const url=new URL(req.url,`http://127.0.0.1:${port}`);
  res.setHeader("Access-Control-Allow-Origin",appOrigin);res.setHeader("Access-Control-Allow-Headers","*");res.setHeader("Access-Control-Allow-Methods","GET,HEAD,POST,PATCH,DELETE,OPTIONS");res.setHeader("Access-Control-Expose-Headers","Content-Range");
  const send=(status,body)=>{res.writeHead(status,{"Content-Type":"application/json"});res.end(req.method==="HEAD"?undefined:JSON.stringify(body));};
  if(req.method==="OPTIONS")return send(200,{});
  let raw="";for await(const chunk of req)raw+=chunk;const body=raw?JSON.parse(raw):{};
  if(url.pathname==="/__reset"){ tables=emptyTables(); failActivities=false; return send(200,{}); }
  if(url.pathname==="/__fail-activities"){failActivities=body.fail===true;return send(200,{});}
  if(url.pathname==="/auth/v1/token"){
    const profile=profiles.find(p=>body.email===`${p.role}${p.role==="staff"?"2":""}@example.test`);
    if(!profile||body.password!=="synthetic-test-password")return send(400,{message:"Invalid synthetic login"});
    return send(200,{access_token:jwt(profile),refresh_token:"synthetic-refresh",token_type:"bearer",expires_in:3600,expires_at:Math.floor(Date.now()/1000)+3600,user:userFor(profile)});
  }
  const profile=actor(req);
  if(url.pathname==="/auth/v1/user")return profile?send(200,userFor(profile)):send(401,{message:"No synthetic session"});
  if(url.pathname==="/auth/v1/logout")return send(200,{});
  if(!profile)return send(401,{message:"Sign in"});
  const table=url.pathname.split("/").at(-1);
  if(failActivities&&(["activities","activity_contacts","tasks","follow_ups","activity_today","activity_last_contact","save_activity"].includes(table)))return send(500,{message:"Synthetic activity query failure"});
  if(url.pathname.includes("/rpc/")){
    if(table==="activity_today")return send(200,today());
    if(table==="activity_last_contact"){
      const target=tables.activities.find(a=>a.id===body.p_activity_id),targetContacts=tables.activity_contacts.filter(c=>c.activity_id===target?.id).map(c=>c.contact_id);
      const dates=tables.activities.filter(a=>Date.parse(a.occurred_at)<=Date.now()&&(
        body.p_organization_id&&a.organization_id===body.p_organization_id ||
        body.p_contact_id&&tables.activity_contacts.some(c=>c.activity_id===a.id&&c.contact_id===body.p_contact_id) ||
        target&&(a.id===target.id||target.organization_id&&a.organization_id===target.organization_id||tables.activity_contacts.some(c=>c.activity_id===a.id&&targetContacts.includes(c.contact_id)))
      )).map(a=>a.occurred_at).sort();return send(200,dates.at(-1)??null);
    }
    if(table==="save_activity"){
      if(!["admin","staff"].includes(profile.role))return send(403,{code:"42501"});
      if(body.p_contacts.some(id=>!tables.contacts.some(c=>c.id===id)))return send(400,{code:"23503"});
      const existing=body.p_id?tables.activities.find(a=>a.id===body.p_id):null;
      if(body.p_id&&!existing)return send(404,{code:"P0002"});
      const row=existing??{id:randomUUID()};Object.assign(row,body.p_values);
      if(!existing)tables.activities.push(row);
      tables.activity_contacts=tables.activity_contacts.filter(c=>c.activity_id!==row.id);
      tables.activity_contacts.push(...[...new Set(body.p_contacts)].map(contact_id=>({activity_id:row.id,contact_id})));
      return send(200,row.id);
    }
  }
  const taskRows=tables.tasks.map(task=>{const a=tables.activities.find(a=>a.id===task.activity_id);return {...task,status:task.completed_at?"Complete":task.due_date&&task.due_date<today()?"Overdue":"Open",organization_id:a?.organization_id,organization_name:tables.organizations.find(o=>o.id===a?.organization_id)?.name??null,activity_purpose:a?.purpose??null,activity_type:a?.activity_type,owner_name:profiles.find(p=>p.id===task.owner_id&&p.role==="staff"&&(profile.role==="admin"||p.id===profile.id&&profile.role==="staff"))?.full_name??null};});
  let rows=table==="profiles"?[profile]:table==="staff_directory"?profiles.filter(p=>p.role==="staff"&&(profile.role==="admin"||p.id===profile.id&&profile.role==="staff")).map(p=>({id:p.id,display_name:p.full_name})):table==="follow_ups"?taskRows:tables[table];
  if(!rows)return send(404,{message:"Unknown synthetic table"});
  for(const [key,value] of url.searchParams){
    if(value.startsWith("in.(")){const ids=value.slice(4,-1).split(",");rows=rows.filter(row=>ids.includes(String(row[key])));}
    if(value.startsWith("eq."))rows=rows.filter(row=>String(row[key])===value.slice(3));
    if(value.startsWith("ilike."))rows=rows.filter(row=>String(row[key]).toLowerCase().includes(value.slice(6).replaceAll("%","").toLowerCase()));
  }
  if(req.method==="POST"||req.method==="PATCH"){
    if(!["admin","staff"].includes(profile.role))return send(403,{code:"42501"});
    if(table==="tasks"){
      if(body.activity_id&&!tables.activities.some(a=>a.id===body.activity_id))return send(400,{code:"23503"});
      const changed=req.method==="POST"||rows.some(row=>row.owner_id!==body.owner_id);
      if(changed&&body.owner_id&&!profiles.some(p=>p.id===body.owner_id&&p.role==="staff"&&(profile.role==="admin"||p.id===profile.id&&profile.role==="staff")))return send(400,{code:"23514"});
    }
    if(table==="organizations"){
      if(profile.role==="staff"&&((req.method==="PATCH"&&Object.hasOwn(body,"relationship_owner"))||(req.method==="POST"&&body.relationship_owner&&body.relationship_owner!==profile.id)))return send(403,{code:"42501"});
      if(body.relationship_owner&&!profiles.some(p=>p.id===body.relationship_owner&&p.role==="staff"&&p.is_active))return send(400,{code:"23514"});
    }
    if(req.method==="POST"){const row={id:randomUUID(),created_at:new Date().toISOString(),relationship_owner:null,...body};tables[table].push(row);rows=[row];}
    else{for(const row of rows)Object.assign(row,body);}
  }
  if(table==="contacts"&&url.searchParams.get("select")?.includes("organization:"))rows=rows.map(row=>({...row,organization:tables.organizations.find(org=>org.id===row.organization_id)??null}));
  if(table==="activity_contacts"&&url.searchParams.get("select")?.includes("contact:"))rows=rows.map(row=>({...row,contact:tables.contacts.find(c=>c.id===row.contact_id)??null}));
  const ordering=(url.searchParams.get("order")??"").split(",").filter(Boolean);
  if(ordering.length)rows=[...rows].sort((a,b)=>{for(const part of ordering){const [key,dir,...flags]=part.split(".");const av=a[key],bv=b[key];if(av===bv)continue;if(av==null)return flags.includes("nullslast")?1:-1;if(bv==null)return flags.includes("nullslast")?-1:1;return (av<bv?-1:1)*(dir==="desc"?-1:1);}return 0;});
  const count=rows.length;res.setHeader("Content-Range",`0-${Math.max(count-1,0)}/${count}`);
  const limit=Number(url.searchParams.get("limit")??count);rows=rows.slice(0,limit);
  if(req.headers.accept?.includes("vnd.pgrst.object+json"))return rows.length===1?send(200,rows[0]):send(406,{code:"PGRST116",details:`The result contains ${rows.length} rows`});
  return send(200,rows);
});
server.listen(port,"127.0.0.1",()=>console.log("Synthetic API fixture ready"));

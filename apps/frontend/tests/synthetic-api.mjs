// Test-only Supabase HTTP contract fixture. Never imported by application code.
// Browser tests use in-memory synthetic records; actual RLS is tested in PostgreSQL separately.
import http from "node:http";
import { randomUUID } from "node:crypto";
const id = n => `10000000-0000-4000-8000-${String(n).padStart(12,"0")}`;
const profiles = ["admin","staff","staff","finance","viewer"].map((role,i)=>({id:id(i+1),role,is_active:true,full_name:`Demo ${role} ${i+1}`}));
let tables = { organizations: [], contacts: [] };
const encode = value => Buffer.from(JSON.stringify(value)).toString("base64url");
const userFor = profile => ({ id:profile.id, email:`${profile.role}${profile.role==="staff"?"2":""}@example.test`, aud:"authenticated",role:"authenticated",app_metadata:{provider:"email",providers:["email"]},user_metadata:{full_name:profile.full_name},created_at:"2026-01-01T00:00:00Z" });
const jwt = profile => `${encode({alg:"HS256",typ:"JWT"})}.${encode({sub:profile.id,aud:"authenticated",role:"authenticated",exp:Math.floor(Date.now()/1000)+3600,iat:Math.floor(Date.now()/1000)})}.synthetic-test-signature`;
function actor(req) { try { const payload=JSON.parse(Buffer.from(req.headers.authorization?.split(" ")[1].split(".")[1]??"","base64url")); return profiles.find(p=>p.id===payload.sub); } catch { return null; } }
const server=http.createServer(async(req,res)=>{
  const url=new URL(req.url,"http://127.0.0.1:54329");
  res.setHeader("Access-Control-Allow-Origin","http://127.0.0.1:3100");res.setHeader("Access-Control-Allow-Headers","*");res.setHeader("Access-Control-Allow-Methods","GET,HEAD,POST,PATCH,DELETE,OPTIONS");res.setHeader("Access-Control-Expose-Headers","Content-Range");
  const send=(status,body)=>{res.writeHead(status,{"Content-Type":"application/json"});res.end(req.method==="HEAD"?undefined:JSON.stringify(body));};
  if(req.method==="OPTIONS")return send(200,{});
  let raw="";for await(const chunk of req)raw+=chunk;const body=raw?JSON.parse(raw):{};
  if(url.pathname==="/__reset"){ tables={organizations:[],contacts:[]}; return send(200,{}); }
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
  let rows=table==="profiles"?[profile]:table==="staff_directory"?profiles.filter(p=>p.role==="staff"&&(profile.role==="admin"||p.id===profile.id&&profile.role==="staff")).map(p=>({id:p.id,display_name:p.full_name})):tables[table];
  if(!rows)return send(404,{message:"Unknown synthetic table"});
  for(const [key,value] of url.searchParams){
    if(value.startsWith("eq."))rows=rows.filter(row=>String(row[key])===value.slice(3));
    if(value.startsWith("ilike."))rows=rows.filter(row=>String(row[key]).toLowerCase().includes(value.slice(6).replaceAll("%","").toLowerCase()));
  }
  if(req.method==="POST"||req.method==="PATCH"){
    if(!["admin","staff"].includes(profile.role))return send(403,{code:"42501"});
    if(table==="organizations"){
      if(profile.role==="staff"&&((req.method==="PATCH"&&Object.hasOwn(body,"relationship_owner"))||(req.method==="POST"&&body.relationship_owner&&body.relationship_owner!==profile.id)))return send(403,{code:"42501"});
      if(body.relationship_owner&&!profiles.some(p=>p.id===body.relationship_owner&&p.role==="staff"&&p.is_active))return send(400,{code:"23514"});
    }
    if(req.method==="POST"){const row={id:randomUUID(),created_at:new Date().toISOString(),relationship_owner:null,...body};tables[table].push(row);rows=[row];}
    else{for(const row of rows)Object.assign(row,body);}
  }
  if(table==="contacts"&&url.searchParams.get("select")?.includes("organization:"))rows=rows.map(row=>({...row,organization:tables.organizations.find(org=>org.id===row.organization_id)??null}));
  const count=rows.length;res.setHeader("Content-Range",`0-${Math.max(count-1,0)}/${count}`);
  const limit=Number(url.searchParams.get("limit")??count);rows=rows.slice(0,limit);
  if(req.headers.accept?.includes("vnd.pgrst.object+json"))return rows.length===1?send(200,rows[0]):send(406,{code:"PGRST116",details:`The result contains ${rows.length} rows`});
  return send(200,rows);
});
server.listen(54329,"127.0.0.1",()=>console.log("Synthetic API fixture ready"));

import type {Instrumentation} from 'next';
// No exception messages, URLs, headers or record payloads: they may contain
// confidential content. Hosting must separately configure access-log retention.
export const onRequestError:Instrumentation.onRequestError=(_error,_request,context)=>{
  console.error(JSON.stringify({event:'unhandled_server_error',correlationId:crypto.randomUUID(),route:context.routePath,type:context.routeType,timestamp:new Date().toISOString()}));
};

export function diagnostic(event:'search_failed'|'export_failed'|'history_failed',started:number) {
  const correlationId=crypto.randomUUID();
  console.error(JSON.stringify({event,correlationId,durationMs:Math.round(performance.now()-started),timestamp:new Date().toISOString()}));
  return correlationId;
}

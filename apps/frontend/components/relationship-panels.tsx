'use client';
import {useId,useRef,useState} from 'react';

export function RelationshipPanels({activity,profile,related}:{activity:React.ReactNode;profile:React.ReactNode;related:React.ReactNode}) {
  const [active,setActive] = useState(0), id = useId(), tabs = useRef<(HTMLButtonElement|null)[]>([]);
  const labels = ['Activity','Profile','Related records'];
  return <><div role="tablist" aria-label="Record workspace" className="relationship-tabs">{labels.map((label,index) =>
    <button key={label} ref={element => {tabs.current[index] = element;}} id={`${id}-tab-${index}`} role="tab" aria-selected={active === index} aria-controls={`${id}-panel-${index}`} tabIndex={active === index ? 0 : -1} onClick={() => setActive(index)} onKeyDown={event => {
      if (!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
      event.preventDefault();
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? 2 : (index + (event.key === 'ArrowRight' ? 1 : 2)) % 3;
      setActive(next);tabs.current[next]?.focus();
    }}>{label}</button>)}</div>{[activity,profile,related].map((panel,index) => <div key={index} id={`${id}-panel-${index}`} role="tabpanel" aria-labelledby={`${id}-tab-${index}`} tabIndex={0} hidden={active !== index}>{panel}</div>)}</>;
}

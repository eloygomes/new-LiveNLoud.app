import { useState } from 'react';

export default function Faq({ items }: { items: readonly (readonly [string, string])[] }) {
  const [active, setActive] = useState<number | null>(0);
  return <div className="faq-list">
    {items.map(([question, answer], i) => <div className="faq-item" key={question}>
      <h3><button type="button" aria-expanded={active === i} aria-controls={`faq-${i}`} onClick={() => setActive(active === i ? null : i)}>{question}<span aria-hidden="true">{active === i ? '−' : '+'}</span></button></h3>
      <div id={`faq-${i}`} className="faq-answer" hidden={active !== i}><p>{answer}</p></div>
    </div>)}
  </div>;
}

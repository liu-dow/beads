/** A small woven diamond, shared by the public pages and the maker's studio. */
export function AtelierMark({size=32}:{size?:number}) {
  return <svg width={size} height={size} viewBox="0 0 36 36" fill="none" aria-hidden="true" focusable="false">
    <path d="M18 2.5 33.5 18 18 33.5 2.5 18Z" stroke="currentColor" strokeWidth="1"/>
    <g stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round">
      <path d="m18 7 5.5 5.5L18 18l-5.5-5.5Z"/>
      <path d="m12.5 12.5 5.5 5.5-5.5 5.5L7 18Z"/>
      <path d="m23.5 12.5 5.5 5.5-5.5 5.5L18 18Z"/>
      <path d="m18 18 5.5 5.5L18 29l-5.5-5.5Z"/>
    </g>
    <circle cx="18" cy="18" r="2" fill="currentColor"/>
  </svg>;
}

import React from 'react'

export function BrandMark({ size = 36 }) {
  return <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true" shapeRendering="crispEdges" className="brand-mark"><g fill="currentColor"><path d="M5 10h6v3h3v7h-3v3H5v-3H2v-7h3ZM14 2h6v3h2v9h-2v3h-6v-3h-2V5h2ZM25 3h6v3h2v8h-2v3h-6v-3h-2V6h2ZM34 11h4v3h2v6h-2v3h-4v-3h-2v-6h2ZM15 19h11v3h5v4h3v8h-4v4H12v-4H8v-8h3v-4h4Z" /></g><path d="M18 26h3v3h3v-3h3v6h-3v3h-3v-3h-3Z" fill="#fff7e2" /></svg>
}
export function Brand() { return <><BrandMark /><span>Pet<span className="brand-care">Care</span></span></> }

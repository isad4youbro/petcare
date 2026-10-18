import React from 'react'

// A shared 24-unit square grid. No curves or filled icon badges.
const paths = {
  arrowLeft: 'M20 12H4m6-6-6 6 6 6', arrowRight: 'M4 12h16m-6-6 6 6-6 6',
  chevronLeft: 'm15 5-7 7 7 7', chevronRight: 'm9 5 7 7-7 7',
  chevronDown: 'm5 9 7 7 7-7',
  plus: 'M12 4v16M4 12h16', x: 'm5 5 14 14M19 5 5 19', check: 'm4 12 5 5L20 6',
  menu: 'M3 5h18M3 12h18M3 19h18',
  paw: 'M8 13h8v3h3v5H5v-5h3v-3ZM3 7h4v4H3V7Zm6-5h3v6H9V2Zm6 0h3v6h-3V2Zm5 5h2v4h-2V7Z',
  calendar: 'M3 5h18v16H3V5Zm0 5h18M7 2v6m10-6v6M7 14h2m6 0h2m-10 4h2m6 0h2',
  medical: 'M4 4h16v16H4V4Zm8 4v8m-4-4h8',
  food: 'M3 12h18v4h-3v4H6v-4H3v-4ZM6 3v5m6-5v5m6-5v5',
  search: 'M4 3h10v3h3v8h-3v3H4v-3H1V6h3V3Zm12 13 6 6',
  bell: 'M8 3h8v3h3v10h2v3H3v-3h2V6h3V3Zm2 19h4',
  settings: 'M9 2h6v3h4v4h3v6h-3v4h-4v3H9v-3H5v-4H2V9h3V5h4V2Zm0 7h6v6H9V9Z',
  help: 'M5 2h14v3h3v14h-3v3H5v-3H2V5h3V2Zm3 6V6h8v5h-4v4m0 3v1',
  logout: 'M10 3H3v18h7m2-9h10m-5-5 5 5-5 5',
  edit: 'M3 16 16 3l5 5L8 21H3v-5Zm10-10 5 5',
  download: 'M12 2v13m-5-5 5 5 5-5M3 17v5h18v-5',
  send: 'm2 2 20 10-20 10 4-10-4-10Zm4 10h16',
  more: 'M3 11h2v2H3v-2Zm8 0h2v2h-2v-2Zm8 0h2v2h-2v-2Z',
}
function icon(name) {
  return function PixelIcon({ size = 18, className = '', strokeWidth = 2, ...props }) {
    return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true" className={'pixel-icon ' + (className || '')} {...props}><path d={paths[name]} /></svg>
  }
}
export const ArrowLeft = icon('arrowLeft'), ArrowRight = icon('arrowRight'), ChevronLeft = icon('chevronLeft'), ChevronRight = icon('chevronRight'), Plus = icon('plus'), X = icon('x'), Check = icon('check'), Menu = icon('menu'), PawPrint = icon('paw'), CalendarDays = icon('calendar'), HeartPulse = icon('medical'), Utensils = icon('food'), Search = icon('search'), Bell = icon('bell'), Settings = icon('settings'), CircleHelp = icon('help'), LogOut = icon('logout'), Pencil = icon('edit'), Download = icon('download'), Send = icon('send'), MoreHorizontal = icon('more')
export const XIcon = X, ChevronDownIcon = icon('chevronDown')

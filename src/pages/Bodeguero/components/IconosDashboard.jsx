// Iconos SVG propios del panel, sin biblioteca externa.
function Icono({trazo,size=24,...props}){return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}><path d={trazo}/></svg>;}
export function AlertTriangle(props){return <Icono trazo="M12 3 2 21h20ZM12 9v5m0 3v1" {...props}/>;}
export function BarChart3(props){return <Icono trazo="M4 3v18h17M8 17v-6m5 6V7m5 10V4" {...props}/>;}
export function Boxes(props){return <Icono trazo="M3 6l5-3 5 3-5 3Zm0 0v6l5 3 5-3V6M8 9v6M13 12l5-3 5 3-5 3-5-3v6l5 3 5-3v-6m-5 3v6" {...props}/>;}
export function CheckCircle2(props){return <Icono trazo="M20 11a8 8 0 1 1-4-6M8 11l4 4 9-10" {...props}/>;}
export function Clock(props){return <Icono trazo="M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16m0 3v5l4 2" {...props}/>;}
export function Eye(props){return <Icono trazo="M2 12q10-16 20 0-10 16-20 0m10-3a3 3 0 1 0 0 6 3 3 0 0 0 0-6" {...props}/>;}
export function EyeOff(props){return <Icono trazo="M2 2l20 20M2 12q10-16 20 0M3 14q9 12 18 0" {...props}/>;}
export function Hourglass(props){return <Icono trazo="M6 3h12v4l-6 5 6 5v4H6v-4l6-5-6-5ZM6 3h12M6 21h12" {...props}/>;}
export function PackageMinus(props){return <Icono trazo="M3 6l9-4 9 4-9 4ZM3 6v12l9 4 9-4V6M12 10v12M8 14h8" {...props}/>;}
export function PackageCheck(props){return <Icono trazo="M3 6l9-4 9 4-9 4ZM3 6v12l9 4 9-4V6M12 10v12M7 14l3 3 7-6" {...props}/>;}
export function PackageX(props){return <Icono trazo="M3 6l9-4 9 4-9 4ZM3 6v12l9 4 9-4V6M12 10v12M8 12l8 7m0-7-8 7" {...props}/>;}
export function Phone(props){return <Icono trazo="M5 3H2v5q2 12 14 14h5v-6l-5-2-3 3q-6-2-7-7l3-2Z" {...props}/>;}
export function PieChart(props){return <Icono trazo="M12 2v10h10A10 10 0 0 0 12 2M8 3a10 10 0 1 0 13 13H8Z" {...props}/>;}
export function RefreshCw(props){return <Icono trazo="M20 8a9 9 0 0 0-15-3L2 8m0-5v5h5M4 16a9 9 0 0 0 15 3l3-3m0 5v-5h-5" {...props}/>;}
export function Store(props){return <Icono trazo="M3 10V5h18v5M2 10h20l-2-6H4ZM4 10v11h16V10M9 21v-7h6v7" {...props}/>;}
export function TrendingDown(props){return <Icono trazo="M3 5l6 7 4-4 8 10m-6 0h6v-6" {...props}/>;}
export function Trophy(props){return <Icono trazo="M7 3h10v7a5 5 0 0 1-10 0ZM7 5H3v3q0 5 5 5m9-8h4v3q0 5-5 5m-4 2v6m-5 0h10" {...props}/>;}
export function Truck(props){return <Icono trazo="M2 5h12v12H2Zm12 5h4l4 5v2h-8M5 17a2 2 0 1 0 0 4 2 2 0 0 0 0-4m13 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4" {...props}/>;}
export function X(props){return <Icono trazo="M5 5l14 14M19 5 5 19" {...props}/>;}

import { ImageResponse } from "next/og";
export const alt = "Luis Ruiz — Thoughtful code. Useful things. Built by Gio.";
export const size = { width:1200,height:630 };
export const contentType = "image/png";
export default function Image() {
  return new ImageResponse(<div style={{background:"#f7f7f2",width:"100%",height:"100%",display:"flex",flexDirection:"column",justifyContent:"space-between",padding:"65px",color:"#242820"}}><div style={{display:"flex",justifyContent:"space-between",fontSize:23}}><span>Luis Ruiz / Developer & builder</span><span style={{color:"#214e34"}}>New York</span></div><div style={{display:"flex",flexDirection:"column",fontSize:78,letterSpacing:-3,lineHeight:1.05}}><span>Thoughtful code.</span><span>Useful things.</span><span style={{color:"#214e34",fontStyle:"italic"}}>Built by Gio.</span></div><div style={{display:"flex",fontSize:21,borderTop:"1px solid #dedfd5",paddingTop:25}}>Projects · Writing · Let’s work together</div></div>,size);
}

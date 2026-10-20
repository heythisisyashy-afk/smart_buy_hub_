import { google } from "googleapis";
import crypto from "node:crypto";

export const json = (data, status=200) => new Response(JSON.stringify(data), {
  status, headers: {"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store"}
});
export async function body(req){try{return await req.json()}catch{throw new Error("Invalid JSON request.");}}
export function sheetConfig(){
  const id=process.env.GOOGLE_SHEET_ID;
  const email=process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key=(process.env.GOOGLE_PRIVATE_KEY||"").replace(/\\n/g,"\n");
  if(!id||!email||!key)throw new Error("Google Sheets is not configured. Follow SETUP.md.");
  const auth=new google.auth.JWT({email, key, scopes:["https://www.googleapis.com/auth/spreadsheets"]});
  return {sheets:google.sheets({version:"v4",auth}),id};
}
export async function getUser(req){
  const token=(req.headers.get("authorization")||"").replace(/^Bearer\s+/i,"");
  if(!token||!process.env.SUPABASE_URL||!process.env.SUPABASE_ANON_KEY)return null;
  const r=await fetch(process.env.SUPABASE_URL.replace(/\/$/,"")+"/auth/v1/user",{headers:{apikey:process.env.SUPABASE_ANON_KEY,Authorization:"Bearer "+token}});
  if(!r.ok)return null;
  return await r.json();
}
export async function requireAdmin(req){
  const user=await getUser(req);
  if(!user?.email)throw new Error("Please log in with your admin account.");
  const allowed=(process.env.ADMIN_EMAILS||"").split(",").map(s=>s.trim().toLowerCase()).filter(Boolean);
  if(!allowed.includes(user.email.toLowerCase()))throw new Error("This account is not an approved store administrator.");
  return user;
}
export const productHeaders=["Product ID","Product Name","Category","Price","Image URL","Description","Stock","Status"];
export async function ensureProductsSheet(sheets,id){
  const meta=await sheets.spreadsheets.get({spreadsheetId:id});
  if(!meta.data.sheets?.some(s=>s.properties?.title==="Products")){
    await sheets.spreadsheets.batchUpdate({spreadsheetId:id,requestBody:{requests:[{addSheet:{properties:{title:"Products"}}}]}});
  }
  const existing=await sheets.spreadsheets.values.get({spreadsheetId:id,range:"Products!A1:H1"}).catch(()=>({data:{values:[]}}));
  if(!existing.data.values?.length)await sheets.spreadsheets.values.update({spreadsheetId:id,range:"Products!A1:H1",valueInputOption:"RAW",requestBody:{values:[productHeaders]}});
}
export async function listProducts(){
 const {sheets,id}=sheetConfig(); await ensureProductsSheet(sheets,id);
 const r=await sheets.spreadsheets.values.get({spreadsheetId:id,range:"Products!A2:H"});
 return (r.data.values||[]).filter(row=>row[0]&&row[1]).map(row=>({id:String(row[0]),name:String(row[1]),category:String(row[2]||"Accessories"),price:Number(row[3]||0),imageUrl:String(row[4]||""),description:String(row[5]||""),stock:Number(row[6]||0),status:String(row[7]||"Active")})).filter(p=>p.price>=0);
}
export async function ensureOrdersSheet(sheets,id){
 const meta=await sheets.spreadsheets.get({spreadsheetId:id});
 if(!meta.data.sheets?.some(s=>s.properties?.title==="Orders")) await sheets.spreadsheets.batchUpdate({spreadsheetId:id,requestBody:{requests:[{addSheet:{properties:{title:"Orders"}}}]}});
 const headers=["Order ID","Order Date","Customer Email","Customer Name","Mobile Number","Delivery Address","Products JSON","Total Amount","Payment Method","Payment Status","Order Status","Razorpay Order ID","Razorpay Payment ID"];
 const h=await sheets.spreadsheets.values.get({spreadsheetId:id,range:"Orders!A1:M1"}).catch(()=>({data:{values:[]}}));
 if(!h.data.values?.length)await sheets.spreadsheets.values.update({spreadsheetId:id,range:"Orders!A1:M1",valueInputOption:"RAW",requestBody:{values:[headers]}});
}
export async function appendOrder(row){
 const {sheets,id}=sheetConfig();await ensureOrdersSheet(sheets,id);
 await sheets.spreadsheets.values.append({spreadsheetId:id,range:"Orders!A:M",valueInputOption:"USER_ENTERED",insertDataOption:"INSERT_ROWS",requestBody:{values:[row]}});
}
export async function updateOrderPayment(orderId,status,razorpayOrderId,paymentId){
 const {sheets,id}=sheetConfig();await ensureOrdersSheet(sheets,id);
 const r=await sheets.spreadsheets.values.get({spreadsheetId:id,range:"Orders!A2:M"});
 const rows=r.data.values||[];const idx=rows.findIndex(row=>row[0]===orderId);
 if(idx<0)throw new Error("Order not found.");
 const row=rows[idx];row[9]=status;row[11]=razorpayOrderId||row[11]||"";row[12]=paymentId||row[12]||"";
 await sheets.spreadsheets.values.update({spreadsheetId:id,range:`Orders!A${idx+2}:M${idx+2}`,valueInputOption:"USER_ENTERED",requestBody:{values:[Array.from({length:13},(_,i)=>row[i]??"")]}});
}
export function makeId(prefix){return prefix+"-"+Date.now().toString(36).toUpperCase()+"-"+crypto.randomBytes(3).toString("hex").toUpperCase();}
export function razorpaySignature(orderId,paymentId){return crypto.createHmac("sha256",process.env.RAZORPAY_KEY_SECRET||"").update(orderId+"|"+paymentId).digest("hex");}
export function safeEqual(a,b){const aa=Buffer.from(String(a||""));const bb=Buffer.from(String(b||""));return aa.length===bb.length&&crypto.timingSafeEqual(aa,bb);}

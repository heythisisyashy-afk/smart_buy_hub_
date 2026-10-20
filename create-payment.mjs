import {json,body,getUser,sheetConfig,ensureOrdersSheet} from "./_shared.mjs";
export default async req=>{
 if(req.method!=="POST")return json({error:"Method not allowed."},405);
 try{
  const user=await getUser(req);if(!user?.email)return json({error:"Please log in."},401);
  const keyId=process.env.RAZORPAY_KEY_ID,keySecret=process.env.RAZORPAY_KEY_SECRET;if(!keyId||!keySecret)return json({error:"Online payment is not configured. Use COD or configure Razorpay in Netlify."},503);
  const b=await body(req),orderId=String(b.orderId||"");if(!/^SBH-ORD-/.test(orderId))return json({error:"Invalid order ID."},400);
  const {sheets,id}=sheetConfig();await ensureOrdersSheet(sheets,id);const r=await sheets.spreadsheets.values.get({spreadsheetId:id,range:"Orders!A2:M"});const row=(r.data.values||[]).find(x=>x[0]===orderId);
  if(!row||String(row[2]).toLowerCase()!==user.email.toLowerCase()||row[8]!=="ONLINE"||row[9]!=="Pending")return json({error:"Order cannot be paid or does not belong to this account."},403);
  const amount=Math.round(Number(row[7])*100);if(!Number.isSafeInteger(amount)||amount<100)return json({error:"Invalid payment amount."},400);
  const response=await fetch("https://api.razorpay.com/v1/orders",{method:"POST",headers:{Authorization:"Basic "+Buffer.from(keyId+":"+keySecret).toString("base64"),"Content-Type":"application/json"},body:JSON.stringify({amount,currency:"INR",receipt:orderId,notes:{store:"SmartBuy Hub",orderId}})});
  const data=await response.json();if(!response.ok)throw new Error(data.error?.description||"Razorpay could not create the payment order.");
  await sheets.spreadsheets.values.update({spreadsheetId:id,range:`Orders!L${(r.data.values||[]).findIndex(x=>x[0]===orderId)+2}`,valueInputOption:"RAW",requestBody:{values:[[data.id]]}});
  return json({keyId,razorpayOrderId:data.id,amount:data.amount,currency:data.currency,orderId});
 }catch(e){console.error("create-payment:",e);return json({error:e.message||"Could not start payment."},500);}
};

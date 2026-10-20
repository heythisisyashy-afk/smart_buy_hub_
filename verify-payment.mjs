import {json,body,getUser,sheetConfig,ensureOrdersSheet,razorpaySignature,safeEqual,updateOrderPayment} from "./_shared.mjs";
export default async req=>{
 if(req.method!=="POST")return json({error:"Method not allowed."},405);
 try{
  const user=await getUser(req);if(!user?.email)return json({error:"Please log in."},401);
  const b=await body(req),orderId=String(b.orderId||""),paymentId=String(b.razorpay_payment_id||""),razorpayOrderId=String(b.razorpay_order_id||""),signature=String(b.razorpay_signature||"");
  if(!orderId||!paymentId||!razorpayOrderId||!signature)return json({error:"Missing payment verification fields."},400);
  const {sheets,id}=sheetConfig();await ensureOrdersSheet(sheets,id);const r=await sheets.spreadsheets.values.get({spreadsheetId:id,range:"Orders!A2:M"});const row=(r.data.values||[]).find(x=>x[0]===orderId);
  if(!row||String(row[2]).toLowerCase()!==user.email.toLowerCase()||row[8]!=="ONLINE"||row[11]!==razorpayOrderId)return json({error:"Order or payment does not match."},403);
  const expected=razorpaySignature(razorpayOrderId,paymentId);if(!safeEqual(expected,signature))return json({error:"Payment signature verification failed."},400);
  const keyId=process.env.RAZORPAY_KEY_ID,keySecret=process.env.RAZORPAY_KEY_SECRET;
  const check=await fetch("https://api.razorpay.com/v1/payments/"+encodeURIComponent(paymentId),{headers:{Authorization:"Basic "+Buffer.from(keyId+":"+keySecret).toString("base64")}});
  const p=await check.json();if(!check.ok||p.order_id!==razorpayOrderId||p.status!=="captured"||Number(p.amount)!==Math.round(Number(row[7])*100))return json({error:"Payment is not captured or the amount does not match. If money was deducted, contact support with your order ID."},400);
  await updateOrderPayment(orderId,"Paid",razorpayOrderId,paymentId);
  return json({ok:true,orderId,status:"Paid"});
 }catch(e){console.error("verify-payment:",e);return json({error:e.message||"Could not verify payment."},500);}
};

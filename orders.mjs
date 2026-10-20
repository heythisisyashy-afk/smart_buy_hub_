import {json,body,getUser,listProducts,appendOrder,makeId} from "./_shared.mjs";
export default async req=>{
 if(req.method!=="POST")return json({error:"Method not allowed."},405);
 try{
  const user=await getUser(req);if(!user?.email)return json({error:"Please log in before placing an order."},401);
  const b=await body(req),customer=b.customer||{},items=Array.isArray(b.items)?b.items:[];
  if(!String(customer.name||"").trim()||!String(customer.phone||"").trim()||!String(customer.address||"").trim()||String(customer.address).length>500)return json({error:"Enter your name, mobile number and complete delivery address."},400);
  if(!items.length||items.length>50||!["COD","ONLINE"].includes(b.paymentMethod))return json({error:"Invalid cart or payment method."},400);
  const catalog=await listProducts();let total=0;const normalized=[];
  for(const item of items){const p=catalog.find(x=>x.id===String(item.productId)&&x.status.toLowerCase()==="active");const q=Number(item.quantity);if(!p||!Number.isInteger(q)||q<1||q>20)return json({error:"A product is unavailable or quantity is invalid. Refresh the catalogue."},400);if(p.stock<q)return json({error:`Not enough stock for ${p.name}.`},400);total+=p.price*q;normalized.push({productId:p.id,name:p.name,category:p.category,quantity:q,unitPrice:p.price,lineTotal:p.price*q});}
  if(total<=0||total>10000000)return json({error:"Order total is invalid."},400);
  const orderId=makeId("SBH-ORD"),now=new Date().toISOString(),method=b.paymentMethod==="COD"?"COD":"ONLINE";
  await appendOrder([orderId,now,user.email,String(customer.name).trim(),String(customer.phone).trim(),String(customer.address).trim(),JSON.stringify(normalized),total,method,method==="COD"?"Not applicable":"Pending",method==="COD"?"Placed":"Awaiting payment","",""]);
  return json({ok:true,orderId,total});
 }catch(e){console.error("orders:",e);return json({error:e.message||"Could not place order."},500);}
};

import {json,body,requireAdmin,sheetConfig,ensureProductsSheet,makeId} from "./_shared.mjs";
export default async req=>{
 if(req.method!=="POST")return json({error:"Method not allowed."},405);
 try{
  await requireAdmin(req);const p=await body(req);
  const name=String(p.name||"").trim(),category=String(p.category||"").trim(),imageUrl=String(p.imageUrl||"").trim(),description=String(p.description||"").trim(),price=Number(p.price),stock=Number(p.stock),status=String(p.status||"Active");
  if(!name||name.length>120||!["Clothing","Electronics","Accessories"].includes(category)||!Number.isFinite(price)||price<=0||!Number.isInteger(stock)||stock<0||!/^https:\/\/\S+/i.test(imageUrl)||!description||description.length>500||!["Active","Inactive"].includes(status))return json({error:"Check all fields. Use an HTTPS image URL, a valid category, positive price and non-negative stock."},400);
  const {sheets,id}=sheetConfig();await ensureProductsSheet(sheets,id);
  const productId=makeId("SBH");
  await sheets.spreadsheets.values.append({spreadsheetId:id,range:"Products!A:H",valueInputOption:"USER_ENTERED",insertDataOption:"INSERT_ROWS",requestBody:{values:[[productId,name,category,price,imageUrl,description,stock,status]]}});
  return json({ok:true,productId});
 }catch(e){console.error("admin-products:",e);return json({error:e.message||"Could not save product."},e.message?.includes("administrator")||e.message?.includes("log in")?403:500);}
};

import {json,listProducts} from "./_shared.mjs";
const demo=[
{id:"DEMO001",name:"Classic Everyday T-Shirt",category:"Clothing",price:399,imageUrl:"",description:"A comfortable everyday wardrobe essential.",stock:12,status:"Active",emoji:"👕"},
{id:"DEMO002",name:"Wireless Earbuds",category:"Electronics",price:1299,imageUrl:"",description:"Compact wireless audio for everyday use.",stock:8,status:"Active",emoji:"🎧"},
{id:"DEMO003",name:"Everyday Mobile Cover",category:"Accessories",price:199,imageUrl:"",description:"A simple, stylish phone accessory.",stock:20,status:"Active",emoji:"📱"},
{id:"DEMO004",name:"Casual Sneakers",category:"Clothing",price:999,imageUrl:"",description:"Versatile shoes for casual outfits.",stock:5,status:"Active",emoji:"👟"}];
export default async()=>{try{return json({products:await listProducts(),demo:false});}catch(e){console.error("products:",e.message);return json({products:demo,demo:true,warning:"Google Sheets is not configured."});}};

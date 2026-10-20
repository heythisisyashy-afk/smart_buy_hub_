import {json,getUser} from "./_shared.mjs";
export default async req=>{const u=await getUser(req);const allowed=(process.env.ADMIN_EMAILS||"").split(",").map(x=>x.trim().toLowerCase()).filter(Boolean);return json({isAdmin:!!u?.email&&allowed.includes(u.email.toLowerCase())});};

export function canViewFinance(role:string){return role==='owner';}
export function canPerform(role:string,action:unknown){return role==='owner'?['create','payment','status','expense'].includes(String(action)):role==='employee'&&['create','payment','status'].includes(String(action));}

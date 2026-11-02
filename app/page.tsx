import LaundryApp from './laundry-app';
import { getSession } from '@/lib/auth';
import LoginForm from './login-form';
export const dynamic='force-dynamic';
export default async function Home(){const user=await getSession();return user?<LaundryApp user={user}/>:<LoginForm/>;}

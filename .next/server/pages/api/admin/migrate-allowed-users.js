"use strict";(()=>{var e={};e.id=1545,e.ids=[1545],e.modules={2885:e=>{e.exports=require("@supabase/supabase-js")},145:e=>{e.exports=require("next/dist/compiled/next-server/pages-api.runtime.prod.js")},6201:e=>{e.exports=import("react-hot-toast")},6249:(e,s)=>{Object.defineProperty(s,"l",{enumerable:!0,get:function(){return function e(s,r){return r in s?s[r]:"then"in s&&"function"==typeof s.then?s.then(s=>e(s,r)):"function"==typeof s&&"default"===r?s:void 0}}})},949:(e,s,r)=>{r.r(s),r.d(s,{config:()=>c,default:()=>d,routeModule:()=>E});var a={};r.r(a),r.d(a,{default:()=>u});var i=r(1802),o=r(7153),l=r(6249),t=r(8456),n=r(8915);async function u(e,s){if("POST"!==e.method)return s.status(405).json({error:"Method not allowed"});try{if(!(await (0,n.su)(e)).isAdmin)return s.status(403).json({error:"Admin access required"});console.log("Starting allowed_users table migration...");let r=`
      -- Create allowed_users table for selective registration
      CREATE TABLE IF NOT EXISTS public.allowed_users (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        full_name TEXT,
        invited_by UUID REFERENCES public.users(id),
        is_used BOOLEAN DEFAULT FALSE,
        temp_password TEXT,
        invitation_sent_at TIMESTAMP WITH TIME ZONE,
        registered_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Enable Row Level Security
      ALTER TABLE public.allowed_users ENABLE ROW LEVEL SECURITY;

      -- Create indexes
      CREATE INDEX IF NOT EXISTS idx_allowed_users_email ON public.allowed_users(email);
      CREATE INDEX IF NOT EXISTS idx_allowed_users_is_used ON public.allowed_users(is_used);

      -- Drop existing policies if they exist
      DROP POLICY IF EXISTS "Admins can view all allowed users" ON public.allowed_users;
      DROP POLICY IF EXISTS "Admins can insert allowed users" ON public.allowed_users;
      DROP POLICY IF EXISTS "Admins can update allowed users" ON public.allowed_users;
      DROP POLICY IF EXISTS "Admins can delete allowed users" ON public.allowed_users;

      -- Create RLS policies for allowed_users table
      CREATE POLICY "Admins can view all allowed users" ON public.allowed_users
        FOR SELECT USING (
          EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND (users.is_admin = true OR users.role = 'admin')
          )
        );

      CREATE POLICY "Admins can insert allowed users" ON public.allowed_users
        FOR INSERT WITH CHECK (
          EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND (users.is_admin = true OR users.role = 'admin')
          )
        );

      CREATE POLICY "Admins can update allowed users" ON public.allowed_users
        FOR UPDATE USING (
          EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND (users.is_admin = true OR users.role = 'admin')
          )
        );

      CREATE POLICY "Admins can delete allowed users" ON public.allowed_users
        FOR DELETE USING (
          EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND (users.is_admin = true OR users.role = 'admin')
          )
        );
    `,{error:a}=await t.OQ.rpc("exec_sql",{sql:r});if(a)return console.error("Migration error:",a),s.status(500).json({error:"Migration failed",details:a.message});return console.log("Migration completed successfully"),s.status(200).json({success:!0,message:"Allowed users table created successfully"})}catch(e){return console.error("Error during migration:",e),s.status(500).json({error:"Migration failed",details:e.message})}}let d=(0,l.l)(a,"default"),c=(0,l.l)(a,"config"),E=new i.PagesAPIRouteModule({definition:{kind:o.x.PAGES_API,page:"/api/admin/migrate-allowed-users",pathname:"/api/admin/migrate-allowed-users",bundlePath:"",filename:""},userland:a})},8915:(e,s,r)=>{r.d(s,{Cn:()=>o,su:()=>l});var a=r(8456);let i=["admin@nbcc.com","pastor@nbcc.com","mppaul1458@gmail.com"],o=async(e,s)=>{try{let{data:r,error:o}=await a.OQ.from("users").select("is_admin, role").eq("id",e).single();if(!o&&r&&(!0===r.is_admin||"admin"===r.role))return!0;let l=i.includes(s.toLowerCase())||s.toLowerCase().includes("admin")||s.toLowerCase().includes("pastor");if(l&&e)try{await a.OQ.from("users").upsert({id:e,email:s,is_admin:!0,role:"admin"},{onConflict:"id",ignoreDuplicates:!1}),console.log("Updated admin status in database for:",s)}catch(e){console.warn("Could not update admin status in database:",e.message)}return l}catch(e){return console.warn("Admin status check failed:",e.message),i.includes(s.toLowerCase())||s.toLowerCase().includes("admin")||s.toLowerCase().includes("pastor")}},l=async e=>{try{console.log("Checking admin access for API route");let s=e.headers.authorization;if(console.log("Auth header present:",!!s),!s||!s.startsWith("Bearer "))return console.log("No valid authorization header found"),{user:null,error:"No authorization token provided"};let a=s.split(" ")[1];console.log("Token extracted, length:",a?.length);let{createClient:i}=await Promise.resolve().then(r.t.bind(r,2885,23)),l=i("https://qyhdzjzvkggcsuhnenaz.supabase.co",process.env.SUPABASE_SERVICE_ROLE_KEY);console.log("Verifying JWT token...");let{data:{user:t},error:n}=await l.auth.getUser(a);if(n)return console.log("Token verification failed:",n.message),{user:null,error:`Invalid or expired token: ${n.message}`};if(!t)return console.log("No user found from token"),{user:null,error:"Invalid or expired token"};console.log("User verified:",t.email);let u=await o(t.id,t.email);if(console.log("Admin status:",u),!u)return console.log("User does not have admin privileges"),{user:null,error:"Admin privileges required"};return console.log("Admin access granted"),{user:t,error:null}}catch(e){return console.error("API admin access check failed:",e),{user:null,error:`Authentication failed: ${e.message}`}}}},8456:(e,s,r)=>{r.d(s,{OQ:()=>l});var a=r(2885);let i="https://qyhdzjzvkggcsuhnenaz.supabase.co",o="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5aGR6anp2a2dnY3N1aG5lbmF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0NjY1NzgsImV4cCI6MjA2NTA0MjU3OH0.wauN1JdrKCl82WFuwtCfq0oZVob8UEE71wjJw6otCFY";console.log("\uD83D\uDD0D Supabase Debug Info:"),console.log("URL:",i),console.log("Key exists:",!!o),console.log("Key length:",o?.length),console.log("✅ Is Supabase configured:",!!(i&&o&&i.includes("supabase.co")&&o.length>50));let l=i&&o?(0,a.createClient)(i,o):null;console.log("\uD83D\uDE80 Supabase client created:",!!l)},7153:(e,s)=>{var r;Object.defineProperty(s,"x",{enumerable:!0,get:function(){return r}}),function(e){e.PAGES="PAGES",e.PAGES_API="PAGES_API",e.APP_PAGE="APP_PAGE",e.APP_ROUTE="APP_ROUTE"}(r||(r={}))},1802:(e,s,r)=>{e.exports=r(145)}};var s=require("../../../webpack-api-runtime.js");s.C(e);var r=s(s.s=949);module.exports=r})();
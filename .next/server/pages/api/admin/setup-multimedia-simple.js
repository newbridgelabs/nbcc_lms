"use strict";(()=>{var e={};e.id=6632,e.ids=[6632],e.modules={2885:e=>{e.exports=require("@supabase/supabase-js")},145:e=>{e.exports=require("next/dist/compiled/next-server/pages-api.runtime.prod.js")},6249:(e,t)=>{Object.defineProperty(t,"l",{enumerable:!0,get:function(){return function e(t,i){return i in t?t[i]:"then"in t&&"function"==typeof t.then?t.then(t=>e(t,i)):"function"==typeof t&&"default"===i?t:void 0}}})},8767:(e,t,i)=>{i.r(t),i.d(t,{config:()=>s,default:()=>E,routeModule:()=>T});var a={};i.r(a),i.d(a,{default:()=>c});var n=i(1802),o=i(7153),l=i(6249),d=i(2885);let r=process.env.SUPABASE_SERVICE_ROLE_KEY,u=(0,d.createClient)("https://qyhdzjzvkggcsuhnenaz.supabase.co",r);async function c(e,t){if("POST"!==e.method)return t.setHeader("Allow",["POST"]),t.status(405).json({error:"Method not allowed"});try{console.log("Setting up multimedia content table...");let{error:e}=await u.rpc("exec_sql",{sql:`
        -- Create multimedia_content table
        CREATE TABLE IF NOT EXISTS public.multimedia_content (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          section_id UUID NOT NULL,
          content_type TEXT NOT NULL CHECK (content_type IN ('text', 'image', 'video', 'audio', 'pdf', 'embed')),
          title TEXT,
          content_data JSONB NOT NULL DEFAULT '{}',
          display_order INTEGER NOT NULL DEFAULT 0,
          is_active BOOLEAN NOT NULL DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Create indexes for better performance
        CREATE INDEX IF NOT EXISTS idx_multimedia_content_section_id ON public.multimedia_content(section_id);
        CREATE INDEX IF NOT EXISTS idx_multimedia_content_display_order ON public.multimedia_content(section_id, display_order);
        CREATE INDEX IF NOT EXISTS idx_multimedia_content_active ON public.multimedia_content(is_active);

        -- Enable RLS (Row Level Security)
        ALTER TABLE public.multimedia_content ENABLE ROW LEVEL SECURITY;
      `});if(e){console.error("Error creating table:",e);let{error:i}=await u.from("multimedia_content").select("id").limit(1);if(i&&"42P01"===i.code)return t.status(500).json({error:"Table creation failed. Please create the table manually in Supabase dashboard.",sql:`
CREATE TABLE IF NOT EXISTS public.multimedia_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  section_id UUID NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('text', 'image', 'video', 'audio', 'pdf', 'embed')),
  title TEXT,
  content_data JSONB NOT NULL DEFAULT '{}',
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_multimedia_content_section_id ON public.multimedia_content(section_id);
CREATE INDEX IF NOT EXISTS idx_multimedia_content_display_order ON public.multimedia_content(section_id, display_order);

-- Enable RLS
ALTER TABLE public.multimedia_content ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow authenticated users to read multimedia content" ON public.multimedia_content
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to insert multimedia content" ON public.multimedia_content
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update multimedia content" ON public.multimedia_content
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to delete multimedia content" ON public.multimedia_content
  FOR DELETE TO authenticated USING (true);
          `})}let{data:i,error:a}=await u.from("multimedia_content").select("id").limit(1);if(a)return console.error("Table test failed:",a),t.status(500).json({error:"Table creation verification failed",details:a});console.log("✅ Multimedia content table setup completed successfully"),t.status(200).json({message:"Multimedia content table setup completed successfully",tableExists:!0})}catch(e){console.error("Error setting up multimedia content table:",e),t.status(500).json({error:"Failed to setup multimedia content table",details:e.message})}}let E=(0,l.l)(a,"default"),s=(0,l.l)(a,"config"),T=new n.PagesAPIRouteModule({definition:{kind:o.x.PAGES_API,page:"/api/admin/setup-multimedia-simple",pathname:"/api/admin/setup-multimedia-simple",bundlePath:"",filename:""},userland:a})},7153:(e,t)=>{var i;Object.defineProperty(t,"x",{enumerable:!0,get:function(){return i}}),function(e){e.PAGES="PAGES",e.PAGES_API="PAGES_API",e.APP_PAGE="APP_PAGE",e.APP_ROUTE="APP_ROUTE"}(i||(i={}))},1802:(e,t,i)=>{e.exports=i(145)}};var t=require("../../../webpack-api-runtime.js");t.C(e);var i=t(t.s=8767);module.exports=i})();
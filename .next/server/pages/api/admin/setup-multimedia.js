"use strict";(()=>{var e={};e.id=8450,e.ids=[8450],e.modules={2885:e=>{e.exports=require("@supabase/supabase-js")},145:e=>{e.exports=require("next/dist/compiled/next-server/pages-api.runtime.prod.js")},6249:(e,t)=>{Object.defineProperty(t,"l",{enumerable:!0,get:function(){return function e(t,a){return a in t?t[a]:"then"in t&&"function"==typeof t.then?t.then(t=>e(t,a)):"function"==typeof t&&"default"===a?t:void 0}}})},5904:(e,t,a)=>{a.r(t),a.d(t,{config:()=>E,default:()=>s,routeModule:()=>m});var i={};a.r(i),a.d(i,{default:()=>c});var n=a(1802),o=a(7153),r=a(6249),l=a(2885);let u=process.env.SUPABASE_SERVICE_ROLE_KEY,d=(0,l.createClient)("https://qyhdzjzvkggcsuhnenaz.supabase.co",u);async function c(e,t){if("POST"!==e.method)return t.setHeader("Allow",["POST"]),t.status(405).json({error:"Method not allowed"});try{console.log("Setting up multimedia content table...");let e=`
      -- Create multimedia content table for rich section content
      CREATE TABLE IF NOT EXISTS multimedia_content (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        section_id UUID REFERENCES pdf_sections(id) ON DELETE CASCADE,
        content_type VARCHAR(50) NOT NULL, -- 'text', 'image', 'video', 'audio', 'pdf', 'embed'
        title VARCHAR(255),
        content_data JSONB NOT NULL, -- Flexible storage for different content types
        display_order INTEGER NOT NULL DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `,{error:a}=await d.rpc("exec_sql",{sql:e});if(a){console.error("Error creating table:",a);let{error:e}=await d.from("multimedia_content").select("id").limit(1);if(e&&"42P01"===e.code)throw Error("Table creation failed. Please run the SQL manually in Supabase dashboard.")}let i=`
      -- Create index for faster queries
      CREATE INDEX IF NOT EXISTS idx_multimedia_content_section_id ON multimedia_content(section_id);
      CREATE INDEX IF NOT EXISTS idx_multimedia_content_order ON multimedia_content(section_id, display_order);
    `,{error:n}=await d.rpc("exec_sql",{sql:i});n&&console.log("Index creation may have failed, but continuing...");let o=`
      -- Enable RLS
      ALTER TABLE multimedia_content ENABLE ROW LEVEL SECURITY;
    `,{error:r}=await d.rpc("exec_sql",{sql:o});r&&console.log("RLS setup may have failed, but continuing...");let l=`
      -- Create policies
      CREATE POLICY IF NOT EXISTS "Allow authenticated users to read multimedia content" ON multimedia_content
        FOR SELECT TO authenticated USING (true);

      CREATE POLICY IF NOT EXISTS "Allow authenticated users to insert multimedia content" ON multimedia_content
        FOR INSERT TO authenticated WITH CHECK (true);

      CREATE POLICY IF NOT EXISTS "Allow authenticated users to update multimedia content" ON multimedia_content
        FOR UPDATE TO authenticated USING (true);

      CREATE POLICY IF NOT EXISTS "Allow authenticated users to delete multimedia content" ON multimedia_content
        FOR DELETE TO authenticated USING (true);
    `,{error:u}=await d.rpc("exec_sql",{sql:l});u&&console.log("Policy creation may have failed, but continuing...");let c=`
      -- Create function to update updated_at timestamp
      CREATE OR REPLACE FUNCTION update_multimedia_content_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `,{error:s}=await d.rpc("exec_sql",{sql:c});s&&console.log("Function creation may have failed, but continuing...");let E=`
      -- Create trigger
      DROP TRIGGER IF EXISTS update_multimedia_content_updated_at ON multimedia_content;
      CREATE TRIGGER update_multimedia_content_updated_at
        BEFORE UPDATE ON multimedia_content
        FOR EACH ROW
        EXECUTE FUNCTION update_multimedia_content_updated_at();
    `,{error:m}=await d.rpc("exec_sql",{sql:E});m&&console.log("Trigger creation may have failed, but continuing...");let{data:T,error:_}=await d.from("multimedia_content").select("id").limit(1);if(_)throw Error(`Table setup verification failed: ${_.message}`);console.log("Multimedia content table setup completed successfully"),t.status(200).json({message:"Multimedia content table setup completed successfully",tableAccessible:!0})}catch(e){console.error("Error setting up multimedia content table:",e),t.status(500).json({error:"Failed to setup multimedia content table",details:e.message,instructions:"Please run the SQL from sql/create_multimedia_content.sql manually in your Supabase dashboard"})}}let s=(0,r.l)(i,"default"),E=(0,r.l)(i,"config"),m=new n.PagesAPIRouteModule({definition:{kind:o.x.PAGES_API,page:"/api/admin/setup-multimedia",pathname:"/api/admin/setup-multimedia",bundlePath:"",filename:""},userland:i})},7153:(e,t)=>{var a;Object.defineProperty(t,"x",{enumerable:!0,get:function(){return a}}),function(e){e.PAGES="PAGES",e.PAGES_API="PAGES_API",e.APP_PAGE="APP_PAGE",e.APP_ROUTE="APP_ROUTE"}(a||(a={}))},1802:(e,t,a)=>{e.exports=a(145)}};var t=require("../../../webpack-api-runtime.js");t.C(e);var a=t(t.s=5904);module.exports=a})();
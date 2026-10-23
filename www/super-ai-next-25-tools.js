(function(){
 const A=window.SuperAIAdvanced=window.SuperAIAdvanced||{};
 A.modules=A.modules||{};
 const tools=new Map();
 A.ToolRegistry={
  register(name,description,handler){
   if(!/^[a-z][a-z0-9_-]{1,50}$/.test(name)||typeof handler!=="function")return false;
   tools.set(name,{name,description:String(description||"").slice(0,300),handler});
   return true;
  },
  list(){return [...tools.values()].map(({name,description})=>({name,description}))},
  async run(name,input,options={}){
   const t=tools.get(name);if(!t)throw Error("Unknown tool: "+name);
   if(options.allow!==true)throw Error("Tool execution requires explicit allow:true");
   return await t.handler(input);
  },
  remove(name){return tools.delete(name)}
 };
 A.register=A.register||function(n,m){A.modules[n]=m};
 A.register("next-25-tools",A.ToolRegistry);
})();

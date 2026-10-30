import base from "./vite.config.js";
export default (env) => {
  const c = base(env);
  c.build = { ...c.build, outDir: process.env.OUT || "build-analyze", minify: false };
  c.plugins.push({ name: "an", generateBundle(_, b) {
    for (const ch of Object.values(b)) {
      if (ch.type !== "chunk" || !/^(index|ResizableSide|Exercise|Planning|JobTracker)/.test(ch.fileName.split("/").pop())) continue;
      const groups = {};
      for (const [id, m] of Object.entries(ch.modules)) {
        const mm = id.match(/node_modules[\/]((?:@[^\/]+[\/])?[^\/]+)/);
        const k = mm ? mm[1] : id.replace(/.*CodeNITW[\/]/, "");
        groups[k] = (groups[k] || 0) + m.renderedLength;
      }
      console.log("\n== " + ch.fileName);
      Object.entries(groups).sort((a,b)=>b[1]-a[1]).slice(0,12).forEach(([k,v]) => console.log((v/1024).toFixed(0).padStart(6)+" KB  "+k));
    }
  }});
  return c;
};

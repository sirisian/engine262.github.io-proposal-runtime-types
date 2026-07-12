import nextra from "nextra";
import path from "node:path";

const withNextra = nextra({ contentDirBasePath: "/", search: { codeblocks: false } });

export default withNextra({
  basePath: "/docs",
  output: "export",
  distDir: "../dist/docs",
  reactStrictMode: true,
  trailingSlash: true,
  turbopack: { root: path.join(import.meta.dirname, "..") },
  images: { unoptimized: true },
});

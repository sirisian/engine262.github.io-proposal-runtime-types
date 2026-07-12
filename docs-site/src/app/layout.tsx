import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Head } from "nextra/components";
import { getPageMap } from "nextra/page-map";
import { Footer, Layout, Navbar } from "nextra-theme-docs";
import "nextra-theme-docs/style.css";
import "./globals.css";

const siteUrl = "https://engine262.js.org";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "engine262 Documentation", template: "%s – engine262" },
  description: "An implementation of ECMA-262 in JavaScript",
  alternates: { canonical: "/docs/" },
  openGraph: {
    type: "website",
    url: "/docs/",
    siteName: "engine262",
    title: "engine262 Documentation",
    description: "An implementation of ECMA-262 in JavaScript",
  },
};

const navbar = (
  <Navbar
    logo={
      <span className="engine262-logo">
        <span aria-hidden="true" className="engine262-mark">
          262
        </span>
        <strong>engine262</strong>
      </span>
    }
    logoLink="/"
    projectLink="https://github.com/engine262/engine262"
  >
    <a href="/docs/">Documentation</a>
    <a href="/">Classic Playground</a>
    <a href="/devtools.html">DevTools</a>
  </Navbar>
);

const footer = <Footer>MIT License · engine262 Contributors</Footer>;

export default async function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <Head />
      <body>
        <Layout
          navbar={navbar}
          pageMap={await getPageMap()}
          docsRepositoryBase="https://github.com/engine262/engine262.github.io/tree/master/docs-site/src/content"
          editLink="Edit this page on GitHub"
          darkMode
          navigation={{ prev: true, next: true }}
          footer={footer}
        >
          {children}
        </Layout>
      </body>
    </html>
  );
}

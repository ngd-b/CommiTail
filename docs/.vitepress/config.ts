import { defineConfig } from "vitepress";
const pkg = require("../../package.json");

export default defineConfig({
  title: "CommiTail",
  description: "智能追加 Git 提交信息后缀",

  themeConfig: {
    logo: "/icon.png",
    editLink: {
      pattern: "https://github.com/ngd-b/CommiTail/edit/main/docs/:path",
    },
    search: {
      provider: "local",
    },
    socialLinks: [
      {
        icon: "github",
        link: "https://github.com/ngd-b/CommiTail",
      },
    ],
    nav: [
      {
        text: pkg.version,
        items: [
          {
            text: "更新日志",
            link: "https://github.com/ngd-b/CommiTail/releases",
          },
        ],
      },
    ],
  },
  srcDir: "src",
  lastUpdated: true,
  sitemap: {
    hostname: "https://commital.hboot.fun",
  },
  cleanUrls: true,
});

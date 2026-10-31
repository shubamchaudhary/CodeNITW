import { Config } from "@remotion/cli/config";

// Images and narration live in the site's public folder, so the site serves
// the same files when it plays a lecture in the page.
Config.setPublicDir("../public/lectures");
Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(92);
Config.setConcurrency(6);
Config.setCodec("h264");
Config.setCrf(20);

// @uiw/react-markdown-preview imports `rehype-prism-plus`, which registers all
// ~300 Prism languages (about 1 MB of grammars, and the slowest part of the
// build). vite.config.js points that import here instead: the common set plus
// the few extra languages the notes' code fences use.
import { refractor } from "refractor/lib/common.js";
import jsx from "refractor/lang/jsx.js";
import tsx from "refractor/lang/tsx.js";
import docker from "refractor/lang/docker.js";
import toml from "refractor/lang/toml.js";
import graphql from "refractor/lang/graphql.js";
import rehypePrismGenerator from "rehype-prism-plus/generator";

[jsx, tsx, docker, toml, graphql].forEach((lang) => refractor.register(lang));

export default rehypePrismGenerator(refractor);

/**
 * One-off helper: regenerate scripts/fixtures/y1g3.html from data/raw.html.
 * Not needed for tests or builds.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import * as cheerio from "cheerio";

const ROOT = join(__dirname, "..");
const html = readFileSync(join(ROOT, "data", "raw.html"), "utf8");
const $ = cheerio.load(html);

const table = $("table[id^=table_]")
  .filter((_, el) => $(el).find("caption .name").first().text().trim() === "UR6523002 - Y1G3 (25)")
  .first();

const rendered = $.html(table);
const start = rendered.indexOf("<table");
const end = rendered.lastIndexOf("</table>") + "</table>".length;
const inner = rendered.slice(start, end);

writeFileSync(
  join(ROOT, "scripts", "fixtures", "y1g3.html"),
  `<!DOCTYPE html>
<html lang="en-US">
  <head><meta charset="UTF-8" /><title>fixture</title></head>
  <body id="top">
    <p><strong>Table of contents</strong></p>
    <ul>
      <li>
        Year (FKC) Bachelor of Computer Engineering with Honours
        <ul>
          <li>
            Group <a href="#table_2">UR6523002 - Y1G1 (25)</a>
          </li>
          <li>
            Group <a href="#table_6">UR6523002 - Y1G3 (25)</a>
          </li>
        </ul>
      </li>
    </ul>
    <p>&nbsp;</p>
${inner}
    <p class="back"><a href="#top">back to the top</a></p>
  </body>
</html>
`,
  "utf8",
);

console.log("wrote fixtures/y1g3.html", inner.length, "bytes");
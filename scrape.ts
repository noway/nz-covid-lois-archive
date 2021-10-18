import fetch from "node-fetch";
import cheerio from "cheerio";
import fromNdjson from "from-ndjson";
import ndjson from "ndjson";
import { createWriteStream, readFileSync } from "node:fs";
import simpleGit from "simple-git";
interface LOI {
  "Location name": string;
  Address: string;
  Day: string;
  Times: string;
  "What to do": string;
  Updated: string;
}
type LOIField = keyof LOI;

interface ResultLOI {
  "Location name": string;
  Address: string;
  "Start date": string;
  "End date": string;
  "What to do": string;
  Updated: string;
}

async function fetchLois() {
  const res = await fetch(
    "https://www.health.govt.nz/our-work/diseases-and-conditions/covid-19-novel-coronavirus/covid-19-health-advice-public/contact-tracing-covid-19/covid-19-contact-tracing-locations-interest"
  );
  const body = await res.text();
  const $ = cheerio.load(body);
  const table = $(".view-content .views-table");

  const ths = $(table).find("thead th");

  const headings: LOIField[] = [];
  ths.each((i, th) => {
    const text = $(th).text().trim() as LOIField;
    headings.push(text);
  });

  const trs = $(table).find("tbody tr");
  const lois: Partial<ResultLOI>[] = [];
  trs.each((i, tr) => {
    const tds = $(tr).find("td");
    const loi: Partial<ResultLOI> = {};
    tds.each((i, td) => {
      const heading = headings[i];
      if (heading === "Day") {
        return;
      }
      if (heading === "Times") {
        const dates = $(td).find('[datatype="xsd:dateTime"]');
        const [startDate, endDate] = dates
          .toArray()
          .map((date) => $(date).attr("content"));
        loi["Start date"] = startDate;
        loi["End date"] = endDate;
        return;
      }
      const text = $(td).text().trim();
      loi[heading] = text;
    });
    lois.push(loi);
  });
  return lois;
}

function getId(loi: Partial<ResultLOI>): string {
  return `${loi["Location name"]}${loi["Start date"]}`;
}

async function main() {
  const existingLois: Partial<ResultLOI>[] = fromNdjson(
    readFileSync("all-lois.ndjson", "utf8")
  );
  const existingLoiIds = [...new Set(existingLois.map(getId))];
  console.log("existingLoiIds.length", existingLoiIds.length);

  const lois = await fetchLois();

  const stringifier = ndjson.stringify();
  stringifier.pipe(createWriteStream("all-lois.ndjson"));
  stringifier.pipe(process.stdout);
  for (const loi of existingLois) {
    await new Promise((resolve) => stringifier.write(loi, "utf8", resolve));
  }
  for (const loi of lois) {
    if (existingLoiIds.includes(getId(loi))) {
      continue;
    }
    await new Promise((resolve) => stringifier.write(loi, "utf8", resolve));
  }

  stringifier.end(() => {
    // push to git
    simpleGit()
      .pull()
      .add("./*")
      .commit(
        `update data from ${new Date().toLocaleString("en-nz", {
          timeZone: "Pacific/Auckland",
        })}`
      )
      .push(["-u", "origin", "main"], () => console.log("pushed"));
  });
}

main();

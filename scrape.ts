import fetch from "node-fetch";
import cheerio from "cheerio";
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
  });
}

async function main() {
  fetchLois();
}

main();

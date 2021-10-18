import fetch from "node-fetch";
import cheerio from "cheerio";

async function fetchLois() {
  const res = await fetch(
    "https://www.health.govt.nz/our-work/diseases-and-conditions/covid-19-novel-coronavirus/covid-19-health-advice-public/contact-tracing-covid-19/covid-19-contact-tracing-locations-interest"
  );
  const body = await res.text();
  const $ = cheerio.load(body);
  const table = $(".view-content .views-table");

  const trs = $(table).find("tr");
  trs.each((i, tr) => {
    const tds = $(tr).find("td");
    const texts: string[] = [];
    tds.each((i, td) => {
      texts.push($(td).text().trim());
      // console.log('tdText',)
    });
    console.log(texts);
  });

  //   console.log("body", body);
}

async function main() {
  fetchLois();
}

main();

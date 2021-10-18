import fetch from 'node-fetch'

async function fetchLois() {
    const res = await fetch("https://www.health.govt.nz/our-work/diseases-and-conditions/covid-19-novel-coronavirus/covid-19-health-advice-public/contact-tracing-covid-19/covid-19-contact-tracing-locations-interest")
    const data = await res.text()
    console.log('data',data)
}

async function main() {
    fetchLois()
}

main()
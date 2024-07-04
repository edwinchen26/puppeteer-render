const puppeteer = require("puppeteer");
require("dotenv").config();

const scrapeLogic = async (res) => {
  const browser = await puppeteer.launch({
    args: [
      "--disable-setuid-sandbox",
      "--no-sandbox",
      "--single-process",
      "--no-zygote",
    ],
    executablePath:
      process.env.NODE_ENV === "production"
        ? process.env.PUPPETEER_EXECUTABLE_PATH
        : puppeteer.executablePath(),
  });
  try {
    const page = await browser.newPage();
    await page.setRequestInterception(true);

    page.on("request", request => request.continue());

    page.on("response", (response) => {
      const request = response.request();

      if (request.resourceType() === "xhr" && request.url().includes('TweetResultByRestId')) {
        console.log(request.url());

        response.json().then(output => {
          const data = output?.data?.tweetResult?.result;

          const metrics = {
            created_at: data.legacy.created_at,
            bookmark_count: data.legacy.bookmark_count,
            favorite_count: data.legacy.favorite_count,
            quote_count: data.legacy.quote_count,
            reply_count: data.legacy.reply_count,
            retweet_count: data.legacy.retweet_count
          };

          res.send(metrics);
        });
      }
    });

    await page.goto("https://x.com/scarra/status/1808951107026366913", { waitUntil: 'networkidle0' });
  } catch (e) {
    console.error(e);
    res.send(`Something went wrong while running Puppeteer: ${e}`);
  } finally {
    await browser.close();
  }
};

module.exports = { scrapeLogic };

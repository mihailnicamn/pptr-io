const playwright = require('playwright');

const run = async (url, proxyChainUrl) => {
    const browser = await playwright.webkit.launch({
        headless: false,
    });
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(url);
    await page.waitForTimeout(10000)
    await page.close()
    await browser.close();
    return {
        message: "ok"
    };
}

const url = 'https://destyy.com/ehIprV'


module.exports = async (req, res) => {
    const _res = await run(url)
    res.statusCode = 200;
    res.json(_res);
    res.end();
    return;
}
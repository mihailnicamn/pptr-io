const puppeteer = require("puppeteer-core");
const chrome = require("chrome-aws-lambda");
const proxyChain = require('proxy-chain');
const net = require('net');

const getFreePort = () => {
    return new Promise((resolve, reject) => {
        const server = net.createServer();
        server.unref();
        server.on('error', reject);
        server.listen(0, () => {
            const { port } = server.address();
            server.close(() => {
                resolve(port);
            });
        });
    });
}
const wait = (ms) => {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}
module.exports = async (req, res) => {
    const {
        url,
        proxy,
        userAgent
    } = req.query;
    if (!url) {
        res.statusCode = 400;
        res.json({
            error: "url is required"
        });
        res.end();
        return;
    }
    if (!proxy) {
        res.statusCode = 400;
        res.json({
            error: "proxy is required"
        });
        res.end();
        return;
    }
    if (!userAgent) {
        res.statusCode = 400;
        res.json({
            error: "userAgent is required"
        });
        res.end();
        return;
    }
    const port = await getFreePort();
    const proxyURL = await proxyChain.anonymizeProxy({ url: proxy, port });
    const browser = await puppeteer.launch({
        args: [
            `--proxy-server=${proxyURL}`,
            ...chrome.args,
            "--hide-scrollbars",
            "--disable-web-security"
        ],
        defaultViewport: chrome.defaultViewport,
        executablePath: await chrome.executablePath,
        ignoreHTTPSErrors: true,
    });
    const [page] = await browser.pages();
    await page.setUserAgent(userAgent);
    await page.goto(url, { timeout: 0 })
    await wait(10000)
    const skip = await page.$('#skip_button')
    if (!skip) {
        await page.close()
        await browser.close();
        process.exit(0)
    }
    await page.click('#skip_button')
    await wait(10000)
    await page.close()
    await browser.close();
    await proxyChain.closeAnonymizedProxy(proxyURL)
}

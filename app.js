const fs = require('fs');
const puppeteer = require('puppeteer');
const CRED = require('./creds.rem');

const SELECTORS = {
    login: '#email',
    pass: '#pass',
    loginButton: '#loginbutton'
};

const FB_URLS = {
    fbHome: 'https://www.facebook.com',
    fbFriends: 'https://www.facebook.com/find-friends/browser'
};

const USER_PATH = __dirname + '/users-cookies/' + CRED.user + '.txt';

const sleep = async (ms) => {
    return new Promise((res, rej) => {
        setTimeout(() => {
            res();
        }, ms)
    });
};

const launchBrowser = async () => {
    const browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-notifications']
    });

    console.log('browser opened!');

    return browser;
};

const openPage = async (browser) => {
    const page = await browser.newPage();
    console.log('opened new tab!');
    return page;
};

const gotoHome = async (page) => {
    await page.goto(FB_URLS.fbHome, {
        waitUntil: 'networkidle2'
    });
};

const login = async (page) => {
    // login
    await gotoHome(page);

    await page.waitForSelector(SELECTORS.login);
    await page.type(SELECTORS.login, CRED.user);

    await page.type(SELECTORS.pass, CRED.pass);
    await sleep(500);

    await page.click(SELECTORS.loginButton);

    console.log('login done!');
    await page.waitForNavigation();
}

const getCookies = async (page) => {
    const cookies = await page.cookies(FB_URLS.fbHome);
    fs.writeFile(USER_PATH, JSON.stringify(cookies), (error) => {
        if (error) {
            console.log(error);
        } else {
            console.log('Cookies were written to file!');
        }
    });
};

const setCookies = async (page) => {
    const cookies = fs.readFileSync(USER_PATH, 'UTF-8');
    if (cookies) {
        await page.setCookie(...JSON.parse(cookies));
    }
};

const gotoFriends = async (page) => {
    const evaluatePageChanging = () => {
        const content = document.querySelector('#content');
        const friendsBox = document.querySelector('#fbSearchResultsBox');
        content.prepend(friendsBox);
    };

    await page.goto(FB_URLS.fbFriends);
    await page.evaluate(evaluatePageChanging);

    console.log('goto friends!');
};

const makeScreenshot = async (page) => {
    await page.screenshot({
        path: 'facebook.png',
        clip: {
            x: 0,
            y: 110,
            width: 660,
            height: 490
        }
    });

    console.log('screenshot done!')
};

const init = (async (SELECTORS) => {
    const browser = await launchBrowser();
    const page = await openPage(browser);

    if (fs.existsSync(USER_PATH)) {
        await setCookies(page);
        await gotoHome(page);
        console.log('user exist!');
    } else {
        await login(page);
        await getCookies(page);
        console.log('user not exist!');
    }
    
    await gotoFriends(page);
    await makeScreenshot(page);

    console.log('exit!');
    process.exit();
})();
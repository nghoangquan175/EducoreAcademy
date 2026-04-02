const puppeteer = require('puppeteer');

let browserInstance = null;

/**
 * Singleton to manage Puppeteer browser instance
 */
const getBrowser = async () => {
    if (!browserInstance || !browserInstance.isConnected()) {
        console.log('Launching new Puppeteer browser...');
        browserInstance = await puppeteer.launch({
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--font-render-hinting=none'
            ]
        });
        
        // Handle unexpected disconnection
        browserInstance.on('disconnected', () => {
            console.log('Puppeteer browser disconnected');
            browserInstance = null;
        });
    }
    return browserInstance;
};

/**
 * Generate PDF from HTML
 * @param {string} html 
 * @param {object} options 
 * @returns {Promise<Buffer>}
 */
const generatePDF = async (html, options = {}) => {
    const browser = await getBrowser();
    const page = await browser.newPage();
    
    try {
        await page.setContent(html, { waitUntil: 'networkidle0' });
        
        const pdfBuffer = await page.pdf({
            format: options.format || 'A4',
            landscape: options.landscape !== undefined ? options.landscape : true,
            printBackground: true,
            margin: options.margin || { top: '0px', right: '0px', bottom: '0px', left: '0px' }
        });
        
        return pdfBuffer;
    } finally {
        await page.close();
    }
};

module.exports = {
    getBrowser,
    generatePDF
};

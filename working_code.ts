import axios from 'axios';
import cheerio from 'cheerio';

async function scrapeProductDetails(productName: string, pincode: string): Promise<{ modelNumber: string | null, price: string | null, name: string | null, brand: string | null }> {
    try {
        const url = `https://www.homedepot.com/s/${encodeURIComponent(productName)}?NCNI-5&storeSearchZip=${pincode}`;
        const response = await axios.get(url);

        if (response.status !== 200) {
            console.error(`Failed to fetch page. Status code: ${response.status}`);
            return { modelNumber: null, price: null, name: null, brand: null };
        }

        const html = response.data;
        const $ = cheerio.load(html);

        // Adjusted selector to target the specific elements
        const modelNumberElement = $('.sui-flex.sui-text-xs.sui-mb-1.sui-mr-1'); // Adjust as per the actual HTML structure
        const priceElement = $('.price-format__main-price'); // Adjust as per the actual HTML structure
        const nameElement = $('.sui-text-primary.sui-font-regular.sui-mb-1.sui-line-clamp-5.sui-text-ellipsis.sui-inline'); // Adjust as per the actual HTML structure
        const brandElement = $('[data-testid="attribute-brandname-above"].sui-text-primary.sui-font-w-bold'); // Adjust as per the actual HTML structure

        const modelNumberText = modelNumberElement.length > 0 ? modelNumberElement.first().text().trim() : null;
        const priceText = priceElement.length > 0 ? priceElement.first().text().trim() : null;
        const nameText = nameElement.length > 0 ? nameElement.first().text().trim() : null;
        const brandText = brandElement.length > 0 ? brandElement.first().text().trim() : null;

        if (!modelNumberText) {
            console.error('Model number element not found on the page.');
        }

        if (!priceText) {
            console.error('Price element not found on the page.');
        }

        if (!nameText) {
            console.error('Product name element not found on the page.');
        }

        if (!brandText) {
            console.error('Brand element not found on the page.');
        }

        return { modelNumber: modelNumberText, price: priceText, name: nameText, brand: brandText };
    } catch (error) {
        console.error('Error scraping product details from Home Depot:', error.message);
        return { modelNumber: null, price: null, name: null, brand: null };
    }
}

// Example usage:
async function main() {
    const productName = 'Electric Wire'; // Replace with product name
    const pincode = '94102'; // Replace with desired pincode
    const { modelNumber, price, name, brand } = await scrapeProductDetails(productName, pincode);

    if (modelNumber !== null && price !== null && name !== null && brand !== null) {
        console.log(`The brand of the product is ${brand}, the name is ${name}. The model number is ${modelNumber} and the price is ${price}.`);
    } else {
        console.log(`Failed to retrieve brand, name, model number, and/or price for ${productName}`);
    }
}

main();

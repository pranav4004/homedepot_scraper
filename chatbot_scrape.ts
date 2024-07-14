import { GenerativeModel, GoogleGenerativeAI } from '@google/generative-ai';
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
    } catch (error:any) {
        console.error('Error scraping product details from Home Depot:', error.message);
        return { modelNumber: null, price: null, name: null, brand: null };
    }
}

async function main() {
const productName = 'Nails'; // Replace with product name
const pincode = '94102'; // Replace with desired pincode
const { modelNumber, price, name, brand } = await scrapeProductDetails(productName, pincode);

const configuration = new GoogleGenerativeAI('AIzaSyAqQSKbGM3zfYNfsKKl7RSBc9LQUyX8A6c');
const model = configuration.getGenerativeModel({ model: "gemini-1.0-pro" });

const prompt = `I have a product with the following details:
Brand: ${brand}
Name: ${name}
Model Number: ${modelNumber}
Price: ${price}
Please structure this data into JSON format with the following fields: name, unit, price_per_unit, price, and specification.

- "name" should be the product name.
- "unit" should be derived from the product name or specifications if it indicates quantity, length, weight, or other measurement. Use the following units: EA (Each), LF (Linear Foot), SQFT (Square Foot), and H (Height).
- "price_per_unit" should be calculated based on the derived unit.
  - If the unit is EA (Each), calculate "price_per_unit" based on the total price divided by the number of items.
  - If the unit is LF (Linear Foot), calculate "price_per_unit" based on the total price divided by the total length in feet.
  - If the unit is SQFT (Square Foot), calculate "price_per_unit" based on the total price divided by the total area in square feet.
  - If the unit is H (Height), calculate "price_per_unit" based on the total price divided by the total height.
- "price" should be the total price of the product.
- "specification" should include relevant attributes based on the product name.

For example, for a hammer, if the unit is weight (e.g., 10 oz), calculate the price per ounce. For wires sold by the foot, provide the appropriate unit and calculate the price per unit accordingly.

Provide the output in a JSON format.`;

const result = await model.generateContent(prompt);

  console.log(result.response.text());
}

main().catch(console.error);

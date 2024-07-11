import axios from 'axios';
import cheerio from 'cheerio';

interface ProductDetails {
    productLink: string | null;
}

async function scrapeProductLink(productName: string, pincode: string): Promise<ProductDetails> {
    try {
        const searchUrl = `https://www.homedepot.com/s/${encodeURIComponent(productName)}?NCNI-5&storeSearchZip=${pincode}`;
        const searchResponse = await axios.get(searchUrl);

        if (searchResponse.status !== 200) {
            console.error(`Failed to fetch search page. Status code: ${searchResponse.status}`);
            return { productLink: null };
        }

        const searchHtml = searchResponse.data;
        const $search = cheerio.load(searchHtml);

        const firstProductLink = $search('.sui-flex.sui-flex-col.sui-relative.sui-w-full.sui-mb-2.sui-bg-primary a').first().attr('href');
        if (!firstProductLink) {
            console.error('No product links found on the search results page.');
            return { productLink: null };
        }

        const productLink = `https://www.homedepot.com${firstProductLink}`;
        return { productLink };
    } catch (error) {
        console.error('Error scraping product link from Home Depot:', error.message);
        return { productLink: null };
    }
}

async function scrapeProductDetails(productLink: string): Promise<void> {
    try {
        console.log(`Navigating to product page: ${productLink}`);

        const productResponse = await axios.get(productLink);

        if (productResponse.status !== 200) {
            console.error(`Failed to fetch product page. Status code: ${productResponse.status}`);
            return;
        }

        const productHtml = productResponse.data;
        const $product = cheerio.load(productHtml);

        // Example: Check if the product details container is correctly selected
        const productDetailsContainer = $product('table[name="Details"]');
        if (!productDetailsContainer.length) {
            console.error('Product details container not found or selector incorrect.');
            return;
        }

        // Initialize an empty array to store the table data
        let tableData: { key: string, value: string }[] = [];

        // Get all rows in the table
        const rows = productDetailsContainer.find('tr');

        // Iterate through each row
        rows.each((index, row) => {
            // Get all header and data cells in the row
            let headers = $product(row).find('th');
            let cells = $product(row).find('td');

            if (headers.length !== cells.length) {
                console.error(`Number of headers (${headers.length}) does not match number of cells (${cells.length}) in row ${index}. Skipping row.`);
                return; // Skip this row if header and cell count don't match
            }

            // Initialize an object to store header and cell text
            let rowData: { key: string, value: string } = { key: '', value: '' };

            // Iterate through each header and cell pair
            headers.each((i, header) => {
                rowData.key = $product(header).text().trim();
            });

            cells.each((i, cell) => {
                rowData.value = $product(cell).text().trim();
            });

            // Push the key-value pair to the tableData array
            tableData.push(rowData);
        });

        // Print the table data in a proper format
        tableData.forEach(item => {
            console.log(`${item.key}: ${item.value}`);
        });

    } catch (error) {
        console.error('Error scraping product details:', error.message);
    }
}

// Example usage:
async function main() {
    const productName = 'Electric Wire'; // Replace with product name
    const pincode = '94102'; // Replace with desired pincode
    const { productLink } = await scrapeProductLink(productName, pincode);

    if (productLink) {
        console.log(`Found product link: ${productLink}`);
        await scrapeProductDetails(productLink);
    } else {
        console.log(`Failed to retrieve product link for ${productName}`);
    }
}

main();
 
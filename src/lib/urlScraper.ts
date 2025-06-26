import * as cheerio from 'cheerio';

export async function extractTextFromUrl(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.statusText}`);
    }
    const html = await response.text();
    const $ = cheerio.load(html);

    // Remove script and style elements
    $('script, style, nav, footer, header, noscript').remove();

    // Get text from the body, trying to select main content areas
    const mainContent = $('main, article, .main, #main, #content, .content').text();
    const bodyText = mainContent || $('body').text();

    // Basic text cleaning
    return bodyText.replace(/\s\s+/g, ' ').trim();
  } catch (error) {
    console.error('Error fetching or parsing URL:', error);
    throw new Error('Could not retrieve content from the provided URL.');
  }
} 
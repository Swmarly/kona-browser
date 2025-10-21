const { load } = require('cheerio');
const http = require('node:http');
const https = require('node:https');

const GOOGLE_BASE_URL = 'https://www.google.com';
const GOOGLE_SEARCH_ENDPOINT = `${GOOGLE_BASE_URL}/search`;

const DEFAULT_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
  Referer: GOOGLE_BASE_URL,
  Connection: 'keep-alive',
  'Accept-Encoding': 'identity'
};

const MAX_REDIRECTS = 5;

const parseResultStats = (rawText) => {
  if (!rawText) {
    return {
      statsText: '',
      estimatedResults: null,
      formattedEstimatedResults: null,
      searchTimeInSeconds: null
    };
  }

  const statsText = rawText.replace(/\u00a0/g, ' ').trim();
  const match = statsText.match(/(?:About\s+)?([\d,.]+)\s+results(?:\s*\(([\d.,]+)\s*seconds\))?/i);

  let estimatedResults = null;
  let formattedEstimatedResults = null;
  let searchTimeInSeconds = null;

  if (match) {
    const rawCount = match[1];
    const digits = rawCount.replace(/[^\d]/g, '');
    if (digits) {
      const numericValue = Number(digits);
      if (Number.isFinite(numericValue)) {
        estimatedResults = numericValue;
        try {
          formattedEstimatedResults = new Intl.NumberFormat('en-US').format(numericValue);
        } catch (_error) {
          formattedEstimatedResults = rawCount.replace(/\s+/g, ' ');
        }
      }
    }

    if (match[2]) {
      const timeDigits = match[2].replace(/[^\d.]/g, '');
      const parsedTime = Number.parseFloat(timeDigits);
      if (Number.isFinite(parsedTime)) {
        searchTimeInSeconds = parsedTime;
      }
    }
  }

  return {
    statsText,
    estimatedResults,
    formattedEstimatedResults,
    searchTimeInSeconds
  };
};

const parseRelatedQueries = ($) => {
  const related = [];
  const seen = new Set();

  $('a.k8XOCe').each((_, anchor) => {
    const text = $(anchor).text().trim();
    const href = $(anchor).attr('href');
    if (!text || !href) {
      return;
    }

    try {
      const target = new URL(href, GOOGLE_BASE_URL);
      const query = target.searchParams.get('q');
      if (!query || seen.has(query)) {
        return;
      }
      seen.add(query);
      related.push(query);
    } catch (_error) {
      // ignore invalid URLs
    }
  });

  return related;
};

const parseDidYouMean = ($) => {
  const anchor = $('a.gL9Hy').first();
  if (!anchor.length) {
    return null;
  }

  const suggestion = anchor.text().trim();
  if (!suggestion) {
    return null;
  }

  const href = anchor.attr('href');
  let query = null;
  if (href) {
    try {
      const target = new URL(href, GOOGLE_BASE_URL);
      query = target.searchParams.get('q');
    } catch (_error) {
      query = null;
    }
  }

  return { suggestion, query };
};

const parseOrganicResults = ($) => {
  const results = [];
  const seen = new Set();

  $('div.g').each((_, element) => {
    const container = $(element);
    const link = container.find('div.yuRUbf > a').first();

    if (!link.length) {
      return;
    }

    const url = link.attr('href');
    const title = link.find('h3').text().trim() || container.find('h3').first().text().trim();
    const snippet = container.find('div.VwiC3b').text().trim() || container.find('span.aCOpRe').text().trim();
    const displayLink = container.find('div.yuRUbf cite').text().trim();

    if (!url || !title || seen.has(url)) {
      return;
    }

    seen.add(url);
    results.push({
      title,
      url,
      snippet,
      displayLink
    });
  });

  return results;
};

const detectCaptchaPage = (html, finalUrl) => {
  if (finalUrl && finalUrl.includes('/sorry/')) {
    return true;
  }

  if (!html) {
    return false;
  }

  return /unusual traffic from your computer network/i.test(html);
};

const performRequest = (targetUrl, redirectCount = 0) => {
  if (redirectCount > MAX_REDIRECTS) {
    throw new Error('Too many redirects encountered while requesting Google Search.');
  }

  const url = typeof targetUrl === 'string' ? new URL(targetUrl) : targetUrl;
  const isHttps = url.protocol === 'https:';
  const transport = isHttps ? https : http;

  return new Promise((resolve, reject) => {
    const request = transport.request(
      {
        protocol: url.protocol,
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        method: 'GET',
        path: `${url.pathname}${url.search}`,
        headers: DEFAULT_HEADERS
      },
      (response) => {
        const { statusCode = 0, headers } = response;

        if (
          statusCode >= 300 &&
          statusCode < 400 &&
          headers?.location
        ) {
          const redirectUrl = new URL(headers.location, url);
          response.resume();
          resolve(performRequest(redirectUrl, redirectCount + 1));
          return;
        }

        const chunks = [];
        response.on('data', (chunk) => chunks.push(chunk));
        response.on('error', reject);
        response.on('end', () => {
          const body = Buffer.concat(chunks);
          resolve({
            statusCode,
            headers,
            body,
            finalUrl: url.toString()
          });
        });
      }
    );

    request.on('error', reject);
    request.end();
  });
};

const buildSearchUrl = (query) => {
  const url = new URL(GOOGLE_SEARCH_ENDPOINT);
  url.searchParams.set('q', query);
  url.searchParams.set('hl', 'en');
  url.searchParams.set('gl', 'us');
  url.searchParams.set('num', '10');
  url.searchParams.set('safe', 'off');
  return url;
};

const searchGoogle = async (query) => {
  const trimmed = typeof query === 'string' ? query.trim() : '';
  if (!trimmed) {
    return {
      query: '',
      results: [],
      info: parseResultStats(''),
      relatedQueries: [],
      didYouMean: null
    };
  }

  const url = buildSearchUrl(trimmed);
  const { statusCode, body, finalUrl } = await performRequest(url);

  if (statusCode < 200 || statusCode >= 300) {
    const error = new Error(`Google search request failed with status ${statusCode}`);
    error.status = statusCode;
    throw error;
  }

  const html = body.toString('utf8');

  if (detectCaptchaPage(html, finalUrl)) {
    const error = new Error('Google blocked the automated request with a captcha challenge.');
    error.code = 'GOOGLE_CAPTCHA';
    throw error;
  }

  const $ = load(html);
  const organicResults = parseOrganicResults($);
  const info = parseResultStats($('#result-stats').text() || $('div#result-stats').text());
  const relatedQueries = parseRelatedQueries($);
  const didYouMean = parseDidYouMean($);

  return {
    query: trimmed,
    results: organicResults,
    info,
    relatedQueries,
    didYouMean
  };
};

module.exports = {
  searchGoogle
};

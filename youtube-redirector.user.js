// ==UserScript==
// @name         YouTube to SK Video Dashboard Redirector
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  Redirects from Techloq filter pages and direct YouTube links to the SK Video Dashboard.
// @author       Shalom Karr / YH Studios
// @match        *://*/*?*v=*
// @match        https://www.youtube.com/watch*
// @grant        none
// @updateURL    https://raw.githubusercontent.com/Shalom-Karr/youtube-redirector/main/youtube-redirector.user.js
// @downloadURL  https://raw.githubusercontent.com/Shalom-Karr/youtube-redirector/main/youtube-redirector.user.js
// ==/UserScript==

(function() {
    'use strict';

    // --- CONFIGURATION ---
    // !!! IMPORTANT: Replace this URL with the base URL of your video dashboard player.
    const DASHBOARD_URL = 'https://YOUR-SK-VIDEO-DASHBOARD-URL-HERE/player?v=';
    // Example: const DASHBOARD_URL = 'https://sk-videos.com/play?v=';
    // --- END CONFIGURATION ---


    /**
     * Extracts the YouTube video ID from a URL string.
     * @param {string} url The URL to parse.
     * @returns {string|null} The video ID or null if not found.
     */
    function getVideoId(url) {
        try {
            const urlObj = new URL(url);
            // Handles both youtube.com and youtu.be links
            if (urlObj.hostname.includes('youtube.com')) {
                return urlObj.searchParams.get('v');
            }
            if (urlObj.hostname.includes('youtu.be')) {
                return urlObj.pathname.slice(1);
            }
        } catch (e) {
            // Fallback for malformed URLs that might just contain the ID in text
            const regex = /(?:v=|\/)([0-9A-Za-z_-]{11}).*/;
            const match = url.match(regex);
            if (match) {
                return match[1];
            }
        }
        return null;
    }

    /**
     * Redirects the browser to the dashboard with the given video ID.
     * @param {string} videoId The YouTube video ID.
     */
    function redirectToDashboard(videoId) {
        if (videoId) {
            const redirectUrl = DASHBOARD_URL + videoId;
            console.log(`[YT Redirector] Redirecting to: ${redirectUrl}`);
            // Use replace so the back button doesn't get stuck in a loop
            window.location.replace(redirectUrl);
        }
    }


    // --- MAIN SCRIPT LOGIC ---
    const currentUrl = window.location.href;
    const currentHostname = window.location.hostname;

    // SCENARIO 1: We are on a standard YouTube watch page.
    if (currentHostname === 'www.youtube.com' && currentUrl.includes('/watch')) {
        const videoId = getVideoId(currentUrl);
        redirectToDashboard(videoId);
        return; // Stop the script here
    }

    // SCENARIO 2: We are on a different page (like a Techloq filter) that might contain a YouTube link.
    // This part of the logic will search the page content for a YouTube link to redirect from.
    // This is a more robust way to handle filter pages without knowing their exact URL.
    if (document.body && document.body.innerText.includes('youtube.com/watch?v=')) {
        // Find all links on the page
        const links = Array.from(document.getElementsByTagName('a'));
        for (const link of links) {
            const videoId = getVideoId(link.href);
            if (videoId) {
                // We found a valid YouTube link, redirect and stop searching.
                redirectToDashboard(videoId);
                return;
            }
        }

        // If no <a> tag was found, try to find the link in the page's plain text
        const textMatch = document.body.innerText.match(/https?:\/\/(?:www\.)?youtube\.com\/watch\?v=([0-9A-Za-z_-]{11})/);
        if (textMatch && textMatch[1]) {
             redirectToDashboard(textMatch[1]);
             return;
        }
    }
})();

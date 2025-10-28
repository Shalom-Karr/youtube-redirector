// ==UserScript==
// @name         YouTube to SK Dashboard Redirector
// @namespace    http://tampermonkey.net/
// @version      2.1
// @description  Redirects from Techloq filter pages and direct YouTube links to the SK Video Dashboard.
// @author       Shalom Karr / YH Studios
// @match        *://filter.techloq.com/block-page*
// @match        https://www.youtube.com/watch*
// @grant        none
// @updateURL    https://raw.githubusercontent.com/Shalom-Karr/youtube-redirector/main/youtube-redirector.user.js
// @downloadURL  https://raw.githubusercontent.com/Shalom-Karr/youtube-redirector/main/youtube-redirector.user.js
// ==/UserScript==

(function() {
    'use strict';

    // --- CONFIGURATION ---
    // This is the destination URL for your video player.
    const DASHBOARD_URL = 'https://skyoutube.pages.dev/video?source=';
    // --- END CONFIGURATION ---

    // Stop the script if it's running inside an iframe to prevent unwanted behavior.
    if (window.top !== window.self) {
        return;
    }

    /**
     * Extracts the YouTube video ID from a URL string.
     * @param {string} url The URL to parse.
     * @returns {string|null} The video ID or null if not found.
     */
    function getVideoId(url) {
        // This pattern handles various YouTube URL formats (watch, embed, youtu.be, etc.)
        const pattern = /(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
        const match = url.match(pattern);
        return match ? match[1] : null;
    }

    /**
     * Redirects the browser to the dashboard with the given video ID.
     * @param {string} videoId The YouTube video ID.
     */
    function redirectToDashboard(videoId) {
        if (videoId) {
            const redirectUrl = DASHBOARD_URL + encodeURIComponent(videoId);
            console.log(`[YT Redirector] Redirecting to: ${redirectUrl}`);
            // Use window.location.replace to avoid breaking the browser's back button
            window.location.replace(redirectUrl);
        }
    }

    // --- SCRIPT EXECUTION LOGIC ---

    const currentUrl = window.location.href;
    const currentHostname = window.location.hostname;

    // SCENARIO 1: We are on a standard YouTube watch page.
    if (currentHostname === 'www.youtube.com' && currentUrl.includes('/watch')) {
        const videoId = getVideoId(currentUrl);
        redirectToDashboard(videoId);
        return; // Stop the script here
    }

    // SCENARIO 2: We are on the Techloq filter page.
    if (currentHostname.includes('filter.techloq.com')) {
        // The content on the filter page might load dynamically. We wait a moment to ensure it's available.
        setTimeout(() => {
            const blockDiv = document.querySelector('div.block-url');
            if (blockDiv) {
                const linkElement = blockDiv.querySelector('a');
                if (linkElement && linkElement.href) {
                    const videoId = getVideoId(linkElement.href);
                    redirectToDashboard(videoId);
                } else {
                    console.log("[YT Redirector] No link found inside the .block-url element on Techloq page.");
                }
            } else {
                 console.log("[YT Redirector] No .block-url element found on Techloq page.");
            }
        }, 500); // A 500ms delay is usually sufficient.
        return; // Stop the script here
    }

})();

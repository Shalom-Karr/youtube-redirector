// ==UserScript==
// @name         YouTube to SK Dashboard Redirector
// @namespace    http://tampermonkey.net/
// @version      2.2
// @description  Instantly redirects from YouTube video pages and Techloq filter pages to the SK Video Dashboard.
// @author       Shalom Karr / YH Studios
// @match        *://filter.techloq.com/block-page*
// @match        https://www.youtube.com/watch*
// @run-at       document-start
// @grant        none
// @updateURL    https://raw.githubusercontent.com/Shalom-Karr/youtube-redirector/main/youtube-redirector.user.js
// @downloadURL  https://raw.githubusercontent.com/Shalom-Karr/youtube-redirector/main/youtube-redirector.user.js
// ==/UserScript==

(function() {
    'use strict';

    // --- CONFIGURATION ---
    const DASHBOARD_URL = 'https://skyoutube.pages.dev/video?source=';
    // --- END CONFIGURATION ---

    // Stop the script if it's running inside an iframe.
    if (window.top !== window.self) {
        return;
    }

    /**
     * Extracts the YouTube video ID from a URL string.
     * @param {string} url The URL to parse.
     * @returns {string|null} The video ID or null if not found.
     */
    function getVideoId(url) {
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
            // Use window.location.replace to avoid breaking the browser's back button
            window.location.replace(redirectUrl);
        }
    }

    // --- SCRIPT EXECUTION LOGIC ---

    const currentUrl = window.location.href;
    const currentHostname = window.location.hostname;

    // SCENARIO 1: We are on a standard YouTube watch page.
    // This runs at "document-start" for an instant redirect before the page loads.
    if (currentHostname === 'www.youtube.com' && currentUrl.includes('/watch')) {
        const videoId = getVideoId(currentUrl);
        redirectToDashboard(videoId);
        return; // Stop the script
    }

    // SCENARIO 2: We are on the Techloq filter page.
    // We must wait for the page's content to be dynamically generated.
    if (currentHostname.includes('filter.techloq.com')) {
        // Since the script runs at document-start, we must wait until the DOM is loaded.
        // A simple timeout is reliable for this.
        setTimeout(() => {
            const blockDiv = document.querySelector('div.block-url');
            if (blockDiv) {
                const linkElement = blockDiv.querySelector('a');
                if (linkElement && linkElement.href) {
                    const videoId = getVideoId(linkElement.href);
                    redirectToDashboard(videoId);
                }
            }
        }, 500); // 500ms delay to ensure page elements have been rendered.
        return; // Stop the script
    }

})();

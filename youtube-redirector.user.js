// ==UserScript==
// @name         YouTube to SK Dashboard Redirector
// @namespace    http://tampermonkey.net/
// @version      2.4 // Increased version number
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
    
    // Techloq Retry Settings
    const MAX_TECHLOQ_RETRIES = 5;
    const TECHLOQ_RETRY_INTERVAL_MS = 200; // 1/5 of a second
    // --- END CONFIGURATION ---

    // Stop the script if it's running inside an iframe.
    if (window.top !== window.self) {
        return;
    }

    let techloqAttemptCount = 0;

    /**
     * Extracts the YouTube video ID from a URL string.
     * @param {string} url The URL to parse.
     * @returns {string|null} The video ID or null if not found.
     */
    function getVideoId(url) {
        // Regex handles standard 'watch?v=', shortened 'youtu.be/', and embed paths.
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
            // Use window.location.replace to prevent cluttering the back history
            window.location.replace(redirectUrl);
        }
    }

    /**
     * Tries to find the redirect URL on the Techloq page and initiates redirect.
     */
    function attemptTechloqRedirect() {
        const params = new URLSearchParams(window.location.search);
        const encodedRedirectUrl = params.get('redirectUrl');

        if (encodedRedirectUrl) {
            // Found the URL! Decode it and extract the ID.
            const decodedUrl = decodeURIComponent(encodedRedirectUrl);
            const videoId = getVideoId(decodedUrl);
            
            // Redirect instantly
            redirectToDashboard(videoId);
            return; // Success, stop execution
        }

        // If not found instantly, schedule a retry.
        techloqAttemptCount++;
        if (techloqAttemptCount < MAX_TECHLOQ_RETRIES) {
            setTimeout(attemptTechloqRedirect, TECHLOQ_RETRY_INTERVAL_MS);
        }
        // If MAX_RETRIES is reached, the script quietly exits, allowing the Techloq page to load normally.
    }


    // --- SCRIPT EXECUTION LOGIC ---

    const currentUrl = window.location.href;
    const currentHostname = window.location.hostname;

    // SCENARIO 1: We are on a standard YouTube watch page. (Instant redirect)
    if (currentHostname === 'www.youtube.com' && currentUrl.includes('/watch')) {
        const videoId = getVideoId(currentUrl);
        redirectToDashboard(videoId);
        return; 
    }

    // SCENARIO 2: We are on the Techloq filter page.
    if (currentHostname.includes('filter.techloq.com')) {
        // Run the instant check, which initiates polling if needed.
        attemptTechloqRedirect();
        return;
    }

})();

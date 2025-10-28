// ==UserScript==
// @name         YouTube to SK Dashboard Redirector
// @namespace    http://tampermonkey.net/
// @version      3.4 // Optimized for Persistent Polling (5 minutes max)
// @description  Instantly redirects from YouTube video pages. On Techloq pages, it persistently polls (checks) for the redirection link until found (up to 5 minutes).
// @author       Shalom Karr / YH Studios
// @match        *://filter.techloq.com/block-page*
// @match        *://www.youtube.com/watch*
// @run-at       document-start 
// @grant        none
// @updateURL    https://raw.githubusercontent.com/Shalom-Karr/youtube-redirector/main/youtube-redirector.user.js
// @downloadURL  https://raw.githubusercontent.com/Shalom-Karr/youtube-redirector/main/youtube-redirector.user.js
// ==/UserScript==

(function() {
    'use strict';

    // --- CONFIGURATION ---
    const DASHBOARD_URL = 'https://skyoutube.pages.dev/video?source=';
    
    // Techloq Polling Settings: 5 minutes total polling time
    // We check very aggressively until the external program finishes its job.
    const MAX_TECHLOQ_RETRIES = 1200; 
    const TECHLOQ_RETRY_INTERVAL_MS = 250; // Check every quarter second
    // --- END CONFIGURATION ---

    // Stop the script if it's running inside an iframe.
    if (window.top !== window.self) {
        return;
    }

    let techloqAttemptCount = 0;

    /**
     * Extracts the YouTube video ID from a URL string.
     */
    function getVideoId(url) {
        // This regex is robust against various URL forms (watch?v, youtu.be/, embed/, shorts/)
        const pattern = /(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?|shorts)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
        const match = url.match(pattern);
        return match ? match[1] : null;
    }

    /**
     * Redirects the browser to the dashboard with the given video ID.
     */
    function redirectToDashboard(videoId) {
        if (videoId) {
            const redirectUrl = DASHBOARD_URL + encodeURIComponent(videoId);
            window.location.replace(redirectUrl);
        }
    }
    
    // --- TECHLOQ SPECIFIC LOGIC ---
    
    /**
     * Tries to find the video ID using both URL parameters and DOM elements.
     * @returns {string|null} The video ID if found.
     */
    function findVideoId() {
        let videoId = null;

        // METHOD A: Check URL Parameters (Instant check, most reliable if available)
        try {
            // The HAR log confirms the URL: /block-page?redirectUrl=https:%2F%2Fwww.youtube.com%2Fwatch%3Fv%3D9tPKsnxzrBs
            const params = new URLSearchParams(window.location.search);
            const encodedRedirectUrl = params.get('redirectUrl');

            if (encodedRedirectUrl) {
                // Decode to get the clean YouTube URL string
                const decodedUrl = decodeURIComponent(encodedRedirectUrl);
                videoId = getVideoId(decodedUrl);
                if (videoId) return videoId;
            }
        } catch (e) {
            // Failsafe
        }
        
        // METHOD B: Check DOM Elements (If the external program writes the link to the DOM)
        const blockDiv = document.querySelector('div.block-url');
        if (blockDiv) {
            const linkElement = blockDiv.querySelector('a');
            if (linkElement && linkElement.href) {
                videoId = getVideoId(linkElement.href);
            }
        }
        
        return videoId;
    }

    /**
     * Persistent polling function executed every 250ms.
     */
    function attemptTechloqRedirect() {
        const videoId = findVideoId();

        if (videoId) {
            // Success! Redirect instantly.
            redirectToDashboard(videoId);
            return; 
        }

        // --- RETRY LOGIC ---
        techloqAttemptCount++;
        
        if (techloqAttemptCount < MAX_TECHLOQ_RETRIES) {
            // Schedule the next check in 250ms
            setTimeout(attemptTechloqRedirect, TECHLOQ_RETRY_INTERVAL_MS);
        }
        // If max retries hit, the script gracefully stops.
    }


    // --- SCRIPT EXECUTION LOGIC ---

    const currentUrl = window.location.href;
    const currentHostname = window.location.hostname;

    // SCENARIO 1: YouTube Watch Page (Instant redirect)
    if (currentHostname === 'www.youtube.com' && currentUrl.includes('/watch')) {
        const videoId = getVideoId(currentUrl);
        redirectToDashboard(videoId);
        return; 
    }

    // SCENARIO 2: Techloq Filter Page (Maximal Persistent Polling)
    if (currentHostname.includes('filter.techloq.com')) {
        // Start checking immediately and persistently for 5 minutes.
        // This is the most resilient way to wait for the external filter to finish writing the URL data.
        attemptTechloqRedirect();
        return;
    }

})();

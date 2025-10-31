// ==UserScript==
// @name         YouTube to SK Dashboard Redirector
// @namespace    http://tampermonkey.net/
// @version      3.7 // Maximized Persistence + Broader Match
// @description  Instantly redirects from YouTube video pages. On ALL Techloq pages, it performs immediate and extremely persistent polling (checking the DOM/URL every 250ms for 5 minutes) until the redirect link is found.
// @author       Shalom Karr / YH Studios
// @match        *://filter.techloq.com/*  
// @match        *://www.youtube.com/watch*
// @run-at       document-start 
// @grant        none
// @updateURL    https://raw.githubusercontent.com/Shalom-Karr/youtube-redirector/main/youtube-redirector.user.js
// @downloadURL  https://raw.githubusercontent.com/Shalom-Karr/youtube-redirector/main/youtube-redirector.user.js
// ==/UserScript==

(function() {
    'use strict';

    // --- CONFIGURATION ---
    const DASHBOARD_URL = 'https://skyoutubebeta.netlify.app/video?source=';
    
    // Polling Settings: 5 minutes total polling time
    const MAX_TECHLOQ_RETRIES = 1200; 
    const TECHLOQ_RETRY_INTERVAL_MS = 250; 
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
     */
    function findVideoId() {
        let videoId = null;

        // METHOD A: Check URL Parameters 
        try {
            const params = new URLSearchParams(window.location.search);
            const encodedRedirectUrl = params.get('redirectUrl');

            if (encodedRedirectUrl) {
                const decodedUrl = decodeURIComponent(encodedRedirectUrl);
                videoId = getVideoId(decodedUrl);
                if (videoId) return videoId;
            }
        } catch (e) {}
        
        // METHOD B: Check DOM Elements 
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
            redirectToDashboard(videoId);
            return; 
        }

        // --- RETRY LOGIC ---
        techloqAttemptCount++;
        
        if (techloqAttemptCount < MAX_TECHLOQ_RETRIES) {
            setTimeout(attemptTechloqRedirect, TECHLOQ_RETRY_INTERVAL_MS);
        }
    }


    // --- SCRIPT EXECUTION LOGIC ---

    const currentUrl = window.location.href;
    const currentHostname = window.location.hostname;

    // SCENARIO 1: YouTube Watch Page (Instant redirect)
    if (currentHostname === 'www.youtube.com' && currentUrl.includes('/watch')) {
        const videoId = getVideoId(currentUrl);
        if (videoId) {
            redirectToDashboard(videoId);
        }
        return; 
    }

    // SCENARIO 2: Techloq Filter Page (Maximal Persistent Polling)
    if (currentHostname.includes('filter.techloq.com')) {
        attemptTechloqRedirect();
        return;
    }

})();

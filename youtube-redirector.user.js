// ==UserScript==
// @name         YouTube to SK Dashboard Redirector
// @namespace    http://tampermonkey.net/
// @version      3.3 // New version using MutationObserver for max reliability
// @description  Instantly redirects from YouTube video pages. On Techloq block pages, it waits passively until the redirection link is injected, then redirects instantly.
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
     */
    function redirectToDashboard(videoId) {
        if (videoId) {
            const redirectUrl = DASHBOARD_URL + encodeURIComponent(videoId);
            window.location.replace(redirectUrl);
        }
    }
    
    // --- TECHLOQ SPECIFIC LOGIC ---

    /**
     * Attempts to find the video ID using both URL parameters and DOM elements.
     * @returns {string|null} The video ID if found.
     */
    function findVideoId() {
        let videoId = null;

        // METHOD A: Check URL Parameters (redirectUrl)
        try {
            const params = new URLSearchParams(window.location.search);
            const encodedRedirectUrl = params.get('redirectUrl');

            if (encodedRedirectUrl) {
                const decodedUrl = decodeURIComponent(encodedRedirectUrl);
                videoId = getVideoId(decodedUrl);
            }
        } catch (e) {
            // Failsafe if location access is blocked or delayed
        }
        
        // METHOD B: Check DOM Elements (Fallback, as suggested by friend's script)
        if (!videoId) {
            const blockDiv = document.querySelector('div.block-url');
            if (blockDiv) {
                const linkElement = blockDiv.querySelector('a');
                if (linkElement && linkElement.href) {
                    videoId = getVideoId(linkElement.href);
                }
            }
        }
        
        return videoId;
    }

    /**
     * Observer callback function.
     * @param {MutationRecord[]} mutationsList 
     * @param {MutationObserver} observer 
     */
    function observerCallback(mutationsList, observer) {
        const videoId = findVideoId();

        if (videoId) {
            // Success! Stop observing and redirect.
            observer.disconnect();
            redirectToDashboard(videoId);
        }
    }


    // --- SCRIPT EXECUTION LOGIC ---

    const currentUrl = window.location.href;
    const currentHostname = window.location.hostname;

    // SCENARIO 1: YouTube Watch Page (Instant redirect at document-start)
    if (currentHostname === 'www.youtube.com' && currentUrl.includes('/watch')) {
        const videoId = getVideoId(currentUrl);
        redirectToDashboard(videoId);
        return; 
    }

    // SCENARIO 2: Techloq Filter Page (Passive wait for content)
    if (currentHostname.includes('filter.techloq.com')) {
        
        // First, check immediately, as the link might sometimes be ready.
        const immediateId = findVideoId();
        if (immediateId) {
            redirectToDashboard(immediateId);
            return;
        }

        // If not ready, start the MutationObserver to wait for dynamic content/URL injection.
        const observer = new MutationObserver(observerCallback);

        // Configuration: Watch for changes to the entire DOM tree (subtrees) and attributes 
        // (in case the URL is updated on the body's attributes, though we focus on children).
        const config = { childList: true, subtree: true };

        // Start observing the body for changes.
        observer.observe(document.body, config);

        // Note: The observer is designed to run indefinitely until the redirect succeeds, 
        // ensuring maximum chance of catching the late-loaded URL.
        return;
    }

})();

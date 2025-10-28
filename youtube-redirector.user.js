// ==UserScript==
// @name         YouTube Redirector
// @namespace    http://tampermonkey.net/
// @version      0.3
// @description  Redirect from Techloq filter page to SK Video Dashboard with the YouTube video ready to play.
// @author       Shalom Karr
// @match        *://filter.techloq.com/block-page*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=youtube.com
// @downloadURL  https://raw.githubusercontent.com/Shalom-Karr/youtube-redirector/main/youtube-redirector.user.js
// @updateURL    https://raw.githubusercontent.com/Shalom-Karr/youtube-redirector/main/youtube-redirector.user.js
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // We don't want the script to run if it's inside an iframe
    if (window.top !== window.self) {
        return;
    }

    // A small delay to ensure the DOM is fully loaded on the block page
    setTimeout(() => {
        // The block page URL for YouTube videos typically contains "youtube"
        if (!window.location.href.toLowerCase().includes("youtube")) {
            return;
        }

        const blockDiv = document.querySelector('div.block-url');
        if (!blockDiv) {
            console.log("Redirector Script: No '.block-url' div found.");
            return;
        }

        const link = blockDiv.querySelector('a');
        if (!link || !link.href) {
            console.log("Redirector Script: No link found inside '.block-url' div.");
            return;
        }

        // Regex to extract the YouTube video ID from various URL formats
        function getYouTubeID(url) {
            const pattern = /(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
            const match = url.match(pattern);
            return match ? match[1] : null;
        }

        const videoID = getYouTubeID(link.href);

        if (videoID) {
            // Redirect to your application with the video ID as a URL parameter
            const destination = `https://skyoutube.pages.dev/video?source=${encodeURIComponent(videoID)}`;
            console.log(`Redirector Script: YouTube video ID ${videoID} found. Redirecting to: ${destination}`);
            window.location.href = destination;
        } else {
            console.log("Redirector Script: No valid YouTube video ID found in the link.");
        }
    }, 500); // 500ms delay is usually sufficient
})();

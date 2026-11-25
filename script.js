
"use strict";

/*
 * MOVIE EXPLORER
 * Project 2a - AJAX and REST API
 *
 * Movie data is requested from a Netlify serverless function.
 * The OMDb API key is stored securely in Netlify environment variables,
 * not in this browser-side JavaScript file.
 */

document.addEventListener("DOMContentLoaded", () => {
    // --------------------------------------------------
    // 1. Get the existing HTML elements
    // --------------------------------------------------

    const searchForm = document.getElementById("searchForm");
    const searchInput = document.getElementById("searchInput");
    const typeFilter = document.getElementById("typeFilter");
    const movieResults = document.getElementById("movieResults");
    const pagination = document.getElementById("pagination");
    const searchMessage = document.getElementById("searchMessage");

    // Stop safely if the required HTML elements are missing.
    const requiredElements = [
        searchForm,
        searchInput,
        typeFilter,
        movieResults,
        pagination,
        searchMessage
    ];

    if (requiredElements.some((element) => !element)) {
        console.error(
            "Movie Explorer could not start: one or more required HTML elements are missing."
        );
        return;
    }

    // --------------------------------------------------
    // 2. Application settings and state
    // --------------------------------------------------

    const API_ENDPOINT = "/.netlify/functions/movies";
    const RESULTS_PER_PAGE = 10;

    let currentSearch = "";
    let currentPage = 1;
    let totalPages = 0;
    let currentMovies = [];
    let activeRequestController = null;

    // --------------------------------------------------
    // 3. Add styles for elements created by JavaScript
    // --------------------------------------------------

    const dynamicStyles = document.createElement("style");

    dynamicStyles.textContent = `
        .movie-card {
            cursor: pointer;
            transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .movie-card:hover {
            transform: translateY(-5px);
        }

        .movie-card:focus-visible,
        .pagination button:focus-visible,
        .modal-close:focus-visible {
            outline: 3px solid #e50914;
            outline-offset: 3px;
        }

        .movie-poster {
            width: 100%;
            aspect-ratio: 2 / 3;
            object-fit: cover;
            display: block;
            background: #292929;
        }

        .poster-placeholder {
            width: 100%;
            aspect-ratio: 2 / 3;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 15px;
            box-sizing: border-box;
            background: #292929;
            color: #bbb;
            text-align: center;
        }

        .movie-card:focus-visible {
            outline: 3px solid #e50914;
            outline-offset: 3px;
        }

        .pagination button {
            margin: 5px;
            padding: 9px 14px;
            border: 0;
            border-radius: 5px;
            background: #333;
            color: white;
            cursor: pointer;
        }

        .pagination button.active {
            background: #e50914;
        }

        .pagination button:disabled {
            opacity: 0.45;
            cursor: not-allowed;
        }

        .movie-modal {
            position: fixed;
            inset: 0;
            z-index: 1000;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            background: rgba(0, 0, 0, 0.85);
            overflow-y: auto;
        }

        .movie-modal[hidden] {
            display: none;
        }

        .modal-content {
            position: relative;
            width: min(750px, 100%);
            max-height: 90vh;
            overflow-y: auto;
            padding: 25px;
            border-radius: 10px;
            background: #1f1f1f;
            color: white;
            box-sizing: border-box;
        }

        .modal-close {
            position: absolute;
            top: 12px;
            right: 15px;
            border: 0;
            background: transparent;
            color: white;
            font-size: 30px;
            cursor: pointer;
        }

        .modal-layout {
            display: grid;
            grid-template-columns: minmax(120px, 220px) 1fr;
            gap: 25px;
            margin-top: 25px;
        }

        .modal-poster {
            width: 100%;
            border-radius: 6px;
        }

        .modal-details p {
            line-height: 1.6;
            color: #ddd;
        }

        .loading-message,
        .empty-message,
        .error-message {
            grid-column: 1 / -1;
            padding: 25px 10px;
            text-align: center;
        }

        .error-message {
            color: #ff7777;
        }

        @media (max-width: 600px) {
            .modal-layout {
                grid-template-columns: 1fr;
            }

            .modal-poster {
                max-width: 180px;
            }
        }
    `;

    document.head.appendChild(dynamicStyles);

    // --------------------------------------------------
    // 4. Create the movie details modal
    // --------------------------------------------------

    const modal = document.createElement("div");
    modal.className = "movie-modal";
    modal.hidden = true;
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-label", "Movie details");

    const modalContent = document.createElement("div");
    modalContent.className = "modal-content";

    const closeButton = document.createElement("button");
    closeButton.className = "modal-close";
    closeButton.type = "button";
    closeButton.textContent = "×";
    closeButton.setAttribute("aria-label", "Close movie details");

    const modalBody = document.createElement("div");
    modalBody.className = "modal-body";

    modalContent.append(closeButton, modalBody);
    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // --------------------------------------------------
    // 5. Helper functions
    // --------------------------------------------------

    // Display a message to the user.
    function showMessage(message, className = "") {
        searchMessage.textContent = message;
        searchMessage.className = `message ${className}`.trim();
    }

    // Display a loading message.
    function showLoading() {
        movieResults.replaceChildren();

        const loading = document.createElement("p");
        loading.className = "loading-message";
        loading.textContent = "Loading movies...";

        movieResults.appendChild(loading);
        pagination.replaceChildren();
    }

    // Display a message inside the movie results area.
    function showResultsMessage(message, className = "empty-message") {
        movieResults.replaceChildren();

        const paragraph = document.createElement("p");
        paragraph.className = className;
        paragraph.textContent = message;

        movieResults.appendChild(paragraph);
    }

    // Create an image safely, with a fallback if the poster is unavailable.
    function createPoster(posterUrl, movieTitle) {
        const container = document.createElement("div");

        if (
            posterUrl &&
            posterUrl !== "N/A" &&
            posterUrl.startsWith("https://")
        ) {
            const image = document.createElement("img");
            image.className = "movie-poster";
            image.src = posterUrl;
            image.alt = `${movieTitle} poster`;
            image.loading = "lazy";

            image.addEventListener("error", () => {
                const placeholder = document.createElement("div");
                placeholder.className = "poster-placeholder";
                placeholder.textContent = "Poster unavailable";
                image.replaceWith(placeholder);
            });

            container.appendChild(image);
        } else {
            const placeholder = document.createElement("div");
            placeholder.className = "poster-placeholder";
            placeholder.textContent = "Poster unavailable";
            container.appendChild(placeholder);
        }

        return container;
    }

    // Request JSON from the Netlify function.
    async function requestAPI(parameters, signal) {
        const url = new URL(API_ENDPOINT, window.location.origin);

        Object.entries(parameters).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== "") {
                url.searchParams.set(key, String(value));
            }
        });

        const response = await fetch(url, {
            method: "GET",
            headers: {
                Accept: "application/json"
            },
            signal
        });

        let data;

        try {
            data = await response.json();
        } catch {
            throw new Error("The server returned an invalid response.");
        }

        if (!response.ok) {
            throw new Error(
                data.Error || data.message || "The request could not be completed."
            );
        }

        return data;
    }

    // --------------------------------------------------
    // 6. Search for movies
    // --------------------------------------------------

    async function searchMovies(page = 1) {
        const searchTerm = currentSearch.trim();

        if (!searchTerm) {
            showMessage("Please enter a movie title.");
            return;
        }

        // Cancel an older search if the user starts a new one.
        if (activeRequestController) {
            activeRequestController.abort();
        }

        activeRequestController = new AbortController();
        const requestController = activeRequestController;

        currentPage = page;
        showLoading();
        showMessage(`Searching for "${searchTerm}"...`);

        try {
            const data = await requestAPI(
                {
                    action: "search",
                    s: searchTerm,
                    page: currentPage,
                    type: typeFilter.value
                },
                requestController.signal
            );

            // Ignore results from an outdated request.
            if (requestController !== activeRequestController) {
                return;
            }

            if (data.Response !== "True" || !Array.isArray(data.Search)) {
                currentMovies = [];
                totalPages = 0;
                showResultsMessage(data.Error || "No movies found.");
                showMessage("Try another movie title.");
                return;
            }

            currentMovies = data.Search;

            const totalResults = Number(data.totalResults) || 0;
            totalPages = Math.ceil(totalResults / RESULTS_PER_PAGE);

            renderMovies(currentMovies);
            renderPagination();

            showMessage(
                `${totalResults} result(s) found for "${searchTerm}".`
            );
        } catch (error) {
            if (error.name === "AbortError") {
                return;
            }

            console.error("Movie search error:", error);
            currentMovies = [];
            totalPages = 0;

            showResultsMessage(
                error.message || "Something went wrong. Please try again.",
                "error-message"
            );

            showMessage("Unable to load movies.");
        }
    }

    // --------------------------------------------------
    // 7. Display movie cards
    // --------------------------------------------------

    function renderMovies(movies) {
        movieResults.replaceChildren();

        movies.forEach((movie) => {
            const card = document.createElement("article");
            card.className = "movie-card";
            card.tabIndex = 0;
            card.setAttribute("role", "button");
            card.setAttribute(
                "aria-label",
                `View details for ${movie.Title}`
            );

            const poster = createPoster(movie.Poster, movie.Title);

            const information = document.createElement("div");
            information.className = "movie-info";

            const title = document.createElement("h3");
            title.textContent = movie.Title || "Untitled";

            const year = document.createElement("p");
            year.className = "movie-year";
            year.textContent = movie.Year || "Year unknown";

            const type = document.createElement("p");
            type.textContent = movie.Type
                ? movie.Type.charAt(0).toUpperCase() + movie.Type.slice(1)
                : "Unknown type";

            information.append(title, year, type);
            card.append(poster, information);

            // Add event listeners dynamically.
            card.addEventListener("click", () => {
                if (movie.imdbID) {
                    showMovieDetails(movie.imdbID);
                }
            });

            card.addEventListener("keydown", (event) => {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();

                    if (movie.imdbID) {
                        showMovieDetails(movie.imdbID);
                    }
                }
            });

            movieResults.appendChild(card);
        });
    }

    // --------------------------------------------------
    // 8. Display pagination
    // --------------------------------------------------

    function renderPagination() {
        pagination.replaceChildren();

        if (totalPages <= 1) {
            return;
        }

        const previousButton = document.createElement("button");
        previousButton.type = "button";
        previousButton.textContent = "Previous";
        previousButton.disabled = currentPage <= 1;

        previousButton.addEventListener("click", () => {
            if (currentPage > 1) {
                searchMovies(currentPage - 1);
            }
        });

        pagination.appendChild(previousButton);

        // Show a maximum of five page number buttons.
        const firstPage = Math.max(1, currentPage - 2);
        const lastPage = Math.min(totalPages, firstPage + 4);
        const adjustedFirstPage = Math.max(1, lastPage - 4);

        for (
            let page = adjustedFirstPage;
            page <= lastPage;
            page += 1
        ) {
            const pageButton = document.createElement("button");
            pageButton.type = "button";
            pageButton.textContent = String(page);

            if (page === currentPage) {
                pageButton.classList.add("active");
                pageButton.setAttribute("aria-current", "page");
            }

            pageButton.addEventListener("click", () => {
                searchMovies(page);
            });

            pagination.appendChild(pageButton);
        }

        const nextButton = document.createElement("button");
        nextButton.type = "button";
        nextButton.textContent = "Next";
        nextButton.disabled = currentPage >= totalPages;

        nextButton.addEventListener("click", () => {
            if (currentPage < totalPages) {
                searchMovies(currentPage + 1);
            }
        });

        pagination.appendChild(nextButton);
    }

    // --------------------------------------------------
    // 9. Get and display full movie details
    // --------------------------------------------------

    async function showMovieDetails(imdbID) {
        modal.hidden = false;
        modalBody.replaceChildren();

        const loading = document.createElement("p");
        loading.textContent = "Loading movie details...";
        modalBody.appendChild(loading);

        closeButton.focus();

        try {
            const data = await requestAPI({
                action: "details",
                i: imdbID
            });

            if (modal.hidden) {
                return;
            }

            if (data.Response !== "True") {
                throw new Error(data.Error || "Movie details are unavailable.");
            }

            renderMovieDetails(data);
        } catch (error) {
            if (modal.hidden) {
                return;
            }

            console.error("Movie details error:", error);

            const errorMessage = document.createElement("p");
            errorMessage.className = "error-message";
            errorMessage.textContent =
                error.message || "Unable to load movie details.";

            modalBody.replaceChildren(errorMessage);
        }
    }

    // Build the details content using textContent to avoid unsafe HTML.
    function renderMovieDetails(movie) {
        const layout = document.createElement("div");
        layout.className = "modal-layout";

        const posterContainer = createPoster(movie.Poster, movie.Title);
        const posterImage = posterContainer.firstElementChild;

        if (posterImage && posterImage.tagName === "IMG") {
            posterImage.className = "modal-poster";
        }

        const details = document.createElement("div");
        details.className = "modal-details";

        const title = document.createElement("h2");
        title.textContent = movie.Title || "Movie details";

        const fields = [
            ["Year", movie.Year],
            ["Rated", movie.Rated],
            ["Released", movie.Released],
            ["Runtime", movie.Runtime],
            ["Genre", movie.Genre],
            ["Director", movie.Director],
            ["Actors", movie.Actors],
            ["Language", movie.Language],
            ["IMDb rating", movie.imdbRating],
            ["Plot", movie.Plot]
        ];

        details.appendChild(title);

        fields.forEach(([label, value]) => {
            if (value && value !== "N/A") {
                const paragraph = document.createElement("p");
                const strong = document.createElement("strong");

                strong.textContent = `${label}: `;
                paragraph.append(strong, document.createTextNode(value));

                details.appendChild(paragraph);
            }
        });

        layout.append(posterContainer, details);
        modalBody.replaceChildren(layout);
    }

    // --------------------------------------------------
    // 10. Close the details modal
    // --------------------------------------------------

    function closeModal() {
        modal.hidden = true;
        modalBody.replaceChildren();
    }

    closeButton.addEventListener("click", closeModal);

    modal.addEventListener("click", (event) => {
        if (event.target === modal) {
            closeModal();
        }
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && !modal.hidden) {
            closeModal();
        }
    });

    // --------------------------------------------------
    // 11. Register search and filter events
    // --------------------------------------------------

    searchForm.addEventListener("submit", (event) => {
        event.preventDefault();

        const searchTerm = searchInput.value.trim();

        if (!searchTerm) {
            showMessage("Please enter a movie title.");
            searchInput.focus();
            return;
        }

        currentSearch = searchTerm;
        searchMovies(1);
    });

    typeFilter.addEventListener("change", () => {
        if (currentSearch) {
            searchMovies(1);
        }
    });

    // --------------------------------------------------
    // 12. Initial application message
    // --------------------------------------------------

    showMessage("Search for a movie to explore the collection.");
    showResultsMessage(
        "Enter a movie title above and select Search Movies to begin."
    );
});


/*
 * MOVIE EXPLORER - NETLIFY SERVERLESS FUNCTION
 * Project 2a - AJAX and REST API
 *
 * Connects the frontend to the OMDb REST API.
 * The API key is stored securely in Netlify environment variables.
 *
 * Supported actions:
 * 1. Search movies: ?action=search&s=batman&page=1
 * 2. Movie details: ?action=details&i=tt0372784
 */

const OMDB_API_URL = "https://www.omdbapi.com/";

const ALLOWED_TYPES = ["movie", "series", "episode"];

// Send a JSON response to the browser.
function jsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Cache-Control": "no-store"
        }
    });
}

// Validate a movie search term.
function isValidSearchTerm(value) {
    return (
        typeof value === "string" &&
        value.trim().length > 0 &&
        value.trim().length <= 100
    );
}

// Main Netlify serverless function.
export default async function handler(request) {

    // Accept GET requests only.
    if (request.method !== "GET") {
        return jsonResponse(
            { Error: "Method not allowed." },
            405
        );
    }

    // Read the private API key from Netlify.
    const apiKey = process.env.OMDB_API_KEY;

    if (!apiKey) {
        console.error("OMDB_API_KEY environment variable is missing.");

        return jsonResponse(
            {
                Error: "The movie service is not configured. Please try again later."
            },
            500
        );
    }

    // Read parameters from the frontend request.
    const requestUrl = new URL(request.url);
    const action = requestUrl.searchParams.get("action");

    const apiParameters = new URLSearchParams();

    apiParameters.set("apikey", apiKey);
    apiParameters.set("r", "json");

    // Handle movie search requests.
    if (action === "search") {

        const searchTerm = requestUrl.searchParams.get("s");
        const pageValue = requestUrl.searchParams.get("page") || "1";
        const movieType = requestUrl.searchParams.get("type") || "";

        if (!isValidSearchTerm(searchTerm)) {
            return jsonResponse(
                { Error: "Please enter a valid movie title." },
                400
            );
        }

        const page = Number(pageValue);

        if (
            !Number.isInteger(page) ||
            page < 1 ||
            page > 100
        ) {
            return jsonResponse(
                { Error: "Page number must be between 1 and 100." },
                400
            );
        }

        if (
            movieType &&
            !ALLOWED_TYPES.includes(movieType)
        ) {
            return jsonResponse(
                { Error: "Invalid movie type." },
                400
            );
        }

        apiParameters.set("s", searchTerm.trim());
        apiParameters.set("page", String(page));

        if (movieType) {
            apiParameters.set("type", movieType);
        }
    }

    // Handle full movie details requests.
    else if (action === "details") {

        const imdbID = requestUrl.searchParams.get("i");

        if (
            !imdbID ||
            !/^tt\d{5,10}$/i.test(imdbID)
        ) {
            return jsonResponse(
                { Error: "A valid IMDb movie ID is required." },
                400
            );
        }

        apiParameters.set("i", imdbID);
        apiParameters.set("plot", "full");
    }

    // Reject unknown actions.
    else {
        return jsonResponse(
            { Error: "Invalid action. Use search or details." },
            400
        );
    }

    // Connect to the OMDb REST API.
    try {

        const apiUrl =
            `${OMDB_API_URL}?${apiParameters.toString()}`;

        const apiResponse = await fetch(apiUrl, {
            method: "GET",
            headers: {
                Accept: "application/json"
            },
            signal: AbortSignal.timeout(15000)
        });

        if (!apiResponse.ok) {
            console.error(
                "OMDb returned HTTP status:",
                apiResponse.status
            );

            return jsonResponse(
                {
                    Error: "The movie database is temporarily unavailable."
                },
                502
            );
        }

        const movieData = await apiResponse.json();

        // Return OMDb data without exposing the API key.
        return jsonResponse(movieData);

    } catch (error) {

        console.error("OMDb request failed:", error);

        return jsonResponse(
            {
                Error: "Could not connect to the movie database. Please try again."
            },
            502
        );
    }
}

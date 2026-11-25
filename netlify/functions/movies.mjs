
/*
 * MOVIE EXPLORER - NETLIFY SERVERLESS FUNCTION
 * Project 2a - AJAX and REST API
 *
 * Connects the frontend to the OMDb REST API.
 * The API key is stored in Netlify environment variables.
 */

const OMDB_API_URL = "https://www.omdbapi.com/";
const ALLOWED_TYPES = ["movie", "series", "episode"];

function jsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Cache-Control": "no-store"
        }
    });
}

function isValidSearchTerm(value) {
    return (
        typeof value === "string" &&
        value.trim().length > 0 &&
        value.trim().length <= 100
    );
}

export default async function handler(request) {
    if (request.method !== "GET") {
        return jsonResponse({ Error: "Method not allowed." }, 405);
    }

    const apiKey = process.env.OMDB_API_KEY;

    if (!apiKey) {
        console.error("OMDB_API_KEY is missing.");

        return jsonResponse({
            Error: "OMDB_API_KEY is not configured in Netlify."
        }, 500);
    }

    const requestUrl = new URL(request.url);
    const action = requestUrl.searchParams.get("action");

    const apiParameters = new URLSearchParams();
    apiParameters.set("apikey", apiKey);
    apiParameters.set("r", "json");

    if (action === "search") {
        const searchTerm = requestUrl.searchParams.get("s");
        const pageValue = requestUrl.searchParams.get("page") || "1";
        const movieType = requestUrl.searchParams.get("type") || "";

        if (!isValidSearchTerm(searchTerm)) {
            return jsonResponse({
                Error: "Please enter a valid movie title."
            }, 400);
        }

        const page = Number(pageValue);

        if (!Number.isInteger(page) || page < 1 || page > 100) {
            return jsonResponse({
                Error: "Page number must be between 1 and 100."
            }, 400);
        }

        if (movieType && !ALLOWED_TYPES.includes(movieType)) {
            return jsonResponse({
                Error: "Invalid movie type."
            }, 400);
        }

        apiParameters.set("s", searchTerm.trim());
        apiParameters.set("page", String(page));

        if (movieType) {
            apiParameters.set("type", movieType);
        }

    } else if (action === "details") {
        const imdbID = requestUrl.searchParams.get("i");

        if (!imdbID || !/^tt\d{5,10}$/i.test(imdbID)) {
            return jsonResponse({
                Error: "A valid IMDb movie ID is required."
            }, 400);
        }

        apiParameters.set("i", imdbID);
        apiParameters.set("plot", "full");

    } else {
        return jsonResponse({
            Error: "Invalid action. Use search or details."
        }, 400);
    }

    try {
        const apiUrl = `${OMDB_API_URL}?${apiParameters.toString()}`;

        const apiResponse = await fetch(apiUrl, {
            method: "GET",
            headers: {
                Accept: "application/json"
            },
            signal: AbortSignal.timeout(15000)
        });

        const responseText = await apiResponse.text();

        if (!apiResponse.ok) {
            console.error(
                "OMDb HTTP error:",
                apiResponse.status,
                responseText.slice(0, 500)
            );

            return jsonResponse({
                Error: "OMDb returned an HTTP error.",
                upstreamStatus: apiResponse.status,
                upstreamMessage: responseText.slice(0, 500)
            }, 502);
        }

        let movieData;

        try {
            movieData = JSON.parse(responseText);
        } catch {
            console.error("OMDb returned invalid JSON.");

            return jsonResponse({
                Error: "OMDb returned an invalid response."
            }, 502);
        }

        return jsonResponse(movieData);

    } catch (error) {
        console.error("OMDb connection error:", error);

        return jsonResponse({
            Error: "Could not connect to OMDb.",
            reason: error.name || "Unknown connection error"
        }, 502);
    }
}

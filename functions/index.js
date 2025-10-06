/* eslint-disable no-undef */

const axios = require("axios");
const {setGlobalOptions} = require("firebase-functions");
const {onRequest} = require("firebase-functions/https");
const logger = require("firebase-functions/logger");


setGlobalOptions({maxInstances: 10});

const checkAuth = (request, response) => {
    const authToken = process.env.AUTH_TOKEN;
    let token;
    token = request.body?.data?.token || request.query?.token;

    if (!token || token !== authToken) {
        logger.warn("Unauthorized request: Missing or invalid token");
        response.status(401).send({error: "Unauthorized: Token not provided or invalid"});
        return false;
    }
    return true;
}

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!GOOGLE_PLACES_API_KEY) {
    logger.error("Missing GOOGLE_PLACES_API_KEY!");
}
if (!OPENAI_API_KEY) {
    logger.error("Missing OPENAI_API_KEY!");
}


const auth = (handler) => {
    return (request, response) => {
        if (checkAuth(request, response)) {
            return handler(request, response);
        }
    }
}

const getEphemeralKey = async (request, response) => {


    if (!OPENAI_API_KEY) {
        response.status(500).send({error: "OpenAI API key not configured"});
        return;
    }

    try {
        const openaiResponse = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENAI_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                session: {
                    type: "realtime",
                    model: "gpt-realtime",
                }
            })
        });

        const data = await openaiResponse.json();
        response.status(openaiResponse.status).send({data});
    } catch (error) {
        logger.error("Error fetching ephemeral key", error);
        response.status(500).send({error: "Failed to fetch ephemeral key"});
    }
}

const getNearbyPlaces = async (request, response) => {

    const params = request.body?.data?.params || {};

    try {
        const url = new URL("https://maps.googleapis.com/maps/api/place/nearbysearch/json");
        url.searchParams.append("key", GOOGLE_PLACES_API_KEY);
        // append all params
        for (const [key, value] of Object.entries(params)) {
            url.searchParams.append(key, value);
        }
        const gmResponse = await fetch(url.toString());
        const data = await gmResponse.json();
        response.status(gmResponse.status).send({data});
    } catch (error) {
        logger.error("Error fetching nearby places", error);
        response.status(500).send({error: "Failed to fetch nearby places"});
    }
};

/*
Proxy the photo request to avoid exposing the API key on the client side.
 */
const getPlacePhoto = async (req, res) => {
    // res.set("Access-Control-Allow-Origin", "*");

    // Get the photo_reference and maxwidth from the query parameters
    const {photo_reference, maxwidth = 800} = req.query;

    if (!photo_reference || !maxwidth) {
        return res.status(400).send("Missing 'photo_reference'");
    }

    const googleApiUrl = `https://maps.googleapis.com/maps/api/place/photo?photo_reference=${photo_reference}&maxwidth=${maxwidth}&key=${GOOGLE_PLACES_API_KEY}`;

    try {
        // Make a request to the Google Maps API and ask for the response as a stream
        const imageResponse = await axios.get(googleApiUrl, {
            responseType: "stream",
        });

        imageResponse.data.pipe(res);

    } catch (error) {
        console.error("Error fetching photo from Google Maps API:", error.message);
        // Check if the error response from Google has more details
        if (error.response) {
            return res.status(error.response.status).send(error.response.statusText);
        }
        return res.status(500).send("Internal Server Error");
    }

}
exports.getEphemeralKey = onRequest(auth(getEphemeralKey));
exports.getNearbyPlaces = onRequest(auth(getNearbyPlaces));
exports.getPlacePhoto = onRequest(auth(getPlacePhoto));

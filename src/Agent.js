import {RealtimeAgent, RealtimeSession} from "@openai/agents/realtime";
import {tool} from "@openai/agents";
import {z} from 'zod';
import {events, getNearbyPlaces} from './misc';


const getWeather = tool({
    name: 'get_weather',
    description: 'Returns the current weather in a given city.',
    parameters: z.object({city: z.string()}),
    async execute({city}) {
        return `The weather in ${city} is sunny.`;
    },
});


const updateUITool = tool({
    name: 'update_ui',
    description: 'Shows a message in the user interface. The message is in markdown format. Keep messages nicely formatted and very short - we are showing them on a small screen.',
    parameters: z.object({markdown: z.string()}),

    async execute({markdown}) {
        events.emit('message', markdown);
        return `success`;
    },
});

const searchNearbyPlaces = tool({
    name: 'search_nearby_places',
    description: 'Search for nearby places based on location, with optional filtering by keywords, distance, rating, and operating hours.',
    parameters: z.object({
        params: z.object({
            location: z.string().describe("The point around which to retrieve place information. This must be specified as latitude,longitude."),
            keyword: z.string().describe("This must be a place name, address, or category of establishments like restaurant, cafe, hotel, museum, etc"),
            radius: z.number().default(1000).describe("Search radius in meters"),
            openNow: z.boolean().default(false).describe("Only show places that are currently open")
        }).describe("Search parameters")
    }),

    async execute({ params }) {
        try {
            events.emit('thinking'); // Emit event before starting search
            console.log('Searching nearby places with params:', params);
            let res = await getNearbyPlaces({params});
            console.log('Received nearby places response:', res);
            if (!res.data || !res.data.results) {
                return 'No places found.';
            }
            return res.data.results;
        } catch {
            return 'Failed to fetch nearby places.';
        }
    },
});



const createAgent = (travelPlansPrompt) => new RealtimeAgent({
    name: 'Assistant',
    instructions:
        `You are a helpful assistant for the user who is traveling. Default language is English.
User's travel plans: ${travelPlansPrompt}.
Use the search_nearby_places tool to find nearby places like restaurants, cafes, hotels, and museums.

# UI
Use the update_ui tool to let the user see info in the UI. User can only see the last message.
- IMPORTANT: show information proactively as you are telling about the subject. 
- Don't tell about something without displaying it first. Keep messages very short and structured, do not display more than 5 places at a time. Try not to display more than 2 images at a time.
- To show an image referenced by places API, use the following URL format:
  <photo>PLACE_PHOTO_REFERENCE</photo>  
`,

    tools: [searchNearbyPlaces, updateUITool],
});



export const connectVoiceAgent = async (ekey, travelPlansPrompt) => {
    const agent = createAgent(travelPlansPrompt)
    const session = new RealtimeSession(agent, {
        model: 'gpt-realtime',
    });
    // Automatically connects your microphone and audio output in the browser via WebRTC.
    await session.connect({
        apiKey: ekey, // ephemeral key from the backend
    });

    return session;

};

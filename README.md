# A hands-free Travel Assistant

A hands-free OpenAI-powered agent for travel advice and local recommendations.
The idea is that you can talk to the agent while on the go, it knows the context of your trip, and can help you find places to eat, visit, and explore nearby.

## Features

- **Conversational AI:** A hands-free chat with an OpenAI-powered agent for travel advice and local recommendations.
- **Nearby Place Search:** Find restaurants, hotels, museums, and more near your location, with filters for distance, open hours, and keywords.
- **Photo Integration:** View images of recommended places directly in the UI.
- **Voice Agent Integration:** Real-time interaction with the agent using OpenAI's Realtime Agents.
- **Firebase Backend:** Secure backend with Firebase Cloud Functions and hosting.
- **Secure API Access:** Protected endpoints for external API calls (e.g., Google Places).

## How It Works

- The user talks to the travel assistant via voice
- The OpenAI agent receives user prompts, can call tools to fetch weather, search for places, and update the UI.
- Place search results and photos are displayed in markdown format in the chat.
- Backend functions handle secure API requests and data fetching.

## Example Prompts
- "Where could I eat near my hotel?"
- "What museums can I visit during my stay?"
- "Find me a good coffee shop nearby."
- "What are some popular tourist attractions around here?"
- "Can you recommend a nice place for dinner tonight?"

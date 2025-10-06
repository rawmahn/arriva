import {useState, useEffect} from 'react'

import './App.css'
import {connectVoiceAgent} from "./Agent.js";
import {events, getEphemeralKey, makePlacePhotoURL, token} from './misc';
import Markdown from "react-markdown";


export default function App() {

    const [isLoading, setLoading] = useState(null);
    const [session, setSession] = useState(null);
    const initMessage = "## Connected!\n Try asking things like:\n - Where could I eat near my hotel?\n - What museums can I visit during my stay?";
    const [message, setMessage] = useState(initMessage);
    const [msgOpacity, setMsgOpacity] = useState(1);
    const [prompt, setPrompt] = useState("Travelling solo to Milan for 3 days, staying in VIU Hotel Milan");
    const [isThinking, setIsThinking] = useState(false);
    const [thinkingVisible, setThinkingVisible] = useState(false);

    // Subscribe to messages from the agent
    useEffect(() => {
        async function handleMessage(msg) {
            setIsThinking(false); // Instantly hide thinking on message
            setThinkingVisible(false);
            setMsgOpacity(0);
            await new Promise(res => setTimeout(res, 300));
            setMsgOpacity(1);

            // Replace <photo>PLACE_PHOTO_REFERENCE</photo> with proper image URLs using makePlacePhotoURL
            msg = msg.replaceAll(/<photo>(.*?)<\/photo>/g, (match, p1) => {
                let url = makePlacePhotoURL(p1);
                return `![photo](${url})`;
            });

            setMessage(msg);
        }

        function handleThinking() {
            setIsThinking(true);
            setThinkingVisible(true);
        }

        events.on('message', handleMessage);
        events.on('thinking', handleThinking);
        return () => {
            events.off('message', handleMessage);
            events.off('thinking', handleThinking);
        };
    }, [session]);

    const connect = async () => {
        try {
            setLoading(true);
            if (!session) {
                // Directly extract token from URL query parameter

                let ekRes = await getEphemeralKey();
                let ek = ekRes.data.value;
                let newSession = await connectVoiceAgent(ek, prompt);
                setSession(newSession);
                setMessage(initMessage);
            }
        } catch (e) {
            alert("Connection Error. Sorry. Got the right token?");
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const disconnect = async () => {
        if (session) {
            await session.close();
            setSession(null);
            setMessage("## Disconnected. See you later!");
        }
    }

    return (
        <>

            {session ? <h1>Talk to me</h1> : <><h1>Hi!</h1><h2>I'll help you with your trip, hands-free 🚗</h2></>}
            {session && (
                <div style={{display: 'flex', justifyContent: 'center', margin: '1em 0'}}>
                    <span className="mic-icon" title="Listening">
                        {/* Mic SVG icon */}
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10v2a7 7 0 0 0 14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="8" y1="22" x2="16" y2="22"/></svg>
                    </span>
                </div>
            )}
            {thinkingVisible && (
                <div className={`thinking-div${isThinking ? '' : ' fade-out'}`}>Thinking...</div>
            )}
            <div className="card">

                {!session && (
                    <div style={{marginBottom: '1em'}}>
                        <label htmlFor="travelPrompt" style={{display: 'block', marginBottom: '0.5em'}}>
                            Your travel plan (should be provided by the travel platform):
                        </label>
                        <textarea
                            id="travelPrompt"
                            rows={3}
                            style={{width: '100%'}}
                            value={prompt}
                            onChange={e => setPrompt(e.target.value)}
                        />
                    </div>
                )}

                {session && message && <div
                    className="message"
                    style={{opacity: msgOpacity}}>
                    <Markdown>{message}</Markdown>
                </div>
                }

                {!session &&
                    <button onClick={connect} disabled={!!isLoading}>{isLoading ? "Connecting..." : "Connect"}</button>}
                {session && <button onClick={disconnect}>Disconnect</button>}
            </div>

        </>
    )
}

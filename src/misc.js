// src/emitter.js
// Minimal EventEmitter and global singleton
import {getFunctions, httpsCallable} from "firebase/functions";
import app from "./firebaseConfig.js";

class EventEmitter {
    constructor() {
        this.events = {};
    }
    on(event, listener) {
        if (!this.events[event]) this.events[event] = [];
        this.events[event].push(listener);
    }
    off(event, listener) {
        if (!this.events[event]) return;
        this.events[event] = this.events[event].filter(l => l !== listener);
    }
    emit(event, ...args) {
        if (!this.events[event]) return;
        this.events[event].forEach(listener => listener(...args));
    }
}

const globalKey = '__arriva_global_emitter__';
if (!window[globalKey]) {
    window[globalKey] = new EventEmitter();
}
export const events = window[globalKey];

/********* Token Handling *********/

const params = new URLSearchParams(window.location.search);
export const token = params.get('token');

/********* Firebase Functions *********/


const isLocal = window.location.hostname === 'localhost';
const functionsDomain = isLocal ? 'http://127.0.0.1:5001/arriva-500b3/us-central1' : 'https://us-central1-arriva-500b3.cloudfunctions.net';
const functions = getFunctions(app, functionsDomain);

const withToken = (fn) => {
    return (data = {}) => {
        return fn({...data, token});
    }
}

export const getEphemeralKey = withToken(httpsCallable(functions, 'getEphemeralKey'));
export const getNearbyPlaces = withToken(httpsCallable(functions, 'getNearbyPlaces'));
export const makePlacePhotoURL = (photo_reference) => {
    return functionsDomain + `/getPlacePhoto?photo_reference=${photo_reference}&token=${token}`;
}


import { EventEmitter } from 'events';

// This is a simple event emitter that will be used to pass errors
// from our server actions or client-side mutations to a listener
// component at the root of our application.
export const errorEmitter = new EventEmitter();

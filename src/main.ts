import { mount } from 'svelte';
import { registerSW } from 'virtual:pwa-register';
import App from './App.svelte';
import './app.css';

registerSW({ immediate: true });

const target = document.getElementById('app');
if (!target) throw new Error('The page has no #app element.');

export default mount(App, { target });

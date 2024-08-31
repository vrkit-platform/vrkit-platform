import ReactDOM from 'react-dom/client';

import renderRoot from "./renderRoot"

// ----------------------------------------------------------------------

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
renderRoot(root)
    .catch(err => console.error("failed to render root", err))


export {}
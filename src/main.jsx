// src/main.jsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ChakraProvider } from '@chakra-ui/react';
import { BrowserRouter } from 'react-router-dom';
// One font for the whole system: Rubik. Clean and rounded, one family for reading,
// labels and numbers, no serif and no second face. See src/theme/typography.js.
import '@fontsource/rubik/400.css';
import '@fontsource/rubik/500.css';
import '@fontsource/rubik/600.css';
import '@fontsource/rubik/700.css';
import theme from './theme';
import { toastOptions } from './theme/toast';
import App from './App';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ChakraProvider theme={theme} toastOptions={toastOptions}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ChakraProvider>
  </StrictMode>
);

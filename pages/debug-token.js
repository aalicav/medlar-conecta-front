import { useEffect, useState } from 'react';
import Cookies from 'js-cookie';

export default function DebugToken() {
  const [token, setToken] = useState(null);
  const [cookieToken, setCookieToken] = useState(null);
  const [localStorageToken, setLocalStorageToken] = useState(null);

  useEffect(() => {
    // Read token from cookie
    const tokenFromCookie = Cookies.get('token');
    setCookieToken(tokenFromCookie || 'Not found in cookie');

    // Read token from localStorage
    const tokenFromLocalStorage = localStorage.getItem('token');
    setLocalStorageToken(tokenFromLocalStorage || 'Not found in localStorage');

    // Set the token that would be used by api-client
    setToken(tokenFromCookie || tokenFromLocalStorage || 'No token found');
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h1>Auth Token Debug</h1>
      <div>
        <h2>Token that would be used in requests:</h2>
        <pre style={{ background: '#f5f5f5', padding: 10, overflowX: 'auto' }}>
          {token}
        </pre>
      </div>
      <div>
        <h2>Token from Cookie:</h2>
        <pre style={{ background: '#f5f5f5', padding: 10, overflowX: 'auto' }}>
          {cookieToken}
        </pre>
      </div>
      <div>
        <h2>Token from LocalStorage:</h2>
        <pre style={{ background: '#f5f5f5', padding: 10, overflowX: 'auto' }}>
          {localStorageToken}
        </pre>
      </div>
    </div>
  );
} 
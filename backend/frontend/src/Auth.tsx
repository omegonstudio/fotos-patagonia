import React, { useState } from 'react';
import './Auth.css'; // Import the CSS for styling

// Define the component's props interface
interface AuthProps {
  onLogin: (user: any) => void;
}

function Auth({ onLogin }: AuthProps) {
  const [email, setEmail] = useState<string>('admin@example.com');
  const [password, setPassword] = useState<string>('changeme');
  const [token, setToken] = useState<string | null>(localStorage.getItem('accessToken'));
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setToken(null);
    setIsLoading(true);

    try {
      const formData = new URLSearchParams();
      formData.append('username', email); // OAuth2PasswordRequestForm expects 'username'
      formData.append('password', password);

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Fallo la autenticacion');
      }

      const data = await response.json();
      const newAccessToken = data.access_token;
      setToken(newAccessToken);
      localStorage.setItem('accessToken', newAccessToken);

      if (data.photographer_id) {
        localStorage.setItem('photographerId', data.photographer_id);
      }

      // Fetch user profile to get and store user_id
      const meResponse = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${newAccessToken}`,
        },
      });

      if (!meResponse.ok) {
        throw new Error('Failed to fetch user profile after login.');
      }
      
      const meData = await meResponse.json();
      localStorage.setItem('userId', meData.id); // Store the user ID

      console.log("Token recibido y guardado en localStorage:", newAccessToken);
      console.log("Photographer ID guardado en localStorage:", data.photographer_id);
      console.log("User ID guardado en localStorage:", meData.id);
      
      // Notify parent component of successful login
      onLogin(meData);

    } catch (err: any) {
      setAuthError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <h2>Test de Autenticación</h2>
      <form onSubmit={handleLogin} className="login-form">
        <div className="form-group">
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Contraseña:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Autenticando...' : 'Iniciar Sesión'}
        </button>
      </form>

      {authError && <p className="auth-error-message">Error: {authError}</p>}
      
      {/* Remove the token display from here as the parent will handle user info */}
    </div>
  );
}

export default Auth;

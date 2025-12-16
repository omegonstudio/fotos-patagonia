import { useState, useEffect } from 'react';
import './App.css';
import Auth from './Auth'; // Import the Auth component

// Define the structure of the photo data returned by the backend
interface Photo {
  id: number;
  filename: string;
  url: string;
}

// Define the structure for the data needed to complete the upload
interface UploadCompletionData {
  object_name: string;
  original_filename: string;
  description: string;
  price: number;
  photographer_id: number;
  session_id: number;
}

function App() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadedPhotos, setUploadedPhotos] = useState<Photo[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [testDataReady, setTestDataReady] = useState(false);
  const [isCreatingPreference, setIsCreatingPreference] = useState(false);
  const [albums, setAlbums] = useState<any[]>([]); // State for albums
  const [newAlbumName, setNewAlbumName] = useState(''); // State for new album name
  const [newAlbumDescription, setNewAlbumDescription] = useState(''); // State for new album description
  const [activeTab, setActiveTab] = useState('buy'); // Default to buy tab
  const [currentUser, setCurrentUser] = useState<any | null>(null); // State for logged in user
  const [selectedAlbumId, setSelectedAlbumId] = useState<number | null>(null); // State for album selection
  const [earningsData, setEarningsData] = useState<any | null>(null); // State for earnings
  const [simulatedOrders, setSimulatedOrders] = useState<any[]>([]); // State for simulated orders
  const [allPhotos, setAllPhotos] = useState<Photo[]>([]); // State for all photos for management
  const [selectedPhotos, setSelectedPhotos] = useState<number[]>([]); // State for bulk selection

  const handleLoginSuccess = (userData: any) => {
    setCurrentUser(userData);
    setActiveTab('setup'); // Switch to a different tab after login
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('photographerId');
    setTestDataReady(false);
    setSimulatedOrders([]);
    setActiveTab('buy'); // Go back to buy tab
  };

  useEffect(() => {
    // On component mount, check if user is already logged in and fetch their data
    const fetchUserData = async () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          const meResponse = await fetch('/api/auth/me', {
            headers: { 'Authorization': `Bearer ${token}` },
          });
          if (meResponse.ok) {
            const meData = await meResponse.json();
            setCurrentUser(meData);
            setActiveTab('setup'); // Go to setup tab if already logged in
            if (!localStorage.getItem('userId')) {
              localStorage.setItem('userId', meData.id);
            }
            if (meData.photographer && !localStorage.getItem('photographerId')) {
              localStorage.setItem('photographerId', meData.photographer.id);
            }
          } else {
            handleLogout();
          }
        } catch (err) {
          console.error("Failed to fetch user profile on load:", err);
          handleLogout();
        }
      }
    };
    fetchUserData();
  }, []);

  // Effect for fetching data when a relevant tab is active
  useEffect(() => {
    if (currentUser) {
      if (activeTab === 'upload' || activeTab === 'albums') {
        handleListAlbums();
      }
      if (activeTab === 'earnings') {
        handleFetchEarnings();
      }
      if (activeTab === 'simulation') {
        handleFetchSimulatedOrders();
      }
      if (activeTab === 'manage-photos') {
        handleListAllPhotos();
      }
    }
  }, [activeTab, currentUser]);

  const hasPermission = (permission: string) => {
    if (!currentUser || !currentUser.role || !currentUser.role.permissions) {
      return false;
    }
    // Admin role has a special permission that bypasses individual checks
    if (currentUser.role.permissions.some((p: any) => p.name === 'full_access')) {
      return true;
    }
    return currentUser.role.permissions.some((p: any) => p.name === permission);
  };
  
  const handleListAllPhotos = async () => {
    setStatusMessage("Cargando todas las fotos...");
    setError(null);
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setError("No estás autenticado.");
      return;
    }
    try {
      const response = await fetch('/api/photos/', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) {
        throw new Error('Failed to list photos.');
      }
      const data = await response.json();
      setAllPhotos(data);
      setStatusMessage("Fotos cargadas.");
    } catch (err: any) {
      setError(err.message);
      setStatusMessage('');
    }
  };

  const handleDeletePhoto = async (photoId: number) => {
    if (!window.confirm(`¿Estás seguro de que quieres eliminar la foto ID: ${photoId}?`)) return;
    setStatusMessage(`Eliminando foto ID: ${photoId}...`);
    setError(null);
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setError('No estás autenticado.');
      return;
    }
    try {
      const response = await fetch(`/api/photos/${photoId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to delete photo.');
      }
      setStatusMessage('Foto eliminada exitosamente.');
      // Refresh the list
      setAllPhotos(prevPhotos => prevPhotos.filter(p => p.id !== photoId));
    } catch (err: any) {
      setError(err.message);
      setStatusMessage('');
    }
  };

  const handlePhotoSelection = (photoId: number) => {
    setSelectedPhotos(prev => 
      prev.includes(photoId) 
        ? prev.filter(id => id !== photoId) 
        : [...prev, photoId]
    );
  };

  const handleBulkDelete = async () => {
    if (selectedPhotos.length === 0 || !window.confirm(`¿Estás seguro de que quieres eliminar ${selectedPhotos.length} foto(s) seleccionada(s)?`)) {
      return;
    }
    setStatusMessage(`Eliminando ${selectedPhotos.length} foto(s)...`);
    setError(null);
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setError('No estás autenticado.');
      return;
    }
    try {
      const response = await fetch(`/api/photos/`, { // Note the trailing slash for the bulk endpoint
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ photo_ids: selectedPhotos }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to bulk delete photos.');
      }
      
      const result = await response.json();
      setStatusMessage(result.message || `${result.deleted_count} foto(s) eliminada(s) exitosamente.`);
      
      // Refresh the list and clear selection
      setAllPhotos(prevPhotos => prevPhotos.filter(p => !selectedPhotos.includes(p.id)));
      setSelectedPhotos([]);

    } catch (err: any) {
      setError(err.message);
      setStatusMessage('');
    }
  };

  const handleFetchEarnings = async () => {
    setStatusMessage("Consultando resumen de ganancias...");
    setError(null);
    const token = localStorage.getItem('accessToken');
    if (!token || !currentUser) return;
  
    try {
      let url = '';
      // Check for admin/supervisor permission first
      if (hasPermission('view_any_earnings')) {
        url = '/api/admin/dashboard'; // Use the new admin dashboard endpoint
      } 
      else if (hasPermission('view_own_earnings') && currentUser.photographer?.id) {
        url = `/api/photographers/${currentUser.photographer.id}/earnings/summary`;
      } 
      else {
        setError("No tienes permisos para ver ganancias o no eres un fotógrafo.");
        setStatusMessage('');
        return;
      }
  
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch earnings summary.');
      }
      const data = await response.json();
      setEarningsData(data);
      setStatusMessage("Resumen de ganancias cargado.");
    } catch (err: any) {
      setError(err.message);
      setStatusMessage('');
    }
  };

  const handleFetchSimulatedOrders = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;
    setStatusMessage("Cargando órdenes...");
    try {
      const response = await fetch('/api/orders/', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch orders.");
      const data = await response.json();
      setSimulatedOrders(data);
      setStatusMessage("Órdenes cargadas.");
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCreateSimulatedOrder = async () => {
    const userId = localStorage.getItem('userId');
    setStatusMessage("Creando orden de simulación...");
    setError(null);

    const orderPayload = {
      user_id: userId ? parseInt(userId, 10) : null,
      total: 150.0,
      payment_method: "cash",
      payment_status: "pending",
      order_status: "pending",
      items: [{ photo_id: 1, price: 150.0, quantity: 1 }]
    };

    try {
      const token = localStorage.getItem('accessToken');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/checkout/create-order', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(orderPayload),
      });
      if (!response.ok) throw new Error("Failed to create simulated order.");
      await handleFetchSimulatedOrders();
      setStatusMessage("Orden de simulación creada exitosamente.");
    } catch (err: any) {
      setError(err.message);
      setStatusMessage('');
    }
  };

  const handleMarkAsPaid = async (orderId: number) => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setError("Debes estar logueado para marcar una orden como pagada (simulación).");
      return;
    }
    setStatusMessage(`Marcando orden ${orderId} como pagada...`);
    setError(null);

    try {
      const response = await fetch(`/api/orders/${orderId}/status?new_status=paid&payment_method=cash`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to mark order as paid.");
      }
      await handleFetchSimulatedOrders();
      setStatusMessage(`Orden ${orderId} marcada como pagada.`);
    } catch (err: any) {
      setError(err.message);
      setStatusMessage('');
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setSelectedFiles(Array.from(event.target.files));
    }
  };

  const handleListAlbums = async () => {
    setStatusMessage('Listando álbumes...');
    setError(null);
    try {
      const response = await fetch('/api/albums/');
      if (!response.ok) {
        throw new Error('Failed to list albums.');
      }
      const data = await response.json();
      setAlbums(data);
      setStatusMessage('Álbumes cargados correctamente.');
    } catch (err: any) {
      setError(err.message);
      setStatusMessage('');
    }
  };

  const handleCreateAlbum = async () => {
    if (!newAlbumName) {
      setError('El nombre del álbum es requerido.');
      return;
    }
    setStatusMessage('Creando álbum...');
    setError(null);
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setError('No estás autenticado. Por favor, inicia sesión primero.');
      return;
    }
    try {
      const response = await fetch('/api/albums/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newAlbumName,
          description: newAlbumDescription,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create album.');
      }
      const newAlbum = await response.json();
      setAlbums([...albums, newAlbum]);
      setNewAlbumName('');
      setNewAlbumDescription('');
      setStatusMessage(`Álbum "${newAlbum.name}" creado exitosamente.`);
    } catch (err: any) {
      setError(err.message);
      setStatusMessage('');
    }
  };

  const handleDeleteAlbum = async (albumId: number) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este álbum?')) return;
    setStatusMessage(`Eliminando álbum ID: ${albumId}...`);
    setError(null);
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setError('No estás autenticado.');
      return;
    }
    try {
      const response = await fetch(`/api/albums/${albumId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to delete album.');
      }
      setStatusMessage('Álbum eliminado exitosamente.');
      handleListAlbums();
    } catch (err: any) {
      setError(err.message);
      setStatusMessage('');
    }
  };

  const handleUpdateAlbum = async (albumId: number) => {
    const newName = prompt('Ingresa el nuevo nombre para el álbum:');
    if (!newName) return;
    const newDescription = prompt('Ingresa la nueva descripción (opcional):');
    setStatusMessage(`Actualizando álbum ID: ${albumId}...`);
    setError(null);
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setError('No estás autenticado.');
      return;
    }
    try {
      const response = await fetch(`/api/albums/${albumId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newName, description: newDescription }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update album.');
      }
      setStatusMessage('Álbum actualizado exitosamente.');
      handleListAlbums();
    } catch (err: any) {
      setError(err.message);
      setStatusMessage('');
    }
  };

  const handleCreateTestData = async () => {
    setStatusMessage('Preparing test data...');
    setError(null);
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setError('No estás autenticado. Por favor, inicia sesión primero.');
      return;
    }
    try {
      const response = await fetch('/api/testing/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to create test data.');
      }
      const data = await response.json();
      setStatusMessage(data.message || 'Test data is ready!');
      setTestDataReady(true);
    } catch (err: any) {
      setError(err.message);
      setStatusMessage('');
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setError('Please select files to upload.');
      return;
    }
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setError('No estás autenticado. Por favor, inicia sesión primero.');
      return;
    }
    const photographerId = localStorage.getItem('photographerId');
    if (!photographerId) {
      setError('No se pudo obtener el ID del fotógrafo. Por favor, inicia sesión de nuevo.');
      return;
    }
    setIsUploading(true);
    setError(null);
    setStatusMessage('Starting upload...');
    try {
      setStatusMessage('Requesting upload URLs...');
      const filesToUpload = selectedFiles.map(f => ({
        filename: f.name,
        contentType: 'application/octet-stream'
      }));
      const presignedUrlResponse = await fetch('/api/request-upload-urls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ files: filesToUpload }),
      });
      if (!presignedUrlResponse.ok) {
        throw new Error('Failed to get presigned URLs.');
      }
      const { urls: presignedUrlData } = await presignedUrlResponse.json();
      setStatusMessage(`Uploading ${selectedFiles.length} file(s)...`);
      const uploadPromises = selectedFiles.map(async (file, index) => {
        const { upload_url } = presignedUrlData[index];
        const contentType = 'application/octet-stream';
        const response = await fetch(upload_url, {
          method: 'PUT',
          body: file,
          headers: { 'Content-Type': contentType },
        });
        if (!response.ok) {
          const errorText = await response.text();
          console.error("Upload error response:", errorText);
          throw new Error(`Failed to upload ${file.name}. Status: ${response.status} ${response.statusText}`);
        }
        return response;
      });
      await Promise.all(uploadPromises);
      setStatusMessage('Finalizing uploads...');
      const completionData = presignedUrlData.map((data: any) => ({
        object_name: data.object_name,
        original_filename: data.original_filename,
        description: `An image of ${data.original_filename}`,
        price: 10.0,
        photographer_id: parseInt(photographerId, 10),
      }));
      const finalPayload = {
        photos: completionData,
        album_id: selectedAlbumId
      };
      const completionResponse = await fetch('/api/photos/complete-upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(finalPayload),
      });
      if (!completionResponse.ok) {
        const errorData = await completionResponse.json();
        throw new Error(`Failed to finalize upload: ${errorData.detail || 'Unknown error'}`);
      }
      const newPhotos = await completionResponse.json();
      setUploadedPhotos(prevPhotos => [...prevPhotos, ...newPhotos]);
      setSelectedFiles([]);
      setStatusMessage('Upload complete!');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsUploading(false);
      setTimeout(() => setStatusMessage(''), 5000);
    }
  };

  const handleGuestCheckout = async () => {
    setIsCreatingPreference(true);
    setError(null);
    setStatusMessage('Iniciando proceso de pago...');
    try {
      setStatusMessage('Creando orden...');
      const userId = localStorage.getItem('userId');
      const token = localStorage.getItem('accessToken');
      const orderPayload = {
        user_id: userId ? parseInt(userId, 10) : null,
        total: 150.0,
        payment_method: "mercadopago",
        items: [{ photo_id: 1, price: 150.0, quantity: 1 }]
      };
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const orderResponse = await fetch('/api/checkout/create-order', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(orderPayload),
      });
      if (!orderResponse.ok) {
        const errorData = await orderResponse.json();
        throw new Error(errorData.detail || 'Failed to create order.');
      }
      const orderData = await orderResponse.json();
      const orderId = orderData.id;
      setStatusMessage(`Orden ${orderId} creada. Creando preferencia de pago...`);
      const preferenceResponse = await fetch('/api/checkout/mercadopago/create-preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId }),
      });
      if (!preferenceResponse.ok) {
        const errorData = await preferenceResponse.json();
        throw new Error(errorData.detail || 'Failed to create payment preference.');
      }
      const preferenceData = await preferenceResponse.json();
      if (preferenceData.init_point) {
        setStatusMessage('Redirigiendo a Mercado Pago...');
        window.location.href = preferenceData.init_point;
      } else {
        throw new Error('No se recibió el link de pago.');
      }
    } catch (err: any) {
      setError(err.message);
      setStatusMessage('');
    } finally {
      setIsCreatingPreference(false);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Photo Uploader & Checkout Test</h1>
        <p>A simple interface to test file uploads and payments.</p>
        {currentUser && (
          <div className="user-info">
            <p>Conectado como: <strong>{currentUser.email}</strong> (Rol: <strong>{currentUser.role.name}</strong>)</p>
            <button onClick={handleLogout} className="logout-btn">Cerrar Sesión</button>
          </div>
        )}
      </header>
      <main>
        <div className="tab-navigation">
          <button onClick={() => setActiveTab('buy')} className={activeTab === 'buy' ? 'active' : ''}>Comprar Foto</button>
          {!currentUser && <button onClick={() => setActiveTab('auth')} className={activeTab === 'auth' ? 'active' : ''}>Authentication</button>}
          {currentUser && (
            <>
              <button onClick={() => setActiveTab('setup')} className={activeTab === 'setup' ? 'active' : ''}>Setup</button>
              <button onClick={() => setActiveTab('albums')} className={activeTab === 'albums' ? 'active' : ''}>Álbumes</button>
              <button onClick={() => setActiveTab('upload')} className={activeTab === 'upload' ? 'active' : ''}>Cargar Fotos</button>
              <button onClick={() => setActiveTab('simulation')} className={activeTab === 'simulation' ? 'active' : ''}>Simulación</button>
              {(hasPermission('view_own_earnings') || hasPermission('view_any_earnings')) && (
                 <button onClick={() => setActiveTab('earnings')} className={activeTab === 'earnings' ? 'active' : ''}>Ganancias</button>
              )}
              {(hasPermission('delete_own_photo') || hasPermission('delete_any_photo')) && (
                <button onClick={() => setActiveTab('manage-photos')} className={activeTab === 'manage-photos' ? 'active' : ''}>Gestionar Fotos</button>
              )}
            </>
          )}
        </div>

        <div className="tab-content">
          {activeTab === 'buy' && (
            <div className="checkout-controls">
              <h2>Comprar Foto de Prueba</h2>
              <p>Esto simula la compra de la foto de prueba (ID 1) como invitado o usuario logueado.</p>
              <button onClick={handleGuestCheckout} disabled={isCreatingPreference}>
                {isCreatingPreference ? 'Generando...' : 'Pagar con Mercado Pago'}
              </button>
            </div>
          )}

          {activeTab === 'setup' && currentUser && (
            <div className="setup-controls">
              <h2>Paso 1: Preparar Entorno</h2>
              <button onClick={handleCreateTestData} disabled={testDataReady}>
                {testDataReady ? 'Datos de Prueba Listos' : 'Preparar Datos de Prueba'}
              </button>
              <p>Esto crea usuarios de prueba (supervisor, fotógrafo), un álbum y un fotógrafo genéricos.</p>
            </div>
          )}

          {activeTab === 'auth' && !currentUser && (
            <Auth onLogin={handleLoginSuccess} />
          )}

          {activeTab === 'albums' && currentUser && (
            <div className="albums-controls">
              <h2>Paso 2: Gestionar Álbumes</h2>
              <div className="album-actions">
                <button onClick={handleListAlbums}>Listar Álbumes</button>
              </div>
              <div className="create-album-form">
                <h3>Crear Nuevo Álbum</h3>
                <input
                  type="text"
                  placeholder="Nombre del Álbum"
                  value={newAlbumName}
                  onChange={(e) => setNewAlbumName(e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Descripción del Álbum"
                  value={newAlbumDescription}
                  onChange={(e) => setNewAlbumDescription(e.target.value)}
                />
                <button onClick={handleCreateAlbum}>Crear Álbum</button>
              </div>
            </div>
          )}

          {activeTab === 'upload' && currentUser && (
            <div className="upload-controls">
              <h2>Paso 3: Cargar Fotos</h2>
              <div className="form-group">
                <label htmlFor="album-select">Asignar al Álbum (opcional):</label>
                <select 
                  id="album-select"
                  value={selectedAlbumId ?? ''} 
                  onChange={(e) => setSelectedAlbumId(e.target.value ? Number(e.target.value) : null)}
                >
                  <option value="">-- Ninguno --</option>
                  {albums.map(album => (
                    <option key={album.id} value={album.id}>{album.name}</option>
                  ))}
                </select>
              </div>
              <input type="file" multiple onChange={handleFileChange} accept="image/*" />
              <button onClick={handleUpload} disabled={isUploading || selectedFiles.length === 0}>
                {isUploading ? 'Subiendo...' : `Subir ${selectedFiles.length} Archivo(s)`}
              </button>
            </div>
          )}

          {activeTab === 'earnings' && currentUser && (
            <div className="earnings-controls">
              <h2>Resumen de Ganancias</h2>
              <button onClick={handleFetchEarnings}>Recargar</button>
              {earningsData ? (
                // Use a property unique to the admin dashboard to differentiate the view
                'total_gross_revenue' in earningsData ? (
                  // Admin Dashboard View
                  <div className="admin-dashboard">
                    <h3>Panel de Administrador</h3>
                    <div className="global-stats">
                      <p><strong>Ingresos Brutos Totales:</strong> ${earningsData.total_gross_revenue.toFixed(2)}</p>
                      <p><strong>Comisiones Totales Pagadas:</strong> ${earningsData.total_commissions.toFixed(2)}</p>
                      <p><strong>Órdenes Totales (pagadas):</strong> {earningsData.total_orders}</p>
                      <p><strong>Fotos Vendidas Totales:</strong> {earningsData.total_photos_sold}</p>
                    </div>
                    <h4>Desglose por Fotógrafo</h4>
                    <table className="earnings-table">
                      <thead>
                        <tr>
                          <th>ID Fotógrafo</th>
                          <th>Nombre</th>
                          <th>Ventas Brutas</th>
                          <th>Comisión</th>
                        </tr>
                      </thead>
                      <tbody>
                        {earningsData.commissions_by_photographer.map((summary: any) => (
                          <tr key={summary.photographer_id}>
                            <td>{summary.photographer_id}</td>
                            <td>{summary.photographer_name}</td>
                            <td>${summary.total_gross_sales.toFixed(2)}</td>
                            <td>${summary.total_commission.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  // Photographer's own summary view
                  <div className="earnings-summary">
                    <h3>Ganancias Totales: ${earningsData.total_earnings.toFixed(2)}</h3>
                    <p><strong>Total de fotos vendidas:</strong> {earningsData.total_photos_sold}</p>
                    <p><strong>Total de órdenes en las que participaste:</strong> {earningsData.total_orders_involved}</p>
                    
                    {earningsData.photo_sales_details && earningsData.photo_sales_details.length > 0 && (
                      <div className="photo-sales-details">
                        <h4>Detalle de Fotos Vendidas</h4>
                        <table className="earnings-table">
                          <thead>
                            <tr>
                              <th>Foto</th>
                              <th>Álbum</th>
                              <th>Veces Vendida</th>
                              <th>Ganancia Generada</th>
                            </tr>
                          </thead>
                          <tbody>
                            {earningsData.photo_sales_details.map((detail: any) => (
                              <tr key={detail.photo_id}>
                                <td>
                                  <img src={detail.photo_url} alt={`Foto ${detail.photo_id}`} style={{ width: '100px', borderRadius: '4px' }} />
                                </td>
                                <td>{detail.album_name}</td>
                                <td>{detail.times_sold}</td>
                                <td>${detail.total_earnings.toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )
              ) : (
                <p>Cargando resumen de ganancias...</p>
              )}
            </div>
          )}
          
          {activeTab === 'manage-photos' && currentUser && (
            <div className="manage-photos-controls">
              <h2>Gestionar Fotos</h2>
              <div className="bulk-actions">
                <button onClick={handleListAllPhotos}>Recargar Lista de Fotos</button>
                {selectedPhotos.length > 0 && (
                  <button onClick={handleBulkDelete} className="delete-selected-btn">
                    Eliminar {selectedPhotos.length} Foto(s) Seleccionada(s)
                  </button>
                )}
              </div>
              <div className="all-photos-list">
                {allPhotos.length > 0 ? (
                  <table className="photos-table">
                    <thead>
                      <tr>
                        <th>Seleccionar</th>
                        <th>ID</th>
                        <th>Preview</th>
                        <th>Filename</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allPhotos.map(photo => (
                        <tr key={photo.id}>
                          <td>
                            <input 
                              type="checkbox"
                              checked={selectedPhotos.includes(photo.id)}
                              onChange={() => handlePhotoSelection(photo.id)}
                            />
                          </td>
                          <td>{photo.id}</td>
                          <td>
                            <img src={photo.url} alt={photo.filename} style={{ width: '100px', borderRadius: '4px' }} />
                          </td>
                          <td>{photo.filename}</td>
                          <td>
                            <button className="album-action-btn" onClick={() => handleDeletePhoto(photo.id)}>
                              Eliminar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p>No hay fotos para mostrar o no se han cargado.</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'simulation' && currentUser && (
             <div className="simulation-controls">
                <h2>Simulación de Órdenes</h2>
                <button onClick={handleCreateSimulatedOrder}>Crear Orden de Simulación</button>
                <div className="simulated-orders-list">
                  <h3>Órdenes Creadas</h3>
                  <ul>
                    {simulatedOrders.map(order => (
                      <li key={order.id}>
                        <span>Orden ID: {order.id} | Estado: {order.payment_status}</span>
                        {order.payment_status === 'pending' && (
                          <button onClick={() => handleMarkAsPaid(order.id)} className="album-action-btn">
                            Marcar como Pagada (Efectivo)
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
             </div>
          )}
        </div>

        {(statusMessage || error) && (
          <div className="status-box">
            {statusMessage && <p className="status-message">{statusMessage}</p>}
            {error && <p className="error-message">{error}</p>}
          </div>
        )}

        {albums.length > 0 && activeTab === 'albums' && (
          <div className="albums-list">
            <h2>Álbumes Existentes</h2>
            <ul>
              {albums.map((album) => (
                <li key={album.id}>
                  <strong>{album.name}</strong>: {album.description || 'Sin descripción'} (ID: {album.id})
                  <button className="album-action-btn" onClick={() => handleUpdateAlbum(album.id)}>Editar</button>
                  <button className="album-action-btn" onClick={() => handleDeleteAlbum(album.id)}>Eliminar</button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {selectedFiles.length > 0 && activeTab === 'upload' && (
          <div className="file-list">
            <h3>Archivos a subir:</h3>
            <ul>
              {selectedFiles.map((file, index) => (
                <li key={index}>{file.name} ({Math.round(file.size / 1024)} KB)</li>
              ))}
            </ul>
          </div>
        )}

        {uploadedPhotos.length > 0 && (
          <div className="gallery">
            <h2>Fotos Subidas</h2>
            <div className="photo-grid">
              {uploadedPhotos.map(photo => (
                <div key={photo.id} className="photo-item">
                  <img src={photo.url} alt={photo.filename} />
                  <p>{photo.filename}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
// App.tsx — Application routing table with public, protected, and fallback routes.
import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider } from './lib/auth';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';

import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { SearchRides } from './pages/SearchRides';
import { RideDetail } from './pages/RideDetail';
import { Dashboard } from './pages/Dashboard';
import { MyVehicles } from './pages/MyVehicles';
import { PublishRoute } from './pages/PublishRoute';
import { EditRoute } from './pages/EditRoute';
import { TripView } from './pages/TripView';
import { Profile } from './pages/Profile';

const NotFound: React.FC = () => (
  <div className="container py-12 text-center">
    <h1 className="text-2xl font-bold mb-2">Page Not Found</h1>
    <p className="text-secondary mb-4">The page you were looking for does not exist in Carpool.</p>
    <Link to="/" className="btn btn-primary btn-sm">
      Return to Home
    </Link>
  </div>
);

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<Layout />}>
            {/* Public routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/search" element={<SearchRides />} />
            <Route path="/rides/:id" element={<RideDetail />} />
            <Route path="/users/:id" element={<Profile />} />

            {/* Protected routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/vehicles" element={<MyVehicles />} />
              <Route path="/publish" element={<PublishRoute />} />
              <Route path="/routes/:id/edit" element={<EditRoute />} />
              <Route path="/trips/:id" element={<TripView />} />
              <Route path="/profile" element={<Profile />} />
            </Route>

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;

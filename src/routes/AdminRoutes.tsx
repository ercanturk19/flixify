import { Routes, Route, Navigate } from 'react-router-dom';
import { AdminRoute } from '../components/AdminRoute';
import AdminLogin from '../pages/admin/AdminLogin';
import AdminRegister from '../pages/admin/AdminRegister';
import Dashboard from '../pages/admin/Dashboard';
import Users from '../pages/admin/Users';
import Plans from '../pages/admin/Plans';

export function AdminRoutes() {
    return (
        <Routes>
            {/* Public Admin Login & Register */}
            <Route path="giris-yap" element={<AdminLogin />} />
            <Route path="kayit-ol" element={<AdminRegister />} />
            
            {/* Also match with leading slash just in case */}
            <Route path="/giris-yap" element={<AdminLogin />} />
            <Route path="/kayit-ol" element={<AdminRegister />} />
            
            {/* Protected Admin Routes */}
            <Route element={<AdminRoute />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="users" element={<Users />} />
                <Route path="plans" element={<Plans />} />
            </Route>

            {/* Catch all - Redirect to Dashboard (which redirects to login if needed) */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

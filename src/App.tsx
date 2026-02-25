import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { getSubdomain } from './utils/subdomain';
import { AdminRoutes } from './routes/AdminRoutes';
import { AppRoutes } from './routes/AppRoutes';
import 'flag-icons/css/flag-icons.min.css';
import './App.css';

function App() {
    const subdomain = getSubdomain();

    return (
        <AuthProvider>
            <Router>
                <SubdomainRouter subdomain={subdomain} />
            </Router>
        </AuthProvider>
    );
}

function SubdomainRouter({ subdomain }: { subdomain: string | null }) {
    if (subdomain === 'admin') {
        return <AdminRoutes />;
    }

    // Default to App/Main routes for 'app', 'www', or root domain
    return <AppRoutes />;
}

export default App;

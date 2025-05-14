import { ThemeProvider } from './components/theme-provider';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Unauthorized from './pages/Unauthorized';
import ProtectedRoute from './components/protected-route';
import { Toaster } from 'sonner';

function App() {
	return (
		<ThemeProvider defaultTheme='dark' storageKey='vite-ui-theme'>
			<Router>
				<Routes>
					<Route
						path='/'
						element={
							<ProtectedRoute>
								<Home />
							</ProtectedRoute>
						}
					/>
					<Route path='/login' element={<Login />} />
					<Route path='/unauthorized' element={<Unauthorized />} />
				</Routes>
			</Router>
			<Toaster />
		</ThemeProvider>
	);
}

export default App;

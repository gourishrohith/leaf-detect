import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './app/layout/AppLayout'
import { Dashboard } from './app/pages/Dashboard'
import { Login } from './app/pages/Login'
import { Signup } from './app/pages/Signup'
import { Scan } from './app/pages/Scan'
import { Profile } from './app/pages/Profile'
import { RequireAuth } from './app/routing/RequireAuth'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="/about" element={<Dashboard initialSection="about" />} />
          <Route
            path="/scan"
            element={
              <RequireAuth>
                <Scan />
              </RequireAuth>
            }
          />
          <Route
            path="/profile"
            element={
              <RequireAuth>
                <Profile />
              </RequireAuth>
            }
          />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

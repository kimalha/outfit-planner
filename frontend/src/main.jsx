import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ProfileProvider } from './context/ProfileContext'
import { PlannerProvider } from './context/PlannerContext'
import { NotificationProvider } from './context/NotificationContext'
import { PostProvider } from './context/PostContext'
import { CategoryProvider } from './context/CategoryContext'
import { OutfitProvider } from './context/OutfitContext'
import { AuthProvider } from './context/AuthContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ProfileProvider>
      <PlannerProvider>
        <NotificationProvider>
          <PostProvider>
            <CategoryProvider>
              <OutfitProvider>
                <AuthProvider>
                  <App />
                </AuthProvider>
              </OutfitProvider>
            </CategoryProvider>
          </PostProvider>
        </NotificationProvider>
      </PlannerProvider>
    </ProfileProvider>
  </StrictMode>,
)

import { Outlet, Route, Routes } from 'react-router-dom'
import Dashboard from './routes/Dashboard'
import StoryForm from './routes/StoryForm'
import StoryView from './routes/StoryView'
import Characters from './routes/Characters'
import Places from './routes/Places'
import Items from './routes/Items'
import PlotPoints from './routes/PlotPoints'
import { TopNav } from './components/TopNav'
import SignIn from './routes/SignIn'
import RequireAuth from './auth/RequireAuth'

function Shell() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <TopNav />
      <main style={{ maxWidth: 960, margin: '0 auto', padding: '16px' }}>
        <Outlet />
      </main>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<SignIn />} />
      <Route element={<RequireAuth />}>
        <Route element={<Shell />}>
          <Route index element={<Dashboard />} />
          <Route path="stories">
            <Route path="new" element={<StoryForm />} />
            <Route path=":id" element={<StoryView />} />
            <Route path=":id/edit" element={<StoryForm />} />
            <Route path=":id/characters" element={<Characters />} />
            <Route path=":id/places" element={<Places />} />
            <Route path=":id/items" element={<Items />} />
            <Route path=":id/plot-points" element={<PlotPoints />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  )
}

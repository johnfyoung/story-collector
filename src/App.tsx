import { Outlet, Route, Routes } from 'react-router-dom'
import Dashboard from './routes/Dashboard'
import StoryForm from './routes/StoryForm'
import StoryView from './routes/StoryView'
import Characters from './routes/Characters'
import CharacterForm from './routes/CharacterForm'
import Locations from './routes/Locations'
import Items from './routes/Items'
import PlotLines from './routes/PlotLines'
import PlotLineForm from './routes/PlotLineForm'
import Species from './routes/Species'
import Groups from './routes/Groups'
import Languages from './routes/Languages'
import SpeciesForm from './routes/SpeciesForm'
import LocationForm from './routes/LocationForm'
import GroupForm from './routes/GroupForm'
import LanguageForm from './routes/LanguageForm'
import { TopNav } from './components/TopNav'
import SignIn from './routes/SignIn'
import RequireAuth from './auth/RequireAuth'
import './App.css'

function Shell() {
  return (
    <div className="app-shell">
      <TopNav />
      <main className="app-main">
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
            <Route path=":id/characters/new" element={<CharacterForm />} />
            <Route path=":id/characters/:charId/edit" element={<CharacterForm />} />
            <Route path=":id/locations" element={<Locations />} />
            <Route path=":id/locations/new" element={<LocationForm />} />
            <Route path=":id/locations/:elemId/edit" element={<LocationForm />} />
            <Route path=":id/species" element={<Species />} />
            <Route path=":id/species/new" element={<SpeciesForm />} />
            <Route path=":id/species/:elemId/edit" element={<SpeciesForm />} />
            <Route path=":id/groups" element={<Groups />} />
            <Route path=":id/groups/new" element={<GroupForm />} />
            <Route path=":id/groups/:elemId/edit" element={<GroupForm />} />
            <Route path=":id/items" element={<Items />} />
            <Route path=":id/languages" element={<Languages />} />
            <Route path=":id/languages/new" element={<LanguageForm />} />
            <Route path=":id/languages/:elemId/edit" element={<LanguageForm />} />
            <Route path=":id/plot-lines" element={<PlotLines />} />
            <Route path=":id/plot-lines/new" element={<PlotLineForm />} />
            <Route path=":id/plot-lines/:plotLineId/edit" element={<PlotLineForm />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  )
}

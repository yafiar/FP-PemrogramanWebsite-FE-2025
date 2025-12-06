import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import Register from "./pages/Register";
import Sandbox from "./pages/Sandbox";
import Login from "./pages/Login";
import ProfilePage from "./pages/ProfilePage";
import MyProjectsPage from "./pages/MyProjectsPage";
import CreateQuiz from "./pages/CreateQuiz";
import CreateProject from "./pages/CreateProject";
import EditQuiz from "./pages/EditQuiz";
import Quiz from "./pages/Quiz";
// import MazeChase from "./pages/maze-chase/MazeChase";
import CreateMazeChase from "./pages/maze-chase/CreateMazeChase";
import EditMazeChase from "./pages/maze-chase/EditMazeChase";
import ProtectedRoute from "./routes/ProtectedRoutes";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/sandbox" element={<Sandbox />} />
        <Route path="/quiz/play/:id" element={<Quiz />} />
        {/* <Route path="/maze-chase/play/:id" element={<MazeChase />} /> */}

        <Route element={<ProtectedRoute />}>
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/my-projects" element={<MyProjectsPage />} />
          <Route path="/create-projects" element={<CreateProject />} />
          <Route path="/create-quiz" element={<CreateQuiz />} />
          <Route path="/quiz/edit/:id" element={<EditQuiz />} />
          <Route path="/create-maze-chase" element={<CreateMazeChase/>} />
          <Route path="/maze-chase/edit" element={<EditMazeChase/>} />
        </Route>
      </Routes>
    </>
  );
}

export default App;

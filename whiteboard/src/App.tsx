import WhiteboardPage from "./component/WhiteBoard";
import Login from "./page/Login";
import { Toaster } from "react-hot-toast";
import { BrowserRouter, Route, Routes } from "react-router-dom";

function App() {
  return (
    <>
      <BrowserRouter>
        <Toaster />
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/home" element={<WhiteboardPage />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
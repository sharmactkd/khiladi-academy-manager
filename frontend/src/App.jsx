import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import AppRoutes from "./routes/AppRoutes.jsx";
import PrivateRouteSeo from "./components/seo/PrivateRouteSeo.jsx";

const App = () => {
  return (
    <BrowserRouter>
      <PrivateRouteSeo />
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.ts";
import { Box, Spinner } from "@chakra-ui/react";

const AuthCallback: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const userRaw = params.get("user");

    if (token && userRaw) {
      try {
        const user = JSON.parse(decodeURIComponent(userRaw));
        login(decodeURIComponent(token), user);
        navigate("/admin", { replace: true });
      } catch {
        navigate("/login", { replace: true });
      }
    } else {
      navigate("/login", { replace: true });
    }
  }, []);

  return (
    <Box minH="100vh" display="flex" alignItems="center" justifyContent="center">
      <Spinner size="xl" />
    </Box>
  );
};

export default AuthCallback;

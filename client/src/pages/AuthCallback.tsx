import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.ts";
import type { User } from "../context/AuthContext.ts";
import { exchangeOAuthCode } from "../api";
import { Box, Spinner } from "@chakra-ui/react";

const AuthCallback: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // The OAuth callback now carries an opaque one-time `code` (not the JWT/user
    // in the URL). Exchange it for the token + user.
    const code = new URLSearchParams(window.location.search).get("code");
    if (!code) {
      navigate("/login", { replace: true });
      return;
    }
    exchangeOAuthCode(code)
      .then(({ data }) => {
        login(data.access_token, data.user as User);
        navigate("/admin", { replace: true });
      })
      .catch(() => navigate("/login", { replace: true }));
  }, []);

  return (
    <Box minH="100vh" display="flex" alignItems="center" justifyContent="center">
      <Spinner size="xl" />
    </Box>
  );
};

export default AuthCallback;

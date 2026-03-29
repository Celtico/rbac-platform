import React, { useState } from "react";
import { useTheme } from "../context/ThemeContext";
import type { ColorTheme, RadiusSize } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";

const Settings: React.FC = () => {
  const { theme, setTheme, radius, setRadius } = useTheme();
  const { hasRole } = useAuth();
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployResult, setDeployResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const themes: { id: ColorTheme; name: string; class: string }[] = [
    { id: "default", name: "Default (Blue)", class: "bg-blue-500" },
    { id: "ocean", name: "Ocean (Cyan)", class: "bg-cyan-500" },
    { id: "forest", name: "Forest (Green)", class: "bg-emerald-500" },
    { id: "sunset", name: "Sunset (Red/Orange)", class: "bg-rose-500" },
  ];

  const radiuses: { id: RadiusSize; name: string }[] = [
    { id: "none", name: "None" },
    { id: "sm", name: "Small" },
    { id: "md", name: "Medium" },
    { id: "lg", name: "Large" },
    { id: "xl", name: "Extra Large" },
    { id: "full", name: "Full" },
  ];

  const handleDeploy = async () => {
    if (!window.confirm("Estàs segur que vols desplegar l'aplicació?")) return;

    setIsDeploying(true);
    setDeployResult(null);

    try {
      const response = await fetch("/api/deploy", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setDeployResult({
          success: true,
          message: data.message || "Desplegament completat amb èxit",
        });
      } else {
        setDeployResult({
          success: false,
          message: data.message || "Error durant el desplegament",
        });
      }
    } catch (error) {
      console.error("Deploy error:", error);
      setDeployResult({
        success: false,
        message: "Error de connexió al servidor",
      });
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 dark:text-white transition-colors">
        System Settings
      </h1>

      <div className="bg-white dark:bg-gray-800 p-8 rounded-custom shadow-md transition-colors">
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">
            Color Theme
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {themes.map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={`p-4 rounded-custom border-2 transition-all flex flex-col items-center gap-2 ${
                  theme === t.id
                    ? "border-primary bg-primary/10"
                    : "border-transparent bg-gray-50 dark:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                }`}
              >
                <div className={`w-8 h-8 rounded-full ${t.class}`} />
                <span className="text-sm font-medium dark:text-gray-200">
                  {t.name}
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">
            Rounded Corners (Border Radius)
          </h2>
          <div className="flex flex-wrap gap-3">
            {radiuses.map((r) => (
              <button
                key={r.id}
                onClick={() => setRadius(r.id)}
                className={`px-4 py-2 rounded-custom border-2 transition-all ${
                  radius === r.id
                    ? "border-primary bg-primary text-white"
                    : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-primary"
                }`}
              >
                {r.name}
              </button>
            ))}
          </div>
        </section>

        {hasRole("admin") && (
          <section className="pt-8 border-t dark:border-gray-700">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">
              Administració del Sistema
            </h2>
            <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-custom border border-gray-200 dark:border-gray-700">
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                Pots desplegar la darrera versió de l'aplicació directament des
                d'aquí. Això executarà el script de desplegament al servidor.
              </p>
              <button
                onClick={handleDeploy}
                disabled={isDeploying}
                className={`px-6 py-3 bg-accent text-white rounded-custom shadow hover:opacity-90 transition-all flex items-center gap-2 ${
                  isDeploying ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {isDeploying ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Desplegant...
                  </>
                ) : (
                  "Desplegar Aplicació"
                )}
              </button>

              {deployResult && (
                <div
                  className={`mt-4 p-4 rounded-custom border ${
                    deployResult.success
                      ? "bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400"
                      : "bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400"
                  }`}
                >
                  {deployResult.message}
                </div>
              )}
            </div>
          </section>
        )}

        <div className="mt-12 p-6 border-t dark:border-gray-700">
          <h3 className="text-lg font-medium mb-4 dark:text-white">
            Preview Components
          </h3>
          <div className="flex flex-wrap gap-4">
            <button className="px-6 py-2 bg-primary text-white rounded-custom shadow hover:opacity-90 transition-opacity">
              Primary Button
            </button>
            <button className="px-6 py-2 bg-secondary text-white rounded-custom shadow hover:opacity-90 transition-opacity">
              Secondary Button
            </button>
            <button className="px-6 py-2 bg-accent text-white rounded-custom shadow hover:opacity-90 transition-opacity">
              Accent Button
            </button>
          </div>
          <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-900 rounded-custom border border-gray-200 dark:border-gray-700">
            <p className="text-gray-600 dark:text-gray-400">
              This is a preview of how cards and containers will look with your
              current settings.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;

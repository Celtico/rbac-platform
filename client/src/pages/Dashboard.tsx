import React from "react";
import { useAuth } from "../context/AuthContext";
import { Disc, Users, ShieldCheck, Lock } from "lucide-react";

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8 dark:text-white transition-colors">
        Dashboard Overview
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-custom shadow flex items-center border-l-4 border-primary transition-colors">
          <Disc className="w-12 h-12 text-primary mr-4" />
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 uppercase font-bold">
              Total Albums
            </p>
            <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">
              Available
            </p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-custom shadow flex items-center border-l-4 border-secondary transition-colors">
          <Users className="w-12 h-12 text-secondary mr-4" />
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 uppercase font-bold">
              Your Roles
            </p>
            <p className="text-lg font-bold text-gray-800 dark:text-gray-100">
              {user?.roles.join(", ") || "None"}
            </p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-custom shadow flex items-center border-l-4 border-accent transition-colors">
          <ShieldCheck className="w-12 h-12 text-accent mr-4" />
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 uppercase font-bold">
              Permissions
            </p>
            <p className="text-lg font-bold text-gray-800 dark:text-gray-100">
              {user?.permissions.length || 0} active
            </p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-custom shadow flex items-center border-l-4 border-gray-400 dark:border-gray-500 transition-colors">
          <Lock className="w-12 h-12 text-gray-400 dark:text-gray-500 mr-4" />
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 uppercase font-bold">
              Security
            </p>
            <p className="text-lg font-bold text-gray-800 dark:text-gray-100">
              RBAC Enabled
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

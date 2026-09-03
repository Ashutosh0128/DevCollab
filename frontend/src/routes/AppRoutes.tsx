import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { LandingPage } from '../pages/LandingPage';
import { Login } from '../pages/Login';
import { Register } from '../pages/Register';
import { Dashboard } from '../pages/Dashboard';
import { Profile } from '../pages/Profile';
import { Projects } from '../pages/Projects';
import { ProjectDetails } from '../pages/ProjectDetails';
import { CreateProject } from '../pages/CreateProject';
import { EditProject } from '../pages/EditProject';
import { ProjectRequests } from '../pages/ProjectRequests';
import { Notifications } from '../pages/Notifications';
import { ProtectedRoute } from './ProtectedRoute';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Public Project Routes */}
      <Route path="/projects" element={<Projects />} />
      <Route path="/projects/:id" element={<ProjectDetails />} />

      {/* Protected Project & Account Routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/projects/new" element={<CreateProject />} />
        <Route path="/projects/:id/edit" element={<EditProject />} />
        <Route path="/projects/:id/requests" element={<ProjectRequests />} />
      </Route>
    </Routes>
  );
};

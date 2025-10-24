import { createBrowserRouter } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import UserList from "../features/users/UserList";
import UserAdd from "../features/users/UserAdd";
import StaffList from "../features/staffs/StaffList";
import StaffAdd from "../features/staffs/StaffAdd";
import Login from "../pages/Login";
import Uauthorized from "../pages/Unauthorized";
import Home from "../pages/Home";
import StaffEdit from "../features/staffs/StaffEdit";

const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      {path:"", element: <Home />},
      { 
        path: "user", children: [
          { path: "", element: <UserList/> },
          { path: "add", element: <UserAdd/> },
        ],
      },
      {
        path: "staff", children: [
          { path: "", element: <StaffList/>},
          { path: "add", element: <StaffAdd/>},
          { path: "edit/:id", element: <StaffEdit/>}
        ]
      },
    ],
  },
  { path: "/login", element: <Login />},
  { path: "/unauthorized", element: <Uauthorized/>}

]);

export default router;

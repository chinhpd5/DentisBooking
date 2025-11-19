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
import StaffDetail from "../features/staffs/StaffDetail";
import UserEdit from "../features/users/UserEdit";
import UserDetail from "../features/users/UserDetail";
import JobAdd from "../features/jobs/JobAdd";
import JobEdit from "../features/jobs/JobEdit";
import JobList from "../features/jobs/JobList";
import JobDetail from "../features/jobs/JobDetail";
import TrickList from "../features/tricks/TrickList";
import TrickAdd from "../features/tricks/TrickAdd";
import TrickEdit from "../features/tricks/TrickEdit";
import TrickDetail from "../features/tricks/TrickDetail";
import LocationList from "../features/locations/LocationList";
import LocationAdd from "../features/locations/LocationAdd";
import LocationEdit from "../features/locations/LocationEdit";
import LocationDetail from "../features/locations/LocationDetail";
import SeatList from "../features/seats/SeatList";
import SeatAdd from "../features/seats/SeatAdd";
import SeatEdit from "../features/seats/SeatEdit";
import SeatDetail from "../features/seats/SeatDetail";
import CustomerList from "../features/customers/CustomerList";
import CustomerAdd from "../features/customers/CustomerAdd";
import CustomerEdit from "../features/customers/CustomerEdit";
import CustomerDetail from "../features/customers/CustomerDetail";
import BookingAdd from "../features/bookings/BookingAdd";
import BookingList from "../features/bookings/BookingList";
import BookingEdit from "../features/bookings/BookingEdit";
import BookingDetail from "../features/bookings/BookingDetail";
import Dashboard from "../pages/Dashboard";

const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      {path:"", element: <Home />},
      { path: "dashboard", element: <Dashboard/>},
      { 
        path: "user", children: [
          { path: "", element: <UserList/> },
          { path: "add", element: <UserAdd/> },
          { path: "edit/:id", element: <UserEdit/> },
          { path: "detail/:id", element: <UserDetail/> },
        ],
      },
      {
        path: "staff", children: [
          { path: "", element: <StaffList/>},
          { path: "add", element: <StaffAdd/>},
          { path: "edit/:id", element: <StaffEdit/>},
          { path: "detail/:id", element: <StaffDetail/>}
        ]
      },
      {
        path: "job", children: [
          { path: "", element: <JobList/>},
          { path: "add", element: <JobAdd/>},
          { path: "edit/:id", element: <JobEdit/>},
          { path: "detail/:id", element: <JobDetail/>}
        ]
      },
      {
        path: "trick", children: [
          { path: "", element: <TrickList/>},
          { path: "add", element: <TrickAdd/>},
          { path: "edit/:id", element: <TrickEdit/>},
          { path: "detail/:id", element: <TrickDetail/>}
        ]
      },
      {
        path: "location", children: [
          { path: "", element: <LocationList/>},
          { path: "add", element: <LocationAdd/>},
          { path: "edit/:id", element: <LocationEdit/>},
          { path: "detail/:id", element: <LocationDetail/>}
        ]
      },
      {
        path: "seat", children: [
          { path: "", element: <SeatList/>},
          { path: "add", element: <SeatAdd/>},
          { path: "edit/:id", element: <SeatEdit/>},
          { path: "detail/:id", element: <SeatDetail/>}
        ]
      },
      {
        path: "customer", children: [
          { path: "", element: <CustomerList/>},
          { path: "add", element: <CustomerAdd/>},
          { path: "edit/:id", element: <CustomerEdit/>},
          { path: "detail/:id", element: <CustomerDetail/>}
        ]
      },
      {
        path: "booking", children: [
          { path: "", element: <BookingList/>},
          { path: "add", element: <BookingAdd/>},
          { path: "edit/:id", element: <BookingEdit/>},
          { path: "detail/:id", element: <BookingDetail/>}
        ]
      }
    ],
  },
  { path: "/login", element: <Login />},
  { path: "/unauthorized", element: <Uauthorized/>},

]);

export default router;

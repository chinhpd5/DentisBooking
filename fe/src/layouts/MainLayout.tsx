import {
  AreaChartOutlined,
  HomeOutlined,
  InsertRowBelowOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  PlusOutlined,
  PushpinOutlined,
  ScheduleOutlined,
  ScissorOutlined,
  TeamOutlined,
  UnorderedListOutlined,
  UserAddOutlined,
  UsergroupAddOutlined,
  UserOutlined,
  UserSwitchOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";
import { Button, Menu, Popconfirm } from "antd";
import logoImage from "../assets/logo.jpg";
import "../assets/layout.css";
import { Outlet } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { useMemo, useState, useEffect } from "react";
import toast from "react-hot-toast";

type MenuItem = Required<MenuProps>["items"][number];

const USER_ROLE = {
  ADMIN: "admin",
  RECEPTIONIST: "receptionist",
  STAFF: "staff",
  DOCTOR: "doctor",
}

const allMenuItems: MenuItem[] = [
  {
    key: "home",
    label: "Trang chủ",
    icon: <HomeOutlined />,
  },
  {
    key: "booking",
    label: "Quản lý đặt lịch",
    icon: <ScheduleOutlined />,
    children: [
      {key: "booking-list", label: "Danh sách Đặt lịch", icon: <UnorderedListOutlined />},
      {key: "booking-add", label: "Thêm mới Đặt lịch", icon: <PlusOutlined />}
    ]
  },
  {
    key: "staff",
    label: "Quản lý Bác sỹ/KTV",
    icon: <TeamOutlined />,
    children: [
      {key: "staff-list", label: "Danh sách Bác sỹ/KTV", icon: <UnorderedListOutlined />},
      {key: "staff-add", label: "Thêm mới Bác sỹ/KTV", icon: <PlusOutlined />}
    ]
  },
  {
    key: "trick",
    label: "Quản lý Thủ thuật",
    icon: <ScissorOutlined />,
    children: [
      {key: "trick-list", label: "Danh sách Thủ thuật", icon: <UnorderedListOutlined />},
      {key: "trick-add", label: "Thêm mới Thủ thuật", icon: <PlusOutlined />}
    ]
  },
  {
    key: "job",
    label: "Quản lý Công việc KTV",
    icon: <PushpinOutlined />,
    children: [
      {key: "job-list", label: "Danh sách Công việc KTV", icon: <UnorderedListOutlined />},
      {key: "job-add", label: "Thêm mới Công việc KTV", icon: <PlusOutlined />}
    ]
  },
  {
    key: "seat",
    label: "Quản lý Ghế",
    icon: <InsertRowBelowOutlined />,
    children: [
      {key: "seat-list", label: "Danh sách Ghế", icon: <UnorderedListOutlined />},
      {key: "seat-add", label: "Thêm mới Ghế", icon: <PlusOutlined />},
      {key: "location-list", label: "Quản lý tầng", icon: <UnorderedListOutlined />},
    ]
  },
  {
    key: "dashboard",
    label: "Báo cáo",
    icon: <AreaChartOutlined />,
  },
  {
    key: "user",
    label: "Quản lý Tài khoản",
    icon: <UsergroupAddOutlined />,
    children: [
      {key: "user-list", label: "Danh sách Tài khoản", icon: <UnorderedListOutlined />},
      {key: "user-add", label: "Thêm mới Tài khoản", icon: <PlusOutlined />}
    ]
  },
  {
    key: "Customer",
    label: "Quản lý Khách hàng",
    icon: <UserSwitchOutlined />,
    children: [
      {key: "customer-list", label: "Danh sách Khách hàng", icon: <UserOutlined />},
      {key: "customer-add", label: "Thêm mới Khách hàng", icon: <UserAddOutlined />}
    ]
  },
];

function MainLayout() {
  const naviagte = useNavigate();
  const [userRole, setUserRole] = useState<string>("");
  const [userName, setUserName] = useState<string>("Admin");
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);

  useEffect(() => {
    const role = localStorage.getItem("roleDentis") || "";
    const name = localStorage.getItem("nameDentis") || "admin";
    setUserRole(role);
    setUserName(name);
  }, []);

  const menuItems = useMemo(() => {
    if (userRole === USER_ROLE.ADMIN) {
      // Admin có tất cả quyền
      return allMenuItems;
    } else if (userRole === USER_ROLE.RECEPTIONIST) {
      // Receptionist: Trang chủ, Quản lý đặt lịch (full), xem bác sỹ/KTV, xem thủ thuật, xem công việc ktv, xem ghế, Quản lý khách hàng (full)
      const filteredItems: MenuItem[] = [];
      
      allMenuItems.forEach((item) => {
        if (item && typeof item === "object" && "key" in item) {
          if (item.key === "home" || item.key === "booking" || item.key === "Customer") {
            filteredItems.push(item);
          } else if (item.key === "staff" && "children" in item && item.children) {
            // Chỉ xem danh sách -> hiển thị trực tiếp không có menu con
            filteredItems.push({
              key: "staff-list",
              label: "Danh sách Bác sỹ/KTV",
              icon: <TeamOutlined />,
            });
          } else if (item.key === "trick" && "children" in item && item.children) {
            // Chỉ xem danh sách -> hiển thị trực tiếp không có menu con
            filteredItems.push({
              key: "trick-list",
              label: "Danh sách Thủ thuật",
              icon: <ScissorOutlined />,
            });
          } else if (item.key === "job" && "children" in item && item.children) {
            // Chỉ xem danh sách -> hiển thị trực tiếp không có menu con
            filteredItems.push({
              key: "job-list",
              label: "Danh sách Công việc KTV",
              icon: <PushpinOutlined />,
            });
          } else if (item.key === "seat" && "children" in item && item.children) {
            // Chỉ xem danh sách -> hiển thị trực tiếp không có menu con
            filteredItems.push({
              key: "seat-list",
              label: "Danh sách Ghế",
              icon: <InsertRowBelowOutlined />,
            });
          }
        }
      });
      
      return filteredItems;
    } else if (userRole === USER_ROLE.STAFF) {
      // Staff: Trang chủ, xem thủ thuật, xem công việc ktv, xem ghế
      const filteredItems: MenuItem[] = [];
      
      allMenuItems.forEach((item) => {
        if (item && typeof item === "object" && "key" in item) {
          if (item.key === "home") {
            filteredItems.push(item);
          } else if (item.key === "trick" && "children" in item && item.children) {
            // Chỉ xem danh sách -> hiển thị trực tiếp không có menu con
            filteredItems.push({
              key: "trick-list",
              label: "Danh sách Thủ thuật",
              icon: <ScissorOutlined />,
            });
          } else if (item.key === "job" && "children" in item && item.children) {
            // Chỉ xem danh sách -> hiển thị trực tiếp không có menu con
            filteredItems.push({
              key: "job-list",
              label: "Danh sách Công việc KTV",
              icon: <PushpinOutlined />,
            });
          } else if (item.key === "seat" && "children" in item && item.children) {
            // Chỉ xem danh sách -> hiển thị trực tiếp không có menu con
            filteredItems.push({
              key: "seat-list",
              label: "Danh sách Ghế",
              icon: <InsertRowBelowOutlined />,
            });
          }
        }
      });
      
      return filteredItems;
    }
    // Default: show all for backward compatibility
    return allMenuItems;
  }, [userRole]);

  const onClick: MenuProps["onClick"] = (e) => {
    if(e.key){
      switch(e.key){
        case 'user-list':
          naviagte('/user');
          break;
        case 'user-add':
          naviagte('/user/add');
          break;
        case 'staff-list':
          naviagte('/staff');
          break;
        case 'staff-add':
          naviagte('/staff/add');
          break;
        case 'job-list':
          naviagte('/job')
          break;
        case 'job-add':
          naviagte('/job/add')
          break;
        case 'trick-list':
          naviagte('/trick')
          break;
        case 'trick-add':
          naviagte('/trick/add')
          break;
        case 'location-list':
          naviagte('/location')
          break;
        case 'seat-list':
          naviagte('/seat')
          break;
        case 'seat-add':
          naviagte('/seat/add')
          break;
        case 'customer-list':
          naviagte('/customer')
          break;
        case 'customer-add':
          naviagte('/customer/add')
          break;
        case 'booking-list':
          naviagte('/booking')
          break;
        case 'booking-add':
          naviagte('/booking/add')
          break;
        case 'home':
          naviagte('/')
          break;
        case 'dashboard':
          naviagte('/dashboard')
          break;
    }
    }else{
      naviagte('not-found')
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('tokenDentis');
    localStorage.removeItem('nameDentis');
    localStorage.removeItem('roleDentis');
    naviagte('/login');
    toast.success('Đăng xuất thành công');
  }

  return (
    <div className="wrapper">
      {/* Overlay để đóng menu khi click bên ngoài trên tablet */}
      {sidebarCollapsed && (
        <div 
          className="sidebar-overlay"
          onClick={() => setSidebarCollapsed(false)}
        />
      )}

      <aside className={`sidebar ${sidebarCollapsed ? 'sidebar-open' : ''}`}>
        <div className="branding">
          <img src={logoImage} alt="logo" className="logo" />
          <h3 className="title">Đặt lịch Xiêm Anh</h3>
        </div>
        <Menu
          onClick={(e) => {
            onClick(e);
            // Đóng menu sau khi chọn trên tablet
            if (window.innerWidth <= 1024) {
              setSidebarCollapsed(false);
            }
          }}
          style={{ width: 250 }}
          defaultSelectedKeys={["1"]}
          defaultOpenKeys={["sub1"]}
          mode="inline"
          theme="dark"
          items={menuItems}
        />
      </aside>

      <div className="main">
        <header className="header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Button
              type="text"
              icon={sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="menu-toggle-btn"
              style={{
                fontSize: '18px',
                width: 40,
                height: 40,
              }}
            />
            <h3 style={{ margin: 0 }}>Xin chào, {userName}</h3>
          </div>

          <Popconfirm
            placement="bottom"
            title="Đăng xuất"
            description="Bạn có chắc chắn muốn đăng xuất"
            onConfirm={handleLogout}
            okText="Có"
            cancelText="Không"
          >
            <Button size="small">Đăng xuất</Button>
          </Popconfirm>
         
        </header>

        <main className="content">
          <Outlet />
        </main>
      </div>
     
    </div>
  );
}

export default MainLayout;

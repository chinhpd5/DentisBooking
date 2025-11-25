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
import { useMemo, useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";
import socketService from "../services/socket";
import notificationSound from "../assets/notification.mp3";
import { SEAT_STATUS } from "../contants";

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
  const queryClient = useQueryClient();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const role = localStorage.getItem("roleDentis") || "";
    const name = localStorage.getItem("nameDentis") || "admin";
    setUserRole(role);
    setUserName(name);
  }, []);

  // Khởi tạo audio element
  useEffect(() => {
    audioRef.current = new Audio(notificationSound);
    audioRef.current.volume = 0.5; // Điều chỉnh âm lượng (0.0 - 1.0)
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Kết nối socket và lắng nghe events cho seat status changes
  useEffect(() => {
    const socket = socketService.connect();

    const handleSeatStatusChanged = (data: {
      seatId: string;
      seatName: string;
      oldStatus: number;
      newStatus: number;
      location: string;
      timestamp: string;
    }) => {
      // Chỉ thông báo khi thay đổi giữa AVAILABLE và USING
      if (
        (data.oldStatus === SEAT_STATUS.AVAILABLE && data.newStatus === SEAT_STATUS.USING) ||
        (data.oldStatus === SEAT_STATUS.USING && data.newStatus === SEAT_STATUS.AVAILABLE)
      ) {
        // Phát âm thanh thông báo
        if (audioRef.current) {
          audioRef.current.play().catch((error) => {
            console.error('Error playing notification sound:', error);
          });
        }

        // Hiển thị toast thông báo
        const statusText = data.newStatus === SEAT_STATUS.AVAILABLE 
          ? 'Sẵn sàng' 
          : 'Đang sử dụng';
        
        toast.success(
          `Ghế "${data.seatName}" (${data.location}) đã chuyển sang trạng thái: ${statusText}`,
          {
            duration: 4000,
            position: 'top-right',
          }
        );

        // Cập nhật cache để refresh danh sách
        queryClient.invalidateQueries({ queryKey: ["seats"] });
      }
    };

    socket.on('seatStatusChanged', handleSeatStatusChanged);

    return () => {
      socket.off('seatStatusChanged', handleSeatStatusChanged);
    };
  }, [queryClient]);

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

      <aside style={{backgroundColor: '#012445'}} className={`sidebar ${sidebarCollapsed ? 'sidebar-open' : ''}`}>
        <div className="branding">
          <img src={logoImage} alt="logo" className="logo" />
          <h3 className="title">Xiêm Anh Smile</h3>
        </div>
        <Menu
          onClick={(e) => {
            onClick(e);
            // Đóng menu sau khi chọn trên tablet
            if (window.innerWidth <= 1024) {
              setSidebarCollapsed(false);
            }
          }}
          style={{ width: 250, backgroundColor: '#012445' }}
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
